import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Calendar,
    MapPin,
    Users,
    Filter,
    ChevronRight,
    Loader2,
    RefreshCw,
    MoreVertical,
    Edit3,
    Trash2,
    Copy,
    Printer,
    FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api, { inventoryApi } from '../../services/api';
import ServiceForm from './ServiceForm';
import MenuManagement from './MenuManagement';
import ServiceDetailView from './ServiceDetailView';
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

export default function ServicesView() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'events' | 'menu'>('events');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const { user } = useAuthStore();
    const isBasicUser = user?.role_name?.toLowerCase() === 'básico' || user?.role_name?.toLowerCase() === 'basico';
    const { canShowPrices, formatPrice } = useCurrency();

    // Filtros avanzados
    const [showFilters, setShowFilters] = useState(false);
    const [filterId, setFilterId] = useState('');
    const [filterTitleResp, setFilterTitleResp] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterCostCenter, setFilterCostCenter] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await inventoryApi.getServiceEvents();
            setEvents(res.data);
        } catch (err) {
            toast.error('Error al cargar servicios');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;

        try {
            await inventoryApi.deleteServiceEvent(id);
            toast.success('Servicio eliminado correctamente');
            fetchEvents();
        } catch (err) {
            toast.error('Error al eliminar el servicio');
        }
    };

    const handleEdit = (e: React.MouseEvent | null, ev: any) => {
        if (e) e.stopPropagation();
        setEditingEvent(ev);
    };

    const handleDuplicate = (e: React.MouseEvent, ev: any) => {
        e.stopPropagation();
        // Limpiamos los IDs para que el formulario lo trate como un nuevo registro
        const { id, created_by, updated_by, ...cleanEvent } = ev;
        const cleanDetails = (ev.details || []).map(({ id, event_id, ...d }: any) => ({
            ...d,
            selected_items: [...(d.selected_items || [])]
        }));

        setEditingEvent({
            ...cleanEvent,
            title: `${cleanEvent.title} (Copia)`,
            details: cleanDetails
        });
        toast.info('Copiando datos para nuevo registro...');
    };

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const nowStr = new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Generate table rows for the summary
        const tableRowsHtml = filteredEvents.map(ev => {
            const detail = ev.details?.[0] || {};
            const dateStr = formatNeutralDate(detail.service_date);

            return `
                <tr>
                    <td><strong>#${ev.id}</strong></td>
                    <td>${ev.responsible}</td>
                    <td>${dateStr} ${detail.service_time || ''}</td>
                    <td>${detail.location || 'N/A'}</td>
                    <td>${detail.attendees || 0}</td>
                    <td>${ev.cost_center || 'N/A'}</td>
                    <td><span class="status-badge status-${ev.status.toLowerCase()}">${ev.status}</span></td>
                </tr>
            `;
        }).join('');

        // Generate details section for each service
        const detailsSectionsHtml = filteredEvents.map(ev => {
            const detailsHtml = (ev.details || []).map((d: any, idx: number) => {
                const dateStr = formatNeutralDate(d.service_date);
                const itemsHtml = d.selected_items && d.selected_items.length > 0
                    ? d.selected_items.map((item: any) => {
                        const qty = item.quantity || 1;
                        return `<li>• ${item.name} (${qty} ${item.unit || 'Ud'})</li>`;
                    }).join('')
                    : '<li class="no-items">No hay ítems seleccionados</li>';

                return `
                    <div class="service-detail-block">
                        <div class="block-header">
                            Servicio ${idx + 1} de ${ev.details.length}: ${dateStr} • ${d.service_time} • ${d.location} • ${d.attendees} PAX
                        </div>
                        <div class="block-body">
                            <div class="items-section">
                                <strong>Menú Solicitado:</strong>
                                <ul>${itemsHtml}</ul>
                            </div>
                            <div class="logistic-section">
                                <strong>Logística / Requerimientos:</strong>
                                <p>${d.additional_requirements || 'Sin requerimientos específicos.'}</p>
                            </div>
                            <div class="obs-section">
                                <strong>Observaciones:</strong>
                                <p>${d.observations || 'Sin observaciones.'}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="event-report-card">
                    <div class="card-header">
                        REGISTRO #${ev.id} - ${ev.title}
                    </div>
                    <div class="card-meta">
                        <span><strong>Responsable:</strong> ${ev.responsible}</span> | 
                        <span><strong>Centro de Costo:</strong> ${ev.cost_center}</span> | 
                        <span><strong>Estado:</strong> ${ev.status}</span>
                    </div>
                    ${detailsHtml}
                </div>
            `;
        }).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Reporte de Servicios - Arregui Hub</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                        body {
                            font-family: 'Inter', sans-serif;
                            color: #111827;
                            line-height: 1.5;
                            padding: 30px;
                            background-color: #fff;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 3px solid #111827;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                        }
                        .header-title h1 {
                            font-size: 24px;
                            font-weight: 800;
                            margin: 0;
                            text-transform: uppercase;
                            letter-spacing: -0.025em;
                        }
                        .header-title p {
                            margin: 5px 0 0 0;
                            color: #4b5563;
                            font-size: 14px;
                            font-weight: 600;
                        }
                        .header-meta {
                            text-align: right;
                            font-size: 12px;
                            color: #6b7280;
                        }
                        h2.section-title {
                            font-size: 16px;
                            font-weight: 800;
                            text-transform: uppercase;
                            border-bottom: 2px solid #e5e7eb;
                            padding-bottom: 8px;
                            margin-top: 40px;
                            margin-bottom: 20px;
                            letter-spacing: 0.05em;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 30px;
                            font-size: 13px;
                        }
                        th {
                            background-color: #f9fafb;
                            font-weight: 700;
                            text-transform: uppercase;
                            font-size: 11px;
                            letter-spacing: 0.05em;
                            color: #374151;
                            border-bottom: 2px solid #d1d5db;
                            padding: 12px 10px;
                            text-align: left;
                        }
                        td {
                            padding: 12px 10px;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        tr:last-child td {
                            border-bottom: 2px solid #d1d5db;
                        }
                        .status-badge {
                            font-size: 10px;
                            font-weight: 800;
                            text-transform: uppercase;
                            padding: 2px 8px;
                            border-radius: 6px;
                            border: 1px solid transparent;
                            display: inline-block;
                        }
                        .status-abierto { background-color: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
                        .status-cancelado { background-color: #fef2f2; color: #b91c1c; border-color: #fecaca; }
                        .status-reprogramado { background-color: #fffbeb; color: #b45309; border-color: #fde68a; }
                        .status-cerrado { background-color: #f3f4f6; color: #374151; border-color: #e5e7eb; }
                        .status-facturado { background-color: #ecfdf5; color: #047857; border-color: #a7f3d0; }
                        .status-cobrado { background-color: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
                        
                        .event-report-card {
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            margin-bottom: 25px;
                            page-break-inside: avoid;
                            overflow: hidden;
                        }
                        .card-header {
                            background-color: #111827;
                            color: #fff;
                            font-weight: 800;
                            font-size: 14px;
                            padding: 12px 20px;
                            text-transform: uppercase;
                        }
                        .card-meta {
                            background-color: #f3f4f6;
                            padding: 8px 20px;
                            font-size: 12px;
                            color: #4b5563;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .service-detail-block {
                            padding: 20px;
                            border-bottom: 1px dashed #e5e7eb;
                        }
                        .service-detail-block:last-child {
                            border-bottom: none;
                        }
                        .block-header {
                            font-weight: 700;
                            font-size: 13px;
                            color: #111827;
                            margin-bottom: 12px;
                            background-color: #f9fafb;
                            padding: 6px 12px;
                            border-radius: 6px;
                            border-left: 3px solid #111827;
                        }
                        .block-body {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                            font-size: 12px;
                        }
                        @media (max-width: 600px) {
                            .block-body {
                                grid-template-columns: 1fr;
                            }
                        }
                        .items-section ul {
                            margin: 5px 0 0 0;
                            padding-left: 15px;
                        }
                        .items-section li {
                            margin-bottom: 4px;
                        }
                        .logistic-section p, .obs-section p {
                            margin: 5px 0 0 0;
                            color: #374151;
                        }
                        @media print {
                            body {
                                padding: 0;
                            }
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="header-title">
                            <h1>Reporte de Servicios de Catering</h1>
                            <p>Arregui Hub — Gestión Operativa</p>
                        </div>
                        <div class="header-meta">
                            Generado: ${nowStr}<br>
                            Servicios Filtrados: ${filteredEvents.length}
                        </div>
                    </div>

                    <h2 class="section-title">Resumen de Registros</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Reg.</th>
                                <th>Responsable</th>
                                <th>Fecha y Hora</th>
                                <th>Ubicación / Lugar</th>
                                <th>PAX</th>
                                <th>Centro Costo</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>

                    <h2 class="section-title">Detalle de Solicitudes</h2>
                    ${detailsSectionsHtml}

                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintConsolidatedReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const nowStr = new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const rows: string[] = [];
        
        filteredEvents.forEach(ev => {
            const details = ev.details || [];
            if (details.length === 0) {
                rows.push(`
                    <tr>
                        <td class="text-center font-bold">#${ev.id}</td>
                        <td class="text-center">-</td>
                        <td class="text-center">-</td>
                        <td><strong>${ev.title}</strong><br><small class="text-muted">Resp: ${ev.responsible}</small></td>
                        <td>-</td>
                        <td class="text-center">0</td>
                        <td><span class="no-items">Sin detalles</span></td>
                    </tr>
                `);
            } else {
                details.forEach((d: any, idx: number) => {
                    const dateStr = formatNeutralDate(d.service_date);
                    const timeStr = d.service_time || '';
                    const itemsText = d.selected_items && d.selected_items.length > 0
                        ? d.selected_items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ')
                        : 'Sin menú';
                    
                    const regId = details.length > 1 ? `#${ev.id}.${idx + 1}` : `#${ev.id}`;

                    rows.push(`
                        <tr>
                            <td class="text-center font-bold">${regId}</td>
                            <td class="text-center">${dateStr}</td>
                            <td class="text-center">${timeStr}</td>
                            <td><strong>${ev.title}</strong><br><small class="text-muted">Resp: ${ev.responsible}</small></td>
                            <td>${d.location || 'N/A'}</td>
                            <td class="text-center">${d.attendees || 0}</td>
                            <td class="menu-cell">${itemsText}</td>
                        </tr>
                    `);
                });
            }
        });

        const tableRowsHtml = rows.join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Reporte Consolidado - Arregui Hub</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
                        @page {
                            size: landscape;
                            margin: 6mm 8mm;
                        }
                        body {
                            font-family: 'Inter', sans-serif;
                            color: #111827;
                            line-height: 1.2;
                            padding: 10px;
                            background-color: #fff;
                            font-size: 10px;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 2px solid #111827;
                            padding-bottom: 8px;
                            margin-bottom: 12px;
                        }
                        .header-title h1 {
                            font-size: 16px;
                            font-weight: 900;
                            margin: 0;
                            text-transform: uppercase;
                            letter-spacing: -0.01em;
                        }
                        .header-title p {
                            margin: 2px 0 0 0;
                            color: #4b5563;
                            font-size: 10px;
                            font-weight: 600;
                        }
                        .header-meta {
                            text-align: right;
                            font-size: 9px;
                            color: #6b7280;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 10px;
                        }
                        th {
                            background-color: #f3f4f6;
                            font-weight: 900;
                            text-transform: uppercase;
                            font-size: 9px;
                            letter-spacing: 0.05em;
                            color: #374151;
                            border: 1px solid #d1d5db;
                            padding: 6px 5px;
                            text-align: left;
                        }
                        td {
                            padding: 5px;
                            border: 1px solid #e5e7eb;
                            vertical-align: middle;
                            font-size: 8.5px;
                        }
                        td strong {
                            font-size: 9px;
                        }
                        .text-center {
                            text-align: center;
                        }
                        .text-muted {
                            color: #6b7280;
                            font-size: 8px;
                        }
                        .menu-cell {
                            font-size: 10.5px;
                            font-weight: 700;
                            color: #111827;
                            word-break: break-word;
                            max-width: 320px;
                        }
                        
                        @media print {
                            body {
                                padding: 0;
                            }
                            .no-print {
                                display: none;
                            }
                            tr {
                                page-break-inside: avoid;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="header-title">
                            <h1>Reporte Consolidado de Servicios de Catering</h1>
                            <p>Arregui Hub — Vista Operativa Compacta</p>
                        </div>
                        <div class="header-meta">
                            Generado: ${nowStr}<br>
                            Servicios Consolidados: ${rows.length}
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 6%; text-align: center;">Reg.</th>
                                <th style="width: 10%; text-align: center;">Fecha</th>
                                <th style="width: 8%; text-align: center;">Hora</th>
                                <th style="width: 22%;">Servicio / Responsable</th>
                                <th style="width: 16%;">Ubicación / Lugar</th>
                                <th style="width: 5%; text-align: center;">PAX</th>
                                <th style="width: 33%;">Menú Solicitado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>

                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `);
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

        let fullHtml = `
            <html>
                <head>
                    <title>Reportes de Facturación - Arregui Hub</title>
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
                        .page-container {
                            page-break-after: always;
                            break-after: page;
                            box-sizing: border-box;
                            padding-bottom: 20px;
                        }
                        .page-container:last-child {
                            page-break-after: avoid;
                            break-after: avoid;
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
                        .top-actions {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            background-color: #f3f4f6;
                            padding: 12px 20px;
                            border-radius: 8px;
                            margin-bottom: 20px;
                        }
                        .top-actions span {
                            font-weight: bold;
                            color: #374151;
                        }
                        @media print {
                            .no-print { display: none; }
                            body { background-color: #fff; }
                            .page-container {
                                padding-bottom: 0;
                            }
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
                <body>
                    <div class="top-actions no-print">
                        <span>Reportes Generados: ${filteredEvents.length} servicio(s)</span>
                        <button class="no-print-btn" onclick="window.print()">Imprimir Todo</button>
                    </div>
        `;

        filteredEvents.forEach(event => {
            const requestDateStr = event.request_date 
                ? new Date(event.request_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'N/A';

            const statusDateStr = event.status_date 
                ? new Date(event.status_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : requestDateStr;

            let detailsHtml = '';
            let eventTotal = 0;

            const details = event.details || [];
            details.forEach((d: any, idx: number) => {
                const dateStr = formatNeutralDate(d.service_date);
                const timeStr = d.service_time || '';
                const detailId = details.length > 1 ? `#${event.id}.${idx + 1}` : `#${event.id}`;
                const detailTotal = d.estimated_amount || 0;
                eventTotal += detailTotal;

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
                                    <td colspan="4" class="text-right font-bold">Subtotal Servicio:</td>
                                    <td class="text-right font-bold">${formatPrice(detailTotal)}</td>
                                </tr>
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

            fullHtml += `
                <div class="page-container ${event.details && event.details.length > 1 ? 'multiple-services-print' : ''}">
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
                        <span class="grand-total-value">${formatPrice(eventTotal)}</span>
                    </div>

                    <div class="footer">
                        Generado por ArreguiHub el ${nowStr}
                    </div>
                </div>
            `;
        });

        fullHtml += `
                </body>
            </html>
        `;

        printWindow.document.write(fullHtml);
        printWindow.document.close();
    };

    const handleExportToExcel = () => {
        if (filteredEvents.length === 0) return;

        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'sep=;\r\n';
        csvContent += `CONSOLIDADO DE FACTURACIÓN - ARREGUI HUB\r\n`;
        csvContent += `Cantidad de Servicios;${filteredEvents.length}\r\n`;
        csvContent += '\r\n';

        // Headers
        csvContent += 'ID Evento;Título Evento;Responsable;Cliente;Centro de Costo;Fecha Solicitud;Estado;Factura;Nº Sub-Servicio;Fecha Servicio;Hora;Sala/Ubicación;PAX;Descripción Ítem;Cant.;Unidad;P. Unitario;Subtotal;Requerimientos;Observaciones\r\n';

        let grandTotal = 0;
        filteredEvents.forEach(event => {
            const requestDateStr = event.request_date
                ? new Date(event.request_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'N/A';

            const details = event.details || [];
            details.forEach((d: any, idx: number) => {
                const dateStr = formatNeutralDate(d.service_date);
                const timeStr = d.service_time || '';
                const location = d.location || 'N/A';
                const attendees = d.attendees || 0;

                const items = d.selected_items && d.selected_items.length > 0 ? d.selected_items : [];
                if (items.length === 0) {
                    csvContent += `${event.id};"${(event.title || '').replace(/"/g, '""').replace(/;/g, ',')}";"${event.responsible || ''}";"${event.company || 'NO ESPECIFICADA'}";"${event.cost_center || 'NO ESPECIFICADO'}";${requestDateStr};"${event.status || ''}";"${event.invoice_number || ''}";Servicio ${idx + 1};${dateStr};${timeStr};${location};${attendees};Sin platos/snack registrados;0;Unidad;0;0;"${(d.additional_requirements || '').replace(/"/g, '""').replace(/;/g, ',').replace(/\r?\n/g, ' ')}";"${(d.observations || '').replace(/"/g, '""').replace(/;/g, ',').replace(/\r?\n/g, ' ')}"\r\n`;
                } else {
                    items.forEach((item: any) => {
                        const qty = item.quantity || 1;
                        const price = item.price || 0;
                        const unit = item.unit || 'Unidad';
                        const mult = (unit === 'Caja' && item.is_sold_by_case) ? (item.units_per_case || 1) : 1;
                        const sub = qty * price * mult;
                        grandTotal += sub;

                        const eventTitle = (event.title || '').replace(/"/g, '""').replace(/;/g, ',');
                        const itemName = (item.name || '').replace(/"/g, '""').replace(/;/g, ',');
                        const reqs = (d.additional_requirements || '').replace(/"/g, '""').replace(/;/g, ',').replace(/\r?\n/g, ' ');
                        const obs = (d.observations || '').replace(/"/g, '""').replace(/;/g, ',').replace(/\r?\n/g, ' ');

                        csvContent += `${event.id};"${eventTitle}";"${event.responsible || ''}";"${event.company || 'NO ESPECIFICADA'}";"${event.cost_center || 'NO ESPECIFICADO'}";${requestDateStr};"${event.status || ''}";"${event.invoice_number || ''}";Servicio ${idx + 1};${dateStr};${timeStr};${location};${attendees};"${itemName}";${qty};${unit};${price};${sub};"${reqs}";"${obs}"\r\n`;
                    });
                }
            });
        });

        csvContent += `\r\n;;;;;;;;;;;;;;;;Total General;${grandTotal};;\r\n`;

        // Download trigger
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Consolidado_Facturacion_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const filteredEvents = events
        .filter(ev => {
            // 1. Buscador global (si está escrito)
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesGlobal = 
                    ev.id.toString().includes(term) ||
                    ev.title.toLowerCase().includes(term) ||
                    ev.responsible.toLowerCase().includes(term) ||
                    (ev.cost_center || '').toLowerCase().includes(term) ||
                    (ev.company || '').toLowerCase().includes(term) ||
                    (ev.details && ev.details.some((d: any) => 
                        d.location.toLowerCase().includes(term) ||
                        formatNeutralDate(d.service_date).toLowerCase().includes(term) ||
                        getNeutralDateString(d.service_date).includes(term)
                    ));
                if (!matchesGlobal) return false;
            }

            // 2. Filtro por Número de Registro (ID)
            if (filterId) {
                if (!ev.id.toString().includes(filterId.trim())) return false;
            }

            // 3. Filtro por Servicio / Responsable
            if (filterTitleResp) {
                const term = filterTitleResp.toLowerCase();
                const matchesTitleResp = 
                    ev.title.toLowerCase().includes(term) ||
                    ev.responsible.toLowerCase().includes(term);
                if (!matchesTitleResp) return false;
            }

            // 4. Filtro por Fecha (service_date)
            if (filterDate) {
                const matchesDate = ev.details && ev.details.some((d: any) => {
                    return getNeutralDateString(d.service_date) === filterDate;
                });
                if (!matchesDate) return false;
            }

            // 5. Filtro por Lugar (location)
            if (filterLocation) {
                const term = filterLocation.toLowerCase();
                const matchesLoc = ev.details && ev.details.some((d: any) => 
                    d.location.toLowerCase().includes(term)
                );
                if (!matchesLoc) return false;
            }

            // 6. Filtro por Logística (Centro de Costo)
            if (filterCostCenter) {
                const term = filterCostCenter.toLowerCase();
                if (!(ev.cost_center || '').toLowerCase().includes(term)) return false;
            }

            // 7. Filtro por Estado (status)
            if (filterStatus) {
                if (ev.status !== filterStatus) return false;
            }

            return true;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (showModal || editingEvent) {
        return (
            <div className="w-full h-full font-inter animate-in fade-in duration-200">
                <ServiceForm
                    initialData={editingEvent}
                    onClose={(updatedEvent) => {
                        setShowModal(false);
                        setEditingEvent(null);
                        if (updatedEvent && selectedEvent && updatedEvent.id === selectedEvent.id) {
                            setSelectedEvent(updatedEvent);
                        }
                        fetchEvents();
                    }}
                />
            </div>
        );
    }

    if (selectedEvent) {
        return (
            <div className="w-full h-full font-inter animate-in fade-in duration-200">
                <ServiceDetailView
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onEdit={(ev) => {
                        setSelectedEvent(null);
                        handleEdit(null as any, ev);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-inter">
            {/* Tabs & Main Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'events'
                            ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Calendar size={18} />
                        Registros
                    </button>
                    {user?.is_superuser && (
                        <button
                            onClick={() => setActiveTab('menu')}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'menu'
                                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Plus size={18} />
                            Gestión Menú
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'events' && (
                        <>
                            <button
                                onClick={fetchEvents}
                                className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 transition-colors text-gray-500"
                            >
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                            </button>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                <Plus size={20} />
                                <span>Nuevo Servicio</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {activeTab === 'events' ? (
                <>
                    {/* Search & Advanced Filters Section */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por evento, responsable, ubicación o número..."
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all font-medium text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center justify-center gap-2 px-5 py-4 border rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                                    showFilters 
                                        ? 'bg-primary/10 border-primary text-primary' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Filter size={18} />
                                <span>Filtros Avanzados</span>
                                {(filterId || filterTitleResp || filterDate || filterLocation || filterCostCenter || filterStatus) && (
                                    <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                                )}
                            </button>
                            {!isBasicUser && (
                                <button
                                    onClick={handlePrintReport}
                                    className="flex items-center justify-center gap-2 px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm"
                                    title="Imprimir Reporte de Servicios"
                                >
                                    <Printer size={18} />
                                    <span>Imprimir Reporte</span>
                                </button>
                            )}
                            {!isBasicUser && (
                                <button
                                    onClick={handlePrintConsolidatedReport}
                                    className="flex items-center justify-center gap-2 px-5 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm"
                                    title="Imprimir Reporte Consolidado (Una Sola Línea)"
                                >
                                    <Printer size={18} />
                                    <span>Imprimir Consolidado</span>
                                </button>
                            )}
                            {!isBasicUser && canShowPrices && (
                                <>
                                    <button
                                        onClick={handlePrintInvoicingReport}
                                        className="flex items-center justify-center gap-2 px-5 py-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm"
                                        title="Imprimir Reporte para Facturar (con Costos)"
                                    >
                                        <Printer size={18} />
                                        <span>Reporte Facturación</span>
                                    </button>
                                    <button
                                        onClick={handleExportToExcel}
                                        className="flex items-center justify-center gap-2 px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm"
                                        title="Exportar Consolidado a Excel"
                                    >
                                        <FileSpreadsheet size={18} />
                                        <span>Exportar Excel</span>
                                    </button>
                                </>
                            )}
                            {(searchTerm || filterId || filterTitleResp || filterDate || filterLocation || filterCostCenter || filterStatus) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterId('');
                                        setFilterTitleResp('');
                                        setFilterDate('');
                                        setFilterLocation('');
                                        setFilterCostCenter('');
                                        setFilterStatus('');
                                    }}
                                    className="px-5 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm rounded-2xl active:scale-95 transition-all"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        {/* Collapsible Panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        {/* 1. Registro (Nro Servicio) */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registro (Nro. Servicio)</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: 5"
                                                value={filterId}
                                                onChange={(e) => setFilterId(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs focus:border-primary text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {/* 2. Servicio / Responsable */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Servicio / Responsable</label>
                                            <input
                                                type="text"
                                                placeholder="Nombre o responsable..."
                                                value={filterTitleResp}
                                                onChange={(e) => setFilterTitleResp(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs focus:border-primary text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {/* 3. Fecha */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha</label>
                                            <input
                                                type="date"
                                                value={filterDate}
                                                onChange={(e) => setFilterDate(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs focus:border-primary text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {/* 4. Lugar */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lugar</label>
                                            <input
                                                type="text"
                                                placeholder="Ubicación..."
                                                value={filterLocation}
                                                onChange={(e) => setFilterLocation(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs focus:border-primary text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {/* 5. Logística (Centro de Costo) */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logística (Centro Costo)</label>
                                            <input
                                                type="text"
                                                placeholder="Centro de costo..."
                                                value={filterCostCenter}
                                                onChange={(e) => setFilterCostCenter(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs focus:border-primary text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {/* 6. Estado */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</label>
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-xs focus:border-primary text-gray-900 dark:text-white"
                                            >
                                                <option value="">Todos</option>
                                                <option value="Abierto">Abierto</option>
                                                <option value="Cancelado">Cancelado</option>
                                                <option value="Reprogramado">Reprogramado</option>
                                                <option value="Cerrado">Cerrado</option>
                                                <option value="Facturado">Facturado</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Main Content Table (Like Image 4) */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Registro</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Servicio / Responsable</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Fecha y Lugar</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Logística</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Estado</th>
                                        {canShowPrices && <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Monto</th>}
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    <AnimatePresence>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 className="animate-spin text-primary" size={40} />
                                                        <span className="text-gray-500 font-medium">Cargando servicios...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredEvents.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-gray-400">
                                                        <Plus size={48} strokeWidth={1} />
                                                        <p className="font-medium">No se encontraron servicios registrados.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEvents.map((ev, index) => (
                                                <motion.tr
                                                    key={ev.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                                                    onClick={() => setSelectedEvent(ev)}
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-black text-primary text-sm">#{ev.id}</span>
                                                            <span className="text-gray-500 text-xs font-medium">
                                                                {new Date(ev.created_at).toLocaleDateString('es-ES', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-900 dark:text-white text-base">{ev.title}</span>
                                                                {ev.details?.length > 1 && (
                                                                    <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight">
                                                                        Multiservicio ({ev.details.length})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col text-xs mt-1">
                                                                <div className="flex items-center gap-1.5 text-gray-500 font-bold uppercase tracking-tight">
                                                                    <Users size={12} className="text-primary/60" />
                                                                    <span>Resp: {ev.responsible}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-gray-400 font-medium italic mt-0.5">
                                                                    <span>Gestor: {ev.gestor || 'Sistema'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-2">
                                                            {ev.details && ev.details.length > 0 ? (
                                                                <>
                                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
                                                                        <Calendar size={14} className="text-gray-400" />
                                                                        <span>{formatNeutralDate(ev.details[0].service_date)} • {ev.details[0].service_time}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                                        <MapPin size={14} className="text-gray-400" />
                                                                        <span>{ev.details[0].location}</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs italic">Sin detalles</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm font-bold">
                                                                <Users size={14} className="text-gray-400" />
                                                                <span>
                                                                    {ev.details?.length > 1 ? (
                                                                        (() => {
                                                                            const allSame = ev.details.every((d: any) => d.attendees === ev.details[0].attendees);
                                                                            if (allSame) {
                                                                                return `${ev.details[0].attendees} PAX por servicio`;
                                                                            } else {
                                                                                // In case they are different, we can show total or a breakdown. 
                                                                                // User said "refleje la cantidad de personas por servicios".
                                                                                return ev.details.map((d: any) => d.attendees).join(' / ') + ' PAX';
                                                                            }
                                                                        })()
                                                                    ) : (
                                                                        `${ev.details?.[0]?.attendees || 0} personas`
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                                {ev.company ? `${ev.company} • ` : ''}{ev.cost_center || 'Sin C.C.'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                            ev.status === 'Abierto'
                                                                ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                                                                : ev.status === 'Reprogramado'
                                                                    ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'
                                                                    : ev.status === 'Facturado'
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                                        : ev.status === 'Cobrado'
                                                                            ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800'
                                                                            : ev.status === 'Cancelado'
                                                                                ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800'
                                                                                : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                                                            }`}>
                                                            {ev.status}
                                                        </span>
                                                    </td>
                                                    {canShowPrices && (
                                                        <td className="px-8 py-6">
                                                            <span className="font-black text-gray-900 dark:text-white text-lg">
                                                                {formatPrice(ev.details?.reduce((acc: number, d: any) => acc + d.estimated_amount, 0) || 0)}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {(user?.is_superuser || !canShowPrices || Number(ev.created_by?.id || ev.created_by) === Number(user?.id)) && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => handleDuplicate(e, ev)}
                                                                        className="p-2.5 rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-gray-400 hover:text-primary"
                                                                        title="Duplicar Evento"
                                                                    >
                                                                        <Copy size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => handleEdit(e, ev)}
                                                                        className="p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-400 hover:text-blue-600"
                                                                        title="Editar"
                                                                    >
                                                                        <Edit3 size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => handleDelete(e, ev.id)}
                                                                        className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-400 hover:text-red-600"
                                                                        title="Eliminar"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                                                <MoreVertical size={20} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* early returns handle form and detail views */}
                </>
            ) : (
                <MenuManagement />
            )}
        </div>
    );
}
