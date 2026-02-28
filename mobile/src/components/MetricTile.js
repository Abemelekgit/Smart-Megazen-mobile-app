/**
 * @file MetricTile.js
 * @description Glassmorphism summary metric tile for the Dashboard header row.
 * Displays one high-level KPI (avg humidity, avg temp, online count, etc.).
 */

import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * @component MetricTile
 * @param {Object}          props
 * @param {React.ReactNode} props.icon    - Lucide icon component instance.
 * @param {string}          props.label   - Metric label (e.g. "Avg Humidity").
 * @param {string|number}   props.value   - Primary metric value.
 * @param {string}          props.unit    - Unit suffix (e.g. "%" or "°C").
 * @param {string}          props.color   - Accent hex color (e.g. "#06b6d4").
 */
export default function MetricTile({ icon, label, value, unit, color }) {
  return (
    <LinearGradient
      colors={[`${color}18`, '#1e293b']}
      style={{
        flex: 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: `${color}44`,
        padding: 14,
        marginHorizontal: 5,
        alignItems: 'center',
        minHeight: 90,
        justifyContent: 'space-between',
      }}
    >
      {icon}
      <Text style={{ color: '#94a3b8', fontSize: 10, letterSpacing: 0.5, marginTop: 6, textAlign: 'center' }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color, fontSize: 22, fontWeight: '800' }}>
        {value}
        <Text style={{ fontSize: 13, fontWeight: '400', color: `${color}99` }}>{unit}</Text>
      </Text>
    </LinearGradient>
  );
}
