import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Loader2,
    UtensilsCrossed,
    Edit3,
    Trash2,
    Filter,
    LayoutGrid,
    Package
} from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import CateringMenuForm from './CateringMenuForm';
import CateringCategoryManager from './CateringCategoryManager';

export default function MenuManagement() {
    const [menus, setMenus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemRes, catRes] = await Promise.all([
                inventoryApi.getCateringItems(),
                inventoryApi.getCateringCategories()
            ]);

            setMenus(itemRes.data || []);
            setCategories(catRes.data || []);
        } catch (err) {
            toast.error('Error al cargar catálogo de alimentos');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await inventoryApi.deleteCateringItem(id);
            toast.success('Plato eliminado');
            setConfirmDeleteId(null);
            fetchData();
        } catch (err) {
            toast.error('Error al eliminar plato');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredMenus = menus.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === '' || m.category_id?.toString() === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar platos, snacks o bebidas..."
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-2 rounded-2xl shadow-sm">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            className="bg-transparent outline-none text-sm font-bold text-gray-600 dark:text-gray-300"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                        >
                            <option value="">Categorías</option>
                            {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCategoryManager(true)}
                        className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-5 py-3 rounded-2xl font-bold border border-gray-100 dark:border-gray-700 hover:bg-gray-100 transition-all active:scale-95"
                    >
                        <LayoutGrid size={18} />
                        <span>Categorías</span>
                    </button>
                    <button
                        onClick={() => {
                            setSelectedMenu(null);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Nuevo Plato/Snack</span>
                    </button>
                </div>
            </div>

            {/* Grid Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 space-y-4 animate-pulse">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                                <div className="h-3 bg-gray-50 dark:bg-gray-900 rounded w-1/2" />
                            </div>
                        </div>
                    ))
                ) : filteredMenus.length === 0 ? (
                    <div className="col-span-full py-20 text-center space-y-4 text-gray-400">
                        <UtensilsCrossed size={64} className="mx-auto opacity-20" />
                        <p className="font-medium text-lg">No se encontraron platos registrados para el menú.</p>
                    </div>
                ) : (
                    filteredMenus.map((menu) => (
                        <div
                            key={menu.id}
                            className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-50 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between">
                                <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                                    <UtensilsCrossed size={24} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{menu.sku}</span>
                                    <div className="flex flex-col items-end mt-1">
                                        <span className="text-xl font-black text-gray-900 dark:text-white">
                                            ${menu.price.toFixed(2)}
                                        </span>
                                        {menu.is_sold_by_case && (
                                            <span className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase bg-primary/5 px-2 py-0.5 rounded-full mt-1">
                                                <Package size={10} />
                                                Caja x {menu.units_per_case}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 space-y-1">
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight uppercase tracking-tight">{menu.name}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] leading-relaxed">
                                    {menu.description || 'Sin descripción detallada para este producto del menú.'}
                                </p>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tipo / Categoría</span>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                        {menu.category?.name || 'Catering'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                    {confirmDeleteId === menu.id ? (
                                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-xl border border-red-100 dark:border-red-900/30 animate-in slide-in-from-right-2">
                                            <span className="text-[10px] font-black text-red-500 uppercase px-2">¿Borrar?</span>
                                            <button
                                                onClick={() => handleDelete(menu.id)}
                                                className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                Sí
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setSelectedMenu(menu);
                                                    setShowForm(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(menu.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showForm && (
                <CateringMenuForm
                    item={selectedMenu}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedMenu(null);
                    }}
                    onSuccess={() => {
                        setShowForm(false);
                        setSelectedMenu(null);
                        fetchData();
                    }}
                />
            )}

            {showCategoryManager && (
                <CateringCategoryManager
                    onClose={() => setShowCategoryManager(false)}
                    onRefresh={fetchData}
                />
            )}
        </div>
    );
}
