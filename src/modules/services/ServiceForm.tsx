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
    ClipboardCheck,
    Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api, { inventoryApi } from '../../services/api';
import ServiceDetailCard from './ServiceDetailCard';

interface ServiceFormProps {
    onClose: (updatedEvent?: any) => void;
    initialData?: any;
}

export default function ServiceForm({ onClose, initialData }: ServiceFormProps) {
    const [loading, setLoading] = useState(false);
    const [eventStatuses, setEventStatuses] = useState<any[]>([]);

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

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl max-h-[90vh] bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col font-inter"
            >
                {/* Header Portan */}
                <div className="p-8 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
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

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Main Event Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-white dark:border-gray-700 shadow-sm">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Título del Evento</label>
                        <div className="relative group">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Ej. Conferencia Anual"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={eventData.title}
                                onChange={e => setEventData({ ...eventData, title: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Responsable *</label>
                        <input
                            type="text"
                            placeholder="Cliente / Solicitante"
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={eventData.responsible}
                            onChange={e => setEventData({ ...eventData, responsible: e.target.value })}
                        />
                    </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Empresa</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Ej. Acme Corp"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    value={eventData.company}
                                    onChange={e => setEventData({ ...eventData, company: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Centro de Costo</label>
                            <div className="relative group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Ej. TCN-10200"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    value={eventData.cost_center}
                                    onChange={e => setEventData({ ...eventData, cost_center: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Fecha de Solicitud</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="date"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={eventData.request_date}
                                    onChange={e => setEventData({ ...eventData, request_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 text-right">Estado General</label>
                            <div className="relative">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <select
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
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
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Fecha de Estado</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="date"
                                    readOnly
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-100/50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl font-medium outline-none cursor-not-allowed"
                                    value={eventData.status_date}
                                />
                            </div>
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Número de Factura</label>
                            <div className="relative group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder={
                                        (eventData.status === 'Facturado' || eventData.status === 'Cobrado')
                                            ? "Ej. FAC-00123"
                                            : "Se habilita al cambiar a Facturado/Cobrado"
                                    }
                                    disabled={eventData.status !== 'Facturado' && eventData.status !== 'Cobrado'}
                                    className={`w-full pl-11 pr-4 py-3.5 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium ${
                                        (eventData.status === 'Facturado' || eventData.status === 'Cobrado')
                                            ? "bg-white dark:bg-gray-900 focus:bg-white"
                                            : "bg-gray-100/50 dark:bg-gray-800 cursor-not-allowed text-gray-400"
                                    }`}
                                    value={eventData.invoice_number || ''}
                                    onChange={e => setEventData({ ...eventData, invoice_number: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Service Details Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <ClipboardCheck size={18} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Servicios a Solicitar</h3>
                            </div>
                            <button
                                onClick={addDetail}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl font-bold transition-all"
                            >
                                <Plus size={18} />
                                <span>Agregar Otro Servicio</span>
                            </button>
                        </div>

                        <div className="space-y-8">
                            <AnimatePresence>
                                {details.map((detail, index) => (
                                    <ServiceDetailCard
                                        key={index}
                                        index={index}
                                        data={detail}
                                        onChange={(newData) => updateDetail(index, newData)}
                                        onDelete={() => removeDetail(index)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Footer Portal */}
                <div className="p-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onClose}
                        className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-2xl font-bold transition-all active:scale-95"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-3 px-10 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
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
        </div>
    );
}
