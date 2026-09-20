import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const INTEREST_COLOR = { yes: '#16a34a', maybe: '#d97706', no: '#dc2626' };

function StatCard({ label, value, sub, color = 'text-gray-800' }) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    );
}

// Group businesses by district, then by ward within district
function buildClusters(businesses) {
    const map = {};
    for (const b of businesses) {
        const district = b.district || 'Unknown district';
        const ward = b.ward || 'Unknown ward';
        if (!map[district]) map[district] = {};
        if (!map[district][ward]) map[district][ward] = [];
        map[district][ward].push(b);
    }
    return map;
}

function Overview() {
    const [stats, setStats] = useState(null);
    useEffect(() => { api.get('/dashboard/stats').then(r => setStats(r.data)); }, []);
    if (!stats) return <div className="p-6 text-gray-400">Loading…</div>;
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Businesses surveyed" value={stats.total_businesses} />
                <StatCard label="Egg buyers" value={stats.egg_buyers} sub={`${stats.total_egg_trays_per_purchase} trays/purchase`} />
                <StatCard label="Chicken buyers" value={stats.chicken_buyers} sub={`${stats.total_chicken_birds_per_week} birds/wk`} />
                <StatCard label="Interested prospects" value={stats.interested_prospects} color="text-amber-700" />
            </div>
            <div>
                <h3 className="font-semibold text-gray-700 mb-3">Recent Visits</h3>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>{['Business', 'Area', 'Agent', 'Interest', 'Date'].map(h => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.recent_visits.map(v => (
                                <tr key={v.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{v.business_name}</td>
                                    <td className="px-4 py-2 text-gray-500">{v.area}</td>
                                    <td className="px-4 py-2 text-gray-500">{v.agent_name}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.interested_in_supply === 'yes' ? 'bg-green-100 text-green-700' : v.interested_in_supply === 'maybe' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                            {v.interested_in_supply}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-400 text-xs">{new Date(v.visited_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MapView() {
    const [buyers, setBuyers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [show, setShow] = useState({ buyers: true, suppliers: true });

    useEffect(() => {
        api.get('/dashboard/map').then(r => setBuyers(r.data));
        api.get('/dashboard/farmers/map').then(r => setSuppliers(r.data));
    }, []);

    const all = [...(show.buyers ? buyers : []), ...(show.suppliers ? suppliers : [])];
    const center = all.length ? [all[0].lat, all[0].lng] : [-6.7924, 39.2083];

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Map</h2>
                <div className="flex gap-3 text-sm">
                    {[['buyers', '🏪 Buyers', buyers.length], ['suppliers', '🌾 Suppliers', suppliers.length]].map(([k, label, count]) => (
                        <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={show[k]} onChange={e => setShow(s => ({ ...s, [k]: e.target.checked }))} className="accent-amber-600" />
                            <span>{label} ({count})</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-sm" style={{ height: 500 }}>
                <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                    {show.buyers && buyers.map(p => (
                        <CircleMarker key={`b-${p.id}`} center={[p.lat, p.lng]} radius={7} fillColor={INTEREST_COLOR[p.interested_in_supply] || '#6b7280'} fillOpacity={0.85} stroke={false}>
                            <Popup><strong>{p.name}</strong><br />{p.type} · {p.area}<br />Interest: {p.interested_in_supply ?? 'unknown'}</Popup>
                        </CircleMarker>
                    ))}
                    {show.suppliers && suppliers.map(p => (
                        <CircleMarker key={`s-${p.id}`} center={[p.lat, p.lng]} radius={8} fillColor="#3b82f6" fillOpacity={0.85} color="#1d4ed8" weight={2}>
                            <Popup><strong>🌾 {p.name}</strong><br />{p.area}{p.district ? ` · ${p.district}` : ''}<br />Products: {p.products.join(', ')}</Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block bg-green-600" />Buyer interested</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block bg-yellow-500" />Buyer maybe</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block bg-red-500" />Buyer no</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-blue-700 inline-block bg-blue-400" />Supplier</span>
            </div>
        </div>
    );
}

function Clusters() {
    const [businesses, setBusinesses] = useState([]);
    useEffect(() => { api.get('/dashboard/businesses', { params: { per_page: 500 } }).then(r => setBusinesses(r.data.data || [])); }, []);
    const clusters = buildClusters(businesses);

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Geographic Clusters</h2>
            <p className="text-sm text-gray-500">Businesses grouped by district and ward — useful for planning delivery routes.</p>
            {Object.entries(clusters).map(([district, wards]) => (
                <div key={district} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">{district}</h3>
                        <span className="text-xs text-gray-400">{Object.values(wards).flat().length} businesses</span>
                    </div>
                    {Object.entries(wards).map(([ward, items]) => (
                        <div key={ward} className="px-4 py-3 border-b last:border-0">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-gray-700">{ward}</h4>
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{items.length} businesses</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {items.map(b => (
                                    <span key={b.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{b.name}</span>
                                ))}
                            </div>
                            <div className="mt-1.5 text-xs text-gray-400">
                                {items.filter(b => b.egg_demand?.buys_eggs).length > 0 && <span className="mr-3">🥚 {items.filter(b => b.egg_demand?.buys_eggs).length} egg buyers</span>}
                                {items.filter(b => b.chicken_demand?.buys_chicken).length > 0 && <span>🐔 {items.filter(b => b.chicken_demand?.buys_chicken).length} chicken buyers</span>}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
            {Object.keys(clusters).length === 0 && <p className="text-gray-400 text-sm">No businesses with location data yet.</p>}
        </div>
    );
}

function BusinessList() {
    const [businesses, setBusinesses] = useState(null);
    const [filters, setFilters] = useState({ area: '', type: '', product: '', interest: '' });

    const load = () => {
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
        api.get('/dashboard/businesses', { params }).then(r => setBusinesses(r.data));
    };

    useEffect(() => { load(); }, []);

    const exportCSV = () => {
        if (!businesses?.data) return;
        const rows = [['Name', 'Type', 'Area', 'Ward', 'District', 'Egg Buyer', 'Trays/Purchase', 'Egg Freq', 'Chicken Buyer', 'Birds/Wk', 'Chicken Freq', 'Interest', 'Agent']];
        businesses.data.forEach(b => rows.push([
            b.name, b.type, b.area, b.ward || '', b.district || '',
            b.egg_demand?.buys_eggs ? 'Yes' : 'No',
            b.egg_demand?.trays_per_purchase ?? '',
            b.egg_demand?.frequency ?? '',
            b.chicken_demand?.buys_chicken ? 'Yes' : 'No',
            b.chicken_demand?.birds_per_week ?? '',
            b.chicken_demand?.frequency ?? '',
            b.latest_visit?.interested_in_supply ?? '',
            b.field_agent?.name ?? '',
        ]));
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = 'data:text/csv,' + encodeURIComponent(csv);
        a.download = 'sokokuku-businesses.csv';
        a.click();
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Businesses</h2>
                <button onClick={exportCSV} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">Export CSV</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {[['area', 'Area/Ward'], ['type', 'Type']].map(([k, label]) => (
                    <input key={k} placeholder={label} value={filters[k]} onChange={e => setFilters(f => ({ ...f, [k]: e.target.value }))} className="border rounded-lg px-3 py-1.5 text-sm w-36" />
                ))}
                <select value={filters.product} onChange={e => setFilters(f => ({ ...f, product: e.target.value }))} className="border rounded-lg px-3 py-1.5 text-sm">
                    <option value="">All products</option>
                    <option value="egg">Eggs</option>
                    <option value="chicken">Chicken</option>
                </select>
                <select value={filters.interest} onChange={e => setFilters(f => ({ ...f, interest: e.target.value }))} className="border rounded-lg px-3 py-1.5 text-sm">
                    <option value="">All interest</option>
                    <option value="yes">Interested</option>
                    <option value="maybe">Maybe</option>
                    <option value="no">No</option>
                </select>
                <button onClick={load} className="bg-amber-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-amber-700 transition">Filter</button>
            </div>
            {!businesses ? <div className="text-gray-400">Loading…</div> : (
                <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>{['Business', 'Type', 'Area', 'Ward', 'Eggs', 'Chicken', 'Interest', 'Agent'].map(h => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {businesses.data?.map(b => (
                                <tr key={b.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{b.name}</td>
                                    <td className="px-4 py-2 text-gray-500 capitalize">{b.type}</td>
                                    <td className="px-4 py-2 text-gray-500">{b.area}</td>
                                    <td className="px-4 py-2 text-gray-400 text-xs">{b.ward || '—'}</td>
                                    <td className="px-4 py-2 text-xs">{b.egg_demand?.buys_eggs ? <span className="text-green-700">{b.egg_demand.trays_per_purchase} trays<br /><span className="text-gray-400">{b.egg_demand.frequency}</span></span> : <span className="text-gray-300">—</span>}</td>
                                    <td className="px-4 py-2 text-xs">{b.chicken_demand?.buys_chicken ? <span className="text-blue-700">{b.chicken_demand.birds_per_week} birds/wk<br /><span className="text-gray-400">{b.chicken_demand.frequency}</span></span> : <span className="text-gray-300">—</span>}</td>
                                    <td className="px-4 py-2">
                                        {b.latest_visit?.interested_in_supply && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.latest_visit.interested_in_supply === 'yes' ? 'bg-green-100 text-green-700' : b.latest_visit.interested_in_supply === 'maybe' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {b.latest_visit.interested_in_supply}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-gray-400 text-xs">{b.field_agent?.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-4 py-2 text-xs text-gray-400 border-t">
                        {businesses.total} total · page {businesses.current_page} of {businesses.last_page}
                    </div>
                </div>
            )}
        </div>
    );
}

function FarmerList() {
    const [farmers, setFarmers] = useState(null);
    const [filters, setFilters] = useState({ area: '', product: '' });

    const load = () => {
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
        api.get('/dashboard/farmers', { params }).then(r => setFarmers(r.data));
    };

    useEffect(() => { load(); }, []);

    const exportCSV = () => {
        if (!farmers?.data) return;
        const rows = [['Name', 'Phone', 'Area', 'Ward', 'District', 'Eggs/wk', 'Egg Price', 'Chickens/wk', 'Chicken Price', 'Can Deliver', 'Can Collect', 'Agent']];
        farmers.data.forEach(f => {
            const egg = f.products?.find(p => p.product_type === 'egg');
            const chk = f.products?.find(p => p.product_type === 'chicken');
            rows.push([f.name, f.phone, f.area, f.ward || '', f.district || '', egg?.egg_trays_per_week ?? '', egg?.egg_price_per_tray ?? '', chk?.chicken_birds_per_week ?? '', chk?.chicken_price_per_bird ?? '', f.can_deliver ? 'Yes' : 'No', f.can_collect ? 'Yes' : 'No', f.field_agent?.name ?? '']);
        });
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'sokokuku-suppliers.csv'; a.click();
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Suppliers / Farmers</h2>
                <button onClick={exportCSV} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">Export CSV</button>
            </div>
            <div className="flex gap-2">
                <input placeholder="Area / district" value={filters.area} onChange={e => setFilters(f => ({ ...f, area: e.target.value }))} className="border rounded-lg px-3 py-1.5 text-sm w-40" />
                <select value={filters.product} onChange={e => setFilters(f => ({ ...f, product: e.target.value }))} className="border rounded-lg px-3 py-1.5 text-sm">
                    <option value="">All products</option>
                    <option value="egg">Eggs</option>
                    <option value="chicken">Chicken</option>
                </select>
                <button onClick={load} className="bg-amber-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-amber-700 transition">Filter</button>
            </div>
            {!farmers ? <div className="text-gray-400">Loading…</div> : (
                <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>{['Name', 'Phone', 'Area', 'District', 'Eggs/wk', 'Chickens/wk', 'Delivery', 'Agent'].map(h => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {farmers.data?.map(f => {
                                const egg = f.products?.find(p => p.product_type === 'egg');
                                const chk = f.products?.find(p => p.product_type === 'chicken');
                                return (
                                    <tr key={f.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium">{f.name}</td>
                                        <td className="px-4 py-2 text-gray-500">{f.phone}</td>
                                        <td className="px-4 py-2 text-gray-500">{f.area}</td>
                                        <td className="px-4 py-2 text-gray-400 text-xs">{f.district || '—'}</td>
                                        <td className="px-4 py-2 text-xs text-green-700">{egg ? `${egg.egg_trays_per_week} trays` : '—'}</td>
                                        <td className="px-4 py-2 text-xs text-blue-700">{chk ? `${chk.chicken_birds_per_week} birds` : '—'}</td>
                                        <td className="px-4 py-2 text-xs text-gray-500">{f.can_deliver ? '🚚 Delivers' : ''}{f.can_deliver && f.can_collect ? ' · ' : ''}{f.can_collect ? '🏠 Collect' : ''}</td>
                                        <td className="px-4 py-2 text-gray-400 text-xs">{f.field_agent?.name}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="px-4 py-2 text-xs text-gray-400 border-t">{farmers.total} total</div>
                </div>
            )}
        </div>
    );
}

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navClass = ({ isActive }) =>
        `px-3 py-1.5 text-sm font-medium rounded-lg transition ${
            isActive ? 'bg-amber-800 text-white shadow-sm' : 'text-amber-100 hover:bg-amber-700/60'
        }`;

    return (
        <div className="min-h-screen bg-amber-50/50">
            <header
                className="text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2 shadow-md"
                style={{ background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)' }}
            >
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 mr-1">
                        <span className="text-xl">🐔</span>
                        <h1 className="font-extrabold text-lg tracking-tight">SokoKuku</h1>
                    </div>
                    <nav className="flex flex-wrap gap-1">
                        <NavLink to="/dashboard" end className={navClass}>Overview</NavLink>
                        <NavLink to="/dashboard/businesses" className={navClass}>Businesses</NavLink>
                        <NavLink to="/dashboard/suppliers" className={navClass}>Suppliers</NavLink>
                        <NavLink to="/dashboard/map" className={navClass}>Map</NavLink>
                        <NavLink to="/dashboard/clusters" className={navClass}>Clusters</NavLink>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-amber-200 text-sm">{user?.name}</span>
                    <button onClick={logout} className="text-amber-200 text-sm hover:text-white transition">Sign out</button>
                </div>
            </header>
            <main>
                <Routes>
                    <Route index element={<Overview />} />
                    <Route path="businesses" element={<BusinessList />} />
                    <Route path="suppliers" element={<FarmerList />} />
                    <Route path="map" element={<MapView />} />
                    <Route path="clusters" element={<Clusters />} />
                </Routes>
            </main>
        </div>
    );
}
