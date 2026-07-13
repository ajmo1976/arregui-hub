import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, FileText, Calendar, Hash, Truck, Package } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import ProductSearchSelect from '../../components/ProductSearchSelect';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

interface PurchaseItem {
    id: string;
    product_id: string;
    warehouse_id: string;
    quantity: number;
    cost_price: number;
    tax_percentage: number;
    lot_number?: string;
    expiration_date?: string;
    product_name?: string;
    unit_name?: string;
}

export default function InventoryPurchaseForm({ onClose, onSuccess }: Props) {
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [providers, setProviders] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        invoice_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        control_number: '',
        document_type: 'Factura',
        provider_id: '',
    });

    const [items, setItems] = useState<PurchaseItem[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [provRes, whRes, prodRes] = await Promise.all([
                    inventoryApi.getProviders(),
                    inventoryApi.getWarehouses(),
                    inventoryApi.getProducts()
                ]);
                setProviders(provRes.data);
                setWarehouses(whRes.data);
                setAllProducts(prodRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const addItem = () => {
        const newItem: PurchaseItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: '',
            warehouse_id: warehouses[0]?.id?.toString() || '',
            quantity: 0,
            cost_price: 0,
            tax_percentage: 16,
            lot_number: '',
            expiration_date: ''
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
        setItems(items.map(i => {
            if (i.id === id) {
                const updated = { ...i, [field]: value };
                if (field === 'product_id') {
                    const prod = allProducts.find(p => p.id.toString() === value);
                    updated.product_name = prod?.name;
                    updated.unit_name = prod?.unit?.name;
                    updated.cost_price = prod?.cost_price || 0;
                }
                return updated;
            }
            return i;
        }));
    };

    const totalDoc = items.reduce((acc, i) => {
        const subtotal = i.quantity * i.cost_price;
        const tax = subtotal * (i.tax_percentage / 100);
        return acc + subtotal + tax;
    }, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            toast.error('Debe agregar al menos un producto');
            return;
        }
        if (items.some(i => !i.product_id || i.quantity <= 0)) {
            toast.error('Verifique que todos los productos tengan cantidad válida');
            return;
        }

        setLoading(true);
        try {
            await inventoryApi.createPurchase({
                ...formData,
                provider_id: parseInt(formData.provider_id),
                items: items.map(i => ({
                    product_id: parseInt(i.product_id),
                    warehouse_id: parseInt(i.warehouse_id),
                    quantity: i.quantity,
                    cost_price: i.cost_price,
                    tax_percentage: i.tax_percentage,
                    lot_number: i.lot_number || null,
                    expiration_date: i.expiration_date ? new Date(i.expiration_date).toISOString() : null
                }))
            });
            toast.success('Compra registrada exitosamente');
            onSuccess();
        } catch (err) {
            toast.error('Error al registrar compra');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white placeholder:text-gray-400 text-xs";
    const labelClass = "text-[12px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight flex items-center gap-2 mb-1.5";
    const sectionHeaderClass = "text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800 pb-2";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-850 rounded-2xl shadow-2xl w-full max-w-7xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 flex flex-col max-h-[95vh]">

                {/* Header */}
                <div className="px-8 py-5 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Carga de Inventario (Compra)</h3>
                            <p className="text-sm text-gray-500">Registro administrativo y financiero de entrada de mercancía.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-8 space-y-10">

                        {/* DATOS DEL DOCUMENTO */}
                        <section className="bg-gray-50/30 dark:bg-gray-800/20 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={16} /> Datos del Documento
                                </h4>
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, document_type: 'Factura' })}
                                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${formData.document_type === 'Factura' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}
                                    >
                                        Factura
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, document_type: 'Nota de Entrega' })}
                                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${formData.document_type === 'Nota de Entrega' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}
                                    >
                                        Nota de Entrega
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-0.5">
                                    <label className={labelClass}><Calendar size={14} /> Fecha de Factura</label>
                                    <input
                                        type="date"
                                        required
                                        className={inputClass}
                                        value={formData.invoice_date}
                                        onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className={labelClass}>
                                        <Hash size={14} /> N° {formData.document_type === 'Factura' ? 'Factura' : 'Nota'}
                                    </label>
                                    <input
                                        required
                                        className={inputClass}
                                        placeholder="Ej: F-0001234"
                                        value={formData.invoice_number}
                                        onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className={labelClass}><Hash size={14} /> N° Control</label>
                                    <input
                                        className={inputClass}
                                        placeholder="Ej: 00-12345"
                                        value={formData.control_number}
                                        onChange={e => setFormData({ ...formData, control_number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className={labelClass}><Truck size={14} /> Proveedor</label>
                                    <select
                                        required
                                        className={inputClass}
                                        value={formData.provider_id}
                                        onChange={e => setFormData({ ...formData, provider_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* DETALLE DE PRODUCTOS */}
                        <section>
                            <h4 className={sectionHeaderClass}><Package size={16} /> Detalle de Productos</h4>
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 w-[25%]">Producto</th>
                                            <th className="px-4 py-3">Almacén</th>
                                            <th className="px-4 py-3 w-28">Lote / Venc.</th>
                                            <th className="px-4 py-3 w-32 text-center">Cant.</th>
                                            <th className="px-4 py-3 w-28">Costo Unit.</th>
                                            <th className="px-4 py-3 w-16">IVA %</th>
                                            <th className="px-4 py-3 w-28 text-right">Total</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <ProductSearchSelect
                                                        products={allProducts}
                                                        selectedId={item.product_id}
                                                        onSelect={(p) => updateItem(item.id, 'product_id', p.id.toString())}
                                                        placeholder="Buscar producto..."
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        className={inputClass}
                                                        value={item.warehouse_id}
                                                        onChange={e => updateItem(item.id, 'warehouse_id', e.target.value)}
                                                    >
                                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 space-y-1">
                                                    <input
                                                        placeholder="Lote"
                                                        className={inputClass}
                                                        value={item.lot_number}
                                                        onChange={e => updateItem(item.id, 'lot_number', e.target.value)}
                                                    />
                                                    <input
                                                        type="date"
                                                        className={inputClass + " h-8"}
                                                        value={item.expiration_date}
                                                        onChange={e => updateItem(item.id, 'expiration_date', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        className="w-full px-0 py-2 bg-green-50/30 dark:bg-green-900/10 border-2 border-green-500/50 rounded-xl text-center font-black text-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className={inputClass + " pl-5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"}
                                                            value={item.cost_price}
                                                            onChange={e => updateItem(item.id, 'cost_price', parseFloat(e.target.value))}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        className="w-full px-1 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-center outline-none focus:ring-2 focus:ring-primary transition-all dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-xs"
                                                        value={item.tax_percentage}
                                                        onChange={e => updateItem(item.id, 'tax_percentage', parseFloat(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white text-xs">
                                                    {formatPrice(item.quantity * item.cost_price * (1 + (item.tax_percentage / 100)))}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="w-full py-4 text-sm font-bold text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 border-t border-dashed border-gray-200 dark:border-gray-700"
                                >
                                    <Plus size={16} />
                                    Agregar línea de producto
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Footer / Total Section */}
                    <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 mt-auto flex items-center justify-between sticky bottom-0">
                        <div className="flex items-center gap-2 text-primary text-xs font-medium">
                            <Info size={14} />
                            Esta acción generará movimientos de entrada individuales para cada producto listado. Verifique los costos y cantidades antes de procesar.
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="text-right">
                                <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Total Documento:</div>
                                <div className="text-3xl font-bold text-primary tracking-tight">
                                    {formatPrice(totalDoc)}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button" onClick={onClose}
                                    className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || items.length === 0}
                                    className="px-10 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-lg shadow-green-900/10 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={18} />}
                                    Registrar Compra
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Info({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}
