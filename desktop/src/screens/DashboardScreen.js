/**
 * @file DashboardScreen.js  (Desktop)
 * @description Command Center primary dashboard.
 *
 * Layout:
 *  - Top stat bar: Fleet KPIs
 *  - Left: Node grid table with status filter
 *  - Right: Mini alert feed
 */

import React, { useMemo, useState } from 'react';
import {
  Activity, Droplets, Thermometer, Server,
  AlertOctagon, RotateCw, WifiOff, Shield
} from 'lucide-react';
import clsx from 'clsx';

import { useLiveWarehouse } from '../hooks/useLiveWarehouse';
import NodeGrid from '../components/NodeGrid';

const FILTERS = ['All', 'Critical', 'At Risk', 'Optimal', 'Offline'];

const STATUS_THEME = {
  Optimal:   { cls: 'border-l-emerald-500 bg-emerald-950/20', text: 'text-emerald-400', icon: Shield        },
  'At Risk': { cls: 'border-l-amber-500  bg-amber-950/20',   text: 'text-amber-400',   icon: AlertOctagon  },
  Critical:  { cls: 'border-l-red-500    bg-red-950/30',     text: 'text-red-400',     icon: AlertOctagon  },
  'No Data': { cls: 'border-l-slate-600  bg-slate-800/30',   text: 'text-slate-400',   icon: Server        },
};

function KpiCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className={clsx('p-2.5 rounded-lg', `bg-[${color}]/10`)}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-slate-500 text-xs tracking-wider uppercase">{label}</p>
        <p className="text-slate-100 text-xl font-bold">{value}
          <span className="text-slate-500 text-sm font-normal ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function DashboardScreen() {
  const { warehouseStatus, lastSync, isConnected, alerts } = useLiveWarehouse();
  const [filter, setFilter] = useState('All');

  const sortedNodes = useMemo(() => {
    if (!warehouseStatus?.enrichedNodes) return [];
    const order = { Critical: 0, 'At Risk': 1, Optimal: 2, Offline: 3 };
    return Object.values(warehouseStatus.enrichedNodes)
      .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [warehouseStatus?.enrichedNodes]);

  const overall = warehouseStatus?.overallStatus ?? 'No Data';
  const theme   = STATUS_THEME[overall] ?? STATUS_THEME['No Data'];
  const HeroIcon = theme.icon;

  const recentAlerts = useMemo(() => alerts.slice(0, 8), [alerts]);

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden gap-5">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-cyan-400" />
          <h1 className="text-xl font-bold text-slate-100">Fleet Dashboard</h1>
          {/* Overall status badge */}
          <div className={clsx(
            'flex items-center gap-1.5 px-3 py-1 rounded-full border border-l-4 text-xs font-bold tracking-wider',
            theme.cls, theme.text
          )}>
            <HeroIcon size={12} />
            {overall.toUpperCase()}
          </div>
        </div>

        {/* Sync indicator */}
        <div className="flex items-center gap-2 text-xs">
          {isConnected
            ? <RotateCw size={12} className="text-cyan-400" />
            : <WifiOff   size={12} className="text-red-400"  />}
          <span className={isConnected ? 'text-cyan-400' : 'text-red-400'}>
            {isConnected && lastSync
              ? `Last Sync: ${lastSync.toLocaleTimeString()}`
              : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* ── KPI BAR ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard icon={Droplets}    label="Avg Humidity"    value={warehouseStatus?.averageHum    ?? '--'} unit="%"    color="#06b6d4" />
        <KpiCard icon={Thermometer} label="Avg Temperature" value={warehouseStatus?.averageTemp   ?? '--'} unit="°C"   color="#f59e0b" />
        <KpiCard icon={Server}      label="Nodes Online"    value={warehouseStatus?.onlineNodes   ?? '--'} unit=""     color="#10b981" />
        <KpiCard icon={AlertOctagon}label="At Risk"         value={
          (warehouseStatus?.atRiskNodesCount ?? 0) + (warehouseStatus?.criticalNodesCount ?? 0)
        } unit="nodes" color="#ef4444" />
      </div>

      {/* ── MAIN CONTENT ROW ── */}
      <div className="flex flex-1 gap-5 overflow-hidden">

        {/* Node Table */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-800">
            <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase mr-2">Filter:</span>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                )}
              >
                {f}
              </button>
            ))}
            <span className="ml-auto text-slate-600 text-xs">{sortedNodes.length} nodes</span>
          </div>
          <div className="flex-1 overflow-auto">
            <NodeGrid nodes={sortedNodes} filter={filter} />
          </div>
        </div>

        {/* Alert Mini-Feed */}
        <div className="w-72 glass-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 text-sm font-semibold">Recent Alerts</span>
            <span className="text-slate-600 text-xs">{alerts.length} total</span>
          </div>
          <div className="flex-1 overflow-auto">
            {recentAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                No alerts
              </div>
            ) : (
              recentAlerts.map((a) => (
                <div key={a.id} className="px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-200 text-xs font-bold font-mono">
                      {a.nodeId?.toUpperCase()}
                    </span>
                    <span className="text-slate-600 text-xs capitalize">{a.type}</span>
                  </div>
                  <p className="text-slate-500 text-xs truncate">{a.message ?? `Value ${a.value}`}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
