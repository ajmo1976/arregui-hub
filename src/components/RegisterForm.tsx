import React, { useState } from 'react';
import { Mail, Lock, User, UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import { inventoryApi } from '../services/api';
import { toast } from 'sonner';

interface RegisterFormProps {
    onBack: () => void;
    onSuccess: () => void;
}

export default function RegisterForm({ onBack, onSuccess }: RegisterFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await inventoryApi.register(formData);
            toast.success('¡Registro exitoso! Ya puedes iniciar sesión.');
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error en el registro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Crear Cuenta</h2>
                <p className="text-gray-500 font-medium">Únete a la plataforma de Arregui Hub</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Nombre"
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={formData.first_name}
                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Apellido"
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={formData.last_name}
                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="email"
                        placeholder="Correo Electrónico"
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95 text-lg font-black tracking-tight disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <UserPlus size={24} />}
                    Registrarse
                </button>
            </form>

            <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors text-sm"
            >
                <ArrowLeft size={16} />
                Volver al inicio de sesión
            </button>
        </div>
    );
}
