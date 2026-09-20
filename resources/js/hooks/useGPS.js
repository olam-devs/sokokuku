import { useState, useRef, useCallback } from 'react';

const ACCURACY_TARGET = 15; // meters — stop watching when we hit this
const TIMEOUT_MS = 30000;   // give up after 30s, keep best reading

async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'SokoKuku/1.0' } }
        );
        const data = await res.json();
        const a = data.address || {};
        return {
            place_name: a.amenity || a.road || a.neighbourhood || a.suburb || a.quarter || null,
            ward: a.suburb || a.quarter || a.neighbourhood || null,
            district: a.city_district || a.district || a.county || a.city || null,
        };
    } catch {
        return { place_name: null, ward: null, district: null };
    }
}

export function useGPS() {
    const [status, setStatus] = useState('idle'); // idle | watching | good | timeout | error
    const [position, setPosition] = useState(null); // { lat, lng, accuracy, captured_at, place_name, ward, district }
    const watchIdRef = useRef(null);
    const bestRef = useRef(null);
    const timerRef = useRef(null);

    const stop = useCallback(() => {
        if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        watchIdRef.current = null;
        timerRef.current = null;
    }, []);

    const accept = useCallback(async (coords) => {
        stop();
        setStatus('good');
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        const pos = {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: Math.round(coords.accuracy),
            captured_at: new Date().toISOString(),
            ...geo,
        };
        setPosition(pos);
        return pos;
    }, [stop]);

    const start = useCallback(() => {
        if (!navigator.geolocation) { setStatus('error'); return; }
        setStatus('watching');
        bestRef.current = null;

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
                const acc = pos.coords.accuracy;
                if (!bestRef.current || acc < bestRef.current.accuracy) {
                    bestRef.current = pos.coords;
                }
                if (acc <= ACCURACY_TARGET) {
                    await accept(pos.coords);
                }
            },
            () => {
                stop();
                if (bestRef.current) { accept(bestRef.current); }
                else { setStatus('error'); }
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: TIMEOUT_MS }
        );

        // Hard timeout — accept best we have
        timerRef.current = setTimeout(() => {
            stop();
            if (bestRef.current) {
                accept(bestRef.current);
                setStatus('timeout');
            } else {
                setStatus('error');
            }
        }, TIMEOUT_MS);
    }, [accept, stop]);

    const reset = useCallback(() => {
        stop();
        setStatus('idle');
        setPosition(null);
        bestRef.current = null;
    }, [stop]);

    return { status, position, start, reset };
}
