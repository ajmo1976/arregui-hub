import React, { useState, useRef, useEffect } from 'react';
import { 
    Upload, 
    Calendar, 
    X, 
    Plus, 
    Save, 
    Loader2, 
    ArrowLeft, 
    AlertCircle,
    ChevronRight,
    FileText,
    Edit2,
    Trash2,
    CalendarCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

interface WeeklyPlanningProps {
    onClose: () => void;
}

interface PlanningRow {
    id: string;
    date: string;
    dayName: string;
    plc: number;
    sm: number;
    colNortePlanta: number;
    cenas: number;
    sobreCenas: number;
    concentrados: number;
    colNorteExt: number;
    colSurExt: number;
}

const DAYS_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// Helper to get current week's Monday
const getComingMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
};

// Canvas preprocessing pipeline: convert to grayscale and upscale by 3x (NO binarization to let Tesseract do adaptive thresholding)
const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject("No se pudo obtener el contexto 2D del canvas");
                    return;
                }

                // Upscale by 3x to improve character resolution for OCR
                const scale = 3;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                // Fill with solid white to prevent transparent background bugs
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Enable high-quality smoothing for smooth text lines (matches Lanczos interpolation)
                ctx.imageSmoothingEnabled = true;
                (ctx as any).imageSmoothingQuality = 'high';
                (ctx as any).mozImageSmoothingEnabled = true;
                (ctx as any).webkitImageSmoothingEnabled = true;
                (ctx as any).msImageSmoothingEnabled = true;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                // Grayscale luminosity formula
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }

                ctx.putImageData(imgData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => reject("Error al cargar la imagen");
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject("Error al leer el archivo");
        reader.readAsDataURL(file);
    });
};

// Fuzzy match day names from OCR text
const getFuzzyDayIndex = (lineText: string): number => {
    const text = lineText.toLowerCase();
    if (text.includes('lun') || text.includes('ame') || text.includes('sut') || text.includes('lan')) return 0;
    if (text.includes('mar') || text.includes('mer')) return 1;
    if (text.includes('mié') || text.includes('mie') || text.includes('rer') || text.includes('col') || text.includes('rc')) return 2;
    if (text.includes('jue') || text.includes('jee') || text.includes('jeeves')) return 3;
    if (text.includes('vie')) return 4;
    return -1;
};

const MONTHS_MAP: { [key: string]: number } = {
    enero: 1, ene: 1, febrero: 2, feb: 2, marzo: 3, mar: 3, abril: 4, abr: 4,
    mayo: 5, may: 5, junio: 6, jun: 6, julio: 7, jul: 7, agosto: 8, ago: 8,
    septiembre: 9, sep: 9, octubre: 10, oct: 10, noviembre: 11, nov: 11, diciembre: 12, dic: 12
};

const parseOcrDate = (lineText: string, fallbackDate: string): string => {
    let t = lineText.toLowerCase().replace(/[^a-z0-9áéíóúüñ]/g, ' ');
    // Strip day names to prevent "mar" in "martes" matching Marzo
    t = t.replace(/(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/g, '');
    let monthNum = 0;
    let foundMonthName = '';
    // Sort keys by length descending to match full names before abbreviations
    const monthKeys = Object.keys(MONTHS_MAP).sort((a, b) => b.length - a.length);
    for (const mName of monthKeys) {
        const idx = t.indexOf(mName);
        if (idx !== -1) {
            monthNum = MONTHS_MAP[mName];
            foundMonthName = mName;
            break;
        }
    }
    if (monthNum > 0) {
        const afterMonth = t.substring(t.indexOf(foundMonthName) + foundMonthName.length);
        const yearM = afterMonth.match(/(20\d{1,2})/);
        const year = yearM ? yearM[1] : '2026';
        const fullYear = year.length === 3 ? `${year}6` : year.length === 2 ? `20${year}` : year;
        const beforeMonth = t.substring(0, t.indexOf(foundMonthName));
        const dayMatch = beforeMonth.match(/(\d{1,2})/g);
        const day = dayMatch ? dayMatch[dayMatch.length - 1] : '1';
        const pad = (n: string | number) => String(n).padStart(2, '0');
        return `${fullYear}-${pad(monthNum)}-${pad(day)}`;
    }
    return fallbackDate;
};

// Clean OCR grid lines/noise and extract numbers
const cleanAndExtractNumbers = (text: string): number[] => {
    // Remove common line characters and noise
    const cleanText = text
        .replace(/[|\]\[IilR\/\\tTfF\(\)\-\—\•\*\:\.]/g, ' ')
        .replace(/\s+/g, ' ');
    
    const matches = cleanText.match(/\d+/g);
    return matches ? matches.map(Number) : [];
};

// Map extracted numbers to a planning row
const mapNumbersToRow = (numbers: number[]): Omit<PlanningRow, 'id' | 'date' | 'dayName'> => {
    const row = {
        plc: 0,
        sm: 0,
        colNortePlanta: 0,
        cenas: 0,
        sobreCenas: 0,
        concentrados: 0,
        colNorteExt: 0,
        colSurExt: 0
    };

    if (numbers.length === 0) return row;

    // Filter out vertical line noise (single digit '1's that are noise after the first 3 columns)
    const cleanNumbers: number[] = [];
    for (let i = 0; i < numbers.length; i++) {
        const num = numbers[i];
        
        // Skip noise '1's that appear adjacent to 2-digit numbers or between numbers
        if (num === 1 && i >= 3) {
            // Check if followed by a 2-digit number (like 17 or 25 or 20)
            if (i + 1 < numbers.length && numbers[i + 1] >= 10 && numbers[i + 1] <= 35) {
                continue;
            }
            // Check if preceded by a 2-digit number and followed by a single digit
            if (i > 0 && numbers[i - 1] >= 10 && i + 1 < numbers.length && numbers[i + 1] < 10) {
                continue;
            }
        }
        cleanNumbers.push(num);
    }

    const plc = cleanNumbers[0] || 0;
    const sm = cleanNumbers[1] || 0;
    const colNortePlanta = cleanNumbers[2] || 0;
    const calculatedTotal = plc + sm + colNortePlanta;

    let remaining = cleanNumbers.slice(3);

    // Filter out the calculated total column from the remaining array
    if (remaining.length > 0 && Math.abs(remaining[0] - calculatedTotal) <= 1) {
        remaining = remaining.slice(1);
    } else if (remaining.length > 1 && Math.abs(remaining[1] - calculatedTotal) <= 1) {
        remaining = remaining.slice(2);
    }

    row.plc = plc;
    row.sm = sm;
    row.colNortePlanta = colNortePlanta;

    // Advanced Anchor Heuristics: Find the Concentrados column (the only number >= 10 in the remaining array)
    const concentradosIdx = remaining.findIndex(val => val >= 10 && val <= 35);
    
    if (concentradosIdx !== -1) {
        row.concentrados = remaining[concentradosIdx];
        
        // Map elements after Concentrados to colNorteExt, colSurExt
        const after = remaining.slice(concentradosIdx + 1);
        row.colNorteExt = after[0] || 0;
        row.colSurExt = after[1] || 0;
        
        // Map elements before Concentrados backwards to sobreCenas, cenas
        const before = remaining.slice(0, concentradosIdx);
        if (before.length > 0) {
            row.sobreCenas = before[before.length - 1];
        }
        if (before.length > 1) {
            row.cenas = before[before.length - 2];
        }
    } else {
        // Fallback: sequential mapping
        row.cenas = remaining[0] || 0;
        row.sobreCenas = remaining[1] || 0;
        row.concentrados = remaining[2] || 0;
        row.colNorteExt = remaining[3] || 0;
        row.colSurExt = remaining[4] || 0;
    }

    return row;
};

export default function WeeklyPlanning({ onClose }: WeeklyPlanningProps) {
    const [planningViewMode, setPlanningViewMode] = useState<'list' | 'editor'>('list');
    const [savedPlannings, setSavedPlannings] = useState<any[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);

    const [title, setTitle] = useState('');
    const [weekStartDate, setWeekStartDate] = useState(getComingMonday());
    const [rows, setRows] = useState<PlanningRow[]>([]);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('');
    const [saving, setSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch saved planning events
    const fetchPlanningEvents = async () => {
        try {
            setLoadingSaved(true);
            const res = await inventoryApi.getServiceEvents();
            // Filter by planning company/cost_center
            const filtered = res.data.filter((ev: any) => ev.company === 'Planificación' || ev.cost_center === 'Planificación');
            setSavedPlannings(filtered);
        } catch (err) {
            toast.error("Error al cargar planificaciones guardadas");
        } finally {
            setLoadingSaved(false);
        }
    };

    useEffect(() => {
        if (planningViewMode === 'list') {
            fetchPlanningEvents();
        }
    }, [planningViewMode]);

    // Automatically recalculate dates when weekStartDate changes
    useEffect(() => {
        if (rows.length > 0 && weekStartDate) {
            setRows(prev => prev.map((r, i) => {
                const dateObj = new Date(`${weekStartDate}T12:00:00`);
                dateObj.setDate(dateObj.getDate() + i);
                const dateStr = dateObj.toISOString().split('T')[0];
                return {
                    ...r,
                    date: dateStr,
                    dayName: DAYS_ES[(dateObj.getDay() + 6) % 7]
                };
            }));
            
            // Recalculate title dates
            const dateObjStart = new Date(`${weekStartDate}T12:00:00`);
            const dateObjEnd = new Date(`${weekStartDate}T12:00:00`);
            dateObjEnd.setDate(dateObjEnd.getDate() + (rows.length - 1));
            
            const formatTitleDate = (d: Date) => {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                return `${day}.${month}`;
            };
            
            setTitle(`Planificación Semana del ${formatTitleDate(dateObjStart)} al ${formatTitleDate(dateObjEnd)}`);
        }
    }, [weekStartDate, rows.length]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            processImage(file);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const processImage = async (file: File) => {
        setOcrLoading(true);
        setOcrProgress(0);
        setLoadingText("Preprocesando imagen (Grayscale + 3x Upscaling)...");

        try {
            // Apply canvas-based scaling
            const preprocessedDataUrl = await preprocessImage(file);

            setLoadingText("Inicializando motor de reconocimiento (English)...");
            
            // Run Tesseract recognition on the preprocessed image using 'eng' language
            const result = await Tesseract.recognize(
                preprocessedDataUrl,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setOcrProgress(Math.round(m.progress * 100));
                            setLoadingText(`Analizando datos de la tabla: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            );

            const text = result.data.text;
            const lines = text.split('\n');
            
            // Map to store numbers and dates for each day index (0: Lunes, 1: Martes, etc.)
            const detectedRowsMap = new Map<number, number[]>();
            const detectedDatesMap = new Map<number, string>();

            for (let line of lines) {
                line = line.trim();
                const dayIndex = getFuzzyDayIndex(line);
                if (dayIndex !== -1) {
                    // Identify the year preceded by month/preposition to split the numbers part cleanly
                    const yearMatch = line.match(/(20\d{1,2})/);
                    let numbersPart = line;
                    if (yearMatch) {
                        const yearStr = yearMatch[1];
                        const yearIndex = line.indexOf(yearStr);
                        numbersPart = line.substring(yearIndex + yearStr.length);
                    } else {
                        // Fallback: search for any 3-4 digit year starting with 20 or 2
                        const yearFallback = line.match(/\b(20\d{2}|20\d|2\d{3}|7\d{3})\b/);
                        if (yearFallback) {
                            const yearStr = yearFallback[1];
                            const yearIndex = line.indexOf(yearStr);
                            numbersPart = line.substring(yearIndex + yearStr.length);
                        } else {
                            // Fallback: strip day name
                            const dayWords = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo', 'sutes', 'ames', 'lume', 'mares', 'rercoles', 'meéroles', 'jeeves'];
                            for (const word of dayWords) {
                                const idx = line.toLowerCase().indexOf(word);
                                if (idx !== -1) {
                                    numbersPart = line.substring(idx + word.length + 5);
                                    break;
                                }
                            }
                        }
                    }

                    const numbers = cleanAndExtractNumbers(numbersPart);
                    detectedRowsMap.set(dayIndex, numbers);

                    const parsedDateStr = parseOcrDate(line, '');
                    if (parsedDateStr) {
                        detectedDatesMap.set(dayIndex, parsedDateStr);
                    }
                }
            }

            // Always generate exactly 4 rows (Lunes to Jueves) or 5 if Viernes was detected
            const rowCount = detectedRowsMap.has(4) ? 5 : 4; // if Viernes (index 4) has data, make it 5 rows, else default to 4 (Lunes to Jueves)
            
            let ocrWeekStartDate = weekStartDate;
            if (detectedDatesMap.has(0)) {
                ocrWeekStartDate = detectedDatesMap.get(0)!;
            }

            const finalRows: PlanningRow[] = [];
            for (let i = 0; i < rowCount; i++) {
                const rowFallbackDateObj = new Date(`${ocrWeekStartDate}T12:00:00`);
                rowFallbackDateObj.setDate(rowFallbackDateObj.getDate() + i);
                const fallbackDateStr = rowFallbackDateObj.toISOString().split('T')[0];

                const dateStr = detectedDatesMap.get(i) || fallbackDateStr;
                const numbers = detectedRowsMap.get(i) || [];
                const rowData = mapNumbersToRow(numbers);

                finalRows.push({
                    id: `row-${Date.now()}-${i}`,
                    date: dateStr,
                    dayName: DAYS_ES[i],
                    ...rowData
                });
            }

            if (detectedDatesMap.has(0)) {
                setWeekStartDate(detectedDatesMap.get(0)!);
            }
            setRows(finalRows);
            toast.success(`OCR completado: Planificación cargada para ${rowCount} días de la semana.`);

        } catch (err: any) {
            console.error(err);
            toast.error("Error al procesar la imagen con OCR.");
            initializeBlankRows();
        } finally {
            setOcrLoading(false);
        }
    };

    const initializeBlankRows = () => {
        const blank = Array.from({ length: 4 }).map((_, i) => {
            const dateObj = new Date(`${weekStartDate}T12:00:00`);
            dateObj.setDate(dateObj.getDate() + i);
            const dateStr = dateObj.toISOString().split('T')[0];

            return {
                id: `row-blank-${Date.now()}-${i}`,
                date: dateStr,
                dayName: DAYS_ES[i],
                plc: 0,
                sm: 0,
                colNortePlanta: 0,
                cenas: 0,
                sobreCenas: 0,
                concentrados: 0,
                colNorteExt: 0,
                colSurExt: 0
            };
        });
        setRows(blank);
        setPlanningViewMode('editor');
    };

    const handleEditPlanningEvent = (event: any) => {
        setEditingEventId(event.id);
        setTitle(event.title);
        
        // Sort details by date to keep it Lunes -> Viernes
        const sortedDetails = [...(event.details || [])].sort((a: any, b: any) => a.service_date.localeCompare(b.service_date));
        
        if (sortedDetails.length > 0) {
            setWeekStartDate(sortedDetails[0].service_date.split('T')[0]);
        }
        
        const parsedRows = sortedDetails.map((d: any, idx: number) => {
            const obs = d.observations || '';
            const match = obs.match(/\[DESGLOSE_PLANIFICACION:\s*PLC=(\d+),\s*SM=(\d+),\s*CN_PLANTA=(\d+),\s*CENAS=(\d+),\s*SC=(\d+),\s*CONC=(\d+),\s*CN_EXT=(\d+),\s*CS_EXT=(\d+)\]/);
            
            let plc = 0, sm = 0, cnPlanta = 0, cenas = 0, sc = 0, conc = 0, cnExt = 0, csExt = 0;
            if (match) {
                plc = parseInt(match[1]);
                sm = parseInt(match[2]);
                cnPlanta = parseInt(match[3]);
                cenas = parseInt(match[4]);
                sc = parseInt(match[5]);
                conc = parseInt(match[6]);
                cnExt = parseInt(match[7]);
                csExt = parseInt(match[8]);
            } else {
                const fallbackPlc = obs.match(/PLC=(\d+)/);
                const fallbackSm = obs.match(/SM=(\d+)/);
                const fallbackCnPlanta = obs.match(/CN_PLANTA=(\d+)/);
                const fallbackCenas = obs.match(/CENAS=(\d+)/);
                const fallbackSc = obs.match(/SC=(\d+)/);
                const fallbackConc = obs.match(/CONC=(\d+)/);
                const fallbackCnExt = obs.match(/CN_EXT=(\d+)/);
                const fallbackCsExt = obs.match(/CS_EXT=(\d+)/);
                
                plc = fallbackPlc ? parseInt(fallbackPlc[1]) : 0;
                sm = fallbackSm ? parseInt(fallbackSm[1]) : 0;
                cnPlanta = fallbackCnPlanta ? parseInt(fallbackCnPlanta[1]) : 0;
                cenas = fallbackCenas ? parseInt(fallbackCenas[1]) : 0;
                sc = fallbackSc ? parseInt(fallbackSc[1]) : 0;
                conc = fallbackConc ? parseInt(fallbackConc[1]) : 0;
                cnExt = fallbackCnExt ? parseInt(fallbackCnExt[1]) : 0;
                csExt = fallbackCsExt ? parseInt(fallbackCsExt[1]) : 0;
            }

            const dateStr = d.service_date.split('T')[0];
            const dateObj = new Date(`${dateStr}T12:00:00`);

            return {
                id: `row-edit-${Date.now()}-${idx}-${d.id || idx}`,
                date: dateStr,
                dayName: DAYS_ES[(dateObj.getDay() + 6) % 7],
                plc,
                sm,
                colNortePlanta: cnPlanta,
                cenas,
                sobreCenas: sc,
                concentrados: conc,
                colNorteExt: cnExt,
                colSurExt: csExt
            };
        });
        
        setRows(parsedRows);
        setPlanningViewMode('editor');
    };

    const handleDeletePlanningEvent = async (id: number) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar esta planificación?")) return;
        try {
            await inventoryApi.deleteServiceEvent(id);
            toast.success("Planificación semanal eliminada.");
            fetchPlanningEvents();
        } catch (err) {
            toast.error("Error al eliminar la planificación.");
        }
    };

    const updateRowField = (id: string, field: keyof PlanningRow, val: any) => {
        setRows(prev => prev.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: val };
                if (field === 'date' && val) {
                    const dateObj = new Date(`${val}T12:00:00`);
                    updated.dayName = DAYS_ES[(dateObj.getDay() + 6) % 7];
                }
                return updated;
            }
            return r;
        }));
    };

    const addRow = () => {
        setRows(prev => {
            const nextIndex = prev.length;
            const dateObj = new Date(`${weekStartDate}T12:00:00`);
            dateObj.setDate(dateObj.getDate() + nextIndex);
            const dateStr = dateObj.toISOString().split('T')[0];

            return [
                ...prev,
                {
                    id: `row-new-${Date.now()}`,
                    date: dateStr,
                    dayName: DAYS_ES[(dateObj.getDay() + 6) % 7],
                    plc: 0,
                    sm: 0,
                    colNortePlanta: 0,
                    cenas: 0,
                    sobreCenas: 0,
                    concentrados: 0,
                    colNorteExt: 0,
                    colSurExt: 0
                }
            ];
        });
    };

    const removeRow = (id: string) => {
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (rows.length === 0) {
            toast.error("Por favor agrega al menos un día a la planificación.");
            return;
        }

        const invalidRows = rows.filter(r => !r.date);
        if (invalidRows.length > 0) {
            toast.error("Por favor completa las fechas de todos los días.");
            return;
        }

        setSaving(true);
        try {
            const sortedRows = [...rows].sort((a, b) => a.date.localeCompare(b.date));

            const payload = {
                title: title.trim() || 'Planificación Semanal',
                responsible: 'Admin',
                company: 'Planificación',
                cost_center: 'Planificación',
                status: 'Abierto',
                request_date: sortedRows[0].date ? new Date(sortedRows[0].date).toISOString() : new Date().toISOString(),
                status_date: new Date().toISOString(),
                details: sortedRows.map(row => {
                    const totalLunchPlanta = row.plc + row.sm + row.colNortePlanta;
                    const totalAttendees = totalLunchPlanta + row.concentrados + row.colNorteExt + row.colSurExt;
                    const obsMeta = `[DESGLOSE_PLANIFICACION: PLC=${row.plc}, SM=${row.sm}, CN_PLANTA=${row.colNortePlanta}, CENAS=${row.cenas}, SC=${row.sobreCenas}, CONC=${row.concentrados}, CN_EXT=${row.colNorteExt}, CS_EXT=${row.colSurExt}]`;

                    return {
                        service_date: new Date(row.date).toISOString(),
                        service_time: 'Planificación',
                        location: 'Planta Los Cortijos & Otras',
                        text_time: 'Planificación',
                        attendees: totalAttendees,
                        additional_requirements: '',
                        observations: obsMeta,
                        estimated_amount: 0,
                        selected_items: []
                    };
                })
            };

            if (editingEventId) {
                await inventoryApi.updateServiceEvent(editingEventId, payload);
                toast.success("Planificación semanal actualizada exitosamente.");
            } else {
                await inventoryApi.createServiceEvent(payload);
                toast.success("Planificación semanal guardada exitosamente.");
            }
            
            setPlanningViewMode('list');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Error al guardar la planificación semanal.");
        } finally {
            setSaving(false);
        }
    };

    const handleBackToList = () => {
        setPlanningViewMode('list');
        setEditingEventId(null);
        setRows([]);
        setTitle('');
        setSelectedFile(null);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-500">
                        <CalendarCheck size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Planificación Semanal de Comidas
                        </h1>
                        <p className="text-gray-500 text-xs font-medium">
                            {planningViewMode === 'list' 
                                ? 'Listado de planificaciones semanales cargadas e ingresadas en el sistema.' 
                                : 'Carga la imagen de la planificación para lectura OCR automatizada o ingresa los datos manualmente.'}
                        </p>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={planningViewMode === 'list' ? onClose : handleBackToList} 
                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all shadow-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                >
                    <ArrowLeft size={16} /> Volver
                </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* List Mode View */}
            {planningViewMode === 'list' && (
                <div className="space-y-6">
                    {/* Top Action Ribbon */}
                    <div className="flex justify-end gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-4 rounded-3xl shadow-sm">
                        <button
                            type="button"
                            onClick={() => {
                                setEditingEventId(null);
                                setWeekStartDate(getComingMonday());
                                setRows([]);
                                setPlanningViewMode('editor');
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#4CAF50] hover:bg-[#43a047] text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                        >
                            <Upload size={14} /> Subir Nueva Planificación
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingEventId(null);
                                setWeekStartDate(getComingMonday());
                                initializeBlankRows();
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:bg-gray-55 dark:hover:bg-gray-750 transition-all shadow-sm"
                        >
                            <Plus size={14} /> Carga Manual
                        </button>
                    </div>

                    {/* Saved Plannings List Grid */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-955/50 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-4">Semana / Título</th>
                                        <th className="px-6 py-4">Fecha Inicio</th>
                                        <th className="px-6 py-4 text-center">Días Planificados</th>
                                        <th className="px-6 py-4 text-center">Total Platos</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                    {loadingSaved ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-400">
                                                <Loader2 className="animate-spin inline-block mr-2" size={16} /> Cargando planificaciones...
                                            </td>
                                        </tr>
                                    ) : savedPlannings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-gray-200">
                                                    <CalendarCheck size={40} />
                                                </div>
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Sin planificaciones</h3>
                                                <p className="text-gray-400 text-sm font-medium mt-1">No hay planes semanales cargados en el sistema.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        savedPlannings.map(ev => {
                                            const detailsCount = ev.details?.length || 0;
                                            const totalPlates = ev.details?.reduce((acc: number, d: any) => acc + (d.attendees || 0), 0) || 0;
                                            const dateFormatted = ev.request_date 
                                                ? new Date(ev.request_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                                                : '-';
                                            
                                            return (
                                                <tr key={ev.id} className="hover:bg-gray-55/30 dark:hover:bg-gray-955/20 transition-all">
                                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                        {ev.title}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 font-medium">
                                                        {dateFormatted}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-700 dark:text-gray-300">
                                                        {detailsCount} días
                                                    </td>
                                                    <td className="px-6 py-4 text-center bg-primary/5 text-primary font-black text-sm">
                                                        {totalPlates} platos
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleEditPlanningEvent(ev)}
                                                                className="p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                                                                title="Editar planificación"
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePlanningEvent(ev.id)}
                                                                className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-gray-55 dark:hover:bg-gray-800 rounded-xl transition-all"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Mode View */}
            {planningViewMode === 'editor' && (
                <>
                    {/* Upload Area (Dropzone) */}
                    {rows.length === 0 && !ocrLoading && (
                        <div className="max-w-xl mx-auto mt-10 space-y-6">
                            
                            {/* General Setup card before uploading */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Configuración de la Semana</span>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-500">Fecha de Inicio (Lunes)</label>
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-850 rounded-2xl px-4 py-3">
                                        <Calendar size={16} className="text-gray-400" />
                                        <input 
                                            type="date"
                                            className="bg-transparent border-none outline-none font-medium text-sm text-gray-955 dark:text-white w-full"
                                            value={weekStartDate}
                                            onChange={e => setWeekStartDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div 
                                onClick={triggerFileSelect}
                                className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-gray-55/50 dark:hover:bg-gray-900/30 transition-all space-y-4"
                            >
                                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                    <Upload size={28} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Subir Imagen de Planificación</p>
                                    <p className="text-xs text-gray-400 mt-1">Sube la captura de la tabla para rellenar los datos de forma automática</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                            </div>

                            <div className="text-center">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">o</span>
                                <button
                                    type="button"
                                    onClick={initializeBlankRows}
                                    className="block mx-auto mt-4 px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl text-xs font-bold uppercase tracking-wider text-primary hover:bg-gray-55 transition-all shadow-sm"
                                >
                                    Ingresar Datos Manualmente
                                </button>
                            </div>
                        </div>
                    )}

                    {/* OCR Loading Overlay */}
                    {ocrLoading && (
                        <div className="max-w-md mx-auto mt-16 text-center space-y-6">
                            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                                <Loader2 className="animate-spin text-emerald-500 absolute" size={64} strokeWidth={1.5} />
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{ocrProgress}%</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{loadingText}</p>
                                <p className="text-xs text-gray-400 mt-1">Optimizando y extrayendo datos de la planificación</p>
                            </div>
                        </div>
                    )}

                    {/* Editable Form Grid */}
                    {rows.length > 0 && !ocrLoading && (
                        <form onSubmit={handleSave} className="space-y-6">
                            
                            {/* General Information */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                        Título de Planificación
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Planificación Semana del 20.07 al 23.07.2026"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-850 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-955 dark:text-white font-medium text-sm transition-all"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                        Fecha de Inicio (Lunes)
                                    </label>
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-2xl px-4 py-2.5">
                                        <Calendar size={16} className="text-gray-400" />
                                        <input 
                                            type="date"
                                            className="bg-transparent border-none outline-none font-medium text-sm text-gray-955 dark:text-white w-full"
                                            value={weekStartDate}
                                            onChange={e => setWeekStartDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Table Container */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 dark:bg-gray-955/50 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                                <th className="px-6 py-4">Fecha</th>
                                                <th className="px-3 py-4 text-center bg-blue-50/20 dark:bg-blue-955/10">PLC</th>
                                                <th className="px-3 py-4 text-center bg-blue-50/20 dark:bg-blue-955/10">SM</th>
                                                <th className="px-3 py-4 text-center bg-blue-50/20 dark:bg-blue-955/10">ColNorte</th>
                                                <th className="px-3 py-4 text-center bg-blue-50/30 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400">Total Cortijos</th>
                                                <th className="px-3 py-4 text-center bg-amber-50/20 dark:bg-amber-955/10">Cenas</th>
                                                <th className="px-3 py-4 text-center bg-amber-50/20 dark:bg-amber-955/10">Sobre Cenas</th>
                                                <th className="px-3 py-4 text-center bg-emerald-50/20 dark:bg-emerald-955/10">Concentrados</th>
                                                <th className="px-3 py-4 text-center bg-purple-50/20 dark:bg-purple-955/10">Col Norte (Ext)</th>
                                                <th className="px-3 py-4 text-center bg-orange-50/20 dark:bg-orange-955/10">ColSur</th>
                                                <th className="px-3 py-4 text-center text-primary bg-primary/5 font-bold">Total Platos</th>
                                                <th className="px-6 py-4">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                            {rows.map((row, idx) => {
                                                const totalCortijos = row.plc + row.sm + row.colNortePlanta;
                                                const totalPlatos = totalCortijos + row.concentrados + row.colNorteExt + row.colSurExt;
                                                
                                                return (
                                                    <tr key={row.id} className="hover:bg-gray-55/30 dark:hover:bg-gray-955/20 transition-all">
                                                        <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-16 text-xs font-bold uppercase text-gray-400 capitalize">{row.dayName}</span>
                                                                <input 
                                                                    type="date"
                                                                    className="px-2 py-1.5 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-xl outline-none text-xs font-medium text-gray-950 dark:text-white"
                                                                    value={row.date}
                                                                    onChange={e => updateRowField(row.id, 'date', e.target.value)}
                                                                />
                                                            </div>
                                                        </td>
                                                        {/* PLC */}
                                                        <td className="px-2 py-4 bg-blue-50/10 dark:bg-blue-955/5">
                                                            <input 
                                                                type="number"
                                                                className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-850 rounded-xl outline-none text-center font-bold text-sm text-gray-955 dark:text-white mx-auto block"
                                                                value={row.plc || ''}
                                                                onChange={e => updateRowField(row.id, 'plc', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                            />
                                                        </td>
                                                        {/* SM */}
                                                        <td className="px-2 py-4 bg-blue-50/10 dark:bg-blue-955/5">
                                                            <input 
                                                                type="number"
                                                                className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-xl outline-none text-center font-bold text-sm text-gray-955 dark:text-white mx-auto block"
                                                                value={row.sm || ''}
                                                                onChange={e => updateRowField(row.id, 'sm', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                            />
                                                        </td>
                                                        {/* ColNorte */}
                                                        <td className="px-2 py-4 bg-blue-50/10 dark:bg-blue-955/5">
                                                            <input 
                                                                type="number"
                                                                className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-xl outline-none text-center font-bold text-sm text-gray-955 dark:text-white mx-auto block"
                                                                value={row.colNortePlanta || ''}
                                                                onChange={e => updateRowField(row.id, 'colNortePlanta', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                            />
                                                        </td>
                                                        {/* Total Cortijos */}
                                                        <td className="px-2 py-4 text-center font-black text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-955/10">
                                                            {totalCortijos}
                                                        </td>
                                                        {/* Cenas */}
                                                        <td className="px-2 py-4 bg-amber-50/10 dark:bg-amber-955/5">
                                                            <input 
                                                                type="number"
                                                                className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-xl outline-none text-center font-bold text-sm text-gray-955 dark:text-white mx-auto block"
                                                                value={row.cenas || ''}
                                                                onChange={e => updateRowField(row.id, 'cenas', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                            />
                                                        </td>
                                                        {/* Sobre Cenas */}
                                                        <td className="px-2 py-4 bg-amber-50/10 dark:bg-amber-955/5">
                                                            <input 
                                                                type="number"
                                                                className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-xl outline-none text-center font-bold text-sm text-gray-955 dark:text-white mx-auto block"
                                                                value={row.sobreCenas || ''}
                                                                onChange={e => updateRowField(row.id, 'sobreCenas', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                            />
                                                        </td>
                                                        {/* Concentrados */}
                                                        <td className="px-2 py-4 bg-emerald-50/10 dark:bg-emerald-955/5">
                                                            <input 
                                                                type="number"
                                                                className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-xl outline-none text-center font-bold text-sm text-gray-955 dark:text-white mx-auto block"
                                                                value={row.concentrados || ''}
                                                                onChange={e => updateRowField(row.id, 'concentrados', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                            />
                                                        </td>
                                                        {/* Col Norte Ext */}
                                                        <td className="px-2 py-4 bg-purple-50/10 dark:bg-purple-955/5">
                                                            <input 
                                                                type="number"
                                                                className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-xl outline-none text-center font-bold text-sm text-gray-955 dark:text-white mx-auto block"
                                                                value={row.colNorteExt || ''}
                                                                onChange={e => updateRowField(row.id, 'colNorteExt', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                            />
                                                        </td>
                                                        {/* ColSur */}
                                                        <td className="px-2 py-4 bg-orange-50/10 dark:bg-orange-955/5">
                                                            <input 
                                                                type="number"
                                                                className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-955 border border-transparent dark:border-gray-855 rounded-xl outline-none text-center font-bold text-sm text-gray-955 dark:text-white mx-auto block"
                                                                value={row.colSurExt || ''}
                                                                onChange={e => updateRowField(row.id, 'colSurExt', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                            />
                                                        </td>
                                                        {/* Total Platos */}
                                                        <td className="px-2 py-4 text-center font-black text-primary bg-primary/5">
                                                            {totalPlatos}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRow(row.id)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-500 rounded-xl transition-colors hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                                                                title="Eliminar día"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-gray-50/30 dark:bg-gray-955/20 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={addRow}
                                        className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-55 transition-all shadow-sm"
                                    >
                                        <Plus size={16} /> Agregar Día
                                    </button>
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                        Total de la Semana: {rows.reduce((acc, row) => acc + row.plc + row.sm + row.colNortePlanta + row.concentrados + row.colNorteExt + row.colSurExt, 0)} platos
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleBackToList}
                                    className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-500 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border border-gray-150 dark:border-gray-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#43a047] text-white px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-green-500/10 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    {editingEventId ? 'Actualizar Planificación' : 'Guardar Planificación'}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );
}
