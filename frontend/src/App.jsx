import React, { useState, useEffect } from 'react';
import MetricCard from './components/MetricCard';
import TelemetryCharts from './components/TelemetryCharts';

const API_URL = 'https://ce9wvhakoaezqngxez6qx1b3.fra.prisma.build';

export default function App() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/status`);
      const data = await res.json();
      if (data.success && data.telemetry) {
        setStatus(data);
        
        const timestamp = new Date().toLocaleTimeString();
        setHistory(prev => {
          const newEntry = { time: timestamp, ...data.telemetry };
          const updated = [...prev, newEntry];
          if (updated.length > 20) updated.shift();
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading Mush-AI Dashboard...</div>;

  const t = status?.telemetry || {};

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 960, margin: '40px auto', padding: '0 20px', color: '#333' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eaeaea', paddingBottom: '15px', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>🍄 Mush-AI Farm Dashboard</h2>
        <span style={{ fontSize: '14px', background: '#e1f5fe', color: '#01579b', padding: '6px 12px', borderRadius: '20px', fontWeight: '600' }}>
          Device: {t.deviceId || 'Offline'}
        </span>
      </header>

      {/* Modular Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px', marginBottom: '35px' }}>
        <MetricCard title="CO2 Level" value={t.co2} unit="ppm" color="#27ae60" />
        <MetricCard title="Temperature" value={t.temperature} unit="°C" color="#e74c3c" />
        <MetricCard title="Humidity" value={t.humidity} unit="%" color="#3498db" />
        <MetricCard title="Soil Moisture" value={t.moisture} unit="%" color="#9b59b6" />
      </div>

      {/* Modular Charts Component */}
      <TelemetryCharts history={history} />
    </div>
  );
}
