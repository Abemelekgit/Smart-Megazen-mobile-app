/**
 * @file NodeHealthBar.js
 * @description Segmented horizontal health-distribution bar.
 * Visually shows the ratio of Optimal / At-Risk / Critical / Offline nodes
 * in a single glanceable strip with a legend row below.
 *
 *  ████████████████▒▒▒▒░░░░▓▓▓  ← segments proportional to node counts
 *  ● 6 OPTIMAL  ● 2 AT RISK  ● 1 CRITICAL  ● 1 OFFLINE
 */

import React from 'react';
import { View, Text } from 'react-native';

const SEGMENTS = [
  { key: 'optimalNodesCount',  color: '#10b981', label: 'Optimal'  },
  { key: 'atRiskNodesCount',   color: '#f59e0b', label: 'At Risk'  },
  { key: 'criticalNodesCount', color: '#ef4444', label: 'Critical' },
  { key: 'offlineNodes',       color: '#334155', label: 'Offline'  },
];

/**
 * @component NodeHealthBar
 * @param {Object} warehouseStatus - Output of getWarehouseStatus / useLiveWarehouse.
 */
export default function NodeHealthBar({ warehouseStatus }) {
  const total = Math.max(warehouseStatus?.totalNodes ?? 0, 1);

  const counts = SEGMENTS.map(s => ({
    ...s,
    count: warehouseStatus?.[s.key] ?? 0,
    pct:   (warehouseStatus?.[s.key] ?? 0) / total,
  }));

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
      {/* Label */}
      <Text style={{
        color: '#475569', fontSize: 10, letterSpacing: 1.5,
        textTransform: 'uppercase', marginBottom: 8,
      }}>
        Node Health Distribution
      </Text>

      {/* Segmented bar */}
      <View style={{
        flexDirection: 'row',
        height: 7,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#1e293b',
        gap: 1,
      }}>
        {counts.map(seg =>
          seg.count > 0 ? (
            <View
              key={seg.key}
              style={{
                flex: seg.count,
                backgroundColor: seg.color,
              }}
            />
          ) : null
        )}
      </View>

      {/* Legend row */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        flexWrap: 'wrap',
        gap: 4,
      }}>
        {counts.map(seg => (
          <View key={seg.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{
              width: 7, height: 7, borderRadius: 3.5,
              backgroundColor: seg.color,
            }} />
            <Text style={{ color: seg.count > 0 ? '#94a3b8' : '#334155', fontSize: 11 }}>
              <Text style={{ fontWeight: '700', color: seg.count > 0 ? seg.color : '#334155' }}>
                {seg.count}
              </Text>
              {' '}{seg.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
