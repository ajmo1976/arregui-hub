import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Utensils,
    Truck,
    Save,
    Loader2,
    ArrowRight,
    Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';

interface DailyRecordFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const parseObservations = (obs: string, fallbackLunchSold?: number) => {
    if (!obs) {
        return { 
            t1: '', 
            t2: '', 
            t3: '', 
            t4: '', 
            manual: fallbackLunchSold !== undefined && fallbackLunchSold !== null ? fallbackLunchSold : '', 
            cleanObs: '' 
        };
    }
    const match = obs.match(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*T3=(\d+|),\s*T4=(\d+|),\s*M=(\d+|)\]/);
    if (match) {
        return {
            t1: match[1] === '' ? '' : parseInt(match[1]),
            t2: match[2] === '' ? '' : parseInt(match[2]),
            t3: match[3] === '' ? '' : parseInt(match[3]),
            t4: match[4] === '' ? '' : parseInt(match[4]),
            manual: match[5] === '' ? '' : parseInt(match[5]),
            cleanObs: obs.replace(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*T3=(\d+|),\s*T4=(\d+|),\s*M=(\d+|)\]\s*/, '')
        };
    }
    const legacyMatch = obs.match(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*M=(\d+|)\]/);
    if (legacyMatch) {
        return {
            t1: legacyMatch[1] === '' ? '' : parseInt(legacyMatch[1]),
            t2: legacyMatch[2] === '' ? '' : parseInt(legacyMatch[2]),
            t3: '',
            t4: '',
            manual: legacyMatch[3] === '' ? '' : parseInt(legacyMatch[3]),
            cleanObs: obs.replace(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*M=(\d+|)\]\s*/, '')
        };
    }
    return { 
        t1: '', 
        t2: '', 
        t3: '', 
        t4: '', 
        manual: fallbackLunchSold !== undefined && fallbackLunchSold !== null ? fallbackLunchSold : '', 
        cleanObs: obs 
    };
};

import { useCurrency } from '../../contexts/CurrencyContext';

export default function DailyRecordForm({ onClose, onSuccess, initialData }: DailyRecordFormProps) {
    const { formatPrice, currency } = useCurrency();
    const isEdit = !!initialData;
    const [loading, setLoading] = useState(false);
    const [prices, setPrices] = useState<any[]>([]);

    const [formData, setFormData] = useState<any>({
        log_date: new Date().toISOString().split('T')[0],
        lunch_sold: '',
        t1: '',
        t2: '',
        t3: '',
        t4: '',
        manual: '',
        breakfast_revenue: '',
        delivery_lunch: '',
        delivery_dinner: '',
        delivery_night: '',
        delivery_revenue: 0,
        observations: ''
    });

    useEffect(() => {
        if (initialData) {
            const parsed = parseObservations(initialData.observations, initialData.lunch_sold);
            setFormData({
                ...initialData,
                log_date: initialData.log_date.split('T')[0],
                t1: parsed.t1,
                t2: parsed.t2,
                t3: parsed.t3,
                t4: parsed.t4,
                manual: parsed.manual,
                observations: parsed.cleanObs
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

    // Helper to find the best price for a given concept and date
    const getPriceForDate = (concept: string, targetDate: string) => {
        if (!prices || prices.length === 0) return 0;
        
        let sameTypePrices = prices.filter(p =>
            p.type.toLowerCase() === concept.toLowerCase()
        );

        if (sameTypePrices.length === 0 && concept.toLowerCase() === 'almuerzo_comedor') {
            sameTypePrices = prices.filter(p =>
                p.type.toUpperCase() === 'ESTANDAR' || p.type === 'Estándar'
            );
        }

        if (sameTypePrices.length === 0 && concept.toLowerCase() === 'sm_sobre_cenas') {
            sameTypePrices = prices.filter(p =>
                p.type.toUpperCase() === 'SOBRE_CENA' || p.type === 'Sobre Cena'
            );
        }

        if (sameTypePrices.length === 0) {
            sameTypePrices = prices.filter(p =>
                p.type.toUpperCase() === 'ESTANDAR' || p.type === 'Estándar'
            );
        }

        if (sameTypePrices.length === 0) return 0;

        // Find prices active ON or BEFORE the target date
        const pastPrices = sameTypePrices
            .filter(p => p.effective_date <= targetDate)
            .sort((a, b) => b.effective_date.localeCompare(a.effective_date));

        if (pastPrices.length > 0) {
            return pastPrices[0].price;
        }

        // Fallback: If no price exists BEFORE this date, use the earliest available price
        const earliestPrice = [...sameTypePrices].sort((a, b) => a.effective_date.localeCompare(b.effective_date))[0];
        return earliestPrice?.price || 0;
    };

    const standardPrice = getPriceForDate('almuerzo_comedor', formData.log_date);
    const nightPrice = getPriceForDate('sm_sobre_cenas', formData.log_date);
    
    // Calculate lunch_sold dynamically from t1, t2, t3, t4, manual inputs
    const calculatedLunchSold = (parseInt(formData.t1) || 0) + 
                                (parseInt(formData.t2) || 0) + 
                                (parseInt(formData.t3) || 0) + 
                                (parseInt(formData.t4) || 0) + 
                                (parseInt(formData.manual) || 0);
    const lunchRevenue = calculatedLunchSold * standardPrice;
    
    const totalRevenue = (formData.breakfast_revenue || 0) + (formData.delivery_revenue || 0) + lunchRevenue;

    // Improved price calculation logic
    useEffect(() => {
        const calculatedRevenue = ((parseInt(formData.delivery_lunch) || 0) + (parseInt(formData.delivery_dinner) || 0)) * standardPrice
            + ((parseInt(formData.delivery_night) || 0) * nightPrice);

        setFormData((prev: any) => ({
            ...prev,
            delivery_revenue: calculatedRevenue
        }));
    }, [formData.delivery_lunch, formData.delivery_dinner, formData.delivery_night, formData.log_date, prices]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const cleanObservations = formData.observations ? formData.observations.trim() : '';
            const metadata = `[DESGLOSE_ALMUERZOS: T1=${formData.t1 || 0}, T2=${formData.t2 || 0}, T3=${formData.t3 || 0}, T4=${formData.t4 || 0}, M=${formData.manual || 0}]`;
            
            const payload = {
                ...formData,
                lunch_sold: calculatedLunchSold,
                observations: `${metadata} ${cleanObservations}`.trim(),
                delivery_lunch: formData.delivery_lunch || 0,
                delivery_dinner: formData.delivery_dinner || 0,
                delivery_night: formData.delivery_night || 0,
                delivery_revenue: formData.delivery_revenue || 0
            };

            if (isEdit) {
                await inventoryApi.updateDailyLog(initialData.id, payload);
                toast.success('Registro actualizado');
            } else {
                await inventoryApi.createDailyLog(payload);
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
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            
            {/* Cabecera matching "Nuevo Evento y Servicios" screenshot */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                        <Plus size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {isEdit ? 'Modificar' : 'Nuevo'} Registro
                        </h1>
                        <p className="text-gray-500 text-xs font-medium">
                            Completa la información para procesar el registro diario.
                        </p>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-gray-650 dark:hover:text-gray-250 transition-all shadow-sm"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Línea divisoria */}
            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Datos Generales (Top section) */}
                <div className="grid grid-cols-12 gap-4">
                    
                    {/* Fecha de Operación */}
                    <div className="col-span-4 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Fecha de Operación
                        </label>
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 rounded-2xl px-4 py-3">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                className="bg-transparent border-none outline-none font-medium text-sm text-gray-950 dark:text-white w-full"
                                value={formData.log_date}
                                onChange={e => setFormData({ ...formData, log_date: e.target.value })}
                                readOnly={isEdit}
                                required
                            />
                        </div>
                    </div>

                    {/* Venta Desayunos */}
                    <div className="col-span-4 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Venta Desayunos ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Ej. 0.00"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 text-emerald-600 font-bold text-sm"
                            value={formData.breakfast_revenue}
                            onChange={e => setFormData({ ...formData, breakfast_revenue: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                            required
                        />
                    </div>
                </div>

                {/* Grid principal inferior */}
                <div className="grid grid-cols-12 gap-6 items-start">
                    
                    {/* Columna Izquierda (Resumen General del Día) */}
                    <div className="col-span-4">
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                                <span className="font-bold text-gray-900 dark:text-white">Resumen del Día</span>
                                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-full uppercase">Caja</span>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Servicios</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {calculatedLunchSold + (formData.delivery_lunch || 0) + (formData.delivery_dinner || 0) + (formData.delivery_night || 0)} <span className="text-[10px] font-normal text-gray-400">platos</span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <span className="text-xs font-bold text-gray-955 dark:text-white">Ingreso Total</span>
                                    <span className="text-base font-black text-primary">
                                        ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha (Detalles del Registro) */}
                    <div className="col-span-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
                        
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">Detalles del Registro (Almuerzos)</span>
                            </div>
                        </div>

                        {/* inputs de Almuerzos en 5 columnas */}
                        <div className="grid grid-cols-5 gap-3">
                            {[1, 2, 3, 4].map(num => (
                                <div key={num} className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400/80 ml-1">Torn. {num}</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-950 dark:text-white text-center font-bold text-sm"
                                        value={formData[`t${num}`] || ''}
                                        onChange={e => setFormData({ ...formData, [`t${num}`]: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    />
                                </div>
                            ))}
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-primary ml-1">Manual</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-4 py-3 bg-primary/5 dark:bg-primary/10 border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-950 dark:text-white text-center font-bold text-sm"
                                    value={formData.manual}
                                    onChange={e => setFormData({ ...formData, manual: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Observaciones */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Observaciones Internas
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Notas o detalles extra..."
                                className="w-full px-4 py-3 bg-gray-55/40 dark:bg-gray-955 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 dark:text-gray-300 text-sm resize-none"
                                value={formData.observations}
                                onChange={e => setFormData({ ...formData, observations: e.target.value })}
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-500 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border border-gray-150 dark:border-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#43a047] text-white px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-green-500/10 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                {isEdit ? 'Actualizar' : 'Confirmar'}
                            </button>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}
