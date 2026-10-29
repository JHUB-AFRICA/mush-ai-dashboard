import React from 'react';

export default function MetricCard({ title, value, unit, color = '#2c3e50' }) {
  const cardStyle = {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    borderLeft: `5px solid ${color}`
  };
  
  const valueStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '5px 0 0 0',
    color: '#2c3e50'
  };

  return (
    <div style={cardStyle}>
      <h4 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', textTransform: 'uppercase' }}>{title}</h4>
      <p style={valueStyle}>
        {value ?? '--'} <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#95a5a6' }}>{unit}</span>
      </p>
    </div>
  );
}
