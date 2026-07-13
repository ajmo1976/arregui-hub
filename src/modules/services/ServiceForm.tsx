import React, { useState } from 'react';
import {
    X,
    Plus,
    Calendar,
    Users,
    Hash,
    Activity,
    Save,
    Loader2,
    Briefcase,
    Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { inventoryApi } from '../../services/api';
import ServiceDetailCard from './ServiceDetailCard';
import { useCurrency } from '../../contexts/CurrencyContext';

interface ServiceFormProps {
    onClose: (updatedEvent?: any) => void;
    initialData?: any;
}

export default function ServiceForm({ onClose, initialData }: ServiceFormProps) {
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [eventStatuses, setEventStatuses] = useState<any[]>([]);
    const [showGeneralInfo, setShowGeneralInfo] = useState(true);
    const [activeDetailIndex, setActiveDetailIndex] = useState(0);

    React.useEffect(() => {
        const fetchParams = async () => {
            try {
                const res = await inventoryApi.getParameters('event_status');
                setEventStatuses(res.data.filter((p: any) => p.is_active));
            } catch (err) {
                console.error(err);
            }
        };
        fetchParams();
    }, []);
    const [eventData, setEventData] = useState({
        title: initialData?.title || 'Servicio',
        responsible: initialData?.responsible || '',
        cost_center: initialData?.cost_center || '',
        company: initialData?.company || '',
        status: initialData?.status || 'Abierto',
        status_date: initialData?.status_date 
            ? new Date(initialData.status_date).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
        invoice_number: initialData?.invoice_number || '',
        request_date: initialData?.request_date 
            ? new Date(initialData.request_date).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0]
    });
    const [details, setDetails] = useState<any[]>(
        initialData?.details?.map((d: any) => ({
            ...d,
            service_date: new Date(d.service_date).toISOString().split('T')[0]
        })) || [
            {
                service_date: new Date().toISOString().split('T')[0],
                service_time: '12:00 p.m.',
                location: '',
                attendees: 10,
                additional_requirements: '',
                observations: '',
                estimated_amount: 0,
                selected_items: []
            }
        ]
    );

    const isEdit = !!initialData?.id;

    const addDetail = () => {
        setDetails([...details, {
            service_date: new Date().toISOString().split('T')[0],
            service_time: '12:00 p.m.',
            location: '',
            attendees: 10,
            additional_requirements: '',
            observations: '',
            estimated_amount: 0,
            selected_items: []
        }]);
    };

    const removeDetail = (index: number) => {
        if (details.length > 1) {
            setDetails(details.filter((_, i) => i !== index));
            setActiveDetailIndex(prev => {
                if (index <= prev) {
                    return Math.max(0, prev - 1);
                }
                return prev;
            });
        } else {
            toast.warning('Debe haber al menos un servicio en el evento');
        }
    };


    const updateDetail = (index: number, newData: any) => {
        const newDetails = [...details];
        newDetails[index] = newData;
        setDetails(newDetails);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventData.responsible.trim()) {
            toast.error('Por favor completa el campo Responsable');
            return;
        }

        const finalTitle = eventData.title.trim() || 'Servicio';

        setLoading(true);
        try {
            const payload = {
                ...eventData,
                title: finalTitle,
                request_date: eventData.request_date ? new Date(eventData.request_date).toISOString() : new Date().toISOString(),
                status_date: eventData.status_date ? new Date(eventData.status_date).toISOString() : new Date().toISOString(),
                details: details.map(d => ({
                    ...d,
                    service_date: new Date(d.service_date).toISOString()
                }))
            };

            if (isEdit) {
                const res = await inventoryApi.updateServiceEvent(initialData.id, payload);
                toast.success('Evento y servicios actualizados exitosamente');
                onClose(res.data);
            } else {
                const res = await inventoryApi.createServiceEvent(payload);
                toast.success('Evento y servicios creados exitosamente');
                onClose(res.data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.detail || `Error al ${isEdit ? 'actualizar' : 'crear'} el servicio`);
        } finally {
            setLoading(false);
        }
    };

    const activeDetail = details[activeDetailIndex] || details[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full h-[calc(100vh-73px)] bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col font-inter"
        >
                {/* Header Portal */}
                <div className="p-8 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Plus size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{isEdit ? 'Editar Evento y Servicios' : 'Nuevo Evento y Servicios'}</h2>
                            <p className="text-sm text-gray-500 font-medium tracking-tight">
                                {isEdit ? 'Actualiza la información del evento seleccionado' : 'Completa la información para procesar la solicitud'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl text-gray-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Collapsible Header Toggle */}
                <div className="flex items-center justify-between px-8 py-3.5 bg-gray-100/50 dark:bg-gray-800/50 border-b border-gray-150 dark:border-gray-750 text-xs font-medium flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 font-bold">
                        <span>Evento: <strong className="text-gray-900 dark:text-white uppercase tracking-tight">{eventData.title || 'Servicio'}</strong></span>
                        <span>•</span>
                        <span>Responsable: <strong className="text-gray-900 dark:text-white">{eventData.responsible || 'N/A'}</strong></span>
                        {eventData.cost_center && (
                            <>
                                <span>•</span>
                                <span>C. Costo: <strong className="text-gray-900 dark:text-white">{eventData.cost_center}</strong></span>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowGeneralInfo(!showGeneralInfo)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-350 rounded-lg transition-all"
                    >
                        <span>{showGeneralInfo ? 'Ocultar Datos Generales' : 'Mostrar Datos Generales'}</span>
                    </button>
                </div>

                <AnimatePresence initial={false}>
                    {showGeneralInfo && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-shrink-0"
                        >
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                                <div className="space-y-1.5 md:col-span-2 lg:col-span-5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Título del Evento</label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Ej. Conferencia Anual"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium text-sm"
                                            value={eventData.title}
                                            onChange={e => setEventData({ ...eventData, title: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-1 lg:col-span-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Responsable *</label>
                                    <div className="relative group">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Cliente / Solicitante"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium text-sm"
                                            value={eventData.responsible}
                                            onChange={e => setEventData({ ...eventData, responsible: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Empresa</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Ej. Acme Corp"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium text-sm"
                                            value={eventData.company}
                                            onChange={e => setEventData({ ...eventData, company: e.target.value })}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Centro de Costo</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Ej. TCN-10200"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium text-sm"
                                            value={eventData.cost_center}
                                            onChange={e => setEventData({ ...eventData, cost_center: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fecha de Solicitud</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium text-sm"
                                            value={eventData.request_date}
                                            onChange={e => setEventData({ ...eventData, request_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Estado General</label>
                                    <div className="relative group">
                                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                        <select
                                            className="w-full pl-10 pr-8 py-2.5 bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium appearance-none text-sm"
                                            value={eventData.status}
                                            onChange={e => setEventData({ 
                                                ...eventData, 
                                                status: e.target.value,
                                                status_date: new Date().toISOString().split('T')[0]
                                            })}
                                        >
                                            {eventStatuses.map(es => (
                                                <option key={es.id} value={es.value}>{es.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Número de Factura</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder={
                                                (eventData.status === 'Facturado' || eventData.status === 'Cobrado')
                                                    ? "Ej. FAC-00123"
                                                    : "Solo para Facturados"
                                            }
                                            disabled={eventData.status !== 'Facturado' && eventData.status !== 'Cobrado'}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm ${
                                                (eventData.status === 'Facturado' || eventData.status === 'Cobrado')
                                                    ? "bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700 focus:border-primary/30"
                                                    : "bg-gray-100/50 dark:bg-gray-800 border border-transparent cursor-not-allowed text-gray-400"
                                            }`}
                                            value={eventData.invoice_number || ''}
                                            onChange={e => setEventData({ ...eventData, invoice_number: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Split Pane Workspace */}
                <div className="flex-1 flex overflow-hidden min-h-0 bg-gray-50 dark:bg-gray-900">
                    {/* Sidebar (Left) */}
                    <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 flex flex-col overflow-y-auto custom-scrollbar flex-shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Servicios en la Solicitud</span>
                        <div className="space-y-3 flex-1">
                            {details.map((d, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveDetailIndex(idx)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left ${
                                        activeDetailIndex === idx
                                            ? 'bg-primary/5 dark:bg-primary/10 text-primary border-primary shadow-sm font-black'
                                            : 'bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700/50 font-medium'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="text-[9px] font-black uppercase tracking-wider text-gray-400">Servicio #{idx + 1}</div>
                                        <div className="text-xs font-bold truncate max-w-[130px] mt-0.5 text-gray-900 dark:text-white">{d.location || 'Sin Ubicación'}</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{d.service_date} - {d.service_time}</div>
                                    </div>
                                    <div className="flex-shrink-0 ml-2">
                                        <span className="text-[10px] font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">
                                            {formatPrice(d.estimated_amount || 0)}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                addDetail();
                                setActiveDetailIndex(details.length);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-2xl font-bold transition-all mt-6 border border-dashed border-primary/20 flex-shrink-0 active:scale-95"
                        >
                            <Plus size={18} />
                            <span>Agregar Servicio</span>
                        </button>
                    </div>

                    {/* Active Workspace Area (Right) */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        {details.length > 0 && (
                            <ServiceDetailCard
                                index={activeDetailIndex}
                                data={activeDetail}
                                onChange={(newData) => updateDetail(activeDetailIndex, newData)}
                                onDelete={() => removeDetail(activeDetailIndex)}
                            />
                        )}
                    </div>
                </div>

                {/* Footer Portal */}
                <div className="p-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-2xl font-bold transition-all active:scale-95 text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-3 px-10 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 text-sm"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : (
                            <>
                                <Save size={20} />
                                <span>{isEdit ? 'Actualizar' : 'Crear'} {details.length} {details.length === 1 ? 'Servicio' : 'Servicios'}</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
    );
}
