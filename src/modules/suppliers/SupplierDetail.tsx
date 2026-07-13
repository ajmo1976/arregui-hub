import React, { useState, useEffect } from 'react';
import { X, Calendar, Receipt, CreditCard, TrendingUp, AlertCircle, CheckCircle2, FileText, Wallet, ArrowUpRight, Eye, Plus, Loader2, Image, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { inventoryApi, BACKEND_URL } from '../../services/api';
import { toast } from 'sonner';
import { useCurrency } from '../../contexts/CurrencyContext';

interface SupplierDetailProps {
    supplier: any;
    onClose: () => void;
}

export default function SupplierDetail({ supplier, onClose }: SupplierDetailProps) {
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'history' | 'docs' | 'info'>('history');
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [isPaying, setIsPaying] = useState(false);
    const [payLoading, setPayLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [banks, setBanks] = useState<any[]>([]);

    const [paymentForm, setPaymentForm] = useState({
        amount: 0,
        payment_method: 'Transferencia',
        bank_name: '',
        reference_number: '',
        payment_date: new Date().toISOString().split('T')[0],
        observations: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [isConverting, setIsConverting] = useState(false);
    const [conversionForm, setConversionForm] = useState({
        invoice_number: '',
        control_number: '',
        invoice_date: new Date().toISOString().split('T')[0]
    });
    const [conversionLoading, setConversionLoading] = useState(false);

    const refreshStats = async () => {
        try {
            const res = await inventoryApi.getProviderStats(supplier.id);
            setStats(res.data);
            if (selectedPurchase) {
                const p = res.data.purchases.find((p: any) => p.id === selectedPurchase.id);
                if (p) setSelectedPurchase(p);
            }
        } catch (err) {
            toast.error('Error al actualizar datos');
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await inventoryApi.getProviderStats(supplier.id);
                setStats(res.data);
            } catch (err) {
                toast.error('Error al cargar estadísticas del proveedor');
            } finally {
                setLoading(false);
            }
        };
        const fetchParams = async () => {
            try {
                const [pmRes, bankRes] = await Promise.all([
                    inventoryApi.getParameters('payment_method'),
                    inventoryApi.getParameters('bank')
                ]);
                setPaymentMethods(pmRes.data.filter((p: any) => p.is_active));
                setBanks(bankRes.data.filter((p: any) => p.is_active));
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
        fetchParams();
    }, [supplier.id]);


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pagado': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
            case 'Parcial': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
            default: return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (paymentForm.amount <= 0) {
            toast.error('El monto debe ser mayor a cero');
            return;
        }
        setPayLoading(true);

        try {
            const formData = new FormData();
            formData.append('amount', paymentForm.amount.toString());
            formData.append('payment_method', paymentForm.payment_method);
            formData.append('bank_name', paymentForm.bank_name || '');
            formData.append('reference_number', paymentForm.reference_number || '');
            formData.append('payment_date', paymentForm.payment_date);
            formData.append('observations', paymentForm.observations || '');
            if (selectedFile) {
                formData.append('proof_image', selectedFile);
            }

            await inventoryApi.recordPayment(selectedPurchase.id, formData);
            toast.success('Pago registrado correctamente');
            setIsPaying(false);
            setSelectedFile(null);
            setPreviewUrl(null);
            await refreshStats();
            setPaymentForm({
                amount: 0,
                payment_method: 'Transferencia',
                bank_name: '',
                reference_number: '',
                payment_date: new Date().toISOString().split('T')[0],
                observations: ''
            });
        } catch (err) {
            toast.error('Error al registrar pago');
        } finally {
            setPayLoading(false);
        }
    };

    const handleConvertToInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setConversionLoading(true);
        try {
            await inventoryApi.updatePurchase(selectedPurchase.id, {
                ...conversionForm,
                document_type: 'Factura'
            });
            toast.success('Convertido a Factura exitosamente');
            setIsConverting(false);
            await refreshStats();
        } catch (err) {
            toast.error('Error al convertir documento');
        } finally {
            setConversionLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-end">
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white dark:bg-gray-800 w-full max-w-2xl h-full shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            {selectedPurchase ? <Receipt size={28} /> : <ArrowUpRight size={28} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                {selectedPurchase ? `Factura: ${selectedPurchase.invoice_number}` : supplier.name}
                            </h2>
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                                {selectedPurchase ? new Date(selectedPurchase.invoice_date).toLocaleDateString() : supplier.ruc}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedPurchase && (
                            <button
                                onClick={() => { setSelectedPurchase(null); setIsPaying(false); setIsConverting(false); }}
                                className="px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition-all"
                            >
                                Volver al Historial
                            </button>
                        )}
                        <button onClick={onClose} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all">
                            <X size={24} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="font-medium">Calculando saldos y reportes...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                        {!selectedPurchase && (
                            <>
                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-2">
                                        <div className="text-xs font-bold text-primary uppercase tracking-wider">Total Comprado</div>
                                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                                            {formatPrice(stats?.total_purchased || 0)}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <TrendingUp size={10} /> Facturación histórica
                                        </div>
                                    </div>
                                    <div className={`p-6 rounded-3xl border space-y-2 ${(stats?.total_due || 0) > 0 ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800' : 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800'}`}>
                                        <div className={`text-xs font-bold uppercase tracking-wider ${(stats?.total_due || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>Saldo Pendiente</div>
                                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                                            {formatPrice(stats?.total_due || 0)}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <Wallet size={10} /> Cuentas por pagar
                                        </div>
                                    </div>
                                </div>

                                {/* Credit Bar */}
                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">Crédito Utilizado</span>
                                        <span className="font-black text-gray-900 dark:text-white">
                                            {formatPrice(stats?.total_due || 0)} <span className="text-xs font-normal text-gray-400"> / {formatPrice(supplier.credit_limit || 0)}</span>
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${((stats?.total_due || 0) / (supplier.credit_limit || 1)) > 0.8 ? 'bg-red-500' : 'bg-primary'}`}
                                            style={{ width: `${Math.min(((stats?.total_due || 0) / (supplier.credit_limit || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                        <CreditCard size={12} /> Límite de crédito: {formatPrice(supplier.credit_limit || 0)} | Plazo: {supplier.credit_days} días
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl">
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Compras
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('docs')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'docs' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Documentos
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('info')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'info' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Perfil
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Content Area */}
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {selectedPurchase ? (
                                <div className="space-y-6">
                                    {isPaying ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-primary/20 shadow-xl space-y-6"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Wallet size={20} className="text-primary" /> Registrar Pago
                                                </h4>
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                    Saldo: {formatPrice(selectedPurchase.total_amount - (selectedPurchase.amount_paid || 0))}
                                                </div>
                                            </div>

                                            <form onSubmit={handleRecordPayment} className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Monto a Pagar</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                                                        <input
                                                            type="number" step="0.01" required
                                                            className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-gray-900 dark:text-white"
                                                            value={paymentForm.amount}
                                                            onChange={e => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha de Pago</label>
                                                    <input
                                                        type="date" required
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none"
                                                        value={paymentForm.payment_date}
                                                        onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Método</label>
                                                    <select
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none"
                                                        value={paymentForm.payment_method}
                                                        onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                                    >
                                                        {paymentMethods.map(pm => (
                                                            <option key={pm.id} value={pm.value}>{pm.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Banco</label>
                                                    <select
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none"
                                                        value={paymentForm.bank_name}
                                                        onChange={e => setPaymentForm({ ...paymentForm, bank_name: e.target.value })}
                                                    >
                                                        <option value="">Seleccionar Banco...</option>
                                                        {banks.map(b => (
                                                            <option key={b.id} value={b.name}>{b.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Referencia</label>
                                                    <input
                                                        placeholder="N° Transacción"
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none"
                                                        value={paymentForm.reference_number}
                                                        onChange={e => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Comprobante (Imagen)</label>
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            onClick={() => document.getElementById('payment-file')?.click()}
                                                            className="flex-1 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all gap-2"
                                                        >
                                                            {previewUrl ? (
                                                                <img src={previewUrl} alt="Preview" className="h-20 w-32 object-cover rounded-lg shadow-sm" />
                                                            ) : (
                                                                <>
                                                                    <Upload className="text-gray-400" size={24} />
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Adjuntar Comprobante</span>
                                                                </>
                                                            )}
                                                            <input
                                                                id="payment-file"
                                                                type="file" accept="image/*" className="hidden"
                                                                onChange={handleFileChange}
                                                            />
                                                        </div>
                                                        {previewUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <X size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-span-2 flex gap-3 mt-2">
                                                    <button
                                                        type="button" onClick={() => setIsPaying(false)}
                                                        className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="submit" disabled={payLoading}
                                                        className="flex-[2] py-3 bg-primary text-white text-sm font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                                    >
                                                        {payLoading && <Loader2 className="animate-spin" size={16} />}
                                                        Confirmar Pago
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Pagado</div>
                                                        <div className="text-xl font-black text-green-600">{formatPrice(selectedPurchase.amount_paid || 0)}</div>
                                                    </div>
                                                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Por Pagar</div>
                                                        <div className="text-xl font-black text-red-600">{formatPrice(selectedPurchase.total_amount - (selectedPurchase.amount_paid || 0))}</div>
                                                    </div>
                                                </div>
                                                {selectedPurchase.payment_status !== 'Pagado' && (
                                                    <button
                                                        onClick={() => setIsPaying(true)}
                                                        className="p-4 bg-primary text-white rounded-3xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex flex-col items-center gap-1 group"
                                                    >
                                                        <Plus size={24} />
                                                        <span className="text-[10px] font-black uppercase">Abonar</span>
                                                    </button>
                                                )}
                                            </div>

                                            {selectedPurchase.document_type === 'Nota de Entrega' && (
                                                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-xl">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-blue-900 dark:text-blue-300">Nota de Entrega Pendiente</div>
                                                            <div className="text-[10px] text-blue-500 uppercase font-medium tracking-wider">Formalizar factura para completar el ciclo</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setConversionForm({
                                                                invoice_number: selectedPurchase.invoice_number,
                                                                control_number: selectedPurchase.control_number || '',
                                                                invoice_date: new Date().toISOString().split('T')[0]
                                                            });
                                                            setIsConverting(true);
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
                                                    >
                                                        Convertir a Factura
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isConverting && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-blue-500/30 shadow-xl space-y-6"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase text-xs tracking-widest">
                                                    <FileText size={18} className="text-blue-500" /> Formalizar Factura
                                                </h4>
                                                <button onClick={() => setIsConverting(false)} className="text-gray-400 hover:text-gray-600">
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            <form onSubmit={handleConvertToInvoice} className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">N° Factura Real</label>
                                                    <input
                                                        required
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white"
                                                        value={conversionForm.invoice_number}
                                                        onChange={e => setConversionForm({ ...conversionForm, invoice_number: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">N° Control</label>
                                                    <input
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white"
                                                        value={conversionForm.control_number}
                                                        onChange={e => setConversionForm({ ...conversionForm, control_number: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1.5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha de Facturación</label>
                                                    <input
                                                        type="date" required
                                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white"
                                                        value={conversionForm.invoice_date}
                                                        onChange={e => setConversionForm({ ...conversionForm, invoice_date: e.target.value })}
                                                    />
                                                </div>
                                                <button
                                                    type="submit" disabled={conversionLoading}
                                                    className="col-span-2 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[3px] rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-2"
                                                >
                                                    {conversionLoading && <Loader2 className="animate-spin" size={16} />}
                                                    Guardar Factura Legal
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Detalle de Productos</h4>
                                            <div className="text-xs text-gray-500">N° Control: {selectedPurchase.control_number || 'N/A'}</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                                        <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Producto</th>
                                                        <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-center">Cant.</th>
                                                        <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-right">Costo</th>
                                                        <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-right">Total (+IVA)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {selectedPurchase.items?.map((item: any) => (
                                                        <tr key={item.id} className="hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-gray-900 dark:text-white uppercase text-xs">{item.product_name}</div>
                                                                <div className="text-[10px] text-gray-400">
                                                                    {item.lot_number ? `Lote: ${item.lot_number}` : 'Sin Lote'}
                                                                    {item.expiration_date ? ` | Venc: ${new Date(item.expiration_date).toLocaleDateString()}` : ''}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-black text-lg">
                                                                    {item.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">{formatPrice(item.cost_at_time)}</td>
                                                            <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                                                                {formatPrice(item.quantity * item.cost_at_time * (1 + (item.tax_percentage / 100)))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Payment History for this Invoice */}
                                    {selectedPurchase.payments?.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Historial de Pagos</h4>
                                            <div className="space-y-3">
                                                {selectedPurchase.payments.map((pay: any) => (
                                                    <div key={pay.id} className="p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/50 rounded-2xl flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-green-100 dark:bg-green-900 text-green-600 rounded-xl">
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-green-900 dark:text-green-300">
                                                                    {pay.payment_method}
                                                                    {pay.bank_name && <span className="text-gray-400 font-normal"> • {pay.bank_name}</span>}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 uppercase font-medium">{new Date(pay.payment_date).toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {pay.proof_image_url && (
                                                                <a
                                                                    href={`${BACKEND_URL}${pay.proof_image_url}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-2 bg-white dark:bg-gray-800 border border-green-100 dark:border-green-800 rounded-xl text-green-600 hover:scale-110 transition-all shadow-sm"
                                                                    title="Ver Comprobante"
                                                                >
                                                                    <Image size={16} />
                                                                </a>
                                                            )}
                                                            <div className="text-right">
                                                                <div className="font-black text-green-700 dark:text-green-400">{formatPrice(pay.amount)}</div>
                                                                {pay.reference_number && <div className="text-[10px] text-gray-400 font-mono">Ref: {pay.reference_number}</div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : activeTab === 'history' ? (
                                <div className="space-y-4">
                                    {stats?.purchases?.length > 0 ? (
                                        stats.purchases.map((p: any) => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPurchase(p)}
                                                className="w-full text-left p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-3xl hover:border-primary/50 hover:shadow-lg transition-all flex items-center justify-between group active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-400 group-hover:text-primary transition-colors">
                                                        <Receipt size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">
                                                            {p.document_type}: {p.invoice_number}
                                                        </div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                                            <Calendar size={12} /> {new Date(p.invoice_date).toLocaleDateString()}
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${p.document_type === 'Factura' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'}`}>
                                                                {p.document_type}
                                                            </span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <Eye size={12} className="text-primary/40" /> Ver detalle
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <div className="font-black text-gray-900 dark:text-white">{formatPrice(p.total_amount)}</div>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(p.payment_status)}`}>
                                                        {p.payment_status}
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl">
                                            <AlertCircle size={32} strokeWidth={1.5} />
                                            <p className="text-sm font-medium">No hay historial de compras registrado</p>
                                        </div>
                                    )}
                                </div>
                            ) : activeTab === 'docs' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {supplier.documents?.length > 0 ? (
                                        supplier.documents.map((d: any) => (
                                            <a
                                                key={d.id}
                                                href={`${BACKEND_URL}${d.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-3xl hover:border-primary transition-all flex flex-col items-center justify-center gap-3 group text-center"
                                            >
                                                <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl text-gray-400 group-hover:text-primary transition-all shadow-sm">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{d.name}</div>
                                                    <div className="text-[10px] text-gray-400">Ver documento</div>
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <div className="col-span-2 py-12 flex flex-col items-center justify-center text-gray-400 gap-3 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl">
                                            <FileText size={32} strokeWidth={1.5} />
                                            <p className="text-sm font-medium">Sin documentación adjunta</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <InfoItem label="Banco" value={supplier.bank_name || 'No definido'} icon={<CreditCard size={14} />} />
                                        <InfoItem label="Tipo Cuenta" value={supplier.account_type || 'No definido'} icon={<Wallet size={14} />} />
                                        <div className="col-span-2">
                                            <InfoItem label="Número de Cuenta / CCI" value={supplier.account_number || 'No definido'} icon={<Receipt size={14} />} />
                                        </div>
                                        <InfoItem label="Persona de Contacto" value={supplier.contact_person || 'N/A'} icon={<X size={0} className="hidden" />} />
                                        <InfoItem label="Teléfono" value={supplier.phone || 'N/A'} icon={<X size={0} className="hidden" />} />
                                    </div>
                                    <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">Estado Operativo</div>
                                            <div className="text-xs text-gray-500">{supplier.is_active ? 'Activo para compras y facturación' : 'Inactivo temporalmente'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function InfoItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                {icon} {label}
            </label>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl font-bold text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700">
                {value}
            </div>
        </div>
    );
}
