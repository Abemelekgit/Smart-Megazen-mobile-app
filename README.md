# Smart-Megazen — IoT Ecosystem

> **Protecting Ethiopia's coffee exports through real-time warehouse intelligence.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Firebase Realtime Database                  │
│            (Single Source of Truth — No P2P)                │
└────────────────────────┬────────────────────────────────────┘
                         │  onValue (sub-second sync)
          ┌──────────────┼──────────────┐
          ▼                             ▼
┌─────────────────┐          ┌──────────────────────┐
│  Electron App   │          │  Expo Mobile App      │
│  Command Center │          │  Investor Suite        │
│  (Operations)   │          │  (Monitoring/Alerts)   │
└─────────────────┘          └──────────────────────┘
          ▲                             ▲
          │ Reports every 5 min         │
┌─────────────────────────────────────────────────────────────┐
│              ESP32 + DHT22 Hardware Nodes                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Firebase Schema

All apps read/write to these exact paths:

| Path | Description |
|------|-------------|
| `artifacts/smart-megazen/public/data/readings/{nodeId}` | Live sensor readings |
| `artifacts/smart-megazen/public/data/configs/thresholds` | Global safety thresholds |
| `artifacts/smart-megazen/public/data/logs/alerts` | Append-only breach events |

### Node reading structure:
```json
{
  "temp":      25.4,
  "hum":       58.2,
  "battery":   87,
  "timestamp": 1709035200000
}
```

### Thresholds structure:
```json
{
  "max_humidity":    60,
  "max_temperature": 30,
  "min_battery":     20
}
```

---

## Project Structure

```
Smart-Megazen/
├── shared/
│   ├── MegazenService.js        ← Core service (compatible with both apps)
│   └── firebaseConfig.js        ← Firebase initialization (singleton)
│
├── mobile/                      ← Expo React Native — Investor Suite
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   ├── tailwind.config.js
│   └── src/
│       ├── hooks/
│       │   └── useLiveWarehouse.js
│       ├── components/
│       │   ├── NodeCard.js       ← Memoized (custom equality)
│       │   ├── AmberAlert.js     ← Critical emergency overlay
│       │   ├── MetricTile.js     ← KPI summary tile
│       │   └── SyncBadge.js      ← "Last Sync: HH:MM:SS" pill
│       ├── screens/
│       │   ├── DashboardScreen.js
│       │   ├── AlertsScreen.js
│       │   └── NodeDetailScreen.js
│       └── navigation/
│           └── AppNavigator.js
│
└── desktop/                     ← Electron + React — Command Center
    ├── electron/
    │   ├── main.js
    │   └── preload.js
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── hooks/
        │   └── useLiveWarehouse.js
        ├── components/
        │   ├── NodeGrid.js        ← Memoized rows (custom equality)
        │   └── AlertLogPanel.js   ← CSV export + filter
        └── screens/
            ├── DashboardScreen.js
            ├── NodeManagerScreen.js
            └── ThresholdScreen.js
```

---

## Setup

### 1. Firebase Configuration

Edit `shared/firebaseConfig.js` and replace placeholder values with your Firebase project credentials.

### 2. Mobile App (Expo)

```bash
cd mobile
npm install
npx expo start
```

For push notifications, add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS).

### 3. Desktop App (Electron)

```bash
cd desktop
npm install
npm run dev          # Hot-reload dev mode
npm run build        # Production build
```

---

## Technical Commandments (Implemented)

| Commandment | Implementation |
|---|---|
| No Direct P2P | All data flows through Firebase only |
| Offline Resilience | `SyncBadge` displays "Last Sync: HH:MM:SS" on every screen |
| Safety First | `AmberAlert` triggers haptic + full-screen overlay on Critical status |
| Performance | `NodeCard` and `NodeRow` use `React.memo` with custom equality comparators |

---

## Key Functions — `MegazenService.js`

| Export | Description |
|---|---|
| `class MegazenService` | Firebase subscription manager with auto-cleanup |
| `getWarehouseStatus(readings, thresholds)` | Aggregates all nodes into a single fleet snapshot |
| `getNodeStatus(node, thresholds)` | Derives `Optimal / At Risk / Critical / Offline` for one node |
| `isNodeStale(timestamp)` | Returns `true` if node is silent > 120 seconds |
