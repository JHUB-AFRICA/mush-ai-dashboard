import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

const VARIABLES = {
  temperature: { name: 'Temperature (°C)', color: '#B4552F', min: 20, max: 24, unit: '°C' },
  humidity: { name: 'Humidity (%)', color: '#6B8A55', min: 85, max: 95, unit: '%' },
  co2: { name: 'CO₂ (ppm)', color: '#C98A3B', min: 0, max: 800, unit: 'ppm' },
  light: { name: 'Light (lux)', color: '#8A8270', min: 200, max: 500, unit: 'lux' },
  moisture: { name: 'Substrate Moisture (%)', color: '#4A3B28', min: 55, max: 70, unit: '%' },
};

const RANGES = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
];

export default function GraphsView({ history = [], selectedRange, onSelectRange }) {
  const [activeVar, setActiveVar] = useState('temperature');

  const vConfig = VARIABLES[activeVar];

  const chartData = history.map((item) => {
    const d = new Date(item.timestamp || Date.now());
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: item[activeVar],
      raw: item,
    };
  });

  const exportCSV = () => {
    if (!history.length) return;
    const headers = ['Timestamp', 'Device ID', 'Temperature (°C)', 'Humidity (%)', 'CO2 (ppm)', 'Moisture (%)', 'Light (lux)'];
    const rows = history.map((r) => [
      r.timestamp,
      r.deviceId || 'pie-node-01',
      r.temperature,
      r.humidity,
      r.co2,
      r.moisture,
      r.light,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mush_ai_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#2B2318' }}>
            Historical Trends & Export
          </h3>
          <p style={{ color: '#8A8270', fontSize: 13 }}>
            Telemetry trajectory, target threshold bands, and manual CSV export (BRIDGE-AI compliance).
          </p>
        </div>

        <button className="btn btn-secondary" onClick={exportCSV}>
          📥 Export CSV
        </button>
      </div>

      {/* Control bar: Variables and Range */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Variable buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(VARIABLES).map(([key, cfg]) => (
              <button
                key={key}
                className={`btn btn-secondary ${activeVar === key ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  background: activeVar === key ? cfg.color : 'white',
                  color: activeVar === key ? 'white' : '#4A4433',
                  borderColor: activeVar === key ? cfg.color : '#EAE3D3',
                }}
                onClick={() => setActiveVar(key)}
              >
                {cfg.name}
              </button>
            ))}
          </div>

          {/* Range buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {RANGES.map((r) => (
              <button
                key={r.label}
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  background: selectedRange === r.hours ? '#2B2318' : 'white',
                  color: selectedRange === r.hours ? '#F4EEDF' : '#8A8270',
                  fontWeight: selectedRange === r.hours ? 600 : 400,
                }}
                onClick={() => onSelectRange(r.hours)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="card-title">{vConfig.name} Trajectory</div>
            <div className="card-sub">
              Target Growth Zone: <b>{vConfig.min} – {vConfig.max} {vConfig.unit}</b>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#8A8270' }}>
            Data points logged: <b>{chartData.length}</b>
          </div>
        </div>

        <div style={{ width: '100%', height: 380 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="#F1ECDF" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#8A8270" fontSize={11} tickLine={false} />
                <YAxis stroke="#8A8270" fontSize={11} unit={` ${vConfig.unit}`} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #EAE3D3',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#2B2318',
                  }}
                />
                <ReferenceLine
                  y={vConfig.min}
                  stroke="#9DBB80"
                  strokeDasharray="4 4"
                  label={{ value: `Min: ${vConfig.min}`, position: 'left', fill: '#6B8A55', fontSize: 11 }}
                />
                <ReferenceLine
                  y={vConfig.max}
                  stroke="#9DBB80"
                  strokeDasharray="4 4"
                  label={{ value: `Max: ${vConfig.max}`, position: 'left', fill: '#6B8A55', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={vConfig.name}
                  stroke={vConfig.color}
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: vConfig.color }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8A8270' }}>
              No telemetry captured in this timeframe yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
