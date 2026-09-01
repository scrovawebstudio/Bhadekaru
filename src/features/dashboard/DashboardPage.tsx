import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowUpRight,
  ShieldAlert,
  CalendarDays,
  Receipt,
  Wrench,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { authService } from '../../services/authService';
import { rentService, paymentService } from '../../services/paymentService';
import { maintenanceService } from '../../services/maintenanceService';
import { agreementService } from '../../services/agreementService';
import { reminderService } from '../../services/documentService';
import { formatINR, formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
  });

  const { data: summary } = useQuery({
    queryKey: ['financialSummary'],
    queryFn: () => reportService.getFinancialSummary(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentService.getPayments(),
  });

  const { data: rentCharges = [] } = useQuery({
    queryKey: ['rentCharges'],
    queryFn: () => rentService.getRentCharges(),
  });

  const { data: agreements = [] } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementService.getAgreements(),
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceService.getMaintenanceRequests(),
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => reminderService.getReminders(),
  });

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate alerts
  const overdueCharges = rentCharges.filter((c) => c.status === 'overdue');
  const dueSoonCharges = rentCharges.filter((c) => c.status === 'due');
  const activeAgreements = agreements.filter((a) => a.is_active);
  const openMaintenance = maintenance.filter((m) => m.status !== 'completed' && m.status !== 'cancelled');
  const pendingReminders = reminders.filter((r) => !r.is_completed);

  const collectionPercent =
    summary && summary.expectedRent > 0
      ? Math.min(100, Math.round((summary.collectedRent / summary.expectedRent) * 100))
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Good morning, {profile?.full_name?.split(' ')[0] || 'Landlord'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            {currentDate}
          </p>
        </div>

        {/* Action shortcut bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Receipt className="w-4 h-4" />}
            onClick={() => navigate('/payments?action=record')}
          >
            Record Payment
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/tenants?action=new')}
          >
            Add Tenant
          </Button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {/* Expected Rent */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Expected Rent</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg md:text-xl font-extrabold text-slate-900">
            {formatINR(summary?.expectedRent || 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">For September 2026</span>
        </div>

        {/* Collected Rent */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
            <span>Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg md:text-xl font-extrabold text-emerald-800">
            {formatINR(summary?.collectedRent || 0)}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">{collectionPercent}% collected</span>
        </div>

        {/* Pending Rent */}
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold mb-1">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg md:text-xl font-extrabold text-amber-800">
            {formatINR(summary?.pendingRent || 0)}
          </p>
          <span className="text-[10px] text-amber-600 font-bold">Awaiting collection</span>
        </div>

        {/* Current Month Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-lg md:text-xl font-extrabold text-slate-900">
            {formatINR(summary?.currentMonthExpenses || 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Repairs & Society Pool</span>
        </div>

        {/* Net Income */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Net Income</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-lg md:text-xl font-extrabold text-sky-800">
            {formatINR(summary?.netIncome || 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Collected minus expenses</span>
        </div>

        {/* Total Properties */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Properties</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg md:text-xl font-extrabold text-slate-900">
            {summary?.totalProperties || 0}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Active buildings</span>
        </div>

        {/* Total Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Total Units</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg md:text-xl font-extrabold text-slate-900">
            {summary?.totalUnits || 0}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">{summary?.occupancyRate}% Occupancy</span>
        </div>

        {/* Occupied Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Occupied</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-lg md:text-xl font-extrabold text-emerald-700">
            {summary?.occupiedUnits || 0}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Generating rent</span>
        </div>

        {/* Vacant Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Vacant</span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <p className="text-lg md:text-xl font-extrabold text-slate-700">
            {summary?.vacantUnits || 0}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Ready to lease</span>
        </div>
      </div>

      {/* Critical Dashboard Alerts Section */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Attention & Immediate Action Items
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Overdue Alert */}
          {overdueCharges.length > 0 && (
            <div
              onClick={() => navigate('/payments?filter=overdue')}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 cursor-pointer hover:bg-rose-100/60 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-rose-900">
                  {formatINR(summary?.totalOverdueAmount)} Overdue Rent
                </p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  {overdueCharges.length} tenant with overdue payment from August.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400 shrink-0 self-center" />
            </div>
          )}

          {/* Due in next 3 days */}
          {dueSoonCharges.length > 0 && (
            <div
              onClick={() => navigate('/payments')}
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-amber-900">
                  {dueSoonCharges.length} Rent Due Now
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  September rent due for Flat A-102 (Priya Deshmukh).
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 self-center" />
            </div>
          )}

          {/* Expiring Agreements */}
          <div
            onClick={() => navigate('/agreements')}
            className="p-4 rounded-2xl bg-sky-50 border border-sky-200/80 cursor-pointer hover:bg-sky-100/60 transition-colors flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-sky-900">1 Agreement Expiring Soon</p>
              <p className="text-[11px] text-sky-700 mt-0.5">
                Priya Deshmukh (Flat A-102) expires in 14 days.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-sky-400 shrink-0 self-center" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Collection Progress & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Rent Collection Progress & Quick Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Collection Progress Card */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">September Rent Collection</h3>
                <p className="text-xs text-slate-500">Real-time status of current billing cycle</p>
              </div>
              <Badge variant="success">{collectionPercent}% Collected</Badge>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex mb-4">
              <div
                className="bg-emerald-500 transition-all duration-500 rounded-l-full"
                style={{ width: `${collectionPercent}%` }}
              />
              <div
                className="bg-amber-400 transition-all duration-500"
                style={{ width: `${Math.max(0, 100 - collectionPercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-center">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold">Total Expected</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{formatINR(summary?.expectedRent)}</p>
              </div>
              <div>
                <span className="text-[11px] text-emerald-600 font-semibold">Collected (Bank/UPI)</span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">{formatINR(summary?.collectedRent)}</p>
              </div>
              <div>
                <span className="text-[11px] text-amber-600 font-semibold">Pending Collection</span>
                <p className="text-sm font-bold text-amber-700 mt-0.5">{formatINR(summary?.pendingRent)}</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Quick Management Shortcuts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => navigate('/payments?action=record')}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 border border-slate-200/80 transition-all group text-center"
              >
                <CreditCard className="w-5 h-5 mb-1.5 text-sky-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Record Payment</span>
              </button>

              <button
                onClick={() => navigate('/tenants?action=new')}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 border border-slate-200/80 transition-all group text-center"
              >
                <Users className="w-5 h-5 mb-1.5 text-sky-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Add Tenant</span>
              </button>

              <button
                onClick={() => navigate('/expenses?action=new')}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 border border-slate-200/80 transition-all group text-center"
              >
                <TrendingDown className="w-5 h-5 mb-1.5 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Add Expense</span>
              </button>

              <button
                onClick={() => navigate('/maintenance?action=new')}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 border border-slate-200/80 transition-all group text-center"
              >
                <Wrench className="w-5 h-5 mb-1.5 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Maintenance</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Activity & Reminders */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
              <button
                onClick={() => navigate('/payments')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {payments.slice(0, 4).map((pay) => (
                <div key={pay.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{pay.tenant_name}</p>
                    <p className="text-[11px] text-slate-500">{pay.unit_number} • {formatDate(pay.payment_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-emerald-700">{formatINR(pay.amount)}</p>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{pay.payment_method}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Reminders */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Reminders</h3>
              <button
                onClick={() => navigate('/reminders')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700"
              >
                Manage
              </button>
            </div>
            <div className="space-y-2.5">
              {pendingReminders.slice(0, 3).map((rem) => (
                <div key={rem.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                  <p className="font-bold text-slate-800">{rem.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Due: {formatDate(rem.remind_date)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
