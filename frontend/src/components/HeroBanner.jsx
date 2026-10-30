import React from 'react';

const TARGETS = {
  temperature: { min: 20.0, max: 24.0, unit: '°C', label: 'Avg. Temperature' },
  humidity: { min: 85.0, max: 95.0, unit: '%', label: 'Avg. Humidity' },
  co2: { min: 0, max: 800, unit: 'ppm', label: 'Avg. CO₂' },
  light: { min: 200, max: 500, unit: 'lux', label: 'Avg. Light' },
};

function getChipStatus(varKey, val) {
  if (val === null || val === undefined) return 'offline';
  const target = TARGETS[varKey];
  if (!target) return 'ok';
  return val >= target.min && val <= target.max ? 'ok' : 'warn';
}

export default function HeroBanner({ telemetry, farmerName = 'Caroline' }) {
  const t = telemetry || {};
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const chips = [
    { key: 'temperature', val: t.temperature, label: 'Avg. Temperature', unit: '°C', range: '20–24°C' },
    { key: 'humidity', val: t.humidity, label: 'Avg. Humidity', unit: '%', range: '85–95%' },
    { key: 'co2', val: t.co2, label: 'Avg. CO₂', unit: 'ppm', range: '<800ppm' },
    { key: 'light', val: t.light, label: 'Avg. Light', unit: 'lux', range: '200–500lux' },
  ];

  const isOnline = t.timestamp != null;

  return (
    <div className="hero">
      <div>
        <div className="hero-eyebrow">JHUB Africa · Smart Mushroom Farm</div>
        <div className="hero-greeting">Welcome back, {farmerName}</div>
        <div className="hero-sub">
          {today} · {isOnline ? '1 edge node streaming telemetry' : 'Waiting for edge connection'}
        </div>
      </div>

      <div className="chip-row">
        {chips.map((c) => {
          const status = getChipStatus(c.key, c.val);
          const displayVal = c.val !== undefined && c.val !== null ? c.val : '—';
          return (
            <div key={c.key} className="chip">
              <div className="chip-label">
                <span className={`dot dot-${status}`}></span>
                {c.label}
              </div>
              <div className="chip-value">
                {displayVal}
                <span className="unit">{c.unit}</span>
              </div>
              <div className="chip-range">{c.range}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
