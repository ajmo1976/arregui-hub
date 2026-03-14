import React, { useState, useRef, useEffect } from 'react';
import { Search, Package } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    unit?: { name: string };
}

interface Props {
    products: Product[];
    onSelect: (product: Product) => void;
    placeholder?: string;
    selectedId?: string;
}

export default function ProductSearchSelect({ products, onSelect, placeholder = "Buscar producto...", selectedId }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedProduct = products.find(p => p.id.toString() === selectedId);

    const filtered = products.filter(p => !search ? true :
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 15);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className={`flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl cursor-text transition-all`}
                onClick={() => setIsOpen(true)}
            >
                <Search size={16} className="text-gray-400" />
                <input
                    type="text"
                    className="bg-transparent outline-none w-full text-sm dark:text-white placeholder:text-gray-400"
                    placeholder={selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : placeholder}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-[100] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No se encontraron productos</div>
                    ) : (
                        <div className="p-1">
                            {filtered.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    className="w-full flex flex-col items-start px-4 py-2 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-colors group"
                                    onClick={() => {
                                        onSelect(p);
                                        setSearch('');
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Package size={14} className="text-gray-400 group-hover:text-primary" />
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</span>
                                    </div>
                                    <div className="flex gap-3 text-[11px] text-gray-500 ml-5 uppercase">
                                        <span className="font-mono">SKU: {p.sku}</span>
                                        {p.barcode && <span className="font-mono">CB: {p.barcode}</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
