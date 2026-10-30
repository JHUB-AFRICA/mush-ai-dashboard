import React from 'react';

export default function SystemHealthStrip({ telemetry, lastSyncTime }) {
  const isOnline = Boolean(telemetry && telemetry.timestamp);

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const diff = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <div className="health-strip">
      <div className="health-item">
        <span className={`dot ${isOnline ? 'dot-ok' : 'dot-offline'}`}></span>
        Sensors <b>{isOnline ? '5/5' : '0/5'}</b> active
      </div>

      <div className="health-item">
        <span className={`dot ${isOnline ? 'dot-ok' : 'dot-offline'}`}></span>
        RPi Edge (PIE) <b>{isOnline ? 'Connected' : 'Offline'}</b>
      </div>

      <div className="health-item">
        <span className={`dot ${isOnline ? 'dot-ok' : 'dot-offline'}`}></span>
        Arduino USB Serial <b>{isOnline ? 'Streaming' : 'Waiting'}</b>
      </div>

      <div className="health-item" style={{ marginLeft: 'auto' }}>
        Last sync <b>{formatLastSync()}</b>
      </div>
    </div>
  );
}
