import { AppProvider, useAppContext } from './contexts/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ui/ToastContainer';
import { DashboardTab } from './components/tabs/DashboardTab';
import { RegisterTab } from './components/tabs/RegisterTab';
import { ListTab } from './components/tabs/ListTab';
import { CategoryTab } from './components/tabs/CategoryTab';
import { useSettings } from './hooks/useSettings';

function TabContent() {
  const { state } = useAppContext();
  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-[600px] w-full mx-auto">
      {state.activeTab === 'dashboard' && <DashboardTab />}
      {state.activeTab === 'register' && <RegisterTab />}
      {state.activeTab === 'list' && <ListTab />}
      {state.activeTab === 'categories' && <CategoryTab />}
    </main>
  );
}

function AppShell() {
  useSettings();
  return (
    <div className="min-h-svh flex flex-col bg-gray-50">
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
