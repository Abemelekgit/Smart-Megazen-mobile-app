/**
 * @file NodeCard.js
 * @description Memoized individual node card for the warehouse grid.
 *
 * Memoized with React.memo to prevent re-renders when sibling nodes update —
 * only re-renders when THIS node's data actually changes (satisfies Technical Commandment #4).
 */

import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Thermometer, Droplets, Wifi, WifiOff, Battery, BatteryLow } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Optimal:  { border: '#10b981', bg: ['#064e3b22', '#0f172a'], label: '#10b981' },
  'At Risk':{ border: '#f59e0b', bg: ['#78350f22', '#0f172a'], label: '#f59e0b' },
  Critical: { border: '#ef4444', bg: ['#7f1d1d44', '#0f172a'], label: '#ef4444' },
  Offline:  { border: '#334155', bg: ['#1e293b55', '#0f172a'], label: '#64748b' },
};

// ── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * @component NodeCard
 * @param {Object}   props
 * @param {Object}   props.node     - Enriched node object from getWarehouseStatus.
 * @param {function} props.onPress  - Called when the card is tapped.
 */
const NodeCard = memo(function NodeCard({ node, onPress }) {
  const config = STATUS_CONFIG[node.status] ?? STATUS_CONFIG.Offline;
  const isOnline = node.isOnline;

  const batteryLow = node.battery != null && node.battery < 20;
  const BatteryIcon = batteryLow ? BatteryLow : Battery;
  const ConnIcon    = isOnline   ? Wifi       : WifiOff;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, flex: 1, margin: 6 })}
    >
      <LinearGradient
        colors={config.bg}
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: config.border,
          padding: 14,
          minHeight: 140,
        }}
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 }}>
            {node.nodeId?.toUpperCase()}
          </Text>
          <ConnIcon size={14} color={isOnline ? '#10b981' : '#64748b'} />
        </View>

        {/* Status badge */}
        <View style={{
          alignSelf: 'flex-start',
          backgroundColor: `${config.border}22`,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
          marginBottom: 12,
        }}>
          <Text style={{ color: config.label, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>
            {node.status.toUpperCase()}
          </Text>
        </View>

        {/* Metric row */}
        {isOnline ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* Humidity */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Droplets size={14} color="#06b6d4" />
              <Text style={{ color: '#06b6d4', fontSize: 15, fontWeight: '700' }}>
                {node.hum?.toFixed(1)}
                <Text style={{ fontSize: 11, fontWeight: '400' }}>%</Text>
              </Text>
            </View>

            {/* Temperature */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Thermometer size={14} color="#f59e0b" />
              <Text style={{ color: '#f59e0b', fontSize: 15, fontWeight: '700' }}>
                {node.temp?.toFixed(1)}
                <Text style={{ fontSize: 11, fontWeight: '400' }}>°C</Text>
              </Text>
            </View>

            {/* Battery */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <BatteryIcon size={14} color={batteryLow ? '#ef4444' : '#94a3b8'} />
              <Text style={{ color: batteryLow ? '#ef4444' : '#94a3b8', fontSize: 12 }}>
                {node.battery}%
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#475569', fontSize: 12 }}>
            Last seen {node.lastSeenAgo != null ? `${node.lastSeenAgo}s ago` : 'unknown'}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these fields change
  const p = prevProps.node;
  const n = nextProps.node;
  return (
    p.status    === n.status    &&
    p.hum       === n.hum       &&
    p.temp      === n.temp      &&
    p.battery   === n.battery   &&
    p.isOnline  === n.isOnline
  );
});

export default NodeCard;
