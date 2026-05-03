import React, { useEffect, useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import { MdAcUnit } from 'react-icons/md'
import { FaPaperPlane, FaEye, FaEyeSlash } from 'react-icons/fa'

const Login = () => {
    const { session } = useContext(SessionContext)
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

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

            {/* ── LEFT PANEL ── */}
            <div className="hidden md:flex w-[420px] flex-shrink-0 relative overflow-hidden flex-col items-center justify-center"
                style={{ background: 'linear-gradient(145deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>

                {/* Animated background circles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', animation: 'pulse 4s ease-in-out infinite' }} />
                    <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', animation: 'pulse 3s ease-in-out infinite 1s' }} />
                    <div className="absolute -bottom-16 left-1/4 w-56 h-56 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', animation: 'pulse 5s ease-in-out infinite 0.5s' }} />

                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-5"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                {/* Floating AC units decoration */}
                <div className="absolute top-16 right-8 opacity-10">
                    <MdAcUnit className="text-white text-6xl" style={{ animation: 'spin 20s linear infinite' }} />
                </div>
                <div className="absolute bottom-20 left-8 opacity-10">
                    <MdAcUnit className="text-white text-4xl" style={{ animation: 'spin 15s linear infinite reverse' }} />
                </div>
                <div className="absolute top-1/2 right-4 opacity-5">
                    <MdAcUnit className="text-white text-8xl" />
                </div>

                {/* Logo & Brand */}
                <div className="relative z-10 flex flex-col items-center text-center px-8">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-3xl blur-xl opacity-40"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', transform: 'scale(1.2)' }} />
                        <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
                            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0891b2)' }}>
                            <MdAcUnit className="text-white text-5xl" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">AirCon IMS</h1>
                    <p className="text-blue-300 text-sm font-medium tracking-widest uppercase mb-8">
                        Inventory Management System
                    </p>

                    {/* Feature pills */}
                    <div className="space-y-2 w-full max-w-xs">
                        {[
                            { icon: '📦', text: 'Real-time Inventory Tracking' },
                            { icon: '📷', text: 'Barcode & QR Code Scanner' },
                            { icon: '📊', text: 'Stock Analytics & Reports' },
                            { icon: '🔔', text: 'Low Stock Alerts' },
                        ].map(({ icon, text }) => (
                            <div key={text} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/80"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <span className="text-base">{icon}</span>
                                <span className="font-medium">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom tagline */}
                <div className="absolute bottom-6 left-0 right-0 text-center">
                    <p className="text-white/20 text-xs">© 2026 AirCon IMS · All rights reserved</p>
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
                <div className="w-full max-w-md">

                    {/* Mobile logo */}
                    <div className="flex md:hidden items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0891b2)' }}>
                            <MdAcUnit className="text-white text-xl" />
                        </div>
                        <div>
                            <p className="font-black text-gray-900 text-lg leading-none">AirCon IMS</p>
                            <p className="text-gray-400 text-xs">Inventory Management System</p>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

                        {/* Header */}
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Secure Login
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-1">Welcome!</h2>
                            <p className="text-gray-500 text-sm">Sign in to manage your aircon inventory</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">

                            {/* Email */}
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">📧</span>
                                    <input
                                        type="email"
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <a href="#" className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔒</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{ background: loading ? '#6b7280' : 'linear-gradient(135deg, #1d4ed8, #0891b2)' }}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <FaPaperPlane className="text-sm" />
                                        Sign In to Dashboard
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400 font-medium">New here?</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {/* Sign Up Link */}
                        <Link to="/signup"
                            className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            ✨ Create New Account
                        </Link>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-xs text-gray-400 mt-6">
                        Protected by Supabase Authentication · Secured with JWT
                    </p>
                </div>
            </div>

            {/* Keyframe styles */}
            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
      `}</style>
        </div>
    )
}

export default Login