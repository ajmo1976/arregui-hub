import React, { useState } from 'react';
import { X, Plus, Calendar, Users, Hash, Activity, Save, Loader2, Briefcase, Building2, ChevronRight, ChevronLeft, Trash2, MapPin, Clock, UtensilsCrossed, ClipboardList } from 'lucide-react';
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
    const { formatPrice, canShowPrices } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [eventStatuses, setEventStatuses] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState(1);
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
        status_date: initialData?.status_date ? new Date(initialData.status_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        invoice_number: initialData?.invoice_number || '',
        request_date: initialData?.request_date ? new Date(initialData.request_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
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
            setActiveDetailIndex(prev => prev >= index ? Math.max(0, prev - 1) : prev);
        } else {
            toast.warning('Debe haber al menos un servicio');
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
            toast.error('Completa el Responsable en el Paso 1');
            setCurrentStep(1);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...eventData,
                title: eventData.title.trim() || 'Servicio',
                request_date: eventData.request_date ? new Date(eventData.request_date).toISOString() : new Date().toISOString(),
                status_date: eventData.status_date ? new Date(eventData.status_date).toISOString() : new Date().toISOString(),
                details: details.map(d => ({ ...d, service_date: new Date(d.service_date).toISOString() }))
            };

            const res = isEdit ? await inventoryApi.updateServiceEvent(initialData.id, payload) : await inventoryApi.createServiceEvent(payload);
            toast.success(`Evento ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
            onClose(res.data);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al guardar');
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
            className="w-full h-[calc(100vh-73px)] bg-white dark:bg-gray-900 overflow-hidden flex flex-col font-inter"
        >
            {/* Wizard Header */}
            <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{isEdit ? 'Editar Evento' : 'Nuevo Evento (Wizard)'}</h2>
                        <p className="text-sm text-gray-500 font-medium">Asistente de creación paso a paso</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl text-gray-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                {/* Stepper */}
                <div className="flex items-center gap-4">
                    {[1, 2, 3].map(step => (
                        <div key={step} className={`flex-1 h-2 rounded-full transition-all ${currentStep >= step ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-700'}`} />
                    ))}
                </div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                    <span className={currentStep >= 1 ? 'text-primary' : ''}>1. Datos Generales</span>
                    <span className={currentStep >= 2 ? 'text-primary' : ''}>2. Logística</span>
                    <span className={currentStep >= 3 ? 'text-primary' : ''}>3. Menú</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {currentStep === 1 && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8">Paso 1: Información General del Evento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Título del Evento</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" value={eventData.title} onChange={e => setEventData({ ...eventData, title: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Responsable *</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" value={eventData.responsible} onChange={e => setEventData({ ...eventData, responsible: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Empresa</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" value={eventData.company} onChange={e => setEventData({ ...eventData, company: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Centro de Costo</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" value={eventData.cost_center} onChange={e => setEventData({ ...eventData, cost_center: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Estado</label>
                                <div className="relative">
                                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <select className="w-full pl-10 pr-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl appearance-none" value={eventData.status} onChange={e => setEventData({ ...eventData, status: e.target.value })}>
                                        {eventStatuses.map(es => <option key={es.id} value={es.value}>{es.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fecha Solicitud</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="date" className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" value={eventData.request_date} onChange={e => setEventData({ ...eventData, request_date: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Paso 2: Logística y Cronograma ({details.length} Servicios)</h3>
                            <button onClick={addDetail} className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold">
                                <Plus size={16} /> Agregar Servicio
                            </button>
                        </div>
                        
                        <div className="space-y-0">
                            {details.map((d, idx) => (
                                <div key={idx} className="py-8 border-b border-gray-100 dark:border-gray-800 relative">
                                    <div className="absolute top-6 right-6">
                                        <button onClick={() => removeDetail(idx)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-6">Servicio #{idx + 1}</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400">Fecha</label>
                                            <input type="date" className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent" value={d.service_date} onChange={e => updateDetail(idx, { ...d, service_date: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400">Hora</label>
                                            <input type="text" className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent" value={d.service_time} onChange={e => updateDetail(idx, { ...d, service_time: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400">Ubicación</label>
                                            <input type="text" className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent" value={d.location} onChange={e => updateDetail(idx, { ...d, location: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400">Personas</label>
                                            <input type="number" className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent" value={d.attendees || ''} onChange={e => updateDetail(idx, { ...d, attendees: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <textarea placeholder="Requerimientos..." rows={2} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl resize-none text-sm" value={d.additional_requirements} onChange={e => updateDetail(idx, { ...d, additional_requirements: e.target.value })} />
                                        <textarea placeholder="Observaciones..." rows={2} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl resize-none text-sm" value={d.observations} onChange={e => updateDetail(idx, { ...d, observations: e.target.value })} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="h-full flex flex-col md:flex-row gap-6">
                        {/* Sidebar */}
                        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Paso 3: Menú</h3>
                            <p className="text-xs text-gray-500 mb-4">Selecciona el servicio al que agregarás comida:</p>
                            {details.map((d, idx) => (
                                <button key={idx} onClick={() => setActiveDetailIndex(idx)} className={`p-4 rounded-2xl text-left transition-all border ${activeDetailIndex === idx ? 'bg-primary text-white border-primary shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${activeDetailIndex === idx ? 'text-primary-100' : 'text-gray-400'}`}>Servicio #{idx + 1}</div>
                                    <div className="font-bold text-sm truncate">{d.location || 'Sin ubicación'}</div>
                                    <div className={`text-xs mt-1 ${activeDetailIndex === idx ? 'text-primary-50' : 'text-gray-500'}`}>{d.service_date} - {d.service_time}</div>
                                </button>
                            ))}
                        </div>
                        {/* Menu Area */}
                        <div className="flex-1 overflow-hidden">
                            {details.length > 0 && (
                                <ServiceDetailCard
                                    index={activeDetailIndex}
                                    data={activeDetail}
                                    onChange={(newData) => updateDetail(activeDetailIndex, newData)}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Navigation */}
            <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold transition-all">Cancelar</button>
                <div className="flex gap-4">
                    {currentStep > 1 && (
                        <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 rounded-xl font-bold transition-all">
                            <ChevronLeft size={20} /> Atrás
                        </button>
                    )}
                    {currentStep < 3 ? (
                        <button onClick={() => setCurrentStep(prev => prev + 1)} className="flex items-center gap-2 px-8 py-3 bg-primary text-white hover:bg-primary-dark rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">
                            Siguiente <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-10 py-3 bg-green-500 text-white hover:bg-green-600 rounded-xl font-black shadow-lg shadow-green-500/20 transition-all">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Todo</>}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
