import React, { useState, useEffect } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, History, Filter, Loader2, Warehouse, User, Search, Download } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import StockAdjustmentModal from './StockAdjustmentModal';

export default function InventoryMovements() {
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [movRes, catRes] = await Promise.all([
                inventoryApi.getMovements(),
                inventoryApi.getCategories()
            ]);
            setMovements(movRes.data);
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

    const filteredMovements = movements.filter(m => {
        const matchesSearch =
            m.product_name.toLowerCase().includes(search.toLowerCase()) ||
            (m.product_sku && m.product_sku.toLowerCase().includes(search.toLowerCase())) ||
            (m.product_barcode && m.product_barcode.toLowerCase().includes(search.toLowerCase())) ||
            m.source.toLowerCase().includes(search.toLowerCase()) ||
            (m.reason?.name && m.reason.name.toLowerCase().includes(search.toLowerCase())) ||
            (m.observations && m.observations.toLowerCase().includes(search.toLowerCase()));

        // Use product relation to check category if available
        const matchesCategory = categoryFilter === '' || m.product?.category_id?.toString() === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    const exportToCSV = async () => {
        try {
            const params: any = {};
            if (categoryFilter) params.category_id = categoryFilter;
            if (search) params.query = search;

            toast.info("Generando reporte...");
            await inventoryApi.exportMovements(params);
            toast.success("Reporte descargado exitosamente.");
        } catch (err) {
            console.error(err);
            toast.error("Error al exportar. Verifique su sesión.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <History size={24} className="text-primary" />
                        Historial de Movimientos
                    </h3>
                </div>

                <div className="flex flex-1 gap-4 w-full">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar movimientos..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
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

                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => setShowAdjustmentModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-full shadow-md shadow-green-900/10 transition-all hover:shadow-lg active:scale-95"
                    >
                        <Plus size={18} />
                        Registrar Movimiento
                    </button>
                </div>
            </div>

            {/* Movements List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
                ) : filteredMovements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-4">
                        <History size={64} strokeWidth={1.5} />
                        <p className="text-lg">No se encontraron movimientos</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha & Hora</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Origen/Motivo</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Depósito</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Cantidad</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredMovements.map(m => (
                                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{new Date(m.timestamp).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-500">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold w-fit ${m.type === 'Entrada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                }`}>
                                                {m.type === 'Entrada' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                                                {m.type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 font-bold uppercase tracking-tight">
                                                {m.reason?.name || m.source}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px] italic">{m.observations || 'Sin observaciones'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white capitalize truncate max-w-[200px]">{m.product_name}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">{m.product_sku}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Warehouse size={14} className="text-gray-400" />
                                                {m.warehouse_name}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold text-lg ${m.type === 'Entrada' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                            {m.type === 'Entrada' ? '+' : '-'}{m.quantity}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <User size={14} className="text-gray-400" />
                                                {m.user_name}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showAdjustmentModal && (
                <StockAdjustmentModal
                    onClose={() => setShowAdjustmentModal(false)}
                    onSuccess={() => {
                        setShowAdjustmentModal(false);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
