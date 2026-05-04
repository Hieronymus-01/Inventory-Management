import React, { useState, useContext } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import { useToast } from '../../contexts/ToastContext'
import { MdEdit, MdLock, MdPerson } from 'react-icons/md'
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
    const toast = useToast()


    // ── Update Profile Info ───────────────────────────────────
    const handleProfileSave = async () => {
        if (!profileForm.name.trim()) {
            toast.error('Missing Field', 'Name is required.')
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
            toast.error('Update Failed', error.message)
        } else {
            setProfile(prev => ({ ...prev, name: profileForm.name.trim(), phone_number: profileForm.phone_number.trim() }))
            toast.success('Profile Updated!', 'Your personal information has been saved.')
        }
        setProfileLoading(false)
    }

    // ── Change Password ───────────────────────────────────────
    const handlePasswordSave = async () => {
        if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
            toast.error('Missing Fields', 'Please fill in all password fields.')
            return
        }

        if (passwordForm.new.length < 6) {
            toast.error('Weak Password', 'Password must be at least 6 characters.')
            return
        }

        if (passwordForm.new !== passwordForm.confirm) {
            toast.error('Mismatch', 'New passwords do not match.')
            return
        }

        setPasswordLoading(true)

        // Verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: passwordForm.current,
        })

        if (signInError) {
            toast.error('Wrong Password', 'Current password is incorrect.')
            setPasswordLoading(false)
            return
        }

        const { error } = await supabase.auth.updateUser({
            password: passwordForm.new
        })

        if (error) {
            toast.error('Update Failed', error.message)
        } else {
            setPasswordForm({ current: '', new: '', confirm: '' })
            toast.success('Password Changed!', 'Your password has been updated successfully.')
        }

        setPasswordLoading(false)
    }

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Edit Profile</h1>
                <p className="text-base-content/60 text-sm">
                    Update your personal information and password
                </p>
            </div>

            <div className="max-w-2xl space-y-6">

                {/* Avatar */}
                <div className="border border-base-200 rounded-xl p-6 bg-base-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                        <FaUser className="text-base-content/40 text-2xl" />
                    </div>
                    <div>
                        <p className="text-lg font-bold">{profile?.name}</p>
                        <p className="text-sm text-base-content/60">{profile?.email}</p>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="border border-base-200 rounded-xl bg-base-100">
                    <div className="px-6 py-4 border-b bg-base-200 flex items-center gap-2">
                        <MdPerson />
                        <p className="font-semibold text-sm">Personal Information</p>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        <input
                            className="input input-bordered w-full"
                            value={profileForm.name}
                            onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="Full Name"
                        />

                        <input
                            className="input input-bordered w-full bg-base-200"
                            value={profile?.email || ''}
                            disabled
                        />

                        <input
                            className="input input-bordered w-full"
                            value={profileForm.phone_number}
                            onChange={e => setProfileForm(p => ({ ...p, phone_number: e.target.value }))}
                            placeholder="Phone Number"
                        />
                    </div>

                    <div className="flex justify-end px-6 py-4 border-t bg-base-200">
                        <button
                            onClick={handleProfileSave}
                            disabled={profileLoading}
                            className="btn btn-neutral rounded-full gap-2">
                            <MdEdit />
                            {profileLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Password */}
                <div className="border border-base-200 rounded-xl bg-base-100">
                    <div className="px-6 py-4 border-b bg-base-200 flex items-center gap-2">
                        <MdLock />
                        <p className="font-semibold text-sm">Change Password</p>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            placeholder="Current Password"
                            value={passwordForm.current}
                            onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="password"
                                className="input input-bordered"
                                placeholder="New Password"
                                value={passwordForm.new}
                                onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                            />
                            <input
                                type="password"
                                className="input input-bordered"
                                placeholder="Confirm Password"
                                value={passwordForm.confirm}
                                onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end px-6 py-4 border-t bg-base-200">
                        <button
                            onClick={handlePasswordSave}
                            disabled={passwordLoading}
                            className="btn btn-neutral rounded-full gap-2">
                            <MdLock />
                            {passwordLoading ? 'Updating...' : 'Change Password'}
                        </button>
                    </div>
                </div>

            </div>
        </AdminLayout>
    )
}

export default EditProfile