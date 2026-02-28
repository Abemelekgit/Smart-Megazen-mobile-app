/**
 * @file MetricTile.js
 * @description KPI metric tile with a mini horizontal fill-bar showing
 * the value's position between 0 and a soft ceiling.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * @component MetricTile
 * @param {React.ReactNode} icon   - Lucide icon node.
 * @param {string}          label  - Short label (e.g. "Avg Humidity").
 * @param {string|number}   value  - Primary displayed value.
 * @param {string}          unit   - Unit string.
 * @param {string}          color  - Accent hex colour.
 * @param {number}          [max]  - Soft max for the mini bar (default 100).
 */
export default function MetricTile({ icon, label, value, unit, color, max = 100 }) {
  const pct = Math.min(Math.max((parseFloat(value) || 0) / max, 0), 1);

  return (
    <LinearGradient
      colors={[`${color}14`, '#141e2e']}
      style={{
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${color}33`,
        padding: 14,
        marginHorizontal: 5,
        minHeight: 96,
        justifyContent: 'space-between',
        shadowColor: color,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Icon + label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon}
        <Text style={{ color: '#64748b', fontSize: 10, letterSpacing: 0.6 }}>
          {label.toUpperCase()}
        </Text>
      </View>

      {/* Value */}
      <Text style={{ color, fontSize: 26, fontWeight: '900', marginTop: 4 }}>
        {value ?? '--'}
        <Text style={{ fontSize: 13, fontWeight: '400', color: `${color}88` }}>{unit}</Text>
      </Text>

      {/* Mini fill bar */}
      <View style={{ height: 3, borderRadius: 2, backgroundColor: '#1e293b', marginTop: 8, overflow: 'hidden' }}>
        <View style={{
          width: `${(pct * 100).toFixed(1)}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 2,
          opacity: 0.7,
        }} />
      </View>
    </LinearGradient>
  );
}
