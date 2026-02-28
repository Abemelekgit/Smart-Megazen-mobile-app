/**
 * @file NodeDetailScreen.js
 * @description Drilldown view for a single ESP32 node.
 * Shows three GaugeRing charts (humidity / temperature / battery),
 * live reading rows, and active threshold reference.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, SafeAreaView,
  StatusBar, Pressable,
} from 'react-native';
import {
  ArrowLeft, Thermometer, Droplets, Zap,
  Clock, Wifi, WifiOff, AlertTriangle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import GaugeRing from '../components/GaugeRing';
import { getNodeStatus, DEFAULT_THRESHOLDS, MegazenService } from '../shared/MegazenService';
import { firebaseApp } from '../shared/firebaseConfig';

const STATUS_COLORS = {
  Optimal:   '#10b981',
  'At Risk': '#f59e0b',
  Critical:  '#ef4444',
  Offline:   '#64748b',
};

const STATUS_BG = {
  Optimal:   ['#052e16', '#080f1e'],
  'At Risk': ['#451a03', '#080f1e'],
  Critical:  ['#450a0a', '#080f1e'],
  Offline:   ['#0f172a', '#080f1e'],
};

// ── STAT ROW ─────────────────────────────────────────────────────────────────

function StatRow({ icon, label, value, unit, color, warn, warnLabel }) {
  const isWarn = warn && parseFloat(value) > parseFloat(warn);
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: 15,
      borderBottomWidth: 1, borderBottomColor: '#0f172a',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <View>
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>{label}</Text>
          {isWarn && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <AlertTriangle size={9} color="#f59e0b" />
              <Text style={{ color: '#f59e0b', fontSize: 10 }}>{warnLabel ?? 'Above threshold'}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={{ color: isWarn ? '#ef4444' : color, fontSize: 18, fontWeight: '800' }}>
        {value ?? '--'}
        <Text style={{ fontWeight: '400', fontSize: 13, color: `${color}88` }}> {unit}</Text>
      </Text>
    </View>
  );
}

// ── SCREEN ────────────────────────────────────────────────────────────────────

export default function NodeDetailScreen({ route, navigation }) {
  const { nodeId } = route.params ?? {};

  const [node,       setNode]       = useState(null);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  useEffect(() => {
    if (!nodeId) return;
    const service = new MegazenService(firebaseApp);
    const unsubNode       = service.subscribeToNode(nodeId, setNode);
    const unsubThresholds = service.subscribeToThresholds(setThresholds);
    return () => { unsubNode(); unsubThresholds(); };
  }, [nodeId]);

  const status      = node ? getNodeStatus(node, thresholds) : 'Offline';
  const statusColor = STATUS_COLORS[status] ?? '#64748b';
  const isOnline    = status !== 'Offline';

  const lastSeenAgo = node?.timestamp
    ? Math.floor((Date.now() - node.timestamp) / 1000)
    : null;

  const maxHum  = thresholds?.max_humidity    ?? 100;
  const maxTemp = thresholds?.max_temperature ?? 60;
  const minBat  = thresholds?.min_battery     ?? 20;

  const humColor  = node?.hum  > maxHum  ? '#ef4444' : '#06b6d4';
  const tempColor = node?.temp > maxTemp ? '#ef4444' : '#f59e0b';
  const batColor  = node?.battery < minBat ? '#ef4444' : '#10b981';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080f1e' }}>
      <StatusBar barStyle="light-content" backgroundColor="#080f1e" />

      {/* ── HEADER ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#1e293b',
        backgroundColor: '#080f1e',
      }}>
        <Pressable
          onPress={() => navigation?.goBack()}
          hitSlop={12}
          style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: '#1e293b',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color="#94a3b8" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 }}>
            {nodeId?.toUpperCase()}
          </Text>
          <Text style={{ color: '#334155', fontSize: 12 }}>Sensor Node</Text>
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: `${statusColor}18`,
          borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
          borderWidth: 1, borderColor: `${statusColor}33`,
        }}>
          {isOnline
            ? <Wifi size={12} color={statusColor} />
            : <WifiOff size={12} color={statusColor} />}
          <Text style={{ color: statusColor, fontSize: 12, fontWeight: '700' }}>
            {status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

        {/* ── STATUS BANNER ── */}
        <LinearGradient
          colors={STATUS_BG[status] ?? STATUS_BG.Offline}
          style={{
            borderRadius: 18, borderWidth: 1,
            borderColor: `${statusColor}44`,
            paddingVertical: 16, paddingHorizontal: 20,
            marginBottom: 20,
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ color: statusColor, fontSize: 26, fontWeight: '900', letterSpacing: 1.5 }}>
              {status.toUpperCase()}
            </Text>
            {lastSeenAgo != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <Clock size={11} color="#334155" />
                <Text style={{ color: '#334155', fontSize: 12 }}>
                  Updated {lastSeenAgo}s ago
                </Text>
              </View>
            )}
          </View>
          {/* Node ID badge */}
          <View style={{
            backgroundColor: `${statusColor}16`,
            borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
            borderWidth: 1, borderColor: `${statusColor}33`,
          }}>
            <Text style={{ color: '#475569', fontSize: 10, letterSpacing: 1 }}>NODE ID</Text>
            <Text style={{ color: statusColor, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
              {nodeId?.toUpperCase()}
            </Text>
          </View>
        </LinearGradient>

        {/* ── GAUGE ROW ── */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around',
          paddingVertical: 20,
          backgroundColor: '#0c1625',
          borderRadius: 20, borderWidth: 1, borderColor: '#1e293b',
          marginBottom: 16,
        }}>
          <GaugeRing
            value={node?.hum}
            max={100}
            size={106}
            strokeWidth={11}
            color={humColor}
            unit="%"
            label="HUMIDITY"
            warnAt={maxHum}
          />
          <GaugeRing
            value={node?.temp}
            max={60}
            size={106}
            strokeWidth={11}
            color={tempColor}
            unit="°C"
            label="TEMP"
            warnAt={maxTemp}
          />
          <GaugeRing
            value={node?.battery}
            max={100}
            size={106}
            strokeWidth={11}
            color={batColor}
            unit="%"
            label="BATTERY"
          />
        </View>

        {/* ── LIVE READINGS ── */}
        <View style={{
          backgroundColor: '#0c1625',
          borderRadius: 18, borderWidth: 1, borderColor: '#1e293b',
          paddingHorizontal: 16, marginBottom: 16,
        }}>
          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
            <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }}>
              LIVE READINGS
            </Text>
          </View>
          <StatRow
            icon={<Droplets size={18} color="#06b6d4" />}
            label="Humidity"
            value={node?.hum?.toFixed(1) ?? '--'}
            unit="%"
            color="#06b6d4"
            warn={maxHum}
            warnLabel={`Max: ${maxHum}%`}
          />
          <StatRow
            icon={<Thermometer size={18} color="#f59e0b" />}
            label="Temperature"
            value={node?.temp?.toFixed(1) ?? '--'}
            unit="°C"
            color="#f59e0b"
            warn={maxTemp}
            warnLabel={`Max: ${maxTemp}°C`}
          />
          <StatRow
            icon={<Zap size={18} color={batColor} />}
            label="Battery"
            value={node?.battery ?? '--'}
            unit="%"
            color={batColor}
          />
        </View>

        {/* ── THRESHOLDS ── */}
        <View style={{
          backgroundColor: '#0c1625',
          borderRadius: 18, borderWidth: 1, borderColor: '#1e293b',
          padding: 16,
        }}>
          <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 14 }}>
            ACTIVE THRESHOLDS
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[
              { label: 'MAX HUM',  value: thresholds.max_humidity,    unit: '%',  color: '#06b6d4' },
              { label: 'MAX TEMP', value: thresholds.max_temperature, unit: '°C', color: '#f59e0b' },
              { label: 'MIN BAT',  value: thresholds.min_battery,     unit: '%',  color: '#10b981' },
            ].map((t, i) => (
              <React.Fragment key={t.label}>
                {i > 0 && <View style={{ width: 1, backgroundColor: '#1e293b' }} />}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 1 }}>{t.label}</Text>
                  <Text style={{ color: t.color, fontSize: 22, fontWeight: '900', marginTop: 4 }}>
                    {t.value}
                    <Text style={{ fontSize: 12, fontWeight: '400', color: `${t.color}88` }}>{t.unit}</Text>
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
