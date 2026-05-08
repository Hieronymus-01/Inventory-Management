import React, { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { SessionContext } from '../contexts/SessionContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../utils/Supabase'
import {
    MdDashboard, MdInventory, MdLogout, MdAcUnit,
    MdPeople, MdHistory, MdManageAccounts,
    MdDarkMode, MdLightMode, MdClose
} from 'react-icons/md'
import { FaUser } from 'react-icons/fa'
import { MdBarChart, MdSmartToy } from 'react-icons/md'

const Sidebar = ({ isOpen, onClose }) => {
    const { profile } = useContext(SessionContext)
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const isAdmin = profile?.role === 'admin'

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const navItem = ({ to, icon: Icon, label, adminOnly = false }) => {
        if (adminOnly && !isAdmin) return null
        return (
            <li key={to}>
                <NavLink
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                        ${isActive
                            ? 'bg-base-content text-base-100'
                            : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'}`
                    }
                >
                    <Icon className="text-xl flex-shrink-0" />
                    <span>{label}</span>
                </NavLink>
            </li>
        )
    }

    return (
        <>
            {/* ── Desktop Sidebar (always visible lg+) ── */}
            {/* ── Mobile Drawer (slide-in on small screens) ── */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-64 sm:w-60 min-h-screen bg-base-100 border-r border-base-200
                    flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0 lg:transform-none
                    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                `}
            >
                {/* Logo */}
                <div className="p-5 border-b border-base-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-base-content rounded-lg flex items-center justify-center flex-shrink-0">
                                <MdAcUnit className="text-base-100 text-lg" />
                            </div>
                            <div>
                                <p className="font-bold text-sm leading-none text-base-content">AirCon IMS</p>
                                <p className="text-xs text-base-content/40 leading-none mt-0.5">Inventory System</p>
                            </div>
                        </div>
                        {/* Close button — mobile only */}
                        <button
                            onClick={onClose}
                            className="lg:hidden btn btn-ghost btn-sm btn-circle text-base-content/60"
                            aria-label="Close sidebar"
                        >
                            <MdClose className="text-lg" />
                        </button>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 overflow-y-auto">
                    <ul className="space-y-1">
                        {navItem({ to: '/', icon: MdDashboard, label: 'Dashboard' })}
                        {navItem({ to: '/inventory', icon: MdInventory, label: 'Inventory' })}
                        {navItem({ to: '/reports', icon: MdBarChart, label: 'Reports & AI' })}
                        {navItem({ to: '/users', icon: MdPeople, label: 'Users', adminOnly: true })}
                        {navItem({ to: '/audit-logs', icon: MdHistory, label: 'Audit Logs', adminOnly: true })}
                    </ul>

                    <div className="mt-4 px-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full
                            ${isAdmin ? 'bg-base-content text-base-100' : 'bg-base-200 text-base-content/50'}`}>
                            {isAdmin ? '⚙ Admin' : '👤 Staff'}
                        </span>
                    </div>
                </nav>

                {/* Theme Toggle */}
                <div className="px-4 pb-2">
                    <button
                        onClick={toggleTheme}
                        className="btn btn-ghost btn-sm w-full rounded-xl justify-start gap-2 text-base-content/60 hover:bg-base-200"
                    >
                        {theme === 'light'
                            ? <><MdDarkMode className="text-lg" /> Dark Mode</>
                            : <><MdLightMode className="text-lg text-yellow-400" /> Light Mode</>
                        }
                    </button>
                </div>

                {/* User Footer */}
                <div className="p-4 border-t border-base-200">
                    <NavLink
                        to="/profile"
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 mb-3 p-2 rounded-xl transition-all
                            ${isActive ? 'bg-base-200' : 'hover:bg-base-200/50'}`
                        }
                    >
                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0">
                            <FaUser className="text-base-content/50 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-base-content">{profile?.name || 'User'}</p>
                            <p className="text-xs text-base-content/40 truncate">{profile?.email}</p>
                        </div>
                        <MdManageAccounts className="text-base-content/40 text-lg flex-shrink-0" />
                    </NavLink>

                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost btn-sm w-full rounded-xl justify-start gap-2 text-error hover:bg-error/10"
                    >
                        <MdLogout /> Logout
                    </button>
                </div>
            </aside>
        </>
    )
}

export default Sidebar