/**
 * @file AlertLogPanel.js
 * @description Desktop alert log view — sortable, filterable table of threshold breach events.
 * Supports CSV export via Electron IPC.
 */

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Download, Droplets, Thermometer, Battery } from 'lucide-react';
import clsx from 'clsx';
import { useLiveWarehouse } from '../hooks/useLiveWarehouse';

const TYPE_ICONS = {
  humidity:    { icon: Droplets,    color: 'text-cyan-400'   },
  temperature: { icon: Thermometer, color: 'text-amber-400'  },
  battery:     { icon: Battery,     color: 'text-red-400'    },
};

/**
 * Converts the alert array to a CSV string.
 * @param {Object[]} alerts
 * @returns {string}
 */
function alertsToCsv(alerts) {
  const header = 'ID,Node,Type,Value,Threshold,Timestamp,Message\n';
  const rows = alerts.map((a) =>
    [
      a.id ?? '',
      a.nodeId ?? '',
      a.type ?? '',
      a.value ?? '',
      a.threshold ?? '',
      a.timestamp ? new Date(a.timestamp).toISOString() : '',
      `"${(a.message ?? '').replace(/"/g, '""')}"`,
    ].join(',')
  );
  return header + rows.join('\n');
}

const FILTERS = ['All', 'humidity', 'temperature', 'battery'];

export default function AlertLogPanel() {
  const { alerts, lastSync, isConnected } = useLiveWarehouse();
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() =>
    filter === 'All' ? alerts : alerts.filter(a => a.type === filter),
    [alerts, filter]
  );

  const handleExportCsv = async () => {
    const csv = alertsToCsv(filtered);
    if (window.electronAPI) {
      const result = await window.electronAPI.exportCsv(csv);
      if (result.success) {
        alert(`Saved to: ${result.path}`);
      }
    } else {
      // Fallback for browser dev mode
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'alerts.csv'; a.click();
    }
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Alert Log</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''} · {' '}
            {isConnected && lastSync
              ? `Synced ${lastSync.toLocaleTimeString()}`
              : 'Disconnected'}
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors',
              filter === f
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-800">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr className="border-b border-slate-800">
              {['Node', 'Type', 'Value', 'Threshold', 'Time', 'Message'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 tracking-widest uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-600">
                  <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
                  No alerts recorded
                </td>
              </tr>
            ) : (
              filtered.map((alert) => {
                const cfg  = TYPE_ICONS[alert.type] ?? TYPE_ICONS.humidity;
                const Icon = cfg.icon;
                const time = alert.timestamp
                  ? new Date(alert.timestamp).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '—';

                return (
                  <tr key={alert.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-200">
                      {alert.nodeId?.toUpperCase() ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon size={13} className={cfg.color} />
                        <span className={clsx('text-xs font-semibold capitalize', cfg.color)}>
                          {alert.type ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{alert.value ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{alert.threshold ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{time}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                      {alert.message ?? '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
