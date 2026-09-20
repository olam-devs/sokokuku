import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { enqueue, getPending, dequeue, pendingCount } from '../lib/offlineQueue';
import GPSCapture from '../Components/GPSCapture';
import FrequencyInput from '../Components/FrequencyInput';
import api from '../lib/api';

const BUSINESS_TYPES = ['hotel', 'restaurant', 'shop', 'supermarket', 'institution', 'other'];

function blankForm() {
    return {
        offline_uuid: crypto.randomUUID(),
        visited_at: new Date().toISOString(),
        business: { name: '', type: '', contact_person: '', contact_phone: '', address: '', area: '', latitude: null, longitude: null, gps_accuracy: null, gps_captured_at: null, place_name: null, ward: null, district: null },
        egg: { buys_eggs: false, trays_per_purchase: '', frequency: '', price_per_tray: '', grade: '', current_supplier: '' },
        chicken: { buys_chicken: false, birds_per_week: '', price_per_bird: '', preferred_weight_kg: '', frequency: '', current_supplier: '' },
        interested_in_supply: 'maybe',
        marketing_permission: false,
        notes: '',
    };
}

export default function AgentSurvey({ onNavigate, pendingCount: externalPending, onSync }) {
    const { user } = useAuth();
    const [form, setForm] = useState(blankForm());
    const [pending, setPending] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [msg, setMsg] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => { pendingCount().then(setPending); }, []);

    useEffect(() => {
        const onVisible = () => { if (document.visibilityState === 'visible') syncPending(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);

    const set = (section, field, value) => {
        if (section) setForm(f => ({ ...f, [section]: { ...f[section], [field]: value } }));
        else setForm(f => ({ ...f, [field]: value }));
    };

    const onGPS = (pos) => {
        setForm(f => ({
            ...f,
            business: {
                ...f.business,
                latitude: pos.lat,
                longitude: pos.lng,
                gps_accuracy: pos.accuracy,
                gps_captured_at: pos.captured_at,
                place_name: pos.place_name,
                ward: pos.ward,
                district: pos.district,
                // Auto-fill area from ward/district if empty
                area: f.business.area || pos.ward || pos.district || f.business.area,
            },
        }));
    };

    const syncPending = useCallback(async () => {
        const items = await getPending();
        if (!items.length) return;
        setSyncing(true);
        let synced = 0;
        for (const survey of items) {
            try {
                await api.post('/surveys', survey);
                await dequeue(survey.offline_uuid);
                synced++;
            } catch (e) {
                if (e.response?.status === 200) { await dequeue(survey.offline_uuid); synced++; }
            }
        }
        const c = await pendingCount();
        setPending(c);
        setMsg(`Synced ${synced} of ${items.length} surveys.`);
        setSyncing(false);
    }, []);

    const handleSubmit = async e => {
        e.preventDefault();
        const survey = { ...form, visited_at: new Date().toISOString() };
        try {
            await api.post('/surveys', survey);
            setMsg('Saved!');
        } catch {
            await enqueue(survey);
            const c = await pendingCount();
            setPending(c);
            setMsg(`Saved offline. ${c} pending.`);
        }
        setSubmitted(true);
        setTimeout(() => { setForm(blankForm()); setSubmitted(false); setMsg(''); }, 2500);
    };

    return (
        <div className="pb-24">
            {msg && <div className="bg-green-100 text-green-800 text-sm px-4 py-2 text-center sticky top-0 z-10">{msg}</div>}
            {submitted && <div className="bg-green-600 text-white text-sm px-4 py-2 text-center font-medium">Saved! Starting new form…</div>}

            <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-4 space-y-5">

                {/* Business Info */}
                <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <h2 className="font-semibold text-gray-800">Business Info</h2>
                    <input required placeholder="Business name *" value={form.business.name} onChange={e => set('business', 'name', e.target.value)} className="input" />
                    <select required value={form.business.type} onChange={e => set('business', 'type', e.target.value)} className="input">
                        <option value="">Business type *</option>
                        {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                    <input placeholder="Area / neighbourhood *" required value={form.business.area} onChange={e => set('business', 'area', e.target.value)} className="input" />
                    <input placeholder="Address (optional)" value={form.business.address} onChange={e => set('business', 'address', e.target.value)} className="input" />
                    <input placeholder="Contact person (optional)" value={form.business.contact_person} onChange={e => set('business', 'contact_person', e.target.value)} className="input" />
                    <input placeholder="Contact phone (optional)" type="tel" value={form.business.contact_phone} onChange={e => set('business', 'contact_phone', e.target.value)} className="input" />
                    <GPSCapture onCapture={onGPS} />
                </section>

                {/* Egg Demand */}
                <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="buys_eggs" checked={form.egg.buys_eggs} onChange={e => set('egg', 'buys_eggs', e.target.checked)} className="w-4 h-4 accent-green-600" />
                        <label htmlFor="buys_eggs" className="font-semibold text-gray-800">Buys Eggs</label>
                    </div>
                    {form.egg.buys_eggs && (
                        <div className="space-y-3 pt-1">
                            <input placeholder="Trays per purchase" type="number" min="1" value={form.egg.trays_per_purchase} onChange={e => set('egg', 'trays_per_purchase', e.target.value)} className="input" />
                            <FrequencyInput value={form.egg.frequency} onChange={v => set('egg', 'frequency', v)} />
                            <input placeholder="Price per tray (TSh)" type="number" min="0" value={form.egg.price_per_tray} onChange={e => set('egg', 'price_per_tray', e.target.value)} className="input" />
                            <input placeholder="Grade / size (optional)" value={form.egg.grade} onChange={e => set('egg', 'grade', e.target.value)} className="input" />
                            <input placeholder="Current supplier (optional)" value={form.egg.current_supplier} onChange={e => set('egg', 'current_supplier', e.target.value)} className="input" />
                        </div>
                    )}
                </section>

                {/* Chicken Demand */}
                <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="buys_chicken" checked={form.chicken.buys_chicken} onChange={e => set('chicken', 'buys_chicken', e.target.checked)} className="w-4 h-4 accent-green-600" />
                        <label htmlFor="buys_chicken" className="font-semibold text-gray-800">Buys Chicken</label>
                    </div>
                    {form.chicken.buys_chicken && (
                        <div className="space-y-3 pt-1">
                            <input placeholder="Birds per week" type="number" min="1" value={form.chicken.birds_per_week} onChange={e => set('chicken', 'birds_per_week', e.target.value)} className="input" />
                            <FrequencyInput value={form.chicken.frequency} onChange={v => set('chicken', 'frequency', v)} />
                            <input placeholder="Price per bird (TSh)" type="number" min="0" value={form.chicken.price_per_bird} onChange={e => set('chicken', 'price_per_bird', e.target.value)} className="input" />
                            <input placeholder="Preferred weight (kg)" type="number" step="0.1" min="0" value={form.chicken.preferred_weight_kg} onChange={e => set('chicken', 'preferred_weight_kg', e.target.value)} className="input" />
                            <input placeholder="Current supplier (optional)" value={form.chicken.current_supplier} onChange={e => set('chicken', 'current_supplier', e.target.value)} className="input" />
                        </div>
                    )}
                </section>

                {/* Conversion */}
                <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <h2 className="font-semibold text-gray-800">Interest in Supply</h2>
                    <div className="flex gap-2">
                        {[['yes', 'Interested ✓'], ['maybe', 'Maybe'], ['no', 'Not interested']].map(([v, label]) => (
                            <button key={v} type="button" onClick={() => set(null, 'interested_in_supply', v)}
                                className={`flex-1 py-2 text-sm rounded-lg border font-medium transition
                                    ${form.interested_in_supply === v
                                        ? v === 'yes' ? 'bg-green-600 text-white border-green-600'
                                          : v === 'maybe' ? 'bg-yellow-400 text-yellow-900 border-yellow-400'
                                          : 'bg-red-500 text-white border-red-500'
                                        : 'bg-white text-gray-500 border-gray-300'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="marketing" checked={form.marketing_permission} onChange={e => set(null, 'marketing_permission', e.target.checked)} className="w-4 h-4 accent-green-600" />
                        <label htmlFor="marketing" className="text-sm text-gray-700">Permission to contact about future supply</label>
                    </div>
                    <textarea placeholder="Notes (optional)" rows={3} value={form.notes} onChange={e => set(null, 'notes', e.target.value)} className="input resize-none" />
                </section>

                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-lg transition shadow">
                    Save Survey
                </button>
            </form>

            {/* Sync bar */}
            {pending > 0 && (
                <div className="fixed bottom-16 left-0 right-0 px-4">
                    <button onClick={syncPending} disabled={syncing}
                        className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 font-bold py-3 rounded-xl shadow-lg">
                        {syncing ? '⏳ Syncing…' : `⚠ ${pending} survey${pending > 1 ? 's' : ''} waiting to sync — tap to sync now`}
                    </button>
                </div>
            )}
        </div>
    );
}
