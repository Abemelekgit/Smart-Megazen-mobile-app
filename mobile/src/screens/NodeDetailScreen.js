/**
 * @file NodeDetailScreen.js
 * @description Drilldown view for a single ESP32 node.
 * Shows live readings, battery status, and a humidity/temp history chart.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, SafeAreaView,
  StatusBar, Pressable, Alert
} from 'react-native';
import { ArrowLeft, Thermometer, Droplets, Battery, Clock, Wifi, WifiOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { getNodeStatus, DEFAULT_THRESHOLDS, MegazenService } from '../shared/MegazenService';
import { firebaseApp } from '../shared/firebaseConfig';

const STATUS_COLORS = {
  Optimal:   '#10b981',
  'At Risk': '#f59e0b',
  Critical:  '#ef4444',
  Offline:   '#64748b',
};

function StatRow({ icon, label, value, unit, color }) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: '#1e293b',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>{label}</Text>
      </View>
      <Text style={{ color, fontSize: 16, fontWeight: '700' }}>
        {value}
        <Text style={{ fontWeight: '400', fontSize: 12 }}> {unit}</Text>
      </Text>
    </View>
  );
}

export default function NodeDetailScreen({ route, navigation }) {
  const { nodeId } = route.params ?? {};

  const [node,       setNode]       = useState(null);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  useEffect(() => {
    if (!nodeId) return;
    const service = new MegazenService(firebaseApp);

    const unsubNode       = service.subscribeToNode(nodeId, setNode);
    const unsubThresholds = service.subscribeToThresholds(setThresholds);

    return () => {
      unsubNode();
      unsubThresholds();
    };
  }, [nodeId]);

  const status      = node ? getNodeStatus(node, thresholds) : 'Offline';
  const statusColor = STATUS_COLORS[status] ?? '#64748b';
  const isOnline    = status !== 'Offline';

  const lastSeenAgo = node?.timestamp
    ? Math.floor((Date.now() - node.timestamp) / 1000)
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#1e293b',
      }}>
        <Pressable onPress={() => navigation?.goBack()} hitSlop={12}>
          <ArrowLeft size={22} color="#94a3b8" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800' }}>
            {nodeId?.toUpperCase()}
          </Text>
          <Text style={{ color: '#475569', fontSize: 12 }}>Sensor Node</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isOnline
            ? <Wifi size={14} color="#10b981" />
            : <WifiOff size={14} color="#64748b" />}
          <Text style={{ color: statusColor, fontSize: 13, fontWeight: '700' }}>
            {status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

        {/* Status hero banner */}
        <LinearGradient
          colors={[`${statusColor}22`, '#0f172a']}
          style={{
            borderRadius: 16, borderWidth: 1, borderColor: `${statusColor}55`,
            padding: 20, alignItems: 'center', marginBottom: 20,
          }}
        >
          <Text style={{ color: statusColor, fontSize: 32, fontWeight: '900', letterSpacing: 2 }}>
            {status.toUpperCase()}
          </Text>
          {lastSeenAgo != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <Clock size={11} color="#475569" />
              <Text style={{ color: '#475569', fontSize: 12 }}>
                Last updated {lastSeenAgo}s ago
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Live readings card */}
        <View style={{
          backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16,
        }}>
          <Text style={{ color: '#94a3b8', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>
            LIVE READINGS
          </Text>

          <StatRow
            icon={<Droplets size={18} color="#06b6d4" />}
            label="Humidity"
            value={node?.hum?.toFixed(1) ?? '--'}
            unit="%"
            color="#06b6d4"
          />
          <StatRow
            icon={<Thermometer size={18} color="#f59e0b" />}
            label="Temperature"
            value={node?.temp?.toFixed(1) ?? '--'}
            unit="°C"
            color="#f59e0b"
          />
          <StatRow
            icon={<Battery size={18} color={node?.battery < 20 ? '#ef4444' : '#10b981'} />}
            label="Battery"
            value={node?.battery ?? '--'}
            unit="%"
            color={node?.battery < 20 ? '#ef4444' : '#10b981'}
          />
        </View>

        {/* Thresholds reference */}
        <View style={{
          backgroundColor: '#1e293b', borderRadius: 16, padding: 16,
        }}>
          <Text style={{ color: '#94a3b8', fontSize: 10, letterSpacing: 1.5, marginBottom: 8 }}>
            ACTIVE THRESHOLDS
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#475569', fontSize: 11 }}>MAX HUM</Text>
              <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '700' }}>
                {thresholds.max_humidity}
                <Text style={{ fontSize: 12, fontWeight: '400', color: '#64748b' }}>%</Text>
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#334155' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#475569', fontSize: 11 }}>MAX TEMP</Text>
              <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '700' }}>
                {thresholds.max_temperature}
                <Text style={{ fontSize: 12, fontWeight: '400', color: '#64748b' }}>°C</Text>
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#334155' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#475569', fontSize: 11 }}>MIN BAT</Text>
              <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '700' }}>
                {thresholds.min_battery}
                <Text style={{ fontSize: 12, fontWeight: '400', color: '#64748b' }}>%</Text>
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
