import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/feedback/Toast';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardPage } from './features/dashboard/DashboardPage';
import { PropertiesPage } from './features/properties/PropertiesPage';
import { PropertyDetailPage } from './features/properties/PropertyDetailPage';
import { TenantsPage } from './features/tenants/TenantsPage';
import { TenantProfilePage } from './features/tenants/TenantProfilePage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import { AgreementsPage } from './features/agreements/AgreementsPage';
import { DepositsPage } from './features/deposits/DepositsPage';
import { MaintenancePage } from './features/maintenance/MaintenancePage';
import { ExpensesPage } from './features/expenses/ExpensesPage';
import { DocumentsPage } from './features/documents/DocumentsPage';
import { RemindersPage } from './features/reminders/RemindersPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SubscriptionPage } from './features/subscriptions/SubscriptionPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { LoginPage, RegisterPage } from './features/auth/LoginPage';
import { authService } from './services/authService';
import { dbStore } from './lib/store';
import { capacitorService } from './services/capacitorService';
import { cloudSyncService } from './services/cloudSyncService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  },
});

const RootRedirect: React.FC = () => {
  const session = authService.getCurrentSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return session.role === 'super_admin' ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = authService.getCurrentSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const LandlordOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = authService.getCurrentSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

const ProtectedLayout: React.FC = () => {
  const session = authService.getCurrentSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
};

export default function App() {
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    // Restore persistent session from native Android storage / localStorage
    authService.initPersistentSession().finally(() => {
      setIsInitializing(false);
    });

    // Initialize Capacitor native platform handlers
    capacitorService.initNativeFeatures(() => {
      cloudSyncService.checkAndPull();
    });

    // Initialize real-time cloud synchronization between Web and Mobile
    cloudSyncService.init();

    const unsubscribe = dbStore.subscribe(() => {
      queryClient.invalidateQueries();
    });
    return unsubscribe;
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white selection:bg-sky-500">
        <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-sky-500/30 animate-pulse">
          भा
        </div>
        <p className="mt-4 text-xs font-bold text-slate-300 tracking-wider">भाडेकरू • Bhadekaru</p>
        <p className="text-[11px] text-slate-500 mt-1">Connecting secure workspace session...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Root Route - Directs unauthenticated users to /login immediately */}
            <Route path="/" element={<RootRedirect />} />

            {/* Standalone Auth & Onboarding Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />

            {/* Strictly Authenticated Application Shell */}
            <Route element={<ProtectedLayout />}>
              {/* Super Admin Only Route */}
              <Route
                path="/admin"
                element={
                  <AdminOnlyRoute>
                    <AdminDashboardPage />
                  </AdminOnlyRoute>
                }
              />

              {/* Landlord Only Routes */}
              <Route path="/dashboard" element={<LandlordOnlyRoute><DashboardPage /></LandlordOnlyRoute>} />
              <Route path="/properties" element={<LandlordOnlyRoute><PropertiesPage /></LandlordOnlyRoute>} />
              <Route path="/properties/:propertyId" element={<LandlordOnlyRoute><PropertyDetailPage /></LandlordOnlyRoute>} />
              <Route path="/tenants" element={<LandlordOnlyRoute><TenantsPage /></LandlordOnlyRoute>} />
              <Route path="/tenants/:tenantId" element={<LandlordOnlyRoute><TenantProfilePage /></LandlordOnlyRoute>} />
              <Route path="/payments" element={<LandlordOnlyRoute><PaymentsPage /></LandlordOnlyRoute>} />
              <Route path="/agreements" element={<LandlordOnlyRoute><AgreementsPage /></LandlordOnlyRoute>} />
              <Route path="/deposits" element={<LandlordOnlyRoute><DepositsPage /></LandlordOnlyRoute>} />
              <Route path="/maintenance" element={<LandlordOnlyRoute><MaintenancePage /></LandlordOnlyRoute>} />
              <Route path="/expenses" element={<LandlordOnlyRoute><ExpensesPage /></LandlordOnlyRoute>} />
              <Route path="/documents" element={<LandlordOnlyRoute><DocumentsPage /></LandlordOnlyRoute>} />
              <Route path="/reminders" element={<LandlordOnlyRoute><RemindersPage /></LandlordOnlyRoute>} />
              <Route path="/calendar" element={<LandlordOnlyRoute><CalendarPage /></LandlordOnlyRoute>} />
              <Route path="/reports" element={<LandlordOnlyRoute><ReportsPage /></LandlordOnlyRoute>} />
              <Route path="/subscription" element={<LandlordOnlyRoute><SubscriptionPage /></LandlordOnlyRoute>} />
              <Route path="/settings" element={<LandlordOnlyRoute><SettingsPage /></LandlordOnlyRoute>} />
            </Route>

            {/* Fallback route - Redirects to /login if unauthenticated, else to role dashboard */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
