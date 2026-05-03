import React, { useState, useContext } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import { MdEdit, MdLock, MdPerson, MdCheck, MdClose } from 'react-icons/md'
import { FaUser } from 'react-icons/fa'

const EditProfile = () => {
    const { profile, setProfile } = useContext(SessionContext)

    const [profileForm, setProfileForm] = useState({
        name: profile?.name || '',
        phone_number: profile?.phone_number || '',
    })
    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: '',
    })

    const [profileLoading, setProfileLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [profileMsg, setProfileMsg] = useState(null)
    const [passwordMsg, setPasswordMsg] = useState(null)

    const showMsg = (setter, type, text) => {
        setter({ type, text })
        setTimeout(() => setter(null), 4000)
    }

    // ── Update Profile Info ───────────────────────────────────
    const handleProfileSave = async () => {
        if (!profileForm.name.trim()) {
            showMsg(setProfileMsg, 'error', 'Name is required.')
            return
        }
        setProfileLoading(true)
        const { error } = await supabase
            .from('profiles')
            .update({
                name: profileForm.name.trim(),
                phone_number: profileForm.phone_number.trim(),
            })
            .eq('id', profile.id)

        if (error) {
            showMsg(setProfileMsg, 'error', error.message)
        } else {
            setProfile(prev => ({ ...prev, name: profileForm.name.trim(), phone_number: profileForm.phone_number.trim() }))
            showMsg(setProfileMsg, 'success', 'Profile updated successfully!')
        }
        setProfileLoading(false)
    }

    // ── Change Password ───────────────────────────────────────
    const handlePasswordSave = async () => {
        if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
            showMsg(setPasswordMsg, 'error', 'Please fill in all password fields.')
            return
        }
        if (passwordForm.new.length < 6) {
            showMsg(setPasswordMsg, 'error', 'New password must be at least 6 characters.')
            return
        }
        if (passwordForm.new !== passwordForm.confirm) {
            showMsg(setPasswordMsg, 'error', 'New passwords do not match.')
            return
        }

        setPasswordLoading(true)

        // Verify current password by re-signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: passwordForm.current,
        })

        if (signInError) {
            showMsg(setPasswordMsg, 'error', 'Current password is incorrect.')
            setPasswordLoading(false)
            return
        }

        const { error } = await supabase.auth.updateUser({ password: passwordForm.new })
        if (error) {
            showMsg(setPasswordMsg, 'error', error.message)
        } else {
            setPasswordForm({ current: '', new: '', confirm: '' })
            showMsg(setPasswordMsg, 'success', 'Password changed successfully!')
        }
        setPasswordLoading(false)
    }

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Edit Profile</h1>
                <p className="text-base-content/60 text-sm">Update your personal information and password</p>
            </div>

            <div className="max-w-2xl space-y-6">

                {/* Avatar / Info Card */}
                <div className="border border-base-200 rounded-xl p-6 bg-base-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0">
                        <FaUser className="text-base-content/40 text-2xl" />
                    </div>
                    <div>
                        <p className="text-lg font-bold">{profile?.name || 'No name'}</p>
                        <p className="text-sm text-base-content/60">{profile?.email}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block
              ${profile?.role === 'admin' ? 'bg-black text-white' : 'bg-base-200 text-base-content/60'}`}>
                            {profile?.role === 'admin' ? '⚙ Admin' : '👤 Staff'}
                        </span>
                    </div>
                </div>

                {/* Profile Info Form */}
                <div className="border border-base-200 rounded-xl bg-base-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-base-200 bg-base-200 flex items-center gap-2">
                        <MdPerson className="text-base text-base-content/60" />
                        <p className="font-semibold text-sm">Personal Information</p>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        {/* Success/Error Message */}
                        {profileMsg && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                ${profileMsg.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-700'
                                    : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                {profileMsg.type === 'success' ? <MdCheck className="flex-shrink-0" /> : <MdClose className="flex-shrink-0" />}
                                {profileMsg.text}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1 block">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={profileForm.name}
                                onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Juan dela Cruz"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1 block">
                                Email Address
                            </label>
                            <input
                                type="email"
                                className="input input-bordered w-full bg-base-200 cursor-not-allowed"
                                value={profile?.email || ''}
                                disabled
                            />
                            <p className="text-xs text-base-content/40 mt-1">Email cannot be changed</p>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1 block">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={profileForm.phone_number}
                                onChange={e => setProfileForm(p => ({ ...p, phone_number: e.target.value }))}
                                placeholder="+63 912 345 6789"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1 block">
                                Role
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full bg-base-200 cursor-not-allowed capitalize"
                                value={profile?.role || ''}
                                disabled
                            />
                            <p className="text-xs text-base-content/40 mt-1">Role can only be changed by an admin</p>
                        </div>
                    </div>

                    <div className="flex justify-end px-6 py-4 border-t border-base-200 bg-base-200">
                        <button
                            onClick={handleProfileSave}
                            disabled={profileLoading}
                            className="btn btn-neutral rounded-full gap-2">
                            <MdEdit className="text-sm" />
                            {profileLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Change Password Form */}
                <div className="border border-base-200 rounded-xl bg-base-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-base-200 bg-base-200 flex items-center gap-2">
                        <MdLock className="text-base text-base-content/60" />
                        <p className="font-semibold text-sm">Change Password</p>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        {/* Success/Error Message */}
                        {passwordMsg && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                ${passwordMsg.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-700'
                                    : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                {passwordMsg.type === 'success' ? <MdCheck className="flex-shrink-0" /> : <MdClose className="flex-shrink-0" />}
                                {passwordMsg.text}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1 block">
                                Current Password
                            </label>
                            <input
                                type="password"
                                className="input input-bordered w-full"
                                value={passwordForm.current}
                                onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1 block">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered w-full"
                                    value={passwordForm.new}
                                    onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1 block">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered w-full"
                                    value={passwordForm.confirm}
                                    onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <p className="text-xs text-base-content/40">Password must be at least 6 characters long.</p>
                    </div>

                    <div className="flex justify-end px-6 py-4 border-t border-base-200 bg-base-200">
                        <button
                            onClick={handlePasswordSave}
                            disabled={passwordLoading}
                            className="btn btn-neutral rounded-full gap-2">
                            <MdLock className="text-sm" />
                            {passwordLoading ? 'Updating...' : 'Change Password'}
                        </button>
                    </div>
                </div>

            </div>
        </AdminLayout>
    )
}

export default EditProfile