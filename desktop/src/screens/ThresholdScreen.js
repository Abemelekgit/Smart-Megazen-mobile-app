/**
 * @file ThresholdScreen.js  (Desktop)
 * @description Global safety threshold configuration panel.
 *
 * Reads current thresholds from Firebase and writes updates back to
 * /configs/thresholds when the admin saves. Changes propagate instantly
 * to all connected mobile and desktop clients via onValue listeners.
 */

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertTriangle, Thermometer, Droplets, Battery } from 'lucide-react';
import { getDatabase, ref, set } from 'firebase/database';
import clsx from 'clsx';
import { useLiveWarehouse } from '../hooks/useLiveWarehouse';
import { firebaseApp, THRESHOLDS_PATH } from '../../../shared/firebaseConfig';

// Re-export path from shared config
const THRESH_PATH = 'artifacts/smart-megazen/public/data/configs/thresholds';

/**
 * @component ThresholdField
 * A single labeled numeric threshold input.
 */
function ThresholdField({ icon: Icon, label, description, name, value, unit, onChange, color }) {
  return (
    <div className="glass-card p-5 flex gap-4 items-start">
      <div className={clsx('p-3 rounded-xl flex-shrink-0')} style={{ backgroundColor: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1">
        <label className="block text-slate-200 font-semibold text-sm mb-0.5">{label}</label>
        <p className="text-slate-500 text-xs mb-3">{description}</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            min={0}
            max={200}
            step={1}
            className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-base font-bold text-center outline-none focus:border-cyan-500/60 transition-colors"
          />
          <span className="text-slate-400 text-sm font-medium">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function ThresholdScreen() {
  const { thresholds, isConnected } = useLiveWarehouse();

  // Local draft state — edits don't affect live logic until saved
  const [draft, setDraft] = useState({
    max_humidity:    60,
    max_temperature: 30,
    min_battery:     20,
  });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState(null);

  // Sync local draft when Firebase thresholds load
  useEffect(() => {
    if (thresholds) setDraft(thresholds);
  }, [thresholds]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const db = getDatabase(firebaseApp);
      await set(ref(db, THRESH_PATH), draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[Megazen] Failed to save thresholds:', err);
      setError('Failed to save. Check your Firebase permissions.');
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    draft.max_humidity    !== thresholds?.max_humidity    ||
    draft.max_temperature !== thresholds?.max_temperature ||
    draft.min_battery     !== thresholds?.min_battery;

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Safety Thresholds</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Changes propagate instantly to all connected devices via Firebase.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={clsx(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            isDirty && !saving
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
          )}
        >
          {saving
            ? <RefreshCw size={14} className="animate-spin" />
            : <Save size={14} />}
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>

      {/* Warning banner */}
      {isDirty && (
        <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 rounded-lg px-4 py-3 mb-6 text-amber-400 text-sm">
          <AlertTriangle size={14} />
          Unsaved changes — save to propagate to all clients.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Threshold inputs */}
      <div className="grid grid-cols-1 gap-4 max-w-2xl">
        <ThresholdField
          icon={Droplets}
          label="Maximum Humidity"
          description="Nodes reporting above this value are marked 'At Risk'. >10% above = Critical."
          name="max_humidity"
          value={draft.max_humidity}
          unit="% RH"
          onChange={handleChange}
          color="#06b6d4"
        />
        <ThresholdField
          icon={Thermometer}
          label="Maximum Temperature"
          description="Temperature ceiling for safe coffee storage. Exceeding triggers an alert."
          name="max_temperature"
          value={draft.max_temperature}
          unit="°C"
          onChange={handleChange}
          color="#f59e0b"
        />
        <ThresholdField
          icon={Battery}
          label="Minimum Battery Level"
          description="Nodes below this battery percentage trigger a low-battery warning."
          name="min_battery"
          value={draft.min_battery}
          unit="%"
          onChange={handleChange}
          color="#10b981"
        />
      </div>

      {/* Live Firebase values reference */}
      <div className="mt-8 p-4 glass-card max-w-2xl">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">
          Current Firebase Values (Live)
        </p>
        <div className="flex gap-8 text-sm">
          <div>
            <span className="text-slate-500">Max Humidity: </span>
            <span className="text-cyan-400 font-bold">{thresholds?.max_humidity ?? '--'}%</span>
          </div>
          <div>
            <span className="text-slate-500">Max Temp: </span>
            <span className="text-amber-400 font-bold">{thresholds?.max_temperature ?? '--'}°C</span>
          </div>
          <div>
            <span className="text-slate-500">Min Battery: </span>
            <span className="text-emerald-400 font-bold">{thresholds?.min_battery ?? '--'}%</span>
          </div>
          <div className="ml-auto">
            <span className={isConnected ? 'text-emerald-400' : 'text-red-400'} style={{ fontSize: 11 }}>
              {isConnected ? '● LIVE' : '○ OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
