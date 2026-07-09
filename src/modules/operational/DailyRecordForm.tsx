import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Utensils,
    DollarSign,
    Truck,
    MessageSquare,
    Save,
    Loader2,
    Plus,
    Clock,
    ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';

interface DailyRecordFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

import { useCurrency } from '../../contexts/CurrencyContext';

export default function DailyRecordForm({ onClose, onSuccess, initialData }: DailyRecordFormProps) {
    const { formatPrice, currency } = useCurrency();
    const isEdit = !!initialData;
    const [loading, setLoading] = useState(false);
    const [prices, setPrices] = useState<any[]>([]);

    const [formData, setFormData] = useState<any>({
        log_date: new Date().toISOString().split('T')[0],
        lunch_sold: '',
        breakfast_revenue: '',
        delivery_lunch: '',
        delivery_dinner: '',
        delivery_night: '',
        delivery_revenue: 0,
        observations: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                log_date: initialData.log_date.split('T')[0]
            });
        }
        fetchPrices();
    }, [initialData]);

    const fetchPrices = async () => {
        try {
            const response = await inventoryApi.getMealPrices();
            setPrices(response.data);
        } catch (error) {
            console.error('Error fetching prices');
        }
    };

    // Helper to find the best price for a given type and date
    const getPriceForDate = (type: 'ESTANDAR' | 'SOBRE_CENA', targetDate: string) => {
        if (!prices || prices.length === 0) return 0;
        
        // Some tolerance for type names (case insensitive or common alternates)
        const sameTypePrices = prices.filter(p =>
            p.type.toUpperCase() === type ||
            (type === 'ESTANDAR' && p.type === 'Estándar') ||
            (type === 'SOBRE_CENA' && p.type === 'Sobre Cena')
        );

        if (sameTypePrices.length === 0) return 0;

        // Find prices active ON or BEFORE the target date
        const pastPrices = sameTypePrices
            .filter(p => p.effective_date <= targetDate)
            .sort((a, b) => b.effective_date.localeCompare(a.effective_date));

        if (pastPrices.length > 0) {
            return pastPrices[0].price;
        }

        // Fallback: If no price exists BEFORE this date, use the earliest available price
        // (Assumes the first price recorded is the 'initial' price for all past dates)
        const earliestPrice = [...sameTypePrices].sort((a, b) => a.effective_date.localeCompare(b.effective_date))[0];
        return earliestPrice?.price || 0;
    };

    const standardPrice = getPriceForDate('ESTANDAR', formData.log_date);
    const nightPrice = getPriceForDate('SOBRE_CENA', formData.log_date);
    const lunchRevenue = (formData.lunch_sold || 0) * standardPrice;
    const totalRevenue = (formData.breakfast_revenue || 0) + (formData.delivery_revenue || 0) + lunchRevenue;

    // Improved price calculation logic
    useEffect(() => {
        const calculatedRevenue = (formData.delivery_lunch + formData.delivery_dinner) * standardPrice
            + (formData.delivery_night * nightPrice);

        setFormData(prev => ({
            ...prev,
            delivery_revenue: calculatedRevenue
        }));
    }, [formData.delivery_lunch, formData.delivery_dinner, formData.delivery_night, formData.log_date, prices]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEdit) {
                await inventoryApi.updateDailyLog(initialData.id, formData);
                toast.success('Registro actualizado');
            } else {
                await inventoryApi.createDailyLog(formData);
                toast.success('Registro guardado');
            }
            onSuccess();
        } catch (error: any) {
            const detail = error.response?.data?.detail || 'Error al guardar el registro';
            toast.error(detail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0B0E14]/60 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-[#151921] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/50 dark:border-gray-800"
            >
                {/* Header matching System Settings Modal */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                            {isEdit ? 'Modificar' : 'Nuevo'} <span className="text-primary">Registro</span>
                        </h3>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Operación Diaria</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6 max-h-[95vh] overflow-y-auto custom-scrollbar">

                    {/* Date Selector - Premium Style */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fecha de Operación</label>
                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-6 rounded-[2rem] border border-transparent focus-within:border-primary/20 transition-all">
                            <Calendar size={24} className="text-primary" />
                            <input
                                type="date"
                                className="bg-transparent border-none outline-none font-black text-2xl tracking-tighter text-gray-900 dark:text-white w-full"
                                value={formData.log_date}
                                onChange={e => setFormData({ ...formData, log_date: e.target.value })}
                                readOnly={isEdit}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Comedor Metrics */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 p-1">
                                <Utensils size={14} className="text-emerald-500" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Sección Comedor</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Almuerzos Vendidos</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl font-black text-3xl outline-none focus:ring-2 focus:ring-primary/10 text-gray-900 dark:text-white tracking-tighter"
                                        value={formData.lunch_sold}
                                        onChange={e => setFormData({ ...formData, lunch_sold: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Venta Desayunos ($)</label>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter mb-1">
                                            Eq. {formatPrice(formData.breakfast_revenue || 0, currency === 'USD' ? 'VES' : 'USD')}
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full px-6 py-5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl font-black text-3xl outline-none focus:ring-2 focus:ring-primary/10 text-emerald-600 tracking-tighter"
                                        value={formData.breakfast_revenue}
                                        onChange={e => setFormData({ ...formData, breakfast_revenue: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Delivery Detail */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 p-1">
                                <Truck size={14} className="text-blue-500" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Sección Delivery</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Almuerzos</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl font-black text-3xl outline-none focus:ring-2 focus:ring-blue-500/10 text-gray-900 dark:text-white tracking-tighter"
                                        value={formData.delivery_lunch}
                                        onChange={e => setFormData({ ...formData, delivery_lunch: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Cenas</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl font-black text-3xl outline-none focus:ring-2 focus:ring-blue-500/10 text-gray-900 dark:text-white tracking-tighter"
                                        value={formData.delivery_dinner}
                                        onChange={e => setFormData({ ...formData, delivery_dinner: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Sobre Cenas (Noches)</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl font-black text-3xl outline-none focus:ring-2 focus:ring-blue-500/10 text-gray-900 dark:text-white tracking-tighter"
                                        value={formData.delivery_night}
                                        onChange={e => setFormData({ ...formData, delivery_night: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* General Summary Card */}
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-[2rem] border border-primary/20 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            Resumen General del Día
                        </h4>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-white/50 dark:border-gray-700/50 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Servicios</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-gray-900 dark:text-white">
                                        {(formData.lunch_sold || 0) + (formData.delivery_lunch || 0) + (formData.delivery_dinner || 0) + (formData.delivery_night || 0)}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400 mb-1 pb-0.5">platos</span>
                                </div>
                            </div>
                            
                            <div className="bg-blue-500/5 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Total Delivery</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-medium text-blue-400">$</span>
                                    <span className="text-3xl font-black text-blue-600 tracking-tighter">
                                        {formData.delivery_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter mt-1">
                                    Eq. {formatPrice(formData.delivery_revenue, currency === 'USD' ? 'VES' : 'USD')}
                                </p>
                            </div>

                            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-white/50 dark:border-gray-700/50 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Ingreso Total</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-medium text-primary/70">$</span>
                                    <span className="text-3xl font-black text-primary tracking-tighter">
                                        {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <p className="text-[9px] font-bold text-primary/60 uppercase tracking-tighter mt-1">
                                    Eq. {formatPrice(totalRevenue, currency === 'USD' ? 'VES' : 'USD')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Observations */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Observaciones / Incidencias</label>
                        <textarea
                            rows={2}
                            placeholder="Anota cualquier detalle relevante del día..."
                            className="w-full px-8 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-3xl font-medium outline-none focus:ring-2 focus:ring-primary/10 text-gray-700 dark:text-gray-300 resize-none shadow-inner transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                            value={formData.observations}
                            onChange={e => setFormData({ ...formData, observations: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all border border-gray-100 dark:border-gray-800"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white py-4 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {isEdit ? 'Actualizar Datos' : 'Confirmar Registro'}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
