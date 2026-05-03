import React, { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { MdInventory, MdWarning, MdTrendingUp, MdAcUnit } from 'react-icons/md'

const Dashboard = () => {
    const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 })
    const [lowItems, setLowItems] = useState([])
    const [recentTx, setRecentTx] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            const { data: items } = await supabase
                .from('inventory_items').select('*').eq('is_active', true)

            if (items) {
                setStats({
                    total: items.length,
                    lowStock: items.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level).length,
                    outOfStock: items.filter(i => i.quantity === 0).length,
                    totalValue: items.reduce((s, i) => s + (i.quantity * i.unit_price), 0)
                })
                setLowItems(items.filter(i => i.quantity <= i.reorder_level).slice(0, 5))
            }

            const { data: tx } = await supabase
                .from('stock_transactions')
                .select('*, inventory_items(item_name)')
                .order('created_at', { ascending: false })
                .limit(5)
            if (tx) setRecentTx(tx)
        }
        fetchData()
    }, [])

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-gray-500 text-sm mb-6">Aircon Inventory Overview</p>

            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Items', value: stats.total, sub: 'active items', icon: MdInventory },
                    { label: 'Low Stock', value: stats.lowStock, sub: 'need reorder', icon: MdWarning, red: stats.lowStock > 0 },
                    { label: 'Out of Stock', value: stats.outOfStock, sub: 'unavailable', icon: MdWarning, red: stats.outOfStock > 0 },
                    { label: 'Total Value', value: `₱${stats.totalValue.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`, sub: 'inventory worth', icon: MdTrendingUp },
                ].map(({ label, value, sub, icon: Icon, red }) => (
                    <div key={label} className="border border-gray-200 rounded-xl p-5 bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-500">{label}</p>
                            <Icon className={`text-xl ${red ? 'text-red-400' : 'text-gray-300'}`} />
                        </div>
                        <p className={`text-2xl font-bold ${red ? 'text-red-500' : 'text-black'}`}>{value}</p>
                        <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <p className="font-semibold mb-1 flex items-center gap-2">
                        <MdWarning className="text-orange-400" /> Low Stock Items
                    </p>
                    <p className="text-xs text-gray-400 mb-4">Items that need to be restocked</p>
                    {lowItems.length === 0
                        ? <p className="text-sm text-gray-400 text-center py-4">All items are sufficiently stocked</p>
                        : lowItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="text-sm font-medium">{item.item_name}</p>
                                    <p className="text-xs text-gray-400">{item.category} • {item.location}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${item.quantity === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                        {item.quantity} {item.unit}
                                    </p>
                                    <p className="text-xs text-gray-400">min: {item.reorder_level}</p>
                                </div>
                            </div>
                        ))}
                </div>

                <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <p className="font-semibold mb-1 flex items-center gap-2">
                        <MdTrendingUp className="text-green-400" /> Recent Transactions
                    </p>
                    <p className="text-xs text-gray-400 mb-4">Latest stock movements</p>
                    {recentTx.length === 0
                        ? <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>
                        : recentTx.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="text-sm font-medium">{tx.inventory_items?.item_name}</p>
                                    <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`badge badge-sm ${tx.type === 'stock_in' ? 'badge-success' : 'badge-error'}`}>
                                    {tx.type === 'stock_in' ? `+${tx.quantity}` : `-${tx.quantity}`}
                                </span>
                            </div>
                        ))}
                </div>
            </div>
        </AdminLayout>
    )
}

export default Dashboard