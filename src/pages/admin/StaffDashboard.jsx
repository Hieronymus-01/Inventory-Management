import React, { useState, useEffect, useContext } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import BarcodeScanner from '../../components/BarcodeScanner'
import {
    MdInventory, MdWarning, MdTrendingUp, MdTrendingDown,
    MdHistory, MdCheckCircle
} from 'react-icons/md'
import { FaBoxOpen } from 'react-icons/fa'

const StaffDashboard = () => {
    const { profile } = useContext(SessionContext)
    const [items, setItems] = useState([])
    const [myTransactions, setMyTransactions] = useState([])
    const [lowItems, setLowItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [scanResult, setScanResult] = useState(null)
    const [stockModal, setStockModal] = useState(null)
    const [type, setType] = useState('stock_in')
    const [qty, setQty] = useState(1)
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')

    const fetchData = async () => {
        const [{ data: itemsData }, { data: txData }] = await Promise.all([
            supabase.from('inventory_items').select('*').eq('is_active', true),
            supabase.from('stock_transactions')
                .select('*, inventory_items(item_name, unit)')
                .eq('performed_by', profile?.id)
                .order('created_at', { ascending: false })
                .limit(10),
        ])
        if (itemsData) {
            setItems(itemsData)
            setLowItems(itemsData.filter(i => i.quantity <= i.reorder_level).slice(0, 5))
        }
        if (txData) setMyTransactions(txData)
        setLoading(false)
    }

    useEffect(() => {
        if (profile?.id) fetchData()
    }, [profile])

    // Stats
    const totalItems = items.length
    const outOfStock = items.filter(i => i.quantity === 0).length
    const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level).length

    // Today's activity by this staff
    const today = new Date().toDateString()
    const todayTx = myTransactions.filter(t => new Date(t.created_at).toDateString() === today)
    const todayIn = todayTx.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0)
    const todayOut = todayTx.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0)

    const handleScan = (barcode) => {
        const found = items.find(i => i.barcode === barcode)
        if (found) {
            setScanResult(found)
            setStockModal(found)
            setQty(1)
            setNotes('')
        } else {
            setScanResult(null)
            alert(`No item found with barcode: ${barcode}\nPlease ask admin to add this item.`)
        }
    }

    const handleStockUpdate = async () => {
        if (!qty || qty <= 0) { alert('Enter a valid quantity.'); return }
        setSaving(true)
        const newQty = type === 'stock_in'
            ? stockModal.quantity + qty
            : Math.max(0, stockModal.quantity - qty)

        const { error: txError } = await supabase.from('stock_transactions').insert({
            item_id: stockModal.id, type, quantity: qty,
            notes, performed_by: profile?.id,
        })
        const { error: updateError } = await supabase.from('inventory_items')
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq('id', stockModal.id)

        // Log to audit
        await supabase.from('audit_logs').insert({
            performed_by: profile?.id,
            action: type,
            description: `${type === 'stock_in' ? 'stocked in' : 'stocked out'} ${qty} x ${stockModal.item_name}`,
            table_name: 'inventory_items',
            record_id: stockModal.id,
        })

        if (!txError && !updateError) {
            setSuccessMsg(`${type === 'stock_in' ? '✅ Stock In' : '📤 Stock Out'}: ${qty} x ${stockModal.item_name}`)
            setTimeout(() => setSuccessMsg(''), 3000)
            setStockModal(null)
            setScanResult(null)
            fetchData()
        } else {
            alert(txError?.message || updateError?.message)
        }
        setSaving(false)
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                <p className="text-base-content/60 text-sm">
                    Welcome, <span className="font-semibold text-black">{profile?.name}</span> •{' '}
                    {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Success Toast */}
            {successMsg && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm font-medium">
                    <MdCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                    {successMsg}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="border border-base-200 rounded-xl p-5 bg-base-100">
                    <p className="text-sm text-base-content/60 mb-1 flex items-center gap-1"><MdInventory className="text-gray-300" /> Total Items</p>
                    <p className="text-2xl font-bold">{totalItems}</p>
                    <p className="text-xs text-base-content/40 mt-1">in inventory</p>
                </div>
                <div className="border border-base-200 rounded-xl p-5 bg-base-100">
                    <p className="text-sm text-base-content/60 mb-1 flex items-center gap-1"><MdWarning className={lowStock > 0 ? 'text-orange-400' : 'text-gray-300'} /> Low Stock</p>
                    <p className={`text-2xl font-bold ${lowStock > 0 ? 'text-orange-500' : 'text-black'}`}>{lowStock}</p>
                    <p className="text-xs text-base-content/40 mt-1">need reorder</p>
                </div>
                <div className="border border-base-200 rounded-xl p-5 bg-base-100">
                    <p className="text-sm text-base-content/60 mb-1 flex items-center gap-1"><MdTrendingUp className="text-green-400" /> Today In</p>
                    <p className="text-2xl font-bold text-green-600">+{todayIn}</p>
                    <p className="text-xs text-base-content/40 mt-1">your stock ins</p>
                </div>
                <div className="border border-base-200 rounded-xl p-5 bg-base-100">
                    <p className="text-sm text-base-content/60 mb-1 flex items-center gap-1"><MdTrendingDown className="text-red-400" /> Today Out</p>
                    <p className="text-2xl font-bold text-red-500">-{todayOut}</p>
                    <p className="text-xs text-base-content/40 mt-1">your stock outs</p>
                </div>
            </div>

            {/* Barcode Scanner — Main Feature for Staff */}
            <div className="mb-6">
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">Quick Scan to Update Stock</p>
                <BarcodeScanner onScan={handleScan} label="Scan Item to Stock In / Out" />
            </div>

            {/* Stock Modal inline */}
            {stockModal && (
                <div className="mb-6 border-2 border-black rounded-xl bg-base-100 p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="font-bold text-lg">{stockModal.item_name}</p>
                            <p className="text-xs text-base-content/40 font-mono">{stockModal.barcode}</p>
                            <p className="text-sm mt-1">
                                Current Stock: <span className={`font-bold ${stockModal.quantity === 0 ? 'text-red-500' : 'text-black'}`}>
                                    {stockModal.quantity} {stockModal.unit}
                                </span>
                            </p>
                        </div>
                        <button onClick={() => setStockModal(null)} className="btn btn-ghost btn-sm btn-circle">✕</button>
                    </div>

                    {/* Type Toggle */}
                    <div className="flex rounded-full bg-base-200 p-1 mb-4">
                        {['stock_in', 'stock_out'].map(t => (
                            <button key={t} onClick={() => setType(t)}
                                className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors flex items-center justify-center gap-2
                  ${type === t ? 'bg-base-100 shadow text-black' : 'text-base-content/60'}`}>
                                {t === 'stock_in' ? <MdTrendingUp className="text-green-500" /> : <MdTrendingDown className="text-red-500" />}
                                {t === 'stock_in' ? 'Stock In' : 'Stock Out'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1 block">Quantity</label>
                            <input type="number" min="1" className="input input-bordered w-full text-xl font-bold text-center"
                                value={qty} onChange={e => setQty(parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1 block">Notes</label>
                            <input type="text" className="input input-bordered w-full"
                                value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="e.g. Job #001, Supplier delivery" />
                        </div>
                    </div>

                    <div className={`rounded-xl p-3 text-sm font-medium text-center mb-4
            ${type === 'stock_in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {type === 'stock_in'
                            ? `After update: ${stockModal.quantity + qty} ${stockModal.unit} (+${qty})`
                            : `After update: ${Math.max(0, stockModal.quantity - qty)} ${stockModal.unit} (-${qty})`}
                    </div>

                    <button onClick={handleStockUpdate} disabled={saving}
                        className={`btn w-full rounded-full ${type === 'stock_in' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                        {saving ? 'Updating...' : type === 'stock_in' ? '✅ Confirm Stock In' : '📤 Confirm Stock Out'}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* My Recent Activity */}
                <div className="border border-base-200 rounded-xl bg-base-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-base-200 bg-base-200">
                        <p className="font-semibold text-sm flex items-center gap-2">
                            <MdHistory /> My Recent Activity
                        </p>
                        <p className="text-xs text-base-content/40">Your last 10 transactions</p>
                    </div>
                    <div className="overflow-y-auto max-h-64">
                        {loading ? (
                            <p className="text-center py-6 text-base-content/40 text-sm">Loading...</p>
                        ) : myTransactions.length === 0 ? (
                            <p className="text-center py-6 text-base-content/40 text-sm">No transactions yet</p>
                        ) : myTransactions.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-base-200">
                                <div>
                                    <p className="text-sm font-medium">{tx.inventory_items?.item_name}</p>
                                    <p className="text-xs text-base-content/40">{new Date(tx.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                    {tx.notes && <p className="text-xs text-base-content/40 italic">{tx.notes}</p>}
                                </div>
                                <span className={`badge badge-sm font-bold ${tx.type === 'stock_in' ? 'badge-success' : 'badge-error'}`}>
                                    {tx.type === 'stock_in' ? `+${tx.quantity}` : `-${tx.quantity}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="border border-base-200 rounded-xl bg-base-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-base-200 bg-base-200">
                        <p className="font-semibold text-sm flex items-center gap-2">
                            <MdWarning className="text-orange-400" /> Low Stock Alerts
                        </p>
                        <p className="text-xs text-base-content/40">Items that need attention</p>
                    </div>
                    <div>
                        {loading ? (
                            <p className="text-center py-6 text-base-content/40 text-sm">Loading...</p>
                        ) : lowItems.length === 0 ? (
                            <div className="flex flex-col items-center py-8 gap-2">
                                <MdCheckCircle className="text-green-400 text-3xl" />
                                <p className="text-sm text-base-content/40">All items are sufficiently stocked!</p>
                            </div>
                        ) : lowItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-base-200">
                                <div>
                                    <p className="text-sm font-medium">{item.item_name}</p>
                                    <p className="text-xs text-base-content/40">{item.category} • {item.location || 'No location'}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${item.quantity === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                        {item.quantity} {item.unit}
                                    </p>
                                    <p className="text-xs text-base-content/40">min: {item.reorder_level}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

export default StaffDashboard