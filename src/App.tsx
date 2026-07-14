import { lazy, Suspense } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ui/ToastContainer';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { useSettings } from './hooks/useSettings';

const DashboardTab = lazy(() => import('./components/tabs/DashboardTab').then(m => ({ default: m.DashboardTab })));
const RegisterTab  = lazy(() => import('./components/tabs/RegisterTab').then(m => ({ default: m.RegisterTab })));
const ListTab      = lazy(() => import('./components/tabs/ListTab').then(m => ({ default: m.ListTab })));
const CategoryTab  = lazy(() => import('./components/tabs/CategoryTab').then(m => ({ default: m.CategoryTab })));

function TabContent() {
  const { state } = useAppContext();
  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-[600px] w-full mx-auto">
      <Suspense fallback={<div className="flex justify-center py-12"><LoadingSpinner /></div>}>
        {state.activeTab === 'dashboard' && <DashboardTab />}
        {state.activeTab === 'register' && <RegisterTab />}
        {state.activeTab === 'list' && <ListTab />}
        {state.activeTab === 'categories' && <CategoryTab />}
      </Suspense>
    </main>
  );
}

function AppShell() {
  useSettings();
  return (
    <div className="min-h-svh flex flex-col bg-primary-50">
      <Header />
      <TabContent />
      <BottomNav />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
