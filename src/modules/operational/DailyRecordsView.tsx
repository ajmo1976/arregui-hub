import React, { useState, useEffect, useMemo } from 'react';
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
import MultiTypeRecordForm from './MultiTypeRecordForm';
import SingleRecordEditForm from './SingleRecordEditForm';
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

function ServiciosEspecialesDetailTable({ consolidatedData }: { consolidatedData: any[] }) {
    const dates = consolidatedData.map(d => d.date);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm z-10" rowSpan={2}>Fecha</th>
                        <th className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-b border-gray-100 dark:border-gray-800" colSpan={2}>Choferes</th>
                        <th className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-b border-gray-100 dark:border-gray-800">Pepsico</th>
                        <th className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-b border-gray-100 dark:border-gray-800" colSpan={2}>Quintas</th>
                        <th className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-b border-gray-100 dark:border-gray-800">Pilotos</th>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Cenas (Cant)</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-100 dark:border-gray-800">Desayunos ($)</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-100 dark:border-gray-800">Desayunos ($)</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Cenas (Cant)</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-100 dark:border-gray-800">Desayunos ($)</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Almuerzos (Cant)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {consolidatedData.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">
                                No hay datos de Servicios Especiales para este rango de fechas.
                            </td>
                        </tr>
                    ) : (
                        consolidatedData.map((row, i) => {
                            const data = row.especialesData || {};
                            const [y, m, d] = row.date.split('-');
                            const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                            const dayName = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][dObj.getDay()];
                            return (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-900 z-10 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 whitespace-nowrap">
                                        <span className="text-gray-400 mr-2 text-xs">{dayName}</span>{d}/{m}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white">{data.choferes?.cenas || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-800">{data.choferes?.desayunos || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-800">{data.pepsico?.desayunos || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white">{data.quintas?.cenas || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-800">{data.quintas?.desayunos || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white">{data.pilotos?.almuerzos || '-'}</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

function WeeklyReportView({ logs, onClose, formatPrice }: WeeklyReportViewProps) {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 10); // Default to last 10 days
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [planningDetails, setPlanningDetails] = useState<any[]>([]);
    const [prices, setPrices] = useState<any[]>([]);
    const [loadingPlanning, setLoadingPlanning] = useState(false);
    const [activeTab, setActiveTab] = useState<'resumen' | 'metropolitano' | 'cep' | 'quintas' | 'registros'>('resumen');

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
            
            const planningEvents = res.data.filter((ev: any) => ev.company === 'Planificación');
            
            const details: any[] = [];
            planningEvents.forEach((ev: any) => {
                (ev.details || []).forEach((d: any) => {
                    let plc = 0, sm = 0, cnPlanta = 0, cenas = 0, sc = 0, conc = 0, cnExt = 0, csExt = 0;
                    let sistemasCep = 0, seguridadPlc = 0, seguridadRuices = 0, seguridadCentralCep = 0;
                    let especialesData = null;
                    let totalEspeciales = 0;

                    if (d.structured_data && Object.keys(d.structured_data).length > 0) {
                        const sd = d.structured_data;
                        if (d.service_category_id === 4 || (ev.cost_center === 'Metropolitano')) {
                            plc = parseInt(sd.plc) || 0;
                            sm = parseInt(sd.sm) || 0;
                            cnPlanta = parseInt(sd.cnPlanta) || 0;
                            cenas = parseInt(sd.cenas) || 0;
                            sc = parseInt(sd.sc) || 0;
                            conc = parseInt(sd.conc) || 0;
                            cnExt = parseInt(sd.cnExt) || 0;
                            csExt = parseInt(sd.csExt) || 0;
                        } else if (d.service_category_id === 3 || (ev.cost_center === 'CEP')) {
                            sistemasCep = parseInt(sd.sistemasCep) || 0;
                            seguridadPlc = parseInt(sd.segPlc) || 0;
                            seguridadRuices = parseInt(sd.segRuices) || 0;
                            seguridadCentralCep = parseInt(sd.segCentral) || 0;
                        } else if (d.service_category_id === 2 || (ev.cost_center === 'Quintas' || ev.cost_center === 'Servicios Especiales')) {
                            especialesData = sd;
                            totalEspeciales = (parseInt(sd.choferes?.cenas)||0) + (parseInt(sd.quintas?.cenas)||0) + (parseInt(sd.pilotos?.almuerzos)||0);
                        }
                    } else {
                        const obs = d.observations || '';
                        const matchCep = obs.match(/\[DESGLOSE_PLANIFICACION_CEP:\s*SISTEMAS_CEP=(\d+),\s*SEG_PLC=(\d+),\s*SEG_RUICES=(\d+),\s*SEG_CENTRAL=(\d+)\]/);
                        const match = obs.match(/\[DESGLOSE_PLANIFICACION:\s*PLC=(\d+),\s*SM=(\d+),\s*CN_PLANTA=(\d+),\s*CENAS=(\d+),\s*SC=(\d+),\s*CONC=(\d+),\s*CN_EXT=(\d+),\s*CS_EXT=(\d+)\]/);
                        const matchEspeciales = obs.match(/\[JSON_ESPECIALES:(.*)\]/);

                        if (matchEspeciales) {
                            try {
                                const data = JSON.parse(matchEspeciales[1]);
                                especialesData = data;
                                totalEspeciales = (parseInt(data.choferes?.cenas)||0) + (parseInt(data.quintas?.cenas)||0) + (parseInt(data.pilotos?.almuerzos)||0);
                            } catch (e) {
                                console.error('Error parsing Especiales JSON', e);
                            }
                        } else if (matchCep) {
                            sistemasCep = parseInt(matchCep[1]);
                            seguridadPlc = parseInt(matchCep[2]);
                            seguridadRuices = parseInt(matchCep[3]);
                            seguridadCentralCep = parseInt(matchCep[4]);
                        } else if (match) {
                            plc = parseInt(match[1]);
                            sm = parseInt(match[2]);
                            cnPlanta = parseInt(match[3]);
                            cenas = parseInt(match[4]);
                            sc = parseInt(match[5]);
                            conc = parseInt(match[6]);
                            cnExt = parseInt(match[7]);
                            csExt = parseInt(match[8]);
                        } else {
                            const f1 = obs.match(/SISTEMAS_CEP=(\d+)/);
                            const f2 = obs.match(/SEG_PLC=(\d+)/);
                            const f3 = obs.match(/SEG_RUICES=(\d+)/);
                            const f4 = obs.match(/SEG_CENTRAL=(\d+)/);
                            if (f1 || f2 || f3 || f4) {
                                sistemasCep = f1 ? parseInt(f1[1]) : 0;
                                seguridadPlc = f2 ? parseInt(f2[1]) : 0;
                                seguridadRuices = f3 ? parseInt(f3[1]) : 0;
                                seguridadCentralCep = f4 ? parseInt(f4[1]) : 0;
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
                        }
                    }
                    
                    details.push({
                        date: d.service_date.substring(0, 10),
                        plc,
                        sm,
                        cnPlanta,
                        cenas,
                        sc,
                        conc,
                        cnExt,
                        csExt,
                        sistemasCep,
                        seguridadPlc,
                        seguridadRuices,
                        seguridadCentralCep,
                        totalEspeciales,
                        especialesData,
                        total: d.attendees || (plc + sm + cnPlanta + cenas + sc + conc + cnExt + csExt + sistemasCep + seguridadPlc + seguridadRuices + seguridadCentralCep + totalEspeciales)
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

    // Helper for robust date comparison
    const isDateInRange = (dateStr: string, start: string, end: string) => {
        if (!dateStr) return false;
        if (!start && !end) return true;
        
        try {
            const d = new Date(dateStr + 'T12:00:00').getTime();
            const s = start ? new Date(start + 'T00:00:00').getTime() : 0;
            const e = end ? new Date(end + 'T23:59:59').getTime() : Infinity;
            return d >= s && d <= e;
        } catch (e) {
            return false;
        }
    };

    // Filter logs in range
    const logsInRange = logs.filter(log => {
        const d = log.log_date.substring(0, 10);
        return isDateInRange(d, startDate, endDate);
    });

    // Get union of all dates in range
    const allDates = Array.from(new Set([
        ...logsInRange.map(l => l.log_date.substring(0, 10)),
        ...planningDetails.filter(p => isDateInRange(p.date, startDate, endDate)).map(p => p.date)
    ])).sort();

    // Map comparative data by date
    const consolidatedData = allDates.map(date => {
        // Daily Log (Real)
        const log = logsInRange.find(l => l.log_date.substring(0, 10) === date);
        const sdLog = log?.structured_data || {};
        const real = {
            t1: sdLog.t1 ?? (log ? parseObservations(log.observations).t1 : null),
            t2: sdLog.t2 ?? (log ? parseObservations(log.observations).t2 : null),
            t3: sdLog.t3 ?? (log ? parseObservations(log.observations).t3 : null),
            t4: sdLog.t4 ?? (log ? parseObservations(log.observations).t4 : null),
            manual: sdLog.manual ?? (log ? parseObservations(log.observations).manual : null),
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
            sistemasCep: plans.reduce((acc, p) => acc + p.sistemasCep || 0, 0),
            seguridadPlc: plans.reduce((acc, p) => acc + p.seguridadPlc || 0, 0),
            seguridadRuices: plans.reduce((acc, p) => acc + p.seguridadRuices || 0, 0),
            seguridadCentralCep: plans.reduce((acc, p) => acc + p.seguridadCentralCep || 0, 0),
            quintas: plans.reduce((acc, p) => acc + (p.totalEspeciales || 0), 0),
            total: plans.reduce((acc, p) => acc + p.total, 0)
        };

        const totalCep = plan.sistemasCep + plan.seguridadPlc + plan.seguridadRuices + plan.seguridadCentralCep;
        const totalMetro = plan.plc + plan.sm + plan.cnPlanta + plan.cenas + plan.sc + plan.conc + plan.cnExt + plan.csExt;

        // Total Gral: Sum of dining room (real lunchSold if logged, otherwise fallback to planned plc) + all planned delivery columns
        const diningRoomTotal = log ? real.lunchSold : plan.plc;
        const totalGral = diningRoomTotal + plan.sm + plan.cnPlanta + plan.cenas + plan.sc + plan.conc + plan.cnExt + plan.csExt + plan.sistemasCep + plan.seguridadPlc + plan.seguridadRuices + plan.seguridadCentralCep + plan.quintas;
        
        // Resolve meal price for this date
        const mealPrice = getPriceForDate(prices, date);
        const billing = totalGral * mealPrice;

        const especialesDataForDate = plans.find(p => p.especialesData)?.especialesData || null;

        return {
            date,
            plan,
            real,
            totalCep,
            totalMetro,
            totalQuintas: plan.quintas,
            especialesData: especialesDataForDate,
            totalGral,
            mealPrice,
            billing,
            hasLog: !!log,
            hasPlan: plans.length > 0
        };
    });

    const isResumen = activeTab === 'resumen';
    const showCepDetails = activeTab === 'cep';
    const showMetroDetails = activeTab === 'metropolitano';
    const showRegistrosDetails = activeTab === 'registros';
    
    const showCepTotal = isResumen || activeTab === 'cep';
    const showMetroTotal = isResumen || activeTab === 'metropolitano';
    const showQuintasTotal = isResumen || activeTab === 'quintas';
    const showRegistrosTotal = isResumen || activeTab === 'registros';
    const showTotals = isResumen;

    // KPIs
    const totalServings = consolidatedData.reduce((acc, row) => {
        if (activeTab === 'resumen') return acc + row.totalGral;
        if (activeTab === 'metropolitano') {
            const diningRoomTotal = row.real.lunchSold || row.plan.plc;
            return acc + diningRoomTotal + row.plan.sm + row.plan.cnPlanta + row.plan.cenas + row.plan.sc + row.plan.conc + row.plan.cnExt + row.plan.csExt;
        }
        if (activeTab === 'cep') return acc + row.totalCep;
        if (activeTab === 'registros') return acc + (row.real.lunchSold || row.plan.plc);
        if (activeTab === 'quintas') return acc + row.totalQuintas;
        return acc;
    }, 0);

    const totalBillingIncome = consolidatedData.reduce((acc, row) => {
        const mealPrice = getPriceForDate(prices, row.date);
        
        if (activeTab === 'resumen') return acc + row.billing;
        if (activeTab === 'metropolitano') return acc + (row.totalMetro * mealPrice);
        if (activeTab === 'cep') return acc + (row.totalCep * mealPrice);
        if (activeTab === 'registros') return acc + ((row.real.lunchSold || row.plan.plc) * mealPrice);
        if (activeTab === 'quintas') return acc + (row.totalQuintas * mealPrice);
        return acc;
    }, 0);

    const totalBreakfastIncome = consolidatedData.reduce((acc, row) => {
        if (activeTab === 'resumen' || activeTab === 'registros') return acc + row.real.breakfastRevenue;
        if (activeTab === 'quintas') {
            const data = row.especialesData || {};
            const choferes = parseFloat(data.choferes?.desayunos) || 0;
            const pepsico = parseFloat(data.pepsico?.desayunos) || 0;
            const quintas = parseFloat(data.quintas?.desayunos) || 0;
            return acc + choferes + pepsico + quintas;
        }
        return acc;
    }, 0);

    const totalPlanServings = consolidatedData.reduce((acc, row) => {
        if (activeTab === 'resumen') return acc + row.totalMetro + row.totalCep + row.totalQuintas;
        if (activeTab === 'metropolitano') return acc + row.totalMetro;
        if (activeTab === 'cep') return acc + row.totalCep;
        if (activeTab === 'registros') return acc + row.plan.plc;
        if (activeTab === 'quintas') return acc + row.totalQuintas;
        return acc;
    }, 0);



    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fecha,PLAN_SISTEMAS_CEP,PLAN_SEGURIDAD_PLC,PLAN_SEGURIDAD_RUICES,PLAN_SEGURIDAD_CENTRAL_CEP,TOTAL_CEP,PLAN_PLC,PLAN_SM,PLAN_COLNORTE,PLAN_CENAS,PLAN_SOBRE_CENAS,PLAN_CONCENTRADOS,PLAN_COL_NORTE_EXT,PLAN_COLSUR,TOTAL_METRO,REAL_T1,REAL_T2,REAL_T3,REAL_T4,REAL_MANUAL,TOTAL_ALMUERZOS_REAL,DESAYUNOS_REAL,TOTAL_GENERAL,COSTO_PLATO,FACTURACION\n";
        
        consolidatedData.forEach(row => {
            csvContent += `${row.date},${row.plan.sistemasCep},${row.plan.seguridadPlc},${row.plan.seguridadRuices},${row.plan.seguridadCentralCep},${row.totalCep},${row.plan.plc},${row.plan.sm},${row.plan.cnPlanta},${row.plan.cenas},${row.plan.sc},${row.plan.conc},${row.plan.cnExt},${row.plan.csExt},${row.totalMetro},${row.real.t1 ?? 0},${row.real.t2 ?? 0},${row.real.t3 ?? 0},${row.real.t4 ?? 0},${row.real.manual ?? 0},${row.real.lunchSold},${row.real.breakfastRevenue},${row.totalGral},${row.mealPrice},${row.billing}\n`;
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
                            Reporte de Servicios: Delivery + Almuerzos
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

            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('resumen')}
                    className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'resumen' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Resumen
                </button>
                <button
                    onClick={() => setActiveTab('metropolitano')}
                    className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'metropolitano' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Metropolitano
                </button>
                <button
                    onClick={() => setActiveTab('cep')}
                    className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'cep' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    CEP
                </button>
                <button
                    onClick={() => setActiveTab('quintas')}
                    className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'quintas' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Servicios Especiales
                </button>
                <button
                    onClick={() => setActiveTab('registros')}
                    className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'registros' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Almuerzos Comedor
                </button>
            </div>

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
                {(activeTab === 'resumen' || activeTab === 'registros') && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            {activeTab === 'resumen' ? 'Total Servido (Comedor + Delivery)' : 'Total Servido Comedor'}
                        </p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalServings.toLocaleString()} <span className="text-xs font-normal text-gray-400">platos</span></h3>
                    </div>
                )}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Facturación Total</p>
                    <h3 className="text-2xl font-bold text-primary mt-1">{formatPrice(totalBillingIncome)}</h3>
                </div>
                {activeTab !== 'registros' && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Delivery</p>
                        <h3 className="text-2xl font-bold text-blue-500 mt-1">{totalPlanServings.toLocaleString()} <span className="text-xs font-normal text-gray-400">platos</span></h3>
                    </div>
                )}
                {(activeTab === 'resumen' || activeTab === 'registros' || activeTab === 'quintas') && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ingreso Desayunos</p>
                        <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1">
                            {formatPrice(totalBreakfastIncome)}
                        </h3>
                    </div>
                )}
            </div>

            {/* Main Comparative Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                {activeTab === 'quintas' ? (
                    <ServiciosEspecialesDetailTable consolidatedData={consolidatedData} />
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto min-w-[1500px]">
                        <thead>
                            {/* Group Headers */}
                            <tr className="bg-gray-55 dark:bg-gray-955 text-[9px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800" rowSpan={isResumen ? 1 : 2}>Fecha</th>
                                {showCepDetails && (
                                    <th className="px-3 py-3 text-center bg-blue-50/15 dark:bg-blue-955/5 text-blue-600 dark:text-blue-400" colSpan={4}>
                                        Planificación CEP
                                    </th>
                                )}
                                {showCepTotal && (
                                    <th className="px-3 py-3 text-center bg-blue-50/20 dark:bg-blue-955/10 border-r border-gray-100 dark:border-gray-800 text-blue-700 dark:text-blue-300 font-black" rowSpan={isResumen ? 1 : 2}>
                                        Total CEP
                                    </th>
                                )}
                                {showMetroDetails && (
                                    <th className="px-3 py-3 text-center bg-blue-50/10 dark:bg-blue-955/5 text-blue-600 dark:text-blue-400" colSpan={8}>
                                        Planificación Metropolitana
                                    </th>
                                )}
                                {showMetroTotal && (
                                    <th className="px-3 py-3 text-center bg-blue-50/20 dark:bg-blue-955/10 border-r border-gray-100 dark:border-gray-800 text-blue-700 dark:text-blue-300 font-black" rowSpan={isResumen ? 1 : 2}>
                                        Total Metro
                                    </th>
                                )}
                                {showQuintasTotal && (
                                    <th className="px-3 py-3 text-center bg-purple-50/20 dark:bg-purple-955/10 border-r border-gray-100 dark:border-gray-800 text-purple-700 dark:text-purple-300 font-black" rowSpan={isResumen ? 1 : 2}>
                                        Total Serv. Especiales
                                    </th>
                                )}
                                {showRegistrosDetails && (
                                    <th className="px-3 py-3 text-center bg-emerald-50/15 dark:bg-emerald-955/5 text-emerald-600 dark:text-emerald-400" colSpan={5}>
                                        Almuerzos Comedor
                                    </th>
                                )}
                                {showRegistrosTotal && (
                                    <>
                                        <th className="px-3 py-3 text-center bg-emerald-50/20 dark:bg-emerald-955/10 text-emerald-700 dark:text-emerald-300 font-black" rowSpan={isResumen ? 1 : 2}>
                                            Total Registros
                                        </th>
                                        <th className="px-3 py-3 text-right bg-emerald-50/20 dark:bg-emerald-955/10 border-r border-gray-100 dark:border-gray-800 text-emerald-700 dark:text-emerald-300 font-black" rowSpan={isResumen ? 1 : 2}>
                                            Desayunos ($)
                                        </th>
                                    </>
                                )}
                                {showTotals && (
                                    <>
                                        <th className="px-3 py-3 text-center bg-primary/5 text-primary font-black" rowSpan={isResumen ? 1 : 2}>
                                            Total Gral
                                        </th>
                                        <th className="px-3 py-3 text-right bg-primary/10 text-primary font-black" rowSpan={isResumen ? 1 : 2}>
                                            Facturación ($)
                                        </th>
                                    </>
                                )}
                            </tr>
                            {/* Detailed Headers */}
                            {!isResumen && (
                                <tr className="bg-gray-55/50 dark:bg-gray-955/50 text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                    {/* CEP detailed */}
                                    {showCepDetails && (
                                        <>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5 text-blue-600">Sist. CEP</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5 text-blue-600">Seg. PLC</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5 text-blue-600">Seg. Ruices</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5 text-blue-600">Seg. Central</th>
                                        </>
                                    )}

                                    {/* Metropolitana detailed */}
                                    {showMetroDetails && (
                                        <>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">PLC</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">SM (Almuerzos)</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">SM (Cenas)</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">SM (Sobre Cenas)</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">ColNorte</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">Concentrados</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">Col Norte (Ext)</th>
                                            <th className="px-2 py-3 text-center bg-blue-50/5 dark:bg-blue-955/5">ColSur</th>
                                        </>
                                    )}
                                    
                                    {/* Real detailed */}
                                    {showRegistrosDetails && (
                                        <>
                                            <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">T1</th>
                                            <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">T2</th>
                                            <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">T3</th>
                                            <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">T4</th>
                                            <th className="px-2 py-3 text-center bg-emerald-50/5 dark:bg-emerald-955/5">Manual</th>
                                        </>
                                    )}
                                </tr>
                            )}

                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                            {loadingPlanning ? (
                                <tr>
                                    <td colSpan={24} className="py-12 text-center text-gray-400">
                                        <Loader2 className="animate-spin inline-block mr-2" size={16} /> Cargando datos consolidados...
                                    </td>
                                </tr>
                            ) : consolidatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={24} className="py-12 text-center text-gray-400 font-medium">
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
                                            
                                            {/* CEP columns */}
                                            {showCepDetails && (
                                                <>
                                                    <td className="px-2 py-4 text-center text-blue-600 font-medium bg-blue-50/5 dark:bg-blue-955/5">
                                                        {row.hasPlan && row.plan.sistemasCep > 0 ? row.plan.sistemasCep : '-'}
                                                    </td>
                                                    <td className="px-2 py-4 text-center text-blue-600 font-medium bg-blue-50/5 dark:bg-blue-955/5">
                                                        {row.hasPlan && row.plan.seguridadPlc > 0 ? row.plan.seguridadPlc : '-'}
                                                    </td>
                                                    <td className="px-2 py-4 text-center text-blue-600 font-medium bg-blue-50/5 dark:bg-blue-955/5">
                                                        {row.hasPlan && row.plan.seguridadRuices > 0 ? row.plan.seguridadRuices : '-'}
                                                    </td>
                                                    <td className="px-2 py-4 text-center text-blue-600 font-medium bg-blue-50/5 dark:bg-blue-955/5">
                                                        {row.hasPlan && row.plan.seguridadCentralCep > 0 ? row.plan.seguridadCentralCep : '-'}
                                                    </td>
                                                </>
                                            )}
                                            {/* Total CEP */}
                                            {showCepTotal && (
                                                <td className="px-2 py-4 text-center bg-blue-50/15 dark:bg-blue-955/10 border-r border-gray-100 dark:border-gray-800 text-blue-700 dark:text-blue-400 font-black">
                                                    {row.hasPlan && row.totalCep > 0 ? row.totalCep : '-'}
                                                </td>
                                            )}
                                            
                                            {/* Planificación Metropolitana */}
                                            {showMetroDetails && (
                                                <>
                                                    <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                        {row.hasPlan && row.plan.plc > 0 ? row.plan.plc : '-'}
                                                    </td>
                                                    <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                        {row.hasPlan && row.plan.sm > 0 ? row.plan.sm : '-'}
                                                    </td>
                                                    <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                        {row.hasPlan && row.plan.cenas > 0 ? row.plan.cenas : '-'}
                                                    </td>
                                                    <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                        {row.hasPlan && row.plan.sc > 0 ? row.plan.sc : '-'}
                                                    </td>
                                                    <td className="px-2 py-4 text-center text-gray-600 dark:text-gray-400 bg-blue-50/5 dark:bg-blue-955/5">
                                                        {row.hasPlan && row.plan.cnPlanta > 0 ? row.plan.cnPlanta : '-'}
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
                                                </>
                                            )}
                                            {/* Total Metropolitano */}
                                            {showMetroTotal && (
                                                <td className="px-2 py-4 text-center bg-blue-50/15 dark:bg-blue-955/10 border-r border-gray-100 dark:border-gray-800 text-blue-700 dark:text-blue-400 font-black">
                                                    {row.hasPlan && row.totalMetro > 0 ? row.totalMetro : '-'}
                                                </td>
                                            )}
                                            {/* Total Quintas */}
                                            {showQuintasTotal && (
                                                <td className="px-2 py-4 text-center bg-purple-50/15 dark:bg-purple-955/10 border-r border-gray-100 dark:border-gray-800 text-purple-700 dark:text-purple-400 font-black">
                                                    {row.hasPlan && row.totalQuintas > 0 ? row.totalQuintas : '-'}
                                                </td>
                                            )}

                                            {/* Real Daily Log details */}
                                            {showRegistrosDetails && (
                                                <>
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
                                                </>
                                            )}
                                            {/* Total Registros */}
                                            {showRegistrosTotal && (
                                                <>
                                                    <td className="px-2 py-4 text-center bg-emerald-50/10 dark:bg-emerald-955/10 text-emerald-600 font-bold">
                                                        {row.hasLog && row.real.lunchSold > 0 ? row.real.lunchSold : '-'}
                                                    </td>
                                                    {/* Desayunos ($) */}
                                                    <td className="px-2 py-4 text-right bg-emerald-50/10 dark:bg-emerald-955/10 border-r border-gray-100 dark:border-gray-800 text-emerald-600 font-bold">
                                                        {row.hasLog && row.real.breakfastRevenue > 0 ? formatPrice(row.real.breakfastRevenue) : '-'}
                                                    </td>
                                                </>
                                            )}

                                            {/* Consolidado General */}
                                            {showTotals && (
                                                <>
                                                    <td className="px-3 py-4 text-center bg-primary/5 text-primary font-black">
                                                        {row.totalGral > 0 ? row.totalGral : '-'}
                                                    </td>
                                                    <td className="px-3 py-4 text-right bg-primary/10 text-primary font-black">
                                                        {row.billing > 0 ? formatPrice(row.billing) : '-'}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    </div>
                )}
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
    const [activeListTab, setActiveListTab] = useState<'diario' | 'metropolitano' | 'cep' | 'quintas'>('diario');
    const [planningEvents, setPlanningEvents] = useState<any[]>([]);
    const [editingConfig, setEditingConfig] = useState<{type: 'metropolitano' | 'cep' | 'quintas' | 'diario' | '', date: string} | null>(null);
    const [prices, setPrices] = useState<any[]>([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const [logsRes, eventsRes, pricesRes] = await Promise.all([
                inventoryApi.getDailyLogs(),
                inventoryApi.getServiceEvents(),
                inventoryApi.getMealPrices().catch(() => ({ data: [] }))
            ]);
            setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
            setPlanningEvents(Array.isArray(eventsRes.data) ? eventsRes.data.filter((ev: any) => ev.company === 'Planificación') : []);
            setPrices(pricesRes?.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('No se pudieron cargar los registros');
            setLogs([]);
            setPlanningEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEditPlanning = (type: 'metropolitano' | 'cep' | 'quintas', date: string) => {
        setEditingLog(null);
        setEditingConfig({ type, date });
        setViewMode('form');
    };

    const parsedPlannings = useMemo(() => {
        const detailsMap = new Map<string, any>();
        planningEvents.forEach((ev: any) => {
            if (!ev.details) return;
            const isMetropolitano = ev.cost_center === 'Metropolitano';
            const isCep = ev.cost_center === 'CEP';
            const isEspecial = ev.cost_center === 'Servicios Especiales' || ev.cost_center === 'Quintas' || (ev.title && (ev.title.includes('Quintas') || ev.title.includes('Especiales')));
            
            ev.details.forEach((d: any) => {
                const date = d.service_date.split('T')[0];
                if (!detailsMap.has(date)) {
                    detailsMap.set(date, { date, plc:0, sm:0, cnPlanta:0, cenas:0, sc:0, conc:0, cnExt:0, csExt:0, sistemasCep:0, seguridadPlc:0, seguridadRuices:0, seguridadCentralCep:0, choferesCenas:0, quintasCenas:0, pilotosAlmuerzos:0, choferesDesayunos:0, quintasDesayunos:0, pepsicoDesayunos:0 });
                }
                const p = detailsMap.get(date);
                const obs = d.observations || '';
                
                const isMetropolitano = ev.cost_center === 'Metropolitano';
                const isCep = ev.cost_center === 'CEP';
                const isEspecial = ev.cost_center === 'Servicios Especiales' || ev.cost_center === 'Quintas' || (ev.title && (ev.title.includes('Quintas') || ev.title.includes('Especiales')));

                if (d.structured_data && Object.keys(d.structured_data).length > 0) {
                    const sd = d.structured_data;
                    if (isEspecial || d.service_category_id === 2) {
                        p.choferesCenas += parseInt(sd.choferes?.cenas) || 0;
                        p.quintasCenas += parseInt(sd.quintas?.cenas) || 0;
                        p.pilotosAlmuerzos += parseInt(sd.pilotos?.almuerzos) || 0;
                        p.choferesDesayunos += parseFloat(sd.choferes?.desayunos) || 0;
                        p.quintasDesayunos += parseFloat(sd.quintas?.desayunos) || 0;
                        p.pepsicoDesayunos += parseFloat(sd.pepsico?.desayunos) || 0;
                    } else if (isCep || d.service_category_id === 3) {
                        p.sistemasCep += parseInt(sd.sistemasCep) || 0;
                        p.seguridadPlc += parseInt(sd.segPlc) || 0;
                        p.seguridadRuices += parseInt(sd.segRuices) || 0;
                        p.seguridadCentralCep += parseInt(sd.segCentral) || 0;
                    } else if (isMetropolitano || d.service_category_id === 4 || d.service_category_id === 1) {
                        p.plc += parseInt(sd.plc) || 0;
                        p.sm += parseInt(sd.sm) || 0;
                        p.cnPlanta += parseInt(sd.cnPlanta) || 0;
                        p.cenas += parseInt(sd.cenas) || 0;
                        p.sc += parseInt(sd.sc) || 0;
                        p.conc += parseInt(sd.conc) || 0;
                        p.cnExt += parseInt(sd.cnExt) || 0;
                        p.csExt += parseInt(sd.csExt) || 0;
                    }
                } else {
                    const matchCep = obs.match(/\[DESGLOSE_PLANIFICACION_CEP:\s*SISTEMAS_CEP=(\d+),\s*SEG_PLC=(\d+),\s*SEG_RUICES=(\d+),\s*SEG_CENTRAL=(\d+)\]/);
                    const match = obs.match(/\[DESGLOSE_PLANIFICACION:\s*PLC=(\d+),\s*SM=(\d+),\s*CN_PLANTA=(\d+),\s*CENAS=(\d+),\s*SC=(\d+),\s*CONC=(\d+),\s*CN_EXT=(\d+),\s*CS_EXT=(\d+)\]/);
                    const matchEspeciales = obs.match(/\[JSON_ESPECIALES:(.*)\]/);

                    if (isEspecial && matchEspeciales) {
                        try {
                            const data = JSON.parse(matchEspeciales[1]);
                            p.choferesCenas += parseInt(data.choferes?.cenas) || 0;
                            p.quintasCenas += parseInt(data.quintas?.cenas) || 0;
                            p.pilotosAlmuerzos += parseInt(data.pilotos?.almuerzos) || 0;
                            p.choferesDesayunos += parseFloat(data.choferes?.desayunos) || 0;
                            p.quintasDesayunos += parseFloat(data.quintas?.desayunos) || 0;
                            p.pepsicoDesayunos += parseFloat(data.pepsico?.desayunos) || 0;
                        } catch(e) {}
                    } else if (isCep && matchCep) {
                        p.sistemasCep += parseInt(matchCep[1]);
                        p.seguridadPlc += parseInt(matchCep[2]);
                        p.seguridadRuices += parseInt(matchCep[3]);
                        p.seguridadCentralCep += parseInt(matchCep[4]);
                    } else if (isMetropolitano && match) {
                        p.plc += parseInt(match[1]);
                        p.sm += parseInt(match[2]);
                        p.cnPlanta += parseInt(match[3]);
                        p.cenas += parseInt(match[4]);
                        p.sc += parseInt(match[5]);
                        p.conc += parseInt(match[6]);
                        p.cnExt += parseInt(match[7]);
                        p.csExt += parseInt(match[8]);
                    } else {
                        const f1 = obs.match(/SISTEMAS_CEP=(\d+)/);
                        const f2 = obs.match(/SEG_PLC=(\d+)/);
                        const f3 = obs.match(/SEG_RUICES=(\d+)/);
                        const f4 = obs.match(/SEG_CENTRAL=(\d+)/);
                        if (isCep && (f1 || f2 || f3 || f4)) {
                            p.sistemasCep += f1 ? parseInt(f1[1]) : 0;
                            p.seguridadPlc += f2 ? parseInt(f2[1]) : 0;
                            p.seguridadRuices += f3 ? parseInt(f3[1]) : 0;
                            p.seguridadCentralCep += f4 ? parseInt(f4[1]) : 0;
                        } else if (isMetropolitano) {
                            const fallbackPlc = obs.match(/PLC=(\d+)/);
                            const fallbackSm = obs.match(/SM=(\d+)/);
                            const fallbackCnPlanta = obs.match(/CN_PLANTA=(\d+)/);
                            const fallbackCenas = obs.match(/CENAS=(\d+)/);
                            const fallbackSc = obs.match(/SC=(\d+)/);
                            const fallbackConc = obs.match(/CONC=(\d+)/);
                            const fallbackCnExt = obs.match(/CN_EXT=(\d+)/);
                            const fallbackCsExt = obs.match(/CS_EXT=(\d+)/);
                            
                            p.plc += fallbackPlc ? parseInt(fallbackPlc[1]) : 0;
                            p.sm += fallbackSm ? parseInt(fallbackSm[1]) : 0;
                            p.cnPlanta += fallbackCnPlanta ? parseInt(fallbackCnPlanta[1]) : 0;
                            p.cenas += fallbackCenas ? parseInt(fallbackCenas[1]) : 0;
                            p.sc += fallbackSc ? parseInt(fallbackSc[1]) : 0;
                            p.conc += fallbackConc ? parseInt(fallbackConc[1]) : 0;
                            p.cnExt += fallbackCnExt ? parseInt(fallbackCnExt[1]) : 0;
                            p.csExt += fallbackCsExt ? parseInt(fallbackCsExt[1]) : 0;
                        }
                    }
                }
            });
        });
        return Array.from(detailsMap.values());
    }, [planningEvents]);

    const handleDeleteLog = async (id: string) => {
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
    const totalBreakfastEspeciales = parsedPlannings.reduce((acc, p) => {
        return acc + p.choferesDesayunos + p.pepsicoDesayunos + p.quintasDesayunos;
    }, 0);



    const totalDeliveryQuantity = parsedPlannings.reduce((acc, p) => {
        return acc + p.plc + p.sm + p.cnPlanta + p.cenas + p.sc + p.conc + p.cnExt + p.csExt + p.sistemasCep + p.seguridadPlc + p.seguridadRuices + p.seguridadCentralCep + p.choferesCenas + p.quintasCenas + p.pilotosAlmuerzos;
    }, 0);

    const allDates = Array.from(new Set([
        ...logs.filter(l => l.log_date).map(l => l.log_date.substring(0,10)),
        ...parsedPlannings.map(p => p.date)
    ]));

    const totalFacturacionPlatos = allDates.reduce((acc, date) => {
        const mealPrice = getPriceForDate(prices, date);
        const log = logs.find(l => l.log_date && l.log_date.substring(0,10) === date);
        const p = parsedPlannings.find(pl => pl.date === date) || { plc:0, sm:0, cnPlanta:0, cenas:0, sc:0, conc:0, cnExt:0, csExt:0, sistemasCep:0, seguridadPlc:0, seguridadRuices:0, seguridadCentralCep:0, choferesCenas:0, quintasCenas:0, pilotosAlmuerzos:0 };
        const comedor = log ? (log.lunch_sold || 0) : p.plc;
        const delivery = p.sm + p.cnPlanta + p.cenas + p.sc + p.conc + p.cnExt + p.csExt + p.sistemasCep + p.seguridadPlc + p.seguridadRuices + p.seguridadCentralCep + p.choferesCenas + p.quintasCenas + p.pilotosAlmuerzos;
        return acc + ((comedor + delivery) * mealPrice);
    }, 0);

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
                                        onClick={() => {
                                            setEditingLog(null);
                                            setEditingConfig(null);
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                                <StatCard
                                    title="Almuerzos Comedor"
                                    value={totalLunch.toLocaleString()}
                                    icon={Utensils}
                                    color="text-emerald-500"
                                    bg="bg-emerald-50"
                                    trend="+14.2%"
                                    sparkData={sortedLogs.slice(-7).reverse().map(l => ({ val: l.lunch_sold || 0 }))}
                                />
                                <StatCard
                                    title="Total Delivery"
                                    value={totalDeliveryQuantity.toLocaleString()}
                                    icon={Truck}
                                    color="text-blue-500"
                                    bg="bg-blue-50"
                                    trend="+8.4%"
                                    sparkData={parsedPlannings.slice(-7).reverse().map(p => ({ val: p.plc + p.sm + p.cnPlanta + p.cenas + p.sc + p.conc + p.cnExt + p.csExt + p.sistemasCep + p.seguridadPlc + p.seguridadRuices + p.seguridadCentralCep + p.choferesCenas + p.quintasCenas + p.pilotosAlmuerzos }))}
                                />
                                <StatCard
                                    title="Facturación Platos"
                                    value={formatPrice(totalFacturacionPlatos)}
                                    icon={DollarSign}
                                    color="text-indigo-500"
                                    bg="bg-indigo-50"
                                    trend="+22.1%"
                                    sparkData={allDates.slice(0,7).map(d => ({ val: 100 }))} // Placeholder spark for now
                                />
                                <StatCard
                                    title="Desayunos Comedor"
                                    value={formatPrice(totalBreakfast)}
                                    icon={DollarSign}
                                    color="text-amber-600"
                                    bg="bg-amber-50"
                                    trend="+5.8%"
                                    sparkData={sortedLogs.slice(-7).reverse().map(l => ({ val: l.breakfast_revenue || 0 }))}
                                />
                                <StatCard
                                    title="Desayunos Especiales"
                                    value={formatPrice(totalBreakfastEspeciales)}
                                    icon={DollarSign}
                                    color="text-purple-600"
                                    bg="bg-purple-50"
                                    trend="+12.4%"
                                    sparkData={planningEvents.slice(-7).reverse().map(p => {
                                        const d = p.especialesData || {};
                                        return { val: (parseFloat(d.choferes?.desayunos) || 0) + (parseFloat(d.pepsico?.desayunos) || 0) + (parseFloat(d.quintas?.desayunos) || 0) };
                                    })}
                                />
                            </div>

                            {/* Listado de Registros */}
                            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                
                                {/* Tabs */}
                                <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 overflow-x-auto">
                                    {[
                                        { id: 'diario', label: 'Almuerzos Comedor' },
                                        { id: 'quintas', label: 'Servicios Especiales' },
                                        { id: 'cep', label: 'CEP' },
                                        { id: 'metropolitano', label: 'Metropolitano' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveListTab(tab.id as any)}
                                            className={`px-8 py-5 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                                                activeListTab === tab.id 
                                                    ? 'border-primary text-primary bg-white dark:bg-gray-800' 
                                                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 border-b border-gray-55 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
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
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Registros</span>
                                    </div>
                                </div>

                                {activeListTab === 'diario' && (
                                <div className="overflow-x-auto min-h-[400px]">
                                    <table className="w-full border-separate border-spacing-y-0">
                                        <thead>
                                            <tr className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.15em] border-b border-gray-50">
                                                <th className="px-10 py-6 text-left font-black">Fecha</th>
                                                <th className="px-8 py-6 text-center font-black">Venta Almuerzos</th>
                                                <th className="px-8 py-6 text-right font-black">Desayunos</th>

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

                                                        <td className="px-10 py-6 text-right">
                                                            <div className="flex items-center justify-end gap-1 transition-all">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingConfig(null);
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
                                )}

                                {activeListTab !== 'diario' && (
                                <div className="overflow-x-auto min-h-[400px]">
                                    <table className="w-full border-separate border-spacing-y-0">
                                        <thead>
                                            <tr className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.15em] border-b border-gray-50">
                                                <th className="px-10 py-6 text-left font-black">Fecha</th>
                                                <th className="px-8 py-6 text-center font-black">Resumen / Totales</th>
                                                <th className="px-10 py-6 text-right sr-only">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
                                            {(() => {
                                                const typeMap = {
                                                    'quintas': 'Servicios Especiales',
                                                    'cep': 'CEP',
                                                    'metropolitano': 'Metropolitano'
                                                };
                                                const ccFilter = typeMap[activeListTab];
                                                const evs = planningEvents.filter((ev: any) => {
                                                    if (activeListTab === 'metropolitano') {
                                                        return ev.cost_center === 'Metropolitano' || (ev.title && ev.title.includes('Metropolitano')) || (ev.details && ev.details.some((d: any) => d.service_category_id === 4 || d.service_category_id === 1 || (d.observations && (d.observations.includes('DESGLOSE_PLANIFICACION:') || (d.observations.includes('PLC=') && !d.observations.includes('SEG_PLC='))))));
                                                    }
                                                    if (activeListTab === 'cep') {
                                                        return ev.cost_center === 'CEP' || (ev.title && ev.title.includes('CEP')) || (ev.details && ev.details.some((d: any) => d.service_category_id === 3 || (d.observations && d.observations.includes('DESGLOSE_PLANIFICACION_CEP:'))));
                                                    }
                                                    if (activeListTab === 'quintas') {
                                                        return ev.cost_center === 'Servicios Especiales' || ev.cost_center === 'Quintas' || (ev.title && (ev.title.includes('Quintas') || ev.title.includes('Especiales'))) || (ev.details && ev.details.some((d: any) => d.service_category_id === 2 || (d.observations && (d.observations.includes('[JSON_QUINTAS:') || d.observations.includes('[JSON_ESPECIALES:')))));
                                                    }
                                                    return ev.cost_center === typeMap[activeListTab as keyof typeof typeMap];
                                                });
                                                const itemsList: any[] = [];
                                                evs.forEach((ev: any) => {
                                                    if(ev.details) {
                                                        ev.details.forEach((d: any) => {
                                                            const date = d.service_date.substring(0,10);
                                                            if (searchTerm && !date.includes(searchTerm)) return;
                                                            itemsList.push({ evId: ev.id, date, observations: d.observations || '', structured_data: d.structured_data, service_category_id: d.service_category_id });
                                                        });
                                                    }
                                                });
                                                
                                                const sortedItems = itemsList.sort((a,b) => b.date.localeCompare(a.date));

                                                if(sortedItems.length === 0) {
                                                    return <tr><td colSpan={3} className="px-10 py-10 text-center text-gray-400">No hay registros cargados.</td></tr>;
                                                }

                                                return sortedItems.map((item, idx) => {
                                                    let summaryText = '';
                                                    if (activeListTab === 'quintas') {
                                                        if (item.structured_data && Object.keys(item.structured_data).length > 0) {
                                                            const total = (parseInt(item.structured_data.choferes?.cenas)||0) + (parseInt(item.structured_data.quintas?.cenas)||0) + (parseInt(item.structured_data.pilotos?.almuerzos)||0);
                                                            summaryText = `Total Asistentes: ${total}`;
                                                        } else {
                                                            const matchOld = item.observations.match(/\[JSON_QUINTAS:(.*)\]/);
                                                            const matchNew = item.observations.match(/\[JSON_ESPECIALES:(.*)\]/);
                                                            if(matchNew) {
                                                                try {
                                                                    const data = JSON.parse(matchNew[1]);
                                                                    const total = (parseInt(data.choferes?.cenas)||0) + (parseInt(data.quintas?.cenas)||0) + (parseInt(data.pilotos?.almuerzos)||0);
                                                                    summaryText = `Total Asistentes: ${total}`;
                                                                } catch(e) {}
                                                            } else if (matchOld) {
                                                                try {
                                                                    const data = JSON.parse(matchOld[1]);
                                                                    const total = data.reduce((acc: number, x: any) => acc + (x.qty || 0), 0);
                                                                    summaryText = `Total Personas: ${total}`;
                                                                } catch(e) {}
                                                            }
                                                        }
                                                    } else if (activeListTab === 'cep') {
                                                        if (item.structured_data && Object.keys(item.structured_data).length > 0) {
                                                            const tot = (parseInt(item.structured_data.sistemasCep)||0) + (parseInt(item.structured_data.segPlc)||0) + (parseInt(item.structured_data.segRuices)||0) + (parseInt(item.structured_data.segCentral)||0);
                                                            summaryText = `Total Platos: ${tot}`;
                                                        } else {
                                                            const matchCep = item.observations.match(/\[DESGLOSE_PLANIFICACION_CEP:\s*SISTEMAS_CEP=(\d+),\s*SEG_PLC=(\d+),\s*SEG_RUICES=(\d+),\s*SEG_CENTRAL=(\d+)\]/);
                                                            if(matchCep) {
                                                                const tot = parseInt(matchCep[1]) + parseInt(matchCep[2]) + parseInt(matchCep[3]) + parseInt(matchCep[4]);
                                                                summaryText = `Total Platos: ${tot}`;
                                                            }
                                                        }
                                                    } else if (activeListTab === 'metropolitano') {
                                                        if (item.structured_data && Object.keys(item.structured_data).length > 0) {
                                                            const tot = (parseInt(item.structured_data.plc)||0) + (parseInt(item.structured_data.sm)||0) + (parseInt(item.structured_data.cnPlanta)||0) + (parseInt(item.structured_data.cenas)||0) + (parseInt(item.structured_data.sc)||0) + (parseInt(item.structured_data.conc)||0) + (parseInt(item.structured_data.cnExt)||0) + (parseInt(item.structured_data.csExt)||0);
                                                            summaryText = `Total Platos: ${tot}`;
                                                        } else {
                                                            const match = item.observations.match(/\[DESGLOSE_PLANIFICACION:\s*PLC=(\d+),\s*SM=(\d+),\s*CN_PLANTA=(\d+),\s*CENAS=(\d+),\s*SC=(\d+),\s*CONC=(\d+),\s*CN_EXT=(\d+),\s*CS_EXT=(\d+)\]/);
                                                            if(match) {
                                                                const tot = parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3]) + parseInt(match[4]) + parseInt(match[5]) + parseInt(match[6]) + parseInt(match[7]) + parseInt(match[8]);
                                                                summaryText = `Total Platos: ${tot}`;
                                                            }
                                                        }
                                                    }

                                                    return (
                                                        <tr key={`${item.evId}-${item.date}-${idx}`} className="group hover:bg-gray-55/40 dark:hover:bg-gray-900/40 transition-all">
                                                            <td className="px-10 py-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-2.5 bg-gray-55 dark:bg-gray-700/50 rounded-xl text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                                                        <Calendar size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 dark:text-white capitalize">{formatDate(item.date)}</p>
                                                                        <p className="text-xs font-semibold text-gray-400">{ccFilter} (ID: {item.evId})</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-center">
                                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                                                    <span className="text-sm font-black text-gray-900 dark:text-white">{summaryText}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-6 text-right">
                                                                <div className="flex items-center justify-end gap-1 transition-all">
                                                                    <button
                                                                        onClick={() => handleEditPlanning(activeListTab as any, item.date)}
                                                                        className="p-2.5 text-gray-400 hover:text-primary hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all"
                                                                    >
                                                                        <Edit2 size={15} />
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if(window.confirm('¿Eliminar este registro?')) {
                                                                                try {
                                                                                    await inventoryApi.deleteServiceEvent(item.evId);
                                                                                    toast.success('Registro eliminado');
                                                                                    fetchLogs();
                                                                                } catch(e) {
                                                                                    toast.error('Error al eliminar el registro');
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                                )}
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
                            {editingLog ? (
                                <DailyRecordForm
                                    initialData={editingLog}
                                    onClose={() => setViewMode('list')}
                                    onSuccess={() => {
                                        setViewMode('list');
                                        fetchLogs();
                                    }}
                                />
                            ) : editingConfig ? (
                                <SingleRecordEditForm
                                    type={editingConfig.type as any}
                                    date={editingConfig.date}
                                    onClose={() => { setViewMode('list'); setEditingConfig(null); }}
                                    onSuccess={() => {
                                        setViewMode('list');
                                        setEditingConfig(null);
                                        fetchLogs();
                                    }}
                                />
                            ) : (
                                <MultiTypeRecordForm
                                    onClose={() => { setViewMode('list'); setEditingConfig(null); }}
                                    onSuccess={() => {
                                        setViewMode('list');
                                        setEditingConfig(null);
                                        fetchLogs();
                                    }}
                                />
                            )}
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
