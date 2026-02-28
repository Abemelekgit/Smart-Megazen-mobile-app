/**
 * @file DashboardScreen.js
 * @description Primary investor dashboard screen — "Smart-Megazen Investor Suite."
 *
 * Layout:
 *  1. Header: App title + SyncBadge
 *  2. Status Hero: Large "Optimal / At Risk / Critical" headline card
 *  3. KPI Metric Strip: Avg Humidity · Avg Temp · Online Nodes · At-Risk Count
 *  4. Node Grid: Memoized NodeCard grid — minimal re-renders
 *  5. AmberAlert Overlay: Full-screen critical emergency overlay
 */

import React, { useMemo } from 'react';
import {
  View, Text, FlatList, ScrollView,
  SafeAreaView, StatusBar, RefreshControl
} from 'react-native';
import { Droplets, Thermometer, Server, AlertOctagon, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import NodeCard    from '../components/NodeCard';
import MetricTile  from '../components/MetricTile';
import SyncBadge   from '../components/SyncBadge';
import AmberAlert  from '../components/AmberAlert';
import { useLiveWarehouse } from '../hooks/useLiveWarehouse';

// ── STATUS HERO CONFIG ───────────────────────────────────────────────────────

const STATUS_HERO = {
  Optimal:   { colors: ['#064e3b', '#0f172a'], text: '#10b981', icon: Shield,       label: 'ALL SYSTEMS OPTIMAL' },
  'At Risk': { colors: ['#78350f', '#0f172a'], text: '#f59e0b', icon: AlertOctagon, label: 'ASSETS AT RISK'        },
  Critical:  { colors: ['#7f1d1d', '#0f172a'], text: '#ef4444', icon: AlertOctagon, label: 'CRITICAL — ACT NOW'    },
  'No Data': { colors: ['#1e293b', '#0f172a'], text: '#64748b', icon: Server,       label: 'AWAITING DATA'         },
};

// ── SCREEN ───────────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const {
    warehouseStatus,
    lastSync,
    isConnected,
    amberAlertActive,
    dismissAmberAlert,
  } = useLiveWarehouse();

  const heroConfig = STATUS_HERO[warehouseStatus?.overallStatus ?? 'No Data'];
  const HeroIcon   = heroConfig.icon;

  // Build sorted node list — Critical first, then At Risk, then Optimal, then Offline
  const sortedNodes = useMemo(() => {
    if (!warehouseStatus?.enrichedNodes) return [];
    const order = { Critical: 0, 'At Risk': 1, Optimal: 2, Offline: 3 };
    return Object.values(warehouseStatus.enrichedNodes)
      .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [warehouseStatus?.enrichedNodes]);

  // FlatList renderItem — relies on NodeCard's custom memo to avoid wasted renders
  const renderNode = ({ item }) => (
    <NodeCard
      node={item}
      onPress={() => navigation?.navigate('NodeDetail', { nodeId: item.nodeId })}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            tintColor="#06b6d4"
            colors={['#06b6d4']}
          />
        }
      >
        {/* ── HEADER ── */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}>
          <View>
            <Text style={{ color: '#94a3b8', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Smart-Megazen
            </Text>
            <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '800' }}>
              Investor Suite
            </Text>
          </View>
          <SyncBadge lastSync={lastSync} isConnected={isConnected} />
        </View>

        {/* ── STATUS HERO ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <LinearGradient
            colors={heroConfig.colors}
            style={{
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: `${heroConfig.text}44`,
            }}
          >
            <HeroIcon size={40} color={heroConfig.text} strokeWidth={1.5} />
            <Text style={{
              color: heroConfig.text,
              fontSize: 28,
              fontWeight: '900',
              letterSpacing: 1.5,
              marginTop: 12,
            }}>
              {warehouseStatus?.overallStatus?.toUpperCase() ?? 'LOADING...'}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, letterSpacing: 0.5 }}>
              {heroConfig.label}
            </Text>

            {/* Secondary sub-stats */}
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 16 }}>
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>
                  {warehouseStatus?.onlineNodes ?? '--'}
                </Text>
                {' '}online
              </Text>
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                <Text style={{ color: '#ef4444', fontWeight: '700' }}>
                  {(warehouseStatus?.atRiskNodesCount ?? 0) + (warehouseStatus?.criticalNodesCount ?? 0)}
                </Text>
                {' '}at risk
              </Text>
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                <Text style={{ color: '#475569', fontWeight: '700' }}>
                  {warehouseStatus?.offlineNodes ?? '--'}
                </Text>
                {' '}offline
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── KPI METRIC STRIP ── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 11, marginTop: 14 }}>
          <MetricTile
            icon={<Droplets size={18} color="#06b6d4" />}
            label="Avg Humidity"
            value={warehouseStatus?.averageHum ?? '--'}
            unit="%"
            color="#06b6d4"
          />
          <MetricTile
            icon={<Thermometer size={18} color="#f59e0b" />}
            label="Avg Temp"
            value={warehouseStatus?.averageTemp ?? '--'}
            unit="°C"
            color="#f59e0b"
          />
          <MetricTile
            icon={<Server size={18} color="#10b981" />}
            label="Online"
            value={warehouseStatus?.onlineNodes ?? '--'}
            unit=""
            color="#10b981"
          />
        </View>

        {/* ── NODE GRID ── */}
        <View style={{ paddingHorizontal: 10, marginTop: 20 }}>
          <Text style={{ color: '#64748b', fontSize: 11, letterSpacing: 1.5, marginBottom: 10, paddingLeft: 6 }}>
            NODE GRID — {sortedNodes.length} SENSORS
          </Text>
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
