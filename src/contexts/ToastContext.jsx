import React, { createContext, useContext, useState, useCallback } from 'react'
import { MdCheck, MdClose, MdWarning, MdInfo, MdError } from 'react-icons/md'

const ToastContext = createContext(null)

const icons = {
    success: <MdCheck className="text-lg" />,
    error: <MdError className="text-lg" />,
    warning: <MdWarning className="text-lg" />,
    info: <MdInfo className="text-lg" />,
}

const styles = {
    success: {
        bar: 'bg-green-500',
        icon: 'bg-green-500 text-white',
        border: 'border-green-100',
        title: 'text-green-700',
    },
    error: {
        bar: 'bg-red-500',
        icon: 'bg-red-500 text-white',
        border: 'border-red-100',
        title: 'text-red-700',
    },
    warning: {
        bar: 'bg-orange-400',
        icon: 'bg-orange-400 text-white',
        border: 'border-orange-100',
        title: 'text-orange-700',
    },
    info: {
        bar: 'bg-blue-500',
        icon: 'bg-blue-500 text-white',
        border: 'border-blue-100',
        title: 'text-blue-700',
    },
}

// ─── Single Toast ─────────────────────────────────────────────────────────────
const Toast = ({ toast, onRemove }) => {
    const s = styles[toast.type] || styles.info
    return (
        <div
            className={`relative flex items-start gap-3 bg-white border ${s.border} rounded-2xl shadow-xl px-4 py-3.5 min-w-72 max-w-sm overflow-hidden`}
            style={{ animation: 'slideIn 0.3s ease-out' }}
        >
            {/* Colored top bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${s.bar} rounded-t-2xl`} />

            {/* Icon */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${s.icon}`}>
                {icons[toast.type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-sm font-bold ${s.title}`}>{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
            </div>

            {/* Close */}
            <button
                onClick={() => onRemove(toast.id)}
                className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5 flex-shrink-0"
            >
                <MdClose className="text-base" />
            </button>

            {/* Progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-0.5 ${s.bar} opacity-30 rounded-b-2xl`}
                style={{ animation: `shrink ${toast.duration || 4000}ms linear forwards` }}
            />
        </div>
    )
}

// ─── Toast Container ──────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([])

    const remove = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const toast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { id, type, title, message, duration }])
        setTimeout(() => remove(id), duration)
    }, [remove])

    // Shorthand helpers
    toast.success = (title, message, duration) => toast({ type: 'success', title, message, duration })
    toast.error = (title, message, duration) => toast({ type: 'error', title, message, duration })
    toast.warning = (title, message, duration) => toast({ type: 'warning', title, message, duration })
    toast.info = (title, message, duration) => toast({ type: 'info', title, message, duration })

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast Container — fixed top right */}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <Toast toast={t} onRemove={remove} />
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext)