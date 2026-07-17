import React, { useState } from 'react';
import {
    X, User, Mail, Phone, MapPin,
    Shield, Lock, Loader2, Save,
    CheckCircle2, AlertCircle, UserPlus
} from 'lucide-react';
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
        is_superuser: initialData?.is_superuser || false,
        receive_service_emails: initialData?.receive_service_emails ?? true
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <UserPlus size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">Complete la información requerida del usuario</p>
                        </div>
                    </div>
                    <button onClick={onClose} type="button" className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sección: Información Personal */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <User size={18} className="text-blue-500" strokeWidth={2.5} />
                                </div>
                                <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Información Personal</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Nombres *</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium transition-all"
                                        value={formData.first_name}
                                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                        placeholder="Ej. Juan"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Apellidos *</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium transition-all"
                                        value={formData.last_name}
                                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                        placeholder="Ej. Pérez"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Email *</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email" required
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium transition-all"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Teléfono</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium transition-all"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Ubicación</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-4 top-3.5 text-gray-400" />
                                    <textarea
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium resize-none h-[52px] transition-all"
                                        placeholder="Dirección de residencia o trabajo"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección: Seguridad y Rol */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                    <Shield size={18} className="text-purple-500" strokeWidth={2.5} />
                                </div>
                                <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Seguridad y Acceso</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Rol de Acceso *</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold appearance-none transition-all"
                                        value={formData.role_id}
                                        onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar Rol</option>
                                        {roles && Array.isArray(roles) && roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">
                                        {initialData ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                                    </label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            required={!initialData}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium transition-all"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Estado del Cliente Toggle */}
                            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl mt-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        {formData.is_active ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Estado de la cuenta</div>
                                        <div className="text-xs font-medium text-gray-500">{formData.is_active ? 'Acceso permitido al sistema' : 'Acceso denegado'}</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Notificaciones Toggle (Solo para Admins) */}
                            {formData.is_superuser && (
                                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900/50 border border-blue-100 dark:border-blue-800 rounded-2xl mt-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.receive_service_emails ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Notificaciones de Servicios</div>
                                            <div className="text-xs font-medium text-gray-500">{formData.receive_service_emails ? 'Recibiendo correos' : 'Correos desactivados'}</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, receive_service_emails: !formData.receive_service_emails })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${formData.receive_service_emails ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.receive_service_emails ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {initialData ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
