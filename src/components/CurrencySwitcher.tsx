import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { DollarSign, TrendingUp } from 'lucide-react';

interface CurrencySwitcherProps {
    variant?: 'dark' | 'light';
}

export const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({ variant = 'light' }) => {
    const { currency, setCurrency, exchangeRate } = useCurrency();

    return (
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${variant === 'dark'
                ? 'bg-white/5 border-white/10'
                : 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}>
            <button
                onClick={() => setCurrency('USD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currency === 'USD'
                        ? 'bg-primary text-white shadow-lg'
                        : variant === 'dark' ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                    }`}
            >
                <DollarSign size={12} />
                USD
            </button>
            <button
                onClick={() => setCurrency('VES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currency === 'VES'
                        ? 'bg-primary text-white shadow-lg'
                        : variant === 'dark' ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                    }`}
            >
                <TrendingUp size={12} />
                VES
            </button>
            {exchangeRate > 0 && (
                <div className={`mx-2 text-[8px] font-bold uppercase tracking-tighter hidden md:block ${variant === 'dark' ? 'text-white/20' : 'text-gray-300'
                    }`}>
                    Rate: {exchangeRate.toFixed(2)}
                </div>
            )}
        </div>
    );
};
