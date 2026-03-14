import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, Tag, Ruler, Warehouse, LayoutGrid, Loader2, Save, X, Trash2, History as HistoryIcon, Power, Download } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';

type ClassificationType = 'categories' | 'units' | 'warehouses' | 'product-types' | 'reasons';

export default function InventoryClassification() {
    const [activeTab, setActiveTab] = useState<ClassificationType>('categories');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', description: '', location: '', parent_id: '' });

    const fetchData = async (type: ClassificationType) => {
        setLoading(true);
        try {
            let res;
            if (type === 'categories') res = await inventoryApi.getCategories();
            else if (type === 'units') res = await inventoryApi.getUnits();
            else if (type === 'warehouses') res = await inventoryApi.getWarehouses();
            else if (type === 'product-types') res = await inventoryApi.getProductTypes();
            else if (type === 'reasons') res = await inventoryApi.getReasons();

            setData(res?.data || []);
        } catch (err) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const handleDelete = (id: number) => {
        toast('¿Desea eliminar este registro?', {
            description: 'Si tiene productos asociados, estos quedarán "Sin Categoría".',
            action: {
                label: 'Eliminar',
                onClick: async () => {
                    try {
                        if (activeTab === 'categories') await inventoryApi.deleteCategory(id);
                        else if (activeTab === 'units') await inventoryApi.deleteUnit(id);
                        else if (activeTab === 'warehouses') await inventoryApi.deleteWarehouse(id);
                        else if (activeTab === 'product-types') await inventoryApi.deleteProductType(id);
                        else if (activeTab === 'reasons') await inventoryApi.deleteReason(id);

                        toast.success('Registro eliminado exitosamente');
                        fetchData(activeTab);
                    } catch (err: any) {
                        toast.error(err.response?.data?.detail || 'Error al eliminar');
                    }
                }
            },
            cancel: {
                label: 'Cancelar',
                onClick: () => { }
            },
            duration: 10000,
        });
    };

    const handleToggle = async (id: number) => {
        try {
            if (activeTab === 'categories') await inventoryApi.toggleCategory(id);
            else if (activeTab === 'units') await inventoryApi.toggleUnit(id);
            else if (activeTab === 'warehouses') await inventoryApi.toggleWarehouse(id);
            else if (activeTab === 'product-types') await inventoryApi.toggleProductType(id);

            toast.success('Estado actualizado');
            fetchData(activeTab);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al cambiar estado');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (activeTab === 'categories') {
                await inventoryApi.createCategory({
                    name: newItem.name,
                    parent_id: newItem.parent_id ? parseInt(newItem.parent_id) : null,
                    is_active: true
                });
            }
            else if (activeTab === 'units') await inventoryApi.createUnit(newItem);
            else if (activeTab === 'warehouses') await inventoryApi.createWarehouse(newItem);
            else if (activeTab === 'product-types') await inventoryApi.createProductType(newItem);
            else if (activeTab === 'reasons') {
                await inventoryApi.createReason({
                    name: newItem.name,
                    description: newItem.description,
                    type: newItem.location === 'Entrada' ? 'Entrada' : 'Salida',
                    is_active: true
                });
            }

            toast.success('Elemento creado exitosamente');
            setShowForm(false);
            setNewItem({ name: '', description: '', location: '', parent_id: '' });
            fetchData(activeTab);
        } catch (err) {
            toast.error('Error al crear elemento');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'categories', label: 'Categorías', icon: Tag },
        { id: 'units', label: 'Unidades', icon: Ruler },
        { id: 'warehouses', label: 'Almacenes', icon: Warehouse },
        { id: 'product-types', label: 'Tipos de Producto', icon: LayoutGrid },
        { id: 'reasons', label: 'Motivos de Movimiento', icon: HistoryIcon },
    ];

    const handleExport = async () => {
        if (activeTab !== 'categories') {
            toast.error('Exportación solo disponible para categorías actualmente');
            return;
        }
        try {
            toast.info("Generando reporte de categorías...");
            await inventoryApi.exportCategories();
            toast.success("Reporte descargado exitosamente.");
        } catch (err) {
            console.error(err);
            toast.error("Error al exportar.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clasificación de Inventario</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona los parámetros dinámicos de tus productos</p>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'categories' && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl shadow-sm transition-all active:scale-95"
                        >
                            <Download size={20} />
                            <span>Exportar</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Nuevo Registro</span>
                    </button>
                </div>
            </div>

            <Tabs.Root value={activeTab} onValueChange={(val: string) => setActiveTab(val as ClassificationType)}>
                <Tabs.List className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Tabs.Trigger
                                key={tab.id}
                                value={tab.id}
                                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${activeTab === tab.id
                                        ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </Tabs.Trigger>
                        );
                    })}
                </Tabs.List>

                <div className="mt-6 bg-white dark:bg-gray-850 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {activeTab === 'warehouses' ? 'Ubicación' : activeTab === 'reasons' ? 'Tipo' : activeTab === 'categories' ? 'Dependencia' : 'Descripción'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {data.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                {activeTab === 'categories' && item.parent_id && <span className="text-gray-300 ml-4 font-thin">|—</span>}
                                                {item.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {activeTab === 'warehouses' ? item.location :
                                                activeTab === 'reasons' ? (
                                                    <span className={`font-bold ${item.type === 'Entrada' ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {item.type}
                                                    </span>
                                                ) : activeTab === 'categories' ? (
                                                    <span className={`text-xs px-2 py-1 rounded ${item.parent ? 'bg-primary/5 text-primary border border-primary/10' : 'bg-gray-100 dark:bg-gray-800 italic'}`}>
                                                        {item.parent?.name || 'Categoría Principal (Raíz)'}
                                                    </span>
                                                ) : (item.description || '-')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${item.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.is_active !== false ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            {activeTab !== 'reasons' && (
                                                <button
                                                    onClick={() => handleToggle(item.id)}
                                                    className={`p-2 rounded-lg transition-colors ${item.is_active !== false ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                                                    title={item.is_active !== false ? 'Desactivar' : 'Activar'}
                                                >
                                                    <Power size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No se encontraron registros</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </Tabs.Root>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nuevo {tabs.find(t => t.id === activeTab)?.label}</h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Nombre</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent outline-none focus:ring-2 focus:ring-primary dark:text-white"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>

                            {activeTab === 'categories' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Categoría Principal (Opcional)</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent outline-none focus:ring-2 focus:ring-primary dark:text-white dark:bg-gray-800"
                                        value={newItem.parent_id}
                                        onChange={e => setNewItem({ ...newItem, parent_id: e.target.value })}
                                    >
                                        <option value="">Es Categoría Principal</option>
                                        {data.filter((c: any) => !c.parent_id).map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                                    {activeTab === 'warehouses' ? 'Ubicación' : activeTab === 'reasons' ? 'Tipo de Flujo' : 'Descripción'}
                                </label>
                                {activeTab === 'reasons' ? (
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent outline-none focus:ring-2 focus:ring-primary dark:text-white dark:bg-gray-800"
                                        value={newItem.location}
                                        onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Entrada">Entrada (+)</option>
                                        <option value="Salida">Salida (-)</option>
                                    </select>
                                ) : (
                                    <input
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent outline-none focus:ring-2 focus:ring-primary dark:text-white"
                                        value={activeTab === 'warehouses' ? newItem.location : newItem.description}
                                        onChange={e => activeTab === 'warehouses'
                                            ? setNewItem({ ...newItem, location: e.target.value })
                                            : setNewItem({ ...newItem, description: e.target.value })}
                                    />
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
