import React, { useEffect, useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import { MdAcUnit } from 'react-icons/md'
import { FaPaperPlane } from 'react-icons/fa'

const Login = () => {
    const { session } = useContext(SessionContext)
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (session) navigate('/')
    }, [session])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert(error.message)
        else navigate('/')
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex">
            <div className="w-80 bg-black flex flex-col items-center justify-center flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mb-4">
                    <MdAcUnit className="text-black text-4xl" />
                </div>
                <p className="text-white text-lg font-bold">AirCon IMS</p>
                <p className="text-gray-400 text-xs text-center px-6 mt-1">
                    Inventory Management System
                </p>
            </div>

            <div className="flex-1 flex items-center justify-center bg-white px-8">
                <div className="w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                    <p className="text-gray-500 text-sm mb-8">Sign in to manage your inventory</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Email</label>
                            <input type="email" className="input input-bordered w-full"
                                placeholder="your@email.com"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Password</label>
                            <input type="password" className="input input-bordered w-full"
                                placeholder="••••••••"
                                value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" disabled={loading}
                            className="btn btn-neutral w-full rounded-full mt-2 gap-2">
                            <FaPaperPlane className="text-sm" />
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6 text-gray-500">
                        No account yet?{' '}
                        <Link to="/signup" className="font-bold text-black hover:underline">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login