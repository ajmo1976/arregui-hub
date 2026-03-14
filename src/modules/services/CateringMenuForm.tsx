import React, { useState, useEffect } from 'react';
import { X, Loader2, Tag, UtensilsCrossed, Info, AlignLeft, LayoutGrid, Hash, DollarSign } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
    item?: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CateringMenuForm({ item, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const { canShowPrices } = useCurrency();

    const [formData, setFormData] = useState({
        sku: item?.sku || '',
        name: item?.name || '',
        description: item?.description || '',
        price: item?.price || 0,
        category_id: item?.category_id?.toString() || '',
        is_active: item?.is_active !== false,
        is_sold_by_case: item?.is_sold_by_case || false,
        units_per_case: item?.units_per_case || 1
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await inventoryApi.getCateringCategories();
                setCategories(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...formData,
                category_id: formData.category_id ? parseInt(formData.category_id) : null,
                price: parseFloat(formData.price.toString())
            };

            if (item) {
                await inventoryApi.updateCateringItem(item.id, data);
                toast.success('Plato actualizado exitosamente');
            } else {
                await inventoryApi.createCateringItem(data);
                toast.success('Plato creado exitosamente');
            }
            onSuccess();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || (item ? 'Error al actualizar plato' : 'Error al crear plato');
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white placeholder:text-gray-400";
    const labelClass = "text-[13px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight flex items-center gap-2 mb-1.5";
    const sectionHeaderClass = "text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-850 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 font-inter">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="text-primary"><UtensilsCrossed size={20} /></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {item ? 'Editar Plato/Snack' : 'Nuevo Plato para Menú'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-0">
                    <div className="p-8 space-y-6">
                        {/* INFORMACIÓN BÁSICA */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-0.5">
                                <label className={labelClass}>Nombre del Plato/Snack *</label>
                                <input
                                    required
                                    className={inputClass}
                                    placeholder="Ej. Hamburguesa Gourmet"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                    <label className={labelClass}>SKU / Código *</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            required
                                            className={inputClass + " pl-10"}
                                            placeholder="Ej. CAT-001"
                                            value={formData.sku}
                                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {canShowPrices && (
                                    <div className="space-y-0.5">
                                        <label className={labelClass}>Precio de Venta ($) *</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                required
                                                type="number" step="0.01"
                                                className={inputClass + " pl-10 font-bold text-primary"}
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-0.5">
                                <label className={labelClass}>Categoría del Menú</label>
                                <div className="relative">
                                    <LayoutGrid className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <select
                                        className={inputClass + " pl-10 appearance-none"}
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar categoría...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-0.5">
                                <label className={labelClass}><AlignLeft size={16} /> Descripción</label>
                                <textarea
                                    className={inputClass + " h-24 resize-none"}
                                    placeholder="Detalles sobre el plato o snack..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* GESTIÓN DE CAJAS */}
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">¿Se vende por cajas?</span>
                                    <span className="text-xs text-gray-500">Activar para bebidas y productos por bulto</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_sold_by_case: !formData.is_sold_by_case })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_sold_by_case ? 'bg-primary' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_sold_by_case ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {formData.is_sold_by_case && (
                                <div className="space-y-0.5 pt-2 border-t border-primary/10">
                                    <label className={labelClass}>Unidades por Caja</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className={inputClass}
                                        placeholder="Ej. 24"
                                        value={formData.units_per_case}
                                        onChange={e => setFormData({ ...formData, units_per_case: parseInt(e.target.value) || 1 })}
                                    />
                                    <p className="text-[10px] font-medium text-primary mt-1">
                                        Precio unitario calculado: ${(formData.price / (formData.units_per_case || 1)).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ESTADO */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Estado del Plato</span>
                                <span className="text-xs text-gray-500">Determina si está visible para el catering</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="px-8 py-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                        <button
                            type="button" onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit" disabled={loading}
                            className="px-10 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            Guardar Plato
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
