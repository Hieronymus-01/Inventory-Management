// ─── CSV Export ───────────────────────────────────────────────────────────────
const escapeCSV = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

const toCSV = (headers, rows) => {
    const headerRow = headers.map(escapeCSV).join(',')
    const dataRows = rows.map(row => row.map(escapeCSV).join(','))
    return [headerRow, ...dataRows].join('\n')
}

const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

const dateStr = () => new Date().toISOString().split('T')[0]

// ─── Export Functions ─────────────────────────────────────────────────────────
export const exportInventoryCSV = (items) => {
    const headers = [
        'Barcode', 'Item Name', 'Category', 'Brand', 'Model',
        'Unit', 'Quantity', 'Reorder Level', 'Unit Price (₱)',
        'Total Value (₱)', 'Location', 'Status', 'Description', 'Last Updated'
    ]
    const rows = items.map(item => [
        item.barcode,
        item.item_name,
        item.category,
        item.brand || '',
        item.model || '',
        item.unit,
        item.quantity,
        item.reorder_level,
        item.unit_price,
        (item.quantity * item.unit_price).toFixed(2),
        item.location || '',
        item.quantity === 0
            ? 'Out of Stock'
            : item.quantity <= item.reorder_level
                ? 'Low Stock'
                : 'In Stock',
        item.description || '',
        item.updated_at ? new Date(item.updated_at).toLocaleString() : '',
    ])
    const csv = toCSV(headers, rows)
    downloadFile(csv, `inventory_${dateStr()}.csv`, 'text/csv;charset=utf-8;')
}

export const exportTransactionsCSV = (transactions) => {
    const headers = [
        'Date', 'Time', 'Type', 'Item Name', 'Category',
        'Quantity', 'Unit Price (₱)', 'Total Value (₱)',
        'Performed By', 'Notes'
    ]
    const rows = transactions.map(tx => {
        const d = new Date(tx.created_at)
        return [
            d.toLocaleDateString('en-PH'),
            d.toLocaleTimeString('en-PH'),
            tx.type === 'stock_in' ? 'Stock In' : tx.type === 'stock_out' ? 'Stock Out' : 'Adjustment',
            tx.inventory_items?.item_name || '',
            tx.inventory_items?.category || '',
            tx.quantity,
            tx.inventory_items?.unit_price || 0,
            (tx.quantity * (tx.inventory_items?.unit_price || 0)).toFixed(2),
            tx.profiles?.name || '',
            tx.notes || '',
        ]
    })
    const csv = toCSV(headers, rows)
    downloadFile(csv, `transactions_${dateStr()}.csv`, 'text/csv;charset=utf-8;')
}

export const exportLowStockCSV = (items) => {
    const lowStock = items.filter(i => i.quantity <= i.reorder_level)
    const headers = [
        'Barcode', 'Item Name', 'Category', 'Brand',
        'Current Qty', 'Reorder Level', 'Shortage',
        'Unit Price (₱)', 'Location', 'Status'
    ]
    const rows = lowStock.map(item => [
        item.barcode,
        item.item_name,
        item.category,
        item.brand || '',
        item.quantity,
        item.reorder_level,
        Math.max(0, item.reorder_level - item.quantity),
        item.unit_price,
        item.location || '',
        item.quantity === 0 ? 'Out of Stock' : 'Low Stock',
    ])
    const csv = toCSV(headers, rows)
    downloadFile(csv, `low_stock_alert_${dateStr()}.csv`, 'text/csv;charset=utf-8;')
}

export const exportUsersCSV = (users) => {
    const headers = ['Name', 'Email', 'Phone Number', 'Role', 'Date Joined']
    const rows = users.map(u => [
        u.name || '',
        u.email || '',
        u.phone_number || '',
        u.role || '',
        u.created_at ? new Date(u.created_at).toLocaleDateString('en-PH') : '',
    ])
    const csv = toCSV(headers, rows)
    downloadFile(csv, `users_${dateStr()}.csv`, 'text/csv;charset=utf-8;')
}

export const exportAuditLogsCSV = (logs) => {
    const headers = ['Date', 'Time', 'User', 'Role', 'Action', 'Description']
    const rows = logs.map(log => {
        const d = new Date(log.created_at)
        return [
            d.toLocaleDateString('en-PH'),
            d.toLocaleTimeString('en-PH'),
            log.profiles?.name || 'Unknown',
            log.profiles?.role || '',
            log.action || '',
            log.description || '',
        ]
    })
    const csv = toCSV(headers, rows)
    downloadFile(csv, `audit_logs_${dateStr()}.csv`, 'text/csv;charset=utf-8;')
}

// ─── Full Report Export ───────────────────────────────────────────────────────
export const exportFullReportCSV = (items, transactions) => {
    const totalValue = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
    const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level).length
    const outOfStock = items.filter(i => i.quantity === 0).length
    const stockIn = transactions.filter(t => t.type === 'stock_in').reduce((s, t) => s + t.quantity, 0)
    const stockOut = transactions.filter(t => t.type === 'stock_out').reduce((s, t) => s + t.quantity, 0)

    const summaryCSV = toCSV(
        ['Metric', 'Value'],
        [
            ['Report Generated', new Date().toLocaleString('en-PH')],
            ['Total Active Items', items.length],
            ['Total Inventory Value (₱)', totalValue.toFixed(2)],
            ['Low Stock Items', lowStock],
            ['Out of Stock Items', outOfStock],
            ['Total Stock In (all time)', stockIn],
            ['Total Stock Out (all time)', stockOut],
        ]
    )

    const inventoryCSV = toCSV(
        ['Barcode', 'Item Name', 'Category', 'Brand', 'Qty', 'Unit Price', 'Total Value', 'Status'],
        items.map(i => [
            i.barcode, i.item_name, i.category, i.brand || '',
            i.quantity, i.unit_price,
            (i.quantity * i.unit_price).toFixed(2),
            i.quantity === 0 ? 'Out of Stock' : i.quantity <= i.reorder_level ? 'Low Stock' : 'In Stock'
        ])
    )

    const content = `AIRCON IMS — FULL INVENTORY REPORT\n${'-'.repeat(50)}\n\nSUMMARY\n${summaryCSV}\n\nINVENTORY DETAILS\n${inventoryCSV}`
    downloadFile(content, `full_report_${dateStr()}.csv`, 'text/csv;charset=utf-8;')
}