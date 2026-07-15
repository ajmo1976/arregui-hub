import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Download, Mail, Phone, MapPin,
    Shield, CheckCircle2, UserPlus, Edit2, Trash2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { inventoryApi } from '../../services/api';
import { toast } from 'sonner';
import UserForm from './UserForm';
import RoleManagement from './RoleManagement';

export default function ClientView() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showRoles, setShowRoles] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    
    // Filtros
    const [showFilters, setShowFilters] = useState(false);
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchRoles = async () => {
        try {
            const res = await inventoryApi.getRoles();
            setRoles(res.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
            toast.error('Error al cargar roles');
        }
    };

    const fetchUsers = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                inventoryApi.getUsers(),
                inventoryApi.getRoles()
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (err) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.role_name?.toLowerCase().includes(searchQuery.toLowerCase());
            
        const matchesRole = roleFilter ? u.role_name === roleFilter : true;
        const matchesStatus = statusFilter ? (statusFilter === 'active' ? u.is_active : !u.is_active) : true;
        
        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleExport = () => {
        if (filteredUsers.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }
        
        const headers = ['Nombre', 'Email', 'Rol', 'Teléfono', 'Dirección', 'Estado'];
        const csvData = filteredUsers.map(u => [
            `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            u.email || '',
            u.role_name || '',
            u.phone || '',
            u.address || '',
            u.is_active ? 'Activo' : 'Inactivo'
        ]);
        
        // Agregar BOM para UTF-8 en Excel
        const csvContent = "\\uFEFF" + [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Archivo exportado exitosamente');
    };

    const getRoleColor = (roleStr: string) => {
        const role = roleStr?.toUpperCase();
        if (role === 'ADMIN') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        if (role === 'LOGISTICA') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header section matching the design */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestión de Clientes y Usuarios</h1>
                    <p className="text-gray-500 font-medium tracking-tight">Administración de usuarios del sistema, roles y accesos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o rol..."
                            className="pl-12 pr-6 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl w-full md:w-80 outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all text-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 border rounded-2xl hidden sm:flex items-center gap-2 shadow-sm transition-all ${
                            showFilters || roleFilter || statusFilter 
                            ? 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10' 
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <Filter size={18} />
                        <span className="text-sm font-bold">Filtros</span>
                        {(roleFilter || statusFilter) && (
                            <span className="w-2 h-2 rounded-full bg-primary ml-1"></span>
                        )}
                    </button>
                    <button 
                        onClick={handleExport}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-primary transition-all hidden sm:flex items-center gap-2"
                    >
                        <Download size={18} />
                        <span className="text-sm font-bold">Exportar</span>
                    </button>
                    <button
                        onClick={() => setShowRoles(true)}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-primary hover:bg-primary/5 shadow-sm transition-all hidden sm:flex items-center gap-2 group"
                    >
                        <Shield size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">Ajustes de Roles</span>
                    </button>
                    <button
                        onClick={() => { setSelectedUser(null); setShowForm(true); }}
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm font-bold"
                    >
                        <UserPlus size={18} strokeWidth={2.5} />
                        <span>Nuevo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap items-center gap-4">
                            <div className="flex flex-col gap-1.5 min-w-[200px]">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Rol de Usuario</label>
                                <select 
                                    className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="">Todos los roles</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.name}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-[200px]">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Estado</label>
                                <select 
                                    className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </div>
                            
                            <div className="ml-auto mt-6">
                                {(roleFilter || statusFilter) && (
                                    <button 
                                        onClick={() => { setRoleFilter(''); setStatusFilter(''); }}
                                        className="text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-gray-700/50">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Usuario</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rol</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contacto</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-10">
                                            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-2xl w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-black text-gray-400 uppercase group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                        {user.first_name} {user.last_name}
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                                        <Mail size={10} /> {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-tighter ${getRoleColor(user.role_name)}`}>
                                                <Shield size={12} />
                                                {user.role_name}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1">
                                                {user.phone ? (
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <Phone size={14} className="text-primary" /> {user.phone}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-medium text-gray-400 italic">Sin datos extra</span>
                                                )}
                                                {user.address && (
                                                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-2 truncate max-w-[200px]">
                                                        <MapPin size={12} /> {user.address}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter ${user.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                <CheckCircle2 size={12} />
                                                {user.is_active ? 'Activo' : 'Inactivo'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setSelectedUser(user); setShowForm(true); }}
                                                    className="p-2.5 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl text-gray-500 hover:text-primary hover:border-primary/50 transition-all shadow-sm"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-2.5 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-all shadow-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-400">
                                            <Users size={64} strokeWidth={1} className="opacity-20" />
                                            <p className="font-bold tracking-tight">No se encontraron usuarios</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <UserForm
                        onClose={() => setShowForm(false)}
                        onSuccess={() => {
                            setShowForm(false);
                            fetchUsers();
                        }}
                        initialData={selectedUser}
                        roles={roles}
                    />
                )}
                {showRoles && (
                    <RoleManagement
                        onClose={() => {
                            setShowRoles(false);
                            fetchRoles(); // Refresh roles list in background
                            fetchUsers(); // Refresh users to update their role names
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
