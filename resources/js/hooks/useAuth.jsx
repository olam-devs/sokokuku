import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('sk_token');
        if (!token) { setLoading(false); return; }
        api.get('/me')
            .then(r => setUser(r.data))
            .catch(() => localStorage.removeItem('sk_token'))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/login', { email, password });
        localStorage.setItem('sk_token', data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try { await api.post('/logout'); } catch {}
        localStorage.removeItem('sk_token');
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
