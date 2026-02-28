/**
 * @file NodeManagerScreen.js  (Desktop)
 * @description Node health management table.
 * Shows all nodes with a full details expansion and the ability to tag/annotate them.
 */

import React, { useMemo, useState } from 'react';
import { Search, RefreshCw, Wifi, WifiOff, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useLiveWarehouse } from '../hooks/useLiveWarehouse';

const STATUS_COLOR = {
  Optimal:   'text-emerald-400',
  'At Risk': 'text-amber-400',
  Critical:  'text-red-400',
  Offline:   'text-slate-500',
};

export default function NodeManagerScreen() {
  const { warehouseStatus, lastSync, isConnected } = useLiveWarehouse();
  const [search,    setSearch]   = useState('');
  const [expandedId, setExpanded] = useState(null);

  const nodes = useMemo(() => {
    if (!warehouseStatus?.enrichedNodes) return [];
    const all = Object.values(warehouseStatus.enrichedNodes);
    if (!search) return all;
    return all.filter(n =>
      n.nodeId?.toLowerCase().includes(search.toLowerCase())
    );
  }, [warehouseStatus, search]);

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Node Manager</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {warehouseStatus?.totalNodes ?? 0} nodes registered ·{' '}
            {warehouseStatus?.onlineNodes ?? 0} online ·{' '}
            {warehouseStatus?.offlineNodes ?? 0} offline
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {isConnected ? <RefreshCw size={12} className="text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} /> : <WifiOff size={12} className="text-red-400" />}
          {isConnected && lastSync ? `Synced ${lastSync.toLocaleTimeString()}` : 'Disconnected'}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search node ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {/* Node Table */}
      <div className="flex-1 glass-card overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr className="border-b border-slate-800">
              {['', 'Node ID', 'Status', 'Humidity', 'Temperature', 'Battery', 'Last Seen'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 tracking-widest uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-slate-600 text-sm">
                  No nodes found
                </td>
              </tr>
            ) : (
              nodes.map((node) => (
                <React.Fragment key={node.nodeId}>
                  <tr
                    className={clsx(
                      'border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors',
                      expandedId === node.nodeId && 'bg-slate-800/30'
                    )}
                    onClick={() => setExpanded(expandedId === node.nodeId ? null : node.nodeId)}
                  >
                    <td className="px-4 py-3 w-8">
                      {expandedId === node.nodeId
                        ? <ChevronDown size={14} className="text-cyan-400" />
                        : <ChevronRight size={14} className="text-slate-600" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-200">{node.nodeId}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs font-bold', STATUS_COLOR[node.status])}>
                        {node.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-cyan-400">
                      {node.isOnline ? `${node.hum?.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-400">
                      {node.isOnline ? `${node.temp?.toFixed(1)}°C` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {node.battery != null ? `${node.battery}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {node.isOnline
                          ? <Wifi size={12} className="text-emerald-400" />
                          : <WifiOff size={12} className="text-slate-600" />}
                        <span className="text-xs text-slate-500">
                          {node.lastSeenAgo != null ? `${node.lastSeenAgo}s ago` : 'Unknown'}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded details row */}
                  {expandedId === node.nodeId && (
                    <tr className="bg-slate-800/20 border-b border-slate-800">
                      <td colSpan={7} className="px-10 py-4">
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-slate-500 uppercase tracking-wider mb-1">Node ID</p>
                            <p className="text-slate-200 font-mono">{node.nodeId}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wider mb-1">Raw Timestamp</p>
                            <p className="text-slate-200 font-mono">
                              {node.timestamp ? new Date(node.timestamp).toISOString() : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wider mb-1">Derived Status</p>
                            <p className={clsx('font-bold', STATUS_COLOR[node.status])}>{node.status}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
