import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from '@clerk/clerk-react';
import { useAppDispatch } from './store/hooks';
import { syncToday } from './store/budgetSlice';
import { DashboardPage } from './pages/DashboardPage';
import { CheckPage } from './pages/CheckPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AdjustSpendPage } from './pages/AdjustSpendPage';
import { SettingsPage } from './pages/SettingsPage';
import { InsightsPage } from './pages/InsightsPage';
import { MonthlyOverviewPage } from './pages/MonthlyOverviewPage';
import { ImportPage } from './pages/ImportPage';
import { DebugPage } from './pages/DebugPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { NavBar } from './components/NavBar';
import { Sidebar } from './components/Sidebar';

function App() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const isAuthPage = location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up');

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
      className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {!isAuthPage && (
        <header className="fixed top-0 left-0 right-0 h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 z-40 safe-area-top">
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
          <div className="flex items-center">
            <SignedOut>
              <Link
                to="/sign-in"
                className="px-4 py-2 text-sm font-medium text-gray-700 active:text-gray-900"
              >
                Sign In
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>
      )}
      <SignedIn>
        <div className={isAuthPage ? '' : 'pt-12'}>
          <Routes>
            <Route path="/" element={<CheckPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/adjust" element={<AdjustSpendPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/overview" element={<MonthlyOverviewPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
          </Routes>
        </div>
        <NavBar />
      </SignedIn>
      <SignedOut>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedOut>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}

export default App;
