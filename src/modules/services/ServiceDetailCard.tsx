import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Search, CheckCircle2, Minus, Plus, Package, Check } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { useCurrency } from '../../contexts/CurrencyContext';

interface ServiceDetailCardProps {
    index: number;
    data: any;
    onChange: (data: any) => void;
}

export default function ServiceDetailCard({ index, data, onChange }: ServiceDetailCardProps) {
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

                // Auto-inject the service cost item if not present
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

                        onChange({ ...data, selected_items: updatedItems, estimated_amount: parseFloat(itemsTotal.toFixed(2)) });
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
        if (isServiceCost) return;

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
        if (catalogItem?.sku === 'SERV-001' || catalogItem?.name?.trim() === 'Servicio') return;

        const newItems = (data.selected_items || []).map((item: any) =>
            String(item.id) === String(productId) ? { ...item, quantity: Math.max(0, quantity) } : item
        );
        recalculateTotal(newItems, data.attendees);
    };

    const updateItemUnit = (productId: number, unit: string) => {
        const catalogItem = products.find(p => String(p.id) === String(productId));
        if (catalogItem?.sku === 'SERV-001' || catalogItem?.name?.trim() === 'Servicio') return;

        const newItems = (data.selected_items || []).map((item: any) =>
            String(item.id) === String(productId) ? { ...item, unit } : item
        );
        recalculateTotal(newItems, data.attendees);
    };

    const recalculateTotal = (items: any[], attendees: number) => {
        const itemsTotal = items.reduce((acc: number, item: any) => {
            const catalogItem = products.find(p => String(p.id) === String(item.id));
            const price = item.price || 0;
            const isItemService = item.sku === 'SERV-001' || item.name?.trim() === 'Servicio' || (catalogItem && (catalogItem.sku === 'SERV-001' || catalogItem.name?.trim() === 'Servicio'));
            const quantity = isItemService ? 1 : (item.quantity || 1);
            const byCase = catalogItem ? catalogItem.is_sold_by_case : item.is_sold_by_case;
            const units = catalogItem ? catalogItem.units_per_case : (item.units_per_case || 1);
            const multiplier = (item.unit === 'Caja' && byCase) ? units : 1;
            return acc + (price * quantity * multiplier);
        }, 0);
        onChange({ ...data, selected_items: items, estimated_amount: parseFloat(itemsTotal.toFixed(2)) });
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? String(p.category_id) === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 h-full divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
                {/* Left Panel: Catalog */}
                <div className="flex flex-col p-6 h-full">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                        <UtensilsCrossed size={14} /> Catálogo de Menú
                    </label>
                    
                    <div className="space-y-3 mb-4 shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder={`Buscar platos...`}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button
                                onClick={() => setSelectedCategory('')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === '' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600'}`}
                            >
                                Todos
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id.toString())}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat.id.toString() ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-16 md:pb-0">
                        {filteredProducts.map(p => {
                            const isSelected = !!data.selected_items?.find((item: any) => item.id === p.id);
                            const isServiceCost = p.sku === 'SERV-001' || p.name?.trim() === 'Servicio';

                            return (
                                <div key={p.id} className={`flex flex-col p-3 rounded-2xl border transition-all ${isSelected ? 'bg-primary/[0.03] border-primary/20' : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
                                    <button onClick={() => !isServiceCost && toggleItem(p)} className={`flex items-center gap-3 text-left w-full group ${isServiceCost ? 'cursor-default pointer-events-none' : ''}`}>
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-700'}`}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-sm font-bold uppercase tracking-tight block truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{p.name}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-black text-gray-400">
                                                    {canShowPrices ? formatPrice(p.price) : '***'} / {p.is_sold_by_case ? 'botella' : 'unidad'}
                                                </span>
                                                {p.is_sold_by_case && (
                                                    <span className="text-[9px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                        <Package size={8} /> CAJA X {p.units_per_case}
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
                    </div>
                </div>

                {/* Right Panel: Selected Items (Cart) */}
                <div className="flex flex-col p-6 bg-gray-50/30 dark:bg-gray-900/30 h-full">
                    <label className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-primary mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                                {data.selected_items?.length || 0}
                            </span>
                            Ítems Seleccionados
                        </div>
                    </label>

                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                        {(!data.selected_items || data.selected_items.length === 0) ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                <UtensilsCrossed size={48} className="mb-4 text-gray-300" />
                                <p className="text-sm font-medium text-center">No hay ítems seleccionados para este servicio.</p>
                            </div>
                        ) : (
                            data.selected_items.map((item: any) => {
                                const catalogItem = products.find(p => String(p.id) === String(item.id));
                                const isServiceCost = item.sku === 'SERV-001' || item.name?.trim() === 'Servicio' || catalogItem?.sku === 'SERV-001' || catalogItem?.name?.trim() === 'Servicio';
                                const byCase = catalogItem ? catalogItem.is_sold_by_case : item.is_sold_by_case;
                                const units = catalogItem ? catalogItem.units_per_case : (item.units_per_case || 1);
                                
                                let finalMultiplier = 1;
                                if (item.unit === 'Caja' && byCase) finalMultiplier = units;
                                const totalItemCost = (item.price || 0) * (item.quantity || 1) * finalMultiplier;

                                return (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-sm relative group">
                                        <div className="pr-8">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-gray-400">
                                                    {canShowPrices ? formatPrice(item.price) : '***'} / {byCase ? 'botella' : 'unidad'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {!isServiceCost && (
                                            <div className="flex items-center gap-4 mt-4 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-xl self-start w-fit">
                                                <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-4">
                                                    <button onClick={() => updateItemQuantity(item.id, (item.quantity || 1) - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all" disabled={item.quantity <= 1}>
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-10 text-center font-bold text-sm">{item.quantity || 1}</span>
                                                    <button onClick={() => updateItemQuantity(item.id, (item.quantity || 1) + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all">
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <div className="pl-1 pr-1">
                                                    <select value={item.unit || 'Unidad'} onChange={(e) => updateItemUnit(item.id, e.target.value)} className="bg-transparent font-bold text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
                                                        <option value="Unidad">{byCase ? 'Botellas' : 'Unidades'}</option>
                                                        {byCase && <option value="Caja">Cajas (x{units})</option>}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                        {isServiceCost && (
                                            <div className="mt-4 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs font-bold text-gray-500 inline-block">
                                                1 Servicio (Fijo)
                                            </div>
                                        )}
                                        
                                        <div className="absolute right-4 bottom-4 flex flex-col items-end gap-2">
                                            <div className="font-black text-gray-900 dark:text-white">
                                                {canShowPrices ? formatPrice(totalItemCost) : '***'}
                                            </div>
                                            {!isServiceCost && (
                                                <button onClick={() => toggleItem(item)} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Quitar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
                        <div className="bg-primary text-white rounded-2xl p-4 relative overflow-hidden shadow-lg shadow-primary/20">
                            <div className="relative z-10 flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest opacity-80">Subtotal del Servicio</span>
                                <span className="text-xl font-black">{canShowPrices ? formatPrice(data.estimated_amount || 0) : '***'}</span>
                            </div>
                            <div className="absolute right-4 bottom-4">
                                <CheckCircle2 size={32} className="text-white opacity-20" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
