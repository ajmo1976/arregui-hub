import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, TrendingUp, DollarSign, PackageCheck, FilePlus, ArrowRightLeft, Search, Filter, Download, Scan } from 'lucide-react';
import InventoryPurchaseForm from './InventoryPurchaseForm';
import StockAdjustmentModal from './StockAdjustmentModal';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

// Mock user role for demonstration (ideally comes from context)
const currentUser = { role: 'Admin' };

import { useCurrency } from '../../contexts/CurrencyContext';

export default function InventoryStock() {
    const { formatPrice } = useCurrency();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes] = await Promise.all([
                inventoryApi.getProducts(),
                inventoryApi.getCategories()
            ]);
            setProducts(prodRes.data);
            setCategories(catRes.data);
        } catch (err) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const isLogistics = currentUser.role === 'Logística';

    const filteredProducts = products.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = categoryFilter === '' || p.category_id?.toString() === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    const totalValue = filteredProducts.reduce((acc, p) => acc + (p.current_stock * p.cost_price), 0);
    const lowStockItems = filteredProducts.filter(p => p.current_stock <= p.min_stock).length;

    const exportToCSV = async () => {
        try {
            const params: any = {};
            if (categoryFilter) params.category_id = categoryFilter;
            if (search) params.query = search;

            toast.info("Generando reporte...");
            await inventoryApi.exportStock(params);
            toast.success("Reporte descargado exitosamente.");
        } catch (err) {
            console.error(err);
            toast.error("Error al exportar. Verifique su sesión.");
        }
    };

    return (
        <div className="space-y-8">
            {/* Top Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-1 gap-4 w-full">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Escanear código"
                        >
                            <Scan size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            className="bg-transparent py-2.5 text-sm outline-none text-gray-700 dark:text-gray-300"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">Categorías</option>
                            {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowAdjustmentModal(true)}
                        className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
                    >
                        <ArrowRightLeft size={18} className="text-primary" />
                        Ajuste de Stock
                    </button>
                    <button
                        onClick={() => setShowPurchaseForm(true)}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-all shadow-lg shadow-green-900/10 active:scale-95"
                    >
                        <FilePlus size={18} />
                        Cargar Factura
                    </button>
                </div>
            </div>

            {/* Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="SKUs Registrados"
                    value={products.length.toString()}
                    icon={<TrendingUp size={24} className="text-blue-500" />}
                    bg="bg-blue-50 dark:bg-blue-900/10"
                />
                <MetricCard
                    title="Bajo Stock Mínimo"
                    value={lowStockItems.toString()}
                    icon={<AlertTriangle size={24} className="text-amber-500" />}
                    bg="bg-amber-50 dark:bg-amber-900/10"
                    color="text-amber-600 dark:text-amber-400"
                />
                {!isLogistics && (
                    <MetricCard
                        title="Valor del Inventario"
                        value={formatPrice(totalValue)}
                        icon={<DollarSign size={24} className="text-green-500" />}
                        bg="bg-green-50 dark:bg-green-900/10"
                    />
                )}
                <MetricCard
                    title="Stock Total (Unds)"
                    value={products.reduce((acc, p) => acc + (p.current_stock), 0).toString()}
                    icon={<PackageCheck size={24} className="text-primary" />}
                    bg="bg-primary/5 dark:bg-primary/10"
                />
            </div>

            {/* Stock Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalle de Existencias</h3>
                    <button
                        onClick={exportToCSV}
                        className="text-primary hover:underline text-sm font-medium flex items-center gap-2"
                    >
                        <Download size={16} />
                        Exportar Reporte (CSV)
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                                    {!isLogistics && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Costo Unit.</th>}
                                    {!isLogistics && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Total</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600 dark:text-gray-400">{p.sku}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 capitalize">{p.category?.name || 'Gral.'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`font-bold text-lg ${p.current_stock <= p.min_stock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {p.current_stock}
                                                </span>
                                                <span className="text-xs text-gray-500">{p.unit?.name || 'Und'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{p.min_stock}</td>
                                        {!isLogistics && <td className="px-6 py-4 text-sm text-gray-500">{formatPrice(p.cost_price)}</td>}
                                        {!isLogistics && <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatPrice(p.current_stock * p.cost_price)}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showPurchaseForm && (
                <InventoryPurchaseForm
                    onClose={() => setShowPurchaseForm(false)}
                    onSuccess={() => {
                        setShowPurchaseForm(false);
                        fetchData();
                    }}
                />
            )}

            {showAdjustmentModal && (
                <StockAdjustmentModal
                    onClose={() => setShowAdjustmentModal(false)}
                    onSuccess={() => {
                        setShowAdjustmentModal(false);
                        fetchData();
                    }}
                />
            )}

            {isScannerOpen && (
                <BarcodeScannerModal
                    onClose={() => setIsScannerOpen(false)}
                    onScan={(decodedText) => {
                        setSearch(decodedText);
                        setIsScannerOpen(false);
                    }}
                />
            )}
        </div>
    );
}

function MetricCard({ title, value, icon, bg, color }: { title: string, value: string, icon: React.ReactNode, bg: string, color?: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-all hover:shadow-md">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                {icon}
            </div>
            <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
                <div className={`text-2xl font-bold tracking-tight ${color || 'text-gray-900 dark:text-white'}`}>{value}</div>
            </div>
        </div>
    );
}
