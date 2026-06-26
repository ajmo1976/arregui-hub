import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Users,
    UtensilsCrossed,
    ClipboardList,
    Trash2,
    Search,
    CheckCircle2,
    Minus,
    Check,
    Plus,
    Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import api, { inventoryApi } from '../../services/api';
import { useCurrency } from '../../contexts/CurrencyContext';

interface ServiceDetailCardProps {
    index: number;
    data: any;
    onChange: (data: any) => void;
    onDelete: () => void;
}

export default function ServiceDetailCard({ index, data, onChange, onDelete }: ServiceDetailCardProps) {
    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const { formatPrice, canShowPrices } = useCurrency();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemRes, catRes] = await Promise.all([
                    inventoryApi.getCateringItems(),
                    inventoryApi.getCateringCategories()
                ]);
                const fetchedProducts = itemRes.data || [];
                setProducts(fetchedProducts);
                setCategories(catRes.data || []);

                // Auto-inject the service cost item if not present in selected_items
                const serviceCostItem = fetchedProducts.find((p: any) => p.sku === 'SERV-001' || p.name?.trim() === 'Servicio');
                if (serviceCostItem) {
                    const currentItems = data.selected_items || [];
                    const hasServiceCost = currentItems.some((item: any) => item.sku === 'SERV-001' || item.name?.trim() === 'Servicio' || item.id === serviceCostItem.id);
                    if (!hasServiceCost) {
                        const newItem = {
                            id: serviceCostItem.id,
                            name: serviceCostItem.name,
                            sku: serviceCostItem.sku,
                            price: serviceCostItem.price,
                            quantity: 1,
                            unit: 'Unidad',
                            is_sold_by_case: serviceCostItem.is_sold_by_case,
                            units_per_case: serviceCostItem.units_per_case || 1
                        };
                        const updatedItems = [...currentItems, newItem];
                        
                        // Recalculate immediately with fetchedProducts
                        const itemsTotal = updatedItems.reduce((acc: number, item: any) => {
                            const catalogItem = fetchedProducts.find((p: any) => String(p.id) === String(item.id));
                            const price = item.price || 0;
                            const isItemService = item.sku === 'SERV-001' || item.name?.trim() === 'Servicio' || (catalogItem && (catalogItem.sku === 'SERV-001' || catalogItem.name?.trim() === 'Servicio'));
                            const quantity = isItemService ? 1 : (item.quantity || 1);
                            const byCase = catalogItem ? catalogItem.is_sold_by_case : item.is_sold_by_case;
                            const units = catalogItem ? catalogItem.units_per_case : (item.units_per_case || 1);
                            const multiplier = (item.unit === 'Caja' && byCase) ? units : 1;
                            return acc + (price * quantity * multiplier);
                        }, 0);

                        onChange({
                            ...data,
                            selected_items: updatedItems,
                            estimated_amount: parseFloat(itemsTotal.toFixed(2))
                        });
                    }
                }
            } catch (err) {
                console.error("Error loading catering menu data", err);
            }
        };
        fetchData();
    }, []);

    const toggleItem = (product: any) => {
        const isServiceCost = product.sku === 'SERV-001' || product.name?.trim() === 'Servicio';
        if (isServiceCost) return; // Cannot toggle service cost manually

        const currentItems = data.selected_items || [];
        const exists = currentItems.find((p: any) => p.id === product.id);

        let newItems;
        if (exists) {
            newItems = currentItems.filter((p: any) => p.id !== product.id);
        } else {
            newItems = [...currentItems, {
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                quantity: data.attendees || 1,
                unit: product.is_sold_by_case ? 'Caja' : 'Unidad',
                is_sold_by_case: product.is_sold_by_case,
                units_per_case: product.units_per_case || 1
            }];
        }

        recalculateTotal(newItems, data.attendees);
    };

    const updateItemQuantity = (productId: number, quantity: number) => {
        const catalogItem = products.find(p => String(p.id) === String(productId));
        if (catalogItem?.sku === 'SERV-001' || catalogItem?.name?.trim() === 'Servicio') return; // Fixed at 1

        const newItems = (data.selected_items || []).map((item: any) =>
            String(item.id) === String(productId) ? {
                ...item,
                quantity: Math.max(1, quantity),
                is_sold_by_case: catalogItem?.is_sold_by_case ?? item.is_sold_by_case,
                units_per_case: catalogItem?.units_per_case ?? item.units_per_case
            } : item
        );
        recalculateTotal(newItems, data.attendees);
    };

    const updateItemUnit = (productId: number, unit: string) => {
        const catalogItem = products.find(p => String(p.id) === String(productId));
        if (catalogItem?.sku === 'SERV-001' || catalogItem?.name?.trim() === 'Servicio') return; // Fixed to Unidad

        const newItems = (data.selected_items || []).map((item: any) =>
            String(item.id) === String(productId) ? {
                ...item,
                unit,
                is_sold_by_case: catalogItem?.is_sold_by_case ?? item.is_sold_by_case,
                units_per_case: catalogItem?.units_per_case ?? item.units_per_case
            } : item
        );
        recalculateTotal(newItems, data.attendees);
    };

    const recalculateTotal = (items: any[], attendees: number) => {
        const itemsTotal = items.reduce((acc: number, item: any) => {
            const catalogItem = products.find(p => String(p.id) === String(item.id));
            const price = item.price || 0;
            const isItemService = item.sku === 'SERV-001' || item.name?.trim() === 'Servicio' || (catalogItem && (catalogItem.sku === 'SERV-001' || catalogItem.name?.trim() === 'Servicio'));
            const quantity = isItemService ? 1 : (item.quantity || 1);

            // Prioritize catalog config or item backup
            const byCase = catalogItem ? catalogItem.is_sold_by_case : item.is_sold_by_case;
            const units = catalogItem ? catalogItem.units_per_case : (item.units_per_case || 1);

            const multiplier = (item.unit === 'Caja' && byCase) ? units : 1;

            return acc + (price * quantity * multiplier);
        }, 0);

        const mappedItems = items.map((item: any) => {
            const catalogItem = products.find(p => String(p.id) === String(item.id));
            const isItemService = item.sku === 'SERV-001' || item.name?.trim() === 'Servicio' || (catalogItem && (catalogItem.sku === 'SERV-001' || catalogItem.name?.trim() === 'Servicio'));
            if (isItemService && item.quantity !== 1) {
                return { ...item, quantity: 1 };
            }
            return item;
        });

        onChange({
            ...data,
            selected_items: mappedItems,
            attendees: attendees,
            estimated_amount: parseFloat(itemsTotal.toFixed(2))
        });
    };

    const handleAttendeesChange = (val: string) => {
        const attendees = parseInt(val) || 0;
        const prevAttendees = data.attendees || 0;

        // Si la cantidad del item es 1 o era igual al número previo de asistentes, 
        // lo sincronizamos con el nuevo número.
        const newItems = (data.selected_items || []).map((item: any) => {
            const catalogItem = products.find(p => String(p.id) === String(item.id));
            const isItemService = item.sku === 'SERV-001' || item.name?.trim() === 'Servicio' || (catalogItem && (catalogItem.sku === 'SERV-001' || catalogItem.name?.trim() === 'Servicio'));
            if (isItemService) {
                return { ...item, quantity: 1 };
            }
            return {
                ...item,
                quantity: (item.quantity === prevAttendees || item.quantity === 1) ? attendees : item.quantity
            };
        });

        recalculateTotal(newItems, attendees);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === '' || p.category_id?.toString() === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
        >
            <div className="p-6 space-y-8">
                {/* Header with ID and Delete */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs font-black text-gray-400">
                            #{index + 1}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Detalles del Servicio</h3>
                    </div>
                    <button
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar Servicio"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            <CalendarIcon size={14} /> Fecha del Servicio
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={data.service_date?.split('T')[0] || ''}
                            onChange={(e) => onChange({ ...data, service_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            <Clock size={14} /> Hora
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. 12:00 p.m."
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={data.service_time}
                            onChange={(e) => onChange({ ...data, service_time: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            <MapPin size={14} /> Ubicación
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Salón Principal"
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={data.location}
                            onChange={(e) => onChange({ ...data, location: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            <Users size={14} /> Personas
                        </label>
                        <input
                            type="number"
                            placeholder="10"
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={data.attendees || ''}
                            onChange={(e) => handleAttendeesChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* Menu Selection (Like Images 1 & 2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            <UtensilsCrossed size={14} /> Menú (Selección Múltiple)
                        </label>
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-gray-50 dark:border-gray-700 space-y-3">
                                <div className="relative group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder={`Buscar platos...`}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    <button
                                        onClick={() => setSelectedCategory('')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === ''
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        Todos
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id.toString())}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat.id.toString()
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="max-h-[220px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {filteredProducts.map(p => {
                                    const selectedItem = data.selected_items?.find((item: any) => item.id === p.id);
                                    const isSelected = !!selectedItem;
                                    const isBeverage = categories.find(c => c.id === p.category_id)?.name.toLowerCase().includes('bebida');
                                    const isServiceCost = p.sku === 'SERV-001' || p.name?.trim() === 'Servicio';

                                    return (
                                        <div
                                            key={p.id}
                                            className={`flex flex-col gap-3 p-3 rounded-2xl border transition-all ${isSelected
                                                ? 'bg-primary/[0.03] border-primary/20 shadow-sm'
                                                : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => !isServiceCost && toggleItem(p)}
                                                    className={`flex flex-1 items-center gap-3 text-left group ${isServiceCost ? 'cursor-default pointer-events-none' : ''}`}
                                                >
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected
                                                        ? 'bg-primary border-primary'
                                                        : 'border-gray-200 dark:border-gray-700'
                                                        }`}>
                                                        {isSelected && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-bold uppercase tracking-tight ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                            {p.name}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-gray-400">
                                                                {canShowPrices ? formatPrice(p.price) : '***'} / {p.is_sold_by_case ? 'botella' : 'unidad'}
                                                            </span>
                                                            {p.is_sold_by_case && (
                                                                <span className="text-[9px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                    <Package size={8} /> CAJA X {p.units_per_case}
                                                                </span>
                                                            )}
                                                            {isServiceCost && (
                                                                <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                                    OBLIGATORIO
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>

                                            {isSelected && (
                                                <div className="flex flex-wrap items-center gap-3 pl-9 pb-1">
                                                    {isServiceCost ? (
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                                                            Costo de servicio obligatorio
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-700 rounded-xl p-1 shadow-sm">
                                                            <button
                                                                onClick={() => updateItemQuantity(p.id, (selectedItem.quantity || 1) - 1)}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={selectedItem.quantity || 1}
                                                                onChange={(e) => updateItemQuantity(p.id, parseInt(e.target.value) || 1)}
                                                                className="w-12 text-center bg-transparent border-none outline-none font-black text-xs text-gray-900 dark:text-white"
                                                            />
                                                            <button
                                                                onClick={() => updateItemQuantity(p.id, (selectedItem.quantity || 1) + 1)}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {(isBeverage || p.is_sold_by_case) && !isServiceCost && (
                                                        <div className="relative">
                                                            <select
                                                                value={selectedItem.unit || 'Unidad'}
                                                                onChange={(e) => updateItemUnit(p.id, e.target.value)}
                                                                className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary outline-none focus:ring-2 focus:ring-primary/20 shadow-sm appearance-none pr-8"
                                                            >
                                                                <option value="Unidad">Por Unidad</option>
                                                                {p.is_sold_by_case && <option value="Caja">Por Caja (x{p.units_per_case})</option>}
                                                            </select>
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                                                {selectedItem.unit === 'Caja' ? <Package size={12} /> : <Check size={12} />}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="ml-auto text-right">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase block">Subtotal</span>
                                                        <span className="text-xs font-black text-primary">
                                                            {canShowPrices ? (() => {
                                                                const byCase = p.is_sold_by_case;
                                                                const mult = (selectedItem.unit === 'Caja' && byCase) ? (p.units_per_case || 1) : 1;
                                                                return formatPrice((selectedItem.price || 0) * (selectedItem.quantity || 1) * mult);
                                                            })() : '***'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <div className="px-3 py-8 text-center text-gray-400 text-xs italic">
                                        No se encontraron ítems
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-2 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-bold text-gray-400">
                                {data.selected_items?.length || 0} seleccionados
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            <ClipboardList size={14} /> Requerimientos Adicionales
                        </label>
                        <textarea
                            placeholder="Mesas, sillas, equipos..."
                            rows={8}
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none h-[220px]"
                            value={data.additional_requirements || ''}
                            onChange={(e) => onChange({ ...data, additional_requirements: e.target.value })}
                        />
                    </div>
                </div>

                {/* Footer Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Observaciones</label>
                        <input
                            type="text"
                            placeholder="Notas internas..."
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={data.observations || ''}
                            onChange={(e) => onChange({ ...data, observations: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-2">
                            <span className="text-primary">$</span> Monto Estimado
                        </label>
                        <div className="relative">
                            {canShowPrices ? (
                                <>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full pl-8 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-black text-right text-lg"
                                        value={typeof data.estimated_amount === 'number' ? data.estimated_amount.toFixed(2) : data.estimated_amount || ''}
                                        onChange={(e) => onChange({ ...data, estimated_amount: parseFloat(e.target.value) || 0 })}
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                </>
                            ) : (
                                <div className="w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-900/50 rounded-2xl font-black text-right text-lg text-gray-400">
                                    ***
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
