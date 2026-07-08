import React, { useState, useEffect } from 'react';
import {
    Monitor,
    Bell,
    Home,
    Layers,
    Scale,
    Package,
    TrendingUp,
    DollarSign,
    FileText,
    Users,
    Coffee,
    Plus,
    Calendar,
    Trash2,
    X,
    Mail,
    Save,
    ArrowRight,
    CreditCard,
    Activity,
    Landmark,
    Percent
} from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MAIN_CATEGORIES = [
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'restaurante', label: 'Restaurante', icon: Home },
];

const PARAMETER_GROUPS = [
    { id: 'prices', label: 'Precios Plato', icon: DollarSign, active: true },
    { id: 'tasa', label: 'Tasa BCV', icon: TrendingUp },
    { id: 'bank', label: 'Lista de Bancos', icon: Landmark },
    { id: 'account_type', label: 'Tipos de Cuenta', icon: Layers },
    { id: 'payment_method', label: 'Métodos de Pago', icon: CreditCard },
    { id: 'event_status', label: 'Estados de Evento', icon: Activity },
    { id: 'tax_rate', label: 'Impuestos (IVA)', icon: Percent },
];

export default function SystemSettings() {
    const [loading, setLoading] = useState(false);
    const [activeMainTab, setActiveMainTab] = useState('notificaciones');
    const [activeParamTab, setActiveParamTab] = useState('prices');

    const [prices, setPrices] = useState<any[]>([]);
    const [config, setConfig] = useState({
        smtp_server: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        smtp_from_email: '',
        admin_emails: ''
    });

    const [newPrice, setNewPrice] = useState({
        type: 'ESTANDAR',
        price: 0,
        effective_date: new Date().toISOString().split('T')[0]
    });
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

    const [rates, setRates] = useState<any[]>([]);
    const [lastSync, setLastSync] = useState<string | null>(null);

    const [sysParams, setSysParams] = useState<any[]>([]);
    const [isParamModalOpen, setIsParamModalOpen] = useState(false);
    const [editingParam, setEditingParam] = useState<any>(null);
    const [paramFormData, setParamFormData] = useState({
        name: '',
        value: '',
        description: '',
        is_active: true
    });

    useEffect(() => {
        if (activeParamTab === 'prices') fetchPrices();
        else if (activeParamTab === 'tasa') fetchRates();
        else fetchParams(activeParamTab);
        fetchConfig();
    }, [activeParamTab]);

    const fetchParams = async (category: string) => {
        try {
            setLoading(true);
            const res = await inventoryApi.getParameters(category);
            setSysParams(res.data);
        } catch (error) {
            toast.error('Error al cargar parámetros');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveParam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingParam) {
                await inventoryApi.updateParameter(editingParam.id, paramFormData);
                toast.success('Parámetro actualizado');
            } else {
                await inventoryApi.createParameter({ ...paramFormData, category: activeParamTab });
                toast.success('Parámetro creado');
            }
            setIsParamModalOpen(false);
            fetchParams(activeParamTab);
        } catch (error) {
            toast.error('Error al guardar parámetro');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteParam = async (id: number) => {
        if (!window.confirm('¿Eliminar este parámetro?')) return;
        try {
            await inventoryApi.deleteParameter(id);
            toast.success('Parámetro eliminado');
            fetchParams(activeParamTab);
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const fetchRates = async () => {
        try {
            setLoading(true);
            const response = await inventoryApi.getExchangeRates();
            setRates(response.data);
            if (response.data.length > 0) {
                setLastSync(new Date(response.data[0].updated_at).toLocaleTimeString());
            }
        } catch (error) {
            toast.error('Error al cargar tasas de cambio');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncRate = async () => {
        try {
            setLoading(true);
            toast.promise(inventoryApi.syncExchangeRate(), {
                loading: 'Consultando BCV...',
                success: (res) => {
                    fetchRates();
                    return `Tasa actualizada: ${res.data.rate_value} VES`;
                },
                error: 'No se pudo conectar con el BCV'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPrices = async () => {
        try {
            setLoading(true);
            const response = await inventoryApi.getMealPrices();
            setPrices(response.data);
        } catch (error) {
            toast.error('Error al cargar precios');
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await inventoryApi.getEmailConfig();
            setConfig(response.data);
        } catch (error) {
            console.error('Error fetching config:', error);
            toast.error('No se pudo cargar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await inventoryApi.updateEmailConfig(config);
            toast.success('Configuración guardada correctamente');
        } catch (error) {
            toast.error('Error al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await inventoryApi.createMealPrice(newPrice);
            toast.success('Precio guardado');
            setIsPriceModalOpen(false);
            fetchPrices();
        } catch (error) {
            toast.error('Error al guardar el precio');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePrice = async (id: number) => {
        if (!window.confirm('¿Eliminar este registro de precio?')) return;
        try {
            await inventoryApi.deleteMealPrice(id);
            toast.success('Precio eliminado');
            fetchPrices();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const currentStandard = prices.find(p => p.type === 'ESTANDAR')?.price || 0;
    const currentOverDinner = prices.find(p => p.type === 'SOBRE_CENA')?.price || 0;

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0E14] font-inter antialiased">
            <div className="max-w-[1200px] mx-auto px-6 py-12">

                {/* Minimalist Header */}
                <div className="mb-10 ml-2">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Configuración</h1>
                    <p className="text-gray-500 text-sm font-medium">Personaliza la plataforma y la operación</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Compact Sidebar */}
                    <aside className="lg:w-64 space-y-4">
                        <div className="bg-white dark:bg-[#151921] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-3 space-y-1">
                            {MAIN_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveMainTab(cat.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold text-sm ${activeMainTab === cat.id
                                        ? 'bg-[#4CAF50] text-white shadow-xl shadow-green-500/20'
                                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1C222C] hover:text-gray-900'
                                        }`}
                                >
                                    <cat.icon size={18} />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Main Card Content */}
                    <main className="flex-1">
                        <div className="bg-white dark:bg-[#151921] rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-10 min-h-[600px] relative overflow-hidden">
                            {activeMainTab === 'restaurante' ? (
                                <div className="space-y-10">
                                    {/* Section Heading */}
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Parámetros del Sistema</h2>
                                        <p className="text-gray-400 text-sm font-medium">Gestiona las tablas auxiliares y valores globales</p>
                                    </div>

                                    {/* Parameter Groups Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/50 dark:bg-gray-900/30 p-2 rounded-3xl border border-gray-100 dark:border-gray-800">
                                        {PARAMETER_GROUPS.map((group) => (
                                            <button
                                                key={group.id}
                                                onClick={() => setActiveParamTab(group.id)}
                                                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${activeParamTab === group.id
                                                    ? 'bg-[#4CAF50] text-white shadow-lg shadow-green-500/10'
                                                    : 'text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900'
                                                    }`}
                                            >
                                                <group.icon size={14} />
                                                {group.label}
                                            </button>
                                        ))}
                                    </div>

                                    {activeParamTab === 'prices' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {/* Price Layout from Image */}
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex-1 min-w-[200px] bg-green-50/50 dark:bg-green-900/10 p-6 rounded-[1.5rem] border border-green-100 dark:border-green-900/20">
                                                    <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-2">Precio Estándar (Almuerzo/Cena)</p>
                                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">${currentStandard.toFixed(2)}</h3>
                                                </div>
                                                <div className="flex-1 min-w-[200px] bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-[1.5rem] border border-orange-100 dark:border-orange-900/20">
                                                    <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-2">Precio Sobre Cena</p>
                                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">${currentOverDinner.toFixed(2)}</h3>
                                                </div>
                                                <div className="ml-auto">
                                                    <button
                                                        onClick={() => setIsPriceModalOpen(true)}
                                                        className="bg-[#4CAF50] hover:bg-[#43a047] text-white px-6 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-green-500/20 flex items-center gap-2 transition-transform active:scale-95"
                                                    >
                                                        <Plus size={20} />
                                                        Nuevo Precio
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Table matching image style */}
                                            <div className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                                            <th className="px-8 py-5">Fecha</th>
                                                            <th className="px-8 py-5">Tipo</th>
                                                            <th className="px-8 py-5">Precio</th>
                                                            <th className="px-8 py-5">Registrado Por</th>
                                                            <th className="px-8 py-5 sr-only">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                        {prices.sort((a, b) => b.id - a.id).map((p) => (
                                                            <tr key={p.id} className="group hover:bg-gray-50/20 dark:hover:bg-gray-800/20 transition-colors">
                                                                <td className="px-8 py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <Calendar size={16} className="text-gray-300" />
                                                                        <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                                                                            {new Date(p.effective_date).toISOString().split('T')[0]}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5">
                                                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.type === 'ESTANDAR'
                                                                        ? 'bg-green-100/60 text-green-600'
                                                                        : 'bg-orange-100/60 text-orange-600'
                                                                        }`}>
                                                                        {p.type === 'ESTANDAR' ? 'Estándar' : 'Sobre Cena'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-5 font-black text-gray-900 dark:text-white text-sm">${p.price.toFixed(2)}</td>
                                                                <td className="px-8 py-5 text-sm font-medium text-gray-500">Admin</td>
                                                                <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100">
                                                                    <button onClick={() => handleDeletePrice(p.id)} className="text-gray-300 hover:text-red-500 p-2">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {activeParamTab === 'tasa' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {/* Exchange Rate Hero */}
                                            <div className="flex flex-wrap items-center gap-6">
                                                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex-1 min-w-[300px] relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                                        <TrendingUp size={100} />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                                            Tasa Oficial BCV (USD/VES)
                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                                        </p>
                                                        <div className="flex items-baseline gap-3">
                                                            <h3 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                                                                {rates[0]?.rate_value?.toFixed(2) || '0.00'}
                                                            </h3>
                                                            <span className="text-xl font-bold text-gray-400">VES</span>
                                                        </div>
                                                        <p className="text-xs font-medium text-gray-400 mt-2 italic">
                                                            {rates[0] ? `Actualizado: ${new Date(rates[0].rate_date).toLocaleDateString()}` : 'Sin datos recientes'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <button
                                                        onClick={handleSyncRate}
                                                        className="w-full bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 active:scale-95 shadow-sm"
                                                    >
                                                        <TrendingUp size={18} />
                                                        Sincronizar BCV Ahora
                                                    </button>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                                                        Auto-sync: 11:30 PM Diaria
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Historical Table */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Registro Histórico</h4>
                                                <div className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                                                <th className="px-8 py-5">Fecha</th>
                                                                <th className="px-8 py-5 text-center">Tasa (VES)</th>
                                                                <th className="px-8 py-5 text-center">Fuente</th>
                                                                <th className="px-8 py-5 text-right">Estado</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                            {rates.map((r, i) => (
                                                                <tr key={r.id} className="group transition-colors hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                                                                    <td className="px-8 py-5">
                                                                        <div className="flex items-center gap-3">
                                                                            <Calendar size={16} className="text-gray-300" />
                                                                            <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                                                                                {new Date(r.rate_date).toLocaleDateString('es-VE', {
                                                                                    weekday: 'short',
                                                                                    day: '2-digit',
                                                                                    month: 'short',
                                                                                    year: 'numeric'
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-5 text-center font-black text-indigo-600 dark:text-indigo-400">
                                                                        {r.rate_value.toFixed(4)}
                                                                    </td>
                                                                    <td className="px-8 py-5 text-center">
                                                                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                                                            {r.source}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-5 text-right">
                                                                        {i === 0 ? (
                                                                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center justify-end gap-1.5">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                                Vigente
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Histórico</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {rates.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">
                                                                        No hay registros históricos disponibles. Presione sincronizar para empezar.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {['account_type', 'payment_method', 'event_status', 'bank', 'tax_rate'].includes(activeParamTab) && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Registros Disponibles</h4>
                                                <button
                                                    onClick={() => {
                                                        setEditingParam(null);
                                                        setParamFormData({ name: '', value: '', description: '', is_active: true });
                                                        setIsParamModalOpen(true);
                                                    }}
                                                    className="bg-[#4CAF50] hover:bg-[#43a047] text-white px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-green-500/10"
                                                >
                                                    <Plus size={14} />
                                                    Añadir Nuevo
                                                </button>
                                            </div>

                                            <div className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                                            <th className="px-8 py-5">Nombre</th>
                                                            <th className="px-8 py-5">Valor</th>
                                                            <th className="px-8 py-5">Descripción</th>
                                                            <th className="px-8 py-5">Estado</th>
                                                            <th className="px-8 py-5 sr-only">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                        {sysParams.map((p) => (
                                                            <tr key={p.id} className="group hover:bg-gray-50/20 dark:hover:bg-gray-800/20 transition-colors">
                                                                <td className="px-8 py-5 font-bold text-gray-900 dark:text-white text-sm">{p.name}</td>
                                                                <td className="px-8 py-5 text-gray-500 text-sm font-medium">{p.value}</td>
                                                                <td className="px-8 py-5 text-gray-400 text-xs">{p.description || '-'}</td>
                                                                <td className="px-8 py-5">
                                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${p.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                        {p.is_active ? 'Activo' : 'Inactivo'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingParam(p);
                                                                            setParamFormData({ ...p });
                                                                            setIsParamModalOpen(true);
                                                                        }}
                                                                        className="text-gray-300 hover:text-primary p-2"
                                                                    >
                                                                        <Layers size={16} />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteParam(p.id)} className="text-gray-300 hover:text-red-500 p-2">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {sysParams.length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">
                                                                    No hay parámetros definidos para esta categoría.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            ) : activeMainTab === 'notificaciones' ? (
                                <div className="max-w-xl mx-auto py-6">
                                    <div className="mb-10">
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                <Mail size={24} className="text-[#4CAF50]" />
                                            </div>
                                            Configuración SMTP
                                        </h2>
                                        <p className="text-gray-500 text-sm font-medium ml-1">Configura el servidor para envíos automáticos</p>
                                    </div>
                                    <form onSubmit={handleSaveEmail} className="space-y-6 bg-gray-50/50 dark:bg-gray-900/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Host Servidor</label>
                                                <input
                                                    type="text"
                                                    value={config.smtp_server}
                                                    onChange={(e) => setConfig({ ...config, smtp_server: e.target.value })}
                                                    className="w-full bg-white dark:bg-[#1C222C] border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-green-500/20"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Puerto</label>
                                                <input
                                                    type="number"
                                                    value={config.smtp_port}
                                                    onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) })}
                                                    className="w-full bg-white dark:bg-[#1C222C] border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-green-500/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Usuario / Password</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    type="email"
                                                    value={config.smtp_user}
                                                    onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                                                    className="w-full bg-white dark:bg-[#1C222C] border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-green-500/20"
                                                />
                                                <input
                                                    type="password"
                                                    value={config.smtp_password}
                                                    onChange={(e) => setConfig({ ...config, smtp_password: e.target.value })}
                                                    className="w-full bg-white dark:bg-[#1C222C] border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-green-500/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 pt-4">
                                            <button type="submit" className="w-full bg-[#4CAF50] text-white py-4 rounded-xl font-bold text-sm shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 hover:bg-[#43a047] transition-all">
                                                <Save size={18} />
                                                Guardar Cambios
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                    <h3 className="text-lg font-bold">Próximamente</h3>
                                    <p className="text-sm">Esta sección está en desarrollo</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Compact Modal for New Price */}
            <AnimatePresence>
                {isPriceModalOpen && (
                    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-[110] p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#151921] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Nuevo Ajuste</h3>
                                <button onClick={() => setIsPriceModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSavePrice} className="p-8 pt-0 space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Modalidad</label>
                                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl">
                                        {[
                                            { id: 'ESTANDAR', label: 'Estándar' },
                                            { id: 'SOBRE_CENA', label: 'Sobre Cena' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setNewPrice({ ...newPrice, type: opt.id })}
                                                className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${newPrice.type === opt.id
                                                    ? 'bg-white dark:bg-gray-800 text-[#4CAF50] shadow-sm'
                                                    : 'text-gray-400 hover:text-gray-600'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Monto Sugerido</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="w-full bg-gray-50/50 dark:bg-gray-900/50 border-none rounded-2xl px-6 py-5 text-4xl font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20 tracking-tighter"
                                            value={newPrice.price}
                                            onChange={e => setNewPrice({ ...newPrice, price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Entrada en Vigor</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-gray-50/50 dark:bg-gray-900/50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-green-500/20"
                                            value={newPrice.effective_date}
                                            onChange={e => setNewPrice({ ...newPrice, effective_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#4CAF50] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#43a047] transition-all shadow-xl shadow-green-500/20 active:scale-95"
                                >
                                    Confirmar Cambio
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal for System Parameters */}
            <AnimatePresence>
                {isParamModalOpen && (
                    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 font-inter">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#151921] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between">
                                <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                    {editingParam ? 'Editar' : 'Nuevo'} Parámetro
                                </h4>
                                <button onClick={() => setIsParamModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveParam} className="p-8 pt-0 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Nombre a Mostrar</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-gray-50/50 dark:bg-gray-900/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20"
                                            placeholder="Ej. Transferencia"
                                            value={paramFormData.name}
                                            onChange={e => setParamFormData({ ...paramFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Valor Interno / Slug</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-gray-50/50 dark:bg-gray-900/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20"
                                            placeholder="ej_valor_corto"
                                            value={paramFormData.value}
                                            onChange={e => setParamFormData({ ...paramFormData, value: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Descripción</label>
                                        <textarea
                                            className="w-full bg-gray-50/50 dark:bg-gray-900/50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20 h-20 resize-none"
                                            placeholder="..."
                                            value={paramFormData.description}
                                            onChange={e => setParamFormData({ ...paramFormData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-100/50 dark:bg-gray-900/50 rounded-2xl">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Estado Activo</span>
                                        <button
                                            type="button"
                                            onClick={() => setParamFormData({ ...paramFormData, is_active: !paramFormData.is_active })}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${paramFormData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform ${paramFormData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#4CAF50] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#43a047] transition-all shadow-xl shadow-green-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Confirmar Registro'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>

    );
}
