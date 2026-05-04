import React, { useState, useEffect, useRef, useContext } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import {
    MdBarChart, MdTrendingUp, MdTrendingDown,
    MdSmartToy, MdSend, MdRefresh, MdInventory,
    MdAttachMoney, MdWarning, MdCalendarToday,
    MdClose, MdPerson
} from 'react-icons/md'
import { FaRobot, FaUser, FaBoxOpen } from 'react-icons/fa'
import { useToast } from '../../contexts/ToastContext'
import {
    exportInventoryCSV,
    exportTransactionsCSV,
    exportLowStockCSV,
    exportFullReportCSV
} from '../../utils/exportData'
import { MdDownload, MdFileDownload } from 'react-icons/md'

// ─── Period Selector ─────────────────────────────────────────────────────────
const PeriodBtn = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${active
            ? 'bg-black text-white shadow'
            : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
    >
        {label}
    </button>
)

// ─── Stat Card ───────────────────────────────────────────────────────────────
const ReportCard = ({ label, value, sub, icon: Icon, gradient, trend, trendVal }) => (
    <div className="relative rounded-2xl p-5 overflow-hidden shadow-sm"
        style={{ background: gradient }}>
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-white" />
        <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider">{label}</p>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Icon className="text-white text-base" />
                </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{value}</p>
            <p className="text-xs text-white/60">{sub}</p>
            {trendVal !== undefined && (
                <div className="mt-2 flex items-center gap-1">
                    {trend === 'up'
                        ? <MdTrendingUp className="text-green-300 text-sm" />
                        : <MdTrendingDown className="text-red-300 text-sm" />}
                    <span className="text-white/70 text-xs font-medium">{trendVal}</span>
                </div>
            )}
        </div>
    </div>
)

// ─── Bar Chart ───────────────────────────────────────────────────────────────
const BarChart = ({ data, maxVal, colorIn, colorOut, height = 120 }) => (
    <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map(({ label, in: inQty, out: outQty, value }, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: height - 20 }}>
                    {inQty !== undefined && (
                        <div className="rounded-t-md w-4 transition-all duration-700"
                            style={{
                                height: `${maxVal > 0 ? (inQty / maxVal) * 100 : 0}%`,
                                minHeight: inQty > 0 ? '4px' : '0',
                                background: colorIn
                            }} />
                    )}
                    {outQty !== undefined && (
                        <div className="rounded-t-md w-4 transition-all duration-700"
                            style={{
                                height: `${maxVal > 0 ? (outQty / maxVal) * 100 : 0}%`,
                                minHeight: outQty > 0 ? '4px' : '0',
                                background: colorOut
                            }} />
                    )}
                    {value !== undefined && (
                        <div className="rounded-t-md w-6 transition-all duration-700"
                            style={{
                                height: `${maxVal > 0 ? (value / maxVal) * 100 : 0}%`,
                                minHeight: value > 0 ? '4px' : '0',
                                background: colorIn
                            }} />
                    )}
                </div>
                <span className="text-xs text-gray-400 font-medium truncate w-full text-center">{label}</span>
            </div>
        ))}
    </div>
)

// ─── AI Chat Bubble ──────────────────────────────────────────────────────────
const ChatBubble = ({ message }) => {
    const isAI = message.role === 'assistant'
    return (
        <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAI
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-600'
                }`}>
                {isAI ? <FaRobot className="text-sm" /> : <FaUser className="text-sm" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isAI
                ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                : 'bg-black text-white rounded-tr-none'
                }`}>
                {message.loading ? (
                    <div className="flex items-center gap-2 text-gray-400">
                        <span className="loading loading-dots loading-sm" />
                        <span className="text-xs">Analyzing data...</span>
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                )}
            </div>
        </div>
    )
}

// ─── Suggested Questions ─────────────────────────────────────────────────────
const suggestions = [
    "What is the total profit today?",
    "Which items are low on stock?",
    "What's the most moved item this week?",
    "How many stock-ins happened this month?",
    "What is the total inventory value?",
    "Which category has the most items?",
    "Show me out of stock items",
    "What was the total stock out this week?",
]

// ─── Main Reports Page ───────────────────────────────────────────────────────
const Reports = () => {
    const { profile } = useContext(SessionContext)
    const [period, setPeriod] = useState('today')
    const [items, setItems] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const toast = useToast()

    // AI Chat state
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hi ${profile?.name || 'there'}! 👋 I'm your AirCon IMS AI Assistant.\n\nI can answer questions about your inventory data like:\n• "What's the total profit today?"\n• "Which items are running low?"\n• "Show me this week's stock movement"\n\nWhat would you like to know?`
        }
    ])
    const [input, setInput] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const chatEndRef = useRef(null)
    const inputRef = useRef(null)

    // ── Fetch Data ──────────────────────────────────────────────────────────────
    const fetchData = async () => {
        setRefreshing(true)
        const [{ data: itemsData }, { data: txData }] = await Promise.all([
            supabase.from('inventory_items').select('*').eq('is_active', true),
            supabase.from('stock_transactions')
                .select('*, inventory_items(item_name, category, unit_price)')
                .order('created_at', { ascending: false })
                .limit(500),
        ])
        if (itemsData) setItems(itemsData)
        if (txData) setTransactions(txData)
        setLoading(false)
        setRefreshing(false)
    }

    useEffect(() => { fetchData() }, [])
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── Period Filtering ────────────────────────────────────────────────────────
    const getDateRange = (p) => {
        const now = new Date()
        const start = new Date()
        if (p === 'today') start.setHours(0, 0, 0, 0)
        else if (p === 'week') start.setDate(now.getDate() - 6)
        else if (p === 'month') start.setDate(1)
        else if (p === 'year') start.setMonth(0, 1)
        return start
    }

    const filteredTx = transactions.filter(t =>
        new Date(t.created_at) >= getDateRange(period)
    )

    const stockIn = filteredTx.filter(t => t.type === 'stock_in')
    const stockOut = filteredTx.filter(t => t.type === 'stock_out')
    const totalStockIn = stockIn.reduce((s, t) => s + t.quantity, 0)
    const totalStockOut = stockOut.reduce((s, t) => s + t.quantity, 0)
    const totalValue = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
    const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level)
    const outOfStock = items.filter(i => i.quantity === 0)

    // Estimated profit (stock out × unit price)
    const estimatedProfit = stockOut.reduce((s, t) =>
        s + (t.quantity * (t.inventory_items?.unit_price || 0)), 0
    )

    // ── Chart Data ──────────────────────────────────────────────────────────────
    const getChartData = () => {
        if (period === 'today') {
            return Array.from({ length: 24 }, (_, h) => {
                const hourTx = filteredTx.filter(t => new Date(t.created_at).getHours() === h)
                return {
                    label: h % 4 === 0 ? `${h}:00` : '',
                    in: hourTx.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0),
                    out: hourTx.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0),
                }
            }).filter((_, i) => i % 2 === 0)
        }
        if (period === 'week') {
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i))
                const dayTx = transactions.filter(t =>
                    new Date(t.created_at).toDateString() === d.toDateString())
                return {
                    label: d.toLocaleDateString('en', { weekday: 'short' }),
                    in: dayTx.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0),
                    out: dayTx.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0),
                }
            })
        }
        if (period === 'month') {
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
            return Array.from({ length: daysInMonth }, (_, i) => {
                const d = new Date(new Date().getFullYear(), new Date().getMonth(), i + 1)
                const dayTx = transactions.filter(t =>
                    new Date(t.created_at).toDateString() === d.toDateString())
                return {
                    label: (i + 1) % 5 === 1 ? `${i + 1}` : '',
                    in: dayTx.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0),
                    out: dayTx.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0),
                }
            })
        }
        // Year — monthly
        return Array.from({ length: 12 }, (_, i) => {
            const monthTx = transactions.filter(t => new Date(t.created_at).getMonth() === i)
            return {
                label: new Date(0, i).toLocaleDateString('en', { month: 'short' }),
                in: monthTx.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0),
                out: monthTx.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0),
            }
        })
    }

    const chartData = getChartData()
    const maxChart = Math.max(...chartData.map(d => Math.max(d.in || 0, d.out || 0)), 1)

    // Category chart
    const categories = ['AC Unit', 'Parts', 'Supplies', 'Tools', 'Equipment']
    const catData = categories.map(cat => ({
        label: cat.split(' ')[0],
        value: items.filter(i => i.category === cat).length
    }))
    const maxCat = Math.max(...catData.map(d => d.value), 1)

    // Top moved items
    const itemMovement = items.map(item => {
        const itemTx = filteredTx.filter(t => t.inventory_items?.item_name === item.item_name)
        return {
            ...item,
            moved: itemTx.reduce((s, t) => s + t.quantity, 0),
            ins: itemTx.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0),
            outs: itemTx.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0),
        }
    }).sort((a, b) => b.moved - a.moved).slice(0, 5)

    // ── Build AI Context (data snapshot) ────────────────────────────────────────
    const buildDataContext = () => {
        const periodLabel = { today: 'today', week: 'this week', month: 'this month', year: 'this year' }[period]
        const topItems = itemMovement.slice(0, 5).map(i =>
            `${i.item_name} (in: ${i.ins}, out: ${i.outs})`).join(', ')
        const lowStockList = lowStock.slice(0, 5).map(i =>
            `${i.item_name} (qty: ${i.quantity}, reorder at: ${i.reorder_level})`).join(', ')
        const outList = outOfStock.slice(0, 5).map(i => i.item_name).join(', ')

        return `
You are an AI assistant for AirCon IMS (Aircon Inventory Management System).
Current selected period: ${periodLabel}
Today's date: ${new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

INVENTORY SNAPSHOT:
- Total active items: ${items.length}
- Total inventory value: ₱${totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
- Low stock items (${lowStock.length}): ${lowStockList || 'none'}
- Out of stock items (${outOfStock.length}): ${outList || 'none'}

PERIOD STATS (${periodLabel}):
- Stock In transactions: ${stockIn.length} transactions, ${totalStockIn} total units
- Stock Out transactions: ${stockOut.length} transactions, ${totalStockOut} total units
- Estimated profit (stock out × unit price): ₱${estimatedProfit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}

TOP MOVED ITEMS (${periodLabel}):
${topItems || 'No transactions in this period'}

CATEGORY BREAKDOWN:
${categories.map(cat => {
            const catItems = items.filter(i => i.category === cat)
            const catValue = catItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)
            return `- ${cat}: ${catItems.length} items, value ₱${catValue.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`
        }).join('\n')}

Answer questions about this inventory data. Be concise, helpful, and use Philippine Peso (₱) for currency.
Format numbers clearly. If asked about something not in the data, say you don't have that information.
    `.trim()
    }

    // ── Send AI Message ─────────────────────────────────────────────────────────
    const sendMessage = async (userInput) => {
        const text = userInput || input.trim()
        if (!text || aiLoading) return

        setInput('')
        const userMsg = { role: 'user', content: text }
        const loadingMsg = { role: 'assistant', content: '', loading: true }

        setMessages(prev => [...prev, userMsg, loadingMsg])
        setAiLoading(true)

        try {
            const systemContext = buildDataContext()
            const conversationHistory = messages
                .filter(m => !m.loading)
                .map(m => ({ role: m.role, content: m.content }))

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    system: systemContext,
                    messages: [
                        ...conversationHistory,
                        { role: 'user', content: text }
                    ]
                })
            })

            const data = await response.json()
            const aiReply = data.content?.[0]?.text || 'Sorry, I could not process that.'

            setMessages(prev => [
                ...prev.filter(m => !m.loading),
                { role: 'assistant', content: aiReply }
            ])
        } catch (err) {
            setMessages(prev => [
                ...prev.filter(m => !m.loading),
                { role: 'assistant', content: '⚠️ Could not connect to AI. Please check your API configuration.' }
            ])
        }
        setAiLoading(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: `Hi ${profile?.name || 'there'}! 👋 Chat cleared. What would you like to know about your inventory?`
        }])
    }

    const periodLabel = { today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year' }[period]

    return (
        <AdminLayout>
            {/* ── HEADER ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-base-content flex items-center gap-2">
                        <MdBarChart className="text-blue-500" /> Reports & Analytics
                    </h1>
                    <p className="text-base-content/50 text-sm mt-0.5">
                        Stock movement, inventory insights, and AI-powered analysis
                    </p>
                </div>
                <div className="flex gap-2">

                    {/* Export Dropdown */}
                    <div className="dropdown dropdown-end">
                        <button tabIndex={0}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-base-100 border border-base-200 text-base-content/60 text-sm font-medium hover:bg-base-200 transition-all shadow-sm">
                            <MdDownload className="text-lg" /> Export
                        </button>
                        <ul tabIndex={0}
                            className="dropdown-content menu bg-base-100 rounded-2xl shadow-xl border border-base-200 w-56 p-2 z-50 mt-2">
                            <li className="menu-title text-xs text-base-content/40 px-3 py-1">Download Reports</li>
                            <li>
                                <button onClick={() => {
                                    exportInventoryCSV(items)
                                    toast.success('Downloaded!', 'Inventory report saved as CSV.')
                                }} className="flex items-center gap-2 text-sm">
                                    <MdFileDownload className="text-blue-500" /> Inventory Report
                                </button>
                            </li>
                            <li>
                                <button onClick={() => {
                                    exportTransactionsCSV(transactions)
                                    toast.success('Downloaded!', 'Transactions report saved as CSV.')
                                }} className="flex items-center gap-2 text-sm">
                                    <MdFileDownload className="text-green-500" /> Transactions ({periodLabel})
                                </button>
                            </li>
                            <li>
                                <button onClick={() => {
                                    exportLowStockCSV(items)
                                    toast.warning('Downloaded!', 'Low stock alert report saved.')
                                }} className="flex items-center gap-2 text-sm">
                                    <MdFileDownload className="text-orange-500" /> Low Stock Alert
                                </button>
                            </li>
                            <li>
                                <button onClick={() => {
                                    exportFullReportCSV(items, transactions)
                                    toast.success('Downloaded!', 'Full inventory report saved as CSV.')
                                }} className="flex items-center gap-2 text-sm">
                                    <MdFileDownload className="text-purple-500" /> Full Report
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Refresh Button (same as before) */}
                    <button onClick={fetchData} disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-base-100 border border-base-200 text-base-content/60 text-sm font-medium hover:bg-base-200 transition-all shadow-sm">
                        <MdRefresh className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>



            {/* ── PERIOD SELECTOR ── */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
                <MdCalendarToday className="text-base-content/40 text-sm" />
                <span className="text-xs text-base-content/40 font-bold uppercase tracking-wider mr-1">Period:</span>
                {[
                    { key: 'today', label: 'Today' },
                    { key: 'week', label: 'This Week' },
                    { key: 'month', label: 'This Month' },
                    { key: 'year', label: 'This Year' },
                ].map(({ key, label }) => (
                    <PeriodBtn key={key} label={label} active={period === key} onClick={() => setPeriod(key)} />
                ))}
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <ReportCard
                    label="Estimated Profit"
                    value={`₱${estimatedProfit >= 1000000
                        ? (estimatedProfit / 1000000).toFixed(1) + 'M'
                        : estimatedProfit >= 1000
                            ? (estimatedProfit / 1000).toFixed(0) + 'K'
                            : estimatedProfit.toLocaleString()}`}
                    sub={`Stock out value — ${periodLabel}`}
                    icon={MdAttachMoney}
                    gradient="linear-gradient(135deg, #064e3b, #059669)"
                />
                <ReportCard
                    label="Total Stock In"
                    value={totalStockIn}
                    sub={`${stockIn.length} transactions — ${periodLabel}`}
                    icon={MdTrendingUp}
                    gradient="linear-gradient(135deg, #1e3a5f, #2563eb)"
                />
                <ReportCard
                    label="Total Stock Out"
                    value={totalStockOut}
                    sub={`${stockOut.length} transactions — ${periodLabel}`}
                    icon={MdTrendingDown}
                    gradient="linear-gradient(135deg, #7f1d1d, #dc2626)"
                />
                <ReportCard
                    label="Inventory Value"
                    value={`₱${totalValue >= 1000000
                        ? (totalValue / 1000000).toFixed(1) + 'M'
                        : totalValue >= 1000
                            ? (totalValue / 1000).toFixed(0) + 'K'
                            : totalValue.toLocaleString()}`}
                    sub={`${items.length} active items`}
                    icon={MdInventory}
                    gradient="linear-gradient(135deg, #2d1b69, #7c3aed)"
                />
            </div>

            {/* ── CHARTS + AI ROW ── */}
            <div className="grid grid-cols-3 gap-4 mb-4">

                {/* Stock Movement Chart */}
                <div className="col-span-2 border border-base-200 rounded-2xl p-5 bg-base-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)' }}>
                                <MdTrendingUp className="text-white text-sm" />
                            </span>
                            Stock Movement
                        </p>
                        <span className="text-xs text-base-content/40 bg-base-200 px-2 py-1 rounded-full">
                            {periodLabel}
                        </span>
                    </div>
                    <p className="text-xs text-base-content/40 mb-5 ml-9">
                        Stock in vs stock out — {periodLabel.toLowerCase()}
                    </p>

                    {loading ? (
                        <div className="h-32 flex items-center justify-center">
                            <span className="loading loading-spinner loading-md text-base-content/30" />
                        </div>
                    ) : (
                        <BarChart
                            data={chartData}
                            maxVal={maxChart}
                            colorIn="linear-gradient(180deg,#34d399,#10b981)"
                            colorOut="linear-gradient(180deg,#f87171,#ef4444)"
                            height={140}
                        />
                    )}

                    <div className="flex gap-5 mt-4 pt-3 border-t border-base-200">
                        <div className="flex items-center gap-2 text-xs text-base-content/50">
                            <div className="w-3 h-3 rounded-sm"
                                style={{ background: 'linear-gradient(90deg,#34d399,#10b981)' }} />
                            Stock In
                        </div>
                        <div className="flex items-center gap-2 text-xs text-base-content/50">
                            <div className="w-3 h-3 rounded-sm"
                                style={{ background: 'linear-gradient(90deg,#f87171,#ef4444)' }} />
                            Stock Out
                        </div>
                    </div>
                </div>

                {/* Category Chart */}
                <div className="border border-base-200 rounded-2xl p-5 bg-base-100 shadow-sm">
                    <p className="font-bold text-sm mb-1">Items by Category</p>
                    <p className="text-xs text-base-content/40 mb-5">Total items per category</p>
                    <BarChart
                        data={catData}
                        maxVal={maxCat}
                        colorIn="linear-gradient(180deg,#818cf8,#4f46e5)"
                        height={140}
                    />
                </div>
            </div>

            {/* ── TOP ITEMS + ALERTS ROW ── */}
            <div className="grid grid-cols-3 gap-4 mb-4">

                {/* Top Moved Items */}
                <div className="col-span-2 border border-base-200 rounded-2xl bg-base-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-base-200 bg-base-200 flex items-center justify-between">
                        <p className="font-bold text-sm flex items-center gap-2">
                            <MdTrendingUp className="text-green-500" />
                            Top Moved Items
                        </p>
                        <span className="text-xs text-base-content/40">{periodLabel}</span>
                    </div>
                    <div className="divide-y divide-base-200">
                        {itemMovement.length === 0 ? (
                            <div className="py-8 text-center text-base-content/40">
                                <FaBoxOpen className="text-3xl mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No transactions in this period</p>
                            </div>
                        ) : itemMovement.map((item, i) => (
                            <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-base-200/50 transition-colors">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                                    style={{
                                        background: i === 0
                                            ? 'linear-gradient(135deg,#f59e0b,#ef4444)'
                                            : i === 1
                                                ? 'linear-gradient(135deg,#6b7280,#9ca3af)'
                                                : 'linear-gradient(135deg,#92400e,#b45309)',
                                        color: 'white'
                                    }}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate text-base-content">{item.item_name}</p>
                                    <p className="text-xs text-base-content/40">{item.category} · {item.location || 'No location'}</p>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="text-center">
                                        <p className="font-black text-green-600">{item.ins}</p>
                                        <p className="text-base-content/40">in</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-red-500">{item.outs}</p>
                                        <p className="text-base-content/40">out</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-base-content">{item.moved}</p>
                                        <p className="text-base-content/40">total</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stock Alerts */}
                <div className="border border-base-200 rounded-2xl bg-base-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-base-200 bg-base-200">
                        <p className="font-bold text-sm flex items-center gap-2">
                            <MdWarning className="text-orange-500" /> Stock Alerts
                        </p>
                        <p className="text-xs text-base-content/40 mt-0.5">
                            {lowStock.length + outOfStock.length} items need attention
                        </p>
                    </div>
                    <div className="overflow-y-auto max-h-56 divide-y divide-base-200">
                        {outOfStock.map(item => (
                            <div key={item.id} className="px-5 py-3 flex items-center gap-3 hover:bg-base-200/50">
                                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-base-content truncate">{item.item_name}</p>
                                    <p className="text-xs text-red-500 font-bold">OUT OF STOCK</p>
                                </div>
                            </div>
                        ))}
                        {lowStock.map(item => (
                            <div key={item.id} className="px-5 py-3 flex items-center gap-3 hover:bg-base-200/50">
                                <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-base-content truncate">{item.item_name}</p>
                                    <p className="text-xs text-orange-500">{item.quantity} left · min {item.reorder_level}</p>
                                </div>
                            </div>
                        ))}
                        {lowStock.length === 0 && outOfStock.length === 0 && (
                            <div className="py-8 text-center text-base-content/40">
                                <p className="text-2xl mb-2">✅</p>
                                <p className="text-sm">All items well stocked</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── AI CHATBOT SECTION ── */}
            <div className="border border-base-200 rounded-2xl bg-base-100 overflow-hidden shadow-sm">

                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-base-200 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, #0f0f0f, #1a1a2e)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                            <FaRobot className="text-white text-base" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm flex items-center gap-2">
                                AI Inventory Assistant
                                <span className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Online
                                </span>
                            </p>
                            <p className="text-white/40 text-xs">
                                Powered by Claude · Ask anything about your inventory
                            </p>
                        </div>
                    </div>
                    <button onClick={clearChat}
                        className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10">
                        <MdClose className="text-sm" />
                        Clear
                    </button>
                </div>

                {/* Suggested Questions */}
                <div className="px-5 py-3 border-b border-base-200 bg-base-200/50">
                    <p className="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-2">
                        Quick Questions
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {suggestions.map(s => (
                            <button key={s}
                                onClick={() => sendMessage(s)}
                                disabled={aiLoading}
                                className="text-xs px-3 py-1.5 rounded-full border border-base-300 bg-base-100 text-base-content/60 hover:border-black hover:text-black hover:bg-base-100 transition-all font-medium disabled:opacity-40">
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="h-80 overflow-y-auto px-5 py-4 space-y-4 bg-base-200/20">
                    {messages.map((msg, i) => (
                        <ChatBubble key={i} message={msg} />
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="px-5 py-4 border-t border-base-200 bg-base-100">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                className="w-full px-4 py-3 pr-12 rounded-2xl border border-base-300 bg-base-200 text-base-content text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                placeholder="Ask about your inventory... (Enter to send, Shift+Enter for new line)"
                                rows={1}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{ minHeight: '48px', maxHeight: '120px' }}
                            />
                        </div>
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || aiLoading}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
                            {aiLoading
                                ? <span className="loading loading-spinner loading-xs text-white" />
                                : <MdSend className="text-white text-lg" />}
                        </button>
                    </div>
                    <p className="text-xs text-base-content/30 mt-2 text-center">
                        AI responses are based on your current inventory data · Period: {periodLabel}
                    </p>
                </div>
            </div>
        </AdminLayout>
    )
}

export default Reports