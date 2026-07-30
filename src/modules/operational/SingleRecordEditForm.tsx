import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Save,
    Loader2,
    Plus,
    Trash2,
    Edit2
} from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';

interface SingleRecordEditFormProps {
    onClose: () => void;
    onSuccess: () => void;
    type: 'metropolitano' | 'cep' | 'quintas';
    date: string;
}

export default function SingleRecordEditForm({ onClose, onSuccess, type, date }: SingleRecordEditFormProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [eventId, setEventId] = useState<string | null>(null);
    const [parentEvent, setParentEvent] = useState<any>(null);

    // Metropolitano & CEP Data
    const [formData, setFormData] = useState<any>({
        plc: '', sm: '', cnPlanta: '', cenas: '', sc: '', conc: '', cnExt: '', csExt: '',
        sistemasCep: '', segPlc: '', segRuices: '', segCentral: '',
        observations: ''
    });

    // Quintas Data
    const [especialesData, setEspecialesData] = useState<any>({ choferesCenas: '', choferesDesayunos: '', pepsicoDesayunos: '', quintasCenas: '', quintasDesayunos: '', pilotosAlmuerzos: '' });

    useEffect(() => {
        fetchData();
    }, [date, type]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await inventoryApi.getServiceEvents();
            const existingEvents = (res.data || []).filter((e: any) => e.company === 'Planificación');
            
            let ev: any = null;
            let matchingDetail: any = null;

            if (type === 'metropolitano') {
                ev = existingEvents.find((e: any) => {
                    const isType = e.cost_center === 'Metropolitano' || (e.title && e.title.includes('Metropolitano')) || (e.details && e.details.some((d: any) => d.service_category_id === 4 || (d.observations && (d.observations.includes('DESGLOSE_PLANIFICACION:') || (d.observations.includes('PLC=') && !d.observations.includes('SEG_PLC='))))));
                    if (!isType || !e.details) return false;
                    matchingDetail = e.details.find((d: any) => d.service_date && d.service_date.substring(0,10) === date);
                    return !!matchingDetail;
                });
            } else if (type === 'cep') {
                ev = existingEvents.find((e: any) => {
                    const isType = e.cost_center === 'CEP' || (e.title && e.title.includes('CEP')) || (e.details && e.details.some((d: any) => d.service_category_id === 3 || (d.observations && d.observations.includes('DESGLOSE_PLANIFICACION_CEP:'))));
                    if (!isType || !e.details) return false;
                    matchingDetail = e.details.find((d: any) => d.service_date && d.service_date.substring(0,10) === date);
                    return !!matchingDetail;
                });
            } else if (type === 'quintas') {
                ev = existingEvents.find((e: any) => {
                    const isType = e.cost_center === 'Servicios Especiales' || e.cost_center === 'Quintas' || (e.title && (e.title.includes('Quintas') || e.title.includes('Especiales'))) || (e.details && e.details.some((d: any) => d.service_category_id === 2 || (d.observations && (d.observations.includes('[JSON_QUINTAS:') || d.observations.includes('[JSON_ESPECIALES:')))));
                    if (!isType || !e.details) return false;
                    matchingDetail = e.details.find((d: any) => d.service_date && d.service_date.substring(0,10) === date);
                    return !!matchingDetail;
                });
            }
            
            if (ev && matchingDetail) {
                setEventId(ev.id);
                setParentEvent(ev);
                const obs = matchingDetail.observations || '';
                let sd = matchingDetail.structured_data || {};
                if (typeof sd === 'string') {
                    try { sd = JSON.parse(sd); } catch(e) { sd = {}; }
                }

                if (!sd || Object.keys(sd).length === 0) {
                    const matchCep = obs.match(/\[DESGLOSE_PLANIFICACION_CEP:\s*SISTEMAS_CEP=(\d+),\s*SEG_PLC=(\d+),\s*SEG_RUICES=(\d+),\s*SEG_CENTRAL=(\d+)\]/);
                    const match = obs.match(/\[DESGLOSE_PLANIFICACION:\s*PLC=(\d+),\s*SM=(\d+),\s*CN_PLANTA=(\d+),\s*CENAS=(\d+),\s*SC=(\d+),\s*CONC=(\d+),\s*CN_EXT=(\d+),\s*CS_EXT=(\d+)\]/);
                    const matchEspeciales = obs.match(/\[JSON_ESPECIALES:(.*)\]/) || obs.match(/\[JSON_QUINTAS:(.*)\]/);
                    
                    if (matchCep) {
                        sd = {
                            sistemasCep: parseInt(matchCep[1]) || 0,
                            segPlc: parseInt(matchCep[2]) || 0,
                            segRuices: parseInt(matchCep[3]) || 0,
                            segCentral: parseInt(matchCep[4]) || 0
                        };
                    } else if (match) {
                        sd = {
                            plc: parseInt(match[1]) || 0,
                            sm: parseInt(match[2]) || 0,
                            cnPlanta: parseInt(match[3]) || 0,
                            cenas: parseInt(match[4]) || 0,
                            sc: parseInt(match[5]) || 0,
                            conc: parseInt(match[6]) || 0,
                            cnExt: parseInt(match[7]) || 0,
                            csExt: parseInt(match[8]) || 0
                        };
                    } else if (matchEspeciales) {
                        try {
                            sd = JSON.parse(matchEspeciales[1]);
                        } catch (e) {
                            sd = {};
                        }
                    } else {
                        const f1 = obs.match(/SISTEMAS_CEP=(\d+)/);
                        const f2 = obs.match(/SEG_PLC=(\d+)/);
                        const f3 = obs.match(/SEG_RUICES=(\d+)/);
                        const f4 = obs.match(/SEG_CENTRAL=(\d+)/);
                        if (f1 || f2 || f3 || f4) {
                            sd = {
                                sistemasCep: f1 ? parseInt(f1[1]) : 0,
                                segPlc: f2 ? parseInt(f2[1]) : 0,
                                segRuices: f3 ? parseInt(f3[1]) : 0,
                                segCentral: f4 ? parseInt(f4[1]) : 0
                            };
                        } else {
                            const fallbackPlc = obs.match(/PLC=(\d+)/);
                            const fallbackSm = obs.match(/SM=(\d+)/);
                            const fallbackCnPlanta = obs.match(/CN_PLANTA=(\d+)/);
                            const fallbackCenas = obs.match(/CENAS=(\d+)/);
                            const fallbackSc = obs.match(/SC=(\d+)/);
                            const fallbackConc = obs.match(/CONC=(\d+)/);
                            const fallbackCnExt = obs.match(/CN_EXT=(\d+)/);
                            const fallbackCsExt = obs.match(/CS_EXT=(\d+)/);
                            if (fallbackPlc || fallbackSm || fallbackCnPlanta || fallbackCenas || fallbackSc || fallbackConc || fallbackCnExt || fallbackCsExt) {
                                sd = {
                                    plc: fallbackPlc ? parseInt(fallbackPlc[1]) : 0,
                                    sm: fallbackSm ? parseInt(fallbackSm[1]) : 0,
                                    cnPlanta: fallbackCnPlanta ? parseInt(fallbackCnPlanta[1]) : 0,
                                    cenas: fallbackCenas ? parseInt(fallbackCenas[1]) : 0,
                                    sc: fallbackSc ? parseInt(fallbackSc[1]) : 0,
                                    conc: fallbackConc ? parseInt(fallbackConc[1]) : 0,
                                    cnExt: fallbackCnExt ? parseInt(fallbackCnExt[1]) : 0,
                                    csExt: fallbackCsExt ? parseInt(fallbackCsExt[1]) : 0
                                };
                            }
                        }
                    }
                }
                
                if (type === 'metropolitano') {
                    setFormData({
                        ...formData,
                        plc: sd.plc || '', sm: sd.sm || '', cnPlanta: sd.cnPlanta || '', cenas: sd.cenas || '', sc: sd.sc || '', conc: sd.conc || '', cnExt: sd.cnExt || '', csExt: sd.csExt || '',
                        observations: obs
                    });
                } else if (type === 'cep') {
                    setFormData({
                        ...formData,
                        sistemasCep: sd.sistemasCep || '', segPlc: sd.segPlc || '', segRuices: sd.segRuices || '', segCentral: sd.segCentral || '',
                        observations: obs
                    });
                } else if (type === 'quintas') {
                    if (sd) {
                        setEspecialesData({
                            choferesCenas: sd.choferes?.cenas || '',
                            choferesDesayunos: sd.choferes?.desayunos || '',
                            pepsicoDesayunos: sd.pepsico?.desayunos || '',
                            quintasCenas: sd.quintas?.cenas || '',
                            quintasDesayunos: sd.quintas?.desayunos || '',
                            pilotosAlmuerzos: sd.pilotos?.almuerzos || ''
                        });
                    }
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            setSaving(true);
            
            let payload: any = {
                title: 'Planificación ' + (type === 'metropolitano' ? 'Metropolitano' : type === 'cep' ? 'CEP' : 'Quintas'),
                company: 'Planificación',
                cost_center: type === 'metropolitano' ? 'Metropolitano' : type === 'cep' ? 'CEP' : 'Quintas',
                responsible: 'Sistema',
                status: 'Confirmado',
                details: [{
                    service_date: date,
                    start_time: '12:00',
                    end_time: '13:00',
                    location: 'Comedor',
                    guest_count: 0,
                    service_types: ['Almuerzo'],
                    text_time: 'Planificación',
                    attendees: 0,
                    additional_requirements: '',
                    observations: '',
                    estimated_amount: 0,
                    selected_items: []
                }]
            };

            let obs = formData.observations || '';
            let category_id = 0;
            let sd: any = {};

            if (type === 'metropolitano') {
                const { plc, sm, cnPlanta, cenas, sc, conc, cnExt, csExt } = formData;
                category_id = 4; // METRO
                sd = { plc: parseInt(plc)||0, sm: parseInt(sm)||0, cnPlanta: parseInt(cnPlanta)||0, cenas: parseInt(cenas)||0, sc: parseInt(sc)||0, conc: parseInt(conc)||0, cnExt: parseInt(cnExt)||0, csExt: parseInt(csExt)||0 };
                const totalPlatos = [plc, sm, cnPlanta, cenas, sc, conc, cnExt, csExt].reduce((acc, val) => acc + (parseInt(val) || 0), 0);
                payload.details[0].guest_count = totalPlatos;
            } else if (type === 'cep') {
                const { sistemasCep, segPlc, segRuices, segCentral } = formData;
                category_id = 3; // CEP
                sd = { sistemasCep: parseInt(sistemasCep)||0, segPlc: parseInt(segPlc)||0, segRuices: parseInt(segRuices)||0, segCentral: parseInt(segCentral)||0 };
                const totalPlatos = [sistemasCep, segPlc, segRuices, segCentral].reduce((acc, val) => acc + (parseInt(val) || 0), 0);
                payload.details[0].guest_count = totalPlatos;
            } else if (type === 'quintas') {
                category_id = 2; // ESPECIAL
                sd = {
                    choferes: { cenas: parseFloat(especialesData.choferesCenas)||0, desayunos: parseFloat(especialesData.choferesDesayunos)||0 },
                    pepsico: { desayunos: parseFloat(especialesData.pepsicoDesayunos)||0 },
                    quintas: { cenas: parseFloat(especialesData.quintasCenas)||0, desayunos: parseFloat(especialesData.quintasDesayunos)||0 },
                    pilotos: { almuerzos: parseFloat(especialesData.pilotosAlmuerzos)||0 }
                };
                const totalPersonas = (parseInt(especialesData.choferesCenas)||0) + (parseInt(especialesData.quintasCenas)||0) + (parseInt(especialesData.pilotosAlmuerzos)||0);
                payload.details[0].guest_count = totalPersonas;
            }

            payload.details[0].observations = obs.trim();
            payload.details[0].service_category_id = category_id;
            payload.details[0].structured_data = sd;

            if (eventId && parentEvent) {
                const updatedDetails = parentEvent.details.map((d: any) => {
                    if (d.service_date.substring(0,10) === date) {
                        return payload.details[0];
                    }
                    return d;
                });
                
                const finalPayload = { ...payload, details: updatedDetails };
                await inventoryApi.updateServiceEvent(Number(eventId), finalPayload);
            } else if (eventId) {
                await inventoryApi.updateServiceEvent(Number(eventId), payload);
            } else {
                await inventoryApi.createServiceEvent(payload);
            }

            toast.success('Registro actualizado exitosamente');
            onSuccess();
        } catch (error: any) {
            console.error(error);
            const detail = error.response?.data?.detail || error.message || 'Error desconocido';
            toast.error(`Error al actualizar: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
        } finally {
            setSaving(false);
        }
    };

    const getTypeLabel = () => {
        if (type === 'metropolitano') return 'Metropolitano';
        if (type === 'cep') return 'CEP';
        return 'Quintas';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-gray-400 font-medium text-sm">Cargando registro...</p>
            </div>
        );
    }

    let totalServicios = 0;
    if (type === 'metropolitano') {
        totalServicios = ['plc', 'sm', 'cnPlanta', 'cenas', 'sc', 'conc', 'cnExt', 'csExt'].reduce((acc, key) => acc + (parseInt(formData[key]) || 0), 0);
    } else if (type === 'cep') {
        totalServicios = ['sistemasCep', 'segPlc', 'segRuices', 'segCentral'].reduce((acc, key) => acc + (parseInt(formData[key]) || 0), 0);
    } else if (type === 'quintas') {
        totalServicios = (parseInt(especialesData.choferesCenas)||0) + (parseInt(especialesData.quintasCenas)||0) + (parseInt(especialesData.pilotosAlmuerzos)||0);
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-10">
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                        <Edit2 size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Modificar Registro
                        </h1>
                        <p className="text-gray-500 text-xs font-medium">
                            Completa la información para procesar el registro de {getTypeLabel()}.
                        </p>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-gray-650 dark:hover:text-gray-250 transition-all shadow-sm"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            <form onSubmit={handleSave} className="space-y-6">
                
                <div className="grid grid-cols-12 gap-4">
                    
                    <div className="col-span-4 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Fecha de Operación
                        </label>
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-850 rounded-2xl px-4 py-3">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                className="bg-transparent border-none outline-none font-medium text-sm text-gray-950 dark:text-white w-full"
                                value={date}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 items-start">
                    
                    <div className="col-span-4">
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                                <span className="font-bold text-gray-900 dark:text-white">Resumen del Día</span>
                                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-full uppercase">{getTypeLabel()}</span>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Servicios</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {totalServicios} <span className="text-[10px] font-normal text-gray-400">{type === 'quintas' ? 'personas' : 'platos'}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
                        
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">Detalles del Registro ({getTypeLabel()})</span>
                            </div>
                        </div>

                        {type === 'metropolitano' && (
                            <div className="grid grid-cols-4 gap-4">
                                {[{id:'plc', label:'PLC'}, {id:'sm', label:'SM (Almuerzos)'}, {id:'cenas', label:'SM (Cenas)'}, {id:'sc', label:'SM (Sobre Cenas)'}, {id:'cnPlanta', label:'Col. Norte'}, {id:'conc', label:'Concentrados'}, {id:'cnExt', label:'Col. Norte (Ext)'}, {id:'csExt', label:'Col. Sur'}].map(field => (
                                    <div key={field.id} className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-gray-400/80 ml-1">{field.label}</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-950 dark:text-white text-center font-bold text-sm"
                                            value={formData[field.id] || ''}
                                            onChange={e => setFormData({ ...formData, [field.id]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {type === 'cep' && (
                            <div className="grid grid-cols-4 gap-4">
                                {[{id:'sistemasCep', label:'Sist. CEP'}, {id:'segPlc', label:'Seg. PLC'}, {id:'segRuices', label:'Seg. Ruices'}, {id:'segCentral', label:'Seg. Central'}].map(field => (
                                    <div key={field.id} className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-gray-400/80 ml-1">{field.label}</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-950 dark:text-white text-center font-bold text-sm"
                                            value={formData[field.id] || ''}
                                            onChange={e => setFormData({ ...formData, [field.id]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {type === 'quintas' && (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left whitespace-nowrap border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700" colSpan={2}>Choferes</th>
                                            <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Pepsico</th>
                                            <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700" colSpan={2}>Quintas</th>
                                            <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Pilotos</th>
                                        </tr>
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Cenas (Cant)</th>
                                            <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Desay. ($)</th>
                                            <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Desay. ($)</th>
                                            <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Cenas (Cant)</th>
                                            <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Desay. ($)</th>
                                            <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Almuerzos (Cant)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="px-2 py-4"><input type="number" className="w-full min-w-[80px] p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={especialesData.choferesCenas} onChange={e => setEspecialesData({...especialesData, choferesCenas: e.target.value})} placeholder="-" /></td>
                                            <td className="px-2 py-4 border-r border-gray-200 dark:border-gray-700"><input type="number" step="0.01" className="w-full min-w-[80px] p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={especialesData.choferesDesayunos} onChange={e => setEspecialesData({...especialesData, choferesDesayunos: e.target.value})} placeholder="-" /></td>
                                            <td className="px-2 py-4 border-r border-gray-200 dark:border-gray-700"><input type="number" step="0.01" className="w-full min-w-[80px] p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={especialesData.pepsicoDesayunos} onChange={e => setEspecialesData({...especialesData, pepsicoDesayunos: e.target.value})} placeholder="-" /></td>
                                            <td className="px-2 py-4"><input type="number" className="w-full min-w-[80px] p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={especialesData.quintasCenas} onChange={e => setEspecialesData({...especialesData, quintasCenas: e.target.value})} placeholder="-" /></td>
                                            <td className="px-2 py-4 border-r border-gray-200 dark:border-gray-700"><input type="number" step="0.01" className="w-full min-w-[80px] p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={especialesData.quintasDesayunos} onChange={e => setEspecialesData({...especialesData, quintasDesayunos: e.target.value})} placeholder="-" /></td>
                                            <td className="px-2 py-4"><input type="number" className="w-full min-w-[80px] p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={especialesData.pilotosAlmuerzos} onChange={e => setEspecialesData({...especialesData, pilotosAlmuerzos: e.target.value})} placeholder="-" /></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-gray-500 hover:text-gray-800 dark:hover:text-white font-bold text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                ACTUALIZAR
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
