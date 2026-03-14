import React, { useState } from 'react';
import {
    X, User, Mail, Phone, MapPin,
    Shield, Lock, Loader2, Save,
    CheckCircle2, AlertCircle, UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';

interface UserFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    roles: any[];
}

export default function UserForm({ onClose, onSuccess, initialData, roles }: UserFormProps) {
    console.log('UserForm rendering with roles:', roles);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: initialData?.first_name || '',
        last_name: initialData?.last_name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        role_id: initialData?.role_id || '',
        is_active: initialData?.is_active ?? true,
        password: '',
        is_superuser: initialData?.is_superuser || false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await inventoryApi.updateUser(initialData.id, formData);
                toast.success('Usuario actualizado correctamente');
            } else {
                if (!formData.password) {
                    toast.error('La contraseña es obligatoria para nuevos usuarios');
                    setLoading(false);
                    return;
                }
                await inventoryApi.createUser(formData);
                toast.success('Usuario creado correctamente');
            }
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al guardar usuario');
        } finally {
            setLoading(false);
        }
    };

    if (!roles) return null; // Defensive check

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto">
                {/* Header */}
                <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <UserPlus size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} type="button" className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Sección: Información Personal */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <User size={18} className="text-primary" strokeWidth={2.5} />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Información Personal</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Nombres *</label>
                                <input
                                    type="text" required
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Apellidos *</label>
                                <input
                                    type="text" required
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Email *</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email" required
                                        className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Teléfono</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Ubicación</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-6 top-12 text-gray-400" />
                                <textarea
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium resize-none h-24"
                                    placeholder="Dirección de residencia o trabajo"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-50 dark:bg-gray-700/50" />

                    {/* Sección: Seguridad y Rol */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Shield size={18} className="text-primary" strokeWidth={2.5} />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Seguridad y Rol</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Rol de Acceso</label>
                                <select
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold appearance-none"
                                    value={formData.role_id}
                                    onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                                >
                                    <option value="">Seleccionar Rol</option>
                                    {roles && Array.isArray(roles) && roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                                    {initialData ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        required={!initialData}
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Estado del Cliente Toggle */}
                        <div className="flex items-center justify-between p-6 bg-green-50/30 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-3xl">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {formData.is_active ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Estado del Cliente</div>
                                    <div className="text-xs font-medium text-gray-500">El usuario tiene acceso al sistema</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`w-14 h-8 rounded-full transition-all relative ${formData.is_active ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
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
                            {initialData ? 'Actualizar Cliente' : 'Guardar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
