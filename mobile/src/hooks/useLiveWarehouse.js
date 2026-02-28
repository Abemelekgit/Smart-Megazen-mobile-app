/**
 * @file useLiveWarehouse.js
 * @description Custom React hook that wires up all Firebase real-time subscriptions
 * for the Smart-Megazen mobile Investor Suite.
 *
 * Provides:
 *  - Live enriched warehouse status (readings + thresholds → aggregated snapshot)
 *  - Automatic "Amber Alert" haptic/UI trigger on Critical status
 *  - lastSync timestamp displayed in the UI ("Last Sync: HH:MM:SS")
 *  - Safe unsubscribe on unmount — zero memory leaks
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { MegazenService, getWarehouseStatus, DEFAULT_THRESHOLDS } from '../shared/MegazenService';
import { firebaseApp } from '../shared/firebaseConfig';

/**
 * @hook useLiveWarehouse
 * @returns {{
 *   warehouseStatus: Object|null,
 *   readings:        Object,
 *   thresholds:      Object,
 *   alerts:          Object[],
 *   lastSync:        Date|null,
 *   isConnected:     boolean,
 *   amberAlertActive: boolean,
 *   dismissAmberAlert: function
 * }}
 */
export function useLiveWarehouse() {
  const [readings,         setReadings]         = useState({});
  const [thresholds,       setThresholds]       = useState(DEFAULT_THRESHOLDS);
  const [alerts,           setAlerts]           = useState([]);
  const [warehouseStatus,  setWarehouseStatus]  = useState(null);
  const [lastSync,         setLastSync]         = useState(null);
  const [isConnected,      setIsConnected]      = useState(false);
  const [amberAlertActive, setAmberAlertActive] = useState(false);

  // Persist service across renders without re-creating it
  const serviceRef  = useRef(new MegazenService(firebaseApp));
  const prevOverall = useRef(null);

  // Dismiss the amber alert overlay manually
  const dismissAmberAlert = useCallback(() => {
    setAmberAlertActive(false);
  }, []);

  // ── FIREBASE SUBSCRIPTIONS ───────────────────────────────────────────────
  useEffect(() => {
    const service = serviceRef.current;

    const unsubReadings = service.subscribeToReadings((data) => {
      setReadings(data);
      setLastSync(new Date());
      setIsConnected(true);
    });

    const unsubThresholds = service.subscribeToThresholds((data) => {
      setThresholds(data);
    });

    const unsubAlerts = service.subscribeToAlerts((data) => {
      setAlerts(data);
    });

    // Cleanup all listeners on screen unmount
    return () => {
      unsubReadings();
      unsubThresholds();
      unsubAlerts();
    };
  }, []); // Mount once

  // ── STATUS AGGREGATION ───────────────────────────────────────────────────
  useEffect(() => {
    const snapshot = getWarehouseStatus(readings, thresholds);
    setWarehouseStatus(snapshot);

    // Trigger Amber Alert only on fresh transition INTO Critical status
    if (
      snapshot.overallStatus === 'Critical' &&
      prevOverall.current !== 'Critical'
    ) {
      setAmberAlertActive(true);
      // Fire heavy haptic impact — native only
      if (Platform.OS !== 'web') {
        import('expo-haptics').then(Haptics =>
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        ).catch(() => {});
      }
    }

    prevOverall.current = snapshot.overallStatus;
  }, [readings, thresholds]);

  return {
    warehouseStatus,
    readings,
    thresholds,
    alerts,
    lastSync,
    isConnected,
    amberAlertActive,
    dismissAmberAlert,
  };
}
