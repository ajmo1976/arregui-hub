import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, LayoutGrid, Edit3, Check } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';

interface Props {
    onClose: () => void;
    onRefresh: () => void;
}

export default function CateringCategoryManager({ onClose, onRefresh }: Props) {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [creating, setCreating] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await inventoryApi.getCateringCategories();
            setCategories(res.data);
        } catch (err) {
            toast.error('Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async () => {
        if (!newCategory.trim()) return;
        setCreating(true);
        try {
            await inventoryApi.createCateringCategory({ name: newCategory });
            toast.success('Categoría creada');
            setNewCategory('');
            fetchCategories();
            onRefresh();
        } catch (err) {
            toast.error('Error al crear categoría');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editValue.trim()) return;
        try {
            await inventoryApi.updateCateringCategory(id, { name: editValue });
            toast.success('Categoría actualizada');
            setEditingId(null);
            fetchCategories();
            onRefresh();
        } catch (err) {
            toast.error('Error al actualizar categoría');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await inventoryApi.deleteCateringCategory(id);
            toast.success('Categoría eliminada');
            setConfirmDeleteId(null);
            fetchCategories();
            onRefresh();
        } catch (err) {
            toast.error('Error al eliminar categoría');
        }
    };

    const startEditing = (cat: any) => {
        setEditingId(cat.id);
        setEditValue(cat.name);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 font-inter">
                <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="text-primary"><LayoutGrid size={20} /></div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gestionar Categorías</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Add New Category */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nueva categoría (P. ej. Sushi, Parrilla)"
                            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                        <button
                            onClick={handleCreate}
                            disabled={creating || !newCategory.trim()}
                            className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
                        >
                            {creating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                        </button>
                    </div>

                    {/* List of Categories */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-primary" size={24} />
                            </div>
                        ) : categories.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-8 italic">No hay categorías personalizadas</p>
                        ) : (
                            categories.map(cat => (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 group hover:border-primary/30 transition-all font-inter"
                                >
                                    {editingId === cat.id ? (
                                        <div className="flex-1 flex gap-2 items-center px-1">
                                            <input
                                                autoFocus
                                                type="text"
                                                className="flex-1 bg-white dark:bg-gray-900 border border-primary/30 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleUpdate(cat.id);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                            />
                                            <button onClick={() => handleUpdate(cat.id)} className="p-1.5 text-primary hover:bg-primary/5 rounded-lg transition-all">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : confirmDeleteId === cat.id ? (
                                        <div className="flex-1 flex items-center justify-between px-1 animate-in slide-in-from-right-2 duration-200">
                                            <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                                                <Trash2 size={12} /> ¿Eliminar "{cat.name}"?
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors shadow-sm shadow-red-200"
                                                >
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 px-2">{cat.name}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEditing(cat)}
                                                    className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(cat.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
