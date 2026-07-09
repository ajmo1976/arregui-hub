import React from 'react';
import {
    X,
    Calendar,
    MapPin,
    Users,
    ClipboardList,
    DollarSign,
    Clock,
    LayoutGrid,
    CheckCircle2,
    UtensilsCrossed,
    Info,
    Printer,
    Edit3,
    Hash,
    Briefcase,
    Building2,
    FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../hooks/useAuth';
import { useCurrency } from '../../contexts/CurrencyContext';

// Helper functions for timezone-neutral date manipulation
const getNeutralDateString = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
};

const formatNeutralDate = (dateStr: string) => {
    const neutralStr = getNeutralDateString(dateStr);
    if (!neutralStr) return '';
    const parts = neutralStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = months[monthIndex] || month;
    return `${day} ${monthName} ${year}`;
};

const getNeutralMonthShort = (dateStr: string) => {
    const neutralStr = getNeutralDateString(dateStr);
    if (!neutralStr) return '';
    const parts = neutralStr.split('-');
    if (parts.length !== 3) return '';
    const month = parts[1];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthIndex = parseInt(month, 10) - 1;
    return months[monthIndex] || '';
};

const getNeutralDay = (dateStr: string) => {
    const neutralStr = getNeutralDateString(dateStr);
    if (!neutralStr) return '';
    const parts = neutralStr.split('-');
    if (parts.length !== 3) return '';
    return parts[2];
};

interface Props {
    event: any;
    onClose: () => void;
    onEdit?: (event: any) => void;
}

export default function ServiceDetailView({ event, onClose, onEdit }: Props) {
    const { user } = useAuthStore();
    const { formatPrice, canShowPrices } = useCurrency();
    const isBasicUser = user?.role_name?.toLowerCase() === 'básico' || user?.role_name?.toLowerCase() === 'basico';
    if (!event) return null;

    const [activeDetailIndex, setActiveDetailIndex] = React.useState(0);

    const isOwner = user?.is_superuser || Number(event.created_by?.id || event.created_by) === Number(user?.id) || event.responsible === user?.full_name;

    const totalAmount = event.details?.reduce((acc: number, d: any) => acc + d.estimated_amount, 0) || 0;
    const totalAttendees = event.details?.reduce((acc: number, d: any) => acc + d.attendees, 0) || 0;

    const handlePrint = (detail: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateStr = formatNeutralDate(detail.service_date);
        const nowStr = new Date().toLocaleString('es-ES');

        const itemsHtml = detail.selected_items && detail.selected_items.length > 0
            ? detail.selected_items.map((item: any) => `<li>• ${item.name} [x${item.quantity || 1} ${item.unit || 'Ud'}]</li>`).join('')
            : '<p style="font-style: italic; color: #666;">No hay items estructurados registrados</p>';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Comanda - ${event.title}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
                        body { 
                            font-family: 'Courier Prime', monospace; 
                            line-height: 1.4; 
                            padding: 20px; 
                            max-width: 400px; 
                            margin: 0 auto;
                            color: #000;
                        }
                        .header { text-align: center; margin-bottom: 20px; }
                        .title { font-size: 22px; font-weight: bold; text-transform: uppercase; border-bottom: 2px dashed #000; padding-bottom: 10px; display: block; }
                        .section { margin-top: 15px; }
                        .label { font-weight: bold; text-transform: uppercase; }
                        .content { margin-bottom: 10px; }
                        .divider { border-top: 1px dashed #000; margin: 15px 0; }
                        .items-list { list-style: none; padding: 0; margin: 0; }
                        .items-list li { margin-bottom: 5px; font-size: 14px; text-transform: uppercase; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
                        @media print {
                            body { padding: 0; width: 100%; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <span class="title">COMANDA DE COCINA</span>
                    </div>
                    
                    <div class="section">
                        <div class="content"><span class="label">Evento:</span> ${event.title}</div>
                        <div class="content"><span class="label">Empresa:</span> ${event.company || 'N/A'}</div>
                        <div class="content"><span class="label">C. Costo:</span> ${event.cost_center || 'N/A'}</div>
                        <div class="content"><span class="label">Fecha:</span> ${dateStr}</div>
                        <div class="content"><span class="label">Hora:</span> ${detail.service_time}</div>
                        <div class="content"><span class="label">Ubicación:</span> ${detail.location}</div>
                        <div class="content"><span class="label">PAX:</span> ${detail.attendees}</div>
                        <div class="content"><span class="label">Responsable:</span> ${event.responsible}</div>
                        <div class="content"><span class="label">Gestor:</span> ${event.gestor || 'ArreguiHub'}</div>
                    </div>

                    <div class="divider"></div>

                    <div class="section">
                        <span class="label">LOGÍSTICA / REQUERIMIENTOS</span>
                        <div class="content" style="margin-top: 5px; font-size: 14px;">
                            ${detail.additional_requirements || 'Sin requerimientos específicos.'}
                        </div>
                    </div>

                    <div class="section">
                        <span class="label">OBSERVACIONES</span>
                        <div class="content" style="margin-top: 5px; font-size: 14px; font-style: italic;">
                            ${detail.observations || 'Sin observaciones adicionales.'}
                        </div>
                    </div>

                    <div class="section">
                        <span class="label">SERVICIOS / PLATOS</span>
                        <ul class="items-list" style="margin-top: 5px;">
                            ${itemsHtml}
                        </ul>
                    </div>

                    <div class="divider"></div>

                    <div class="footer">
                        Generado el ${nowStr}
                    </div>

                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintAll = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const nowStr = new Date().toLocaleString('es-ES');
        let fullHtml = `
            <html>
                <head>
                    <title>Todas las Comandas - ${event.title}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
                        body { font-family: 'Courier Prime', monospace; line-height: 1.4; padding: 20px; max-width: 400px; margin: 0 auto; color: #000; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .title { font-size: 22px; font-weight: bold; text-transform: uppercase; border-bottom: 2px dashed #000; padding-bottom: 10px; display: block; }
                        .section { margin-top: 15px; }
                        .label { font-weight: bold; text-transform: uppercase; }
                        .content { margin-bottom: 10px; }
                        .divider { border-top: 1px dashed #000; margin: 15px 0; }
                        .items-list { list-style: none; padding: 0; margin: 0; }
                        .items-list li { margin-bottom: 5px; font-size: 14px; text-transform: uppercase; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
                        .page-container { 
                            page-break-after: always; 
                            border-bottom: 2px solid #000; 
                            margin-bottom: 40px; 
                            padding-bottom: 20px;
                        }
                        @media print {
                            body { padding: 0; width: 100%; }
                            .page-container { border-bottom: none; margin-bottom: 0; }
                        }
                    </style>
                </head>
                <body>
        `;

        event.details.forEach((detail: any, index: number) => {
            const dateStr = formatNeutralDate(detail.service_date);
            const itemsHtml = detail.selected_items && detail.selected_items.length > 0
                ? detail.selected_items.map((item: any) => `<li>• ${item.name} [x${item.quantity || 1} ${item.unit || 'Ud'}]</li>`).join('')
                : '<p style="font-style: italic; color: #666;">No hay items seleccionados</p>';

            fullHtml += `
                <div class="page-container">
                    <div class="header">
                        <span class="title">COMANDA DE COCINA</span>
                    </div>
                    <div class="section">
                        <div class="content"><span class="label">Evento:</span> ${event.title}</div>
                        <div class="content"><span class="label">Empresa:</span> ${event.company || 'N/A'}</div>
                        <div class="content"><span class="label">C. Costo:</span> ${event.cost_center || 'N/A'}</div>
                        <div class="content"><span class="label">Servicio:</span> ${index + 1} de ${event.details.length}</div>
                        <div class="content"><span class="label">Fecha:</span> ${dateStr}</div>
                        <div class="content"><span class="label">Hora:</span> ${detail.service_time}</div>
                        <div class="content"><span class="label">Lugar:</span> ${detail.location}</div>
                        <div class="content"><span class="label">PAX:</span> ${detail.attendees}</div>
                        <div class="content"><span class="label">Resp:</span> ${event.responsible}</div>
                        <div class="content"><span class="label">Gestor:</span> ${event.gestor || 'ArreguiHub'}</div>
                    </div>
                    <div class="divider"></div>
                    <div class="section">
                        <span class="label">LOGÍSTICA / REQUERIMIENTOS</span>
                        <div class="content" style="font-size: 14px;">${detail.additional_requirements || 'Sin requerimientos específicos.'}</div>
                    </div>
                    <div class="section">
                        <span class="label">OBSERVACIONES</span>
                        <div class="content" style="font-size: 14px; font-style: italic;">${detail.observations || 'Sin observaciones.'}</div>
                    </div>
                    <div class="section">
                        <span class="label">MENÚ</span>
                        <ul class="items-list">${itemsHtml}</ul>
                    </div>
                    <div class="footer">Generado el ${nowStr}</div>
                </div>
            `;
        });

        fullHtml += `
                    <script>
                        window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(fullHtml);
        printWindow.document.close();
    };

    const handlePrintInvoicingReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const nowStr = new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const requestDateStr = event.request_date 
            ? new Date(event.request_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'N/A';

        const statusDateStr = event.status_date 
            ? new Date(event.status_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : requestDateStr;

        let detailsHtml = '';
        let grandTotal = 0;

        const details = event.details || [];
        details.forEach((d: any, idx: number) => {
            const dateStr = formatNeutralDate(d.service_date);
            const timeStr = d.service_time || '';
            const detailId = details.length > 1 ? `#${event.id}.${idx + 1}` : `#${event.id}`;
            const detailTotal = d.estimated_amount || 0;
            grandTotal += detailTotal;

            const itemsRows = d.selected_items && d.selected_items.length > 0
                ? d.selected_items.map((item: any) => {
                    const qty = item.quantity || 1;
                    const price = item.price || 0;
                    const unit = item.unit || 'Unidad';
                    const mult = (unit === 'Caja' && item.is_sold_by_case) ? (item.units_per_case || 1) : 1;
                    const sub = qty * price * mult;
                    return `
                        <tr>
                            <td>${item.name}</td>
                            <td class="text-center">${qty}</td>
                            <td class="text-center">${unit}</td>
                            <td class="text-right">${formatPrice(price)}</td>
                            <td class="text-right font-bold">${formatPrice(sub)}</td>
                        </tr>
                    `;
                }).join('')
                : `
                    <tr>
                        <td colspan="5" class="text-center italic no-items">Sin platos/snack registrados en este servicio</td>
                    </tr>
                `;

            detailsHtml += `
                <div class="detail-section">
                    <div class="detail-header">
                        <h2>${details.length > 1 ? `Servicio ${idx + 1} de ${details.length} (Reg. ${detailId})` : 'Detalle del Servicio'}</h2>
                    </div>
                    ${details.length > 1 ? `
                    <div class="detail-meta-clean">
                        <span><strong>Fecha:</strong> ${dateStr}</span>
                        <span><strong>Hora:</strong> ${timeStr}</span>
                        <span><strong>Ubicación:</strong> ${d.location || 'N/A'}</span>
                        <span><strong>PAX:</strong> ${d.attendees || 0} personas</span>
                    </div>
                    ` : `
                    <table class="detail-meta-table">
                        <tr>
                            <td style="width: 25%;"><span class="meta-label">Fecha</span><span class="meta-value">${dateStr}</span></td>
                            <td style="width: 25%;"><span class="meta-label">Hora</span><span class="meta-value">${timeStr}</span></td>
                            <td style="width: 25%;"><span class="meta-label">Sala/Ubicación</span><span class="meta-value">${d.location || 'N/A'}</span></td>
                            <td style="width: 25%;"><span class="meta-label">PAX</span><span class="meta-value">${d.attendees || 0} personas</span></td>
                        </tr>
                    </table>
                    `}
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción del Ítem</th>
                                <th class="text-center" style="width: 10%;">Cant.</th>
                                <th class="text-center" style="width: 12%;">Unidad</th>
                                <th class="text-right" style="width: 15%;">P. Unitario</th>
                                <th class="text-right" style="width: 18%;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsRows}
                            <tr class="detail-total-row">
                                <td colspan="4" class="text-right" style="font-weight: 900; font-size: 14px; padding-top: 10px;">Subtotal Servicio:</td>
                                <td class="text-right" style="font-weight: 900; font-size: 14px; padding-top: 10px;">${formatPrice(detailTotal)}</td>
                            </tr>
                            ${true ? `
                            <tr>
                                <td colspan="4" class="text-right" style="font-weight: 900; font-size: 14px;">IVA (${event.iva_percentage ?? 0}%):</td>
                                <td class="text-right" style="font-weight: 900; font-size: 14px;">${formatPrice(detailTotal * ((event.iva_percentage ?? 0) / 100))}</td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>

                    ${d.additional_requirements ? `
                    <div class="requirements-box">
                        <strong>Requerimientos Especiales / Logística:</strong>
                        <p>${d.additional_requirements}</p>
                    </div>` : ''}
                    
                    ${d.observations ? `
                    <div class="observations-box">
                        <strong>Observaciones:</strong>
                        <p>${d.observations}</p>
                    </div>` : ''}
                </div>
            `;
        });

        printWindow.document.write(`
            <html>
                <head>
                    <title>Reporte de Facturación - Servicio #${event.id}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;850;900&display=swap');
                        @page {
                            size: portrait;
                            margin: 15mm;
                        }
                        body {
                            font-family: 'Inter', sans-serif;
                            color: #1f2937;
                            line-height: 1.4;
                            padding: 0;
                            margin: 0;
                            font-size: 11px;
                            background-color: #fff;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            border-bottom: 2px solid #10b981;
                            padding-bottom: 6px;
                            margin-bottom: 12px;
                        }
                        .company-info h1 {
                            font-size: 16px;
                            font-weight: 900;
                            margin: 0;
                            color: #10b981;
                            text-transform: uppercase;
                            letter-spacing: -0.02em;
                        }
                        .company-info p {
                            margin: 0;
                            font-size: 8.5px;
                            color: #6b7280;
                            font-weight: 500;
                        }
                        .invoice-title {
                            text-align: right;
                        }
                        .invoice-title h2 {
                            font-size: 14px;
                            font-weight: 900;
                            margin: 0;
                            color: #111827;
                            text-transform: uppercase;
                        }
                        .invoice-title p {
                            margin: 0;
                            font-size: 9.5px;
                            color: #374151;
                            font-weight: 700;
                        }
                        .metadata-table {
                            width: 100%;
                            border-collapse: separate;
                            border-spacing: 0;
                            background-color: #f9fafb;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            margin-bottom: 12px;
                            overflow: hidden;
                        }
                        .metadata-col {
                            vertical-align: top;
                            padding: 8px 12px;
                        }
                        .metadata-group-title {
                            font-size: 9px;
                            font-weight: 900;
                            color: #10b981;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            margin-bottom: 6px;
                            border-bottom: 1px solid #f3f4f6;
                            padding-bottom: 3px;
                        }
                        .metadata-item {
                            margin-bottom: 6px;
                        }
                        .metadata-item:last-child {
                            margin-bottom: 0;
                        }
                        .metadata-label {
                            display: block;
                            font-size: 7.5px;
                            font-weight: 800;
                            text-transform: uppercase;
                            color: #9ca3af;
                            letter-spacing: 0.05em;
                            margin-bottom: 1px;
                        }
                        .metadata-value {
                            display: block;
                            font-size: 10.5px;
                            font-weight: 700;
                            color: #1f2937;
                        }
                        .detail-section {
                            margin-bottom: 30px;
                            page-break-inside: avoid;
                        }
                        .detail-header {
                            border-bottom: 1px solid #e5e7eb;
                            padding-bottom: 6px;
                            margin-bottom: 10px;
                        }
                        .detail-header h2 {
                            font-size: 13px;
                            font-weight: 850;
                            margin: 0;
                            color: #1f2937;
                            text-transform: uppercase;
                        }
                        .detail-meta-table {
                            width: 100%;
                            border-collapse: separate;
                            border-spacing: 0;
                            background-color: #f3f4f6;
                            border-radius: 8px;
                            margin-bottom: 12px;
                        }
                        .detail-meta-table td {
                            padding: 8px 12px;
                            border: none;
                            vertical-align: middle;
                        }
                        .detail-meta-table td:not(:last-child) {
                            border-right: 1px solid #e5e7eb;
                        }
                        .detail-meta-table .meta-label {
                            display: block;
                            font-size: 8px;
                            font-weight: 800;
                            text-transform: uppercase;
                            color: #6b7280;
                            letter-spacing: 0.05em;
                            margin-bottom: 2px;
                        }
                        .detail-meta-table .meta-value {
                            display: block;
                            font-size: 11px;
                            font-weight: 700;
                            color: #1f2937;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 10px;
                        }
                        th {
                            background-color: #f9fafb;
                            color: #4b5563;
                            font-weight: 800;
                            text-transform: uppercase;
                            font-size: 9px;
                            letter-spacing: 0.05em;
                            border-bottom: 1.5px solid #e5e7eb;
                            padding: 6px 8px;
                            text-align: left;
                        }
                        td {
                            border-bottom: 1px solid #e5e7eb;
                            padding: 6px 8px;
                            font-size: 11px;
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: 700; }
                        .no-items {
                            color: #9ca3af;
                        }
                        .detail-total-row {
                            background-color: #f9fafb;
                        }
                        .detail-total-row td {
                            border-top: 1.5px solid #e5e7eb;
                            border-bottom: none;
                            padding: 8px;
                            font-size: 11px;
                        }
                        .requirements-box, .observations-box {
                            background-color: #fafafa;
                            border-left: 3px solid #d1d5db;
                            padding: 6px 12px;
                            margin-top: 8px;
                            border-radius: 0 6px 6px 0;
                            font-size: 10px;
                        }
                        .requirements-box strong, .observations-box strong {
                            display: block;
                            color: #4b5563;
                            margin-bottom: 2px;
                        }
                        .requirements-box p, .observations-box p {
                            margin: 0;
                            color: #6b7280;
                        }
                        .grand-total-box {
                            margin-top: 30px;
                            background-color: #f0fdf4;
                            border: 2px solid #10b981;
                            border-radius: 12px;
                            padding: 15px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            page-break-inside: avoid;
                        }
                        .grand-total-label {
                            font-size: 13px;
                            font-weight: 900;
                            color: #065f46;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                        .grand-total-value {
                            font-size: 22px;
                            font-weight: 900;
                            color: #047857;
                            border-bottom: 3px double #10b981;
                        }
                        .footer {
                            margin-top: 40px;
                            border-top: 1px solid #e5e7eb;
                            padding-top: 12px;
                            text-align: center;
                            font-size: 9px;
                            color: #9ca3af;
                            font-weight: 500;
                        }
                        @media print {
                            .no-print { display: none; }
                        }
                        .no-print-btn {
                            background-color: #10b981;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            font-size: 11px;
                            font-weight: bold;
                            border-radius: 6px;
                            cursor: pointer;
                            margin-left: 10px;
                            transition: background-color 0.2s;
                        }
                        .no-print-btn:hover {
                            background-color: #059669;
                        }

                        /* Barra de metadatos horizontal y compacta */
                        .detail-meta-clean {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 8px 15px;
                            background-color: #f3f4f6;
                            border-radius: 6px;
                            padding: 6px 12px;
                            margin-bottom: 8px;
                            font-size: 10px;
                        }
                        .detail-meta-clean span {
                            color: #4b5563;
                        }
                        .detail-meta-clean strong {
                            color: #1f2937;
                            font-weight: 600;
                        }

                        /* Reglas compactas cuando hay múltiples servicios */
                        .multiple-services-print .detail-section {
                            margin-bottom: 12px;
                        }
                        .multiple-services-print .detail-header {
                            margin-bottom: 6px;
                            padding-bottom: 4px;
                        }
                        .multiple-services-print .detail-header h2 {
                            font-size: 11px;
                        }
                        .multiple-services-print table {
                            margin-bottom: 6px;
                        }
                        .multiple-services-print th {
                            padding: 4px 6px;
                            font-size: 8px;
                        }
                        .multiple-services-print td {
                            padding: 4px 6px;
                            font-size: 9.5px;
                        }
                        .multiple-services-print .detail-total-row td {
                            padding: 4px 6px;
                        }
                        .multiple-services-print .requirements-box, 
                        .multiple-services-print .observations-box {
                            margin-top: 4px;
                            padding: 4px 8px;
                            font-size: 9px;
                        }
                    </style>
                </head>
                <body class="${details.length > 1 ? 'multiple-services-print' : ''}">
                    <div class="header">
                        <div class="company-info">
                            <h1>Arregui Catering</h1>
                            <p>Servicios de Alimentación y Eventos Premium</p>
                        </div>
                        <div class="invoice-title">
                            <h2>Reporte de Facturación</h2>
                            <p>Servicio Nº #${event.id}${event.invoice_number ? ` | Factura: ${event.invoice_number}` : ''}</p>
                        </div>
                    </div>

                    <table class="metadata-table">
                        <tr>
                            <td class="metadata-col" style="width: 50%; border-right: 1px solid #e5e7eb;">
                                <div class="metadata-group-title">Datos del Servicio</div>
                                <div class="metadata-item">
                                    <span class="metadata-label">Título del Servicio</span>
                                    <span class="metadata-value">${event.title}</span>
                                </div>
                                <div class="metadata-item">
                                    <span class="metadata-label">Responsable</span>
                                    <span class="metadata-value">${event.responsible}</span>
                                </div>
                                <div class="metadata-item">
                                    <span class="metadata-label">Gestor / Solicitante</span>
                                    <span class="metadata-value">${event.gestor || 'ArreguiHub'}</span>
                                </div>
                            </td>
                            <td class="metadata-col" style="width: 50%;">
                                <div class="metadata-group-title">Información de Facturación</div>
                                <div class="metadata-item">
                                    <span class="metadata-label">Empresa / Cliente</span>
                                    <span class="metadata-value">${event.company || 'NO ESPECIFICADA'}</span>
                                </div>
                                <div class="metadata-item">
                                    <span class="metadata-label">Centro de Costo</span>
                                    <span class="metadata-value">${event.cost_center || 'NO ESPECIFICADO'}</span>
                                </div>
                                <div class="metadata-item">
                                    <span class="metadata-label">Fecha de Solicitud</span>
                                    <span class="metadata-value">${requestDateStr}</span>
                                </div>
                                ${(event.status === 'Facturado' || event.status === 'Cobrado') ? `
                                <div class="metadata-item">
                                    <span class="metadata-label">${event.status === 'Facturado' ? 'Fecha de Facturación' : 'Fecha de Cobro'}</span>
                                    <span class="metadata-value">${statusDateStr}</span>
                                </div>
                                ` : ''}
                                ${event.invoice_number ? `
                                <div class="metadata-item">
                                    <span class="metadata-label">Nº de Factura</span>
                                    <span class="metadata-value" style="font-weight: bold; color: #6d28d9;">${event.invoice_number}</span>
                                </div>` : ''}
                            </td>
                        </tr>
                    </table>

                    ${detailsHtml}

                    <div class="grand-total-box">
                        <span class="grand-total-label">${event.status === 'Facturado' ? 'Total Facturado' : (event.status === 'Cobrado' ? 'Total Cobrado' : 'Total a Facturar')} Servicio #${event.id}:</span>
                        <span class="grand-total-value">${formatPrice(event.total_amount || grandTotal)}</span>
                    </div>

                    <div class="footer">
                        Generado por ArreguiHub el ${nowStr}
                        <button class="no-print no-print-btn" onclick="window.print()">Imprimir Reporte</button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleExportToExcel = () => {
        if (!event) return;

        const requestDateStr = event.request_date
            ? new Date(event.request_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'N/A';

        const statusDateStr = event.status_date
            ? new Date(event.status_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : requestDateStr;

        // Header metadata
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'sep=;\r\n';
        csvContent += `REPORTE DE FACTURACIÓN - SERVICIO #${event.id}\r\n\r\n`;
        csvContent += `Título del Servicio;${event.title || ''}\r\n`;
        csvContent += `Responsable;${event.responsible || ''}\r\n`;
        csvContent += `Gestor / Solicitante;${event.gestor || 'ArreguiHub'}\r\n`;
        csvContent += `Empresa / Cliente;${event.company || 'NO ESPECIFICADA'}\r\n`;
        csvContent += `Centro de Costo;${event.cost_center || 'NO ESPECIFICADO'}\r\n`;
        csvContent += `Fecha de Solicitud;${requestDateStr}\r\n`;
        csvContent += `Estado;${event.status || ''}\r\n`;
        if (event.status === 'Facturado' || event.status === 'Cobrado') {
            csvContent += `${event.status === 'Facturado' ? 'Fecha de Facturación' : 'Fecha de Cobro'};${statusDateStr}\r\n`;
        }
        if (event.invoice_number) {
            csvContent += `Nº de Factura;${event.invoice_number}\r\n`;
        }
        csvContent += '\r\n';

        // Items headers
        csvContent += 'Nº Sub-Servicio;Fecha;Hora;Sala/Ubicación;PAX;Descripción Ítem;Cant.;Unidad;P. Unitario;Subtotal;Requerimientos;Observaciones\r\n';

        let grandTotal = 0;
        const details = event.details || [];
        details.forEach((d: any, idx: number) => {
            const dateStr = formatNeutralDate(d.service_date);
            const timeStr = d.service_time || '';
            const location = d.location || 'N/A';
            const attendees = d.attendees || 0;
            const subtotal = d.estimated_amount || 0;
            grandTotal += subtotal;

            const items = d.selected_items && d.selected_items.length > 0 ? d.selected_items : [];
            if (items.length === 0) {
                csvContent += `Servicio ${idx + 1};${dateStr};${timeStr};${location};${attendees};Sin platos/snack registrados;0;Unidad;0;0;${(d.additional_requirements || '').replace(/"/g, '""').replace(/;/g, ',')};${(d.observations || '').replace(/"/g, '""').replace(/;/g, ',')}\r\n`;
            } else {
                items.forEach((item: any) => {
                    const qty = item.quantity || 1;
                    const price = item.price || 0;
                    const unit = item.unit || 'Unidad';
                    const mult = (unit === 'Caja' && item.is_sold_by_case) ? (item.units_per_case || 1) : 1;
                    const sub = qty * price * mult;
                    
                    // Escape semicolons and quotes in strings
                    const itemName = (item.name || '').replace(/"/g, '""').replace(/;/g, ',');
                    const reqs = (d.additional_requirements || '').replace(/"/g, '""').replace(/;/g, ',').replace(/\r?\n/g, ' ');
                    const obs = (d.observations || '').replace(/"/g, '""').replace(/;/g, ',').replace(/\r?\n/g, ' ');

                    csvContent += `Servicio ${idx + 1};${dateStr};${timeStr};${location};${attendees};"${itemName}";${qty};${unit};${price};${sub};"${reqs}";"${obs}"\r\n`;
                });
            }
        });

        const ivaPercentage = event.iva_percentage || 0;
        const ivaAmount = grandTotal * (ivaPercentage / 100);
        const totalFacturar = event.total_amount || grandTotal;

        if (ivaPercentage > 0) {
            csvContent += `\r\n;;;;;;;;Subtotal Servicio;${grandTotal};;\r\n`;
            csvContent += `;;;;;;;;IVA (${ivaPercentage}%);${ivaAmount};;\r\n`;
            csvContent += `;;;;;;;;Total General;${totalFacturar};;\r\n`;
        } else {
            csvContent += `\r\n;;;;;;;;Total General;${grandTotal};;\r\n`;
        }

        // Download trigger
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Reporte_Facturacion_Servicio_${event.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full h-[calc(100vh-73px)] bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col font-inter"
        >
                {/* Header */}
                <div className="p-8 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between relative overflow-hidden flex-shrink-0">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <UtensilsCrossed size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{event.title}</h2>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                    event.status === 'Abierto'
                                        ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                                        : event.status === 'Reprogramado'
                                            ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'
                                            : event.status === 'Facturado'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                : event.status === 'Cobrado'
                                                    ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800'
                                                    : event.status === 'Cancelado'
                                                        ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800'
                                                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                                    }`}>
                                    {event.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                        <Users size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Responsable</span>
                                        <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 leading-none">{event.responsible}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-8 bg-gray-100 dark:bg-gray-700" />
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                                        <Briefcase size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Gestor</span>
                                        <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 leading-none">{event.gestor || 'Sistema'}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-8 bg-gray-100 dark:bg-gray-700" />
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                                        <Hash size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Centro Costo</span>
                                        <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 leading-none">{event.cost_center || 'NO ESPECIFICADO'}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-8 bg-gray-100 dark:bg-gray-700" />
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                                        <Building2 size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Empresa</span>
                                        <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 leading-none">{event.company || 'NO ESPECIFICADA'}</span>
                                    </div>
                                </div>
                                {event.invoice_number && (
                                    <>
                                        <div className="hidden sm:block w-px h-8 bg-gray-100 dark:bg-gray-700" />
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                                                <Hash size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Nº Factura</span>
                                                <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 leading-none">{event.invoice_number}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
                        {isOwner && onEdit && (
                            <button
                                onClick={() => onEdit(event)}
                                className="group flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 hover:border-primary/30 text-gray-600 dark:text-gray-300 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
                            >
                                <Edit3 size={18} className="text-primary/60 group-hover:text-primary transition-colors" />
                                <span className="text-sm">Editar</span>
                            </button>
                        )}
                        {!isBasicUser && event.details?.length > 1 && (
                            <button
                                onClick={handlePrintAll}
                                className="group flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-2xl font-black transition-all active:scale-95 shadow-sm"
                                title="Imprimir Todas las Comandas"
                            >
                                <Printer size={18} strokeWidth={2.5} />
                                <span className="text-xs uppercase tracking-tighter">x{event.details.length}</span>
                            </button>
                        )}
                        {!isBasicUser && canShowPrices && (
                            <>
                                <button
                                    onClick={handlePrintInvoicingReport}
                                    className="group flex items-center gap-2 px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
                                    title="Imprimir Reporte de Facturación"
                                >
                                    <Printer size={18} className="text-emerald-500" />
                                    <span className="text-sm">Imprimir Facturación</span>
                                </button>
                                <button
                                    onClick={handleExportToExcel}
                                    className="group flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
                                    title="Exportar Reporte a Excel"
                                >
                                    <FileSpreadsheet size={18} />
                                    <span className="text-sm">Exportar Excel</span>
                                </button>
                            </>
                        )}
                        <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 mx-1" />
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all active:scale-95"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {/* Summary Cards */}
                    <div className="px-8 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
                        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 transition-all hover:border-primary/20">
                            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 flex-shrink-0">
                                <Users size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Total Personas</span>
                                <span className="text-base font-black text-gray-900 dark:text-white leading-none">{totalAttendees}</span>
                            </div>
                        </div>

                        {canShowPrices ? (
                            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 transition-all hover:border-primary/20">
                                <div className="w-9 h-9 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-500 flex-shrink-0">
                                    <DollarSign size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Presupuesto Estimado</span>
                                    <span className="text-base font-black text-gray-900 dark:text-white leading-none">{formatPrice(totalAmount)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 transition-all">
                                <div className="w-9 h-9 bg-gray-50 dark:bg-gray-900/20 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                                    <DollarSign size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Presupuesto Estimado</span>
                                    <span className="text-base font-black text-gray-900 dark:text-white leading-none">***</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 transition-all hover:border-primary/20">
                            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-500 flex-shrink-0">
                                <ClipboardList size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Servicios Incluidos</span>
                                <span className="text-base font-black text-gray-900 dark:text-white leading-none">{event.details?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden min-h-0 bg-gray-50 dark:bg-gray-900">
                        {/* Sidebar (Left) */}
                        <div className="w-80 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-shrink-0 bg-white dark:bg-gray-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cronograma de Servicios</span>
                            {event.details?.map((detail: any, idx: number) => (
                                <button
                                    key={detail.id || idx}
                                    onClick={() => setActiveDetailIndex(idx)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left border ${
                                        activeDetailIndex === idx
                                            ? 'bg-primary/5 dark:bg-primary/10 text-primary border-primary font-black shadow-sm'
                                            : 'bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-transparent font-medium'
                                    }`}
                                >
                                    {/* Compact Calendar Node */}
                                    <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center border transition-colors ${
                                        activeDetailIndex === idx
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                    }`}>
                                        <span className="text-[8px] font-black uppercase tracking-tight leading-none">{getNeutralMonthShort(detail.service_date)}</span>
                                        <span className="text-sm font-black tracking-tighter mt-0.5">{getNeutralDay(detail.service_date)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold truncate text-gray-900 dark:text-white uppercase tracking-tight">{detail.location || 'Sin Ubicación'}</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{detail.service_time}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Active Service Detail Workspace (Right) */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-gray-900/10">
                            {(() => {
                                const detail = event.details?.[activeDetailIndex] || event.details?.[0];
                                if (!detail) return (
                                    <div className="flex items-center justify-center h-full text-gray-400 italic">
                                        No hay servicios registrados.
                                    </div>
                                );

                                return (
                                    <div className="space-y-8">
                                        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-150 dark:border-gray-750">
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hora del Servicio</span>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-tight mt-0.5">
                                                        <Clock size={14} className="text-primary/60" /> {detail.service_time}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Personas</span>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-tight mt-0.5">
                                                        <Users size={14} className="text-primary/60" /> {detail.attendees} PAX
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ubicación</span>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-tight mt-0.5">
                                                        <MapPin size={14} className="text-primary/60" /> {detail.location}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {canShowPrices && (
                                                    <div className="bg-primary/5 px-4 py-2 rounded-xl">
                                                        <span className="text-xl font-black text-primary">{formatPrice(detail.estimated_amount)}</span>
                                                    </div>
                                                )}
                                                {!isBasicUser && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePrint(detail);
                                                        }}
                                                        className="p-3 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750 rounded-xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all active:scale-95 shadow-sm"
                                                        title="Imprimir Comanda"
                                                    >
                                                        <Printer size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Menu Selected Items */}
                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                    <UtensilsCrossed size={12} className="text-primary" /> Menú Seleccionado
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {detail.selected_items && detail.selected_items.length > 0 ? (
                                                        detail.selected_items.map((item: any) => {
                                                            const byCase = item.is_sold_by_case;
                                                            const mult = (item.unit === 'Caja' && byCase) ? (item.units_per_case || 1) : 1;
                                                            const itemSubtotal = (item.price || 0) * (item.quantity || 1) * mult;

                                                            return (
                                                                <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group/item hover:border-primary/30 transition-all">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                            <CheckCircle2 size={12} className="text-primary" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tighter">{item.name}</span>
                                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                                                Cant: {item.quantity || 1} {item.unit || 'Ud'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {canShowPrices && (
                                                                        <div className="text-right">
                                                                            <span className="text-xs font-black text-primary block">
                                                                                {formatPrice(itemSubtotal)}
                                                                            </span>
                                                                            <span className="text-[9px] text-gray-400 font-medium block">
                                                                                {formatPrice(item.price || 0)} / {item.unit || 'Ud'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                                                            <p className="text-xs text-gray-400 italic font-medium">No hay ítems de menú seleccionados</p>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Resumen de Costos */}
                                                {canShowPrices && (
                                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-750 flex flex-col gap-2">
                                                        <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
                                                            <span>Subtotal:</span>
                                                            <span>{formatPrice(detail.estimated_amount || 0)}</span>
                                                        </div>
                                                        {true && (
                                                            <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
                                                                <span>IVA ({event.iva_percentage ?? 0}%):</span>
                                                                <span>{formatPrice((detail.estimated_amount || 0) * ((event.iva_percentage ?? 0) / 100))}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center text-sm text-primary font-black uppercase mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <span>Total:</span>
                                                            <span>{formatPrice((detail.estimated_amount || 0) * (1 + (event.iva_percentage || 0) / 100))}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Requirements & Obs */}
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                        <LayoutGrid size={12} className="text-primary" /> Logística / Requerimientos
                                                    </h4>
                                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 min-h-[80px]">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                                            {detail.additional_requirements || 'Sin requerimientos específicos.'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                        <Info size={12} className="text-primary" /> Observaciones
                                                    </h4>
                                                    <p className="text-xs text-gray-500 italic px-1 font-medium italic">
                                                        {detail.observations || 'Sin observaciones adicionales.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Footer Portal Actions */}
                <div className="p-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Creado el</span>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tight">
                                {new Date(event.request_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-10 py-3.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-500 dark:text-gray-400 rounded-2xl font-bold transition-all active:scale-95 shadow-sm text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </motion.div>
    );
}
