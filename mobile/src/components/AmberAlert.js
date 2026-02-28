/**
 * @file AmberAlert.js
 * @description Full-screen "Amber Alert" overlay displayed when warehouse status is Critical.
 *
 * Satisfies Technical Commandment #3 — a visually dominant, haptic-backed warning
 * that demands investor attention for immediate action.
 *
 * Features:
 *  - Pulsing red border animation
 *  - Displays count of critical nodes
 *  - Lists which nodes are at-risk/critical
 *  - "Acknowledge" button to dismiss (haptic feedback on dismiss)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, Animated, ScrollView, Platform } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * @component AmberAlert
 * @param {Object}   props
 * @param {boolean}  props.visible          - Whether the alert overlay is shown.
 * @param {Object}   props.warehouseStatus  - Current warehouse snapshot from getWarehouseStatus.
 * @param {function} props.onDismiss        - Called when user acknowledges the alert.
 */
export default function AmberAlert({ visible, warehouseStatus, onDismiss }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation loop while alert is visible
  useEffect(() => {
    if (!visible) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [visible, pulseAnim]);

  const borderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#7f1d1d', '#ef4444'],
  });

  const criticalNodes = warehouseStatus
    ? Object.values(warehouseStatus.enrichedNodes ?? {}).filter(n => n.status === 'Critical')
    : [];

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      import('expo-haptics').then(H => H.impactAsync(H.ImpactFeedbackStyle.Medium)).catch(() => {});
    }
    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={{
        flex: 1,
        backgroundColor: '#0f172aee',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <Animated.View style={{
          width: '100%',
          borderRadius: 20,
          borderWidth: 2,
          borderColor,
          backgroundColor: '#1e293b',
          padding: 24,
          shadowColor: '#ef4444',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 24,
          elevation: 12,
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={28} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: '800', letterSpacing: 1 }}>
                CRITICAL ALERT
              </Text>
            </View>
            <Pressable onPress={handleDismiss} hitSlop={12}>
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Summary */}
          <View style={{
            backgroundColor: '#7f1d1d33',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}>
            <Text style={{ color: '#fca5a5', fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
              {warehouseStatus?.criticalNodesCount ?? 0} node{(warehouseStatus?.criticalNodesCount ?? 0) !== 1 ? 's' : ''} exceeding safety thresholds
            </Text>
            <Text style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              Avg Humidity: {warehouseStatus?.averageHum}% · Avg Temp: {warehouseStatus?.averageTemp}°C
            </Text>
          </View>

          {/* Critical Node List */}
          <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
            {criticalNodes.map((node) => (
              <View key={node.nodeId} style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#334155',
              }}>
                <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: 13 }}>
                  {node.nodeId?.toUpperCase()}
                </Text>
                <Text style={{ color: '#fca5a5', fontSize: 13 }}>
                  {node.hum?.toFixed(1)}% RH · {node.temp?.toFixed(1)}°C
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* CTA */}
          <Pressable
            onPress={handleDismiss}
            style={{
              marginTop: 20,
              backgroundColor: '#ef4444',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1 }}>
              ACKNOWLEDGE ALERT
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
