import React, { useState, useEffect } from 'react';
import { X, Loader2, Info, LayoutGrid, BarChart3, Tag, Hash, AlignLeft } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
    product?: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProductForm({ product, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [productTypes, setProductTypes] = useState<any[]>([]);
    const { canShowPrices } = useCurrency();

    const [formData, setFormData] = useState({
        sku: product?.sku || '',
        name: product?.name || '',
        barcode: product?.barcode || '',
        description: product?.description || '',
        category_id: product?.category_id?.toString() || '',
        unit_id: product?.unit_id?.toString() || '',
        main_warehouse_id: product?.main_warehouse_id?.toString() || '',
        product_type_id: product?.product_type_id?.toString() || '',
        cost_price: product?.cost_price || 0,
        selling_price: product?.selling_price || 0,
        min_stock: product?.min_stock || 0,
        critical_stock: product?.critical_stock || 0,
        control_lots: product?.control_lots || false,
        is_active: product?.is_active !== false
    });

    useEffect(() => {
        const fetchParams = async () => {
            try {
                const [catRes, unitRes, whRes, ptRes] = await Promise.all([
                    inventoryApi.getCategories(),
                    inventoryApi.getUnits(),
                    inventoryApi.getWarehouses(),
                    inventoryApi.getProductTypes()
                ]);
                setCategories(catRes.data);
                setUnits(unitRes.data);
                setWarehouses(whRes.data);
                setProductTypes(ptRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchParams();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...formData,
                category_id: formData.category_id ? parseInt(formData.category_id) : null,
                unit_id: formData.unit_id ? parseInt(formData.unit_id) : null,
                main_warehouse_id: formData.main_warehouse_id ? parseInt(formData.main_warehouse_id) : null,
                product_type_id: formData.product_type_id ? parseInt(formData.product_type_id) : null,
            };

            if (product) {
                await inventoryApi.updateProduct(product.id, data);
                toast.success('Producto actualizado exitosamente');
            } else {
                await inventoryApi.createProduct(data);
                toast.success('Producto creado exitosamente');
            }
            onSuccess();
        } catch (err) {
            toast.error(product ? 'Error al actualizar producto' : 'Error al crear producto');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white placeholder:text-gray-400";
    const labelClass = "text-[13px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight flex items-center gap-2 mb-1.5";
    const sectionHeaderClass = "text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-850 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="text-primary"><Tag size={20} /></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {product ? 'Editar Producto' : 'Nuevo Producto'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-0 max-h-[85vh] overflow-y-auto">
                    <div className="p-8 space-y-10">

                        {/* INFORMACIÓN BÁSICA */}
                        <section>
                            <h4 className={sectionHeaderClass}><Info size={16} /> Información Básica</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-0.5">
                                    <label className={labelClass}>Nombre del Producto *</label>
                                    <input
                                        required
                                        className={inputClass}
                                        placeholder="Ej. Harina de Trigo"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className={labelClass}>SKU *</label>
                                    <input
                                        required
                                        className={inputClass}
                                        placeholder="Ej. ING-001"
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className={labelClass}>Código de Barras</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            className={inputClass + " pl-10"}
                                            placeholder="Escanea o escribe..."
                                            value={formData.barcode}
                                            onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-0.5">
                                    <label className={labelClass}><AlignLeft size={16} /> Descripción</label>
                                    <textarea
                                        className={inputClass + " h-20 resize-none"}
                                        placeholder="Agregue detalles del producto..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* CLASIFICACIÓN */}
                        <section>
                            <h4 className={sectionHeaderClass}><LayoutGrid size={16} /> Clasificación</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-0.5">
                                    <label className={labelClass}>Categoría</label>
                                    <select
                                        className={inputClass}
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-0.5">
                                    <label className={labelClass}>Unidad de Medida</label>
                                    <select
                                        className={inputClass}
                                        value={formData.unit_id}
                                        onChange={e => setFormData({ ...formData, unit_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-0.5">
                                    <label className={labelClass}>Almacén Principal</label>
                                    <select
                                        className={inputClass}
                                        value={formData.main_warehouse_id}
                                        onChange={e => setFormData({ ...formData, main_warehouse_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-0.5">
                                    <label className={labelClass}>Tipo de Producto</label>
                                    <select
                                        className={inputClass}
                                        value={formData.product_type_id}
                                        onChange={e => setFormData({ ...formData, product_type_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* PARÁMETROS DE INVENTARIO */}
                        <section>
                            <h4 className={sectionHeaderClass}><BarChart3 size={16} /> Parámetros de Inventario</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {canShowPrices && (
                                    <div className="space-y-0.5">
                                        <label className={labelClass}>Costo Promedio ($)</label>
                                        <input
                                            type="number" step="0.01"
                                            className={inputClass}
                                            value={formData.cost_price}
                                            onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    <label className={labelClass}>Stock Mínimo</label>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={formData.min_stock}
                                        onChange={e => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className={labelClass}>Stock Crítico</label>
                                    <input
                                        type="number"
                                        className={inputClass + " text-red-500 font-bold"}
                                        value={formData.critical_stock}
                                        onChange={e => setFormData({ ...formData, critical_stock: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="md:col-span-3 flex items-start gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="controlLots"
                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={formData.control_lots}
                                        onChange={e => setFormData({ ...formData, control_lots: e.target.checked })}
                                    />
                                    <label htmlFor="controlLots" className="flex flex-col cursor-pointer">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">Controlar Lotes</span>
                                        <span className="text-xs text-gray-500">Requiere fecha de vencimiento al ingresar stock</span>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* ESTADO DEL PRODUCTO */}
                        <section className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-gray-900 dark:text-white">Estado del Producto</h5>
                                    <p className="text-xs text-gray-500">{formData.is_active ? 'El producto está activo en el sistema' : 'El producto está desactivado'}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 outline-none ${formData.is_active ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </section>

                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0">
                        <button
                            type="button" onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit" disabled={loading}
                            className="px-10 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-lg shadow-green-900/10 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            Guardar Producto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
