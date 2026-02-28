/**
 * @file DashboardScreen.js
 * @description Primary investor dashboard — "Smart-Megazen Investor Suite."
 *
 * Layout:
 *  1. Header with live sync badge
 *  2. Status Hero (gradient card + large status text)
 *  3. Node Health Distribution bar
 *  4. KPI Metric Strip (GaugeRing tiles — humidity / temp / online)
 *  5. Node Grid (NodeCard × 2 columns)
 *  6. AmberAlert overlay
 */

import React, { useMemo } from 'react';
import {
  View, Text, FlatList, ScrollView,
  SafeAreaView, StatusBar, RefreshControl,
} from 'react-native';
import {
  Droplets, Thermometer, Server,
  AlertOctagon, Shield, Activity,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import NodeCard      from '../components/NodeCard';
import MetricTile    from '../components/MetricTile';
import SyncBadge     from '../components/SyncBadge';
import AmberAlert    from '../components/AmberAlert';
import GaugeRing     from '../components/GaugeRing';
import NodeHealthBar from '../components/NodeHealthBar';
import { useLiveWarehouse } from '../hooks/useLiveWarehouse';

// ── STATUS HERO CONFIG ────────────────────────────────────────────────────────

const STATUS_HERO = {
  Optimal:   {
    colors: ['#052e16', '#0c1a2e'],
    accent: '#10b981',
    icon: Shield,
    headline: 'ALL SYSTEMS OPTIMAL',
    sub: 'Warehouse environment within safe parameters.',
  },
  'At Risk': {
    colors: ['#451a03', '#0c1a2e'],
    accent: '#f59e0b',
    icon: AlertOctagon,
    headline: 'ASSETS AT RISK',
    sub: 'One or more nodes approaching thresholds.',
  },
  Critical:  {
    colors: ['#450a0a', '#0c1a2e'],
    accent: '#ef4444',
    icon: AlertOctagon,
    headline: 'CRITICAL — ACT NOW',
    sub: 'Emergency conditions detected. Immediate action required.',
  },
  'No Data': {
    colors: ['#0f172a', '#0c1a2e'],
    accent: '#475569',
    icon: Server,
    headline: 'AWAITING DATA',
    sub: 'Connecting to Firebase…',
  },
};

// ── SCREEN ────────────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const {
    warehouseStatus,
    lastSync,
    isConnected,
    amberAlertActive,
    dismissAmberAlert,
    thresholds,
  } = useLiveWarehouse();

  const overallStatus = warehouseStatus?.overallStatus ?? 'No Data';
  const hero          = STATUS_HERO[overallStatus] ?? STATUS_HERO['No Data'];
  const HeroIcon      = hero.icon;

  const avgHum  = warehouseStatus?.averageHum  ?? null;
  const avgTemp = warehouseStatus?.averageTemp ?? null;
  const online  = warehouseStatus?.onlineNodes ?? null;
  const maxHum  = thresholds?.max_humidity    ?? 80;
  const maxTemp = thresholds?.max_temperature ?? 35;

  // Sorted node list: Critical → At Risk → Optimal → Offline
  const sortedNodes = useMemo(() => {
    if (!warehouseStatus?.enrichedNodes) return [];
    const order = { Critical: 0, 'At Risk': 1, Optimal: 2, Offline: 3 };
    return Object.values(warehouseStatus.enrichedNodes)
      .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [warehouseStatus?.enrichedNodes]);

  const renderNode = ({ item }) => (
    <NodeCard
      node={item}
      thresholds={thresholds}
      onPress={() => navigation?.navigate('NodeDetail', { nodeId: item.nodeId })}
    />
  );

  // Colour for gauge rings based on warehouse status
  const humColor  = avgHum  != null && avgHum  > maxHum  ? '#ef4444' : '#06b6d4';
  const tempColor = avgTemp != null && avgTemp > maxTemp ? '#ef4444' : '#f59e0b';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080f1e' }}>
      <StatusBar barStyle="light-content" backgroundColor="#080f1e" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} tintColor="#06b6d4" colors={['#06b6d4']} />
        }
      >
        {/* ── HEADER ── */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6,
        }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Activity size={13} color="#06b6d4" />
              <Text style={{ color: '#06b6d4', fontSize: 11, letterSpacing: 2, fontWeight: '700' }}>
                SMART-MEGAZEN
              </Text>
            </View>
            <Text style={{ color: '#e2e8f0', fontSize: 24, fontWeight: '900', marginTop: 2 }}>
              Investor Suite
            </Text>
          </View>
          <SyncBadge lastSync={lastSync} isConnected={isConnected} />
        </View>

        {/* ── STATUS HERO ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <LinearGradient
            colors={hero.colors}
            style={{
              borderRadius: 22,
              padding: 22,
              borderWidth: 1,
              borderColor: `${hero.accent}44`,
              shadowColor: hero.accent,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {/* Icon row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: `${hero.accent}22`,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: `${hero.accent}44`,
              }}>
                <HeroIcon size={26} color={hero.accent} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: hero.accent, fontSize: 18, fontWeight: '900',
                  letterSpacing: 1.2,
                }}>
                  {hero.headline}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                  {hero.sub}
                </Text>
              </View>
            </View>

            {/* Sub-stats strip */}
            <View style={{
              flexDirection: 'row', gap: 0, marginTop: 18,
              borderTopWidth: 1, borderTopColor: '#ffffff10',
              paddingTop: 14,
            }}>
              {[
                { label: 'ONLINE',   value: warehouseStatus?.onlineNodes   ?? '--', color: '#10b981' },
                { label: 'AT RISK',  value: (warehouseStatus?.atRiskNodesCount ?? 0) + (warehouseStatus?.criticalNodesCount ?? 0), color: '#f59e0b' },
                { label: 'OFFLINE',  value: warehouseStatus?.offlineNodes  ?? '--', color: '#475569' },
                { label: 'TOTAL',    value: warehouseStatus?.totalNodes    ?? '--', color: '#94a3b8' },
              ].map((s, i) => (
                <View key={s.label} style={{
                  flex: 1, alignItems: 'center',
                  borderLeftWidth: i > 0 ? 1 : 0,
                  borderLeftColor: '#ffffff10',
                }}>
                  <Text style={{ color: s.color, fontSize: 20, fontWeight: '900' }}>{s.value}</Text>
                  <Text style={{ color: '#475569', fontSize: 9, letterSpacing: 1, marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* ── NODE HEALTH BAR ── */}
        <NodeHealthBar warehouseStatus={warehouseStatus} />

        {/* ── GAUGE ROW — Avg Hum / Avg Temp / Online ── */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: 16,
          marginTop: 22,
          paddingVertical: 18,
          backgroundColor: '#0c1625',
          marginHorizontal: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#1e293b',
        }}>
          <GaugeRing
            value={avgHum}
            max={100}
            size={108}
            strokeWidth={11}
            color={humColor}
            unit="%"
            label="AVG HUM"
            warnAt={maxHum}
          />
          <GaugeRing
            value={avgTemp}
            max={60}
            size={108}
            strokeWidth={11}
            color={tempColor}
            unit="°C"
            label="AVG TEMP"
            warnAt={maxTemp}
          />
          <GaugeRing
            value={online}
            max={Math.max(warehouseStatus?.totalNodes ?? 1, 1)}
            size={108}
            strokeWidth={11}
            color="#10b981"
            unit=""
            label="ONLINE"
          />
        </View>

        {/* ── KPI STRIP (secondary numbers) ── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 11, marginTop: 14 }}>
          <MetricTile
            icon={<Droplets size={16} color="#06b6d4" />}
            label="Avg Humidity"
            value={avgHum?.toFixed != null ? avgHum.toFixed(1) : '--'}
            unit="%"
            color="#06b6d4"
            max={100}
          />
          <MetricTile
            icon={<Thermometer size={16} color="#f59e0b" />}
            label="Avg Temp"
            value={avgTemp?.toFixed != null ? avgTemp.toFixed(1) : '--'}
            unit="°C"
            color="#f59e0b"
            max={60}
          />
          <MetricTile
            icon={<Server size={16} color="#10b981" />}
            label="Online"
            value={online ?? '--'}
            unit=""
            color="#10b981"
            max={warehouseStatus?.totalNodes ?? 10}
          />
        </View>

        {/* ── NODE GRID ── */}
        <View style={{ paddingHorizontal: 10, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 6, marginBottom: 12 }}>
            <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: '#06b6d4' }} />
            <Text style={{ color: '#475569', fontSize: 11, letterSpacing: 1.5, fontWeight: '700' }}>
              NODE GRID — {sortedNodes.length} SENSORS
            </Text>
          </View>
          <FlatList
            data={sortedNodes}
            renderItem={renderNode}
            keyExtractor={(item) => item.nodeId}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
          />
        </View>
      </ScrollView>

      {/* ── AMBER ALERT OVERLAY ── */}
      <AmberAlert
        visible={amberAlertActive}
        warehouseStatus={warehouseStatus}
        onDismiss={dismissAmberAlert}
      />
    </SafeAreaView>
  );
}