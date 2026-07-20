import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Calendar,
    UtensilsCrossed,
    Package,
    ClipboardList,
    Users,
    Truck,
    Settings,
    User,
    Menu,
    X,
    Sun,
    Moon,
    LogOut
} from 'lucide-react';
import { Toaster } from 'sonner';

import InventoryView from './modules/inventory/InventoryView';
import LoginForm from './components/LoginForm';
import LandingPage from './components/LandingPage';
import { useAuthStore } from './hooks/useAuth';
import SupplierView from './modules/suppliers/SupplierView';
import ClientView from './modules/clients/ClientView';
import ServicesView from './modules/services/ServicesView';
import ServicesCalendar from './modules/services/ServicesCalendar';
import SystemSettings from './modules/system/SystemSettings';
import DailyRecordsView from './modules/operational/DailyRecordsView';
import Dashboard from './modules/dashboard/Dashboard';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CurrencySwitcher } from './components/CurrencySwitcher';

// --- Main Dashboard Menu (Grid) ---
const DashboardGrid = ({ modules, onNavigate, user }: { modules: any[], onNavigate: (id: string) => void, user: any }) => {
    return (
        <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                        Hola, <span className="text-primary">{user?.full_name}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 font-medium tracking-tight">Bienvenido a tu panel de control</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm self-start md:self-auto">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Rol Actual:</span>
                    <span className="px-5 py-1 bg-primary/10 text-primary text-xs font-black rounded-full uppercase tracking-tighter border border-primary/20">
                        {user?.role_name}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {modules.map((mod, index) => {
                    const Icon = mod.icon;
                    return (
                        <motion.button
                            key={mod.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                            onClick={() => onNavigate(mod.id)}
                            className={`
                group relative aspect-square rounded-3xl p-8 flex flex-col items-center justify-center gap-8 text-white shadow-xl shadow-gray-200/50 dark:shadow-none
                transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 active:scale-95 overflow-hidden
                ${mod.color}
              `}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="flex items-center justify-center w-24 h-24">
                                <Icon size={80} strokeWidth={1.5} className="transition-transform duration-500 group-hover:scale-110" />
                            </div>
                            <div className="w-full space-y-4">
                                <div className="w-full h-px bg-white/20" />
                                <span className="block text-xl font-black tracking-[0.2em] uppercase text-center">{mod.label}</span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

type ModuleId = 'menu' | 'dashboard' | 'events' | 'catering' | 'inventory' | 'logs' | 'clients' | 'suppliers' | 'settings' | 'profile';

export default function App() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const [activeModule, setActiveModule] = useState<ModuleId>('menu');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showLanding, setShowLanding] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    useEffect(() => {
        const checkScreenSize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setActiveModule('menu');
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        if (showLanding) {
            return (
                <div className={isDarkMode ? 'dark' : ''}>
                    <LandingPage onLoginClick={() => setShowLanding(false)} />
                </div>
            )
        }
        return (
            <CurrencyProvider>
                <div className={isDarkMode ? 'dark' : ''}>
                    <Toaster position="top-center" richColors />
                    <LoginForm />
                </div>
            </CurrencyProvider>
        );
    }

    const allModules = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-[#43a047]' },
        { id: 'events', label: 'Calendario', icon: Calendar, color: 'bg-[#42a5f5]' },
        { id: 'catering', label: 'Servicios', icon: UtensilsCrossed, color: 'bg-[#f06292]' },
        { id: 'inventory', label: 'Inventario', icon: Package, color: 'bg-[#fbc02d]' },
        { id: 'logs', label: 'Registros', icon: ClipboardList, color: 'bg-[#7986cb]' },
        { id: 'clients', label: 'Clientes', icon: Users, color: 'bg-[#26a69a]' },
        { id: 'suppliers', label: 'Proveedores', icon: Truck, color: 'bg-[#ff9800]' },
        { id: 'settings', label: 'Configuración', icon: Settings, color: 'bg-[#455a64]' },
    ];

    const allowedModules = user?.is_superuser
        ? allModules
        : allModules.filter(m => (user?.allowed_modules || []).includes(m.id));

    const renderModule = () => {
        switch (activeModule) {
            case 'dashboard': return <Dashboard />;
            case 'events': return (
                <ServicesCalendar
                    onEventClick={(id) => {
                        setSelectedEventId(id);
                        setActiveModule('catering');
                    }}
                />
            );
            case 'catering': return (
                <ServicesView
                    initialSelectedEventId={selectedEventId}
                    onClearRoute={() => setSelectedEventId(null)}
                />
            );
            case 'inventory': return <InventoryView />;
            case 'suppliers': return <SupplierView />;
            case 'logs': return <DailyRecordsView />;
            case 'clients': return <ClientView />;
            case 'settings': return <SystemSettings />;
            default: return <div className="p-8"><h2 className="text-3xl font-bold">Módulo en Desarrollo</h2></div>;
        }
    };

    if (activeModule === 'menu') {
        return (
            <CurrencyProvider>
                <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''} bg-white dark:bg-gray-950`}>
                    <Toaster position="top-center" richColors />

                    <header className="bg-[#1a1c23] px-8 py-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                                <UtensilsCrossed size={18} className="text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white">
                                Arregui <span className="text-white/60">Hub</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-6">
                            {user?.is_superuser || (user?.role_name?.toLowerCase() !== 'básico' && user?.role_name?.toLowerCase() !== 'basico') ? <CurrencySwitcher variant="dark" /> : null}
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-white/80 hover:text-white transition-colors">
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-white leading-none">{user?.full_name}</span>
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{user?.role_name}</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                    <User size={20} className="text-white/40" />
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="animate-in fade-in duration-500">
                        <DashboardGrid
                            modules={allowedModules}
                            onNavigate={(id) => setActiveModule(id as ModuleId)}
                            user={user}
                        />
                    </main>
                </div>
            </CurrencyProvider>
        );
    }

    return (
        <CurrencyProvider>
            <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
                <Toaster position="top-center" richColors />

                <motion.aside
                    initial={false}
                    animate={{ width: isSidebarOpen ? 280 : 80 }}
                    className="h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-20"
                >
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-900/20 flex-shrink-0">
                                <UtensilsCrossed size={22} />
                            </div>
                            {isSidebarOpen && (
                                <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
                                    Arregui <span className="text-primary">Hub</span>
                                </span>
                            )}
                        </div>
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                                title="Ocultar menú"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="px-4 mb-4">
                        <button
                            onClick={() => setActiveModule('menu')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                        >
                            <LayoutDashboard size={18} className="flex-shrink-0" />
                            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">Menú Principal</span>}
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                        {allowedModules.map((mod) => {
                            const Icon = mod.icon;
                            const isActive = activeModule === mod.id;
                            return (
                                <button
                                    key={mod.id}
                                    onClick={() => setActiveModule(mod.id as ModuleId)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon className={`flex-shrink-0 duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} size={20} />
                                    {isSidebarOpen && <span className="font-medium">{mod.label}</span>}
                                    {isActive && isSidebarOpen && (
                                        <motion.div
                                            layoutId="active-nav"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            {isSidebarOpen && <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
                        </button>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                        >
                            <LogOut size={20} />
                            {isSidebarOpen && <span>Cerrar Sesión</span>}
                        </button>
                    </div>
                </motion.aside>

                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 h-screen">
                    <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 z-10 px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                            >
                                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                            <div className="h-8 w-px bg-gray-100 dark:bg-gray-700 mx-2" />
                            {user?.is_superuser || (user?.role_name?.toLowerCase() !== 'básico' && user?.role_name?.toLowerCase() !== 'basico') ? <CurrencySwitcher /> : null}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.full_name}</span>
                                <span className="text-xs text-gray-500">{user?.role_name}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-primary/20">
                                <User size={40} className="text-gray-400 p-2" />
                            </div>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeModule}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderModule()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </CurrencyProvider>
    );
}
