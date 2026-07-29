import React, { useState } from 'react';
import {
    X,
    Calendar,
    ArrowRight,
    ArrowLeft,
    Save,
    Loader2,
    Plus,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';

interface MultiTypeRecordFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialType?: 'metropolitano' | 'cep' | 'quintas' | 'diario' | '';
    initialDate?: string;
}

export default function MultiTypeRecordForm({ onClose, onSuccess, initialType, initialDate }: MultiTypeRecordFormProps) {
    const [step, setStep] = useState(initialType && initialDate ? 2 : 1);
    const [recordType, setRecordType] = useState<'metropolitano' | 'cep' | 'quintas' | 'diario' | ''>(initialType || '');
    const [startDate, setStartDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Grids
    const [dailyGrid, setDailyGrid] = useState<any[]>([]);
    const [quintasGrid, setQuintasGrid] = useState<any[]>([]);
    const [quintasEventIds, setQuintasEventIds] = useState<Record<string, string>>({});

    const handleNextStep1 = () => {
        if (!recordType) {
            toast.error('Selecciona un tipo de registro');
            return;
        }
        setStep(2);
    };

    const handleNextStep2 = async () => {
        if (!startDate || !endDate) {
            toast.error('Selecciona el rango de fechas');
            return;
        }
        if (startDate > endDate) {
            toast.error('La fecha de inicio debe ser menor o igual a la de fin');
            return;
        }

        // Generate Dates
        const dates: string[] = [];
        let curr = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');
        while (curr <= end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }

        setLoading(true);
        try {
            if (recordType === 'metropolitano' || recordType === 'cep' || recordType === 'diario' || recordType === 'quintas') {
                let existingEvents: any[] = [];
                let existingLogs: any[] = [];
                
                if (recordType === 'diario') {
                    const res = await inventoryApi.getDailyLogs();
                    existingLogs = res.data || [];
                } else {
                    const res = await inventoryApi.getServiceEvents();
                    existingEvents = (res.data || []).filter((e: any) => {
                        if (e.company !== 'Planificación') return false;
                        if (recordType === 'metropolitano') {
                            return e.cost_center === 'Metropolitano' || (e.title && e.title.includes('Metropolitano')) || (e.details && e.details.some((d: any) => d.service_category_id === 4 || d.service_category_id === 1 || (d.observations && (d.observations.includes('DESGLOSE_PLANIFICACION:') || (d.observations.includes('PLC=') && !d.observations.includes('SEG_PLC='))))));
                        } else if (recordType === 'cep') {
                            return e.cost_center === 'CEP' || (e.title && e.title.includes('CEP')) || (e.details && e.details.some((d: any) => d.service_category_id === 3 || (d.observations && d.observations.includes('DESGLOSE_PLANIFICACION_CEP:'))));
                        } else if (recordType === 'quintas') {
                            return e.cost_center === 'Servicios Especiales' || e.cost_center === 'Quintas' || (e.title && (e.title.includes('Quintas') || e.title.includes('Especiales'))) || (e.details && e.details.some((d: any) => d.service_category_id === 2 || (d.observations && (d.observations.includes('[JSON_QUINTAS:') || d.observations.includes('[JSON_ESPECIALES:')))));
                        }
                        return false;
                    });
                }

                const grid = dates.map(d => {
                    let plc = '', sm = '', cnPlanta = '', cenas = '', sc = '', conc = '', cnExt = '', csExt = '';
                    let sistemasCep = '', segPlc = '', segRuices = '', segCentral = '';
                    let choferesCenas = '', choferesDesayunos = '', pepsicoDesayunos = '', quintasCenas = '', quintasDesayunos = '', pilotosAlmuerzos = '';
                    let t1 = '', t2 = '', t3 = '', t4 = '', manual = '', lunchSold = '', breakfastRevenue = '';
                    let eventId = null;

                    if (recordType === 'diario') {
                        const log = existingLogs.find(l => l.log_date.substring(0,10) === d);
                        if (log) {
                            eventId = log.id;
                            lunchSold = String(log.lunch_sold || '');
                            breakfastRevenue = String(log.breakfast_revenue || '');
                            
                            if (log.structured_data) {
                                t1 = String(log.structured_data.t1 || '');
                                t2 = String(log.structured_data.t2 || '');
                                t3 = String(log.structured_data.t3 || '');
                                t4 = String(log.structured_data.t4 || '');
                                manual = String(log.structured_data.manual || '');
                            }
                        }
                    } else {
                        const ev = existingEvents.find(e => e.details && e.details.some((det: any) => det.service_date && det.service_date.substring(0,10) === d));
                        if (ev) {
                            eventId = ev.id;
                            const matchingDetail = ev.details.find((det: any) => det.service_date && det.service_date.substring(0,10) === d) || ev.details[0];
                            if (recordType === 'metropolitano') {
                                if (matchingDetail && matchingDetail.structured_data) {
                                    const sd = matchingDetail.structured_data;
                                    plc = String(sd.plc || ''); sm = String(sd.sm || ''); cnPlanta = String(sd.cnPlanta || '');
                                    cenas = String(sd.cenas || ''); sc = String(sd.sc || ''); conc = String(sd.conc || '');
                                    cnExt = String(sd.cnExt || ''); csExt = String(sd.csExt || '');
                                }
                            } else if (recordType === 'cep') {
                                if (matchingDetail && matchingDetail.structured_data) {
                                    const sd = matchingDetail.structured_data;
                                    sistemasCep = String(sd.sistemasCep || ''); segPlc = String(sd.segPlc || ''); segRuices = String(sd.segRuices || ''); segCentral = String(sd.segCentral || '');
                                }
                            } else if (recordType === 'quintas') {
                                if (matchingDetail && matchingDetail.structured_data) {
                                    const data = matchingDetail.structured_data;
                                    choferesCenas = String(data.choferes?.cenas || '');
                                    choferesDesayunos = String(data.choferes?.desayunos || '');
                                    pepsicoDesayunos = String(data.pepsico?.desayunos || '');
                                    quintasCenas = String(data.quintas?.cenas || '');
                                    quintasDesayunos = String(data.quintas?.desayunos || '');
                                    pilotosAlmuerzos = String(data.pilotos?.almuerzos || '');
                                }
                            }
                        }
                    }
                    return { date: d, eventId, plc, sm, cnPlanta, cenas, sc, conc, cnExt, csExt, sistemasCep, segPlc, segRuices, segCentral, choferesCenas, choferesDesayunos, pepsicoDesayunos, quintasCenas, quintasDesayunos, pilotosAlmuerzos, t1, t2, t3, t4, manual, lunchSold, breakfastRevenue };
                });
                setDailyGrid(grid);
            }
            setStep(3);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar registros existentes');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            if (recordType === 'diario') {
                // Save to operational (Daily Logs)
                for (const row of dailyGrid) {
                    const hasData = row.t1 || row.t2 || row.t3 || row.t4 || row.manual || row.lunchSold || row.breakfastRevenue;
                    if (!hasData) continue;

                    const payload = {
                        log_date: row.date,
                        lunch_sold: parseInt(row.lunchSold) || 0,
                        breakfast_revenue: parseFloat(row.breakfastRevenue) || 0,
                        delivery_lunch: 0,
                        delivery_dinner: 0,
                        delivery_night: 0,
                        delivery_revenue: 0,
                        service_category_id: 1, // ALMUERZO
                        structured_data: {
                            t1: parseInt(row.t1) || 0,
                            t2: parseInt(row.t2) || 0,
                            t3: parseInt(row.t3) || 0,
                            t4: parseInt(row.t4) || 0,
                            manual: parseInt(row.manual) || 0
                        },
                        observations: ''
                    };
                    if (row.eventId) {
                        await inventoryApi.updateDailyLog(row.eventId, payload);
                    } else {
                        await inventoryApi.createDailyLog(payload);
                    }
                }
            } else {
                // Metro, CEP, or Quintas (Servicios Especiales) -> Planificación (Service Events)
                for (const row of dailyGrid) {
                    let category_id = 0;
                    let sd: any = {};
                    let attendees = 0;
                    let obs = '';
                    if (recordType === 'metropolitano') {
                        const hasData = row.plc || row.sm || row.cnPlanta || row.cenas || row.sc || row.conc || row.cnExt || row.csExt;
                        if (!hasData) continue;
                        category_id = 4; // METRO
                        sd = { plc: parseInt(row.plc)||0, sm: parseInt(row.sm)||0, cnPlanta: parseInt(row.cnPlanta)||0, cenas: parseInt(row.cenas)||0, sc: parseInt(row.sc)||0, conc: parseInt(row.conc)||0, cnExt: parseInt(row.cnExt)||0, csExt: parseInt(row.csExt)||0 };
                        attendees = (parseInt(row.plc)||0) + (parseInt(row.sm)||0) + (parseInt(row.cnPlanta)||0) + (parseInt(row.cenas)||0) + (parseInt(row.sc)||0) + (parseInt(row.conc)||0) + (parseInt(row.cnExt)||0) + (parseInt(row.csExt)||0);
                    } else if (recordType === 'cep') {
                        const hasData = row.sistemasCep || row.segPlc || row.segRuices || row.segCentral;
                        if (!hasData) continue;
                        category_id = 3; // CEP
                        sd = { sistemasCep: parseInt(row.sistemasCep)||0, segPlc: parseInt(row.segPlc)||0, segRuices: parseInt(row.segRuices)||0, segCentral: parseInt(row.segCentral)||0 };
                        attendees = (parseInt(row.sistemasCep)||0) + (parseInt(row.segPlc)||0) + (parseInt(row.segRuices)||0) + (parseInt(row.segCentral)||0);
                    } else if (recordType === 'quintas') {
                        const hasData = row.choferesCenas || row.choferesDesayunos || row.pepsicoDesayunos || row.quintasCenas || row.quintasDesayunos || row.pilotosAlmuerzos;
                        if (!hasData) continue;
                        category_id = 2; // ESPECIAL
                        sd = {
                            choferes: { cenas: parseFloat(row.choferesCenas)||0, desayunos: parseFloat(row.choferesDesayunos)||0 },
                            pepsico: { desayunos: parseFloat(row.pepsicoDesayunos)||0 },
                            quintas: { cenas: parseFloat(row.quintasCenas)||0, desayunos: parseFloat(row.quintasDesayunos)||0 },
                            pilotos: { almuerzos: parseFloat(row.pilotosAlmuerzos)||0 }
                        };
                        attendees = (parseInt(row.choferesCenas)||0) + (parseInt(row.quintasCenas)||0) + (parseInt(row.pilotosAlmuerzos)||0);
                    }

                    const payload = {
                        title: recordType === 'metropolitano' ? 'Planificación Metropolitano' : recordType === 'cep' ? 'Planificación CEP' : 'Servicios Especiales',
                        responsible: 'Admin',
                        company: 'Planificación',
                        cost_center: recordType === 'metropolitano' ? 'Metropolitano' : recordType === 'cep' ? 'CEP' : 'Servicios Especiales',
                        status: 'Abierto',
                        request_date: new Date().toISOString(),
                        status_date: new Date().toISOString(),
                        details: [{
                            service_date: new Date(row.date + 'T12:00:00').toISOString(),
                            service_time: 'Planificación',
                            location: recordType === 'metropolitano' ? 'Planta Los Cortijos & Otras' : recordType === 'cep' ? 'CEP' : 'Servicios Especiales',
                            text_time: 'Planificación',
                            attendees,
                            additional_requirements: '',
                            observations: obs,
                            service_category_id: category_id,
                            structured_data: sd,
                            estimated_amount: 0,
                            selected_items: []
                        }]
                    };
                    if (row.eventId) {
                        await inventoryApi.updateServiceEvent(Number(row.eventId), payload);
                    } else {
                        await inventoryApi.createServiceEvent(payload);
                    }
                }
            }

            toast.success('Registros guardados exitosamente');
            onSuccess();
        } catch (error: any) {
            console.error(error);
            const detail = error.response?.data?.detail || error.message || 'Error desconocido';
            toast.error(`Error al guardar: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
        } finally {
            setLoading(false);
        }
    };

    // Render Helpers
    const getDatesArray = () => {
        const dates: string[] = [];
        let curr = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');
        while (curr <= end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            
            {/* Cabecera */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                        <Plus size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {initialType ? 'Modificar' : 'Nuevo'} Registro
                        </h1>
                        <p className="text-gray-500 text-xs font-medium">
                            {step === 1 ? 'Paso 1: ¿Qué deseas registrar?' : step === 2 ? 'Paso 2: Rango de fechas' : 'Paso 3: Carga de datos'}
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

            {/* Línea divisoria */}
            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            <div className="flex flex-col min-h-[500px]">
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'metropolitano', title: 'Planificación Metropolitano', desc: 'Registrar PLC, SM, Cenas, etc.' },
                                    { id: 'cep', title: 'Planificación CEP', desc: 'Sistemas, Seg. PLC, Ruices, etc.' },
                                    { id: 'quintas', title: 'Servicios Especiales', desc: 'Choferes, Pepsico, Quintas, Pilotos' },
                                    { id: 'diario', title: 'Almuerzos Comedor', desc: 'Asistencia real de torniquetes y ventas' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setRecordType(t.id as any)}
                                        className={`p-6 rounded-2xl border-2 text-left transition-all ${recordType === t.id ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-150 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-850'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`text-lg font-bold ${recordType === t.id ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>{t.title}</h3>
                                            {recordType === t.id && <CheckCircle2 className="text-primary" size={20} />}
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">{t.desc}</p>
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl mx-auto space-y-8 py-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Fecha Inicio</label>
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3">
                                            <Calendar size={18} className="text-gray-400" />
                                            <input type="date" className="bg-transparent border-none outline-none font-medium text-gray-900 dark:text-white w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Fecha Fin</label>
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3">
                                            <Calendar size={18} className="text-gray-400" />
                                            <input type="date" className="bg-transparent border-none outline-none font-medium text-gray-900 dark:text-white w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-3">
                                    <Calendar className="shrink-0 mt-0.5" size={16} />
                                    <p>Se generará una cuadrícula de datos para cada día dentro del rango seleccionado. Puedes dejar en blanco los días/columnas que no apliquen.</p>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full">
                                {true && (
                                    <div className="overflow-x-auto w-full">
                                        <table className="w-full text-left whitespace-nowrap">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Fecha</th>
                                                    {recordType === 'metropolitano' && (
                                                        <>
                                                            {['PLC', 'SM (Almuerzos)', 'SM (Cenas)', 'SM (Sobre Cenas)', 'Col. Norte', 'Concentrados', 'Col. Norte (Ext)', 'Col. Sur'].map(t => <th key={t} className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t}</th>)}
                                                        </>
                                                    )}
                                                    {recordType === 'cep' && (
                                                        <>
                                                            {['Sist. CEP', 'Seg. PLC', 'Seg. Ruices', 'Seg. Central'].map(t => <th key={t} className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t}</th>)}
                                                        </>
                                                    )}
                                                    {recordType === 'quintas' && (
                                                        <>
                                                            <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700" colSpan={2}>Choferes</th>
                                                            <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Pepsico</th>
                                                            <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700" colSpan={2}>Quintas</th>
                                                            <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Pilotos</th>
                                                        </>
                                                    )}
                                                    {recordType === 'diario' && (
                                                        <>
                                                            {['T1', 'T2', 'T3', 'T4', 'Manual', 'Total Servido', 'Desayunos ($)'].map(t => <th key={t} className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t}</th>)}
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {recordType === 'quintas' && (
                                                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                                        <th className="px-4 py-2 sticky left-0 bg-gray-50/50 dark:bg-gray-800/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></th>
                                                        <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Cenas (Cant)</th>
                                                        <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Desay. ($)</th>
                                                        <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Desay. ($)</th>
                                                        <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Cenas (Cant)</th>
                                                        <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-200 dark:border-gray-700">Desay. ($)</th>
                                                        <th className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Almuerzos (Cant)</th>
                                                    </tr>
                                                )}
                                                {dailyGrid.map((row, idx) => (
                                                    <tr key={row.date} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-sm text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                            {formatDate(row.date)}
                                                        </td>
                                                        {recordType === 'metropolitano' && (
                                                            <>
                                                                {['plc', 'sm', 'cenas', 'sc', 'cnPlanta', 'conc', 'cnExt', 'csExt'].map(field => (
                                                                    <td key={field} className="px-2 py-2">
                                                                        <input type="number" className="w-20 p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={row[field]} onChange={e => { const n = [...dailyGrid]; n[idx][field] = e.target.value; setDailyGrid(n); }} placeholder="-" />
                                                                    </td>
                                                                ))}
                                                            </>
                                                        )}
                                                        {recordType === 'cep' && (
                                                            <>
                                                                {['sistemasCep', 'segPlc', 'segRuices', 'segCentral'].map(field => (
                                                                    <td key={field} className="px-2 py-2">
                                                                        <input type="number" className="w-20 p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={row[field]} onChange={e => { const n = [...dailyGrid]; n[idx][field] = e.target.value; setDailyGrid(n); }} placeholder="-" />
                                                                    </td>
                                                                ))}
                                                            </>
                                                        )}
                                                        {recordType === 'quintas' && (
                                                            <>
                                                                {['choferesCenas'].map(field => (
                                                                    <td key={field} className="px-2 py-2">
                                                                        <input type="number" className="w-20 p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={row[field]} onChange={e => { const n = [...dailyGrid]; n[idx][field] = e.target.value; setDailyGrid(n); }} placeholder="-" />
                                                                    </td>
                                                                ))}
                                                                {['choferesDesayunos'].map(field => (
                                                                    <td key={field} className="px-2 py-2 border-r border-gray-200 dark:border-gray-700">
                                                                        <input type="number" step="0.01" className="w-20 p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={row[field]} onChange={e => { const n = [...dailyGrid]; n[idx][field] = e.target.value; setDailyGrid(n); }} placeholder="-" />
                                                                    </td>
                                                                ))}
                                                                {['pepsicoDesayunos'].map(field => (
                                                                    <td key={field} className="px-2 py-2 border-r border-gray-200 dark:border-gray-700">
                                                                        <input type="number" step="0.01" className="w-20 p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={row[field]} onChange={e => { const n = [...dailyGrid]; n[idx][field] = e.target.value; setDailyGrid(n); }} placeholder="-" />
                                                                    </td>
                                                                ))}
                                                                {['quintasCenas'].map(field => (
                                                                    <td key={field} className="px-2 py-2">
                                                                        <input type="number" className="w-20 p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={row[field]} onChange={e => { const n = [...dailyGrid]; n[idx][field] = e.target.value; setDailyGrid(n); }} placeholder="-" />
                                                                    </td>
                                                                ))}
                                                                {['quintasDesayunos'].map(field => (
                                                                    <td key={field} className="px-2 py-2 border-r border-gray-200 dark:border-gray-700">
                                                                        <input type="number" step="0.01" className="w-20 p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={row[field]} onChange={e => { const n = [...dailyGrid]; n[idx][field] = e.target.value; setDailyGrid(n); }} placeholder="-" />
                                                                    </td>
                                                                ))}
                                                                {['pilotosAlmuerzos'].map(field => (
                                                                    <td key={field} className="px-2 py-2">
                                                                        <input type="number" className="w-20 p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary text-center" value={row[field]} onChange={e => { const n = [...dailyGrid]; n[idx][field] = e.target.value; setDailyGrid(n); }} placeholder="-" />
                                                                    </td>
                                                                ))}
                                                            </>
                                                        )}
                                                        {recordType === 'diario' && (
                                                            <>
                                                                {['t1', 't2', 't3', 't4', 'manual', 'lunchSold', 'breakfastRevenue'].map((field, i) => (
                                                                    <td key={field} className="px-2 py-2">
                                                                        <input type="number" step={i === 6 ? "0.01" : "1"} className={`w-24 p-2 mx-auto block bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-center ${field === 'lunchSold' ? 'font-bold bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-0' : 'focus:border-primary'}`} value={row[field]} onChange={e => { 
                                                                            const n = [...dailyGrid]; 
                                                                            n[idx][field] = e.target.value; 
                                                                            if (['t1', 't2', 't3', 't4', 'manual'].includes(field)) {
                                                                                const sum = ['t1', 't2', 't3', 't4', 'manual'].reduce((acc, k) => acc + (parseInt(n[idx][k]) || 0), 0);
                                                                                n[idx].lunchSold = sum > 0 ? sum.toString() : '';
                                                                            }
                                                                            setDailyGrid(n); 
                                                                        }} readOnly={field === 'lunchSold'} placeholder="-" />
                                                                    </td>
                                                                ))}
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
                    <div>
                        {step > 1 && (
                            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-5 py-2.5 text-gray-500 hover:text-gray-800 dark:hover:text-white font-bold text-sm transition-colors">
                                <ArrowLeft size={16} /> Volver
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-gray-500 hover:text-gray-800 dark:hover:text-white font-bold text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors">
                            Cancelar
                        </button>
                        {step === 1 && (
                            <button onClick={handleNextStep1} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-sm transition-all">
                                Continuar <ArrowRight size={16} />
                            </button>
                        )}
                        {step === 2 && (
                            <button onClick={handleNextStep2} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-sm transition-all">
                                Generar Cuadrícula <ArrowRight size={16} />
                            </button>
                        )}
                        {step === 3 && (
                            <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Guardar Registros
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
