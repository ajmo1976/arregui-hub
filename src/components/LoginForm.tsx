import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Mail, Lock, Loader2, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../hooks/useAuth';
import axios from 'axios';
import { BACKEND_URL } from '../services/api';
import { toast } from 'sonner';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

// Global declaration for Google GIS
declare global {
    interface Window {
        google: any;
    }
}

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');
    const login = useAuthStore(state => state.login);

    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    useEffect(() => {
        // Initialize Google Identity Services
        const initGoogle = () => {
            if (window.google && view === 'login') {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById("googleBtn"),
                    {
                        theme: "outline",
                        size: "large",
                        type: "standard",
                        shape: "pill",
                        text: "continue_with",
                        logo_alignment: "left",
                        width: "100%"
                    }
                );
            }
        };

        // Small delay to ensure script is loaded and DOM is ready
        const timer = setTimeout(initGoogle, 500);
        return () => clearTimeout(timer);
    }, [view]);

    const handleGoogleResponse = async (response: any) => {
        setLoading(true);
        try {
            const res = await axios.post(`${BACKEND_URL}/api/v1/auth/google`, {
                credential: response.credential
            });

            const token = res.data.access_token;
            // Get profile info
            const userRes = await axios.get(`${BACKEND_URL}/api/v1/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            login(userRes.data, token);
            toast.success(`Bienvenido, ${userRes.data.first_name}`);
        } catch (err: any) {
            toast.error("Error al autenticar con Google");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);

            const tokenRes = await axios.post(`${BACKEND_URL}/api/v1/auth/login`, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const token = tokenRes.data.access_token;
            const userRes = await axios.get(`${BACKEND_URL}/api/v1/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            login(userRes.data, token);
            toast.success(`Bienvenido de nuevo, ${userRes.data.full_name}`);

        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 relative overflow-hidden font-inter">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -ml-48 -mb-48" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden relative z-10"
            >
                <div className="p-10">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                            <UtensilsCrossed size={32} strokeWidth={2.5} />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {view === 'login' ? (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-2">
                                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Arregui Hub</h1>
                                    <p className="text-gray-500 font-medium">Gestión inteligente para tu empresa</p>
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

                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-all" size={20} />
                                        <input
                                            type="password"
                                            required
                                            placeholder="Contraseña"
                                            className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 dark:text-white"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex justify-end mt-[-8px]">
                                        <button
                                            type="button"
                                            onClick={() => setView('forgot-password')}
                                            className="text-xs font-bold text-primary hover:underline px-2"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95 text-lg font-black tracking-tight disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                            <>
                                                <span>Entrar al Sistema</span>
                                                <ArrowRight size={22} strokeWidth={2.5} />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100 dark:border-gray-700"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] bg-white dark:bg-gray-800 px-4">
                                        O continuar con
                                    </div>
                                </div>

                                <div className="flex justify-center w-full">
                                    <div id="googleBtn" className="w-full min-h-[44px] flex justify-center overflow-hidden transition-all"></div>
                                </div>

                                <div className="text-center pt-6">
                                    <button
                                        onClick={() => setView('register')}
                                        className="inline-flex items-center gap-2 text-primary font-bold hover:underline transition-all text-sm group"
                                    >
                                        <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                                        ¿No tienes cuenta? Regístrate aquí
                                    </button>
                                </div>
                            </motion.div>
                        ) : view === 'register' ? (
                            <motion.div
                                key="register"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <RegisterForm
                                    onBack={() => setView('login')}
                                    onSuccess={() => setView('login')}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="forgot"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <ForgotPasswordForm onBack={() => setView('login')} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/30 p-8 text-center border-t border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        <ShieldCheck size={14} className="text-primary" />
                        Acceso Protegido por Arregui Hub
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
