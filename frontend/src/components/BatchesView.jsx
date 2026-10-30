import React, { useState } from 'react';

export default function BatchesView({ batches = [], onLogYield, onCreateBatch }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);

  // Form states
  const [flushNumber, setFlushNumber] = useState(1);
  const [freshWeight, setFreshWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New batch form
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [batchCode, setBatchCode] = useState('B2026-01');
  const [strain, setStrain] = useState('Oyster PoHu');
  const [dryWeight, setDryWeight] = useState(12.0);

  // Fallback active batch if database has none yet
  const defaultBatch = {
    id: 'default',
    code: 'B2026-01',
    strain: 'Oyster PoHu',
    substrateComposition: '70% wheat straw, 30% sawdust',
    substrateDryWeightKg: 12.0,
    substrateMoisturePct: 62.0,
    inoculationDate: new Date().toISOString().split('T')[0],
    currentStage: 'Pinning',
    yields: [],
  };

  const currentBatch = batches.length > 0 ? batches[selectedBatchIndex] || batches[0] : defaultBatch;
  const yields = currentBatch.yields || [];

  const totalYield = yields.reduce((sum, y) => sum + Number(y.freshWeightKg || 0), 0);
  const bePct =
    currentBatch.substrateDryWeightKg > 0
      ? (totalYield / currentBatch.substrateDryWeightKg) * 100
      : 0;

  const handleYieldSubmit = async (e) => {
    e.preventDefault();
    if (!freshWeight || isNaN(Number(freshWeight))) return;

    setIsSubmitting(true);
    try {
      await onLogYield({
        batchId: currentBatch.id,
        flushNumber: Number(flushNumber),
        freshWeightKg: Number(freshWeight),
      });
      setFreshWeight('');
      setFlushNumber((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBatchSubmit = async (e) => {
    e.preventDefault();
    try {
      await onCreateBatch({
        code: batchCode,
        strain,
        substrateDryWeightKg: Number(dryWeight),
      });
      setShowNewBatch(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#2B2318' }}>
            Batch Cultivation & Phenology
          </h3>
          <p style={{ color: '#8A8270', fontSize: 13 }}>
            Batch specifications, biological efficiency (BE%), and harvest records.
          </p>
        </div>

        <button className="btn" onClick={() => setShowNewBatch(!showNewBatch)}>
          {showNewBatch ? 'Close' : '+ Start New Batch'}
        </button>
      </div>

      {showNewBatch && (
        <div className="card" style={{ background: '#FAF7F0', borderColor: '#C98A3B', marginBottom: 24 }}>
          <div className="card-title">Register New Mushroom Batch</div>
          <form onSubmit={handleCreateBatchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#8A8270' }}>Batch Code</label>
              <input className="form-input" value={batchCode} onChange={(e) => setBatchCode(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#8A8270' }}>Strain Code</label>
              <input className="form-input" value={strain} onChange={(e) => setStrain(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#8A8270' }}>Substrate Dry Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={dryWeight} onChange={(e) => setDryWeight(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn" type="submit" style={{ width: '100%' }}>Create Batch</button>
            </div>
          </form>
        </div>
      )}

      {/* Batch Sub-Navigation */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['overview', 'yield', 'records'].map((tab) => (
          <button
            key={tab}
            className={`btn-secondary btn ${activeTab === tab ? 'active' : ''}`}
            style={{
              background: activeTab === tab ? '#2B2318' : 'white',
              color: activeTab === tab ? '#F4EEDF' : '#4A4433',
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && 'Overview & Phenology'}
            {tab === 'yield' && 'Yield & Biological Efficiency'}
            {tab === 'records' && 'Anomaly & Event Records'}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          <div className="card">
            <div className="card-title">Batch Setup: {currentBatch.code}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 14 }}>
              <div className="metric-card">
                <div className="metric-label">Substrate Dry Weight</div>
                <div className="metric-value">{currentBatch.substrateDryWeightKg} <span className="unit">kg</span></div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Moisture at Filling</div>
                <div className="metric-value">{currentBatch.substrateMoisturePct || 62}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Cultivation Strain</div>
                <div className="metric-value" style={{ fontSize: 20 }}>{currentBatch.strain}</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#4A4433', marginTop: 18, lineHeight: 1.8 }}>
              <b>Substrate:</b> {currentBatch.substrateComposition || '70% wheat straw, 30% sawdust'}<br />
              <b>Inoculated:</b> {new Date(currentBatch.inoculationDate).toLocaleDateString()} · <b>Room:</b> Room 1 · Rack A
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: YIELD & BE% */}
      {activeTab === 'yield' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 20 }}>
            <div className="metric-card">
              <div className="metric-label">Total Fresh Yield</div>
              <div className="metric-value">{totalYield.toFixed(1)} <span className="unit">kg</span></div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Flushes Harvested</div>
              <div className="metric-value">{yields.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Biological Efficiency (BE%)</div>
              <div className="metric-value" style={{ color: '#6B8A55' }}>
                {bePct.toFixed(1)}<span className="unit">%</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-title">Harvest Flush Logs</div>
              <div className="card-sub">Recorded flushes for {currentBatch.code}</div>

              {yields.length > 0 ? (
                <table className="meta-table">
                  <thead>
                    <tr>
                      <th>Flush</th>
                      <th>Harvest Date</th>
                      <th>Fresh Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yields.map((y, idx) => (
                      <tr key={idx}>
                        <td>Flush {y.flushNumber || idx + 1}</td>
                        <td>{new Date(y.harvestDate).toLocaleDateString()}</td>
                        <td><b>{y.freshWeightKg} kg</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '20px 0', color: '#8A8270', fontSize: 13 }}>
                  No flushes harvested yet for this batch. Record your first harvest below.
                </div>
              )}

              <div style={{ color: '#8A8270', fontSize: 12, marginTop: 16 }}>
                BE% is calculated dynamically: (Total Fresh Yield ÷ Substrate Dry Weight) × 100
              </div>
            </div>

            {/* Log Harvest Flush Form */}
            <div className="card">
              <div className="card-title">Log Flush Harvest</div>
              <div className="card-sub">Captures actual weight from chamber</div>

              <form onSubmit={handleYieldSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#8A8270' }}>Flush Number</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={flushNumber}
                    onChange={(e) => setFlushNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#8A8270' }}>Fresh Weight (kg)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.05"
                    placeholder="e.g. 3.4"
                    value={freshWeight}
                    onChange={(e) => setFreshWeight(e.target.value)}
                    required
                  />
                </div>
                <button className="btn" type="submit" disabled={isSubmitting} style={{ marginTop: 8 }}>
                  {isSubmitting ? 'Recording...' : 'Save Harvest Record'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECORDS */}
      {activeTab === 'records' && (
        <div className="card">
          <div className="card-title">Chamber Anomaly & Contamination Log</div>
          <div className="card-sub">Field events for {currentBatch.code}</div>

          <div className="alert-row">
            <span className="dot dot-ok" style={{ marginTop: 5 }}></span>
            <div>
              <b>Trichoderma Inspection Clean</b>
              <div style={{ fontSize: 12, color: '#8A8270' }}>No green mold or fungal contaminants detected during flush 1 inspection.</div>
            </div>
            <div className="alert-time">Yesterday</div>
          </div>

          <div className="alert-row">
            <span className="dot dot-warn" style={{ marginTop: 5 }}></span>
            <div>
              <b>Power Supply Fluctuation</b>
              <div style={{ fontSize: 12, color: '#8A8270' }}>Edge node rebooted gracefully after minor line voltage dip (12m downtime).</div>
            </div>
            <div className="alert-time">3 days ago</div>
          </div>
        </div>
      )}
    </div>
  );
}
