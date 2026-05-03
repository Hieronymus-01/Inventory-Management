import React, { useState, useEffect, useContext } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import { MdPeople, MdEdit, MdClose, MdCheck, MdAdminPanelSettings, MdPerson } from 'react-icons/md'
import { FaUser } from 'react-icons/fa'

const Users = () => {
    const { profile: currentUser } = useContext(SessionContext)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [editUser, setEditUser] = useState(null)
    const [saving, setSaving] = useState(false)

    const fetchUsers = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setUsers(data)
        setLoading(false)
    }

    useEffect(() => { fetchUsers() }, [])

    const handleRoleChange = async (userId, newRole) => {
        if (userId === currentUser.id) {
            alert("You can't change your own role.")
            return
        }
        setSaving(true)
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)
        if (error) alert(error.message)
        else fetchUsers()
        setSaving(false)
        setEditUser(null)
    }

    const admins = users.filter(u => u.role === 'admin')
    const staffs = users.filter(u => u.role === 'staff')

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-gray-500 text-sm">Manage staff and admin accounts</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Users', value: users.length, sub: 'registered accounts', icon: MdPeople },
                    { label: 'Admins', value: admins.length, sub: 'full access', icon: MdAdminPanelSettings },
                    { label: 'Staff', value: staffs.length, sub: 'limited access', icon: MdPerson },
                ].map(({ label, value, sub, icon: Icon }) => (
                    <div key={label} className="border border-gray-200 rounded-xl p-5 bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-500">{label}</p>
                            <Icon className="text-xl text-gray-300" />
                        </div>
                        <p className="text-2xl font-bold text-black">{value}</p>
                        <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Users Table */}
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <p className="font-semibold text-sm flex items-center gap-2">
                        <MdPeople className="text-base" /> All Users
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-xs font-bold text-gray-500 uppercase">User</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Email</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Role</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Joined</th>
                                <th className="text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                <FaUser className="text-gray-500 text-xs" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {user.name || 'No name'}
                                                    {user.id === currentUser?.id && (
                                                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-sm text-gray-600">{user.email}</td>
                                    <td>
                                        {editUser === user.id ? (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleRoleChange(user.id, 'admin')}
                                                    disabled={saving}
                                                    className="btn btn-xs bg-black text-white rounded-full gap-1">
                                                    <MdAdminPanelSettings className="text-xs" /> Admin
                                                </button>
                                                <button
                                                    onClick={() => handleRoleChange(user.id, 'staff')}
                                                    disabled={saving}
                                                    className="btn btn-xs btn-ghost rounded-full gap-1 border border-gray-200">
                                                    <MdPerson className="text-xs" /> Staff
                                                </button>
                                                <button
                                                    onClick={() => setEditUser(null)}
                                                    className="btn btn-xs btn-ghost btn-circle">
                                                    <MdClose className="text-xs" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`badge badge-sm ${user.role === 'admin' ? 'bg-black text-white' : 'badge-ghost'}`}>
                                                {user.role === 'admin' ? (
                                                    <span className="flex items-center gap-1">
                                                        <MdAdminPanelSettings className="text-xs" /> Admin
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <MdPerson className="text-xs" /> Staff
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-xs text-gray-400">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        {user.id !== currentUser?.id && editUser !== user.id && (
                                            <button
                                                onClick={() => setEditUser(user.id)}
                                                className="btn btn-xs btn-ghost rounded-full gap-1">
                                                <MdEdit className="text-blue-500 text-sm" /> Change Role
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                    {users.length} total users
                </div>
            </div>

            {/* Role Permissions Info */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <MdAdminPanelSettings /> Admin Permissions
                    </p>
                    {['View inventory', 'Add / Edit / Delete items', 'Stock In & Stock Out', 'Manage users & roles', 'View dashboard'].map(p => (
                        <div key={p} className="flex items-center gap-2 py-1">
                            <MdCheck className="text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{p}</span>
                        </div>
                    ))}
                </div>
                <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <MdPerson /> Staff Permissions
                    </p>
                    {[
                        { label: 'View inventory', allowed: true },
                        { label: 'Add / Edit / Delete items', allowed: false },
                        { label: 'Stock In & Stock Out', allowed: true },
                        { label: 'Manage users & roles', allowed: false },
                        { label: 'View dashboard', allowed: true },
                    ].map(({ label, allowed }) => (
                        <div key={label} className="flex items-center gap-2 py-1">
                            <MdCheck className={`flex-shrink-0 ${allowed ? 'text-green-500' : 'text-gray-200'}`} />
                            <span className={`text-sm ${allowed ? 'text-gray-600' : 'text-gray-300'}`}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    )
}

export default Users