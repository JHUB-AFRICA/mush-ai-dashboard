import React, { useState } from 'react';

const SENSOR_CATALOG = [
  { nodeId: 'TMP-01', type: 'Temperature', model: 'DHT22 / SHT31', location: 'Room 1 · Rack A', calDate: '2026-06-02', interval: '5s', conn: 'USB Serial' },
  { nodeId: 'HUM-01', type: 'Humidity', model: 'DHT22 / Capacitive', location: 'Room 1 · Rack A', calDate: '2026-06-02', interval: '5s', conn: 'USB Serial' },
  { nodeId: 'CO2-01', type: 'CO₂ Gas (NDIR)', model: 'MH-Z19B / MQ-135', location: 'Room 1 · Rack A', calDate: '2026-05-28', interval: '5s', conn: 'USB Serial' },
  { nodeId: 'LUX-01', type: 'Ambient Photoperiod', model: 'BH1750 / LDR', location: 'Room 1 · Rack A', calDate: '2026-06-02', interval: '5s', conn: 'USB Serial' },
  { nodeId: 'MOI-01', type: 'Substrate Moisture', model: 'Capacitive FDR Probe', location: 'Room 1 · Rack A, Bag 4', calDate: '2026-05-28', interval: '5s', conn: 'Analog FDR' },
];

export default function SettingsView() {
  const [thresholds, setThresholds] = useState({
    temperature: { min: 20.0, max: 24.0, unit: '°C' },
    humidity: { min: 85.0, max: 95.0, unit: '%' },
    co2: { min: 0, max: 800, unit: 'ppm' },
    light: { min: 200, max: 500, unit: 'lux' },
    moisture: { min: 55, max: 70, unit: '%' },
  });

  const [savedMessage, setSavedMessage] = useState(false);

  const handleBoundChange = (key, field, val) => {
    setThresholds((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: Number(val) },
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('mush_ai_thresholds', JSON.stringify(thresholds));
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#2B2318' }}>
          Farm Settings & Hardware
        </h3>
        <p style={{ color: '#8A8270', fontSize: 13 }}>
          Configure environment alert bounds and review connected chamber probe metadata.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Alert Thresholds */}
        <div className="card">
          <div className="card-title">Chamber Alert Thresholds</div>
          <div className="card-sub">Readings beyond these bounds trigger warnings on the dashboard</div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(thresholds).map(([key, item]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#4A4433', textTransform: 'capitalize', width: 140 }}>
                  {key} ({item.unit})
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="form-input"
                    type="number"
                    step="0.5"
                    value={item.min}
                    style={{ width: 80 }}
                    onChange={(e) => handleBoundChange(key, 'min', e.target.value)}
                  />
                  <span style={{ color: '#8A8270' }}>to</span>
                  <input
                    className="form-input"
                    type="number"
                    step="0.5"
                    value={item.max}
                    style={{ width: 80 }}
                    onChange={(e) => handleBoundChange(key, 'max', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <button className="btn" type="submit" style={{ marginTop: 10, alignSelf: 'flex-start' }}>
              Save Thresholds
            </button>
            {savedMessage && (
              <span style={{ fontSize: 12, color: '#6B8A55', fontWeight: 600 }}>
                ✓ Thresholds updated successfully.
              </span>
            )}
          </form>
        </div>

        {/* System & Architecture Info */}
        <div className="card">
          <div className="card-title">Ecosystem Topology</div>
          <div className="card-sub">Infrastructure links across hardware & cloud</div>

          <table className="meta-table">
            <tbody>
              <tr>
                <td><b>Microcontroller</b></td>
                <td>Arduino (C++ on PlatformIO)</td>
              </tr>
              <tr>
                <td><b>Edge Processor</b></td>
                <td>Raspberry Pi (Python 3 Edge Daemon)</td>
              </tr>
              <tr>
                <td><b>Telemetry Buffer</b></td>
                <td>Moving Average Noise Filter (Window: 5)</td>
              </tr>
              <tr>
                <td><b>Cloud Runtime</b></td>
                <td>Prisma Compute (Bun HTTP Server + React SPA)</td>
              </tr>
              <tr>
                <td><b>Database</b></td>
                <td>PostgreSQL (Prisma ORM Managed)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensor Metadata Registry */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">Sensor Hardware Registry</div>
        <div className="card-sub">
          Active chamber sensor directory matching the physical probes installed in Room 1 · Rack A
        </div>

        <table className="meta-table">
          <thead>
            <tr>
              <th>Node ID</th>
              <th>Sensor Type</th>
              <th>Hardware Model</th>
              <th>Physical Location</th>
              <th>Calibrated</th>
              <th>Sampling</th>
              <th>Bus / Link</th>
            </tr>
          </thead>
          <tbody>
            {SENSOR_CATALOG.map((s) => (
              <tr key={s.nodeId}>
                <td><b>{s.nodeId}</b></td>
                <td>{s.type}</td>
                <td>{s.model}</td>
                <td>{s.location}</td>
                <td>{s.calDate}</td>
                <td>{s.interval}</td>
                <td><span className="badge badge-ok">{s.conn}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
