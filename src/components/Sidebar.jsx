import React, { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { SessionContext } from '../contexts/SessionContext'
import { supabase } from '../utils/Supabase'
import { MdDashboard, MdInventory, MdLogout, MdAcUnit } from 'react-icons/md'
import { FaUser } from 'react-icons/fa'

const Sidebar = () => {
    const { profile } = useContext(SessionContext)
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const navItem = ({ to, icon: Icon, label }) => (
        <li key={to}>
            <NavLink to={to}
                className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
          ${isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`
                }>
                <Icon className="text-xl" />
                {label}
            </NavLink>
        </li>
    )

    return (
        <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <MdAcUnit className="text-white text-lg" />
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-none">AirCon IMS</p>
                        <p className="text-xs text-gray-400 leading-none mt-0.5">Inventory System</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-3">
                <ul className="space-y-1">
                    {navItem({ to: '/', icon: MdDashboard, label: 'Dashboard' })}
                    {navItem({ to: '/inventory', icon: MdInventory, label: 'Inventory' })}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUser className="text-gray-500 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{profile?.name || 'User'}</p>
                        <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                    </div>
                </div>
                <button onClick={handleLogout}
                    className="btn btn-ghost btn-sm w-full rounded-xl justify-start gap-2 text-red-500 hover:bg-red-50">
                    <MdLogout /> Logout
                </button>
            </div>
        </aside>
    )
}

export default Sidebar