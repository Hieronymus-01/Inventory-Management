import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { MdMenu } from 'react-icons/md'

const AdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-base-200">

            {/* ── Mobile Overlay ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Mobile Top Bar */}
                <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-base-100 border-b border-base-200 sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label="Open menu"
                    >
                        <MdMenu className="text-xl" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-base-content rounded-md flex items-center justify-center">
                            <span className="text-base-100 text-xs font-bold">A</span>
                        </div>
                        <p className="font-bold text-sm text-base-content">AirCon IMS</p>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default AdminLayout