import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Crown,
  Building2,
  Users,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Settings2,
  Lock,
  Unlock,
  Eye,
  Download,
  Plus,
  Zap,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { LandlordAccount, PlanTier, SubscriptionStatus } from '../../types/database.types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { formatINR } from '../../lib/utils';
import { useToast } from '../../components/feedback/Toast';
import { ManageSubscriptionModal } from './ManageSubscriptionModal';

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'landlords' | 'plans' | 'billing' | 'metrics'>('landlords');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedLandlord, setSelectedLandlord] = useState<LandlordAccount | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const currentSession = authService.getCurrentSession();

  const handleAdminLogout = async () => {
    await authService.logout();
    toast.info('Logged Out', 'Super Admin console session terminated.');
    navigate('/login');
  };

  // Queries
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => adminService.getPlatformMetrics(),
  });

  const { data: landlords = [], isLoading: isLandlordsLoading } = useQuery({
    queryKey: ['admin-landlords'],
    queryFn: () => adminService.getLandlordAccounts(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => adminService.getSubscriptionPlans(),
  });

  const { data: billingEvents = [] } = useQuery({
    queryKey: ['admin-billing-events'],
    queryFn: () => adminService.getBillingEvents(),
  });

  // Filtered Landlords
  const filteredLandlords = landlords.filter((l) => {
    const matchesSearch =
      l.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = selectedPlanFilter === 'all' || l.plan_tier === selectedPlanFilter;
    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'suspended' ? l.is_suspended : l.status === selectedStatusFilter);

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Actions
  const handleQuickExtendTrial = async (landlord: LandlordAccount, days: number = 7) => {
    try {
      await adminService.extendTrial(landlord.id, days);
      toast.success('Trial Extended', `Added ${days} days to ${landlord.organization_name}'s trial.`);
      queryClient.invalidateQueries({ queryKey: ['admin-landlords'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    } catch {
      toast.error('Error', 'Failed to extend trial.');
    }
  };

  const handleToggleSuspend = async (landlord: LandlordAccount) => {
    try {
      if (landlord.is_suspended) {
        await adminService.reactivateLandlord(landlord.id);
        toast.success('Account Reactivated', `${landlord.organization_name} has been unlocked.`);
      } else {
        await adminService.suspendLandlord(
          landlord.id,
          'Administrative hold: Account suspended by Super Admin.'
        );
        toast.warning('Account Suspended', `${landlord.organization_name} has been locked to read-only.`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-landlords'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    } catch {
      toast.error('Error', 'Failed to toggle account status.');
    }
  };

  const handleExportCSV = () => {
    const headers = 'Organization,Owner,Email,Phone,City,Plan,Status,Units,Max Units,MRR (INR),Trial End\n';
    const rows = landlords
      .map(
        (l) =>
          `"${l.organization_name}","${l.owner_name}","${l.owner_email}","${l.owner_phone}","${l.city}","${l.plan_tier}","${l.status}","${l.stats?.units_count || 0}","${l.max_units_allowed}","${l.mrr_inr}","${l.trial_end || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhadekaru_landlords_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export Ready', 'Downloaded landlord accounts CSV report.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 tracking-wider">
              <Shield className="w-3 h-3 text-sky-400" /> Super Admin Console
            </span>
            <span className="text-xs text-slate-400 font-medium">Platform-wide Multi-Tenant Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SaaS Landlords & Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Oversee all registered landlords, manage plan tiers (Free to Enterprise), configure unit quotas, grant trial extensions, and handle access suspensions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="hidden lg:flex flex-col text-right mr-1">
            <span className="text-[11px] font-black text-amber-300 flex items-center justify-end gap-1">
              <Crown className="w-3 h-3 text-amber-400" /> Super Admin
            </span>
            <span className="text-[10px] text-slate-400">
              {currentSession?.email || '8149862034'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="bg-slate-800/80 hover:bg-slate-800 text-white border-slate-700 font-bold"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              adminService.switchOrganization('org-2001');
              navigate('/dashboard');
            }}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-xs"
            leftIcon={<Building2 className="w-4 h-4" />}
          >
            Switch to Landlord View
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdminLogout}
            className="text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/60 font-bold"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Landlords</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{metrics?.total_landlords || 6}</h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span className="font-bold text-emerald-600">{metrics?.active_landlords || 4} active</span>
              <span>•</span>
              <span className="font-bold text-amber-600">{metrics?.trialing_landlords || 1} trialing</span>
              <span>•</span>
              <span className="font-bold text-rose-600">{metrics?.suspended_landlords || 1} locked</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Managed Portfolio</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{metrics?.total_units_managed || 121} Units</h3>
            <p className="text-xs text-slate-500 mt-1">
              Across <strong>{metrics?.total_properties || 17} properties</strong> ({metrics?.occupied_units_count || 110} occupied)
            </p>
          </div>
        </Card>

        <Card className="p-5 border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform MRR</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">
              {formatINR(metrics?.platform_mrr_inr || 3795)}
              <span className="text-xs font-semibold text-slate-400 ml-1">/ mo</span>
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ARR: {formatINR(metrics?.platform_arr_inr || 45540)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Growth & Conversion</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">+18.4% MoM</h3>
            <p className="text-xs text-slate-500 mt-1">
              Trial to paid rate: <strong className="text-slate-800">82%</strong>
            </p>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('landlords')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'landlords'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Landlord Accounts Directory ({landlords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'plans'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>SaaS Plan Matrix ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'billing'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Platform Billing Events</span>
        </button>
      </div>

      {/* TAB 1: Landlords Directory & Subscriptions */}
      {activeTab === 'landlords' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by organization, landlord name, phone, city or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">All Plans</option>
                <option value="free">Free Starter</option>
                <option value="starter">Landlord Starter</option>
                <option value="growth">Portfolio Growth</option>
                <option value="professional">Real Estate Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="suspended">Suspended / Locked</option>
                <option value="past_due">Past Due</option>
              </select>
            </div>
          </div>

          {/* Landlords Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Organization & Landlord</th>
                    <th className="py-3.5 px-4">Plan & Pricing</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Active Units Usage</th>
                    <th className="py-3.5 px-4">Billing / Trial End</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLandlords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No landlord accounts match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLandlords.map((landlord) => {
                      const unitsUsed = landlord.stats?.units_count || 0;
                      const maxUnits = landlord.custom_unit_limit || landlord.max_units_allowed || 20;
                      const usagePercent = Math.min(100, Math.round((unitsUsed / maxUnits) * 100));

                      return (
                        <tr
                          key={landlord.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            landlord.is_suspended ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          {/* Organization & Owner */}
                          <td className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                                {landlord.organization_name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 text-sm">
                                    {landlord.organization_name}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {landlord.city}, {landlord.state}
                                  </span>
                                </div>
                                <p className="text-slate-600 mt-0.5">
                                  {landlord.owner_name} •{' '}
                                  <span className="text-slate-400">{landlord.owner_email}</span> •{' '}
                                  <span className="text-slate-500 font-medium">{landlord.owner_phone}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="py-4 px-4">
                            <div>
                              <Badge
                                variant={
                                  landlord.plan_tier === 'enterprise'
                                    ? 'primary'
                                    : landlord.plan_tier === 'professional'
                                    ? 'success'
                                    : 'default'
                                }
                                className="font-extrabold"
                              >
                                {landlord.plan_name}
                              </Badge>
                              <p className="text-[11px] text-slate-500 font-bold mt-1">
                                {landlord.mrr_inr === 0 ? '₹0 (Free)' : `₹${landlord.mrr_inr}/mo`} • {landlord.billing_cycle}
                              </p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {landlord.is_suspended ? (
                              <div>
                                <Badge variant="danger" className="font-black flex items-center gap-1 w-fit">
                                  <Lock className="w-3 h-3" /> Suspended
                                </Badge>
                                {landlord.suspension_reason && (
                                  <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={landlord.suspension_reason}>
                                    {landlord.suspension_reason}
                                  </p>
                                )}
                              </div>
                            ) : landlord.status === 'active' ? (
                              <Badge variant="success" className="font-bold flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </Badge>
                            ) : landlord.status === 'trialing' ? (
                              <Badge variant="warning" className="font-bold flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" /> Pro Trial
                              </Badge>
                            ) : (
                              <Badge variant="danger" className="font-bold w-fit">
                                {landlord.status}
                              </Badge>
                            )}
                          </td>

                          {/* Units Usage */}
                          <td className="py-4 px-4 min-w-[160px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-slate-700">
                                  {unitsUsed} / {maxUnits} Units
                                </span>
                                <span
                                  className={
                                    usagePercent >= 100
                                      ? 'text-rose-600 font-black'
                                      : usagePercent >= 80
                                      ? 'text-amber-600'
                                      : 'text-slate-500'
                                  }
                                >
                                  {usagePercent}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    usagePercent >= 100
                                      ? 'bg-rose-500'
                                      : usagePercent >= 80
                                      ? 'bg-amber-500'
                                      : 'bg-sky-500'
                                  }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {landlord.stats?.properties_count || 0} Properties • {landlord.stats?.occupied_units_count || 0} Occupied
                              </span>
                            </div>
                          </td>

                          {/* Renewal / Trial Date */}
                          <td className="py-4 px-4 text-slate-600">
                            {landlord.status === 'trialing' ? (
                              <div>
                                <span className="font-bold text-amber-700">
                                  Trial Ends: {new Date(landlord.trial_end).toLocaleDateString()}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">7-Day Free Full Access</p>
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {landlord.current_period_end ? new Date(landlord.current_period_end).toLocaleDateString() : 'Active'}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">Auto-renew: {landlord.auto_renew ? 'On' : 'Off'}</p>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Manage Plan Button */}
                              <button
                                onClick={() => {
                                  setSelectedLandlord(landlord);
                                  setIsManageModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                title="Edit Subscription Tier & Unit Quotas"
                              >
                                <Settings2 className="w-3.5 h-3.5" />
                                <span>Manage</span>
                              </button>

                              {/* 1-Click +7d Trial */}
                              {landlord.status === 'trialing' && (
                                <button
                                  onClick={() => handleQuickExtendTrial(landlord, 7)}
                                  className="px-2 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition-all"
                                  title="Add +7 days trial extension"
                                >
                                  +7d
                                </button>
                              )}

                              {/* Lock / Unlock Toggle */}
                              <button
                                onClick={() => handleToggleSuspend(landlord)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  landlord.is_suspended
                                    ? 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                                title={landlord.is_suspended ? 'Reactivate & Unlock Account' : 'Suspend & Lock Account'}
                              >
                                {landlord.is_suspended ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SaaS Plan Matrix */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-sky-950">Active SaaS Subscription Tiers</h4>
                <p className="text-[11px] text-sky-700">All prices in Indian Rupees (INR) with monthly and annual discount options.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {plans.map((p) => {
              const activeCount = landlords.filter((l) => l.plan_tier === p.tier).length;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900">{p.name}</h4>
                      <Badge variant="primary" className="text-[10px]">
                        {activeCount} Landlords
                      </Badge>
                    </div>

                    <div className="pt-1">
                      <span className="text-2xl font-black text-slate-900">
                        {p.monthly_price_inr === 0 ? 'Free' : `₹${p.monthly_price_inr}`}
                      </span>
                      {p.monthly_price_inr > 0 && <span className="text-xs text-slate-400">/mo</span>}
                      <p className="text-[11px] text-sky-600 font-bold mt-0.5">
                        Max {p.max_active_units} Units Quota
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                      {p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Annual: ₹{p.annual_price_inr}/yr
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Platform Billing Events */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Recent SaaS Subscription Transactions</h3>
                <p className="text-xs text-slate-500">Automated recurring mandate collections & subscription invoices</p>
              </div>
              <span className="text-xs font-bold text-slate-500">Live Gateway Feed</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {billingEvents.map((evt) => (
                <div key={evt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      evt.status === 'succeeded' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {evt.status === 'succeeded' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{evt.organization_name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-medium text-slate-600">{evt.plan_name}</span>
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        Invoice: <strong>{evt.invoice_number}</strong> • Ref: <span className="font-mono text-[10px] text-slate-400">{evt.transaction_ref}</span> • Paid by {evt.owner_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">{formatINR(evt.amount_inr)}</span>
                      <p className="text-[10px] text-slate-400">{new Date(evt.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={evt.status === 'succeeded' ? 'success' : 'danger'} className="capitalize font-bold">
                      {evt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Management Modal */}
      {selectedLandlord && (
        <ManageSubscriptionModal
          isOpen={isManageModalOpen}
          onClose={() => {
            setIsManageModalOpen(false);
            setSelectedLandlord(null);
          }}
          landlord={selectedLandlord}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-landlords'] });
            queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
          }}
        />
      )}
    </div>
  );
};
