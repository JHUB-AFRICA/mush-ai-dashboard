import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/status`);
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleValve = async () => {
    const newState = !status?.actuator?.valveState;
    try {
      const res = await fetch(`${API_URL}/api/actuator`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valveState: newState })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(prev => ({
          ...prev,
          actuator: data.data
        }));
      }
    } catch (err) {
      console.error('Failed to update valve:', err);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading Mush-AI Dashboard...</div>;

  const t = status?.telemetry || {};

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h2>🍄 Mush-AI Farm Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, margin: '20px 0' }}>
        <div style={{ background: '#f4f4f4', padding: 15, borderRadius: 8 }}>
          <h4>CO2 Level</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{t.co2 ?? '--'} ppm</p>
        </div>
        <div style={{ background: '#f4f4f4', padding: 15, borderRadius: 8 }}>
          <h4>Temperature</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{t.temperature ?? '--'} °C</p>
        </div>
        <div style={{ background: '#f4f4f4', padding: 15, borderRadius: 8 }}>
          <h4>Humidity</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{t.humidity ?? '--'} %</p>
        </div>
        <div style={{ background: '#f4f4f4', padding: 15, borderRadius: 8 }}>
          <h4>Soil Moisture</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{t.moisture ?? '--'} %</p>
        </div>
      </div>

      <div style={{ background: '#eef2ff', padding: 20, borderRadius: 8, textAlign: 'center' }}>
        <h3>Actuator Control (Valve)</h3>
        <p>Current Status: <strong>{status?.actuator?.valveState ? 'OPEN 🟢' : 'CLOSED 🔴'}</strong></p>
        <button 
          onClick={toggleValve}
          style={{ padding: '10px 20px', background: status?.actuator?.valveState ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}
        >
          {status?.actuator?.valveState ? 'Close Valve' : 'Open Valve'}
        </button>
      </div>
    </div>
  );
}

