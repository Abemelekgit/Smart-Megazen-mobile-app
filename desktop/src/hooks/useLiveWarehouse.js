/**
 * @file useLiveWarehouse.js  (Desktop version)
 * @description Same live-data hook adapted for the React/Electron desktop environment.
 * Mirrors the mobile hook API so shared logic is consistent across platforms.
 */

import { useState, useEffect, useRef } from 'react';
import { MegazenService, getWarehouseStatus, DEFAULT_THRESHOLDS } from '../../../shared/MegazenService';
import { firebaseApp } from '../../../shared/firebaseConfig';

/**
 * @hook useLiveWarehouse
 */
export function useLiveWarehouse() {
  const [readings,        setReadings]        = useState({});
  const [thresholds,      setThresholds]      = useState(DEFAULT_THRESHOLDS);
  const [alerts,          setAlerts]          = useState([]);
  const [warehouseStatus, setWarehouseStatus] = useState(null);
  const [lastSync,        setLastSync]        = useState(null);
  const [isConnected,     setIsConnected]     = useState(false);

  const serviceRef = useRef(new MegazenService(firebaseApp));

  useEffect(() => {
    const service = serviceRef.current;

    const unsubReadings = service.subscribeToReadings((data) => {
      setReadings(data);
      setLastSync(new Date());
      setIsConnected(true);
    });

    const unsubThresholds = service.subscribeToThresholds(setThresholds);
    const unsubAlerts     = service.subscribeToAlerts(setAlerts);

    return () => {
      unsubReadings();
      unsubThresholds();
      unsubAlerts();
    };
  }, []);

  useEffect(() => {
    setWarehouseStatus(getWarehouseStatus(readings, thresholds));
  }, [readings, thresholds]);

  return { warehouseStatus, readings, thresholds, alerts, lastSync, isConnected };
}
