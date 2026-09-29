import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const INPUT = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400';
const LABEL = 'block text-xs text-gray-500 mb-0.5';

function EditForm({ b, onSaved, onCancel }) {
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
        <form onSubmit={save} className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
                <button type="button" onClick={onCancel} className="text-amber-700 text-sm font-medium">← Back</button>
                <h2 className="text-base font-bold text-gray-800">Edit Survey</h2>
            </div>
            <p className="text-sm text-gray-500">{b.name}</p>

            {/* Business info */}
            <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Business info</p>
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
                <div><label className={LABEL}>Contact phone</label><input type="tel" className={INPUT} value={form.business.contact_phone} onChange={e => sf('business','contact_phone',e.target.value)} /></div>
            </div>

            {/* Egg demand */}
            <div className="border rounded-xl p-3 space-y-3 bg-green-50/50">
                <label className="flex items-center gap-2 text-sm font-medium text-green-800 cursor-pointer">
                    <input type="checkbox" checked={form.egg.buys_eggs} onChange={e => sf('egg','buys_eggs',e.target.checked)} className="accent-green-600 w-4 h-4" />
                    Buys eggs
                </label>
                {form.egg.buys_eggs && (
                    <div className="space-y-2">
                        <div><label className={LABEL}>Trays per purchase</label><input type="number" className={INPUT} value={form.egg.trays_per_purchase} onChange={e => sf('egg','trays_per_purchase',e.target.value)} min="1" /></div>
                        <div><label className={LABEL}>Frequency</label><input className={INPUT} value={form.egg.frequency} onChange={e => sf('egg','frequency',e.target.value)} /></div>
                        <div><label className={LABEL}>Price per tray (TSh)</label><input type="number" className={INPUT} value={form.egg.price_per_tray} onChange={e => sf('egg','price_per_tray',e.target.value)} min="0" /></div>
                        <div><label className={LABEL}>Grade</label><input className={INPUT} value={form.egg.grade} onChange={e => sf('egg','grade',e.target.value)} /></div>
                        <div><label className={LABEL}>Current supplier</label><input className={INPUT} value={form.egg.current_supplier} onChange={e => sf('egg','current_supplier',e.target.value)} /></div>
                    </div>
                )}
            </div>

            {/* Chicken demand */}
            <div className="border rounded-xl p-3 space-y-3 bg-blue-50/50">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-800 cursor-pointer">
                    <input type="checkbox" checked={form.chicken.buys_chicken} onChange={e => sf('chicken','buys_chicken',e.target.checked)} className="accent-blue-600 w-4 h-4" />
                    Buys chicken
                </label>
                {form.chicken.buys_chicken && (
                    <div className="space-y-2">
                        <div><label className={LABEL}>Birds per week</label><input type="number" className={INPUT} value={form.chicken.birds_per_week} onChange={e => sf('chicken','birds_per_week',e.target.value)} min="1" /></div>
                        <div><label className={LABEL}>Frequency</label><input className={INPUT} value={form.chicken.frequency} onChange={e => sf('chicken','frequency',e.target.value)} /></div>
                        <div><label className={LABEL}>Price per bird (TSh)</label><input type="number" className={INPUT} value={form.chicken.price_per_bird} onChange={e => sf('chicken','price_per_bird',e.target.value)} min="0" /></div>
                        <div><label className={LABEL}>Preferred weight (kg)</label><input type="number" step="0.1" className={INPUT} value={form.chicken.preferred_weight_kg} onChange={e => sf('chicken','preferred_weight_kg',e.target.value)} min="0" /></div>
                        <div><label className={LABEL}>Current supplier</label><input className={INPUT} value={form.chicken.current_supplier} onChange={e => sf('chicken','current_supplier',e.target.value)} /></div>
                    </div>
                )}
            </div>

            {/* Visit details */}
            <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Visit details</p>
                <div>
                    <label className={LABEL}>Interest in supply *</label>
                    <select className={INPUT} value={form.interested_in_supply} onChange={e => sf(null,'interested_in_supply',e.target.value)}>
                        <option value="yes">Yes — interested</option>
                        <option value="maybe">Maybe</option>
                        <option value="no">No</option>
                    </select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.marketing_permission} onChange={e => sf(null,'marketing_permission',e.target.checked)} className="accent-amber-600 w-4 h-4" />
                    Marketing permission granted
                </label>
                <div>
                    <label className={LABEL}>Notes</label>
                    <textarea className={INPUT} rows={3} value={form.notes} onChange={e => sf(null,'notes',e.target.value)} />
                </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={saving} className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 transition">
                {saving ? 'Saving…' : 'Save changes'}
            </button>
        </form>
    );
}

export default function AgentSubmissions() {
    const [businesses, setBusinesses] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const load = () => {
        api.get('/my-surveys').then(r => setBusinesses(r.data.data || []));
    };

    useEffect(() => { load(); }, []);

    const onSaved = (updated) => {
        setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
        setEditingId(null);
    };

    if (editingId !== null) {
        const b = businesses?.find(x => x.id === editingId);
        if (!b) return null;
        return (
            <div className="p-4">
                <EditForm b={b} onSaved={onSaved} onCancel={() => setEditingId(null)} />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            <h2 className="text-lg font-bold text-gray-800">My Surveys</h2>
            {!businesses ? (
                <p className="text-gray-400 text-sm">Loading…</p>
            ) : businesses.length === 0 ? (
                <p className="text-gray-400 text-sm">No surveys submitted yet. Use the Survey tab to add businesses.</p>
            ) : (
                <div className="space-y-2">
                    {businesses.map(b => (
                        <div key={b.id} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm">{b.name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{b.type} · {b.area}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {b.latest_visit?.interested_in_supply && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.latest_visit.interested_in_supply === 'yes' ? 'bg-green-100 text-green-700' : b.latest_visit.interested_in_supply === 'maybe' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {b.latest_visit.interested_in_supply}
                                            </span>
                                        )}
                                        {b.egg_demand?.buys_eggs && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">🥚 {b.egg_demand.trays_per_purchase} trays</span>}
                                        {b.chicken_demand?.buys_chicken && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">🐔 {b.chicken_demand.birds_per_week} birds/wk</span>}
                                    </div>
                                    {b.latest_visit?.visited_at && (
                                        <p className="text-xs text-gray-400 mt-1">{new Date(b.latest_visit.visited_at).toLocaleDateString()}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setEditingId(b.id)}
                                    className="shrink-0 text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-200 font-medium"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
