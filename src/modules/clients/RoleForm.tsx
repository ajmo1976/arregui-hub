import React, { useState } from 'react';
import {
    X, Shield, Save, Loader2,
    LayoutDashboard, Package, Truck, Users,
    Settings, ScrollText, Calendar, Utensils
} from 'lucide-react';
import { motion } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';

interface RoleFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const AVAILABLE_MODULES = [
    { id: 'dashboard', label: 'Tablero (Dashboard)', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'clients', label: 'Clientes y Usuarios', icon: Users },
    { id: 'events', label: 'Calendario', icon: Calendar },
    { id: 'catering', label: 'Catering', icon: Utensils },
    { id: 'logs', label: 'Bitácora', icon: ScrollText },
    { id: 'settings', label: 'Configuración', icon: Settings },
];

export default function RoleForm({ onClose, onSuccess, initialData }: RoleFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        modules: initialData?.modules || [],
        is_active: initialData?.is_active ?? true
    });

    const toggleModule = (moduleId: string) => {
        const newModules = formData.modules.includes(moduleId)
            ? formData.modules.filter((id: string) => id !== moduleId)
            : [...formData.modules, moduleId];
        setFormData({ ...formData, modules: newModules });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error('El nombre del rol es obligatorio');

        setLoading(true);
        try {
            if (initialData) {
                await inventoryApi.updateRole(initialData.id, formData);
                toast.success('Rol actualizado correctamente');
            } else {
                await inventoryApi.createRole(formData);
                toast.success('Rol creado correctamente');
            }
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al guardar el rol');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Shield size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            {initialData ? 'Editar Rol' : 'Nuevo Rol Administrativo'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all shadow-sm">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nombre del Rol</label>
                            <input
                                type="text"
                                placeholder="Ej: LOGISTICA_AVANZADA"
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold uppercase transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Descripción</label>
                            <textarea
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all h-24 resize-none"
                                placeholder="¿Qué permisos tiene este rol?"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Módulos Permitidos</label>
                            <div className="grid grid-cols-2 gap-3">
                                {AVAILABLE_MODULES.map(module => {
                                    const Icon = module.icon;
                                    const isActive = formData.modules.includes(module.id);
                                    return (
                                        <button
                                            key={module.id}
                                            type="button"
                                            onClick={() => toggleModule(module.id)}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${isActive
                                                    ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10'
                                                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700 text-gray-500'
                                                }`}
                                        >
                                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                            <span className="text-sm font-bold tracking-tight">{module.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {initialData ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
