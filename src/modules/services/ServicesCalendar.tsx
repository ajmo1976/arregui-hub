import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Users,
    MapPin,
    Filter,
    Search,
    Loader2,
    Printer
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO,
    startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import ServiceDetailView from './ServiceDetailView';

// Helper to parse date string neutrally into a local midnight Date object
const parseNeutralDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    const parts = datePart.split('-');
    if (parts.length !== 3) return new Date(dateStr);
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
};

// Helper to convert time string (e.g. "3:00 p.m.") to minutes from midnight
const parseTimeToMinutes = (timeStr: string = "") => {
    if (!timeStr) return 0;
    try {
        const parts = timeStr.toLowerCase().trim().split(' ');
        const timePart = parts[0];
        const modifier = parts[1] || "";

        let [hours, minutes] = timePart.split(':').map(Number);
        if (isNaN(hours)) hours = 0;
        if (isNaN(minutes)) minutes = 0;

        const isPM = modifier.includes('p');
        const isAM = modifier.includes('a') || (!isPM && modifier === "");

        if (isPM && hours !== 12) hours += 12;
        if (isAM && hours === 12) hours = 0;

        return hours * 60 + minutes;
    } catch (e) {
        return 0;
    }
};

// Helper to get status-specific colors
const getStatusColors = (status: string) => {
    const s = status ? status.trim() : "";
    switch (s) {
        case 'Abierto':
            return {
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                border: 'border-blue-100 hover:border-blue-300 dark:border-blue-800/40 dark:hover:border-blue-700',
                text: 'text-blue-700 dark:text-blue-300',
                dot: 'bg-blue-500 dark:bg-blue-400',
                badgeBg: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
                solidBg: 'bg-blue-600 dark:bg-blue-500',
                glow: 'shadow-blue-500/20'
            };
        case 'Reprogramado':
            return {
                bg: 'bg-amber-50 dark:bg-amber-900/20',
                border: 'border-amber-100 hover:border-amber-300 dark:border-amber-800/40 dark:hover:border-amber-700',
                text: 'text-amber-700 dark:text-amber-300',
                dot: 'bg-amber-500 dark:bg-amber-400',
                badgeBg: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
                solidBg: 'bg-amber-600 dark:bg-amber-500',
                glow: 'shadow-amber-500/20'
            };
        case 'Facturado':
            return {
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                border: 'border-emerald-100 hover:border-emerald-300 dark:border-emerald-800/40 dark:hover:border-emerald-700',
                text: 'text-emerald-700 dark:text-emerald-300',
                dot: 'bg-emerald-500 dark:bg-emerald-400',
                badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
                solidBg: 'bg-emerald-600 dark:bg-emerald-500',
                glow: 'shadow-emerald-500/20'
            };
        case 'Cancelado':
            return {
                bg: 'bg-red-50 dark:bg-red-900/20',
                border: 'border-red-100 hover:border-red-300 dark:border-red-800/40 dark:hover:border-red-700',
                text: 'text-red-700 dark:text-red-300',
                dot: 'bg-red-500 dark:bg-red-400',
                badgeBg: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
                solidBg: 'bg-red-600 dark:bg-red-500',
                glow: 'shadow-red-500/20'
            };
        case 'Cerrado':
        default:
            return {
                bg: 'bg-gray-50 dark:bg-gray-800/20',
                border: 'border-gray-200 hover:border-gray-300 dark:border-gray-700/40 dark:hover:border-gray-600',
                text: 'text-gray-700 dark:text-gray-300',
                dot: 'bg-gray-500 dark:bg-gray-400',
                badgeBg: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700',
                solidBg: 'bg-gray-600 dark:bg-gray-500',
                glow: 'shadow-gray-500/20'
            };
    }
};

export default function ServicesCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const weekScrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to first event of the week
    useEffect(() => {
        if (view === 'week' && weekScrollRef.current && events.length > 0) {
            const start = startOfWeek(currentDate, { locale: es });
            const end = endOfWeek(currentDate, { locale: es });
            const weekEvents = events.filter(ev => {
                const d = parseNeutralDate(ev.service_date);
                return d >= start && d <= end;
            });

            if (weekEvents.length > 0) {
                const getTimeMinutes = (timeStr: string) => parseTimeToMinutes(timeStr);

                const earliestMinutes = Math.min(...weekEvents.map(ev => getTimeMinutes(ev.service_time)));
                const scrollPos = (earliestMinutes / 60) * 70 - 100; // 70 is hour height
                weekScrollRef.current.scrollTop = Math.max(0, scrollPos);
            } else {
                // If no events, scroll to 8 AM
                weekScrollRef.current.scrollTop = 8 * 70;
            }
        }
    }, [view, currentDate, events]);

    const handlePrev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
        else setCurrentDate(addDays(currentDate, -1));
    };

    const handleNext = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const getHeaderTitle = () => {
        if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: es });
        if (view === 'week') {
            const start = startOfWeek(currentDate, { locale: es });
            const end = endOfWeek(currentDate, { locale: es });
            return `Semana del ${format(start, 'd')} al ${format(end, 'd')} de ${format(end, 'MMMM', { locale: es })}`;
        }
        return format(currentDate, "EEEE, d 'de' MMMM", { locale: es });
    };

    const fetchEvents = async () => {
        console.log("Calendar Module: Starting fetchEvents...");
        setLoading(true);
        try {
            const res = await inventoryApi.getServiceEvents();
            console.log("Calendar Module: API Response:", res.data);

            // Flatten events to single service entries for the calendar
            const flattened: any[] = [];

            if (res.data && Array.isArray(res.data)) {
                res.data.forEach((ev: any) => {
                    const details = ev.details || [];
                    details.forEach((detail: any) => {
                        flattened.push({
                            ...ev,
                            detail_id: detail.id,
                            service_date: detail.service_date,
                            service_time: detail.service_time,
                            location: detail.location,
                            attendees: detail.attendees,
                            additional_requirements: detail.additional_requirements
                        });
                    });
                });
            } else {
                console.warn("Calendar Module: No data or invalid format received", res.data);
            }

            console.log("Calendar Module: Flattened events count:", flattened.length);
            setEvents(flattened);
        } catch (err: any) {
            console.error("Calendar Module: CRITICAL ERROR:", err);
            toast.error('No se pudo conectar con el servidor. Verifique su conexión.');
        } finally {
            setLoading(false);
            console.log("Calendar Module: Data loading workflow completed.");
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const renderHeader = () => {
        return (
            <div className="flex flex-col gap-6 mb-8 px-2 font-inter">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                            Calendario de Eventos
                        </h1>
                        <p className="text-gray-500 font-medium">
                            Visualización cronológica de todas las solicitudes de catering y eventos programados.
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Printer size={18} />
                        Imprimir Reporte
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
                        >
                            HOY
                        </button>
                        <button
                            onClick={handlePrev}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <h2 className="text-xl font-black text-gray-700 dark:text-white uppercase tracking-tight">
                        {getHeaderTitle()}
                    </h2>

                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
                        {[
                            { id: 'month', label: 'Mes' },
                            { id: 'week', label: 'Semana' },
                            { id: 'day', label: 'Día' },
                            { id: 'agenda', label: 'Agenda' }
                        ].map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id as any)}
                                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === v.id ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dateNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center border-b border-gray-100 dark:border-gray-800">
                    {dateNames[i]}
                </div>
            );
        }

        return <div className="grid grid-cols-7">{days}</div>;
    };

    const renderWeekCells = () => {
        const start = startOfWeek(currentDate, { locale: es });
        const days = eachDayOfInterval({
            start,
            end: endOfWeek(start, { locale: es })
        });
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return (
            <div className="flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
                {/* Header Days */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-20 backdrop-blur-md">
                    <div className="w-20 border-r border-gray-100 dark:border-gray-800" />
                    <div className="flex-1 grid grid-cols-7 font-inter uppercase">
                        {days.map((day, i) => {
                            const dayEvents = events.filter(ev => isSameDay(parseNeutralDate(ev.service_date), day));
                            return (
                                <div key={i} className={`py-4 px-1 text-center border-r last:border-r-0 border-gray-100 dark:border-gray-800 ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                                    <p className="text-[10px] font-black text-gray-400 tracking-widest leading-none">{format(day, 'eee', { locale: es })}</p>
                                    <p className={`text-sm font-black mt-1 mb-2 ${isSameDay(day, new Date()) ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {format(day, 'dd')}
                                    </p>

                                    {/* Mini Timeline Dots (Visual cue for events outside viewport) */}
                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full relative overflow-hidden flex items-center">
                                        {dayEvents.map((ev, idx) => {
                                            const getTimeInfo = (timeStr: string) => parseTimeToMinutes(timeStr);
                                            const pos = (getTimeInfo(ev.service_time) / 1440) * 100;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="absolute w-1 h-1 bg-primary rounded-full shadow-[0_0_4px_rgba(var(--primary-rgb),0.5)]"
                                                    style={{ left: `${pos}%` }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Time Grid */}
                <div ref={weekScrollRef} className="flex flex-1 overflow-y-auto max-h-[700px] custom-scrollbar relative">
                    {/* Hours column */}
                    <div className="w-20 bg-gray-50/30 dark:bg-gray-900/30 border-r border-gray-100 dark:border-gray-800 sticky left-0 z-10 backdrop-blur-sm">
                        {hours.map(hour => (
                            <div key={hour} className="h-[70px] border-b border-gray-100 dark:border-gray-800 px-2 py-1 text-right">
                                <span className="text-[10px] font-black text-gray-400 uppercase">
                                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Columns grid */}
                    <div className="flex-1 grid grid-cols-7 relative">
                        {/* Current Time Indicator Line */}
                        {(() => {
                            const now = new Date();
                            const hour = now.getHours();
                            const minutes = now.getMinutes();
                            const top = (hour * 70) + (minutes * 70 / 60);
                            return (
                                <div
                                    className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none"
                                    style={{ top: `${top}px` }}
                                >
                                    <div className="absolute -top-1.5 -left-1 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
                                </div>
                            );
                        })()}

                        {days.map((day, dayIdx) => (
                            <div key={dayIdx} className="relative border-r last:border-r-0 border-gray-100 dark:border-gray-800">
                                {hours.map(hour => (
                                    <div key={hour} className="h-[70px] border-b border-gray-50/50 dark:border-gray-800/50" />
                                ))}

                                {/* Events for this day */}
                                {(() => {
                                    const dayEvents = events
                                        .filter(ev => isSameDay(parseNeutralDate(ev.service_date), day))
                                        .sort((a, b) => parseTimeToMinutes(a.service_time) - parseTimeToMinutes(b.service_time));

                                    if (dayEvents.length === 0) return null;

                                    const getTimeInfo = (timeStr: string) => {
                                        const totalMinutes = parseTimeToMinutes(timeStr);
                                        const hours = Math.floor(totalMinutes / 60);
                                        const minutes = totalMinutes % 60;
                                        return { hours, minutes, totalMinutes };
                                    };

                                    // Algorithm to handle overlaps
                                    const processedEvents: any[] = [];
                                    const columns: any[][] = [];

                                    dayEvents.forEach(ev => {
                                        const { totalMinutes } = getTimeInfo(ev.service_time);
                                        const start = totalMinutes;
                                        const end = start + 90; // Assume 1.5h duration if not specified

                                        let placed = false;
                                        for (let i = 0; i < columns.length; i++) {
                                            const lastEvInCol = columns[i][columns[i].length - 1];
                                            const lastEvTime = getTimeInfo(lastEvInCol.service_time).totalMinutes;
                                            const lastEvEnd = lastEvTime + 90;

                                            if (start >= lastEvEnd) {
                                                columns[i].push(ev);
                                                processedEvents.push({ ...ev, col: i });
                                                placed = true;
                                                break;
                                            }
                                        }

                                        if (!placed) {
                                            columns.push([ev]);
                                            processedEvents.push({ ...ev, col: columns.length - 1 });
                                        }
                                    });

                                    const totalCols = columns.length;

                                    return processedEvents.map((ev, evIdx) => {
                                        const { hours, minutes } = getTimeInfo(ev.service_time);
                                        const top = (hours * 70) + (minutes * 70 / 60);
                                        const width = 100 / totalCols;
                                        const left = ev.col * width;

                                        const colors = getStatusColors(ev.status);
                                        return (
                                            <motion.div
                                                key={`${ev.id}-${evIdx}`}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEvent(ev);
                                                }}
                                                style={{
                                                    top: `${top}px`,
                                                    left: `${left}%`,
                                                    width: `${width - 1}%`,
                                                    zIndex: 10 + ev.col
                                                }}
                                                className={`absolute p-2 rounded-xl ${colors.solidBg} shadow-xl ${colors.glow} text-white cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden min-h-[70px] border border-white/20`}
                                            >
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Clock size={10} strokeWidth={3} />
                                                    <span className="text-[9px] font-black uppercase opacity-90">{ev.service_time}</span>
                                                </div>
                                                <p className="text-[10px] font-black leading-tight uppercase tracking-tight mb-1 line-clamp-2">
                                                    {ev.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-[8px] font-bold opacity-80 uppercase tracking-tighter truncate">
                                                    <div className="flex items-center gap-0.5 min-w-0">
                                                        <MapPin size={8} className="shrink-0" />
                                                        <span className="truncate">{ev.location}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    });
                                })()}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderDayCells = () => {
        const dayEvents = events.filter(ev => isSameDay(parseNeutralDate(ev.service_date), currentDate));

        return (
            <div className="flex flex-col border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden bg-white dark:bg-gray-950 shadow-2xl min-h-[600px]">
                <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary text-white rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-2xl font-black leading-none">{format(currentDate, 'd')}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{format(currentDate, 'MMM', { locale: es })}</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                {format(currentDate, 'EEEE', { locale: es })}
                            </h3>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                                {dayEvents.length} {dayEvents.length === 1 ? 'Servicio Programado' : 'Servicios Programados'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dayEvents.length > 0 ? (
                        dayEvents.sort((a, b) => a.service_time.localeCompare(b.service_time)).map((ev, idx) => {
                            const colors = getStatusColors(ev.status);
                            return (
                                <motion.div
                                    key={`${ev.id}-${idx}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => setSelectedEvent(ev)}
                                    className="group relative pl-8 pr-6 py-6 rounded-[2rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary/30 hover:shadow-2xl transition-all cursor-pointer overflow-hidden"
                                >
                                    <div className={`absolute top-0 left-0 bottom-0 w-2 ${colors.solidBg}`} />
                                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                                        <div className={`px-2.5 py-1 ${colors.badgeBg} text-[9px] font-black rounded-full uppercase tracking-widest`}>
                                            {ev.status}
                                        </div>
                                        <div className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[9px] font-black rounded-full uppercase tracking-widest">
                                            {ev.service_time}
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                                <Clock size={20} />
                                            </div>
                                            <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight pr-24">
                                                {ev.title}
                                            </h4>
                                        </div>
                                        <div className="w-full h-px bg-gray-50 dark:bg-gray-700" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Lugar</span>
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                                                    <MapPin size={14} className="text-primary/60" />
                                                    <span className="truncate">{ev.location}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Personas</span>
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                                                    <Users size={14} className="text-primary/60" />
                                                    <span>{ev.attendees} PAX</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-300 dark:text-gray-600 mb-6">
                                <CalendarIcon size={40} />
                            </div>
                            <h4 className="text-xl font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                                No hay servicios para este día
                            </h4>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAgenda = () => {
        // Sort events by date and time
        const sortedEvents = [...events].sort((a, b) => {
            const dateA = parseNeutralDate(a.service_date);
            const dateB = parseNeutralDate(b.service_date);
            if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
            return a.service_time.localeCompare(b.service_time);
        });

        // Group by day
        const grouped: { [key: string]: any[] } = {};
        sortedEvents.forEach(ev => {
            const dateKey = format(parseNeutralDate(ev.service_date), 'yyyy-MM-dd');
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(ev);
        });

        return (
            <div className="space-y-6 pb-20">
                {Object.entries(grouped).map(([dateKey, dayEvents]) => (
                    <div key={dateKey} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden p-6">
                        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-50 dark:border-gray-800">
                            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex flex-col items-center justify-center shadow-lg">
                                <span className="text-xl font-black leading-none">{format(parseNeutralDate(dateKey), 'd')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{format(parseNeutralDate(dateKey), 'MMM', { locale: es })}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                    {format(parseISO(dateKey), 'EEEE', { locale: es })}
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {dayEvents.length} {dayEvents.length === 1 ? 'Servicio' : 'Servicios'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dayEvents.map((ev, idx) => {
                                const colors = getStatusColors(ev.status);
                                return (
                                    <motion.div
                                        key={`${ev.id}-${idx}`}
                                        onClick={() => setSelectedEvent(ev)}
                                        className="p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden pl-7"
                                    >
                                        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${colors.solidBg}`} />
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex gap-2">
                                                <span className={`px-2.5 py-0.5 ${colors.badgeBg} text-[9px] font-black rounded-full uppercase`}>
                                                    {ev.status}
                                                </span>
                                                <div className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[9px] font-black rounded-full uppercase">
                                                    {ev.service_time}
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-2 truncate">
                                            {ev.title}
                                        </h4>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={12} />
                                                <span>{ev.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users size={12} />
                                                <span>{ev.attendees} PAX</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderMonthCells = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: es });
        const endDate = endOfWeek(monthEnd, { locale: es });

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                // Filter events for this day
                const dayEvents = events.filter(ev => isSameDay(parseNeutralDate(ev.service_date), cloneDay));

                days.push(
                    <div
                        key={day.toString()}
                        className={`min-h-[140px] p-2 border-r border-b border-gray-50 dark:border-gray-800 transition-all relative group
                            ${!isCurrentMonth ? 'bg-gray-50/30' : 'bg-white dark:bg-gray-950'}
                            ${isSelected ? 'bg-primary/[0.02]' : ''}
                            hover:bg-gray-50 dark:hover:bg-gray-900 shadow-inner`}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg transition-all
                                ${isToday ? 'bg-primary text-white shadow-lg' : isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-300'}
                             `}>
                                {formattedDate}
                            </span>
                            {dayEvents.length > 0 && (
                                <span className="text-[10px] font-black text-primary/40 leading-none">
                                    {dayEvents.length} {dayEvents.length === 1 ? 'Serv.' : 'Servs.'}
                                </span>
                            )}
                        </div>

                        <div className="space-y-1 overflow-y-auto max-h-[100px] custom-scrollbar pr-1">
                            {dayEvents.map((ev, idx) => {
                                const colors = getStatusColors(ev.status);
                                return (
                                    <motion.div
                                        key={`${ev.id}-${idx}`}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedEvent(ev);
                                        }}
                                        className={`p-1.5 rounded-lg ${colors.bg} border ${colors.border} transition-all cursor-pointer overflow-hidden group/ev`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                            <span className={`text-[9px] font-black ${colors.text} uppercase truncate leading-none`}>
                                                {ev.service_time}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate tracking-tight">
                                            {ev.title}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="border-l border-t border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 dark:shadow-none">{rows}</div>;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px]">
                <Loader2 className="animate-spin text-primary mb-4" size={40} />
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Cargando Calendario...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-inter">
            {renderHeader()}

            <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden"
            >
                {(view === 'month') && renderDays()}

                {view === 'month' && renderMonthCells()}
                {view === 'week' && renderWeekCells()}
                {view === 'day' && renderDayCells()}
                {view === 'agenda' && renderAgenda()}
            </motion.div>

            {/* Event Detail Portal */}
            <AnimatePresence>
                {selectedEvent && (
                    <ServiceDetailView
                        event={selectedEvent}
                        onClose={() => setSelectedEvent(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
