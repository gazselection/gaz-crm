import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Nav } from './components/Nav';
import { Topbar } from './components/Topbar';
import { Toast } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Factures from './pages/Factures';
import SettingsPage from './pages/Settings';
import { useStore } from './store';

export default function App() {
  const load = useStore((s) => s.load);
  const loaded = useStore((s) => s.loaded);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    load().catch((e) => console.error('Loading failed:', e));
  }, [load]);

  return (
    <div className="app">
      <Nav open={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && <div className="nav-backdrop open" onClick={() => setNavOpen(false)} />}
      <div className="main">
        <Topbar onMenu={() => setNavOpen(true)} />
        {!loaded ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
            Chargement…
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/factures" element={<Factures />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        )}
      </div>
      <Toast />
    </div>
  );
}
