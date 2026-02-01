import { useEffect, useState, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { syncToday } from './store/budgetSlice';
import { DashboardPage } from './pages/DashboardPage';
import { CheckPage } from './pages/CheckPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AdjustSpendPage } from './pages/AdjustSpendPage';
import { SettingsPage } from './pages/SettingsPage';
import { InsightsPage } from './pages/InsightsPage';
import { MonthlyOverviewPage } from './pages/MonthlyOverviewPage';
import { DebugPage } from './pages/DebugPage';
import { NavBar } from './components/NavBar';
import { Sidebar } from './components/Sidebar';

function App() {
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (sidebarOpen) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);
    // Swipe right from left edge (within 30px) to open
    if (touchStartX.current < 30 && deltaX > 80 && deltaY < 100) {
      setSidebarOpen(true);
    }
  };

  return (
    <div
      className="min-h-screen bg-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 flex items-center justify-start px-4 z-40 safe-area-top">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-gray-600 active:text-gray-900"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </header>
      <div className="pt-12">
        <Routes>
          <Route path="/" element={<CheckPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/adjust" element={<AdjustSpendPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/overview" element={<MonthlyOverviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/debug" element={<DebugPage />} />
        </Routes>
      </div>
      <NavBar />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}

export default App;
