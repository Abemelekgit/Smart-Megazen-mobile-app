/**
 * @file SyncBadge.js
 * @description "Last Sync: HH:MM:SS" pill that satisfies Technical Commandment #2.
 * Must be visible on every screen that displays live data.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { RotateCw, WifiOff } from 'lucide-react-native';

/**
 * @component SyncBadge
 * @param {Object}    props
 * @param {Date|null} props.lastSync    - Date object of last Firebase update.
 * @param {boolean}   props.isConnected - Whether Firebase is actively connected.
 */
export default function SyncBadge({ lastSync, isConnected }) {
  const formatted = lastSync
    ? lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#1e293b',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: isConnected ? '#06b6d422' : '#ef444422',
    }}>
      {isConnected
        ? <RotateCw size={11} color="#06b6d4" />
        : <WifiOff  size={11} color="#ef4444" />}
      <Text style={{
        color: isConnected ? '#06b6d4' : '#ef4444',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.3,
      }}>
        {isConnected ? `SYNCED ${formatted}` : 'DISCONNECTED'}
      </Text>
    </View>
  );
}
