import React, { useState } from 'react';
import GPSCapture from '../Components/GPSCapture';
import api from '../lib/api';

function blankProduct(type) {
    return {
        product_type: type,
        egg_trays_per_week: '',
        egg_price_per_tray: '',
        chicken_birds_per_week: '',
        chicken_price_per_bird: '',
        chicken_avg_weight_kg: '',
        current_stock: '',
        next_harvest_date: '',
    };
}

function blankForm() {
    return {
        name: '', phone: '', address: '', area: '',
        latitude: null, longitude: null, gps_accuracy: null, gps_captured_at: null,
        place_name: null, ward: null, district: null,
        can_deliver: false, can_collect: false, notes: '',
        sells_eggs: false, sells_chicken: false,
        egg_product: blankProduct('egg'),
        chicken_product: blankProduct('chicken'),
    };
}

export default function AgentFarmer() {
    const [form, setForm] = useState(blankForm());
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
    const setProduct = (type, field, value) => setForm(f => ({ ...f, [`${type}_product`]: { ...f[`${type}_product`], [field]: value } }));

    const onGPS = (pos) => {
        setForm(f => ({
            ...f,
            latitude: pos.lat,
            longitude: pos.lng,
            gps_accuracy: pos.accuracy,
            gps_captured_at: pos.captured_at,
            place_name: pos.place_name,
            ward: pos.ward,
            district: pos.district,
            area: f.area || pos.ward || pos.district || f.area,
        }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.sells_eggs && !form.sells_chicken) {
            setError('Select at least one product (eggs or chicken).');
            return;
        }
        setSaving(true);
        setError('');

        const products = [];
        if (form.sells_eggs) products.push(form.egg_product);
        if (form.sells_chicken) products.push(form.chicken_product);

        const payload = {
            name: form.name,
            phone: form.phone,
            address: form.address,
            area: form.area,
            latitude: form.latitude,
            longitude: form.longitude,
            gps_accuracy: form.gps_accuracy,
            gps_captured_at: form.gps_captured_at,
            place_name: form.place_name,
            ward: form.ward,
            district: form.district,
            can_deliver: form.can_deliver,
            can_collect: form.can_collect,
            notes: form.notes,
            products,
        };

        try {
            await api.post('/farmers', payload);
            setMsg(`Supplier "${form.name}" registered!`);
            setForm(blankForm());
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save. Check your connection.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pb-10">
            {msg && <div className="bg-green-600 text-white text-sm px-4 py-2 text-center font-medium">{msg}</div>}

            <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-4 space-y-5">

                {/* Supplier Info */}
                <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <h2 className="font-semibold text-gray-800">Supplier / Farmer Info</h2>
                    <input required placeholder="Full name *" value={form.name} onChange={e => set('name', e.target.value)} className="input" />
                    <input required placeholder="Phone number *" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="input" />
                    <input placeholder="Area / village *" required value={form.area} onChange={e => set('area', e.target.value)} className="input" />
                    <input placeholder="Address (optional)" value={form.address} onChange={e => set('address', e.target.value)} className="input" />
                    <GPSCapture onCapture={onGPS} />
                </section>

                {/* Logistics */}
                <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <h2 className="font-semibold text-gray-800">Delivery Capability</h2>
                    <div className="flex gap-3">
                        <label className="flex items-center gap-2 flex-1 border rounded-lg px-3 py-2.5 cursor-pointer">
                            <input type="checkbox" checked={form.can_deliver} onChange={e => set('can_deliver', e.target.checked)} className="w-4 h-4 accent-green-600" />
                            <span className="text-sm text-gray-700">Can deliver to buyer</span>
                        </label>
                        <label className="flex items-center gap-2 flex-1 border rounded-lg px-3 py-2.5 cursor-pointer">
                            <input type="checkbox" checked={form.can_collect} onChange={e => set('can_collect', e.target.checked)} className="w-4 h-4 accent-green-600" />
                            <span className="text-sm text-gray-700">Buyer can collect</span>
                        </label>
                    </div>
                </section>

                {/* Products */}
                <section className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                    <h2 className="font-semibold text-gray-800">Products Supplied</h2>

                    {/* Eggs */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="sells_eggs" checked={form.sells_eggs} onChange={e => set('sells_eggs', e.target.checked)} className="w-4 h-4 accent-green-600" />
                            <label htmlFor="sells_eggs" className="font-medium text-gray-700">Supplies Eggs</label>
                        </div>
                        {form.sells_eggs && (
                            <div className="space-y-2 pl-6">
                                <input placeholder="Trays per week" type="number" min="0" value={form.egg_product.egg_trays_per_week} onChange={e => setProduct('egg', 'egg_trays_per_week', e.target.value)} className="input" />
                                <input placeholder="Price per tray (TSh)" type="number" min="0" value={form.egg_product.egg_price_per_tray} onChange={e => setProduct('egg', 'egg_price_per_tray', e.target.value)} className="input" />
                                <input placeholder="Current stock (trays)" type="number" min="0" value={form.egg_product.current_stock} onChange={e => setProduct('egg', 'current_stock', e.target.value)} className="input" />
                            </div>
                        )}
                    </div>

                    {/* Chicken */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="sells_chicken" checked={form.sells_chicken} onChange={e => set('sells_chicken', e.target.checked)} className="w-4 h-4 accent-green-600" />
                            <label htmlFor="sells_chicken" className="font-medium text-gray-700">Supplies Chicken</label>
                        </div>
                        {form.sells_chicken && (
                            <div className="space-y-2 pl-6">
                                <input placeholder="Birds per week" type="number" min="0" value={form.chicken_product.chicken_birds_per_week} onChange={e => setProduct('chicken', 'chicken_birds_per_week', e.target.value)} className="input" />
                                <input placeholder="Price per bird (TSh)" type="number" min="0" value={form.chicken_product.chicken_price_per_bird} onChange={e => setProduct('chicken', 'chicken_price_per_bird', e.target.value)} className="input" />
                                <input placeholder="Avg weight (kg)" type="number" step="0.1" min="0" value={form.chicken_product.chicken_avg_weight_kg} onChange={e => setProduct('chicken', 'chicken_avg_weight_kg', e.target.value)} className="input" />
                                <input placeholder="Current stock (birds)" type="number" min="0" value={form.chicken_product.current_stock} onChange={e => setProduct('chicken', 'current_stock', e.target.value)} className="input" />
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Next harvest date</label>
                                    <input type="date" value={form.chicken_product.next_harvest_date} onChange={e => setProduct('chicken', 'next_harvest_date', e.target.value)} className="input" />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <textarea placeholder="Notes (optional)" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} className="input resize-none" />

                {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-lg transition shadow">
                    {saving ? 'Saving…' : 'Register Supplier'}
                </button>
            </form>
        </div>
    );
}
