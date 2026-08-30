import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/Toast';

import { LandingPage } from './views/LandingPage';
import { LoginPage } from './views/LoginPage';
import { DashboardView } from './views/DashboardView';
import { NewJournalView } from './views/NewJournalView';
import { JournalWorkspaceView } from './views/JournalWorkspaceView';
import { HistoryView } from './views/HistoryView';
import { FavoritesView } from './views/FavoritesView';
import { SearchView } from './views/SearchView';
import { GoalsView } from './views/GoalsView';
import { JourneyView } from './views/JourneyView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';

function AppContent() {
  const { user, loading } = useAuth();
  
  // Router state
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');
  const [routeState, setRouteState] = useState<any>(null);

  // Global toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigate = (path: string, state?: any) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setRouteState(state || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Redirect to dashboard if logged in and visiting '/' or '/login'
  useEffect(() => {
    if (!loading && user && (currentPath === '/' || currentPath === '/login')) {
      navigate('/dashboard');
    }
  }, [user, loading, currentPath]);

  // Route matching
  const renderRoute = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-600 text-sm font-medium">Connecting to your journal workspace...</p>
        </div>
      );
    }

    if (currentPath === '/') {
      return <LandingPage navigate={navigate} />;
    }

    if (currentPath === '/login') {
      return <LoginPage navigate={navigate} />;
    }

    // Protected routes: redirect to login if unauthenticated
    if (!user) {
      return <LoginPage navigate={navigate} />;
    }

    if (currentPath === '/dashboard') {
      return <DashboardView navigate={navigate} onShowToast={showToast} />;
    }

    if (currentPath === '/journal/new') {
      return <NewJournalView navigate={navigate} onShowToast={showToast} />;
    }

    if (currentPath.startsWith('/journal/')) {
      const id = currentPath.split('/')[2];
      return <JournalWorkspaceView journalId={id} navigate={navigate} onShowToast={showToast} />;
    }

    if (currentPath === '/history') {
      return <HistoryView navigate={navigate} onShowToast={showToast} />;
    }

    if (currentPath === '/favorites') {
      return <FavoritesView navigate={navigate} onShowToast={showToast} />;
    }

    if (currentPath === '/search') {
      return <SearchView navigate={navigate} onShowToast={showToast} />;
    }

    if (currentPath === '/goals') {
      return <GoalsView initialDraft={routeState?.newGoalDraft} navigate={navigate} onShowToast={showToast} />;
    }

    if (currentPath === '/journey') {
      return <JourneyView navigate={navigate} onShowToast={showToast} />;
    }

    if (currentPath === '/insights') {
      return <InsightsView navigate={navigate} onShowToast={showToast} />;
    }

    if (currentPath === '/settings') {
      return <SettingsView navigate={navigate} onShowToast={showToast} />;
    }

    return <DashboardView navigate={navigate} onShowToast={showToast} />;
  };

  const isPublicLanding = currentPath === '/' && !user;
  const isLoginPage = currentPath === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans">
      {!isLoginPage && <Navbar currentPath={currentPath} navigate={navigate} />}

      <div className="flex-1 flex">
        {user && !isPublicLanding && !isLoginPage && (
          <Sidebar currentPath={currentPath} navigate={navigate} />
        )}

        <main className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden">
          {renderRoute()}
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
