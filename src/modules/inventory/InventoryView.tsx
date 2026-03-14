import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Package, BarChart3, ArrowUpDown, LayoutGrid } from 'lucide-react';
import ProductCatalog from './ProductCatalog';
import InventoryStock from './InventoryStock';
import InventoryMovements from './InventoryMovements';
import InventoryClassification from './InventoryClassification';

type TabType = 'catalog' | 'stock' | 'movements' | 'classification';

export default function InventoryView() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Gestión de Inventario</h1>
                <p className="text-gray-500 dark:text-gray-400">Control total de stock, productos y movimientos de almacén.</p>
            </div>

            <Tabs.Root defaultValue="catalog" className="w-full">
                <Tabs.List className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit mb-8">
                    <Tabs.Trigger
                        value="catalog"
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <Package size={18} />
                        Catálogo
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value="stock"
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <BarChart3 size={18} />
                        Stock Actual
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value="movements"
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <ArrowUpDown size={18} />
                        Movimientos
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value="classification"
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <LayoutGrid size={18} />
                        Clasificación
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="catalog" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ProductCatalog />
                </Tabs.Content>
                <Tabs.Content value="stock" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <InventoryStock />
                </Tabs.Content>
                <Tabs.Content value="movements" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <InventoryMovements />
                </Tabs.Content>
                <Tabs.Content value="classification" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <InventoryClassification />
                </Tabs.Content>
            </Tabs.Root>
        </div>
    );
}
