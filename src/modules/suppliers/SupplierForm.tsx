import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User, Phone, Mail, MapPin, Tag, CheckCircle2, CreditCard, FileCheck, FileText, Upload, Trash2, Plus, Loader2 } from 'lucide-react';
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Plus size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Empresa Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                            <Building2 size={18} className="text-primary" />
                            Información de la Empresa
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Nombre / Razón Social *
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej. Distribuidora S.A."
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                        RUC / Identificación Fiscal *
                                    </label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" size={18} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ej. 20123456789"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                            value={formData.ruc}
                                            onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                        Categoría
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Alimentos"
                                        className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Dirección
                                </label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Dirección completa"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contacto Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                            <User size={18} className="text-primary" />
                            Contacto
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Persona de Contacto
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre del representante"
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    value={formData.contact_person}
                                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Teléfono
                                </label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="+51..."
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Email
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        placeholder="correo@empresa.com"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información Financiera */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                            <CreditCard size={18} className="text-primary" />
                            Datos Bancarios y Crédito
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Banco
                                </label>
                                <select
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    value={formData.bank_name}
                                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                >
                                    <option value="">Seleccionar Banco...</option>
                                    {banks.map(b => (
                                        <option key={b.id} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Tipo de Cuenta
                                </label>
                                <select
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    value={formData.account_type}
                                    onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    {accountTypes.map(at => (
                                        <option key={at.id} value={at.value}>{at.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Número de Cuenta / CCI
                                </label>
                                <input
                                    type="text"
                                    placeholder="000-0000000-0-00"
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    value={formData.account_number}
                                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Días de Crédito
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                    value={formData.credit_days}
                                    onChange={e => setFormData({ ...formData, credit_days: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Límite de Crédito
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                        value={formData.credit_limit}
                                        onChange={e => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0.0 })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cumplimiento Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                <FileCheck size={18} className="text-primary" />
                                Gestión Documental (Cumplimiento)
                            </div>
                            <button
                                type="button"
                                onClick={addNewDocRow}
                                className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                            >
                                <Plus size={14} /> Añadir Documento
                            </button>
                        </div>

                        {/* Existing Docs */}
                        {existingDocs.length > 0 && (
                            <div className="grid grid-cols-1 gap-3">
                                {existingDocs.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{doc.name}</div>
                                                <div className="text-[10px] text-gray-500">{new Date(doc.timestamp).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a href={`${BACKEND_URL}${doc.file_path}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-primary transition-all">
                                                <Upload size={18} className="rotate-180" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDoc(doc.id)}
                                                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New Docs to be uploaded */}
                        {newDocs.map((doc, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-primary/5 rounded-2xl border border-dashed border-primary/20 animate-in fade-in zoom-in-95">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-primary uppercase ml-1">Nombre del Documento</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Ficha RUC, Certificado..."
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary dark:text-white text-sm"
                                        value={doc.name}
                                        onChange={(e) => {
                                            const updated = [...newDocs];
                                            updated[idx].name = e.target.value;
                                            setNewDocs(updated);
                                        }}
                                    />
                                </div>
                                <div className="space-y-2 min-w-0">
                                    <label className="text-[10px] font-bold text-primary uppercase ml-1">Archivo / Imagen</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1 min-w-0">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => {
                                                    const updated = [...newDocs];
                                                    updated[idx].file = e.target.files?.[0] || null;
                                                    setNewDocs(updated);
                                                }}
                                            />
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm text-gray-500 min-w-0">
                                                <Upload size={16} className="shrink-0" />
                                                <span className="truncate flex-1">{doc.file ? doc.file.name : 'Seleccionar archivo...'}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeNewDocRow(idx)}
                                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shrink-0"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {newDocs.length === 0 && existingDocs.length === 0 && (
                            <div className="py-8 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-2">
                                <FileText size={32} strokeWidth={1.5} />
                                <p className="text-xs font-medium">No hay documentos adjuntos todavía</p>
                            </div>
                        )}
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">Estado del Proveedor</div>
                                <div className="text-xs text-gray-500">El proveedor está activo para realizar compras</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                            className={`
                relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ring-2 ring-primary/20
                ${formData.is_active ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
              `}
                        >
                            <span
                                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                  ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}
                `}
                            />
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold shadow-lg shadow-green-900/20 shadow-green-900/10 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            <span>Guardar Proveedor</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
