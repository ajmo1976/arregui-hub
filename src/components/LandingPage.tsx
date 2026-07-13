import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';

const LandingPage = ({ onLoginClick }: { onLoginClick: () => void }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-between overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-green-500/10 via-green-100/30 to-transparent -z-10 rounded-b-[100px] transform skew-y-3"></div>
            
            {/* Header */}
            <header className="px-6 py-6 md:px-12 md:py-8 flex items-center justify-between">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3"
                >
                    <img src="/logo.png" alt="Inversiones Arregui Logo" className="h-[75px] w-auto object-contain" />
                </motion.div>
                
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={onLoginClick}
                    className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all active:scale-95"
                >
                    Iniciar Sesión
                </motion.button>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="max-w-4xl mx-auto space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 font-semibold text-sm border border-green-100 mb-4">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
                        </span>
                        Sistema de Gestión Operativa v2.0
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[1.1]">
                        El cerebro digital de <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                            Inversiones Arregui
                        </span>
                    </h1>
                    
                    <p className="text-lg md:text-2xl text-gray-500 max-w-2xl mx-auto font-medium">
                        Plataforma centralizada para la gestión de inventario, servicios corporativos, control de clientes y proveedores.
                    </p>

                    <motion.div 
                        className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <button 
                            onClick={onLoginClick}
                            className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-gray-900/20 active:scale-95 flex items-center justify-center gap-3 group"
                        >
                            Acceder al Panel
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </motion.div>

                {/* Features Grid */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 w-full px-4"
                >
                    {[
                        { icon: ShieldCheck, title: 'Seguridad AWS', desc: 'Infraestructura robusta alojada en la nube.' },
                        { icon: Zap, title: 'Tiempo Real', desc: 'Cotizaciones BCV y actualizaciones instantáneas.' },
                        { icon: Lock, title: 'Control de Roles', desc: 'Accesos segmentados por niveles de usuario.' }
                    ].map((feat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left flex gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-green-600 flex-shrink-0">
                                <feat.icon size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{feat.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </main>

            {/* Subtle Footer with Agency Branding */}
            <footer className="w-full pb-8 pt-12 flex flex-col items-center justify-center gap-2">
                <p className="text-sm font-medium text-gray-400">
                    &copy; {new Date().getFullYear()} Inversiones Arregui CA. Uso exclusivo.
                </p>
                
                {/* A&G Branding */}
                <div className="flex items-center gap-2 text-xs font-medium text-gray-400/60 hover:text-gray-600 transition-colors">
                    <span>Diseñado y desarrollado por</span>
                    <a 
                        href="https://itagss.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-gray-400 hover:text-green-600 group transition-all"
                    >
                        <span className="font-bold tracking-tight">A&G System Solutions</span>
                        <svg className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
