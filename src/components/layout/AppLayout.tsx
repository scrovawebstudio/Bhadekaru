import React, { useState } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav, QuickActionsModal } from './MobileBottomNav';
import { NetworkStatus, PWAInstallBanner } from '../feedback/NetworkStatus';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/documentService';
import { subscriptionService } from '../../services/documentService';
import { dbStore } from '../../lib/store';
import { X, Crown, AlertTriangle, Shield } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const AppLayout: React.FC = () => {
  const session = authService.getCurrentSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: () => authService.getOrganization(),
  });

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getSubscription(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleSelectQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'record_payment':
        navigate('/payments?action=record');
        break;
      case 'add_tenant':
        navigate('/tenants?action=new');
        break;
      case 'add_property':
        navigate('/properties?action=new');
        break;
      case 'add_expense':
        navigate('/expenses?action=new');
        break;
      case 'add_maintenance':
        navigate('/maintenance?action=new');
        break;
      case 'add_reminder':
        navigate('/reminders?action=new');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <NetworkStatus />
      <PWAInstallBanner />

      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            isSuperAdmin={session.role === 'super_admin'}
            daysRemaining={subData?.daysRemaining ?? 7}
            activeUnitsCount={subData?.activeUnitsCount ?? 5}
            maxUnitsAllowed={subData?.maxUnitsAllowed ?? 50}
            onOpenUpgrade={() => setUpgradeModalOpen(true)}
          />
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-slate-900/60" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 bg-slate-900 h-full flex flex-col z-10 shadow-2xl">
              <div className="p-4 flex items-center justify-between border-b border-slate-800">
                <span className="font-extrabold text-white">
                  {session.role === 'super_admin' ? 'Super Admin Menu' : 'Bhadekaru Menu'}
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
                <Sidebar
                  isSuperAdmin={session.role === 'super_admin'}
                  daysRemaining={subData?.daysRemaining ?? 7}
                  activeUnitsCount={subData?.activeUnitsCount ?? 5}
                  maxUnitsAllowed={subData?.maxUnitsAllowed ?? 50}
                  onOpenUpgrade={() => setUpgradeModalOpen(true)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <Topbar
            isSuperAdmin={session.role === 'super_admin'}
            organizationName={organization?.name}
            userName={profile?.full_name}
            avatarUrl={profile?.avatar_url}
            notifications={notifications}
            onOpenQuickActions={session.role === 'super_admin' ? undefined : () => setQuickActionsOpen(true)}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onMarkNotificationRead={(id) => markReadMutation.mutate(id)}
          />

          {/* Landlord Suspension Notice */}
          {session.role === 'landlord' && (() => {
            const currentAcc = dbStore.getLandlordAccountById(dbStore.getState().currentOrgId);
            if (currentAcc?.is_suspended || currentAcc?.status === 'suspended') {
              return (
                <div className="bg-rose-600 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0" />
                    <span>
                      <strong className="font-extrabold">Account Access Suspended:</strong>{' '}
                      {currentAcc.suspension_reason || 'This landlord workspace has been suspended by platform administration. Please contact support@bhadekaru.app.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await authService.logout();
                        navigate('/login');
                      }}
                      className="bg-white text-rose-700 hover:bg-rose-50 border-white text-xs font-bold py-1 h-auto"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Landlord only) */}
      {session.role === 'landlord' && (
        <MobileBottomNav onOpenMoreMenu={() => setMobileMenuOpen(true)} />
      )}

      {/* Global Quick Actions Modal */}
      <QuickActionsModal
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onSelectAction={handleSelectQuickAction}
      />

      {/* Upgrade Plan Modal */}
      <Modal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Upgrade Bhadekaru Plan"
        subtitle="Scale your rental property portfolio effortlessly"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-center gap-3">
            <Crown className="w-6 h-6 text-sky-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-sky-900">7-Day Free Professional Trial Active</p>
              <p className="text-xs text-sky-700">You currently have full access to manage up to 50 units, download PDF receipts, track expenses, and automated reminders.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border-2 border-slate-200 hover:border-sky-500 transition-colors">
              <span className="text-xs font-bold text-slate-500 uppercase">Starter Plan</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">₹99 <span className="text-xs text-slate-500 font-normal">/ month</span></p>
              <p className="text-xs text-slate-600 mt-2">Up to 5 active units, agreements, document vault, maintenance tracking.</p>
              <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => { navigate('/subscription'); setUpgradeModalOpen(false); }}>
                Choose Starter
              </Button>
            </div>

            <div className="p-4 rounded-xl border-2 border-sky-500 bg-sky-50/30 relative">
              <span className="absolute -top-2.5 right-3 bg-sky-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">POPULAR</span>
              <span className="text-xs font-bold text-sky-900 uppercase">Growth Plan</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">₹249 <span className="text-xs text-slate-500 font-normal">/ month</span></p>
              <p className="text-xs text-slate-600 mt-2">Up to 20 units, advanced reports, PDF/CSV export, tenant notifications.</p>
              <Button size="sm" variant="primary" className="w-full mt-4" onClick={() => { navigate('/subscription'); setUpgradeModalOpen(false); }}>
                Choose Growth
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
