import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, CreditCard, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MobileBottomNavProps {
  onOpenMoreMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMoreMenu }) => {
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/properties', label: 'Properties', icon: Building2 },
    { to: '/tenants', label: 'Tenants', icon: Users },
    { to: '/payments', label: 'Rent', icon: CreditCard },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around z-40 shadow-lg safe-area-inset-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-all',
                isActive ? 'text-sky-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              )
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <button
        onClick={onOpenMoreMenu}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>More</span>
      </button>
    </div>
  );
};

export interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  const actions = [
    { id: 'record_payment', label: 'Record Rent Payment', icon: '₹', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'add_tenant', label: 'Add New Tenant', icon: '👤', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { id: 'add_property', label: 'Add New Property', icon: '🏢', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'add_expense', label: 'Record Property Expense', icon: '📉', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { id: 'add_maintenance', label: 'Log Maintenance Issue', icon: '🔧', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'add_reminder', label: 'Set Follow-up Reminder', icon: '⏰', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-slate-900">Quick Actions</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            Close
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={() => {
                onSelectAction(act.id);
                onClose();
              }}
              className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${act.color}`}
            >
              <span className="text-2xl mb-2">{act.icon}</span>
              <span className="text-xs font-extrabold">{act.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
