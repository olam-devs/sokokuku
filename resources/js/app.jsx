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
    if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;
    return children;
}

const AGENT_TABS = [
    { key: 'survey', label: '📋 Survey' },
    { key: 'supplier', label: '🌾 Supplier' },
];

function AgentShell() {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState('survey');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                <div>
                    <h1 className="font-bold text-lg leading-tight">SokoKuku</h1>
                    <p className="text-green-200 text-xs">{user?.name}</p>
                </div>
                <button onClick={logout} className="text-green-200 text-sm">Sign out</button>
            </header>

            {/* Tab content */}
            <div className="pb-4">
                {tab === 'survey' ? <AgentSurvey /> : <AgentFarmer />}
            </div>

            {/* Bottom tabs */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20 safe-area-bottom">
                {AGENT_TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 py-3 text-sm font-medium transition
                            ${tab === t.key ? 'text-green-700 border-t-2 border-green-600' : 'text-gray-400'}`}
                    >
                        {t.label}
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
