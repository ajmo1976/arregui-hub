import React, { useState, useEffect } from 'react';
import {
    X, Shield, Plus, Edit2, Trash2,
    Loader2, AlertTriangle,
    Lock, LayoutDashboard, Package, Truck, Users,
    Settings, ScrollText, Calendar, Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import RoleForm from './RoleForm';

interface RoleManagementProps {
    onClose: () => void;
}

const MODULE_ICONS: any = {
    dashboard: LayoutDashboard,
    inventory: Package,
    suppliers: Truck,
    clients: Users,
    events: Calendar,
    catering: Utensils,
    logs: ScrollText,
    settings: Settings
};

export default function RoleManagement({ onClose }: RoleManagementProps) {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedRole, setSelectedRole] = useState<any>(null);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await inventoryApi.getRoles();
            setRoles(res.data);
        } catch (err) {
            toast.error('Error al cargar roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este rol? Se perderán los accesos asociados.')) return;

        try {
            await inventoryApi.deleteRole(id);
            toast.success('Rol eliminado con éxito');
            fetchRoles();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al eliminar rol');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[65] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden shadow-gray-200/20"
            >
                {/* Header section matching ClientView */}
                <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Lock size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Ajustes de Roles</h2>
                            <p className="text-gray-500 font-medium tracking-tight text-xs uppercase">Configuración de perfiles y accesos al sistema</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setSelectedRole(null); setShowForm(true); }}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm font-bold"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            <span>Añadir Perfil</span>
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all shadow-sm">
                            <X size={24} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-primary" size={48} />
                            <p className="font-bold text-gray-400">Sincronizando perfiles...</p>
                        </div>
                    ) : roles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {roles.map(role => (
                                <motion.div
                                    key={role.id}
                                    layout
                                    className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-[2rem] hover:border-primary/50 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-primary shadow-sm">
                                                <Shield size={20} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{role.name}</span>
                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${role.is_active ? 'text-green-500' : 'text-red-500'}`}>
                                                    {role.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setSelectedRole(role); setShowForm(true); }}
                                                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-500 hover:text-primary transition-all shadow-sm"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(role.id)}
                                                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-500 hover:text-red-500 transition-all shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {role.description || 'Sin descripción adicional.'}
                                        </p>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {role.modules.map((mod: string) => {
                                                const Icon = MODULE_ICONS[mod] || Shield;
                                                return (
                                                    <div key={mod} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight shadow-sm">
                                                        <Icon size={12} className="text-primary/60" />
                                                        {mod}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                            <AlertTriangle className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="font-bold text-gray-400">No se han definido perfiles aún.</p>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {showForm && (
                        <RoleForm
                            onClose={() => setShowForm(false)}
                            onSuccess={() => {
                                setShowForm(false);
                                fetchRoles();
                            }}
                            initialData={selectedRole}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
