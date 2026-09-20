import React, { useState } from 'react';

const PRESETS = ['Daily', '2–3× per week', 'Weekly', 'Twice a month', 'Monthly'];

export default function FrequencyInput({ value, onChange, placeholder = 'Purchase frequency' }) {
    const [custom, setCustom] = useState(!PRESETS.includes(value) && !!value);

    const pick = (v) => {
        setCustom(false);
        onChange(v);
    };

    const chooseCustom = () => {
        setCustom(true);
        onChange('');
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                {PRESETS.map(p => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => pick(p)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition
                            ${value === p && !custom
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={chooseCustom}
                    className={`text-xs px-2.5 py-1 rounded-full border transition
                        ${custom ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}
                >
                    Other…
                </button>
            </div>
            {custom && (
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="input"
                    autoFocus
                />
            )}
            {!custom && value && (
                <p className="text-xs text-green-700 font-medium">Selected: {value}</p>
            )}
        </div>
    );
}
