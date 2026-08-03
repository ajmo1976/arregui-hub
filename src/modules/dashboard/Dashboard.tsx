import React, { useState, useEffect } from 'react';
import {
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Package,
    Utensils,
    Truck,
    Calendar,
    Users,
    AlertTriangle,
    ShoppingBag,
    Loader2,
    ChevronRight,
    Coffee
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import { getConsolidatedData } from '../../utils/operationalMetrics';

interface DashboardStats {
    inventory_value: number;
    lunch_revenue: number;
    breakfast_revenue: number;
    delivery_revenue: number;
    services_revenue: number;
    total_revenue: number;
    lunches: number;
    delivery_lunches?: number;
    services_count: number;
    users_count: number;
    clients_count: number;
    providers_count: number;
    products_count: number;
    low_stock_count: number;
    chart_data: any[];
    trends: {
        revenue: string;
        lunches: string;
        inventory: string;
        services: string;
    }
}

const COLORS = ['#43a047', '#42a5f5', '#f06292', '#ff9800'];

import { useCurrency } from '../../contexts/CurrencyContext';

export default function Dashboard() {
    const { formatPrice, canShowPrices } = useCurrency();
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchDashboardData = async (selectedRange = range, sDate = startDate, eDate = endDate) => {
        try {
            setLoading(true);
            const startParam = selectedRange === 'custom' ? sDate : undefined;
            const endParam = selectedRange === 'custom' ? eDate : undefined;

            const [summaryRes, logsRes, eventsRes, pricesRes] = await Promise.all([
                inventoryApi.getDashboardSummary(selectedRange, startParam, endParam),
                inventoryApi.getDailyLogs(undefined, undefined),
                inventoryApi.getServiceEvents(),
                inventoryApi.getMealPrices().catch(() => ({ data: [] }))
            ]);
            
            const summary = summaryRes.data;
            const logs = Array.isArray(logsRes.data) ? logsRes.data : [];
            const events = Array.isArray(eventsRes.data) ? eventsRes.data.filter((ev: any) => ev.company === 'Planificación') : [];
            const prices = Array.isArray(pricesRes.data) ? pricesRes.data : [];

            let computedStart = startParam;
            let computedEnd = endParam;
            const today = new Date();
            if (selectedRange === 'month') {
                const y = today.getFullYear();
                const m = today.getMonth();
                const firstDay = new Date(y, m, 1);
                const lastDay = new Date(y, m + 1, 0);
                // Adjust for timezone offset to prevent date shifting
                computedStart = new Date(firstDay.getTime() - (firstDay.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
                computedEnd = new Date(lastDay.getTime() - (lastDay.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
            } else if (selectedRange === 'day') {
                computedStart = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
                computedEnd = computedStart;
            } else if (selectedRange === 'week') {
                const first = today.getDate() - today.getDay() + 1;
                const d1 = new Date(today.setDate(first));
                computedStart = new Date(d1.getTime() - (d1.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
                const d2 = new Date(today.setDate(first + 6));
                computedEnd = new Date(d2.getTime() - (d2.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
            }

            const consolidated = getConsolidatedData(logs, events, prices, computedStart, computedEnd);

            let realLunches = 0;
            let realLunchRev = 0;
            let realDelLunches = 0;
            let realDelRev = 0;
            let realBrkRev = 0;

            consolidated.forEach(row => {
                const hasLog = logs.some((l: any) => l.log_date.substring(0, 10) === row.date);
                realLunches += row.real.lunchSold || 0;
                
                // For Dashboard, if no log exists, lunch revenue is 0
                realLunchRev += hasLog ? row.billingComedor : 0;
                
                const totalMetro = row.plan.plc + row.plan.sm + row.plan.cnPlanta + row.plan.cenas + row.plan.sc + row.plan.conc + row.plan.cnExt + row.plan.csExt;
                const totalCep = row.plan.sistemasCep + row.plan.seguridadPlc + row.plan.seguridadRuices + row.plan.seguridadCentralCep;
                const totalQuintas = row.plan.quintas;
                
                realDelLunches += totalMetro + totalCep + totalQuintas;
                realDelRev += row.billingMetroTotal + row.billingQuintas + row.billingCep;
                realBrkRev += row.real.breakfastRevenue || 0;
            });

            summary.lunches = realLunches;
            summary.lunch_revenue = realLunchRev;
            summary.delivery_lunches = realDelLunches;
            summary.delivery_revenue = realDelRev;
            summary.breakfast_revenue = realBrkRev;
            summary.total_revenue = realLunchRev + realDelRev + realBrkRev + summary.services_revenue;

            if (summary.chart_data) {
                summary.chart_data.forEach((day: any) => {
                    const monthDay = day.date.split('/').reverse().join('-');
                    const dayMatch = consolidated.find(r => r.date.endsWith('-' + monthDay));
                    if (dayMatch) {
                        const hasLog = logs.some((l: any) => l.log_date.substring(0, 10) === dayMatch.date);
                        day.lunches = dayMatch.real.lunchSold || 0;
                        const totalMetro = dayMatch.plan.plc + dayMatch.plan.sm + dayMatch.plan.cnPlanta + dayMatch.plan.cenas + dayMatch.plan.sc + dayMatch.plan.conc + dayMatch.plan.cnExt + dayMatch.plan.csExt;
                        const totalCep = dayMatch.plan.sistemasCep + dayMatch.plan.seguridadPlc + dayMatch.plan.seguridadRuices + dayMatch.plan.seguridadCentralCep;
                        day.delivery_lunches = totalMetro + totalCep + dayMatch.plan.quintas;
                        
                        day.income_lunch = hasLog ? dayMatch.billingComedor : 0;
                        day.income_del = dayMatch.billingMetroTotal + dayMatch.billingQuintas + dayMatch.billingCep;
                        day.income_brk = dayMatch.real.breakfastRevenue || 0;
                        day.income = day.income_lunch + day.income_del + day.income_brk + day.income_srv;
                    } else {
                        day.lunches = 0;
                        day.delivery_lunches = 0;
                        day.income_lunch = 0;
                        day.income_del = 0;
                        day.income_brk = 0;
                        day.income = day.income_srv;
                    }
                });
            }

            setData(summary);
        } catch (err) {
            toast.error('Error al cargar datos del dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (range !== 'custom') {
            fetchDashboardData(range);
        } else if (startDate && endDate) {
            fetchDashboardData(range, startDate, endDate);
        }
    }, [range, startDate, endDate]);

    const getComparisonLabel = () => {
        switch (range) {
            case 'day': return 'vs día anterior';
            case 'week': return 'vs semana anterior';
            case 'month': return 'vs mes anterior';
            case 'last_month': return 'vs mes anterior';
            case 'year': return 'vs año anterior';
            case 'custom': return 'vs periodo anterior';
            default: return 'vs anterior';
        }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-gray-400 font-medium text-sm">Actualizando indicadores...</p>
            </div>
        );
    }

    const revenueData = [
        { name: 'Comedor (Presencial)', value: data?.lunch_revenue || 0 },
        { name: 'Servicios (Catering)', value: data?.services_revenue || 0 },
        { name: 'Delivery (Total)', value: data?.delivery_revenue || 0 },
        { name: 'Desayunos (Comedor)', value: data?.breakfast_revenue || 0 },
    ].filter(item => item.value > 0);

    const mainStats = [
        // Comedor
        {
            title: 'Facturación de Almuerzos en Comedor',
            value: formatPrice(data?.lunch_revenue || 0),
            trend: data?.trends.lunches || '+0%',
            icon: Utensils,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            dataKey: 'income_lunch'
        },
        {
            title: 'Total de platos de Almuerzos en Comedor',
            value: (data?.lunches || 0).toString(),
            trend: data?.trends.lunches || '+0%',
            icon: Utensils,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            dataKey: 'qty_lunch'
        },
        {
            title: 'Facturación Desayunos (Comedor)',
            value: formatPrice(data?.breakfast_revenue || 0),
            trend: data?.trends.revenue || '+0%',
            icon: Coffee,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            dataKey: 'income_brk'
        },
        // Delivery
        {
            title: 'Facturación de Delivery (Metro, CEP y Servicios Especiales)',
            value: formatPrice(data?.delivery_revenue || 0),
            trend: data?.trends.revenue || '+0%',
            icon: Truck,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            dataKey: 'income_del'
        },
        {
            title: 'Cantidad de platos de Delivery (Metro, CEP y Servicios Especiales)',
            value: (data?.delivery_lunches || 0).toString(),
            trend: data?.trends.lunches || '+0%',
            icon: Truck,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            dataKey: 'qty_del'
        },
        // Catering
        {
            title: 'Facturación Servicios (Catering)',
            value: formatPrice(data?.services_revenue || 0),
            trend: data?.trends.services || '+0%',
            icon: Calendar,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
            dataKey: 'income_srv'
        },
        {
            title: 'Cantidad de Servicios (Catering)',
            value: (data?.services_count || 0).toString(),
            trend: data?.trends.services || '+0%',
            icon: Calendar,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
            dataKey: 'qty_srv'
        }
    ];

    const renderStatCard = (stat: any, idx: number) => (
        <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-5 overflow-hidden"
        >
            <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-bold text-gray-700 dark:text-gray-300 pr-2">{stat.title}</h4>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm shrink-0">
                    <stat.icon size={14} className={stat.color} />
                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 capitalize">
                        {range === 'custom' ? 'Personal' : rangeOptions.find(o => o.value === range)?.label?.replace(' Pasado', '')}
                    </span>
                </div>
            </div>
            
            <div className="flex items-baseline gap-2.5">
                <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</h3>
            </div>

            <div className="h-px w-full bg-gray-100 dark:bg-gray-700/50" />

            <div className="flex items-center gap-1.5">
                <span className={`flex items-center gap-1 text-sm font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stat.trend.startsWith('+') ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
                    {stat.trend}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{getComparisonLabel()}</span>
            </div>
        </motion.div>
    );

    const rangeOptions = [
        { label: 'Día', value: 'day' },
        { label: 'Semana', value: 'week' },
        { label: 'Mes', value: 'month' },
        { label: 'Mes Pasado', value: 'last_month' },
        { label: 'Año', value: 'year' },
        { label: 'Personalizado', value: 'custom' },
    ];

    return (
        <div className="p-10 max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Cabecera Minimalista */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Dashboard Operativo</h1>
                    <p className="text-gray-500 text-xs mt-1 font-bold uppercase tracking-widest opacity-60">Seguimiento de rendimiento en tiempo real</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700 shadow-inner">
                    <div className="flex gap-1 flex-wrap">
                        {rangeOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setRange(opt.value)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${range === opt.value
                                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm border border-gray-200/50 dark:border-gray-700'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                    <button
                        onClick={() => fetchDashboardData()}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                        title="Sincronizar"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Custom Date Picker Row */}
            <AnimatePresence>
                {range === 'custom' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm max-w-2xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rango de Fecha:</span>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Desde</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 dark:text-gray-300"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Hasta</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 dark:text-gray-300"
                                    />
                                </div>
                            </div>
                            {(!startDate || !endDate) && (
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse sm:mt-0 sm:ml-auto">
                                    Selecciona ambas fechas para cargar
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fila 1: KPIs Financieros Agrupados (Only if authorized) */}
            {canShowPrices && (
                <div className="space-y-8">
                    {/* Comedor Section */}
                    <div>
                        <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Comedor (Presencial)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {mainStats.slice(0, 3).map((stat, idx) => renderStatCard(stat, idx))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Delivery Section */}
                        <div>
                            <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Delivery</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                                {mainStats.slice(3, 5).map((stat, idx) => renderStatCard(stat, idx + 3))}
                            </div>
                        </div>
                        
                        {/* Catering Section */}
                        <div>
                            <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Servicios (Catering)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                                {mainStats.slice(5, 7).map((stat, idx) => renderStatCard(stat, idx + 5))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fila 2: Resumen de Entidades (Subido por petición del usuario) */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                    { label: 'Valor Inventario', value: formatPrice(data?.inventory_value || 0), icon: ShoppingBag },
                    { label: 'Usuarios Activos', value: data?.users_count, icon: Users },
                    { label: 'Proveedores', value: data?.providers_count, icon: Truck },
                    { label: 'Productos Catalogados', value: data?.products_count, icon: Package },
                    { label: 'Stock Crítico', value: data?.low_stock_count, icon: AlertTriangle, critical: (data?.low_stock_count || 0) > 0 },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 group hover:border-primary/20 transition-all shadow-sm">
                        <div className={`p-2.5 rounded-lg ${item.critical ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 dark:bg-gray-700 text-gray-400'}`}>
                            <item.icon size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{item.label}</p>
                            <p className={`text-xl font-bold mt-1 tracking-tight ${item.critical ? 'text-rose-600' : 'text-gray-900 dark:text-white'}`}>{item.value}</p>
                        </div>
                        <ChevronRight size={14} className="ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>

            {/* Fila 3: Gráficos y Metas */}
            <div className={`grid grid-cols-1 ${canShowPrices ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8 items-stretch`}>
                {/* Gráfico de Rendimiento */}
                <div className={`${canShowPrices ? 'lg:col-span-2' : ''} bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-full`}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Volumen Operativo</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Suma diaria de servicios y entregas</p>
                        </div>
                    </div>

                    <div className="flex-1 h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={canShowPrices ? "#43a047" : "#0ea5e9"} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={canShowPrices ? "#43a047" : "#0ea5e9"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                    tickFormatter={(val) => canShowPrices ? formatPrice(val) : val}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[200px]">
                                                    <p className="text-sm font-black text-gray-900 dark:text-white mb-4 capitalize border-b pb-2">{d.full_date || d.date}</p>
                                                    <div className="space-y-2.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-bold text-emerald-600">Almuerzos:</span>
                                                            <span className="font-black text-gray-900 dark:text-white">{canShowPrices ? formatPrice(d.income_lunch || 0) : (d.lunches_count || 0) + ' PAX'}</span>
                                                        </div>
                                                        {canShowPrices && (
                                                            <>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="font-bold text-amber-500">Desayunos:</span>
                                                                    <span className="font-black text-gray-900 dark:text-white">{formatPrice(d.income_brk || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="font-bold text-blue-500">Delivery:</span>
                                                                    <span className="font-black text-gray-900 dark:text-white">{formatPrice(d.income_del || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="font-bold text-indigo-500">Servicios:</span>
                                                                    <span className="font-black text-gray-900 dark:text-white">
                                                                        {canShowPrices ? formatPrice(d.income_srv || 0) : '***'} 
                                                                        <span className="text-gray-400 font-normal ml-1">({d.services_count || 0})</span>
                                                                    </span>
                                                                </div>
                                                                <div className="pt-2.5 mt-2.5 border-t border-gray-50 flex justify-between items-center">
                                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total:</span>
                                                                    <span className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(d.income || 0)}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area type="monotone" dataKey={canShowPrices ? "income" : "lunches_count"} stroke={canShowPrices ? "#43a047" : "#0ea5e9"} strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {canShowPrices && (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-full">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-6">Fuentes de Ingresos</h3>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="h-[250px] w-full flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={revenueData}
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {revenueData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Ventas</span>
                                    <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-2">
                                        {(data?.lunch_revenue || 0) > 0 ? '100%' : '0%'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-10 space-y-4">
                                {revenueData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-gray-900 dark:text-white">
                                            {Math.round((item.value / revenueData.reduce((a, b) => a + b.value, 0)) * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
