import React, { useState, useEffect } from 'react';
import { X, Loader2, Info, LayoutGrid, BarChart3, Tag, Hash, AlignLeft } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import { useCurrency } from '../../contexts/CurrencyContext';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import { Scan } from 'lucide-react';

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
    const [isScannerOpen, setIsScannerOpen] = useState(false);

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Tag size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {product ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">Gestione la información del catálogo</p>
                        </div>
                    </div>
                    <button onClick={onClose} type="button" className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 overflow-y-auto custom-scrollbar">
                        
                        {/* Columna Izquierda */}
                        <div className="space-y-8">
                            {/* INFORMACIÓN BÁSICA */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <Info size={18} className="text-blue-500" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Información Básica</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Nombre del Producto *</label>
                                        <input
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                            placeholder="Ej. Harina de Trigo"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">SKU *</label>
                                        <input
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                            placeholder="Ej. ING-001"
                                            value={formData.sku}
                                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Código de Barras</label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                                placeholder="Escanea o escribe..."
                                                value={formData.barcode}
                                                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsScannerOpen(true)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                                                title="Escanear Código"
                                            >
                                                <Scan size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1 flex items-center gap-1.5"><AlignLeft size={14} /> Descripción</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium h-[76px] resize-none"
                                            placeholder="Agregue detalles del producto..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* CLASIFICACIÓN */}
                            <section className="space-y-6 pt-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                        <LayoutGrid size={18} className="text-purple-500" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Clasificación</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Categoría</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium appearance-none"
                                            value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Unidad de Medida</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium appearance-none"
                                            value={formData.unit_id}
                                            onChange={e => setFormData({ ...formData, unit_id: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Almacén Principal</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium appearance-none"
                                            value={formData.main_warehouse_id}
                                            onChange={e => setFormData({ ...formData, main_warehouse_id: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Tipo de Producto</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium appearance-none"
                                            value={formData.product_type_id}
                                            onChange={e => setFormData({ ...formData, product_type_id: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Columna Derecha */}
                        <div className="space-y-8">
                            {/* PARÁMETROS DE INVENTARIO */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                        <BarChart3 size={18} className="text-green-500" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Parámetros de Inventario</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {canShowPrices && (
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Costo Promedio ($)</label>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                                value={formData.cost_price}
                                                onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Stock Mínimo</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                            value={formData.min_stock}
                                            onChange={e => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Stock Crítico</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-red-400 text-red-600 text-sm font-bold"
                                            value={formData.critical_stock}
                                            onChange={e => setFormData({ ...formData, critical_stock: parseFloat(e.target.value) })}
                                        />
                                    </div>

                                    <div className="col-span-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 mt-2">
                                        <div className="flex items-start gap-3">
                                            <div className="relative flex items-start mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    id="controlLots"
                                                    className="peer w-5 h-5 rounded-md border-gray-300 text-primary focus:ring-primary transition-all cursor-pointer"
                                                    checked={formData.control_lots}
                                                    onChange={e => setFormData({ ...formData, control_lots: e.target.checked })}
                                                />
                                            </div>
                                            <label htmlFor="controlLots" className="flex flex-col cursor-pointer select-none">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">Controlar Lotes</span>
                                                <span className="text-xs font-medium text-gray-500">Requiere fecha de vencimiento al ingresar stock</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ESTADO DEL PRODUCTO */}
                            <section className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl mt-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        <Tag size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Estado del Producto</div>
                                        <div className="text-xs font-medium text-gray-500">{formData.is_active ? 'Activo en el catálogo' : 'Inactivo'}</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`w-12 h-6 rounded-full transition-all relative outline-none ${formData.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </section>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-5 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button" onClick={onClose}
                            className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit" disabled={loading}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            <span>Guardar Producto</span>
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Scanner Modal */}
            {isScannerOpen && (
                <BarcodeScannerModal
                    onScan={(code) => {
                        setFormData({ ...formData, barcode: code });
                        setIsScannerOpen(false);
                    }}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
        </div>
    );
}
