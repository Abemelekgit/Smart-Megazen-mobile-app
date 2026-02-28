/**
 * @file MegazenService.js
 * @description Shared IoT data service for the Smart-Megazen ecosystem.
 *
 * Compatible with both React (Electron Desktop) and React Native (Expo Mobile).
 * Connects to Firebase Realtime Database and provides:
 *  - Real-time node subscriptions with automatic memory-leak-safe cleanup
 *  - Warehouse status aggregation (overall health, averages, at-risk counts)
 *  - Stale/offline node detection (nodes silent > 120 seconds are marked Offline)
 *  - Threshold-driven logic sourced live from Firebase /configs/thresholds
 *
 * @module MegazenService
 * @author Smart-Megazen Engineering Team
 */

import { getDatabase, ref, onValue, off, push, serverTimestamp } from 'firebase/database';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Firebase RTDB base path for the Smart-Megazen data namespace */
const BASE_PATH = 'artifacts/smart-megazen/public/data';

/** A node with no readings update for longer than this (ms) is considered Offline */
const STALE_THRESHOLD_MS = 120_000; // 120 seconds

/** Default safety thresholds used if Firebase config hasn't loaded yet */
const DEFAULT_THRESHOLDS = {
  max_humidity: 60,     // % RH — above this is At Risk
  max_temperature: 30,  // °C   — above this is At Risk
  min_battery: 20,      // %    — below this triggers low-battery warning
};

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE PATH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Full path to all live sensor readings */
const READINGS_PATH = `${BASE_PATH}/readings`;

/** Full path to global configuration thresholds */
const THRESHOLDS_PATH = `${BASE_PATH}/configs/thresholds`;

/** Full path to the append-only alert log */
const ALERTS_PATH = `${BASE_PATH}/logs/alerts`;

// ─────────────────────────────────────────────────────────────────────────────
// PURE UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determines whether a node's last reading is stale (i.e., offline).
 *
 * @param {number} lastSeenTimestamp - Unix timestamp in milliseconds of the node's last reading.
 * @returns {boolean} True if the node should be considered offline.
 */
export function isNodeStale(lastSeenTimestamp) {
  if (!lastSeenTimestamp) return true;
  return Date.now() - lastSeenTimestamp > STALE_THRESHOLD_MS;
}

/**
 * Derives a human-readable status label for a single node.
 *
 * @param {Object} node        - Raw node object from Firebase.
 * @param {number} node.hum    - Humidity percentage.
 * @param {number} node.temp   - Temperature in °C.
 * @param {number} node.battery - Battery percentage.
 * @param {number} node.timestamp - Last update Unix timestamp (ms).
 * @param {Object} thresholds  - Active threshold config from Firebase.
 * @returns {'Optimal'|'At Risk'|'Critical'|'Offline'} Node status string.
 */
export function getNodeStatus(node, thresholds = DEFAULT_THRESHOLDS) {
  if (!node || isNodeStale(node.timestamp)) return 'Offline';

  const humCritical = node.hum > thresholds.max_humidity * 1.1;   // >10% over limit = Critical
  const tempCritical = node.temp > thresholds.max_temperature * 1.1;
  if (humCritical || tempCritical) return 'Critical';

  const humRisk = node.hum > thresholds.max_humidity;
  const tempRisk = node.temp > thresholds.max_temperature;
  if (humRisk || tempRisk) return 'At Risk';

  return 'Optimal';
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE AGGREGATION FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregates all node readings into a single warehouse-level status snapshot.
 *
 * @param {Object<string, Object>} readings   - Map of nodeId → reading object from Firebase.
 * @param {Object}                 thresholds - Active safety thresholds from Firebase.
 * @param {number} thresholds.max_humidity    - Maximum safe humidity (%).
 * @param {number} thresholds.max_temperature - Maximum safe temperature (°C).
 * @param {number} thresholds.min_battery     - Minimum acceptable battery (%).
 *
 * @returns {{
 *   overallStatus: 'Optimal'|'At Risk'|'Critical'|'No Data',
 *   averageTemp: number,
 *   averageHum: number,
 *   totalNodes: number,
 *   onlineNodes: number,
 *   offlineNodes: number,
 *   atRiskNodesCount: number,
 *   criticalNodesCount: number,
 *   lowBatteryNodes: string[],
 *   enrichedNodes: Object<string, Object>
 * }} Aggregated warehouse snapshot.
 */
export function getWarehouseStatus(readings = {}, thresholds = DEFAULT_THRESHOLDS) {
  const nodeIds = Object.keys(readings);

  if (nodeIds.length === 0) {
    return {
      overallStatus: 'No Data',
      averageTemp: 0,
      averageHum: 0,
      totalNodes: 0,
      onlineNodes: 0,
      offlineNodes: 0,
      atRiskNodesCount: 0,
      criticalNodesCount: 0,
      lowBatteryNodes: [],
      enrichedNodes: {},
    };
  }

  let tempSum = 0;
  let humSum = 0;
  let onlineCount = 0;
  let atRiskCount = 0;
  let criticalCount = 0;
  const lowBatteryNodes = [];
  const enrichedNodes = {};

  for (const nodeId of nodeIds) {
    const node = readings[nodeId];
    const status = getNodeStatus(node, thresholds);
    const isOnline = status !== 'Offline';

    enrichedNodes[nodeId] = {
      ...node,
      nodeId,
      status,
      isOnline,
      lastSeenAgo: node?.timestamp
        ? Math.floor((Date.now() - node.timestamp) / 1000)
        : null,
    };

    if (isOnline) {
      tempSum += node.temp ?? 0;
      humSum += node.hum ?? 0;
      onlineCount++;
    }

    if (status === 'At Risk') atRiskCount++;
    if (status === 'Critical') criticalCount++;

    if (
      isOnline &&
      node.battery != null &&
      node.battery < thresholds.min_battery
    ) {
      lowBatteryNodes.push(nodeId);
    }
  }

  // Determine fleet-wide status: Critical > At Risk > Optimal
  let overallStatus = 'Optimal';
  if (criticalCount > 0) overallStatus = 'Critical';
  else if (atRiskCount > 0) overallStatus = 'At Risk';
  else if (onlineCount === 0) overallStatus = 'No Data';

  return {
    overallStatus,
    averageTemp: onlineCount > 0 ? parseFloat((tempSum / onlineCount).toFixed(1)) : 0,
    averageHum: onlineCount > 0 ? parseFloat((humSum / onlineCount).toFixed(1)) : 0,
    totalNodes: nodeIds.length,
    onlineNodes: onlineCount,
    offlineNodes: nodeIds.length - onlineCount,
    atRiskNodesCount: atRiskCount,
    criticalNodesCount: criticalCount,
    lowBatteryNodes,
    enrichedNodes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MEGAZEN SERVICE CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @class MegazenService
 * @description Firebase-backed real-time data service for Smart-Megazen.
 *
 * Manages live subscriptions to readings and threshold config.
 * Returns unsubscribe functions so React useEffect can clean up with zero leaks.
 *
 * @example
 * const service = new MegazenService(firebaseApp);
 *
 * // Subscribe to all readings
 * const unsubscribe = service.subscribeToReadings((readings) => {
 *   setReadings(readings);
 * });
 *
 * // Clean up in useEffect return
 * return () => unsubscribe();
 */
export class MegazenService {
  /**
   * @param {import('firebase/app').FirebaseApp} app - Initialized Firebase app instance.
   */
  constructor(app) {
    this._db = getDatabase(app);
    this._activeListeners = new Map();
  }

  // ── READINGS SUBSCRIPTION ──────────────────────────────────────────────────

  /**
   * Subscribes to real-time updates for ALL node readings.
   *
   * @param {function(Object<string, Object>): void} callback
   *   Called with the full readings map whenever any node updates.
   * @returns {function(): void} Unsubscribe function — call this in useEffect cleanup.
   *
   * @example
   * useEffect(() => {
   *   const unsub = service.subscribeToReadings(setReadings);
   *   return unsub; // React calls this on unmount
   * }, []);
   */
  subscribeToReadings(callback) {
    const dbRef = ref(this._db, READINGS_PATH);

    const handler = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() ?? {};
      callback(data);
    });

    const unsubscribe = () => off(dbRef, 'value', handler);
    this._activeListeners.set('readings', unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribes to real-time updates for a SINGLE node's readings.
   *
   * @param {string}                              nodeId   - The node identifier (Firebase key).
   * @param {function(Object|null): void}         callback - Called with the node's data or null.
   * @returns {function(): void} Unsubscribe function.
   */
  subscribeToNode(nodeId, callback) {
    const dbRef = ref(this._db, `${READINGS_PATH}/${nodeId}`);

    const handler = onValue(dbRef, (snapshot) => {
      callback(snapshot.val());
    });

    const unsubscribe = () => off(dbRef, 'value', handler);
    this._activeListeners.set(`node_${nodeId}`, unsubscribe);
    return unsubscribe;
  }

  // ── THRESHOLD SUBSCRIPTION ─────────────────────────────────────────────────

  /**
   * Subscribes to real-time updates for global safety thresholds.
   *
   * @param {function(Object): void} callback
   *   Called with the threshold config object whenever it changes.
   * @returns {function(): void} Unsubscribe function.
   *
   * @example
   * useEffect(() => {
   *   const unsub = service.subscribeToThresholds(setThresholds);
   *   return unsub;
   * }, []);
   */
  subscribeToThresholds(callback) {
    const dbRef = ref(this._db, THRESHOLDS_PATH);

    const handler = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() ?? DEFAULT_THRESHOLDS;
      callback({ ...DEFAULT_THRESHOLDS, ...data });
    });

    const unsubscribe = () => off(dbRef, 'value', handler);
    this._activeListeners.set('thresholds', unsubscribe);
    return unsubscribe;
  }

  // ── ALERT LOG ──────────────────────────────────────────────────────────────

  /**
   * Subscribes to the append-only alert log.
   *
   * @param {function(Object[]): void} callback
   *   Called with an array of alert objects sorted newest-first.
   * @returns {function(): void} Unsubscribe function.
   */
  subscribeToAlerts(callback) {
    const dbRef = ref(this._db, ALERTS_PATH);

    const handler = onValue(dbRef, (snapshot) => {
      const raw = snapshot.val() ?? {};
      const alerts = Object.entries(raw)
        .map(([id, alert]) => ({ id, ...alert }))
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
      callback(alerts);
    });

    const unsubscribe = () => off(dbRef, 'value', handler);
    this._activeListeners.set('alerts', unsubscribe);
    return unsubscribe;
  }

  /**
   * Appends a new threshold-breach alert to the Firebase alert log.
   * The alert log is append-only — records are never overwritten.
   *
   * @param {Object} alertPayload              - Alert data to record.
   * @param {string} alertPayload.nodeId       - The offending node's ID.
   * @param {string} alertPayload.type         - Alert type: 'humidity'|'temperature'|'battery'.
   * @param {number} alertPayload.value        - The reading value that triggered the alert.
   * @param {number} alertPayload.threshold    - The threshold that was exceeded.
   * @param {string} [alertPayload.message]    - Optional human-readable message.
   * @returns {Promise<void>}
   */
  async pushAlert(alertPayload) {
    const dbRef = ref(this._db, ALERTS_PATH);
    await push(dbRef, {
      ...alertPayload,
      timestamp: serverTimestamp(),
    });
  }

  // ── LIFECYCLE ──────────────────────────────────────────────────────────────

  /**
   * Unsubscribes ALL active Firebase listeners managed by this service instance.
   * Call this when the consuming component/screen unmounts entirely.
   */
  unsubscribeAll() {
    for (const [key, unsubscribe] of this._activeListeners.entries()) {
      unsubscribe();
      this._activeListeners.delete(key);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE useEffect IMPLEMENTATION (copy-paste ready for any screen)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @example Complete useEffect wiring for a React / React Native screen.
 *
 * import { useState, useEffect, useRef } from 'react';
 * import { MegazenService, getWarehouseStatus } from '../shared/MegazenService';
 * import { firebaseApp } from '../firebaseConfig';
 *
 * export function useLiveWarehouse() {
 *   const [readings,   setReadings]   = useState({});
 *   const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
 *   const [status,     setStatus]     = useState(null);
 *   const [lastSync,   setLastSync]   = useState(null);
 *   const serviceRef = useRef(new MegazenService(firebaseApp));
 *
 *   useEffect(() => {
 *     const service = serviceRef.current;
 *
 *     const unsubReadings   = service.subscribeToReadings((data) => {
 *       setReadings(data);
 *       setLastSync(new Date());
 *     });
 *
 *     const unsubThresholds = service.subscribeToThresholds(setThresholds);
 *
 *     // Cleanup: remove both listeners on unmount
 *     return () => {
 *       unsubReadings();
 *       unsubThresholds();
 *     };
 *   }, []); // Empty deps — subscribe once on mount
 *
 *   // Recompute status only when readings OR thresholds change
 *   useEffect(() => {
 *     setStatus(getWarehouseStatus(readings, thresholds));
 *   }, [readings, thresholds]);
 *
 *   return { status, lastSync };
 * }
 */

export { DEFAULT_THRESHOLDS, BASE_PATH, READINGS_PATH, THRESHOLDS_PATH, ALERTS_PATH };
