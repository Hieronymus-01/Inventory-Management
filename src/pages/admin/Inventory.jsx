import React, { useState, useEffect, useContext } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import BarcodeScanner from '../../components/BarcodeScanner'
import {
    MdAdd, MdSearch, MdEdit, MdDelete,
    MdInventory, MdWarning, MdTrendingUp, MdTrendingDown, MdClose,
    MdDownload, MdFileDownload
} from 'react-icons/md'
import { FaBarcode } from 'react-icons/fa'
import { useToast } from '../../contexts/ToastContext'
import { exportInventoryCSV, exportTransactionsCSV, exportLowStockCSV } from '../../utils/exportData'

// ── Category Badge ────────────────────────────────────────────
const CategoryBadge = ({ category }) => {
    const colors = {
        'AC Unit': 'badge-primary',
        'Parts': 'badge-secondary',
        'Supplies': 'badge-accent',
        'Tools': 'badge-warning',
        'Equipment': 'badge-info',
    }
    return <span className={`badge badge-sm ${colors[category] || 'badge-ghost'}`}>{category}</span>
}

// ── Stock Status ──────────────────────────────────────────────
const StockStatus = ({ quantity, reorderLevel }) => {
    if (quantity === 0) return <span className="text-xs font-bold text-red-500">OUT</span>
    if (quantity <= reorderLevel) return <span className="text-xs font-bold text-orange-500">LOW</span>
    return <span className="text-xs font-bold text-green-600">OK</span>
}

// ── Add/Edit Item Modal ───────────────────────────────────────
const ItemModal = ({ item, onClose, onSave, scannedBarcode, profile, toast }) => {
    const [form, setForm] = useState({
        barcode: item?.barcode || scannedBarcode || '',
        item_name: item?.item_name || '',
        category: item?.category || 'AC Unit',
        brand: item?.brand || '',
        model: item?.model || '',
        unit: item?.unit || 'pcs',
        quantity: item?.quantity || 0,
        reorder_level: item?.reorder_level || 5,
        unit_price: item?.unit_price || 0,
        location: item?.location || '',
        description: item?.description || '',
    })
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!form.barcode || !form.item_name) {
            toast.error('Missing Fields', 'Barcode and Item Name are required.')
            return
        }
        setSaving(true)
        const { error } = item
            ? await supabase.from('inventory_items').update({ ...form, updated_at: new Date().toISOString() }).eq('id', item.id)
            : await supabase.from('inventory_items').insert(form)
        if (error) {
            toast.error('Save Failed', error.message)
        } else {
            toast.success(
                item ? 'Item Updated!' : 'Item Added!',
                item ? `${form.item_name} has been updated.` : `${form.item_name} added to inventory.`
            )
            onSave()
        }
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
            <div className="bg-base-100 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-base-200 sticky top-0 bg-base-100 z-10">
                    <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <MdInventory className="text-black" />
                        {item ? 'Edit Item' : 'Add New Item'}
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><MdClose /></button>
                </div>

                <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4">
                    {/* Barcode */}
                    <div>
                        <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Barcode / Item Code *</label>
                        <div className="flex gap-2">
                            <input type="text" className="input input-bordered w-full font-mono text-sm"
                                value={form.barcode}
                                onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))}
                                placeholder="Scan or type barcode" />
                            <div className="btn btn-neutral btn-square"><FaBarcode className="text-lg" /></div>
                        </div>
                    </div>

                    {/* Item Name */}
                    <div>
                        <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Item Name *</label>
                        <input type="text" className="input input-bordered w-full text-sm"
                            value={form.item_name}
                            onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))}
                            placeholder="e.g. Split Type Aircon 1HP" />
                    </div>

                    {/* Category + Unit */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Category</label>
                            <select className="select select-bordered w-full text-sm" value={form.category}
                                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                {['AC Unit', 'Parts', 'Supplies', 'Tools', 'Equipment'].map(c =>
                                    <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Unit</label>
                            <select className="select select-bordered w-full text-sm" value={form.unit}
                                onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                                {['pcs', 'unit', 'set', 'meter', 'roll', 'tank', 'box', 'liter'].map(u =>
                                    <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Brand + Model */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Brand</label>
                            <input type="text" className="input input-bordered w-full text-sm" value={form.brand}
                                onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                                placeholder="e.g. Carrier, Daikin" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Model</label>
                            <input type="text" className="input input-bordered w-full text-sm" value={form.model}
                                onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
                                placeholder="e.g. XPower 1HP" />
                        </div>
                    </div>

                    {/* Qty + Reorder + Price */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div>
                            <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Qty</label>
                            <input type="number" min="0" className="input input-bordered w-full text-sm"
                                value={form.quantity}
                                onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Reorder</label>
                            <input type="number" min="0" className="input input-bordered w-full text-sm"
                                value={form.reorder_level}
                                onChange={e => setForm(p => ({ ...p, reorder_level: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Price (₱)</label>
                            <input type="number" min="0" step="0.01" className="input input-bordered w-full text-sm"
                                value={form.unit_price}
                                onChange={e => setForm(p => ({ ...p, unit_price: parseFloat(e.target.value) || 0 }))} />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Storage Location</label>
                        <input type="text" className="input input-bordered w-full text-sm" value={form.location}
                            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                            placeholder="e.g. Warehouse A, Shelf B1" />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Description</label>
                        <textarea className="textarea textarea-bordered w-full text-sm" rows={2}
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Optional notes" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-base-200 bg-base-200 rounded-b-2xl sticky bottom-0">
                    <button onClick={onClose} className="btn btn-ghost rounded-full btn-sm sm:btn-md">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn btn-neutral rounded-full btn-sm sm:btn-md">
                        {saving ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Stock In/Out Modal ────────────────────────────────────────
const StockModal = ({ item, onClose, onSave, profile, toast }) => {
    const [type, setType] = useState('stock_in')
    const [qty, setQty] = useState(1)
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!qty || qty <= 0) {
            toast.error('Invalid Quantity', 'Please enter a valid quantity greater than 0.')
            return
        }
        setSaving(true)
        const newQty = type === 'stock_in'
            ? item.quantity + qty
            : Math.max(0, item.quantity - qty)

        const { error: txError } = await supabase.from('stock_transactions').insert({
            item_id: item.id, type, quantity: qty, notes, performed_by: profile?.id,
        })
        const { error: updateError } = await supabase.from('inventory_items')
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq('id', item.id)

        if (txError || updateError) {
            toast.error('Update Failed', txError?.message || updateError?.message)
        } else {
            toast.success(
                type === 'stock_in' ? 'Stock Added!' : 'Stock Removed!',
                `${item.item_name}: ${type === 'stock_in' ? '+' : '-'}${qty} units. New qty: ${newQty}`
            )
            onSave()
        }
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
            <div className="bg-base-100 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md">
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-base-200">
                    <h2 className="text-base sm:text-lg font-bold">Stock Update</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><MdClose /></button>
                </div>
                <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4">
                    <div className="bg-base-200 rounded-xl p-3 sm:p-4">
                        <p className="font-bold text-sm">{item.item_name}</p>
                        <p className="text-xs text-base-content/40 font-mono">{item.barcode}</p>
                        <p className="text-sm mt-1">
                            Current Stock: <span className="font-bold">{item.quantity} {item.unit}</span>
                        </p>
                    </div>

                    <div className="flex rounded-full bg-base-200 p-1">
                        {['stock_in', 'stock_out'].map(t => (
                            <button key={t} onClick={() => setType(t)}
                                className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors flex items-center justify-center gap-1 sm:gap-2
                                    ${type === t ? 'bg-base-100 shadow text-black' : 'text-base-content/60'}`}>
                                {t === 'stock_in'
                                    ? <MdTrendingUp className="text-green-500" />
                                    : <MdTrendingDown className="text-red-500" />}
                                <span>{t === 'stock_in' ? 'Stock In' : 'Stock Out'}</span>
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Quantity</label>
                        <input
                            type="number" min="1"
                            className="input input-bordered w-full text-xl font-bold text-center"
                            value={qty}
                            onChange={e => setQty(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div className={`rounded-xl p-3 text-sm font-medium text-center
                        ${type === 'stock_in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {type === 'stock_in'
                            ? `After: ${item.quantity + qty} ${item.unit} (+${qty})`
                            : `After: ${Math.max(0, item.quantity - qty)} ${item.unit} (-${qty})`}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-base-content/60 mb-1 block uppercase tracking-wider">Notes</label>
                        <input type="text" className="input input-bordered w-full text-sm" value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Received from supplier, Used for Job #001" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-base-200 bg-base-200 rounded-b-2xl">
                    <button onClick={onClose} className="btn btn-ghost rounded-full btn-sm sm:btn-md">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className={`btn rounded-full btn-sm sm:btn-md ${type === 'stock_in'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-500 text-white hover:bg-red-600'}`}>
                        {saving ? 'Updating...' : type === 'stock_in' ? 'Stock In' : 'Stock Out'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Mobile Item Card (shown on small screens instead of table) ──
const ItemCard = ({ item, isAdmin, onStock, onEdit, onDelete }) => (
    <div className={`bg-base-100 rounded-xl border p-4 space-y-2
        ${item.quantity === 0 ? 'border-red-200' : item.quantity <= item.reorder_level ? 'border-orange-200' : 'border-base-200'}`}>
        <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.item_name}</p>
                <p className="text-xs text-base-content/40 font-mono flex items-center gap-1 mt-0.5">
                    <FaBarcode className="text-xs" /> {item.barcode}
                </p>
            </div>
            <StockStatus quantity={item.quantity} reorderLevel={item.reorder_level} />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
            <CategoryBadge category={item.category} />
            {item.brand && <span className="text-xs text-base-content/50">{item.brand} {item.model}</span>}
        </div>

        <div className="flex items-center justify-between">
            <div>
                <span className={`text-lg font-black ${item.quantity === 0
                    ? 'text-red-500'
                    : item.quantity <= item.reorder_level
                        ? 'text-orange-500'
                        : 'text-base-content'}`}>
                    {item.quantity}
                </span>
                <span className="text-xs text-base-content/40 ml-1">{item.unit}</span>
                <p className="text-xs text-base-content/40">₱{Number(item.unit_price).toLocaleString()}/unit</p>
            </div>
            <div className="flex gap-1">
                <button
                    onClick={() => onStock(item)}
                    className="btn btn-xs btn-ghost rounded-full gap-1 text-green-600 hover:bg-green-50">
                    <MdTrendingUp /> Stock
                </button>
                {isAdmin && (
                    <>
                        <button onClick={() => onEdit(item)}
                            className="btn btn-xs btn-ghost rounded-full text-blue-500 hover:bg-blue-50">
                            <MdEdit />
                        </button>
                        <button onClick={() => onDelete(item.id)}
                            className="btn btn-xs btn-ghost rounded-full text-red-500 hover:bg-red-50">
                            <MdDelete />
                        </button>
                    </>
                )}
            </div>
        </div>
        {item.location && (
            <p className="text-xs text-base-content/40">📍 {item.location}</p>
        )}
    </div>
)

// ── Main Inventory Page ───────────────────────────────────────
const Inventory = () => {
    const { profile } = useContext(SessionContext)
    const isAdmin = profile?.role === 'admin'

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('All')
    const [filterStock, setFilterStock] = useState('All')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showStockModal, setShowStockModal] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [stockItem, setStockItem] = useState(null)
    const [scannedBarcode, setScannedBarcode] = useState('')
    const toast = useToast()

    const fetchItems = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('inventory_items').select('*').eq('is_active', true).order('item_name')
        if (data) setItems(data)
        setLoading(false)
    }

    useEffect(() => { fetchItems() }, [])

    const totalItems = items.length
    const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level).length
    const outOfStock = items.filter(i => i.quantity === 0).length
    const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)

    const filtered = items.filter(item => {
        const matchSearch = !search ||
            item.item_name.toLowerCase().includes(search.toLowerCase()) ||
            item.barcode.toLowerCase().includes(search.toLowerCase()) ||
            item.brand?.toLowerCase().includes(search.toLowerCase())
        const matchCat = filterCategory === 'All' || item.category === filterCategory
        const matchStock = filterStock === 'All' ||
            (filterStock === 'Low' && item.quantity <= item.reorder_level && item.quantity > 0) ||
            (filterStock === 'Out' && item.quantity === 0) ||
            (filterStock === 'OK' && item.quantity > item.reorder_level)
        return matchSearch && matchCat && matchStock
    })

    const handleScan = (barcode) => {
        const found = items.find(i => i.barcode === barcode)
        if (found) {
            setStockItem(found)
            setShowStockModal(true)
        } else if (isAdmin) {
            setScannedBarcode(barcode)
            setEditItem(null)
            setShowAddModal(true)
        } else {
            alert(`No item found with barcode: ${barcode}\nPlease ask admin to add this item.`)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Deactivate this item?')) return
        const item = items.find(i => i.id === id)
        await supabase.from('inventory_items').update({ is_active: false }).eq('id', id)
        toast.warning('Item Deactivated', `${item?.item_name} has been removed from active inventory.`)
        fetchItems()
    }

    return (
        <AdminLayout>

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Inventory</h1>
                    <p className="text-base-content/60 text-xs sm:text-sm">AC units, parts, supplies, tools & equipment</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {/* Export dropdown */}
                    <div className="dropdown dropdown-end">
                        <button tabIndex={0} className="btn btn-neutral btn-sm rounded-full gap-1.5 btn-outline">
                            <MdDownload /> Export
                        </button>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-2xl shadow-xl border border-base-200 w-52 p-2 z-50 mt-2">
                            <li className="menu-title text-xs text-base-content/40 px-3 py-1">Download as CSV</li>
                            <li>
                                <button onClick={() => {
                                    exportInventoryCSV(items)
                                    toast.success('Downloaded!', 'Inventory exported as CSV.')
                                }} className="flex items-center gap-2 text-sm">
                                    <MdFileDownload className="text-green-500" /> Full Inventory
                                </button>
                            </li>
                            <li>
                                <button onClick={() => {
                                    exportLowStockCSV(items)
                                    toast.warning('Downloaded!', 'Low stock report exported as CSV.')
                                }} className="flex items-center gap-2 text-sm">
                                    <MdFileDownload className="text-orange-500" /> Low Stock Report
                                </button>
                            </li>
                        </ul>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => { setEditItem(null); setScannedBarcode(''); setShowAddModal(true) }}
                            className="btn btn-neutral btn-sm rounded-full gap-1.5">
                            <MdAdd /> Add Item
                        </button>
                    )}
                </div>
            </div>

            {/* ── Barcode Scanner ── */}
            <div className="mb-4 sm:mb-6">
                <BarcodeScanner onScan={handleScan} label="Barcode / QR Scanner" />
            </div>

            {/* ── Stats — 2 cols mobile, 4 cols desktop ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {[
                    { label: 'Total Items', value: totalItems, sub: 'active items', color: 'text-base-content' },
                    { label: 'Low Stock', value: lowStock, sub: 'need reorder', color: 'text-orange-500', warn: lowStock > 0 },
                    { label: 'Out of Stock', value: outOfStock, sub: 'unavailable', color: 'text-red-500', warn: outOfStock > 0 },
                    {
                        label: 'Total Value',
                        value: `₱${totalValue >= 1000000
                            ? (totalValue / 1000000).toFixed(1) + 'M'
                            : totalValue >= 1000
                                ? (totalValue / 1000).toFixed(0) + 'K'
                                : totalValue.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`,
                        sub: 'inventory worth',
                        color: 'text-base-content'
                    },
                ].map(({ label, value, sub, color, warn }) => (
                    <div key={label} className="border border-base-200 rounded-xl p-3 sm:p-5 bg-base-100">
                        <p className="text-xs text-base-content/60 mb-1 flex items-center gap-1">
                            {warn && <MdWarning className="text-orange-400 flex-shrink-0" />}
                            <span className="truncate">{label}</span>
                        </p>
                        <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-base-content/40 mt-0.5 sm:mt-1">{sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                <div className="relative flex-1">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                    <input
                        type="text"
                        className="input input-bordered input-sm w-full pl-9"
                        placeholder="Search items, barcodes, brands..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="select select-bordered select-sm flex-1 sm:flex-none"
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}>
                        <option value="All">All Categories</option>
                        {['AC Unit', 'Parts', 'Supplies', 'Tools', 'Equipment'].map(c =>
                            <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        className="select select-bordered select-sm flex-1 sm:flex-none"
                        value={filterStock}
                        onChange={e => setFilterStock(e.target.value)}>
                        <option value="All">All Stock</option>
                        <option value="OK">In Stock</option>
                        <option value="Low">Low Stock</option>
                        <option value="Out">Out of Stock</option>
                    </select>
                </div>
            </div>

            {/* ── Mobile Card View (visible on small screens) ── */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-base-content/40 text-sm">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-10 text-base-content/40 text-sm">No items found.</div>
                ) : filtered.map(item => (
                    <ItemCard
                        key={item.id}
                        item={item}
                        isAdmin={isAdmin}
                        onStock={(i) => { setStockItem(i); setShowStockModal(true) }}
                        onEdit={(i) => { setEditItem(i); setShowAddModal(true) }}
                        onDelete={handleDelete}
                    />
                ))}
                <div className="text-xs text-base-content/40 pt-1 pb-2">
                    Showing {filtered.length} of {totalItems} items
                    {!isAdmin && <span className="ml-2 text-orange-400">· Staff view</span>}
                </div>
            </div>

            {/* ── Desktop Table View (hidden on small screens) ── */}
            <div className="hidden md:block border border-base-200 rounded-xl bg-base-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                        <thead className="bg-base-200 border-b border-base-200">
                            <tr>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Barcode</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Item</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Category</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Brand/Model</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Qty</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Status</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Unit Price</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Location</th>
                                <th className="text-xs font-bold text-base-content/60 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="text-center py-8 text-base-content/40">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-8 text-base-content/40">No items found.</td></tr>
                            ) : filtered.map(item => (
                                <tr key={item.id} className="hover:bg-base-200 border-b border-base-200 last:border-0">
                                    <td>
                                        <span className="font-mono text-xs bg-base-200 px-2 py-1 rounded flex items-center gap-1">
                                            <FaBarcode className="text-base-content/40 text-xs" />{item.barcode}
                                        </span>
                                    </td>
                                    <td>
                                        <p className="font-semibold text-sm">{item.item_name}</p>
                                        {item.description && (
                                            <p className="text-xs text-base-content/40 truncate max-w-32">{item.description}</p>
                                        )}
                                    </td>
                                    <td><CategoryBadge category={item.category} /></td>
                                    <td>
                                        <p className="text-sm">{item.brand}</p>
                                        <p className="text-xs text-base-content/40">{item.model}</p>
                                    </td>
                                    <td>
                                        <span className={`font-bold text-sm ${item.quantity === 0
                                            ? 'text-red-500'
                                            : item.quantity <= item.reorder_level
                                                ? 'text-orange-500'
                                                : 'text-base-content'}`}>
                                            {item.quantity}
                                        </span>
                                        <span className="text-xs text-base-content/40 ml-1">{item.unit}</span>
                                    </td>
                                    <td>
                                        <StockStatus quantity={item.quantity} reorderLevel={item.reorder_level} />
                                    </td>
                                    <td className="text-sm font-medium">₱{Number(item.unit_price).toLocaleString()}</td>
                                    <td className="text-xs text-base-content/60">{item.location || '—'}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { setStockItem(item); setShowStockModal(true) }}
                                                className="btn btn-xs btn-ghost rounded-full tooltip"
                                                data-tip="Stock In/Out">
                                                <MdTrendingUp className="text-green-500" />
                                            </button>
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => { setEditItem(item); setShowAddModal(true) }}
                                                        className="btn btn-xs btn-ghost rounded-full tooltip"
                                                        data-tip="Edit">
                                                        <MdEdit className="text-blue-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="btn btn-xs btn-ghost rounded-full tooltip"
                                                        data-tip="Remove">
                                                        <MdDelete className="text-red-500" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-base-200 text-xs text-base-content/40">
                    Showing {filtered.length} of {totalItems} items
                    {!isAdmin && <span className="ml-2 text-orange-400">• Staff view: edit/delete disabled</span>}
                </div>
            </div>

            {/* ── Modals ── */}
            {showAddModal && isAdmin && (
                <ItemModal
                    item={editItem}
                    scannedBarcode={scannedBarcode}
                    profile={profile}
                    toast={toast}
                    onClose={() => { setShowAddModal(false); setEditItem(null); setScannedBarcode('') }}
                    onSave={() => { setShowAddModal(false); setEditItem(null); setScannedBarcode(''); fetchItems() }}
                />
            )}
            {showStockModal && stockItem && (
                <StockModal
                    item={stockItem}
                    profile={profile}
                    toast={toast}
                    onClose={() => { setShowStockModal(false); setStockItem(null) }}
                    onSave={() => { setShowStockModal(false); setStockItem(null); fetchItems() }}
                />
            )}
        </AdminLayout>
    )
}

export default Inventory