import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Calendar,
    MapPin,
    Users,
    Filter,
    ChevronRight,
    Loader2,
    RefreshCw,
    MoreVertical,
    Edit3,
    Trash2,
    Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api, { inventoryApi } from '../../services/api';
import ServiceForm from './ServiceForm';
import MenuManagement from './MenuManagement';
import ServiceDetailView from './ServiceDetailView';
import { useAuthStore } from '../../hooks/useAuth';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function ServicesView() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'events' | 'menu'>('events');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const { user } = useAuthStore();
    const { canShowPrices } = useCurrency();

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await inventoryApi.getServiceEvents();
            setEvents(res.data);
        } catch (err) {
            toast.error('Error al cargar servicios');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;

        try {
            await inventoryApi.deleteServiceEvent(id);
            toast.success('Servicio eliminado correctamente');
            fetchEvents();
        } catch (err) {
            toast.error('Error al eliminar el servicio');
        }
    };

    const handleEdit = (e: React.MouseEvent | null, ev: any) => {
        if (e) e.stopPropagation();
        setEditingEvent(ev);
    };

    const handleDuplicate = (e: React.MouseEvent, ev: any) => {
        e.stopPropagation();
        // Limpiamos los IDs para que el formulario lo trate como un nuevo registro
        const { id, created_by, updated_by, ...cleanEvent } = ev;
        const cleanDetails = (ev.details || []).map(({ id, event_id, ...d }: any) => ({
            ...d,
            selected_items: [...(d.selected_items || [])]
        }));

        setEditingEvent({
            ...cleanEvent,
            title: `${cleanEvent.title} (Copia)`,
            details: cleanDetails
        });
        toast.info('Copiando datos para nuevo registro...');
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const filteredEvents = events
        .filter(ev =>
            ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ev.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ev.cost_center.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-inter">
            {/* Tabs & Main Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'events'
                            ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Calendar size={18} />
                        Registros
                    </button>
                    {user?.is_superuser && (
                        <button
                            onClick={() => setActiveTab('menu')}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'menu'
                                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Plus size={18} />
                            Gestión Menú
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'events' && (
                        <>
                            <button
                                onClick={fetchEvents}
                                className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 transition-colors text-gray-500"
                            >
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                            </button>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                <Plus size={20} />
                                <span>Nuevo Servicio</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {activeTab === 'events' ? (
                <>
                    {/* Search & Stats Section */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por evento, responsable o centro de costo..."
                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Main Content Table (Like Image 4) */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Registro</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Servicio / Responsable</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Fecha y Lugar</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Logística</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Estado</th>
                                        {canShowPrices && <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Monto</th>}
                                        <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    <AnimatePresence>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 className="animate-spin text-primary" size={40} />
                                                        <span className="text-gray-500 font-medium">Cargando servicios...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredEvents.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-gray-400">
                                                        <Plus size={48} strokeWidth={1} />
                                                        <p className="font-medium">No se encontraron servicios registrados.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEvents.map((ev, index) => (
                                                <motion.tr
                                                    key={ev.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                                                    onClick={() => setSelectedEvent(ev)}
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-black text-primary text-sm">#{ev.id}</span>
                                                            <span className="text-gray-500 text-xs font-medium">
                                                                {new Date(ev.created_at).toLocaleDateString('es-ES', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-900 dark:text-white text-base">{ev.title}</span>
                                                                {ev.details?.length > 1 && (
                                                                    <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight">
                                                                        Multiservicio ({ev.details.length})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col text-xs mt-1">
                                                                <div className="flex items-center gap-1.5 text-gray-500 font-bold uppercase tracking-tight">
                                                                    <Users size={12} className="text-primary/60" />
                                                                    <span>Resp: {ev.responsible}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-gray-400 font-medium italic mt-0.5">
                                                                    <span>Gestor: {ev.gestor || 'Sistema'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-2">
                                                            {ev.details && ev.details.length > 0 ? (
                                                                <>
                                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
                                                                        <Calendar size={14} className="text-gray-400" />
                                                                        <span>{new Date(ev.details[0].service_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} • {ev.details[0].service_time}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                                        <MapPin size={14} className="text-gray-400" />
                                                                        <span>{ev.details[0].location}</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs italic">Sin detalles</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm font-bold">
                                                                <Users size={14} className="text-gray-400" />
                                                                <span>
                                                                    {ev.details?.length > 1 ? (
                                                                        (() => {
                                                                            const allSame = ev.details.every((d: any) => d.attendees === ev.details[0].attendees);
                                                                            if (allSame) {
                                                                                return `${ev.details[0].attendees} PAX por servicio`;
                                                                            } else {
                                                                                // In case they are different, we can show total or a breakdown. 
                                                                                // User said "refleje la cantidad de personas por servicios".
                                                                                return ev.details.map((d: any) => d.attendees).join(' / ') + ' PAX';
                                                                            }
                                                                        })()
                                                                    ) : (
                                                                        `${ev.details?.[0]?.attendees || 0} personas`
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                                {ev.cost_center}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${ev.status === 'Abierta'
                                                            ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                                                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                                                            }`}>
                                                            {ev.status}
                                                        </span>
                                                    </td>
                                                    {canShowPrices && (
                                                        <td className="px-8 py-6">
                                                            <span className="font-black text-gray-900 dark:text-white text-lg">
                                                                ${ev.details?.reduce((acc: number, d: any) => acc + d.estimated_amount, 0).toFixed(2) || '0.00'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {(user?.is_superuser || !canShowPrices || Number(ev.created_by?.id || ev.created_by) === Number(user?.id)) && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => handleDuplicate(e, ev)}
                                                                        className="p-2.5 rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-gray-400 hover:text-primary"
                                                                        title="Duplicar Evento"
                                                                    >
                                                                        <Copy size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => handleEdit(e, ev)}
                                                                        className="p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-400 hover:text-blue-600"
                                                                        title="Editar"
                                                                    >
                                                                        <Edit3 size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => handleDelete(e, ev.id)}
                                                                        className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-400 hover:text-red-600"
                                                                        title="Eliminar"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                                                <MoreVertical size={20} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Modal de Nuevo/Editar Servicio */}
                    {(showModal || editingEvent) && (
                        <ServiceForm
                            initialData={editingEvent}
                            onClose={() => {
                                setShowModal(false);
                                setEditingEvent(null);
                                fetchEvents();
                            }}
                        />
                    )}

                    <AnimatePresence>
                        {selectedEvent && (
                            <ServiceDetailView
                                event={selectedEvent}
                                onClose={() => setSelectedEvent(null)}
                                onEdit={(ev) => {
                                    setSelectedEvent(null);
                                    handleEdit(null as any, ev);
                                }}
                            />
                        )}
                    </AnimatePresence>
                </>
            ) : (
                <MenuManagement />
            )}
        </div>
    );
}
