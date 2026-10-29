import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TelemetryCharts({ history }) {
  const boxStyle = {
    background: '#fff',
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid #eaeaea',
    marginBottom: '20px'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
      <div style={boxStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', color: '#2c3e50' }}>Temperature & Humidity Trends</h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="time" stroke="#95a5a6" />
              <YAxis stroke="#95a5a6" />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#e74c3c" strokeWidth={3} name="Temp (°C)" dot={false} />
              <Line type="monotone" dataKey="humidity" stroke="#3498db" strokeWidth={3} name="Humidity (%)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={boxStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', color: '#2c3e50' }}>CO2 Concentration Trend</h3>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="time" stroke="#95a5a6" />
              <YAxis stroke="#95a5a6" />
              <Tooltip />
              <Line type="monotone" dataKey="co2" stroke="#27ae60" strokeWidth={3} name="CO2 (ppm)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
