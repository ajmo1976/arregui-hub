import React, { createContext, useContext, useState, useEffect } from 'react';
import { inventoryApi } from '../services/api';

import { useAuthStore } from '../hooks/useAuth';

type Currency = 'USD' | 'VES';

interface CurrencyContextType {
    currency: Currency;
    exchangeRate: number;
    setCurrency: (currency: Currency) => void;
    formatPrice: (amountUSD: number, forceDisplay?: Currency) => string;
    convertPrice: (amountUSD: number) => number;
    isLoading: boolean;
    canShowPrices: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<Currency>(
        (localStorage.getItem('preferred_currency') as Currency) || 'USD'
    );
    const [exchangeRate, setExchangeRate] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();

    // Determine if the user can see prices (Basic role cannot)
    const canShowPrices = user?.is_superuser || (user?.role_name?.toLowerCase() !== 'básico' && user?.role_name?.toLowerCase() !== 'basico');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await inventoryApi.getSystemConfig();
                setExchangeRate(res.data.exchange_rate);
            } catch (err) {
                console.error('Error fetching exchange rate:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('preferred_currency', newCurrency);
    };

    const convertPrice = (amountUSD: number) => {
        if (!canShowPrices) return 0;
        if (currency === 'USD') return amountUSD;
        return amountUSD * exchangeRate;
    };

    const formatPrice = (amountUSD: number, forceDisplay?: Currency) => {
        if (!canShowPrices) return '***';

        const displayCurrency = forceDisplay || currency;

        if (displayCurrency === 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amountUSD);
        } else {
            const amountVES = amountUSD * exchangeRate;
            return new Intl.NumberFormat('es-VE', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amountVES) + ' VES';
        }
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            exchangeRate,
            setCurrency,
            formatPrice,
            convertPrice,
            isLoading,
            canShowPrices
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
