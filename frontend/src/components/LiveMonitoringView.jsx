import React from 'react';

export default function LiveMonitoringView({ telemetry }) {
  const t = telemetry || {};
  const isOnline = Boolean(t.timestamp);

  const rooms = [
    {
      id: 1,
      name: 'Room 1 · Rack A (Active Chamber)',
      device: t.deviceId || 'pie-node-01',
      status: isOnline ? 'ok' : 'offline',
      statusText: isOnline ? 'Online · Streaming' : 'Offline',
      metrics: {
        temp: t.temperature != null ? `${t.temperature}°C` : '—',
        humidity: t.humidity != null ? `${t.humidity}%` : '—',
        co2: t.co2 != null ? `${t.co2} ppm` : '—',
        moisture: t.moisture != null ? `${t.moisture}%` : '—',
      },
    },
    {
      id: 2,
      name: 'Room 2 · Rack B (Incubation Slot)',
      device: 'Standby Slot',
      status: 'offline',
      statusText: 'No edge node paired',
      metrics: {
        temp: '—',
        humidity: '—',
        co2: '—',
        moisture: '—',
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#2B2318' }}>
          Live Monitoring
        </h3>
        <p style={{ color: '#8A8270', fontSize: 13 }}>
          Physical chambers, environmental readings, and visual camera snapshots.
        </p>
      </div>

      {/* Room Grid */}
      <div className="room-grid">
        {rooms.map((r) => (
          <div key={r.id} className="room-card">
            <div className="room-header">
              <div>
                <div className="room-name">{r.name}</div>
                <div style={{ fontSize: 11, color: '#8A8270' }}>Device: {r.device}</div>
              </div>
              <span className={`badge badge-${r.status}`}>{r.statusText}</span>
            </div>

            <div className="room-metrics">
              <div className="room-metric">
                <div className="room-metric-label">Temperature</div>
                <div className="room-metric-value">{r.metrics.temp}</div>
              </div>
              <div className="room-metric">
                <div className="room-metric-label">Humidity</div>
                <div className="room-metric-value">{r.metrics.humidity}</div>
              </div>
              <div className="room-metric">
                <div className="room-metric-label">CO₂ Level</div>
                <div className="room-metric-value">{r.metrics.co2}</div>
              </div>
              <div className="room-metric">
                <div className="room-metric-label">Substrate Moisture</div>
                <div className="room-metric-value">{r.metrics.moisture}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Camera & Visual Inspection Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <div className="card-title">Chamber Visual Snapshot</div>
          <div className="card-sub">Latest visual inspection captured from chamber node</div>

          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              height: '240px',
              border: '1px solid #EAE3D3',
            }}
          >
            <img
              src="/assets/mushroom_hero.jpg"
              alt="Mushroom pinhead cluster"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                background: 'rgba(43, 35, 24, 0.85)',
                color: '#F4EEDF',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
              }}
            >
              Stage Tag: <b>First Pins</b> · Inspection Node 01
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Chamber Probe Drill-down</div>
          <div className="card-sub">Direct sensor metrics mapped to active rack probe</div>

          <table className="meta-table">
            <tbody>
              <tr>
                <td><b>Air Exchange (ACH Est.)</b></td>
                <td>4.1 ACH (Adequate circulation)</td>
              </tr>
              <tr>
                <td><b>Substrate FDR Sensor</b></td>
                <td>{t.moisture != null ? `${t.moisture}% moisture` : 'Waiting for sensor'}</td>
              </tr>
              <tr>
                <td><b>Ambient Photoperiod Sensor</b></td>
                <td>{t.light != null ? `${t.light} lux` : 'Waiting for sensor'}</td>
              </tr>
              <tr>
                <td><b>Inoculation Batch Tag</b></td>
                <td>Batch 01 · Oyster PoHu</td>
              </tr>
              <tr>
                <td><b>Edge Gateway Link</b></td>
                <td>115200 Baud /dev/ttyUSB0 (Moving Avg Window: 5)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
