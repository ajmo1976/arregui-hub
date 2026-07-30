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
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import DailyRecordForm from './DailyRecordForm';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import { useCurrency } from '../../contexts/CurrencyContext';

export default function DailyRecordsView() {
    const { formatPrice } = useCurrency();
    const [logs, setLogs] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<any>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await inventoryApi.getCateringCategories();
            const fetched = Array.isArray(res.data) ? res.data : [];
            setCategories(fetched);
            // Default to first category if available
            if (fetched.length > 0 && activeCategoryId === null) {
                setActiveCategoryId(fetched[0].id);
                fetchLogs(fetched[0].id);
            } else {
                fetchLogs(activeCategoryId);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            fetchLogs(activeCategoryId);
        }
    };

    const fetchLogs = async (catId?: number | null) => {
        try {
            setLoading(true);
            const targetCatId = catId !== undefined ? catId : activeCategoryId;
            const response = await inventoryApi.getDailyLogs(searchTerm, targetCatId ?? undefined);
            setLogs(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching daily logs:', error);
            toast.error('No se pudieron cargar los registros');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (catId: number | null) => {
        setActiveCategoryId(catId);
        fetchLogs(catId);
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
            <div className="p-10 max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700">
                {/* Cabecera Refinada */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Registro de Operaciones</h1>
                        <p className="text-gray-500 text-sm mt-1 font-medium">Historial diario de platos, ingresos y logística de Arregui Hub.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                setEditingLog(null);
                                setIsFormOpen(true);
                            }}
                            className="flex items-center gap-2.5 px-6 py-2.5 bg-[#4CAF50] hover:bg-[#43a047] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Nuevo Registro
                        </button>
                        <button
                            onClick={() => fetchLogs(activeCategoryId)}
                            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
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

                {/* Tabs de Categorías */}
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto custom-scrollbar">
                    {(() => {
                        const tabList = categories.length > 0
                            ? [{ id: null, name: 'TODAS' }, ...categories.map(c => ({ id: c.id, name: c.name.toUpperCase() }))]
                            : [
                                { id: null, name: 'TODAS' },
                                { id: 1, name: 'ALMUERZOS COMEDOR' },
                                { id: 2, name: 'SERVICIOS ESPECIALES' },
                                { id: 163, name: 'CEP' },
                                { id: 164, name: 'METROPOLITANO' }
                            ];
                        return tabList.map(tab => {
                            const isActive = activeCategoryId === tab.id;
                            return (
                                <button
                                    key={tab.id ?? 'all'}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                        isActive
                                            ? 'bg-white dark:bg-gray-800 text-primary border-primary shadow-sm scale-105'
                                            : 'bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border-transparent'
                                    }`}
                                >
                                    {tab.name}
                                </button>
                            );
                        });
                    })()}
                </div>

                {/* Listado de Registros */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
                        <div className="relative group max-w-md w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por fecha (AAAA-MM-DD)..."
                                className="w-full pl-12 pr-6 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/10 transition-all font-semibold text-sm outline-none placeholder:text-gray-300"
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
                                    {filteredLogs.map((log) => {
                                        const catObj = categories.find(c => c.id === log.category_id);
                                        const catName = catObj ? catObj.name : (log.category_id ? `Categoría` : '');
                                        return (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-gray-50/40 dark:hover:bg-gray-900/40 transition-all"
                                        >
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white capitalize">{formatDate(log.log_date)}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                            {catName ? `${catName} (ID: ${log.id})` : `ID: ${log.id}`} {log.observations ? `• ${log.observations}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-1.5 rounded-full text-emerald-600 font-bold text-xs border border-emerald-100 dark:border-emerald-900/20">
                                                    <Utensils size={12} />
                                                    {log.lunch_sold} platos
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
                                                            setIsFormOpen(true);
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
                                        );
                                    })}
                                </AnimatePresence>
                                {!loading && filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-gray-200">
                                                <Calendar size={40} />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Sin registros</h3>
                                            <p className="text-gray-400 text-sm font-medium mt-1">No hay datos operativos disponibles para esta categoría</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Formulario */}
            <AnimatePresence>
                {isFormOpen && (
                    <DailyRecordForm
                        initialData={editingLog}
                        categoryId={activeCategoryId}
                        onClose={() => setIsFormOpen(false)}
                        onSuccess={() => {
                            setIsFormOpen(false);
                            fetchLogs(activeCategoryId);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
