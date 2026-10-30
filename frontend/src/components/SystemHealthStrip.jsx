import React from 'react';

export default function SystemHealthStrip({ telemetry, health }) {
  const isLive = Boolean(health?.isLive);
  const ageSeconds = health?.ageSeconds;

  const formatLastSync = () => {
    if (ageSeconds == null) return 'No data logged';
    if (ageSeconds < 10) return 'Just now (live)';
    if (ageSeconds < 60) return `${ageSeconds}s ago`;
    if (ageSeconds < 3600) return `${Math.floor(ageSeconds / 60)}m ago`;
    return `${Math.floor(ageSeconds / 3600)}h ago`;
  };

  return (
    <div className="health-strip">
      <div className="health-item">
        <span className={`dot ${isLive ? 'dot-ok' : 'dot-offline'}`}></span>
        Sensors <b>{isLive ? '5/5 active' : '0/5 offline'}</b>
      </div>

      <div className="health-item">
        <span className={`dot ${isLive ? 'dot-ok' : 'dot-offline'}`}></span>
        RPi Edge (PIE) <b>{isLive ? 'Connected' : 'Offline'}</b>
      </div>

      <div className="health-item">
        <span className={`dot ${isLive ? 'dot-ok' : 'dot-offline'}`}></span>
        Arduino USB Serial <b>{isLive ? 'Streaming' : 'Waiting'}</b>
      </div>

      <div className="health-item" style={{ marginLeft: 'auto' }}>
        Last heartbeat <b>{formatLastSync()}</b>
      </div>
    </div>
  );
}
