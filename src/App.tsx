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
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { LoginPage, RegisterPage } from './features/auth/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Auth & Onboarding Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />

            {/* Authenticated Application Shell */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/tenants/:tenantId" element={<TenantProfilePage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/agreements" element={<AgreementsPage />} />
              <Route path="/deposits" element={<DepositsPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
