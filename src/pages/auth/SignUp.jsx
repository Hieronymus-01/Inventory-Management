import React, { useEffect, useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../utils/Supabase'
import { SessionContext } from '../../contexts/SessionContext'
import { useTheme } from '../../contexts/ThemeContext'
import { MdAcUnit, MdDarkMode, MdLightMode } from 'react-icons/md'
import { FaPaperPlane, FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa'

const SignUp = () => {
    const { session } = useContext(SessionContext)
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [step, setStep] = useState(1)

    useEffect(() => {
        if (session) navigate('/')
    }, [session])

    const getPasswordStrength = (pwd) => {
        if (!pwd) return { score: 0, label: '', color: '' }
        let score = 0
        if (pwd.length >= 8) score++
        if (/[A-Z]/.test(pwd)) score++
        if (/[0-9]/.test(pwd)) score++
        if (/[^A-Za-z0-9]/.test(pwd)) score++
        const map = [
            { score: 0, label: '', color: '' },
            { score: 1, label: 'Weak', color: 'bg-red-400' },
            { score: 2, label: 'Fair', color: 'bg-orange-400' },
            { score: 3, label: 'Good', color: 'bg-yellow-400' },
            { score: 4, label: 'Strong', color: 'bg-green-500' },
        ]
        return map[score]
    }

    const strength = getPasswordStrength(form.password)
    const passwordMatch = form.confirm && form.password === form.confirm

    const handleSignUp = async (e) => {
        e.preventDefault()
        if (form.password !== form.confirm) { alert('Passwords do not match'); return }
        if (form.password.length < 6) { alert('Password must be at least 6 characters'); return }
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
            setStep(2)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex">

            {/* ── LEFT PANEL ── */}
            <div className="hidden md:flex w-[420px] flex-shrink-0 relative overflow-hidden flex-col items-center justify-center"
                style={{ background: 'linear-gradient(145deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>

                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #10b981, transparent)', animation: 'pulse 4s ease-in-out infinite' }} />
                    <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', animation: 'pulse 3s ease-in-out infinite 1s' }} />
                    <div className="absolute -bottom-16 left-1/4 w-56 h-56 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', animation: 'pulse 5s ease-in-out infinite 0.5s' }} />
                    <div className="absolute inset-0 opacity-5"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                <div className="absolute top-16 right-8 opacity-10">
                    <MdAcUnit className="text-white text-6xl" style={{ animation: 'spin 20s linear infinite' }} />
                </div>
                <div className="absolute bottom-20 left-8 opacity-10">
                    <MdAcUnit className="text-white text-4xl" style={{ animation: 'spin 15s linear infinite reverse' }} />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center px-8">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-3xl blur-xl opacity-40"
                            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', transform: 'scale(1.2)' }} />
                        <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
                            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
                            <MdAcUnit className="text-white text-5xl" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">AirCon IMS</h1>
                    <p className="text-emerald-300 text-sm font-medium tracking-widest uppercase mb-8">
                        Inventory Management System
                    </p>

                    <div className="w-full max-w-xs space-y-3">
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-4">
                            Getting Started
                        </p>
                        {[
                            { num: '01', title: 'Create Account', desc: 'Fill in your details below' },
                            { num: '02', title: 'Start Managing', desc: 'Access your dashboard' },
                        ].map(({ num, title, desc }, i) => (
                            <div key={num} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs"
                                    style={{ background: i === 0 ? 'linear-gradient(135deg, #059669, #0891b2)' : 'rgba(255,255,255,0.1)', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                                    {num}
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-white/40'}`}>{title}</p>
                                    <p className={`text-xs ${i === 0 ? 'text-white/60' : 'text-white/20'}`}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-6 left-0 right-0 text-center">
                    <p className="text-white/20 text-xs">© 2026 AirCon IMS · All rights reserved</p>
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="flex-1 flex items-center justify-center bg-base-200 px-6 py-12 relative">

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-5 right-5 btn btn-ghost btn-sm btn-circle text-base-content/60 hover:bg-base-300"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <MdDarkMode className="text-lg" /> : <MdLightMode className="text-lg text-yellow-400" />}
                </button>

                <div className="w-full max-w-md">

                    {/* Mobile logo */}
                    <div className="flex md:hidden items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
                            <MdAcUnit className="text-white text-xl" />
                        </div>
                        <div>
                            <p className="font-black text-base-content text-lg leading-none">AirCon IMS</p>
                            <p className="text-base-content/40 text-xs">Inventory Management System</p>
                        </div>
                    </div>

                    {/* ── SUCCESS STATE ── */}
                    {step === 2 ? (
                        <div className="bg-base-100 rounded-3xl shadow-xl p-8 border border-base-200 text-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
                                <FaCheck className="text-white text-3xl" />
                            </div>
                            <h2 className="text-2xl font-black text-base-content mb-2">Account Created!</h2>
                            <p className="text-base-content/60 text-sm mb-2">
                                Welcome to AirCon IMS, <span className="font-bold text-base-content/80">{form.name}</span>!
                            </p>
                            <p className="text-base-content/40 text-xs mb-8">
                                Check your email <span className="font-semibold text-base-content/70">{form.email}</span> to verify your account, then sign in.
                            </p>
                            <div className="flex justify-center gap-2 mb-8">
                                {['bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-pink-400', 'bg-purple-400'].map((c, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full ${c} animate-bounce`}
                                        style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                            <Link to="/login"
                                className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:scale-[1.01]"
                                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0891b2)' }}>
                                <FaPaperPlane className="text-sm" />
                                Go to Sign In
                            </Link>
                        </div>
                    ) : (

                        /* ── FORM STATE ── */
                        <div className="bg-base-100 rounded-3xl shadow-xl p-8 border border-base-200">

                            <div className="mb-7">
                                <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    New Account
                                </div>
                                <h2 className="text-3xl font-black text-base-content mb-1">Create Account</h2>
                                <p className="text-base-content/60 text-sm">Join AirCon IMS to manage your inventory</p>
                            </div>

                            <form onSubmit={handleSignUp} className="space-y-4">

                                {/* Full Name */}
                                <div>
                                    <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider mb-2 block">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-lg">👤</span>
                                        <input
                                            type="text"
                                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-base-300 bg-base-200 text-base-content text-sm font-medium placeholder-base-content/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder="Juan dela Cruz"
                                            value={form.name}
                                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider mb-2 block">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-lg">📧</span>
                                        <input
                                            type="email"
                                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-base-300 bg-base-200 text-base-content text-sm font-medium placeholder-base-content/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder="juan.delacruz@email.com"
                                            value={form.email}
                                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider mb-2 block">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-lg">🔒</span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-base-300 bg-base-200 text-base-content text-sm font-medium placeholder-base-content/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder="Min. 6 characters"
                                            value={form.password}
                                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                            required
                                        />
                                        <button type="button" onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors">
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {form.password && (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-base-300'}`} />
                                                ))}
                                            </div>
                                            <p className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-500' : strength.score === 2 ? 'text-orange-500' : strength.score === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                {strength.label} password
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider mb-2 block">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-lg">🔐</span>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            className={`w-full pl-11 pr-12 py-3.5 rounded-2xl border bg-base-200 text-base-content text-sm font-medium placeholder-base-content/30 focus:outline-none focus:ring-2 focus:border-transparent transition-all
                                            ${form.confirm
                                                    ? passwordMatch
                                                        ? 'border-green-400 focus:ring-green-500'
                                                        : 'border-red-400 focus:ring-red-500'
                                                    : 'border-base-300 focus:ring-emerald-500'}`}
                                            placeholder="Re-enter your password"
                                            value={form.confirm}
                                            onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                                            required
                                        />
                                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors">
                                            {showConfirm ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                        {form.confirm && (
                                            <div className={`absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center
                                            ${passwordMatch ? 'bg-green-500' : 'bg-red-400'}`}>
                                                <span className="text-white text-xs">{passwordMatch ? '✓' : '✗'}</span>
                                            </div>
                                        )}
                                    </div>
                                    {form.confirm && !passwordMatch && (
                                        <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match</p>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading || (form.confirm && !passwordMatch)}
                                    className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                                    style={{ background: loading ? '#6b7280' : 'linear-gradient(135deg, #059669, #0891b2)' }}>
                                    {loading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane className="text-sm" />
                                            Create My Account
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px bg-base-200" />
                                <span className="text-xs text-base-content/40 font-medium">Have an account?</span>
                                <div className="flex-1 h-px bg-base-200" />
                            </div>

                            <Link to="/login"
                                className="w-full py-3.5 rounded-2xl border-2 border-base-300 text-base-content/70 font-bold text-sm flex items-center justify-center gap-2 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-500/5 transition-all">
                                👋 Sign In Instead
                            </Link>
                        </div>
                    )}

                    <p className="text-center text-xs text-base-content/30 mt-6">
                        Protected by Supabase Authentication · Secured with JWT
                    </p>
                </div>
            </div>

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

export default SignUp