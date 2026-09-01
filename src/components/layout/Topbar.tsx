import React, { useState } from 'react';
import { Search, Bell, Plus, User, Menu, X, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { AppNotification } from '../../types/database.types';
import { useNavigate } from 'react-router-dom';

export interface TopbarProps {
  organizationName?: string;
  userName?: string;
  avatarUrl?: string;
  notifications?: AppNotification[];
  onOpenQuickActions: () => void;
  onOpenMobileMenu: () => void;
  onMarkNotificationRead?: (id: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  organizationName = 'Patil Real Estate',
  userName = 'Rajesh Patil',
  avatarUrl,
  notifications = [],
  onOpenQuickActions,
  onOpenMobileMenu,
  onMarkNotificationRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left Area: Mobile Toggle & Search / Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Portfolio:</span>
          <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
            {organizationName}
          </span>
        </div>
      </div>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Action Button */}
        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onOpenQuickActions}
          className="hidden sm:inline-flex shadow-xs"
        >
          Quick Action
        </Button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Notifications</span>
                <span className="text-xs font-medium text-slate-500">{unreadCount} unread</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        onMarkNotificationRead?.(notif.id);
                        if (notif.link_url) {
                          navigate(notif.link_url);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                        !notif.is_read ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 pl-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
              {userName.charAt(0)}
            </div>
          )}
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{userName}</p>
            <p className="text-[10px] text-slate-500 leading-tight">Landlord Account</p>
          </div>
        </div>
      </div>
    </header>
  );
};
