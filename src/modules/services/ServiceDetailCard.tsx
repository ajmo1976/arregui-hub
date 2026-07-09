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
    Package,
    ChevronDown,
    ChevronUp
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
    const [isExpanded, setIsExpanded] = useState(true);
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
                unit: 'Unidad',
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
                quantity: Math.max(0, quantity),
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
            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm"
        >
            {/* Header with ID and Delete */}
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-black text-gray-500">
                        #{index + 1}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Detalles del Servicio
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && data.estimated_amount > 0 && (
                        <span className="text-sm font-black text-primary px-4">
                            {canShowPrices ? `$${typeof data.estimated_amount === 'number' ? data.estimated_amount.toFixed(2) : data.estimated_amount}` : '***'}
                        </span>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar Servicio"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-6 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    {/* General Info & Requerimientos Container */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Grid Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            <CalendarIcon size={14} /> Fecha del Servicio
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
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
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
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
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
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
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                            value={data.attendees || ''}
                            onChange={(e) => handleAttendeesChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            <ClipboardList size={14} /> Requerimientos Adicionales
                        </label>
                        <textarea
                            placeholder="Mesas, sillas, equipos..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none text-sm"
                            value={data.additional_requirements || ''}
                            onChange={(e) => onChange({ ...data, additional_requirements: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            Observaciones Internas
                        </label>
                        <textarea
                            placeholder="Notas o detalles extra..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none text-sm"
                            value={data.observations || ''}
                            onChange={(e) => onChange({ ...data, observations: e.target.value })}
                        />
                    </div>
                </div>
            </div>
                </div>
            )}

            {/* Menu Layout: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                
                {/* Left Panel: Catalog */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                        <UtensilsCrossed size={14} /> Catálogo de Menú
                    </label>
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-800 space-y-3">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder={`Buscar platos...`}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
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
                        <div className="h-[400px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {filteredProducts.map(p => {
                                const selectedItem = data.selected_items?.find((item: any) => item.id === p.id);
                                const isSelected = !!selectedItem;
                                const isServiceCost = p.sku === 'SERV-001' || p.name?.trim() === 'Servicio';

                                return (
                                    <div
                                        key={p.id}
                                        className={`flex flex-col p-3 rounded-2xl border transition-all ${isSelected
                                            ? 'bg-primary/[0.03] border-primary/20'
                                            : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <button
                                            onClick={() => !isServiceCost && toggleItem(p)}
                                            className={`flex items-center gap-3 text-left w-full group ${isServiceCost ? 'cursor-default pointer-events-none' : ''}`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                                                ? 'bg-primary border-primary'
                                                : 'border-gray-300 dark:border-gray-700'
                                                }`}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-bold uppercase tracking-tight block truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                    {p.name}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
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
                                            {!isSelected && !isServiceCost && (
                                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                                    <Plus size={16} />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <div className="px-3 py-8 text-center text-gray-400 text-xs italic">
                                    No se encontraron ítems
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Selected Items (Cart) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary ml-1">
                            <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                                {data.selected_items?.length || 0}
                            </span>
                            Ítems Seleccionados
                        </label>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 flex flex-col h-[525px]">
                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-4">
                            {(!data.selected_items || data.selected_items.length === 0) ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <UtensilsCrossed size={48} className="mb-4 text-gray-300 dark:text-gray-700" />
                                    <p className="text-sm font-bold">Sin ítems seleccionados</p>
                                    <p className="text-xs">Agrega platos desde el catálogo</p>
                                </div>
                            ) : (
                                [...data.selected_items].sort((a: any, b: any) => {
                                    const isAService = a.sku === 'SERV-001' || a.name?.trim() === 'Servicio';
                                    const isBService = b.sku === 'SERV-001' || b.name?.trim() === 'Servicio';
                                    if (isAService && !isBService) return 1;
                                    if (!isAService && isBService) return -1;
                                    return 0;
                                }).map((selectedItem: any) => {
                                    const catalogItem = products.find(p => String(p.id) === String(selectedItem.id));
                                    const isServiceCost = selectedItem.sku === 'SERV-001' || selectedItem.name?.trim() === 'Servicio' || (catalogItem && (catalogItem.sku === 'SERV-001' || catalogItem.name?.trim() === 'Servicio'));
                                    const isBeverage = catalogItem && categories.find(c => c.id === catalogItem.category_id)?.name.toLowerCase().includes('bebida');
                                    
                                    // Utiliza item de catalogo para metadata actual si esta disponible
                                    const p = catalogItem || selectedItem;

                                    return (
                                        <div key={selectedItem.id} className="bg-white dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative group">
                                            {!isServiceCost && (
                                                <button
                                                    onClick={() => toggleItem(selectedItem)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm hover:bg-red-500 hover:text-white"
                                                    title="Eliminar del carrito"
                                                >
                                                    <Minus size={12} strokeWidth={3} />
                                                </button>
                                            )}
                                            
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="text-sm font-bold uppercase text-gray-900 dark:text-white leading-tight">
                                                        {selectedItem.name}
                                                    </span>
                                                    <span className="text-xs font-black text-primary whitespace-nowrap">
                                                        {canShowPrices ? (() => {
                                                            const byCase = p.is_sold_by_case;
                                                            const mult = (selectedItem.unit === 'Caja' && byCase) ? (p.units_per_case || 1) : 1;
                                                            return formatPrice((selectedItem.price || 0) * (selectedItem.quantity || 1) * mult);
                                                        })() : '***'}
                                                    </span>
                                                </div>

                                                {isServiceCost ? (
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-900 px-2.5 py-1 rounded-lg w-max">
                                                        Costo de servicio obligatorio
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        {/* Quantity Control */}
                                                        <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-xl p-1">
                                                            <button
                                                                onClick={() => updateItemQuantity(selectedItem.id, (selectedItem.quantity || 1) - 1)}
                                                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                value={selectedItem.quantity !== undefined && selectedItem.quantity !== null ? selectedItem.quantity : ''}
                                                                onChange={(e) => updateItemQuantity(selectedItem.id, parseFloat(e.target.value) || 0)}
                                                                className="w-10 text-center bg-transparent border-none outline-none font-black text-xs text-gray-900 dark:text-white"
                                                            />
                                                            <button
                                                                onClick={() => updateItemQuantity(selectedItem.id, (selectedItem.quantity || 1) + 1)}
                                                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>

                                                        {/* Unit Control */}
                                                        {(isBeverage || p.is_sold_by_case) && (
                                                            <div className="relative">
                                                                <select
                                                                    value={selectedItem.unit || 'Unidad'}
                                                                    onChange={(e) => updateItemUnit(selectedItem.id, e.target.value)}
                                                                    className="bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary outline-none focus:ring-2 focus:ring-primary/20 appearance-none pr-7"
                                                                >
                                                                    <option value="Unidad">Por Unidad</option>
                                                                    {p.is_sold_by_case && <option value="Caja">Por Caja (x{p.units_per_case})</option>}
                                                                </select>
                                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                                                    {selectedItem.unit === 'Caja' ? <Package size={10} /> : <Check size={10} />}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Cart Footer: Estimated Total */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex flex-col bg-primary text-white rounded-2xl p-5 shadow-lg shadow-primary/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-10 translate-x-10"></div>
                                <label className="text-xs font-black uppercase tracking-widest text-primary-100 flex items-center justify-between w-full">
                                    <span>Total Estimado del Servicio</span>
                                </label>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-2xl font-black">
                                        {canShowPrices ? (
                                            <span className="flex items-center gap-1">
                                                <span className="text-primary-200">$</span>
                                                {typeof data.estimated_amount === 'number' ? data.estimated_amount.toFixed(2) : data.estimated_amount || '0.00'}
                                            </span>
                                        ) : '***'}
                                    </span>
                                </div>
                                <div className="absolute right-4 bottom-4">
                                    <CheckCircle2 size={32} className="text-white opacity-20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
