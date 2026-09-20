import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login';
import AgentSurvey from './Pages/AgentSurvey';
import AgentFarmer from './Pages/AgentFarmer';
import AdminDashboard from './Pages/AdminDashboard';
import { AuthProvider, useAuth } from './hooks/useAuth';
import '../css/app.css';

function PrivateRoute({ children, role }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen text-amber-700">Loading…</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;
    return children;
}

const AGENT_TABS = [
    { key: 'survey', label: '📋 Survey', emoji: '📋' },
    { key: 'supplier', label: '🌾 Supplier', emoji: '🌾' },
];

function AgentShell() {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState('survey');

    return (
        <div className="min-h-screen bg-amber-50">
            {/* Header */}
            <header
                className="text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md"
                style={{ background: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)' }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl">🐔</span>
                    <div>
                        <h1 className="font-bold text-base leading-tight">SokoKuku</h1>
                        <p className="text-amber-200 text-xs">{user?.name}</p>
                    </div>
                </div>
                <button onClick={logout} className="text-amber-200 text-sm hover:text-white transition">
                    Sign out
                </button>
            </header>

            {/* Tab content */}
            <div className="pb-16">
                {tab === 'survey' ? <AgentSurvey /> : <AgentFarmer />}
            </div>

            {/* Bottom tabs */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 flex z-20 shadow-[0_-1px_6px_rgba(0,0,0,0.06)]">
                {AGENT_TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 py-3 text-sm font-medium transition flex flex-col items-center gap-0.5
                            ${tab === t.key
                                ? 'text-amber-700 border-t-2 border-amber-600 bg-amber-50'
                                : 'text-gray-400 border-t-2 border-transparent'}`}
                    >
                        <span className="text-base">{t.emoji}</span>
                        <span className="text-xs">{t.key === 'survey' ? 'Survey' : 'Supplier'}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}

function AppRoutes() {
    const { user } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
                <PrivateRoute>
                    {user?.role === 'admin' ? <Navigate to="/dashboard" replace /> : <Navigate to="/agent" replace />}
                </PrivateRoute>
            } />
            <Route path="/agent/*" element={<PrivateRoute role="field_agent"><AgentShell /></PrivateRoute>} />
            <Route path="/dashboard/*" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    </BrowserRouter>
);
