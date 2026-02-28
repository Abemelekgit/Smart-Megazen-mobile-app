/**
 * @file AlertsScreen.js
 * @description Real-time alert log with severity counts, coloured type pills,
 * and a clean timeline-style list.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable,
  SafeAreaView, StatusBar,
} from 'react-native';
import {
  AlertTriangle, Thermometer, Droplets,
  Zap, Clock, Bell, Filter,
} from 'lucide-react-native';
import { useLiveWarehouse } from '../hooks/useLiveWarehouse';
import SyncBadge from '../components/SyncBadge';

// ── CONFIG ────────────────────────────────────────────────────────────────────

const ALERT_TYPES = {
  humidity:    { icon: Droplets,      color: '#06b6d4', bg: '#06b6d418', label: 'Humidity'    },
  temperature: { icon: Thermometer,   color: '#f59e0b', bg: '#f59e0b18', label: 'Temperature' },
  battery:     { icon: Zap,           color: '#ef4444', bg: '#ef444418', label: 'Battery'     },
  default:     { icon: AlertTriangle, color: '#f59e0b', bg: '#f59e0b18', label: 'Alert'       },
};

const FILTERS = ['All', 'humidity', 'temperature', 'battery'];

// ── ALERT ROW ─────────────────────────────────────────────────────────────────

function AlertRow({ alert, index }) {
  const cfg  = ALERT_TYPES[alert.type] ?? ALERT_TYPES.default;
  const Icon = cfg.icon;
  const time = alert.timestamp
    ? new Date(alert.timestamp).toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Unknown time';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
    }}>
      {/* Timeline connector */}
      <View style={{ alignItems: 'center', width: 36 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: cfg.bg,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: `${cfg.color}33`,
        }}>
          <Icon size={16} color={cfg.color} />
        </View>
        {/* Vertical line */}
        <View style={{ width: 1, flex: 1, backgroundColor: '#1e293b', marginTop: 4, minHeight: 20 }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#0f172a' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 14, letterSpacing: 0.3 }}>
              {alert.nodeId?.toUpperCase() ?? 'UNKNOWN NODE'}
            </Text>
            {/* Type pill */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              marginTop: 4, alignSelf: 'flex-start',
              backgroundColor: cfg.bg,
              borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
              borderWidth: 1, borderColor: `${cfg.color}33`,
            }}>
              <Icon size={9} color={cfg.color} />
              <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {cfg.label} Breach
              </Text>
            </View>
          </View>

          {/* Timestamp */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Clock size={10} color="#334155" />
            <Text style={{ color: '#334155', fontSize: 10 }}>{time}</Text>
          </View>
        </View>

        {/* Message */}
        <Text style={{ color: '#64748b', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
          {alert.message ?? `Value ${alert.value ?? '--'} exceeded threshold ${alert.threshold ?? '--'}`}
        </Text>
      </View>
    </View>
  );
}

// ── SCREEN ────────────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const { alerts, lastSync, isConnected } = useLiveWarehouse();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(
    () => activeFilter === 'All' ? alerts : alerts.filter(a => a.type === activeFilter),
    [alerts, activeFilter]
  );

  // Count per type for badge chips
  const counts = useMemo(() => {
    const c = { humidity: 0, temperature: 0, battery: 0 };
    alerts.forEach(a => { if (c[a.type] != null) c[a.type]++; });
    return c;
  }, [alerts]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080f1e' }}>
      <StatusBar barStyle="light-content" backgroundColor="#080f1e" />

      {/* ── HEADER ── */}
      <View style={{
        paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: '#1e293b',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 34, height: 34, borderRadius: 10,
              backgroundColor: '#ef444418',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: '#ef444430',
            }}>
              <Bell size={17} color="#ef4444" />
            </View>
            <View>
              <Text style={{ color: '#94a3b8', fontSize: 11, letterSpacing: 1.5 }}>SMART-MEGAZEN</Text>
              <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '900' }}>Alert Log</Text>
            </View>
          </View>
          <SyncBadge lastSync={lastSync} isConnected={isConnected} />
        </View>

        {/* Severity summary chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {Object.entries(counts).map(([type, count]) => {
            const cfg = ALERT_TYPES[type];
            return (
              <View key={type} style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: cfg.bg,
                borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5,
                borderWidth: 1, borderColor: `${cfg.color}33`,
              }}>
                <cfg.icon size={11} color={cfg.color} />
                <Text style={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}>
                  {count} {cfg.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── FILTER PILLS ── */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16, paddingVertical: 12,
        gap: 8,
        alignItems: 'center',
      }}>
        <Filter size={12} color="#334155" />
        {FILTERS.map((f) => {
          const active = activeFilter === f;
          const cfg    = ALERT_TYPES[f] ?? null;
          return (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={{
                paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
                backgroundColor: active ? (cfg?.color ?? '#06b6d4') + '22' : '#0c1625',
                borderWidth: 1,
                borderColor: active ? (cfg?.color ?? '#06b6d4') : '#1e293b',
              }}
            >
              <Text style={{
                color: active ? (cfg?.color ?? '#06b6d4') : '#475569',
                fontSize: 12, fontWeight: active ? '700' : '500',
                textTransform: 'capitalize',
              }}>
                {f}
              </Text>
            </Pressable>
          );
        })}
        <Text style={{ color: '#334155', fontSize: 11, marginLeft: 'auto' }}>
          {filtered.length} events
        </Text>
      </View>

      {/* ── LIST ── */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: '#0c1625',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#1e293b',
          }}>
            <AlertTriangle size={28} color="#1e293b" />
          </View>
          <Text style={{ color: '#334155', fontSize: 15, fontWeight: '600' }}>No alerts recorded</Text>
          <Text style={{ color: '#1e293b', fontSize: 13 }}>All systems running smoothly</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id ?? String(item.timestamp)}
          renderItem={({ item, index }) => <AlertRow alert={item} index={index} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

