import React, { useEffect, useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import { MdAcUnit } from 'react-icons/md'
import { FaPaperPlane } from 'react-icons/fa'

const SignUp = () => {
    const { session } = useContext(SessionContext)
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (session) navigate('/')
    }, [session])

    const handleSignUp = async (e) => {
        e.preventDefault()
        if (form.password !== form.confirm) { alert('Passwords do not match'); return }
        setLoading(true)
        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { name: form.name } }
        })
        if (error) { alert(error.message); setLoading(false); return }
        if (data?.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                name: form.name,
                email: form.email,
                role: 'staff'
            })
            navigate('/login')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex">
            <div className="w-80 bg-black flex flex-col items-center justify-center flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mb-4">
                    <MdAcUnit className="text-black text-4xl" />
                </div>
                <p className="text-white text-lg font-bold">AirCon IMS</p>
                <p className="text-gray-400 text-xs text-center px-6 mt-1">Inventory Management System</p>
            </div>

            <div className="flex-1 flex items-center justify-center bg-white px-8">
                <div className="w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-2">Create Account</h2>
                    <p className="text-gray-500 text-sm mb-8">Register to access the inventory system</p>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Full Name</label>
                            <input type="text" className="input input-bordered w-full"
                                placeholder="Juan dela Cruz"
                                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Email</label>
                            <input type="email" className="input input-bordered w-full"
                                placeholder="your@email.com"
                                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Password</label>
                                <input type="password" className="input input-bordered w-full"
                                    placeholder="••••••••"
                                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Confirm</label>
                                <input type="password" className="input input-bordered w-full"
                                    placeholder="••••••••"
                                    value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="btn btn-neutral w-full rounded-full mt-2 gap-2">
                            <FaPaperPlane className="text-sm" />
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6 text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-black hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SignUp