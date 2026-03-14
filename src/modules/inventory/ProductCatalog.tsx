import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Loader2, PackageSearch, Download } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import ProductForm from './ProductForm';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function ProductCatalog() {
    const { formatPrice, canShowPrices } = useCurrency();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

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

    const filteredProducts = products.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = categoryFilter === '' || p.category_id?.toString() === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentItems = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, categoryFilter]);

    const exportToCSV = async () => {
        try {
            const params: any = {};
            if (categoryFilter) params.category_id = categoryFilter;
            if (search) params.query = search;

            toast.info("Generando reporte...");
            await inventoryApi.exportProducts(params);
            toast.success("Reporte descargado exitosamente.");
        } catch (err) {
            console.error(err);
            toast.error("Error al exportar. Verifique su sesión.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Search & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por SKU, Nombre o Código de Barra..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none text-gray-700 dark:text-gray-300"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-full shadow-md shadow-green-900/10 transition-all hover:shadow-lg hover:shadow-green-900/20 active:scale-95"
                    >
                        <Plus size={18} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {showForm && (
                <ProductForm
                    product={selectedProduct}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedProduct(null);
                    }}
                    onSuccess={() => {
                        setShowForm(false);
                        setSelectedProduct(null);
                        fetchData();
                    }}
                />
            )}

            {/* Catalog Grid/Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-24 space-y-4">
                        <Loader2 className="animate-spin text-primary" size={40} />
                        <p className="text-gray-500 font-medium">Cargando catálogo...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-4">
                        <PackageSearch size={64} strokeWidth={1.5} />
                        <p className="text-lg">No se encontraron productos</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                                    {canShowPrices && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Venta</th>}
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {currentItems.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600 dark:text-gray-400">{p.sku}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden">
                                                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <PackageSearch size={22} />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white capitalize">{p.name}</div>
                                                    <div className="text-xs text-gray-500">{p.description || 'Sin descripción'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{p.category?.name || 'Gral.'}</td>
                                        {canShowPrices && <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatPrice(p.selling_price)}</td>}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase whitespace-nowrap ${p.current_stock <= p.min_stock
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {p.current_stock} {p.unit?.name || 'Und'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedProduct(p);
                                                    setShowForm(true);
                                                }}
                                                className="text-primary hover:underline text-sm font-medium"
                                            >
                                                Ver detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && filteredProducts.length > itemsPerPage && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="text-sm text-gray-500">
                        Mostrando <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredProducts.length}</span> productos
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-primary disabled:opacity-30 transition-colors"
                        >
                            Anterior
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === i + 1
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-primary disabled:opacity-30 transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
