import React, { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { MdHistory, MdSearch, MdFilterList } from 'react-icons/md'

const actionColors = {
    create: 'bg-green-100/80 dark:bg-green-900/40 text-green-700 dark:text-green-400',
    update: 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    delete: 'bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    stock_in: 'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
    stock_out: 'bg-orange-100/80 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
}

const actionDot = {
    create: 'bg-green-400',
    update: 'bg-blue-400',
    delete: 'bg-red-400',
    stock_in: 'bg-emerald-500',
    stock_out: 'bg-orange-500',
}

const AuditLogs = () => {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterAction, setFilterAction] = useState('All')
    const [filterRole, setFilterRole] = useState('All')

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true)
            const { data } = await supabase
                .from('audit_logs')
                .select('*, profiles(name, role, email)')
                .order('created_at', { ascending: false })
                .limit(200)
            if (data) setLogs(data)
            setLoading(false)
        }
        fetchLogs()
    }, [])

    const filtered = logs.filter(log => {
        const matchSearch = !search ||
            log.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
            log.description?.toLowerCase().includes(search.toLowerCase())
        const matchAction = filterAction === 'All' || log.action === filterAction
        const matchRole = filterRole === 'All' || log.profiles?.role === filterRole
        return matchSearch && matchAction && matchRole
    })

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Audit Logs</h1>
                    <p className="text-base-content/60 text-sm">Complete history of all system actions</p>
                </div>
                <span className="text-xs text-base-content/40 bg-base-200 px-3 py-1.5 rounded-full">
                    {filtered.length} records
                </span>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                    <input type="text" className="input input-bordered input-sm w-full pl-9"
                        placeholder="Search by user or action..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="select select-bordered select-sm"
                    value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                    <option value="All">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="stock_in">Stock In</option>
                    <option value="stock_out">Stock Out</option>
                </select>
                <select className="select select-bordered select-sm"
                    value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="All">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                </select>
            </div>

            {/* Logs Table */}
            <div className="border border-base-200 rounded-xl bg-base-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                        <thead className="bg-base-200 border-b border-base-200">
                            <tr>
                                <th className="text-xs font-bold text-base-content/60 uppercase">User</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Role</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Action</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Description</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-base-content/40">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-base-content/40">No logs found.</td></tr>
                            ) : filtered.map(log => (
                                <tr key={log.id} className="hover:bg-base-200 border-b border-base-200 last:border-0">
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${actionDot[log.action] || 'bg-gray-400'}`} />
                                            <div>
                                                <p className="font-semibold text-sm">{log.profiles?.name || 'Unknown'}</p>
                                                <p className="text-xs text-base-content/40">{log.profiles?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.profiles?.role === 'admin' ? 'bg-black text-white' : 'bg-base-200 text-base-content/60'}`}>
                                            {log.profiles?.role || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${actionColors[log.action] || 'bg-base-200 text-base-content/70'}`}>
                                            {log.action?.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="text-sm text-base-content/70 max-w-xs">{log.description}</td>
                                    <td className="text-xs text-base-content/40 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString('en-PH', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-base-200 text-xs text-base-content/40">
                    Showing {filtered.length} of {logs.length} log entries
                </div>
            </div>
        </AdminLayout>
    )
}

export default AuditLogs