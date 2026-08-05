import axios from 'axios';
import { useAuthStore } from '../hooks/useAuth';

export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper for authorized file downloads
export const downloadFile = async (url: string, params?: any, defaultFilename?: string) => {
    try {
        const response = await api.get(url, {
            params,
            responseType: 'blob'
        });

        // Try to get filename from content-disposition header
        const disposition = response.headers['content-disposition'];
        let filename = defaultFilename || 'download.csv';

        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        const blob = new Blob([response.data], { type: response.headers['content-type'] as string });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        }, 100);

        return true;
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
};

// Auth interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for session expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Force logout on 401 Unauthorized
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);


export const inventoryApi = {
    getProducts: () => api.get('/inventory/products'),
    createProduct: (data: any) => api.post('/inventory/products', data),
    updateProduct: (id: number, data: any) => api.patch(`/inventory/products/${id}`, data),

    // Classifications (Dynamic)
    getCategories: () => api.get('/inventory/categories'),
    createCategory: (data: any) => api.post('/inventory/categories', data),
    deleteCategory: (id: number) => api.delete(`/inventory/categories/${id}`),
    toggleCategory: (id: number) => api.patch(`/inventory/categories/${id}/toggle`),
    getUnits: () => api.get('/inventory/units'),
    createUnit: (data: any) => api.post('/inventory/units', data),
    deleteUnit: (id: number) => api.delete(`/inventory/units/${id}`),
    toggleUnit: (id: number) => api.patch(`/inventory/units/${id}/toggle`),
    getWarehouses: () => api.get('/inventory/warehouses'),
    createWarehouse: (data: any) => api.post('/inventory/warehouses', data),
    deleteWarehouse: (id: number) => api.delete(`/inventory/warehouses/${id}`),
    toggleWarehouse: (id: number) => api.patch(`/inventory/warehouses/${id}/toggle`),
    getProductTypes: () => api.get('/inventory/product-types'),
    createProductType: (data: any) => api.post('/inventory/product-types', data),
    deleteProductType: (id: number) => api.delete(`/inventory/product-types/${id}`),
    toggleProductType: (id: number) => api.patch(`/inventory/product-types/${id}/toggle`),
    // Providers
    getProviders: (query?: string) => api.get(`/inventory/providers${query ? `?query=${query}` : ''}`),
    createProvider: (data: any) => api.post('/inventory/providers', data),
    updateProvider: (id: number, data: any) => api.patch(`/inventory/providers/${id}`, data),
    deleteProvider: (id: number) => api.delete(`/inventory/providers/${id}`),
    toggleProvider: (id: number) => api.patch(`/inventory/providers/${id}/toggle`),
    uploadProviderDocument: (id: number, data: FormData) => api.post(`/inventory/providers/${id}/documents`, data, {
        headers: { 'Content-Type': undefined }
    }),
    deleteProviderDocument: (docId: number) => api.delete(`/inventory/providers/documents/${docId}`),
    getProviderStats: (id: number) => api.get(`/inventory/providers/${id}/stats`),
    getReasons: () => api.get('/inventory/reasons'),
    createReason: (data: any) => api.post('/inventory/reasons', data),
    deleteReason: (id: number) => api.delete(`/inventory/reasons/${id}`),

    getMovements: (params?: any) => api.get('/inventory/movements', { params }),
    createMovement: (data: any) => api.post('/inventory/movements', data),

    // Exports (Now uses axios for authorized downloads)
    exportProducts: (params?: any) => downloadFile('/inventory/products/export', params),
    exportStock: (params?: any) => downloadFile('/inventory/stock/export', params),
    exportMovements: (params?: any) => downloadFile('/inventory/movements/export', params),
    exportCategories: () => downloadFile('/inventory/categories/export'),
    exportProviders: (query?: string) => downloadFile('/inventory/providers/export', { query }),

    getExportProductsUrl: (params?: any) => `${API_BASE_URL}/inventory/products/export${params ? '?' + new URLSearchParams(params).toString() : ''}`,
    getExportStockUrl: (params?: any) => `${API_BASE_URL}/inventory/stock/export${params ? '?' + new URLSearchParams(params).toString() : ''}`,
    getExportMovementsUrl: (params?: any) => `${API_BASE_URL}/inventory/movements/export${params ? '?' + new URLSearchParams(params).toString() : ''}`,
    getExportCategoriesUrl: () => `${API_BASE_URL}/inventory/categories/export`,
    getExportProvidersUrl: (query?: string) => `${API_BASE_URL}/inventory/providers/export${query ? `?query=${query}` : ''}`,

    // Purchases (Invoices)
    getPurchases: () => api.get('/inventory/purchases'),
    getPurchase: (id: number) => api.get(`/inventory/purchases/${id}`),
    createPurchase: (data: any) => api.post('/inventory/purchases', data),
    recordPayment: (id: number, data: any) => api.post(`/inventory/purchases/${id}/payments`, data, {
        headers: {
            'Content-Type': undefined
        }
    }),
    updatePurchase: (id: number, data: any) => api.patch(`/inventory/purchases/${id}`, data),

    // Users & Roles
    register: (data: any) => api.post('/auth/register', data),
    googleLogin: (credential: string) => api.post('/auth/google', { credential }),
    getUsers: () => api.get('/users'),
    createUser: (data: any) => api.post('/users', data),
    updateUser: (id: number, data: any) => api.put(`/users/${id}`, data),
    getRoles: () => api.get('/users/roles'),
    createRole: (data: any) => api.post('/users/roles', data),
    updateRole: (id: number, data: any) => api.put(`/users/roles/${id}`, data),
    deleteRole: (id: number) => api.delete(`/users/roles/${id}`),

    // Services
    getServiceEvents: (limit: number = 5000, exclude_company?: string) => api.get('/services/events', { params: { limit, exclude_company } }),
    createServiceEvent: (data: any) => api.post('/services/events', data),
    getServiceEvent: (id: number) => api.get(`/services/events/${id}`),
    updateServiceEvent: (id: number, data: any) => api.patch(`/services/events/${id}`, data),
    deleteServiceEvent: (id: number) => api.delete(`/services/events/${id}`),

    // Catering Menu
    getCateringCategories: () => api.get('/services/menu/categories'),
    createCateringCategory: (data: any) => api.post('/services/menu/categories', data),
    updateCateringCategory: (id: number, data: any) => api.patch(`/services/menu/categories/${id}`, data),
    deleteCateringCategory: (id: number) => api.delete(`/services/menu/categories/${id}`),

    getCateringItems: () => api.get('/services/menu/items'),
    createCateringItem: (data: any) => api.post('/services/menu/items', data),
    updateCateringItem: (id: number, data: any) => api.patch(`/services/menu/items/${id}`, data),
    deleteCateringItem: (id: number) => api.delete(`/services/menu/items/${id}`),

    // System Settings & Parameters
    getSettings: () => api.get('/system/settings'),
    updateSettings: (data: any) => api.post('/system/settings/email', data),
    getEmailConfig: () => api.get('/system/settings/email'),
    updateEmailConfig: (data: any) => api.post('/system/settings/email', data),
    getSystemConfig: () => api.get('/system/config'),
    getParameters: (category?: string) => api.get(`/system/parameters${category ? `?category=${category}` : ''}`),
    createParameter: (data: any) => api.post('/system/parameters', data),
    updateParameter: (id: number, data: any) => api.patch(`/system/parameters/${id}`, data),
    deleteParameter: (id: number) => api.delete(`/system/parameters/${id}`),
    getAuditLogs: (params?: any) => api.get('/system/logs', { params }),
    getAuditLogDetail: (id: number) => api.get(`/system/logs/${id}`),

    // Operational Records (Registros Diarios)
    getDailyLogs: (query?: string, category_id?: number, limit?: number) => {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (category_id !== undefined && category_id !== null) params.append('category_id', category_id.toString());
        if (limit) params.append('limit', limit.toString());
        const queryString = params.toString();
        return api.get(`/operational${queryString ? `?${queryString}` : ''}`);
    },
    createDailyLog: (data: any) => api.post('/operational', data),
    updateDailyLog: (id: number, data: any) => api.patch(`/operational/${id}`, data),
    deleteDailyLog: (id: number) => api.delete(`/operational/${id}`),

    // Meal Prices
    getMealPrices: () => api.get('/operational/meal-prices'),
    createMealPrice: (data: any) => api.post('/operational/meal-prices', data),
    deleteMealPrice: (id: number) => api.delete(`/operational/meal-prices/${id}`),

    getDashboardSummary: (rangeType: string = 'month', startDate?: string, endDate?: string) => {
        let url = `/dashboard/summary?range_type=${rangeType}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;
        return api.get(url);
    },

    // Economy & Rates
    getExchangeRates: () => api.get('/economy/rates'),
    getLatestRate: () => api.get('/economy/rates/latest'),
    syncExchangeRate: () => api.post('/economy/rates/sync'),
};

export default api;
