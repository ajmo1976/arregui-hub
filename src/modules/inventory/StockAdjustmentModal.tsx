import React, { useState, useEffect } from 'react';
import { X, Loader2, Package, ArrowRightLeft, Calendar, Hash, Warehouse as WarehouseIcon } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import ProductSearchSelect from '../../components/ProductSearchSelect';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

export default function StockAdjustmentModal({ onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [reasons, setReasons] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        product_id: '',
        warehouse_id: '',
        reason_id: '', // New DB reason link
        source: '', // For backward compatibility if needed, or we just use reason name
        quantity: 0,
        observations: '',
        timestamp: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [whRes, prodRes, reasonRes] = await Promise.all([
                    inventoryApi.getWarehouses(),
                    inventoryApi.getProducts(),
                    inventoryApi.getReasons()
                ]);
                setWarehouses(whRes.data);
                setAllProducts(prodRes.data);
                setReasons(reasonRes.data);

                if (whRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, warehouse_id: whRes.data[0].id.toString() }));
                }
                if (reasonRes.data.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        reason_id: reasonRes.data[0].id.toString(),
                        source: reasonRes.data[0].name
                    }));
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const selectedProduct = allProducts.find(p => p.id.toString() === formData.product_id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.product_id || formData.quantity <= 0) {
            toast.error('Verifique el producto y la cantidad');
            return;
        }

        setLoading(true);
        try {
            const selectedReason = reasons.find(r => r.id.toString() === formData.reason_id);
            const type = selectedReason?.type || 'Entrada';

            await inventoryApi.createMovement({
                product_id: parseInt(formData.product_id),
                warehouse_id: parseInt(formData.warehouse_id),
                reason_id: parseInt(formData.reason_id),
                type: type,
                source: selectedReason?.name || 'Ajuste',
                quantity: formData.quantity,
                observations: formData.observations || 'Ajuste de almacén manual',
            });
            toast.success('Movimiento registrado');
            onSuccess();
        } catch (err) {
            toast.error('Error al registrar movimiento');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white placeholder:text-gray-400 text-sm";
    const labelClass = "text-[12px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight flex items-center gap-2 mb-1.5";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">

                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Ajuste de Almacén</h3>
                        <p className="text-sm text-gray-500">Movimiento simple de entrada o salida.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1 space-y-1">
                            <label className={labelClass}>Tipo de Movimiento</label>
                            <select
                                className={inputClass}
                                value={formData.reason_id}
                                onChange={e => {
                                    const r = reasons.find(r => r.id.toString() === e.target.value);
                                    setFormData({ ...formData, reason_id: e.target.value, source: r?.name || '' });
                                }}
                            >
                                {reasons.map(r => <option key={r.id} value={r.id.toString()}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className={labelClass}>Fecha</label>
                            <input
                                type="date"
                                className={inputClass}
                                value={formData.timestamp}
                                onChange={e => setFormData({ ...formData, timestamp: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className={labelClass}>Producto</label>
                        <ProductSearchSelect
                            products={allProducts}
                            selectedId={formData.product_id}
                            onSelect={(p) => setFormData({ ...formData, product_id: p.id.toString() })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className={labelClass}>Cantidad</label>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="any"
                                className="w-full px-4 py-3 bg-green-50/30 dark:bg-green-900/10 border-2 border-green-500/50 rounded-xl text-center font-black text-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all dark:text-white"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Unidad</label>
                            <input
                                disabled
                                className={inputClass + " bg-gray-100 dark:bg-gray-800/50"}
                                value={selectedProduct?.unit?.name || '---'}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className={labelClass}>Almacén</label>
                        <select
                            required
                            className={inputClass}
                            value={formData.warehouse_id}
                            onChange={e => setFormData({ ...formData, warehouse_id: e.target.value })}
                        >
                            {warehouses.map(w => <option key={w.id} value={w.id.toString()}>{w.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className={labelClass}>Observaciones</label>
                        <textarea
                            className={inputClass + " h-20 resize-none"}
                            placeholder="Motivo del ajuste..."
                            value={formData.observations}
                            onChange={e => setFormData({ ...formData, observations: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button" onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit" disabled={loading}
                            className="px-10 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-lg shadow-green-900/10 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
