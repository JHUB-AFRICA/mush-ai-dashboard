import React, { useState, useEffect } from 'react';
import './theme.css';
import HeroBanner from './components/HeroBanner';
import SystemHealthStrip from './components/SystemHealthStrip';
import GrowCycleStepper from './components/GrowCycleStepper';
import HistoricalTrend from './components/HistoricalTrend';
import LiveMonitoringView from './components/LiveMonitoringView';
import BatchesView from './components/BatchesView';
import GraphsView from './components/GraphsView';
import SettingsView from './components/SettingsView';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ce9wvhakoaezqngxez6qx1b3.fra.prisma.build';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [history, setHistory] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedRange, setSelectedRange] = useState(24);
  const [loading, setLoading] = useState(true);

  // 1. Fetch latest real-time status
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      const data = await res.json();
      if (data.success && data.telemetry) {
        setStatus(data.telemetry);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Could not connect to live backend status:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch historical sensor readings
  const fetchHistory = async (hours = selectedRange) => {
    try {
      const res = await fetch(`${API_BASE}/api/telemetry/history?hours=${hours}&limit=300`);
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch (err) {
      console.warn('Could not fetch historical telemetry:', err);
    }
  };

  // 3. Fetch batches
  const fetchBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/batches`);
      const data = await res.json();
      if (data.success && Array.isArray(data.batches)) {
        setBatches(data.batches);
      }
    } catch (err) {
      console.warn('Could not fetch batches:', err);
    }
  };

  // Handlers for logging yields and batches
  const handleLogYield = async (payload) => {
    const res = await fetch(`${API_BASE}/api/yields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      fetchBatches();
    }
  };

  const handleCreateBatch = async (payload) => {
    const res = await fetch(`${API_BASE}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      fetchBatches();
    }
  };

  const handleSelectRange = (hours) => {
    setSelectedRange(hours);
    fetchHistory(hours);
  };

  useEffect(() => {
    fetchStatus();
    fetchHistory(24);
    fetchBatches();

    // 5-second polling interval for live hardware telemetry
    const interval = setInterval(() => {
      fetchStatus();
      fetchHistory(selectedRange);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedRange]);

  const activeBatch = batches.length > 0 ? batches[0] : null;

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">🍄</span>
          <div>
            <div className="brand-title">Smart Mushroom Farm</div>
            <div className="brand-subtitle">JHUB Africa · JKUAT Smart Farm Zone</div>
          </div>
        </div>

        <nav className="nav-tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'monitoring', label: 'Live Monitoring' },
            { id: 'batches', label: 'Batches' },
            { id: 'graphs', label: 'Graphs & Export' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Views */}
      <main>
        {activeTab === 'overview' && (
          <>
            <HeroBanner telemetry={status} farmerName="Caroline" />
            <SystemHealthStrip telemetry={status} lastSyncTime={lastSyncTime} />
            <GrowCycleStepper activeBatch={activeBatch} />
            <HistoricalTrend history={history} telemetry={status} />
          </>
        )}

        {activeTab === 'monitoring' && (
          <LiveMonitoringView telemetry={status} />
        )}

        {activeTab === 'batches' && (
          <BatchesView
            batches={batches}
            onLogYield={handleLogYield}
            onCreateBatch={handleCreateBatch}
          />
        )}

        {activeTab === 'graphs' && (
          <GraphsView
            history={history}
            selectedRange={selectedRange}
            onSelectRange={handleSelectRange}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>
    </div>
  );
}
