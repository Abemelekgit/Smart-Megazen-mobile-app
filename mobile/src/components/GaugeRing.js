/**
 * @file GaugeRing.js
 * @description SVG-based circular arc gauge for visualizing a metric value
 * against a maximum. Used in NodeDetailScreen and MetricTile.
 *
 *  ╭──────────────────────╮
 *  │   ░░░░░████████      │  ← arc fill (colored)
 *  │       72.4           │  ← center value
 *  │        %             │  ← unit
 *  │     Humidity         │  ← label
 *  ╰──────────────────────╯
 */

import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ── MATH HELPERS ─────────────────────────────────────────────────────────────

/**
 * Convert a clock-style angle (0 = 12 o'clock, clockwise) to an SVG {x,y} point.
 */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Build an SVG arc path string (clockwise) from startAngle to endAngle degrees.
 * sweep = 270° by default (from ~135° to ~45° going clockwise through bottom).
 */
function arcPath(cx, cy, r, startAngle, endAngle) {
  // Clamp to avoid degenerate arcs (start === end causes SVG glitch)
  const delta = endAngle - startAngle;
  if (Math.abs(delta) < 0.5) return '';

  const start = polarToCartesian(cx, cy, r, startAngle);
  const end   = polarToCartesian(cx, cy, r, endAngle);
  const large = delta > 180 ? 1 : 0;
  // clockwise sweep-flag = 1
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

// ── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * @component GaugeRing
 *
 * @param {number}  value       - Current reading (e.g. 72.4).
 * @param {number}  max         - Maximum expected value (determines full-ring).
 * @param {number}  size        - Outer diameter in px (default 110).
 * @param {number}  strokeWidth - Arc stroke thickness (default 12).
 * @param {string}  color       - Fill color hex (default cyan).
 * @param {string}  label       - Bottom center label (e.g. "Humidity").
 * @param {string}  unit        - Unit text (e.g. "%" or "°C").
 * @param {number}  warnAt      - Optional value to show a secondary warning tick.
 */
export default function GaugeRing({
  value,
  max = 100,
  size = 110,
  strokeWidth = 12,
  color = '#06b6d4',
  label,
  unit = '',
  warnAt,
}) {
  const cx         = size / 2;
  const cy         = size / 2;
  const r          = (size - strokeWidth * 2) / 2;
  const START      = 135;   // 7-8 o'clock
  const END        = 405;   // 4-5 o'clock (= 45°, 270° sweep total)
  const SWEEP      = END - START;

  const safeVal    = value ?? 0;
  const pct        = Math.min(Math.max(safeVal / max, 0), 0.9995);
  const fillEnd    = START + SWEEP * pct;

  const trackD = arcPath(cx, cy, r, START, END);
  const fillD  = pct > 0.001 ? arcPath(cx, cy, r, START, fillEnd) : '';

  // Warning tick
  let warnD = '';
  if (warnAt != null) {
    const warnPct = Math.min(Math.max(warnAt / max, 0), 1);
    const warnAng = START + SWEEP * warnPct;
    const outer   = polarToCartesian(cx, cy, r + strokeWidth * 0.6, warnAng);
    const inner   = polarToCartesian(cx, cy, r - strokeWidth * 0.6, warnAng);
    warnD = `M ${outer.x.toFixed(2)} ${outer.y.toFixed(2)} L ${inner.x.toFixed(2)} ${inner.y.toFixed(2)}`;
  }

  // Dynamic font sizes
  const valueFontSize = size * 0.19;
  const unitFontSize  = size * 0.11;
  const labelFontSize = size * 0.09;

  return (
    <View style={{ alignItems: 'center', width: size }}>
      {/* SVG ring */}
      <Svg width={size} height={size}>
        {/* Track (dim) */}
        {trackD ? (
          <Path
            d={trackD}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}

        {/* Glow layer (wider, more transparent) */}
        {fillD ? (
          <Path
            d={fillD}
            stroke={color}
            strokeWidth={strokeWidth + 4}
            fill="none"
            strokeLinecap="round"
            opacity={0.18}
          />
        ) : null}

        {/* Fill arc */}
        {fillD ? (
          <Path
            d={fillD}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}

        {/* Warning tick */}
        {warnD ? (
          <Path
            d={warnD}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeLinecap="round"
          />
        ) : null}
      </Svg>

      {/* Center overlay */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color, fontSize: valueFontSize, fontWeight: '800', lineHeight: valueFontSize * 1.1 }}>
          {value != null ? (typeof value === 'number' ? value.toFixed(1) : value) : '--'}
        </Text>
        <Text style={{ color: `${color}99`, fontSize: unitFontSize, fontWeight: '500' }}>
          {unit}
        </Text>
        {label ? (
          <Text style={{ color: '#475569', fontSize: labelFontSize, marginTop: 2, letterSpacing: 0.3 }}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
