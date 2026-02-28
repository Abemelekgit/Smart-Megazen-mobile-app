/**
 * @file App.js
 * @description Root component for the Smart-Megazen Command Center (Electron/React).
 *
 * Provides a sidebar navigation layout with three main views:
 *  1. Dashboard    — Live node grid + fleet overview
 *  2. Node Manager — Per-node config and health table
 *  3. Thresholds   — Global safety threshold configuration
 */

import React, { useState } from 'react';
import {
  LayoutDashboard, Server, Settings, AlertOctagon,
  ChevronRight, Activity
} from 'lucide-react';

import DashboardScreen    from './screens/DashboardScreen';
import NodeManagerScreen  from './screens/NodeManagerScreen';
import ThresholdScreen    from './screens/ThresholdScreen';
import AlertLogPanel      from './components/AlertLogPanel';
import './index.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',     Icon: LayoutDashboard },
  { id: 'nodes',     label: 'Node Manager',  Icon: Server           },
  { id: 'thresholds',label: 'Thresholds',    Icon: Settings         },
  { id: 'alerts',    label: 'Alert Log',     Icon: AlertOctagon     },
];

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150
        ${active
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
        }`}
    >
      <item.Icon size={16} />
      <span>{item.label}</span>
      {active && <ChevronRight size={14} className="ml-auto text-cyan-500/50" />}
    </button>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':  return <DashboardScreen />;
      case 'nodes':      return <NodeManagerScreen />;
      case 'thresholds': return <ThresholdScreen />;
      case 'alerts':     return <AlertLogPanel />;
      default:           return <DashboardScreen />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col py-4">
        {/* Brand */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={18} className="text-cyan-400" />
            <span className="text-slate-200 font-bold text-sm tracking-wide">Smart-Megazen</span>
          </div>
          <span className="text-slate-500 text-xs tracking-widest uppercase">Command Center</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => setActiveView(item.id)}
            />
          ))}
        </nav>

        {/* Version footer */}
        <div className="px-4 pt-4 border-t border-slate-800">
          <p className="text-slate-600 text-xs">v1.0.0 · Ethiopia Coffee Export IoT</p>
        </div>
      </aside>

      {/* ── MAIN VIEW ── */}
      <main className="flex-1 overflow-auto bg-slate-900">
        {renderView()}
      </main>
    </div>
  );
}
