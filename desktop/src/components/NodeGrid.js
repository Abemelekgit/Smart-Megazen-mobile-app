/**
 * @file NodeGrid.js
 * @description Memoized desktop node grid — renders a FlexWrap grid of NodeRows.
 * Each row is individually memoized so only the changed row re-renders on updates.
 */

import React, { memo, useMemo } from 'react';
import { Wifi, WifiOff, Thermometer, Droplets, Battery, BatteryLow } from 'lucide-react';
import clsx from 'clsx';

const STATUS_STYLES = {
  Optimal:   { border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400', text: 'text-emerald-400' },
  'At Risk': { border: 'border-amber-500/30',   badge: 'bg-amber-500/10  text-amber-400',   text: 'text-amber-400'   },
  Critical:  { border: 'border-red-500/50',     badge: 'bg-red-500/10    text-red-400',     text: 'text-red-400'     },
  Offline:   { border: 'border-slate-700',      badge: 'bg-slate-700/50  text-slate-500',   text: 'text-slate-500'   },
};

/**
 * A single node row in the data grid — memoized with deep prop comparison.
 */
const NodeRow = memo(function NodeRow({ node }) {
  const s = STATUS_STYLES[node.status] ?? STATUS_STYLES.Offline;
  const batteryLow = node.battery != null && node.battery < 20;

  return (
    <tr className={clsx('border-b border-slate-800 hover:bg-slate-800/50 transition-colors', {
      'bg-red-950/20': node.status === 'Critical',
    })}>
      {/* Node ID */}
      <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-200">
        {node.nodeId}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={clsx('text-xs font-bold px-2 py-1 rounded-md tracking-wider', s.badge)}>
          {node.status.toUpperCase()}
        </span>
      </td>

      {/* Humidity */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Droplets size={13} className="text-cyan-400" />
          <span className={clsx('font-semibold text-sm', node.isOnline ? 'text-cyan-400' : 'text-slate-600')}>
            {node.isOnline ? `${node.hum?.toFixed(1)}%` : '—'}
          </span>
        </div>
      </td>

      {/* Temperature */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Thermometer size={13} className="text-amber-400" />
          <span className={clsx('font-semibold text-sm', node.isOnline ? 'text-amber-400' : 'text-slate-600')}>
            {node.isOnline ? `${node.temp?.toFixed(1)}°C` : '—'}
          </span>
        </div>
      </td>

      {/* Battery */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {batteryLow
            ? <BatteryLow size={13} className="text-red-400" />
            : <Battery size={13} className="text-slate-400" />}
          <span className={clsx('text-sm', batteryLow ? 'text-red-400 font-semibold' : 'text-slate-400')}>
            {node.battery != null ? `${node.battery}%` : '—'}
          </span>
        </div>
      </td>

      {/* Connectivity */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {node.isOnline
            ? <Wifi size={13} className="text-emerald-400" />
            : <WifiOff size={13} className="text-slate-600" />}
          <span className={clsx('text-xs', node.isOnline ? 'text-emerald-400' : 'text-slate-500')}>
            {node.isOnline
              ? `${node.lastSeenAgo ?? 0}s ago`
              : node.lastSeenAgo != null ? `${node.lastSeenAgo}s ago` : 'Unknown'}
          </span>
        </div>
      </td>
    </tr>
  );
}, (prev, next) => {
  // Custom equality: skip re-render if relevant fields are unchanged
  const p = prev.node;
  const n = next.node;
  return (
    p.status   === n.status   &&
    p.hum      === n.hum      &&
    p.temp     === n.temp     &&
    p.battery  === n.battery  &&
    p.isOnline === n.isOnline
  );
});

/**
 * @component NodeGrid
 * @param {Object}   props
 * @param {Object[]} props.nodes    - Array of enriched node objects.
 * @param {string}   [props.filter] - Status filter: 'All'|'Critical'|'At Risk'|'Optimal'|'Offline'.
 */
export default function NodeGrid({ nodes = [], filter = 'All' }) {
  const filtered = useMemo(() => {
    if (filter === 'All') return nodes;
    return nodes.filter(n => n.status === filter);
  }, [nodes, filter]);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        No nodes match the current filter.
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-800">
            {['Node ID', 'Status', 'Humidity', 'Temperature', 'Battery', 'Last Seen'].map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 tracking-widest uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((node) => (
            <NodeRow key={node.nodeId} node={node} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
