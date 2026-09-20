import React from 'react';
import { useGPS } from '../hooks/useGPS';

const STATUS_LABEL = {
    idle: null,
    watching: 'Getting GPS…',
    good: null,
    timeout: null,
    error: 'GPS unavailable',
};

const ACCURACY_COLOR = (acc) => {
    if (!acc) return 'bg-gray-200';
    if (acc <= 10) return 'bg-green-500';
    if (acc <= 25) return 'bg-yellow-400';
    return 'bg-orange-400';
};

export default function GPSCapture({ onCapture }) {
    const { status, position, start, reset } = useGPS();

    const handleCapture = async () => {
        if (status === 'watching') return;
        if (position) { reset(); return; }
        start();
    };

    // Notify parent when position is ready
    React.useEffect(() => {
        if (position) onCapture(position);
    }, [position]);

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={handleCapture}
                disabled={status === 'watching'}
                className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition
                    ${position ? 'bg-green-50 border-green-300 text-green-700' :
                      status === 'watching' ? 'bg-blue-50 border-blue-200 text-blue-500 animate-pulse' :
                      'bg-blue-50 border-blue-200 text-blue-700'}`}
            >
                {status === 'watching' ? '📡 Getting GPS…' :
                 position ? '✓ GPS captured — tap to redo' :
                 '📍 Capture GPS location'}
            </button>

            {status === 'watching' && (
                <p className="text-xs text-blue-500">Waiting for accurate signal — hold phone still…</p>
            )}

            {STATUS_LABEL[status] && (
                <p className="text-xs text-red-500">{STATUS_LABEL[status]}</p>
            )}

            {position && (
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full inline-block ${ACCURACY_COLOR(position.accuracy)}`} />
                        <span className="text-gray-600">Accuracy: <strong>±{position.accuracy}m</strong>
                            {status === 'timeout' && <span className="text-orange-500"> (best available)</span>}
                        </span>
                    </div>
                    {position.place_name && <p className="text-gray-500">📍 {position.place_name}</p>}
                    {position.ward && <p className="text-gray-500">Ward: {position.ward}</p>}
                    {position.district && <p className="text-gray-500">District: {position.district}</p>}
                    <p className="text-gray-400">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
                </div>
            )}
        </div>
    );
}
