import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Wrench,
  FileText,
  TrendingDown,
  FolderOpen,
  BellRing,
  Calendar,
  BarChart3,
  Crown,
  Settings,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SidebarProps {
  daysRemaining?: number;
  activeUnitsCount?: number;
  maxUnitsAllowed?: number;
  onOpenUpgrade?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  daysRemaining = 7,
  activeUnitsCount = 5,
  maxUnitsAllowed = 50,
  onOpenUpgrade,
}) => {
  const mainNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/properties', label: 'Properties & Units', icon: Building2 },
    { to: '/tenants', label: 'Tenants', icon: Users },
    { to: '/payments', label: 'Rent & Payments', icon: CreditCard },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  ];

  const secondaryNavItems = [
    { to: '/agreements', label: 'Agreements', icon: FileText },
    { to: '/deposits', label: 'Security Deposits', icon: Sparkles },
    { to: '/expenses', label: 'Expenses', icon: TrendingDown },
    { to: '/documents', label: 'Documents', icon: FolderOpen },
    { to: '/reminders', label: 'Reminders', icon: BellRing },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/subscription', label: 'Subscription', icon: Crown },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-800 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center font-black text-xl text-white shadow-md">
          भा
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
            Bhadekaru
            <span className="text-[10px] font-bold uppercase bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.2 rounded-md">
              SaaS
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Rental Management</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Sections */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Management
          </p>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Business Tools */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Business Tools
          </p>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-sky-950 text-sky-400 border border-sky-800/80 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-slate-300" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Trial / Subscription Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-sky-400 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> 7-Day Pro Trial
            </span>
            <span className="text-[11px] text-amber-400 font-bold">{daysRemaining}d left</span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            Active Units: <strong className="text-slate-100">{activeUnitsCount}/{maxUnitsAllowed}</strong>
          </p>
          <button
            onClick={onOpenUpgrade}
            className="w-full py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
          >
            <span>Upgrade Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
