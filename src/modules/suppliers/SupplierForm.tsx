import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User, Phone, Mail, MapPin, CheckCircle2, CreditCard, FileCheck, FileText, Upload, Trash2, Plus, Loader2 } from 'lucide-react';
import { inventoryApi, BACKEND_URL } from '../../services/api';
import { toast } from 'sonner';

interface SupplierFormProps {
    supplier?: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SupplierForm({ supplier, onClose, onSuccess }: SupplierFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        ruc: '',
        category: '',
        address: '',
        contact_person: '',
        phone: '',
        email: '',
        bank_name: '',
        account_number: '',
        account_type: '',
        credit_days: 0,
        credit_limit: 0,
        is_active: true
    });
    const [existingDocs, setExistingDocs] = useState<any[]>([]);
    const [newDocs, setNewDocs] = useState<{ name: string, file: File | null }[]>([]);
    const [accountTypes, setAccountTypes] = useState<any[]>([]);
    const [banks, setBanks] = useState<any[]>([]);

    useEffect(() => {
        const fetchParams = async () => {
            try {
                const [accRes, bankRes] = await Promise.all([
                    inventoryApi.getParameters('account_type'),
                    inventoryApi.getParameters('bank')
                ]);
                setAccountTypes(accRes.data.filter((p: any) => p.is_active));
                setBanks(bankRes.data.filter((p: any) => p.is_active));
            } catch (err) {
                console.error(err);
            }
        };
        fetchParams();

        if (supplier) {
            setFormData({
                name: supplier.name || '',
                ruc: supplier.ruc || '',
                category: supplier.category || '',
                address: supplier.address || '',
                contact_person: supplier.contact_person || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                bank_name: supplier.bank_name || '',
                account_number: supplier.account_number || '',
                account_type: supplier.account_type || '',
                credit_days: supplier.credit_days || 0,
                credit_limit: supplier.credit_limit || 0,
                is_active: supplier.is_active ?? true
            });
            setExistingDocs(supplier.documents || []);
        }
    }, [supplier]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let providerId = supplier?.id;
            if (supplier) {
                await inventoryApi.updateProvider(supplier.id, formData);
            } else {
                const res = await inventoryApi.createProvider(formData);
                providerId = res.data.id;
            }

            // Upload new documents if any
            for (const doc of newDocs) {
                if (doc.file && doc.name) {
                    const fd = new FormData();
                    fd.append('name', doc.name);
                    fd.append('file', doc.file);
                    await inventoryApi.uploadProviderDocument(providerId, fd);
                }
            }

            toast.success(supplier ? 'Proveedor actualizado' : 'Proveedor registrado');
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al guardar proveedor');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDoc = async (docId: number) => {
        try {
            await inventoryApi.deleteProviderDocument(docId);
            setExistingDocs(existingDocs.filter(d => d.id !== docId));
            toast.success('Documento eliminado');
        } catch (err) {
            toast.error('Error al eliminar documento');
        }
    };

    const addNewDocRow = () => setNewDocs([...newDocs, { name: '', file: null }]);
    const removeNewDocRow = (index: number) => setNewDocs(newDocs.filter((_, i) => i !== index));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-6xl max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden my-auto flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Plus size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </h2>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">Complete la información del proveedor</p>
                        </div>
                    </div>
                    <button onClick={onClose} type="button" className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 overflow-y-auto custom-scrollbar">
                        
                        {/* Columna Izquierda */}
                        <div className="space-y-8">
                            {/* Empresa Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <Building2 size={18} className="text-blue-500" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Información de la Empresa</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Nombre / Razón Social *</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ej. Distribuidora S.A."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">RUC / ID Fiscal *</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Ej. 20123456789"
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                                    value={formData.ruc}
                                                    onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Categoría</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Alimentos"
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Dirección</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-3.5 text-gray-400" size={16} />
                                            <textarea
                                                placeholder="Dirección completa"
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium resize-none h-[52px]"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contacto Section */}
                            <div className="space-y-6 pt-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                        <User size={18} className="text-indigo-500" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Contacto</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Persona de Contacto</label>
                                        <input
                                            type="text"
                                            placeholder="Nombre del representante"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                            value={formData.contact_person}
                                            onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Teléfono</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="+51..."
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="email"
                                                    placeholder="correo@empresa.com"
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha */}
                        <div className="space-y-8">
                            {/* Información Financiera */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                        <CreditCard size={18} className="text-green-500" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Datos Bancarios y Crédito</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Banco</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium appearance-none"
                                            value={formData.bank_name}
                                            onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                        >
                                            <option value="">Seleccionar Banco...</option>
                                            {banks.map(b => (
                                                <option key={b.id} value={b.name}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Tipo de Cuenta</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium appearance-none"
                                            value={formData.account_type}
                                            onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {accountTypes.map(at => (
                                                <option key={at.id} value={at.value}>{at.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Número de Cuenta / CCI</label>
                                        <input
                                            type="text"
                                            placeholder="000-0000000-0-00"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                            value={formData.account_number}
                                            onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Días de Crédito</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                            value={formData.credit_days}
                                            onChange={e => setFormData({ ...formData, credit_days: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">Límite de Crédito</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm font-medium"
                                                value={formData.credit_limit}
                                                onChange={e => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0.0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cumplimiento Section */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                            <FileCheck size={18} className="text-orange-500" strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Documentos</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addNewDocRow}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all text-xs font-bold"
                                    >
                                        <Plus size={14} /> Añadir
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                    {/* Existing Docs */}
                                    {existingDocs.length > 0 && existingDocs.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-primary shrink-0 shadow-sm">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{doc.name}</div>
                                                    <div className="text-[10px] text-gray-500">{new Date(doc.timestamp).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                <a href={`${BACKEND_URL}${doc.file_path}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-primary transition-all">
                                                    <Upload size={16} className="rotate-180" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDoc(doc.id)}
                                                    className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* New Docs to be uploaded */}
                                    {newDocs.map((doc, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-dashed border-primary/20">
                                            <input
                                                type="text"
                                                placeholder="Nombre (ej. RUC)"
                                                className="w-1/3 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-primary dark:text-white text-xs font-medium"
                                                value={doc.name}
                                                onChange={(e) => {
                                                    const updated = [...newDocs];
                                                    updated[idx].name = e.target.value;
                                                    setNewDocs(updated);
                                                }}
                                            />
                                            <div className="relative flex-1 min-w-0">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                                                    onChange={(e) => {
                                                        const updated = [...newDocs];
                                                        updated[idx].file = e.target.files?.[0] || null;
                                                        setNewDocs(updated);
                                                    }}
                                                />
                                                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-500 w-full overflow-hidden">
                                                    <Upload size={14} className="shrink-0" />
                                                    <span className="truncate">{doc.file ? doc.file.name : 'Archivo...'}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeNewDocRow(idx)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all shrink-0"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    {newDocs.length === 0 && existingDocs.length === 0 && (
                                        <div className="py-6 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <FileText size={24} strokeWidth={1.5} className="opacity-50" />
                                            <p className="text-[11px] font-medium">Sin documentos adjuntos</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Toggle */}
                            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl mt-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        {formData.is_active ? <CheckCircle2 size={20} /> : <X size={20} />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Estado de Cuenta</div>
                                        <div className="text-xs font-medium text-gray-500">{formData.is_active ? 'Proveedor habilitado' : 'Proveedor deshabilitado'}</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-5 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{supplier ? 'Actualizar' : 'Guardar'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
