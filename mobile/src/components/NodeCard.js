/**
 * @file NodeCard.js
 * @description Memoized node card with mini progress bars, animated pulse dot,
 * battery pill, and per-threshold colour warnings.
 */

import React, { memo, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Thermometer, Droplets, Wifi, WifiOff, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Optimal:   { border: '#10b981', bg: ['#05ce8a0d', '#0f172a'], label: '#10b981', glow: '#10b98133' },
  'At Risk': { border: '#f59e0b', bg: ['#f59e0b0d', '#0f172a'], label: '#f59e0b', glow: '#f59e0b26' },
  Critical:  { border: '#ef4444', bg: ['#ef44441a', '#0f172a'], label: '#ef4444', glow: '#ef444440' },
  Offline:   { border: '#1e293b', bg: ['#1e293b44', '#0f172a'], label: '#475569', glow: 'transparent' },
};

// ── PULSING DOT ──────────────────────────────────────────────────────────────

function PulseDot({ color, active }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim]);
  return (
    <Animated.View style={{
      width: 7, height: 7, borderRadius: 3.5,
      backgroundColor: color,
      opacity: active ? anim : 1,
    }} />
  );
}

// ── MINI BAR ─────────────────────────────────────────────────────────────────

function MiniBar({ value, max, color, warn }) {
  const pct      = Math.min(Math.max((value ?? 0) / (max || 1), 0), 1);
  const overWarn = warn != null && (value ?? 0) > warn;
  return (
    <View style={{ height: 3, borderRadius: 2, backgroundColor: '#1e293b', flex: 1, overflow: 'hidden' }}>
      <View style={{
        width: `${(pct * 100).toFixed(1)}%`,
        height: '100%',
        backgroundColor: overWarn ? '#ef4444' : color,
        borderRadius: 2,
      }} />
    </View>
  );
}

// ── COMPONENT ────────────────────────────────────────────────────────────────

const NodeCard = memo(function NodeCard({ node, onPress, thresholds }) {
  const config     = STATUS_CONFIG[node.status] ?? STATUS_CONFIG.Offline;
  const isOnline   = node.isOnline;
  const isCritical = node.status === 'Critical';
  const batteryLow = node.battery != null && node.battery < 20;
  const maxHum     = thresholds?.max_humidity    ?? 80;
  const maxTemp    = thresholds?.max_temperature ?? 35;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.82 : 1,
        flex: 1, margin: 6, borderRadius: 18,
        shadowColor: config.glow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 14,
        elevation: 6,
      })}
    >
      <LinearGradient
        colors={config.bg}
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: config.border,
          padding: 14,
          minHeight: 152,
          justifyContent: 'space-between',
        }}
      >
        {/* Top row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 13, letterSpacing: 0.8 }}>
            {node.nodeId?.toUpperCase()}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {isOnline ? <Wifi size={12} color="#10b981" /> : <WifiOff size={12} color="#334155" />}
            <PulseDot color={config.border} active={isCritical} />
          </View>
        </View>

        {/* Status badge */}
        <View style={{
          alignSelf: 'flex-start',
          backgroundColor: `${config.border}1a`,
          borderRadius: 6,
          paddingHorizontal: 8, paddingVertical: 2,
          marginTop: 6,
        }}>
          <Text style={{ color: config.label, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
            {node.status.toUpperCase()}
          </Text>
        </View>

        {/* Metrics with bars */}
        {isOnline ? (
          <View style={{ marginTop: 10, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Droplets size={11} color="#06b6d4" />
              <Text style={{ color: '#06b6d4', fontSize: 12, fontWeight: '700', width: 42 }}>
                {node.hum?.toFixed(1)}<Text style={{ fontSize: 9, fontWeight: '400' }}>%</Text>
              </Text>
              <MiniBar value={node.hum} max={maxHum * 1.3} color="#06b6d4" warn={maxHum} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Thermometer size={11} color="#f59e0b" />
              <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '700', width: 42 }}>
                {node.temp?.toFixed(1)}<Text style={{ fontSize: 9, fontWeight: '400' }}>°C</Text>
              </Text>
              <MiniBar value={node.temp} max={maxTemp * 1.3} color="#f59e0b" warn={maxTemp} />
            </View>
            {/* Battery pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Zap size={10} color={batteryLow ? '#ef4444' : '#334155'} />
              <View style={{
                backgroundColor: batteryLow ? '#ef444418' : '#1e293b',
                borderRadius: 10,
                paddingHorizontal: 6, paddingVertical: 2,
                borderWidth: 1,
                borderColor: batteryLow ? '#ef444455' : '#334155',
              }}>
                <Text style={{ color: batteryLow ? '#ef4444' : '#475569', fontSize: 10, fontWeight: '700' }}>
                  {node.battery != null ? `⚡ ${node.battery}%` : '--'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <WifiOff size={18} color="#334155" />
            <Text style={{ color: '#334155', fontSize: 11, marginTop: 5, letterSpacing: 0.5 }}>NODE OFFLINE</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
});

export default NodeCard;
