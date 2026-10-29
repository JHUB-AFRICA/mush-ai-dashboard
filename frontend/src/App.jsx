import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/status`);
      const data = await res.json();
      if (data.success) setStatus(data);
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

  if (loading) return <div style={{ padding: 20 }}>Loading Mush-AI Dashboard...</div>;

  const t = status?.telemetry || {};
  const card = { background: '#f4f4f4', padding: 15, borderRadius: 8 };
  const big = { fontSize: '24px', fontWeight: 'bold' };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h2>🍄 Mush-AI Farm Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, margin: '20px 0' }}>
        <div style={card}><h4>CO2 Level</h4><p style={big}>{t.co2 ?? '--'} ppm</p></div>
        <div style={card}><h4>Temperature</h4><p style={big}>{t.temperature ?? '--'} °C</p></div>
        <div style={card}><h4>Humidity</h4><p style={big}>{t.humidity ?? '--'} %</p></div>
        <div style={card}><h4>Soil Moisture</h4><p style={big}>{t.moisture ?? '--'} %</p></div>
      </div>
    </div>
  );
}
