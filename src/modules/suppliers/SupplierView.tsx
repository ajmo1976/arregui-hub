import React from 'react';
import SupplierList from './SupplierList';

export default function SupplierView() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SupplierList />
        </div>
    );
}
