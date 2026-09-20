import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HEN_URL  = 'https://images.unsplash.com/photo-1588597989061-b60ad0eefdbf?w=1400&q=85&auto=format&fit=crop';
const EGG_URL  = 'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=480&q=80&auto=format&fit=crop';

export default function Login() {
    const { login } = useAuth();
    const navigate  = useNavigate();
    const [form, setForm]     = useState({ email: '', password: '' });
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            navigate(user.role === 'admin' ? '/dashboard' : '/agent');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">

            {/* ── Photo panel ─────────────────────────────── */}
            <div className="relative h-60 sm:h-80 lg:h-auto lg:flex-[3] overflow-hidden">
                <img
                    src={HEN_URL}
                    alt="Free-range hens on green pasture"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {/* layered gradients for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 lg:bg-gradient-to-br lg:from-amber-950/50 lg:via-black/35 lg:to-black/75" />

                {/* Brand overlay — anchored to bottom */}
                <div className="relative h-full flex flex-col justify-end p-6 lg:p-10">

                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xl lg:text-4xl drop-shadow-lg">🐔</span>
                        <h1 className="text-white text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                            SokoKuku
                        </h1>
                    </div>
                    <p className="text-white/70 text-sm lg:text-base mb-5 font-medium">
                        Tanzania's Poultry Market Network
                    </p>

                    {/* Egg inset — visible on desktop only */}
                    <div className="hidden lg:flex items-center gap-4 mb-6">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/25 shadow-xl flex-shrink-0">
                            <img src={EGG_URL} alt="Fresh farm eggs" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-sm leading-relaxed">
                            <strong className="text-white block text-base">Fresh eggs &amp; quality poultry</strong>
                            <span className="text-white/65">Connecting farms to businesses<br />across Tanzania</span>
                        </div>
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2">
                        {['🥚 Eggs Daily', '🐓 Live Poultry', '🌾 Farm Direct'].map(t => (
                            <span key={t} className="text-xs text-white bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Form panel ──────────────────────────────── */}
            <div
                className="flex-1 lg:flex-[2] flex flex-col items-center justify-center px-6 py-10 min-h-0"
                style={{ background: 'linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)' }}
            >
                <div className="w-full max-w-sm">

                    {/* Logo mark */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 mb-4 shadow-sm">
                            <span className="text-3xl">🐔</span>
                        </div>
                        <h2 className="text-2xl font-bold text-amber-900">Welcome back</h2>
                        <p className="text-amber-700/60 text-sm mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-amber-900 mb-1.5">
                                Email address
                            </label>
                            <input
                                type="email" required
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm placeholder-gray-300"
                                autoComplete="email"
                                placeholder="agent@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-amber-900 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password" required
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm"
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="w-full text-white font-semibold py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)' }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Signing in…
                                </span>
                            ) : 'Sign in'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-amber-700/40 mt-8">
                        Powered by{' '}
                        <span className="font-semibold text-amber-700/60">Olam Technologies</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
