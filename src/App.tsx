import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { syncToday } from './store/budgetSlice';
import { DashboardPage } from './pages/DashboardPage';
import { CheckPage } from './pages/CheckPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AdjustSpendPage } from './pages/AdjustSpendPage';
import { SettingsPage } from './pages/SettingsPage';
import { InsightsPage } from './pages/InsightsPage';
import { NavBar } from './components/NavBar';
import { Sidebar } from './components/Sidebar';

function App() {
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const syncTime = () => {
      const today = new Date().toISOString().split('T')[0];
      dispatch(syncToday(today));
    };

    syncTime();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/" element={<CheckPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/adjust" element={<AdjustSpendPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <NavBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}

export default App;
