/**
 * @file AlertsScreen.js
 * @description Real-time alert log screen for the Investor Suite.
 * Displays the append-only alert history from Firebase with severity filtering.
 */

import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { AlertTriangle, Thermometer, Droplets, Battery, Clock } from 'lucide-react-native';
import { useLiveWarehouse } from '../hooks/useLiveWarehouse';
import SyncBadge from '../components/SyncBadge';

const ALERT_ICONS = {
  humidity:    { icon: Droplets,     color: '#06b6d4' },
  temperature: { icon: Thermometer,  color: '#f59e0b' },
  battery:     { icon: Battery,      color: '#ef4444' },
  default:     { icon: AlertTriangle, color: '#f59e0b' },
};

const FILTERS = ['All', 'humidity', 'temperature', 'battery'];

function AlertRow({ alert }) {
  const cfg = ALERT_ICONS[alert.type] ?? ALERT_ICONS.default;
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
      borderBottomWidth: 1,
      borderBottomColor: '#1e293b',
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: `${cfg.color}22`,
        alignItems: 'center', justifyContent: 'center',
        marginTop: 2, flexShrink: 0,
      }}>
        <Icon size={18} color={cfg.color} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: 14 }}>
            {alert.nodeId?.toUpperCase() ?? 'UNKNOWN NODE'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock size={10} color="#475569" />
            <Text style={{ color: '#475569', fontSize: 11 }}>{time}</Text>
          </View>
        </View>

        <Text style={{ color: cfg.color, fontSize: 12, fontWeight: '600', marginTop: 3, textTransform: 'capitalize' }}>
          {alert.type} breach
        </Text>

        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
          {alert.message ?? `Value ${alert.value ?? '--'} exceeded threshold ${alert.threshold ?? '--'}`}
        </Text>
      </View>
    </View>
  );
}

export default function AlertsScreen() {
  const { alerts, lastSync, isConnected } = useLiveWarehouse();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? alerts
    : alerts.filter(a => a.type === activeFilter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: '#1e293b',
      }}>
        <View>
          <Text style={{ color: '#94a3b8', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Smart-Megazen
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '800' }}>Alert Log</Text>
        </View>
        <SyncBadge lastSync={lastSync} isConnected={isConnected} />
      </View>

      {/* Filter Pills */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setActiveFilter(f)}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
              backgroundColor: activeFilter === f ? '#06b6d4' : '#1e293b',
              borderWidth: 1, borderColor: activeFilter === f ? '#06b6d4' : '#334155',
            }}
          >
            <Text style={{
              color: activeFilter === f ? '#fff' : '#94a3b8',
              fontSize: 12, fontWeight: '600', textTransform: 'capitalize',
            }}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Alert count */}
      <Text style={{ color: '#475569', fontSize: 11, paddingHorizontal: 20, paddingBottom: 8, letterSpacing: 0.5 }}>
        {filtered.length} EVENTS
      </Text>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={40} color="#1e293b" />
          <Text style={{ color: '#334155', fontSize: 14, marginTop: 12 }}>No alerts recorded</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id ?? String(item.timestamp)}
          renderItem={({ item }) => <AlertRow alert={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
