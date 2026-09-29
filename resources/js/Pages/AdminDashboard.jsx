import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import AgentSurvey from './AgentSurvey';
import AgentFarmer from './AgentFarmer';

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

const INPUT = 'w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400';
const LABEL = 'block text-xs text-gray-500 mb-0.5';

function BusinessEditForm({ b, onSaved, onCancel }) {
    const [form, setForm] = useState({
        business: {
            name: b.name || '',
            type: b.type || '',
            area: b.area || '',
            address: b.address || '',
            contact_person: b.contact_person || '',
            contact_phone: b.contact_phone || '',
        },
        egg: {
            buys_eggs: !!b.egg_demand?.buys_eggs,
            trays_per_purchase: b.egg_demand?.trays_per_purchase || '',
            frequency: b.egg_demand?.frequency || '',
            price_per_tray: b.egg_demand?.price_per_tray || '',
            grade: b.egg_demand?.grade || '',
            current_supplier: b.egg_demand?.current_supplier || '',
        },
        chicken: {
            buys_chicken: !!b.chicken_demand?.buys_chicken,
            birds_per_week: b.chicken_demand?.birds_per_week || '',
            frequency: b.chicken_demand?.frequency || '',
            price_per_bird: b.chicken_demand?.price_per_bird || '',
            preferred_weight_kg: b.chicken_demand?.preferred_weight_kg || '',
            current_supplier: b.chicken_demand?.current_supplier || '',
        },
        interested_in_supply: b.latest_visit?.interested_in_supply || 'maybe',
        marketing_permission: !!b.latest_visit?.marketing_permission,
        notes: b.latest_visit?.notes || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const sf = (section, field, value) => {
        if (section) setForm(f => ({ ...f, [section]: { ...f[section], [field]: value } }));
        else setForm(f => ({ ...f, [field]: value }));
    };

    const save = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaving(true); setError('');
        try {
            const { data } = await api.put(`/surveys/${b.id}`, form);
            onSaved(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={save} onClick={e => e.stopPropagation()} className="space-y-4">
            <p className="font-semibold text-gray-700 text-sm">Editing: {b.name}</p>
            {/* Business info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className={LABEL}>Business name *</label><input className={INPUT} value={form.business.name} onChange={e => sf('business','name',e.target.value)} required /></div>
                <div><label className={LABEL}>Type *</label>
                    <select className={INPUT} value={form.business.type} onChange={e => sf('business','type',e.target.value)} required>
                        <option value="">Select…</option>
                        {['hotel','restaurant','shop','supermarket','institution','other'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div><label className={LABEL}>Area *</label><input className={INPUT} value={form.business.area} onChange={e => sf('business','area',e.target.value)} required /></div>
                <div><label className={LABEL}>Address</label><input className={INPUT} value={form.business.address} onChange={e => sf('business','address',e.target.value)} /></div>
                <div><label className={LABEL}>Contact person</label><input className={INPUT} value={form.business.contact_person} onChange={e => sf('business','contact_person',e.target.value)} /></div>
                <div><label className={LABEL}>Contact phone</label><input className={INPUT} value={form.business.contact_phone} onChange={e => sf('business','contact_phone',e.target.value)} /></div>
            </div>
            {/* Egg demand */}
            <div className="border rounded-lg p-3 space-y-2 bg-green-50/40">
                <label className="flex items-center gap-2 text-sm font-medium text-green-800 cursor-pointer">
                    <input type="checkbox" checked={form.egg.buys_eggs} onChange={e => sf('egg','buys_eggs',e.target.checked)} className="accent-green-600" />
                    Buys eggs
                </label>
                {form.egg.buys_eggs && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div><label className={LABEL}>Trays/purchase</label><input type="number" className={INPUT} value={form.egg.trays_per_purchase} onChange={e => sf('egg','trays_per_purchase',e.target.value)} min="1" /></div>
                        <div><label className={LABEL}>Frequency</label><input className={INPUT} value={form.egg.frequency} onChange={e => sf('egg','frequency',e.target.value)} /></div>
                        <div><label className={LABEL}>Price/tray (TSh)</label><input type="number" className={INPUT} value={form.egg.price_per_tray} onChange={e => sf('egg','price_per_tray',e.target.value)} min="0" /></div>
                        <div><label className={LABEL}>Grade</label><input className={INPUT} value={form.egg.grade} onChange={e => sf('egg','grade',e.target.value)} /></div>
                        <div className="md:col-span-2"><label className={LABEL}>Current supplier</label><input className={INPUT} value={form.egg.current_supplier} onChange={e => sf('egg','current_supplier',e.target.value)} /></div>
                    </div>
                )}
            </div>
            {/* Chicken demand */}
            <div className="border rounded-lg p-3 space-y-2 bg-blue-50/40">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-800 cursor-pointer">
                    <input type="checkbox" checked={form.chicken.buys_chicken} onChange={e => sf('chicken','buys_chicken',e.target.checked)} className="accent-blue-600" />
                    Buys chicken
                </label>
                {form.chicken.buys_chicken && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div><label className={LABEL}>Birds/week</label><input type="number" className={INPUT} value={form.chicken.birds_per_week} onChange={e => sf('chicken','birds_per_week',e.target.value)} min="1" /></div>
                        <div><label className={LABEL}>Frequency</label><input className={INPUT} value={form.chicken.frequency} onChange={e => sf('chicken','frequency',e.target.value)} /></div>
                        <div><label className={LABEL}>Price/bird (TSh)</label><input type="number" className={INPUT} value={form.chicken.price_per_bird} onChange={e => sf('chicken','price_per_bird',e.target.value)} min="0" /></div>
                        <div><label className={LABEL}>Pref. weight (kg)</label><input type="number" step="0.1" className={INPUT} value={form.chicken.preferred_weight_kg} onChange={e => sf('chicken','preferred_weight_kg',e.target.value)} min="0" /></div>
                        <div className="md:col-span-2"><label className={LABEL}>Current supplier</label><input className={INPUT} value={form.chicken.current_supplier} onChange={e => sf('chicken','current_supplier',e.target.value)} /></div>
                    </div>
                )}
            </div>
            {/* Visit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className={LABEL}>Interest in supply *</label>
                    <select className={INPUT} value={form.interested_in_supply} onChange={e => sf(null,'interested_in_supply',e.target.value)}>
                        <option value="yes">Yes</option>
                        <option value="maybe">Maybe</option>
                        <option value="no">No</option>
                    </select>
                </div>
                <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.marketing_permission} onChange={e => sf(null,'marketing_permission',e.target.checked)} className="accent-amber-600" />
                        Marketing permission granted
                    </label>
                </div>
                <div className="md:col-span-2">
                    <label className={LABEL}>Notes</label>
                    <textarea className={INPUT} rows={3} value={form.notes} onChange={e => sf(null,'notes',e.target.value)} />
                </div>
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={saving} className="bg-amber-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium">
                    {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); onCancel(); }} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    Cancel
                </button>
            </div>
        </form>
    );
}

function DetailRow({ b, onSaved, onDeleted }) {
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const visit = b.latest_visit;
    const egg = b.egg_demand;
    const chk = b.chicken_demand;

    const handleDelete = async (e) => {
        e.stopPropagation();
        setDeleting(true);
        try {
            await api.delete(`/dashboard/businesses/${b.id}`);
            onDeleted(b.id);
        } catch {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    if (editing) {
        return (
            <tr className="bg-amber-50 border-b border-amber-200">
                <td colSpan={8} className="px-5 py-4">
                    <BusinessEditForm
                        b={b}
                        onSaved={(updated) => { setEditing(false); onSaved(updated); }}
                        onCancel={() => setEditing(false)}
                    />
                </td>
            </tr>
        );
    }

    return (
        <tr className="bg-amber-50/60 border-b border-amber-100">
            <td colSpan={8} className="px-5 py-4">
                <div className="flex justify-end gap-2 mb-2">
                    {confirmDelete ? (
                        <>
                            <span className="text-xs text-red-700 self-center font-medium">Delete "{b.name}"?</span>
                            <button onClick={handleDelete} disabled={deleting}
                                className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-medium disabled:opacity-50">
                                {deleting ? 'Deleting…' : 'Yes, delete'}
                            </button>
                            <button onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
                                className="text-xs border px-3 py-1 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={e => { e.stopPropagation(); setEditing(true); }}
                                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-lg font-medium"
                            >
                                Edit
                            </button>
                            <button
                                onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded-lg font-medium"
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* Contact */}
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Contact</p>
                        {b.address && <p><span className="text-gray-400">Address:</span> {b.address}</p>}
                        {b.contact_person && <p><span className="text-gray-400">Person:</span> {b.contact_person}</p>}
                        {b.contact_phone && <p><span className="text-gray-400">Phone:</span> <a href={`tel:${b.contact_phone}`} className="text-amber-700 font-medium">{b.contact_phone}</a></p>}
                        {b.ward && <p><span className="text-gray-400">Ward:</span> {b.ward}{b.district ? `, ${b.district}` : ''}</p>}
                        {!b.address && !b.contact_person && !b.contact_phone && <p className="text-gray-300 italic text-xs">No contact info recorded</p>}
                    </div>
                    {/* Products */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Products</p>
                        {egg?.buys_eggs ? (
                            <div className="text-xs space-y-0.5">
                                <p className="font-medium text-green-700">🥚 Eggs</p>
                                <p><span className="text-gray-400">Trays/purchase:</span> {egg.trays_per_purchase}</p>
                                {egg.frequency && <p><span className="text-gray-400">Frequency:</span> {egg.frequency}</p>}
                                {egg.price_per_tray && <p><span className="text-gray-400">Price/tray:</span> TSh {Number(egg.price_per_tray).toLocaleString()}</p>}
                                {egg.grade && <p><span className="text-gray-400">Grade:</span> {egg.grade}</p>}
                                {egg.current_supplier && <p><span className="text-gray-400">Current supplier:</span> {egg.current_supplier}</p>}
                            </div>
                        ) : <p className="text-xs text-gray-300">Does not buy eggs</p>}
                        {chk?.buys_chicken ? (
                            <div className="text-xs space-y-0.5 mt-2">
                                <p className="font-medium text-blue-700">🐔 Chicken</p>
                                <p><span className="text-gray-400">Birds/week:</span> {chk.birds_per_week}</p>
                                {chk.frequency && <p><span className="text-gray-400">Frequency:</span> {chk.frequency}</p>}
                                {chk.price_per_bird && <p><span className="text-gray-400">Price/bird:</span> TSh {Number(chk.price_per_bird).toLocaleString()}</p>}
                                {chk.preferred_weight_kg && <p><span className="text-gray-400">Pref. weight:</span> {chk.preferred_weight_kg} kg</p>}
                                {chk.current_supplier && <p><span className="text-gray-400">Current supplier:</span> {chk.current_supplier}</p>}
                            </div>
                        ) : <p className="text-xs text-gray-300 mt-2">Does not buy chicken</p>}
                    </div>
                    {/* Visit */}
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Visit Notes</p>
                        {visit?.notes ? (
                            <p className="text-gray-700 bg-white rounded-lg px-3 py-2 border text-xs leading-relaxed">{visit.notes}</p>
                        ) : (
                            <p className="text-gray-300 italic text-xs">No notes</p>
                        )}
                        {visit?.marketing_permission && (
                            <p className="text-xs text-green-700 font-medium mt-1">✓ Marketing permission granted</p>
                        )}
                        {visit?.visited_at && (
                            <p className="text-xs text-gray-400 mt-1">Visited: {new Date(visit.visited_at).toLocaleDateString()}</p>
                        )}
                        {b.field_agent?.name && (
                            <p className="text-xs text-gray-400">Agent: {b.field_agent.name}</p>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}

function BusinessList() {
    const [businesses, setBusinesses] = useState(null);
    const [filters, setFilters] = useState({ area: '', type: '', product: '', interest: '' });
    const [expanded, setExpanded] = useState(null);

    const load = () => {
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
        api.get('/dashboard/businesses', { params }).then(r => setBusinesses(r.data));
    };

    useEffect(() => { load(); }, []);

    const toggle = (id) => setExpanded(prev => prev === id ? null : id);

    const exportCSV = () => {
        if (!businesses?.data) return;
        const rows = [['Name', 'Type', 'Area', 'Ward', 'District', 'Address', 'Contact Person', 'Contact Phone', 'Egg Buyer', 'Trays/Purchase', 'Egg Freq', 'Egg Price', 'Egg Grade', 'Egg Supplier', 'Chicken Buyer', 'Birds/Wk', 'Chicken Freq', 'Chicken Price', 'Pref Weight', 'Chicken Supplier', 'Interest', 'Marketing Permission', 'Notes', 'Agent', 'Visit Date']];
        businesses.data.forEach(b => rows.push([
            b.name, b.type, b.area, b.ward || '', b.district || '', b.address || '', b.contact_person || '', b.contact_phone || '',
            b.egg_demand?.buys_eggs ? 'Yes' : 'No',
            b.egg_demand?.trays_per_purchase ?? '', b.egg_demand?.frequency ?? '', b.egg_demand?.price_per_tray ?? '', b.egg_demand?.grade ?? '', b.egg_demand?.current_supplier ?? '',
            b.chicken_demand?.buys_chicken ? 'Yes' : 'No',
            b.chicken_demand?.birds_per_week ?? '', b.chicken_demand?.frequency ?? '', b.chicken_demand?.price_per_bird ?? '', b.chicken_demand?.preferred_weight_kg ?? '', b.chicken_demand?.current_supplier ?? '',
            b.latest_visit?.interested_in_supply ?? '', b.latest_visit?.marketing_permission ? 'Yes' : 'No', b.latest_visit?.notes ?? '',
            b.field_agent?.name ?? '', b.latest_visit?.visited_at ? new Date(b.latest_visit.visited_at).toLocaleDateString() : '',
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
            <p className="text-xs text-gray-400">Click any row to see full details</p>
            {!businesses ? <div className="text-gray-400">Loading…</div> : (
                <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>{['Business', 'Type', 'Area', 'Ward', 'Eggs', 'Chicken', 'Interest', 'Agent'].map(h => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {businesses.data?.map(b => (
                                <React.Fragment key={b.id}>
                                    <tr onClick={() => toggle(b.id)} className="hover:bg-amber-50 cursor-pointer">
                                        <td className="px-4 py-2 font-medium">{b.name} <span className="text-gray-300 text-xs">{expanded === b.id ? '▲' : '▼'}</span></td>
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
                                    {expanded === b.id && (
                                        <DetailRow
                                            b={b}
                                            onSaved={updated => {
                                                setBusinesses(prev => ({ ...prev, data: prev.data.map(x => x.id === updated.id ? updated : x) }));
                                            }}
                                            onDeleted={id => {
                                                setExpanded(null);
                                                setBusinesses(prev => ({ ...prev, data: prev.data.filter(x => x.id !== id), total: prev.total - 1 }));
                                            }}
                                        />
                                    )}
                                </React.Fragment>
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
    const [confirmId, setConfirmId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
        api.get('/dashboard/farmers', { params }).then(r => setFarmers(r.data));
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await api.delete(`/dashboard/farmers/${id}`);
            setFarmers(prev => ({ ...prev, data: prev.data.filter(x => x.id !== id), total: prev.total - 1 }));
            setConfirmId(null);
        } catch {
            // leave confirm open so user can retry
        } finally {
            setDeleting(false);
        }
    };

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
                            <tr>{['Name', 'Phone', 'Area', 'District', 'Eggs/wk', 'Chickens/wk', 'Delivery', 'Agent', ''].map(h => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
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
                                        <td className="px-4 py-2 text-right">
                                            {confirmId === f.id ? (
                                                <span className="flex items-center justify-end gap-1.5 flex-wrap">
                                                    <span className="text-xs text-red-700 font-medium">Delete?</span>
                                                    <button onClick={() => handleDelete(f.id)} disabled={deleting}
                                                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg font-medium disabled:opacity-50">
                                                        {deleting ? '…' : 'Yes'}
                                                    </button>
                                                    <button onClick={() => setConfirmId(null)}
                                                        className="text-xs border px-2.5 py-1 rounded-lg hover:bg-gray-50">
                                                        No
                                                    </button>
                                                </span>
                                            ) : (
                                                <button onClick={() => setConfirmId(f.id)}
                                                    className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded-lg font-medium">
                                                    Delete
                                                </button>
                                            )}
                                        </td>
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
                        <span className="w-px bg-amber-600 mx-1 self-stretch" />
                        <NavLink to="/dashboard/add-business" className={navClass}>+ Business</NavLink>
                        <NavLink to="/dashboard/add-supplier" className={navClass}>+ Supplier</NavLink>
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
                    <Route path="add-business" element={<div className="max-w-lg mx-auto"><AgentSurvey /></div>} />
                    <Route path="add-supplier" element={<div className="max-w-lg mx-auto"><AgentFarmer /></div>} />
                </Routes>
            </main>
        </div>
    );
}
