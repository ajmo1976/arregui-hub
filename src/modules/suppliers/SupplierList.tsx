import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, User, Phone, Edit2, Trash2, CheckCircle2, XCircle, FileText, ExternalLink, CreditCard, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryApi, BACKEND_URL } from '../../services/api';
import { toast } from 'sonner';
import SupplierForm from './SupplierForm';
import SupplierDetail from './SupplierDetail';

export default function SupplierList() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<any>(null);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await inventoryApi.getProviders(searchQuery);
            setSuppliers(res.data);
        } catch (err) {
            toast.error('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSuppliers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleExport = async () => {
        try {
            toast.info("Generando reporte de proveedores...");
            await inventoryApi.exportProviders(searchQuery);
            toast.success("Reporte descargado exitosamente.");
        } catch (err) {
            console.error(err);
            toast.error("Error al exportar proveedores.");
        }
    };

    const handleDelete = async (id: number) => {
        toast.promise(inventoryApi.deleteProvider(id), {
            loading: 'Eliminando...',
            success: () => {
                fetchSuppliers();
                return 'Proveedor eliminado';
            },
            error: (err) => err.response?.data?.detail || 'No se pudo eliminar el proveedor'
        });
    };

    const handleToggle = async (id: number) => {
        try {
            await inventoryApi.toggleProvider(id);
            fetchSuppliers();
        } catch (err) {
            toast.error('Error al cambiar el estado');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Gestión de Proveedores</h1>
                    <p className="text-gray-500 dark:text-gray-400">Administración de proveedores, contactos y estado de compras.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => { setSelectedSupplier(null); setIsFormOpen(true); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Nuevo Proveedor
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RUC o categoría..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <Filter size={18} />
                    Filtros
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase">Proveedor</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase text-center">Contacto</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase text-center">Categoría</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase text-center">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-12 text-center text-gray-400">Cargando...</td>
                                    </tr>
                                ))
                            ) : suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic">No se encontraron proveedores</td>
                                </tr>
                            ) : suppliers.map((s) => (
                                <motion.tr
                                    layout
                                    key={s.id}
                                    className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all duration-300"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedSupplierForDetail(s)}>{s.name}</span>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {s.ruc && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-700/50 text-[10px] font-bold text-gray-500 rounded-md w-fit border border-gray-200/50 dark:border-gray-600">
                                                        <Building size={10} />
                                                        {s.ruc}
                                                    </div>
                                                )}
                                                {s.documents && s.documents.map((doc: any) => (
                                                    <a
                                                        key={doc.id}
                                                        href={`${BACKEND_URL}${doc.file_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-[10px] font-bold text-green-600 rounded-md hover:bg-green-100 transition-colors border border-green-100 dark:border-green-800"
                                                    >
                                                        <FileText size={10} />
                                                        {doc.name}
                                                        <ExternalLink size={8} />
                                                    </a>
                                                ))}
                                            </div>
                                            {(s.bank_name || s.credit_days > 0) && (
                                                <div className="flex items-center gap-3 mt-1 px-2 py-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 w-fit">
                                                    {s.bank_name && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                                            <CreditCard size={10} className="text-primary/50" />
                                                            {s.bank_name}
                                                        </div>
                                                    )}
                                                    {s.credit_days > 0 && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                                            <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            Cred. {s.credit_days} días
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col gap-1 items-center justify-center">
                                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                                <User size={12} className="text-gray-400" />
                                                <span>{s.contact_person || 'N/A'}</span>
                                            </div>
                                            {s.phone && (
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                    <Phone size={11} className="text-gray-400" />
                                                    <span>{s.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full uppercase border border-blue-100 dark:border-blue-800">
                                            {s.category || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <button
                                            onClick={() => handleToggle(s.id)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${s.is_active
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800'
                                                }`}
                                        >
                                            {s.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                            {s.is_active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setSelectedSupplierForDetail(s)}
                                                className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                title="Ver Detalle"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedSupplier(s); setIsFormOpen(true); }}
                                                className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isFormOpen && (
                    <SupplierForm
                        supplier={selectedSupplier}
                        onClose={() => setIsFormOpen(false)}
                        onSuccess={() => { setIsFormOpen(false); fetchSuppliers(); }}
                    />
                )}
                {selectedSupplierForDetail && (
                    <SupplierDetail
                        supplier={selectedSupplierForDetail}
                        onClose={() => setSelectedSupplierForDetail(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function Building({ size, className }: { size: number, className?: string }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>;
}
