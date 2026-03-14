import React, { useState } from 'react';
import { Mail, Loader2, ArrowLeft, Send, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ForgotPasswordFormProps {
    onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Placeholder for real API call
            // await inventoryApi.forgotPassword(email);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
            setSubmitted(true);
            toast.success('Si el correo está registrado, recibirás las instrucciones.');
        } catch (err: any) {
            toast.error('Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
            >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
                    <Send size={32} />
                </div>
                <div className="space-y-3">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">¡Correo Enviado!</h2>
                    <p className="text-gray-500 font-medium leading-relaxed px-4">
                        Hemos enviado un enlace de recuperación a <span className="text-primary font-bold">{email}</span>. Revisa tu bandeja de entrada.
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                    Volver al Inicio
                </button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                    <KeyRound size={28} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Recuperar Clave</h2>
                <p className="text-gray-500 font-medium">Ingresa tu email para recibir un enlace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-all" size={20} />
                    <input
                        type="email"
                        required
                        placeholder="Email corporativo"
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 dark:text-white"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95 text-lg font-black tracking-tight disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                        <>
                            <span>Enviar Instrucciones</span>
                        </>
                    )}
                </button>
            </form>

            <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors text-sm"
            >
                <ArrowLeft size={16} />
                Cancelar y volver
            </button>
        </div>
    );
}
