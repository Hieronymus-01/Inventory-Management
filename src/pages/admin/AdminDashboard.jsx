import React, { useState, useEffect, useContext } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import {
    MdInventory, MdWarning, MdTrendingUp, MdTrendingDown,
    MdPeople, MdHistory, MdCategory, MdAttachMoney,
    MdAdminPanelSettings, MdPerson, MdRefresh
} from 'react-icons/md'
import { FaBoxOpen, FaFire } from 'react-icons/fa'

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, gradient, alert = false }) => (
    <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden shadow-sm"
        style={{ background: gradient }}>
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-base-100" />
        <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full opacity-10 bg-base-100" />

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm font-medium text-white/80">{label}</p>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-base-100/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white text-base sm:text-lg" />
                </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mb-1">{value}</p>
            <p className="text-xs text-white/60 font-medium">{sub}</p>
            {alert && (
                <div className="mt-2 inline-flex items-center gap-1 bg-base-100/20 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-base-100 animate-pulse" />
                    <span className="text-white text-xs font-bold">Needs attention</span>
                </div>
            )}
        </div>
    </div>
)

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
const MiniBar = ({ label, value, max, color }) => (
    <div className="flex items-center gap-3">
        <span className="text-xs text-base-content/60 w-16 sm:w-20 truncate font-medium">{label}</span>
        <div className="flex-1 bg-base-200 rounded-full h-2.5 overflow-hidden">
            <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{
                    width: max > 0 ? `${Math.min((value / max) * 100, 100)}%` : '0%',
                    background: color
                }}
            />
        </div>
        <span className="text-xs font-black text-base-content/80 w-6 text-right">{value}</span>
    </div>
)

const AdminDashboard = () => {
    const { profile } = useContext(SessionContext)
    const [items, setItems] = useState([])
    const [users, setUsers] = useState([])
    const [auditLogs, setAuditLogs] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchAll = async () => {
        setRefreshing(true)
        const [{ data: itemsData }, { data: usersData }, { data: txData }, { data: logsData }] = await Promise.all([
            supabase.from('inventory_items').select('*').eq('is_active', true),
            supabase.from('profiles').select('*'),
            supabase.from('stock_transactions')
                .select('*, inventory_items(item_name, category), profiles(name, role)')
                .order('created_at', { ascending: false })
                .limit(50),
            supabase.from('audit_logs')
                .select('*, profiles(name, role)')
                .order('created_at', { ascending: false })
                .limit(30),
        ])
        if (itemsData) setItems(itemsData)
        if (usersData) setUsers(usersData)
        if (txData) setTransactions(txData)
        if (logsData) setAuditLogs(logsData)
        setLoading(false)
        setRefreshing(false)
    }

    useEffect(() => { fetchAll() }, [])

    // ── Stats ──────────────────────────────────────────────────────────────────
    const totalItems = items.length
    const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level).length
    const outOfStock = items.filter(i => i.quantity === 0).length
    const totalValue = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0)
    const totalAdmins = users.filter(u => u.role === 'admin').length
    const totalStaff = users.filter(u => u.role === 'staff').length

    const today = new Date().toDateString()
    const todayTx = transactions.filter(t => new Date(t.created_at).toDateString() === today)
    const todayIn = todayTx.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0)
    const todayOut = todayTx.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0)

    const categories = ['AC Unit', 'Parts', 'Supplies', 'Tools', 'Equipment']
    const categoryColors = {
        'AC Unit': 'linear-gradient(90deg,#3b82f6,#06b6d4)',
        'Parts': 'linear-gradient(90deg,#8b5cf6,#a78bfa)',
        'Supplies': 'linear-gradient(90deg,#10b981,#34d399)',
        'Tools': 'linear-gradient(90deg,#f59e0b,#fbbf24)',
        'Equipment': 'linear-gradient(90deg,#f97316,#fb923c)',
    }
    const categoryData = categories.map(cat => ({
        cat,
        count: items.filter(i => i.category === cat).length,
        value: items.filter(i => i.category === cat)
            .reduce((s, i) => s + (i.quantity * i.unit_price), 0),
    }))
    const maxCatCount = Math.max(...categoryData.map(c => c.count), 1)

    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d
    })
    const movementData = last7.map(date => {
        const dateStr = date.toDateString()
        const dayTx = transactions.filter(t => new Date(t.created_at).toDateString() === dateStr)
        return {
            label: date.toLocaleDateString('en', { weekday: 'short' }),
            in: dayTx.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0),
            out: dayTx.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0),
        }
    })
    const maxMovement = Math.max(...movementData.map(d => Math.max(d.in, d.out)), 1)

    const staffActivity = users
        .filter(u => u.role === 'staff' || u.role === 'admin')
        .map(u => ({
            ...u,
            txCount: transactions.filter(t => t.profiles?.name === u.name).length,
        }))
        .sort((a, b) => b.txCount - a.txCount)
        .slice(0, 5)

    const actionDotColor = (action) => {
        const map = {
            create: '#10b981', update: '#3b82f6', delete: '#ef4444',
            stock_in: '#10b981', stock_out: '#f97316',
        }
        return map[action] || '#9ca3af'
    }

    return (
        <AdminLayout>

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-7">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900">Admin Dashboard</h1>
                        {(lowStock > 0 || outOfStock > 0) && (
                            <span className="flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                                <MdWarning className="text-xs" />
                                {outOfStock + lowStock} alert{outOfStock + lowStock > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <p className="text-base-content/60 text-xs sm:text-sm">
                        Welcome back, <span className="font-bold text-gray-800">{profile?.name}</span>
                        {' · '}
                        <span className="text-base-content/40">
                            {new Date().toLocaleDateString('en-PH', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </span>
                    </p>
                </div>
                <button
                    onClick={fetchAll}
                    disabled={refreshing}
                    className="self-start sm:self-auto flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-base-100 border border-base-200 text-base-content/70 text-xs sm:text-sm font-medium hover:bg-base-200 hover:border-gray-300 transition-all shadow-sm"
                >
                    <MdRefresh className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* ── TOP STATS — 2 cols on mobile, 4 on desktop ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <StatCard
                    label="Total Items"
                    value={totalItems}
                    sub="active in inventory"
                    icon={MdInventory}
                    gradient="linear-gradient(135deg, #1e3a5f, #2563eb)"
                />
                <StatCard
                    label="Inventory Value"
                    value={`₱${totalValue >= 1000000
                        ? (totalValue / 1000000).toFixed(1) + 'M'
                        : totalValue >= 1000
                            ? (totalValue / 1000).toFixed(0) + 'K'
                            : totalValue.toLocaleString()}`}
                    sub="total stock worth"
                    icon={MdAttachMoney}
                    gradient="linear-gradient(135deg, #064e3b, #059669)"
                />
                <StatCard
                    label="Low Stock"
                    value={lowStock}
                    sub="items need reorder"
                    icon={MdWarning}
                    gradient={lowStock > 0
                        ? "linear-gradient(135deg, #78350f, #d97706)"
                        : "linear-gradient(135deg, #374151, #6b7280)"}
                    alert={lowStock > 0}
                />
                <StatCard
                    label="Out of Stock"
                    value={outOfStock}
                    sub="unavailable items"
                    icon={FaBoxOpen}
                    gradient={outOfStock > 0
                        ? "linear-gradient(135deg, #7f1d1d, #dc2626)"
                        : "linear-gradient(135deg, #374151, #6b7280)"}
                    alert={outOfStock > 0}
                />
            </div>

            {/* ── SECOND ROW — 2 cols mobile, 4 desktop ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <StatCard
                    label="Total Users"
                    value={users.length}
                    sub="registered accounts"
                    icon={MdPeople}
                    gradient="linear-gradient(135deg, #2d1b69, #7c3aed)"
                />
                <StatCard
                    label="Admins"
                    value={totalAdmins}
                    sub="full system access"
                    icon={MdAdminPanelSettings}
                    gradient="linear-gradient(135deg, #1e1b4b, #4f46e5)"
                />
                <StatCard
                    label="Staff Members"
                    value={totalStaff}
                    sub="limited access"
                    icon={MdPerson}
                    gradient="linear-gradient(135deg, #0c4a6e, #0891b2)"
                />

                {/* Today Activity Card */}
                <div className="rounded-2xl p-4 sm:p-5 bg-base-100 border border-base-200 shadow-sm">
                    <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-1">
                        <FaFire className="text-orange-400" /> Today
                    </p>
                    <div className="flex gap-2 sm:gap-4">
                        <div className="flex-1 text-center p-2 sm:p-3 rounded-xl bg-green-50 border border-green-100">
                            <p className="text-xl sm:text-2xl font-black text-green-600">{todayIn}</p>
                            <p className="text-xs text-green-500 font-medium mt-0.5">In</p>
                        </div>
                        <div className="flex-1 text-center p-2 sm:p-3 rounded-xl bg-red-50 border border-red-100">
                            <p className="text-xl sm:text-2xl font-black text-red-500">{todayOut}</p>
                            <p className="text-xs text-red-400 font-medium mt-0.5">Out</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CHARTS ROW — stacked mobile, side-by-side lg ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">

                {/* Stock Movement Chart */}
                <div className="lg:col-span-2 border border-base-200 rounded-2xl p-4 sm:p-5 bg-base-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)' }}>
                                <MdTrendingUp className="text-white text-sm" />
                            </span>
                            Stock Movement
                        </p>
                        <span className="text-xs text-base-content/40 bg-base-200 px-2 py-1 rounded-full">Last 7 Days</span>
                    </div>
                    <p className="text-xs text-base-content/40 mb-4 sm:mb-5 ml-9">Daily stock in vs stock out</p>

                    <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-36 px-1 sm:px-2">
                        {movementData.map(({ label, in: inQty, out: outQty }) => (
                            <div key={label} className="flex-1 flex flex-col items-center gap-1">
                                <div className="flex items-end gap-0.5 h-24 sm:h-28 w-full justify-center">
                                    <div
                                        className="rounded-t-md transition-all duration-700 w-3 sm:w-5"
                                        style={{
                                            height: `${(inQty / maxMovement) * 100}%`,
                                            minHeight: inQty > 0 ? '6px' : '0',
                                            background: 'linear-gradient(180deg,#34d399,#10b981)'
                                        }}
                                        title={`Stock In: ${inQty}`}
                                    />
                                    <div
                                        className="rounded-t-md transition-all duration-700 w-3 sm:w-5"
                                        style={{
                                            height: `${(outQty / maxMovement) * 100}%`,
                                            minHeight: outQty > 0 ? '6px' : '0',
                                            background: 'linear-gradient(180deg,#f87171,#ef4444)'
                                        }}
                                        title={`Stock Out: ${outQty}`}
                                    />
                                </div>
                                <span className="text-xs text-base-content/40 font-medium">{label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 sm:gap-5 mt-3 sm:mt-4 pt-3 border-t border-base-200">
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg,#34d399,#10b981)' }} />
                            Stock In
                        </div>
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg,#f87171,#ef4444)' }} />
                            Stock Out
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="border border-base-200 rounded-2xl p-4 sm:p-5 bg-base-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                            <MdCategory className="text-white text-sm" />
                        </span>
                        <p className="font-bold text-sm">By Category</p>
                    </div>
                    <p className="text-xs text-base-content/40 mb-4 sm:mb-5 ml-9">Items per category</p>
                    <div className="space-y-3 sm:space-y-4">
                        {categoryData.map(({ cat, count }) => (
                            <MiniBar
                                key={cat}
                                label={cat}
                                value={count}
                                max={maxCatCount}
                                color={categoryColors[cat]}
                            />
                        ))}
                    </div>

                    {/* Category value summary */}
                    <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-base-200 space-y-2">
                        <p className="text-xs font-bold text-base-content/40 uppercase tracking-wider">Top Value</p>
                        {categoryData
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 2)
                            .map(({ cat, value }) => (
                                <div key={cat} className="flex justify-between items-center">
                                    <span className="text-xs text-base-content/70">{cat}</span>
                                    <span className="text-xs font-bold text-gray-800">
                                        ₱{value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* ── BOTTOM ROW — stacked mobile, side-by-side lg ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

                {/* Audit Logs */}
                <div className="lg:col-span-2 border border-base-200 rounded-2xl bg-base-100 overflow-hidden shadow-sm">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-base-200 flex items-center justify-between"
                        style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                        <p className="font-bold text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center">
                                <MdHistory className="text-white text-xs" />
                            </span>
                            Audit Logs
                        </p>
                        <span className="text-xs text-base-content/40 bg-base-100 border border-base-200 px-2 py-0.5 rounded-full">
                            Last 30 actions
                        </span>
                    </div>

                    <div className="overflow-y-auto max-h-64 sm:max-h-72 divide-y divide-gray-50">
                        {loading ? (
                            <div className="flex items-center justify-center py-10 gap-2 text-base-content/40">
                                <span className="loading loading-spinner loading-sm" />
                                <span className="text-sm">Loading logs...</span>
                            </div>
                        ) : auditLogs.length === 0 ? (
                            <div className="text-center py-10 text-base-content/40">
                                <MdHistory className="text-3xl mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No audit logs yet</p>
                            </div>
                        ) : auditLogs.map(log => (
                            <div key={log.id}
                                className="flex items-start gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-base-200 transition-colors">
                                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ background: actionDotColor(log.action) }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-base-content/80">
                                        <span className="font-bold">{log.profiles?.name || 'Unknown'}</span>
                                        {' · '}
                                        <span className="text-base-content/60">{log.description}</span>
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                                            ${log.profiles?.role === 'admin'
                                                ? 'bg-black text-white'
                                                : 'bg-base-200 text-base-content/60'}`}>
                                            {log.profiles?.role || 'unknown'}
                                        </span>
                                        <span className="text-xs text-base-content/40">
                                            {new Date(log.created_at).toLocaleString('en-PH', {
                                                month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Activity */}
                <div className="border border-base-200 rounded-2xl bg-base-100 overflow-hidden shadow-sm">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-base-200"
                        style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                        <p className="font-bold text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                                <MdPeople className="text-white text-xs" />
                            </span>
                            User Activity
                        </p>
                        <p className="text-xs text-base-content/40 mt-0.5">Transactions per user</p>
                    </div>

                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {staffActivity.length === 0 ? (
                            <div className="text-center py-6 text-base-content/40">
                                <MdPeople className="text-3xl mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No activity yet</p>
                            </div>
                        ) : staffActivity.map((u, i) => (
                            <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 transition-colors">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                                    style={{
                                        background: i === 0
                                            ? 'linear-gradient(135deg,#f59e0b,#ef4444)'
                                            : i === 1
                                                ? 'linear-gradient(135deg,#6b7280,#9ca3af)'
                                                : 'linear-gradient(135deg,#92400e,#b45309)'
                                    }}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{u.name || 'Unknown'}</p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                                        ${u.role === 'admin' ? 'bg-black text-white' : 'bg-base-200 text-base-content/60'}`}>
                                        {u.role}
                                    </span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-black text-gray-800">{u.txCount}</p>
                                    <p className="text-xs text-base-content/40">moves</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Alert box */}
                    {(lowStock > 0 || outOfStock > 0) && (
                        <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 p-3 rounded-xl border"
                            style={{ background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', borderColor: '#fed7aa' }}>
                            <p className="text-xs font-bold text-orange-600 flex items-center gap-1.5 mb-0.5">
                                <MdWarning /> Stock Alert
                            </p>
                            {lowStock > 0 && (
                                <p className="text-xs text-orange-500">{lowStock} item{lowStock > 1 ? 's' : ''} low on stock</p>
                            )}
                            {outOfStock > 0 && (
                                <p className="text-xs text-red-500">{outOfStock} item{outOfStock > 1 ? 's' : ''} out of stock</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </AdminLayout>
    )
}

export default AdminDashboard