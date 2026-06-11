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
    Briefcase
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
    if (!event) return null;

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

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl max-h-[90vh] bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col font-inter"
            >
                {/* Header */}
                <div className="p-8 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <UtensilsCrossed size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{event.title}</h2>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${event.status === 'Abierta' || event.status === 'PENDIENTE'
                                        ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'
                                        : event.status === 'Confirmado' || event.status === 'Cerrada'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
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
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        {isOwner && onEdit && (
                            <button
                                onClick={() => onEdit(event)}
                                className="group flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 hover:border-primary/30 text-gray-600 dark:text-gray-300 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
                            >
                                <Edit3 size={18} className="text-primary/60 group-hover:text-primary transition-colors" />
                                <span className="text-sm">Editar</span>
                            </button>
                        )}
                        {event.details?.length > 1 && (
                            <button
                                onClick={handlePrintAll}
                                className="group flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-2xl font-black transition-all active:scale-95 shadow-sm"
                                title="Imprimir Todas las Comandas"
                            >
                                <Printer size={18} strokeWidth={2.5} />
                                <span className="text-xs uppercase tracking-tighter">x{event.details.length}</span>
                            </button>
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
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Personas</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{totalAttendees}</p>
                            </div>
                        </div>

                        {canShowPrices && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
                                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Presupuesto Estimado</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatPrice(totalAmount)}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Servicios Incluidos</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{event.details?.length || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Services Timeline/List */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                <Clock size={16} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Cronograma de Servicios</h3>
                        </div>

                        <div className="space-y-8 relative">
                            {/* Vertical Line for Timeline Aesthethic */}
                            <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-gray-100 dark:bg-gray-800 hidden md:block" />

                            {event.details?.map((detail: any, idx: number) => (
                                <motion.div
                                    key={detail.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="relative flex flex-col md:flex-row gap-8 items-start group"
                                >
                                    {/* Timeline Node */}
                                    <div className="hidden md:flex flex-shrink-0 w-20 h-20 rounded-3xl bg-white dark:bg-gray-800 border-2 border-primary/20 items-center justify-center z-10 shadow-sm group-hover:border-primary transition-colors">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-black text-primary uppercase">{getNeutralMonthShort(detail.service_date)}</span>
                                            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{getNeutralDay(detail.service_date)}</span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="flex-1 bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all">
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50 dark:border-gray-700">
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hora del Servicio</span>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-tight">
                                                        <Clock size={14} className="text-primary/60" /> {detail.service_time}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Personas</span>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-tight">
                                                        <Users size={14} className="text-primary/60" /> {detail.attendees} PAX
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ubicación</span>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-tight">
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
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePrint(detail);
                                                    }}
                                                    className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all active:scale-95 shadow-sm"
                                                    title="Imprimir Comanda"
                                                >
                                                    <Printer size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 group/item hover:border-primary/30 transition-all">
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
                                                        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                                                            <p className="text-xs text-gray-400 italic font-medium">No hay ítems de menú seleccionados</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Requirements & Obs */}
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                        <LayoutGrid size={12} className="text-primary" /> Logística / Requerimientos
                                                    </h4>
                                                    <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 min-h-[80px]">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                                            {detail.additional_requirements || 'Sin requerimientos especiales registrados.'}
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
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Portal Actions */}
                <div className="p-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Creado el</span>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tight">
                            {new Date(event.request_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-10 py-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
