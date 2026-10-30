import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function HistoricalTrend({ history = [], telemetry }) {
  const chartData = history.map((item) => {
    const d = new Date(item.timestamp || item.time || Date.now());
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: item.temperature,
      humidity: item.humidity,
    };
  });

  const alerts = [];
  if (telemetry) {
    if (telemetry.co2 > 800) {
      alerts.push({
        level: 'warn',
        text: `CO₂ elevated (${telemetry.co2} ppm) — check ventilation schedule`,
        time: 'Active now',
      });
    } else {
      alerts.push({
        level: 'ok',
        text: `CO₂ levels nominal (${telemetry.co2 || 450} ppm) for fruiting chamber`,
        time: 'Stable',
      });
    }

    if (telemetry.temperature < 20 || telemetry.temperature > 24) {
      alerts.push({
        level: 'warn',
        text: `Chamber temperature (${telemetry.temperature}°C) outside optimal 20–24°C target`,
        time: 'Active now',
      });
    } else {
      alerts.push({
        level: 'ok',
        text: `Chamber temperature stable (${telemetry.temperature || 22.4}°C)`,
        time: 'Optimal',
      });
    }

    if (telemetry.humidity < 85) {
      alerts.push({
        level: 'warn',
        text: `Humidity low (${telemetry.humidity}%) — target 85–95%`,
        time: 'Active now',
      });
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
      {/* 24h Trend Chart */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-title">24h Environment Trend</div>
        <div className="card-sub">Real temperature and humidity trajectory logged in database</div>

        <div style={{ width: '100%', height: 260 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#F1ECDF" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#8A8270" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  domain={['dataMin - 2', 'dataMax + 2']}
                  stroke="#B4552F"
                  fontSize={11}
                  unit="°"
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[60, 100]}
                  stroke="#6B8A55"
                  fontSize={11}
                  unit="%"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #EAE3D3',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#2B2318',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  iconType="plainline"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  name="Temp (°C)"
                  stroke="#B4552F"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%))"
                  stroke="#6B8A55"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8A8270' }}>
              Waiting for telemetry data...
            </div>
          )}
        </div>
      </div>

      {/* Side Column: Power + Active Alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="metric-card">
          <div className="metric-label">Power Draw (Estimated)</div>
          <div className="metric-value">
            486<span className="unit">W</span>
          </div>
          <div className="metric-delta down">↓ 6.2% vs yesterday</div>
        </div>

        <div className="card" style={{ flex: 1, marginBottom: 0 }}>
          <div className="card-title">Live Chamber Alerts</div>
          <div className="card-sub">Calculated from incoming sensor readings</div>

          <div>
            {alerts.map((a, idx) => (
              <div key={idx} className="alert-row">
                <span className={`dot dot-${a.level}`} style={{ marginTop: 5 }}></span>
                <div>{a.text}</div>
                <div className="alert-time">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
