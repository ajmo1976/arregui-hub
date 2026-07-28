import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Calendar,
    Edit2,
    Trash2,
    Utensils,
    DollarSign,
    Truck,
    TrendingUp,
    TrendingDown,
    Activity,
    RefreshCw,
    Loader2,
    CalendarCheck,
    ChevronDown,
    ChevronUp,
    FileText,
    ArrowLeft,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import DailyRecordForm from './DailyRecordForm';
import WeeklyPlanning from './WeeklyPlanning';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';

const parseObservations = (obs: string) => {
    if (!obs) return { t1: null, t2: null, t3: null, t4: null, manual: null, cleanObs: '' };
    const match = obs.match(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*T3=(\d+|),\s*T4=(\d+|),\s*M=(\d+|)\]/);
    if (match) {
        return {
            t1: match[1] === '' ? null : parseInt(match[1]),
            t2: match[2] === '' ? null : parseInt(match[2]),
            t3: match[3] === '' ? null : parseInt(match[3]),
            t4: match[4] === '' ? null : parseInt(match[4]),
            manual: match[5] === '' ? null : parseInt(match[5]),
            cleanObs: obs.replace(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*T3=(\d+|),\s*T4=(\d+|),\s*M=(\d+|)\]\s*/, '')
        };
    }
    const legacyMatch = obs.match(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*M=(\d+|)\]/);
    if (legacyMatch) {
        return {
            t1: legacyMatch[1] === '' ? null : parseInt(legacyMatch[1]),
            t2: legacyMatch[2] === '' ? null : parseInt(legacyMatch[2]),
            t3: null,
            t4: null,
            manual: legacyMatch[3] === '' ? null : parseInt(legacyMatch[3]),
            cleanObs: obs.replace(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*M=(\d+|)\]\s*/, '')
        };
    }
    return { t1: null, t2: null, t3: null, t4: null, manual: null, cleanObs: obs };
};

// Helper to find standard meal price for a date
const getPriceForDate = (prices: any[], targetDate: string) => {
    if (!prices || prices.length === 0) return 0;
    const sameTypePrices = prices.filter(p =>
        p.type.toUpperCase() === 'ESTANDAR' || p.type === 'Estándar'
    );
    if (sameTypePrices.length === 0) return 0;
    const pastPrices = sameTypePrices
        .filter(p => p.effective_date <= targetDate)
        .sort((a, b) => b.effective_date.localeCompare(a.effective_date));
    if (pastPrices.length > 0) return pastPrices[0].price;
    const earliestPrice = [...sameTypePrices].sort((a, b) => a.effective_date.localeCompare(b.effective_date))[0];
    return earliestPrice?.price || 0;
};

interface WeeklyReportViewProps {
    logs: any[];
    onClose: () => void;
    formatPrice: (price: number) => string;
}

function WeeklyReportView({ logs, onClose, formatPrice }: WeeklyReportViewProps) {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Default to last 30 days
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [planningDetails, setPlanningDetails] = useState<any[]>([]);
    const [prices, setPrices] = useState<any[]>([]);
    const [loadingPlanning, setLoadingPlanning] = useState(false);

    const fetchPrices = async () => {
        try {
            const response = await inventoryApi.getMealPrices();
            setPrices(response.data || []);
        } catch (error) {
            console.error('Error fetching prices:', error);
        }
    };

    const fetchPlanning = async () => {
        try {
            setLoadingPlanning(true);
            const res = await inventoryApi.getServiceEvents();
            
            const planningEvents = res.data.filter((ev: any) => ev.company === 'Planificación' || ev.cost_center === 'Planificación');
            
            const details: any[] = [];
            planningEvents.forEach((ev: any) => {
                (ev.details || []).forEach((d: any) => {
                    const obs = d.observations || '';
                    const match = obs.match(/\[DESGLOSE_PLANIFICACION:\s*PLC=(\d+),\s*SM=(\d+),\s*CN_PLANTA=(\d+),\s*CENAS=(\d+),\s*SC=(\d+),\s*CONC=(\d+),\s*CN_EXT=(\d+),\s*CS_EXT=(\d+)\]/);
                    
                    let plc = 0, sm = 0, cnPlanta = 0, cenas = 0, sc = 0, conc = 0, cnExt = 0, csExt = 0;
                    if (match) {
                        plc = parseInt(match[1]);
                        sm = parseInt(match[2]);
                        cnPlanta = parseInt(match[3]);
                        cenas = parseInt(match[4]);
                        sc = parseInt(match[5]);
                        conc = parseInt(match[6]);
                        cnExt = parseInt(match[7]);
                        csExt = parseInt(match[8]);
                    } else {
                        const fallbackPlc = obs.match(/PLC=(\d+)/);
                        const fallbackSm = obs.match(/SM=(\d+)/);
                        const fallbackCnPlanta = obs.match(/CN_PLANTA=(\d+)/);
                        const fallbackCenas = obs.match(/CENAS=(\d+)/);
                        const fallbackSc = obs.match(/SC=(\d+)/);
                        const fallbackConc = obs.match(/CONC=(\d+)/);
                        const fallbackCnExt = obs.match(/CN_EXT=(\d+)/);
                        const fallbackCsExt = obs.match(/CS_EXT=(\d+)/);
                        
                        plc = fallbackPlc ? parseInt(fallbackPlc[1]) : 0;
                        sm = fallbackSm ? parseInt(fallbackSm[1]) : 0;
                        cnPlanta = fallbackCnPlanta ? parseInt(fallbackCnPlanta[1]) : 0;
                        cenas = fallbackCenas ? parseInt(fallbackCenas[1]) : 0;
                        sc = fallbackSc ? parseInt(fallbackSc[1]) : 0;
                        conc = fallbackConc ? parseInt(fallbackConc[1]) : 0;
                        cnExt = fallbackCnExt ? parseInt(fallbackCnExt[1]) : 0;
                        csExt = fallbackCsExt ? parseInt(fallbackCsExt[1]) : 0;
                    }
                    
                    details.push({
                        date: d.service_date.split('T')[0],
                        plc,
                        sm,
                        cnPlanta,
                        cenas,
                        sc,
                        conc,
                        cnExt,
                        csExt,
                        total: d.attendees || (plc + sm + cnPlanta + cenas + sc + conc + cnExt + csExt)
                    });
                });
            });
            setPlanningDetails(details);
        } catch (err) {
            console.error("Error loading planning events:", err);
            toast.error("No se pudo cargar la planificación semanal");
        } finally {
            setLoadingPlanning(false);
        }
    };

    useEffect(() => {
        fetchPlanning();
        fetchPrices();
    }, []);

    // Filter logs in range
    const logsInRange = logs.filter(log => {
        const d = log.log_date.split('T')[0];
        return d >= startDate && d <= endDate;
    });

    // Get union of all dates in range
    const allDates = Array.from(new Set([
        ...logsInRange.map(l => l.log_date.split('T')[0]),
        ...planningDetails.filter(p => p.date >= startDate && p.date <= endDate).map(p => p.date)
    ])).sort();

    // Map comparative data by date
    const consolidatedData = allDates.map(date => {
        // Daily Log (Real)
        const log = logsInRange.find(l => l.log_date.split('T')[0] === date);
        const real = {
            t1: log ? parseObservations(log.observations).t1 : null,
            t2: log ? parseObservations(log.observations).t2 : null,
            t3: log ? parseObservations(log.observations).t3 : null,
            t4: log ? parseObservations(log.observations).t4 : null,
            manual: log ? parseObservations(log.observations).manual : null,
            lunchSold: log ? log.lunch_sold : 0,
            breakfastRevenue: log ? (log.breakfast_revenue || 0) : 0
        };

        // Planning (Plan)
        const plans = planningDetails.filter(p => p.date === date);
        const plan = {
            plc: plans.reduce((acc, p) => acc + p.plc, 0),
            sm: plans.reduce((acc, p) => acc + p.sm, 0),
            cnPlanta: plans.reduce((acc, p) => acc + p.cnPlanta, 0),
            cenas: plans.reduce((acc, p) => acc + p.cenas, 0),
            sc: plans.reduce((acc, p) => acc + p.sc, 0),
            conc: plans.reduce((acc, p) => acc + p.conc, 0),
            cnExt: plans.reduce((acc, p) => acc + p.cnExt, 0),
            csExt: plans.reduce((acc, p) => acc + p.csExt, 0),
            total: plans.reduce((acc, p) => acc + p.total, 0)
        };

        // Total Gral: Sum of served (Real PLC + other planned columns)
        const totalGral = real.lunchSold + plan.sm + plan.cnPlanta + plan.cenas + plan.sc + plan.conc + plan.cnExt + plan.csExt;
        
        // Resolve meal price for this date
        const mealPrice = getPriceForDate(prices, date);
        const billing = totalGral * mealPrice;

        return {
            date,
            plan,
            real,
            totalGral,
            mealPrice,
            billing,
            hasLog: !!log,
            hasPlan: plans.length > 0
        };
    });

    // KPI Aggregations
    const totalServings = consolidatedData.reduce((acc, row) => acc + row.totalGral, 0);
    const totalPlanServings = consolidatedData.reduce((acc, row) => acc + row.plan.total, 0);
    const totalBreakfastIncome = consolidatedData.reduce((acc, row) => acc + row.real.breakfastRevenue, 0);
    const totalBillingIncome = consolidatedData.reduce((acc, row) => acc + row.billing, 0);

    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fecha,PLAN_PLC,PLAN_SM,PLAN_COLNORTE,PLAN_CENAS,PLAN_SOBRE_CENAS,PLAN_CONCENTRADOS,PLAN_COL_NORTE_EXT,PLAN_COLSUR,TOTAL_PLAN,REAL_T1,REAL_T2,REAL_T3,REAL_T4,REAL_MANUAL,TOTAL_ALMUERZOS_REAL,DESAYUNOS_REAL,TOTAL_GENERAL,COSTO_PLATO,FACTURACION\n";
        
        consolidatedData.forEach(row => {
            csvContent += `${row.date},${row.plan.plc},${row.plan.sm},${row.plan.cnPlanta},${row.plan.cenas},${row.plan.sc},${row.plan.conc},${row.plan.cnExt},${row.plan.csExt},${row.plan.total},${row.real.t1 ?? 0},${row.real.t2 ?? 0},${row.real.t3 ?? 0},${row.real.t4 ?? 0},${row.real.manual ?? 0},${row.real.lunchSold},${row.real.breakfastRevenue},${row.totalGral},${row.mealPrice},${row.billing}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_diario_consolidado_completo_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-500">
                        <FileText size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Reporte de Servicios: Planificación + Registros
                        </h1>
                        <p className="text-gray-500 text-xs font-medium">
                            Visualización consolidada de los 8 campos de la planificación semanal y todos los datos registrados diariamente.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        type="button" 
                        onClick={exportToCSV}
                        className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-250 hover:bg-gray-55 dark:hover:bg-gray-700 transition-all shadow-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                        <Download size={14} /> Exportar CSV
                    </button>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all shadow-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>
                </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* Date Filters Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-end gap-6">
                <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Fecha Inicio</label>
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-2xl px-4 py-3">
                        <Calendar size={16} className="text-gray-400" />
                        <input 
                            type="date"
                            className="bg-transparent border-none outline-none font-medium text-sm text-gray-955 dark:text-white w-full"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Fecha Fin</label>
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-2xl px-4 py-3">
                        <Calendar size={16} className="text-gray-400" />
                        <input 
                            type="date"
                            className="bg-transparent border-none outline-none font-medium text-sm text-gray-955 dark:text-white w-full"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Servido (Real + Plan)</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalServings.toLocaleString()} <span className="text-xs font-normal text-gray-400">platos</span></h3>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Facturación Total</p>
                    <h3 className="text-2xl font-bold text-primary mt-1">{formatPrice(totalBillingIncome)}</h3>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Planificado</p>
                    <h3 className="text-2xl font-bold text-blue-500 mt-1">{totalPlanServings.toLocaleString()} <span className="text-xs font-normal text-gray-400">platos</span></h3>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ingreso Desayunos</p>
                    <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1">
                        {formatPrice(totalBreakfastIncome)}
                    </h3>
                </div>
            </div>

            {/* Main Comparative Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto min-w-[1500px]">
                        <thead>
                            {/* Group Headers */}
                            <tr className="bg-gray-55 dark:bg-gray-955 text-[9px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800" rowSpan={2}>Fecha</th>
                                <th className="px-3 py-3 text-center bg-blue-50/15 dark:bg-blue-955/5 border-r border-gray-100 dark:border-gray-800 text-blue-600 dark:text-blue-400" colSpan={9}>
                                    Planificación Semanal (OCR de Imagen)
                                </th>
                                <th className="px-3 py-3 text-center bg-emerald-50/15 dark:bg-emerald-955/5 border-r border-gray-100 dark:border-gray-800 text-emerald-600 dark:text-emerald-400" colSpan={7}>
                                    Registro Diario (Real)
                                </th>
                                <th className="px-3 py-3 text-center bg-primary/10 text-primary font-black" colSpan={2}>
                                    Consolidado General
                                </th>
                            </tr>
                            {/* Detailed Headers */}
                            <tr className="bg-gray-50/50 dark:bg-gray-955/50 text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                {/* Planning */}
                                <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">PLC</th>
                                <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">SM</th>
                                <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">ColNorte</th>
                                <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">Cenas</th>
                                <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">Sobre Cenas</th>
                                <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">Concentrados</th>
                                <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">Col Norte (Ext)</th>
                                <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">ColSur</th>
                                <th className="px-2 py-3 text-center bg-blue-50/10 dark:bg-blue-955/10 border-r border-gray-100 dark:border-gray-800 text-blue-600 font-black">Total Plan</th>
                                
                                {/* Real */}
                                <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">T1</th>
                                <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">T2</th>
                                <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">T3</th>
                                <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">T4</th>
                                <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">Manual</th>
                                <th className="px-2 py-3 text-center bg-emerald-50/10 dark:bg-emerald-955/10 text-emerald-600 font-black">Total Almuerzos</th>
                                <th className="px-2 py-3 text-right bg-emerald-50/10 dark:bg-emerald-955/10 border-r border-gray-100 dark:border-gray-800 text-emerald-600 font-black">Desayunos ($)</th>
                                
                                {/* Consolidado */}
                                <th className="px-3 py-3 text-center bg-primary/5 text-primary font-black">Total Gral</th>
                                <th className="px-3 py-3 text-right bg-primary/10 text-primary font-black">Facturación ($)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                            {loadingPlanning ? (
                                <tr>
                                    <td colSpan={19} className="py-12 text-center text-gray-400">
                                        <Loader2 className="animate-spin inline-block mr-2" size={16} /> Cargando datos consolidados...
                                    </td>
                                </tr>
                            ) : consolidatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={19} className="py-12 text-center text-gray-400 font-medium">
                                        No hay datos en el rango seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                consolidatedData.map(row => {
                                    return (
                                        <tr key={row.date} className="hover:bg-gray-55/40 dark:hover:bg-gray-955/20 transition-all">
                                            {/* Date */}
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-100 dark:border-gray-800">
                                                {new Date(row.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                            </td>
                                            
                                            {/* Planning Details */}
                                            <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                {row.hasPlan && row.plan.plc > 0 ? row.plan.plc : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                {row.hasPlan && row.plan.sm > 0 ? row.plan.sm : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                {row.hasPlan && row.plan.cnPlanta > 0 ? row.plan.cnPlanta : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                {row.hasPlan && row.plan.cenas > 0 ? row.plan.cenas : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                {row.hasPlan && row.plan.sc > 0 ? row.plan.sc : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                {row.hasPlan && row.plan.conc > 0 ? row.plan.conc : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                {row.hasPlan && row.plan.cnExt > 0 ? row.plan.cnExt : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                {row.hasPlan && row.plan.csExt > 0 ? row.plan.csExt : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center bg-blue-50/10 dark:bg-blue-955/10 border-r border-gray-100 dark:border-gray-800 text-blue-600 font-bold">
                                                {row.hasPlan && row.plan.total > 0 ? row.plan.total : '-'}
                                            </td>

                                            {/* Real Daily Log details */}
                                            <td className="px-2 py-4 text-center text-gray-700 dark:text-gray-300 bg-emerald-50/5 dark:bg-emerald-955/5">
                                                {row.hasLog && row.real.t1 !== null ? row.real.t1 : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-700 dark:text-gray-300 bg-emerald-50/5 dark:bg-emerald-955/5">
                                                {row.hasLog && row.real.t2 !== null ? row.real.t2 : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-700 dark:text-gray-300 bg-emerald-50/5 dark:bg-emerald-955/5">
                                                {row.hasLog && row.real.t3 !== null ? row.real.t3 : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-700 dark:text-gray-300 bg-emerald-50/5 dark:bg-emerald-955/5">
                                                {row.hasLog && row.real.t4 !== null ? row.real.t4 : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center text-gray-700 dark:text-gray-300 bg-emerald-50/5 dark:bg-emerald-955/5">
                                                {row.hasLog && row.real.manual !== null ? row.real.manual : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-center bg-emerald-50/10 dark:bg-emerald-955/10 text-emerald-600 font-bold">
                                                {row.hasLog && row.real.lunchSold > 0 ? row.real.lunchSold : '-'}
                                            </td>
                                            <td className="px-2 py-4 text-right bg-emerald-50/10 dark:bg-emerald-955/10 border-r border-gray-100 dark:border-gray-800 text-emerald-600 font-bold">
                                                {row.hasLog && row.real.breakfastRevenue > 0 ? formatPrice(row.real.breakfastRevenue) : '-'}
                                            </td>

                                            {/* Consolidado General */}
                                            <td className="px-3 py-4 text-center bg-primary/5 text-primary font-black">
                                                {row.totalGral > 0 ? row.totalGral : '-'}
                                            </td>
                                            <td className="px-3 py-4 text-right bg-primary/10 text-primary font-black">
                                                {row.billing > 0 ? formatPrice(row.billing) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function DailyRecordsView() {
    const { formatPrice } = useCurrency();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'planning' | 'report'>('list');
    const [editingLog, setEditingLog] = useState<any>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await inventoryApi.getDailyLogs();
            setLogs(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching daily logs:', error);
            toast.error('No se pudieron cargar los registros');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
        try {
            await inventoryApi.deleteDailyLog(id);
            toast.success('Registro eliminado');
            fetchLogs();
        } catch (error) {
            toast.error('Error al eliminar el registro');
        }
    };

    if (loading && logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-gray-400 font-medium text-sm">Cargando registros...</p>
            </div>
        );
    }

    const sortedLogs = Array.isArray(logs) ? [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date)) : [];
    const filteredLogs = sortedLogs.filter(log =>
        log.log_date && log.log_date.includes(searchTerm)
    );

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr + 'T12:00:00');
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    // Stats calculation for the cards
    const totalLunch = logs.reduce((acc, curr) => acc + (curr.lunch_sold || 0), 0);
    const totalBreakfast = logs.reduce((acc, curr) => acc + (curr.breakfast_revenue || 0), 0);
    const totalDelivery = logs.reduce((acc, curr) => acc + (curr.delivery_revenue || 0), 0);

    const StatCard = ({ title, value, icon: Icon, color, bg, trend, sparkData }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] dark:shadow-none flex flex-col gap-4"
        >
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${bg} dark:bg-opacity-10`}>
                    <Icon size={20} className={color} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`flex items-center gap-0.5 text-xs font-bold ${trend?.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend?.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trend}
                </span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Este mes</span>
            </div>
            <div className="mt-2 h-8 w-full overflow-hidden rounded-lg">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData}>
                        <Area
                            type="monotone"
                            dataKey="val"
                            stroke={color?.includes('emerald') ? '#10b981' : color?.includes('blue') ? '#3b82f6' : '#f59e0b'}
                            fill={color?.includes('emerald') ? '#dcfce7' : color?.includes('blue') ? '#dbeafe' : '#fef3c7'}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0E14] font-sans antialiased text-gray-700">
            <div className="p-10 max-w-[1600px] mx-auto">
                <AnimatePresence mode="wait">
                    {viewMode === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-10"
                        >
                            {/* Cabecera Refinada */}
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Registro de Operaciones</h1>
                                    <p className="text-gray-500 text-sm mt-1 font-medium">Historial diario de platos, ingresos y logística de Arregui Hub.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setViewMode('report')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-55 dark:hover:bg-gray-750 transition-all active:scale-95 shadow-sm"
                                    >
                                        <FileText size={18} strokeWidth={2} className="text-blue-500" />
                                        Reporte de Servicios
                                    </button>
                                    <button
                                        onClick={() => setViewMode('planning')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-55 dark:hover:bg-gray-750 transition-all active:scale-95 shadow-sm"
                                    >
                                        <CalendarCheck size={18} strokeWidth={2} className="text-emerald-500" />
                                        Planificación Semanal
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingLog(null);
                                            setViewMode('form');
                                        }}
                                        className="flex items-center gap-2.5 px-6 py-2.5 bg-[#4CAF50] hover:bg-[#43a047] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95"
                                    >
                                        <Plus size={18} strokeWidth={2.5} />
                                        Nuevo Registro
                                    </button>
                                    <button
                                        onClick={fetchLogs}
                                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:bg-gray-55 dark:hover:bg-gray-700 transition-all shadow-sm"
                                    >
                                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            {/* KPIs al estilo Dashboard */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <StatCard
                                    title="Almuerzos Vendidos"
                                    value={totalLunch.toLocaleString()}
                                    icon={Utensils}
                                    color="text-emerald-500"
                                    bg="bg-emerald-50"
                                    trend="+14.2%"
                                    sparkData={sortedLogs.slice(-7).reverse().map(l => ({ val: l.lunch_sold || 0 }))}
                                />
                                <StatCard
                                    title="Ingresos Desayunos"
                                    value={formatPrice(totalBreakfast)}
                                    icon={DollarSign}
                                    color="text-amber-600"
                                    bg="bg-amber-50"
                                    trend="+5.8%"
                                    sparkData={sortedLogs.slice(-7).reverse().map(l => ({ val: l.breakfast_revenue || 0 }))}
                                />
                                <StatCard
                                    title="Facturación de Delivery"
                                    value={formatPrice(totalDelivery)}
                                    icon={Truck}
                                    color="text-blue-500"
                                    bg="bg-blue-50"
                                    trend="+22.1%"
                                    sparkData={sortedLogs.slice(-7).reverse().map(l => ({ val: l.delivery_revenue || 0 }))}
                                />
                            </div>

                            {/* Listado de Registros */}
                            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-gray-55 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
                                    <div className="relative group max-w-md w-full">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por fecha (AAAA-MM-DD)..."
                                            className="w-full pl-12 pr-6 py-3 bg-white dark:bg-gray-905 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/10 transition-all font-semibold text-sm outline-none placeholder:text-gray-300"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-2">
                                        <Activity size={14} className="text-primary" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{filteredLogs.length} Registros</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto min-h-[400px]">
                                    <table className="w-full border-separate border-spacing-y-0">
                                        <thead>
                                            <tr className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.15em] border-b border-gray-50">
                                                <th className="px-10 py-6 text-left font-black">Fecha</th>
                                                <th className="px-8 py-6 text-center font-black">Venta Almuerzos</th>
                                                <th className="px-8 py-6 text-right font-black">Desayunos</th>
                                                <th className="px-8 py-6 text-right font-black">Delivery</th>
                                                <th className="px-10 py-6 text-right sr-only">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
                                            <AnimatePresence mode="popLayout">
                                                {filteredLogs.map((log) => (
                                                    <motion.tr
                                                        key={log.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="group hover:bg-gray-55/40 dark:hover:bg-gray-900/40 transition-all"
                                                    >
                                                        <td className="px-10 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-2.5 bg-gray-55 dark:bg-gray-700/50 rounded-xl text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                                                    <Calendar size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900 dark:text-white capitalize">{formatDate(log.log_date)}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 max-w-[240px] truncate" title={parseObservations(log.observations).cleanObs.trim()}>
                                                                        {parseObservations(log.observations).cleanObs.trim() ? 'Completado' : 'Sin notas'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-1.5 rounded-full text-emerald-600 font-bold text-xs border border-emerald-100 dark:border-emerald-900/20">
                                                                    <Utensils size={12} />
                                                                    {log.lunch_sold} platos
                                                                </div>
                                                                {(() => {
                                                                    const parsed = parseObservations(log.observations);
                                                                    if (parsed.t1 !== null || parsed.t2 !== null || parsed.t3 !== null || parsed.t4 !== null || parsed.manual !== null) {
                                                                        const hasT3orT4 = parsed.t3 !== null || parsed.t4 !== null;
                                                                        return (
                                                                            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold tracking-wider whitespace-nowrap">
                                                                                {hasT3orT4 ? (
                                                                                    `T1: ${parsed.t1 ?? 0} • T2: ${parsed.t2 ?? 0} • T3: ${parsed.t3 ?? 0} • T4: ${parsed.t4 ?? 0} • Man: ${parsed.manual ?? 0}`
                                                                                ) : (
                                                                                    `T1: ${parsed.t1 ?? 0} • T2: ${parsed.t2 ?? 0} • Man: ${parsed.manual ?? 0}`
                                                                                )}
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <p className="font-bold text-gray-900 dark:text-white tracking-tight">
                                                                    {formatPrice(log.breakfast_revenue || 0)}
                                                                </p>
                                                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Caja Diaria</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <p className="font-bold text-primary tracking-tight">
                                                                    {formatPrice(log.delivery_revenue || 0)}
                                                                </p>
                                                                <span className="text-[9px] font-bold text-primary/40 uppercase tracking-tighter">Facturación</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingLog(log);
                                                                        setViewMode('form');
                                                                    }}
                                                                    className="p-2.5 text-gray-400 hover:text-primary hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all"
                                                                >
                                                                    <Edit2 size={15} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(log.id)}
                                                                    className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                            {!loading && filteredLogs.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-24 text-center">
                                                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-gray-200">
                                                            <Calendar size={40} />
                                                        </div>
                                                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Sin registros</h3>
                                                        <p className="text-gray-400 text-sm font-medium mt-1">No hay datos operativos disponibles</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {viewMode === 'form' && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                        >
                            <DailyRecordForm
                                initialData={editingLog}
                                onClose={() => setViewMode('list')}
                                onSuccess={() => {
                                    setViewMode('list');
                                    fetchLogs();
                                }}
                            />
                        </motion.div>
                    )}
                    {viewMode === 'planning' && (
                        <motion.div
                            key="planning"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                        >
                            <WeeklyPlanning
                                onClose={() => setViewMode('list')}
                            />
                        </motion.div>
                    )}
                    {viewMode === 'report' && (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                        >
                            <WeeklyReportView
                                logs={logs}
                                onClose={() => setViewMode('list')}
                                formatPrice={formatPrice}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
