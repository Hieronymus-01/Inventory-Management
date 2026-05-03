import React, { useState, useEffect, useContext } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import BarcodeScanner from '../../components/BarcodeScanner'
import {
    MdAdd, MdSearch, MdEdit, MdDelete,
    MdInventory, MdWarning, MdTrendingUp, MdTrendingDown, MdClose
} from 'react-icons/md'
import { FaBarcode } from 'react-icons/fa'

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
    if (quantity === 0) return <span className="text-xs font-bold text-red-500">OUT OF STOCK</span>
    if (quantity <= reorderLevel) return <span className="text-xs font-bold text-orange-500">LOW STOCK</span>
    return <span className="text-xs font-bold text-green-600">IN STOCK</span>
}

// ── Add/Edit Item Modal ───────────────────────────────────────
const ItemModal = ({ item, onClose, onSave, scannedBarcode }) => {
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
            alert('Barcode and Item Name are required.')
            return
        }
        setSaving(true)
        const { error } = item
            ? await supabase.from('inventory_items').update({ ...form, updated_at: new Date().toISOString() }).eq('id', item.id)
            : await supabase.from('inventory_items').insert(form)
        if (error) alert(error.message)
        else onSave()
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <MdInventory className="text-black" />
                        {item ? 'Edit Item' : 'Add New Item'}
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><MdClose /></button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">
                            Barcode / Item Code *
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input input-bordered w-full font-mono"
                                value={form.barcode}
                                onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))}
                                placeholder="Scan or type barcode"
                            />
                            <div className="btn btn-neutral btn-square">
                                <FaBarcode className="text-lg" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Item Name *</label>
                        <input type="text" className="input input-bordered w-full"
                            value={form.item_name}
                            onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))}
                            placeholder="e.g. Split Type Aircon 1HP" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Category</label>
                            <select className="select select-bordered w-full"
                                value={form.category}
                                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                {['AC Unit', 'Parts', 'Supplies', 'Tools', 'Equipment'].map(c =>
                                    <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Unit</label>
                            <select className="select select-bordered w-full"
                                value={form.unit}
                                onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                                {['pcs', 'unit', 'set', 'meter', 'roll', 'tank', 'box', 'liter'].map(u =>
                                    <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Brand</label>
                            <input type="text" className="input input-bordered w-full"
                                value={form.brand}
                                onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                                placeholder="e.g. Carrier, Daikin" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Model</label>
                            <input type="text" className="input input-bordered w-full"
                                value={form.model}
                                onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
                                placeholder="e.g. XPower 1HP" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Quantity</label>
                            <input type="number" min="0" className="input input-bordered w-full"
                                value={form.quantity}
                                onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Reorder Level</label>
                            <input type="number" min="0" className="input input-bordered w-full"
                                value={form.reorder_level}
                                onChange={e => setForm(p => ({ ...p, reorder_level: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Unit Price (₱)</label>
                            <input type="number" min="0" step="0.01" className="input input-bordered w-full"
                                value={form.unit_price}
                                onChange={e => setForm(p => ({ ...p, unit_price: parseFloat(e.target.value) || 0 }))} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Storage Location</label>
                        <input type="text" className="input input-bordered w-full"
                            value={form.location}
                            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                            placeholder="e.g. Warehouse A, Shelf B1" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Description</label>
                        <textarea className="textarea textarea-bordered w-full" rows={2}
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Optional notes about this item" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button onClick={onClose} className="btn btn-ghost rounded-full">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn btn-neutral rounded-full">
                        {saving ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Stock In/Out Modal ────────────────────────────────────────
const StockModal = ({ item, onClose, onSave, profile }) => {
    const [type, setType] = useState('stock_in')
    const [qty, setQty] = useState(1)
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!qty || qty <= 0) { alert('Enter a valid quantity.'); return }
        setSaving(true)
        const newQty = type === 'stock_in'
            ? item.quantity + qty
            : Math.max(0, item.quantity - qty)

        const { error: txError } = await supabase.from('stock_transactions').insert({
            item_id: item.id, type, quantity: qty,
            notes, performed_by: profile?.id,
        })
        const { error: updateError } = await supabase.from('inventory_items')
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq('id', item.id)

        if (txError || updateError) alert(txError?.message || updateError?.message)
        else onSave()
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold">Stock Update</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><MdClose /></button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="font-bold text-sm">{item.item_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{item.barcode}</p>
                        <p className="text-sm mt-1">Current Stock: <span className="font-bold">{item.quantity} {item.unit}</span></p>
                    </div>

                    <div className="flex rounded-full bg-gray-100 p-1">
                        {['stock_in', 'stock_out'].map(t => (
                            <button key={t} onClick={() => setType(t)}
                                className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors flex items-center justify-center gap-2
                  ${type === t ? 'bg-white shadow text-black' : 'text-gray-500'}`}>
                                {t === 'stock_in' ? <MdTrendingUp className="text-green-500" /> : <MdTrendingDown className="text-red-500" />}
                                {t === 'stock_in' ? 'Stock In' : 'Stock Out'}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Quantity</label>
                        <input type="number" min="1" className="input input-bordered w-full text-xl font-bold text-center"
                            value={qty}
                            onChange={e => setQty(parseInt(e.target.value) || 0)} />
                    </div>

                    <div className={`rounded-xl p-3 text-sm font-medium text-center
            ${type === 'stock_in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {type === 'stock_in'
                            ? `After: ${item.quantity + qty} ${item.unit} (+${qty})`
                            : `After: ${Math.max(0, item.quantity - qty)} ${item.unit} (-${qty})`}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wider">Notes (Optional)</label>
                        <input type="text" className="input input-bordered w-full"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Received from supplier, Used for Job #001" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button onClick={onClose} className="btn btn-ghost rounded-full">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className={`btn rounded-full ${type === 'stock_in' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                        {saving ? 'Updating...' : type === 'stock_in' ? 'Stock In' : 'Stock Out'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Main Inventory Page ───────────────────────────────────────
const Inventory = () => {
    const { profile } = useContext(SessionContext)
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

    const fetchItems = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('is_active', true)
            .order('item_name')
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
        } else {
            setScannedBarcode(barcode)
            setEditItem(null)
            setShowAddModal(true)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Deactivate this item?')) return
        await supabase.from('inventory_items').update({ is_active: false }).eq('id', id)
        fetchItems()
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Inventory</h1>
                    <p className="text-gray-500 text-sm">AC units, parts, supplies, tools & equipment</p>
                </div>
                <button
                    onClick={() => { setEditItem(null); setScannedBarcode(''); setShowAddModal(true) }}
                    className="btn btn-neutral rounded-full gap-2">
                    <MdAdd /> Add Item
                </button>
            </div>

            {/* Barcode Scanner */}
            <div className="mb-6">
                <BarcodeScanner onScan={handleScan} label="Barcode / QR Scanner" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Items', value: totalItems, sub: 'active items', color: 'text-black' },
                    { label: 'Low Stock', value: lowStock, sub: 'need reorder', color: 'text-orange-500', warn: lowStock > 0 },
                    { label: 'Out of Stock', value: outOfStock, sub: 'unavailable', color: 'text-red-500', warn: outOfStock > 0 },
                    { label: 'Total Value', value: `₱${totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, sub: 'inventory worth', color: 'text-black' },
                ].map(({ label, value, sub, color, warn }) => (
                    <div key={label} className="border border-gray-200 rounded-xl p-5 bg-white">
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                            {warn && <MdWarning className="text-orange-400" />} {label}
                        </p>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        className="input input-bordered input-sm w-full pl-9"
                        placeholder="Search items, barcodes, brands..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select className="select select-bordered select-sm"
                    value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    {['AC Unit', 'Parts', 'Supplies', 'Tools', 'Equipment'].map(c =>
                        <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="select select-bordered select-sm"
                    value={filterStock} onChange={e => setFilterStock(e.target.value)}>
                    <option value="All">All Stock</option>
                    <option value="OK">In Stock</option>
                    <option value="Low">Low Stock</option>
                    <option value="Out">Out of Stock</option>
                </select>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-xs font-bold text-gray-500 uppercase">Barcode</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Item</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Category</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Brand/Model</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Qty</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Unit Price</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Location</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No items found.</td></tr>
                            ) : filtered.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                    <td>
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                            <FaBarcode className="text-gray-400 text-xs" />
                                            {item.barcode}
                                        </span>
                                    </td>
                                    <td>
                                        <p className="font-semibold text-sm">{item.item_name}</p>
                                        {item.description && <p className="text-xs text-gray-400 truncate max-w-32">{item.description}</p>}
                                    </td>
                                    <td><CategoryBadge category={item.category} /></td>
                                    <td>
                                        <p className="text-sm">{item.brand}</p>
                                        <p className="text-xs text-gray-400">{item.model}</p>
                                    </td>
                                    <td>
                                        <span className={`font-bold text-sm ${item.quantity === 0 ? 'text-red-500' : item.quantity <= item.reorder_level ? 'text-orange-500' : 'text-black'}`}>
                                            {item.quantity}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                                    </td>
                                    <td><StockStatus quantity={item.quantity} reorderLevel={item.reorder_level} /></td>
                                    <td className="text-sm font-medium">₱{Number(item.unit_price).toLocaleString()}</td>
                                    <td className="text-xs text-gray-500">{item.location || '—'}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { setStockItem(item); setShowStockModal(true) }}
                                                className="btn btn-xs btn-ghost rounded-full tooltip" data-tip="Stock In/Out">
                                                <MdTrendingUp className="text-green-500" />
                                            </button>
                                            <button
                                                onClick={() => { setEditItem(item); setShowAddModal(true) }}
                                                className="btn btn-xs btn-ghost rounded-full tooltip" data-tip="Edit">
                                                <MdEdit className="text-blue-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="btn btn-xs btn-ghost rounded-full tooltip" data-tip="Remove">
                                                <MdDelete className="text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                    Showing {filtered.length} of {totalItems} items
                </div>
            </div>

            {showAddModal && (
                <ItemModal
                    item={editItem}
                    scannedBarcode={scannedBarcode}
                    onClose={() => { setShowAddModal(false); setEditItem(null); setScannedBarcode('') }}
                    onSave={() => { setShowAddModal(false); setEditItem(null); setScannedBarcode(''); fetchItems() }}
                />
            )}
            {showStockModal && stockItem && (
                <StockModal
                    item={stockItem}
                    profile={profile}
                    onClose={() => { setShowStockModal(false); setStockItem(null) }}
                    onSave={() => { setShowStockModal(false); setStockItem(null); fetchItems() }}
                />
            )}
        </AdminLayout>
    )
}

export default Inventory