import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, User, Menu, X, CheckCircle2, ChevronDown, Shield, Building2, ExternalLink, Cloud, CloudCheck, LogOut, Settings, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import { AppNotification, LandlordAccount } from '../../types/database.types';
import { useNavigate } from 'react-router-dom';
import { dbStore } from '../../lib/store';
import { googleDriveService, DriveSyncStatus } from '../../services/googleDriveService';
import { GoogleDriveModal } from '../drive/GoogleDriveModal';
import { authService } from '../../services/authService';
import { cn } from '../../lib/utils';

export interface TopbarProps {
  isSuperAdmin?: boolean;
  organizationName?: string;
  userName?: string;
  avatarUrl?: string;
  notifications?: AppNotification[];
  onOpenQuickActions?: () => void;
  onOpenMobileMenu: () => void;
  onMarkNotificationRead?: (id: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  isSuperAdmin = false,
  organizationName = 'Patil Real Estate',
  userName = 'Rajesh Patil',
  avatarUrl,
  notifications = [],
  onOpenQuickActions,
  onOpenMobileMenu,
  onMarkNotificationRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveStatus, setDriveStatus] = useState<DriveSyncStatus>(googleDriveService.getStatus());
  const navigate = useNavigate();

  useEffect(() => {
    return googleDriveService.subscribe((s) => {
      setDriveStatus(s);
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left Area: Mobile Toggle & Account Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isSuperAdmin ? (
          /* Super Admin Console Identifier */
          <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
            <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block leading-none">
                Platform Governance
              </span>
              <span className="text-xs font-black text-slate-900 block leading-tight mt-0.5">
                Super Admin Console
              </span>
            </div>
          </div>
        ) : (
          /* Landlord Workspace Identifier (Isolated to current account only) */
          <div className="flex items-center gap-2 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                Landlord Workspace
              </span>
              <span className="text-xs font-extrabold text-slate-900 block leading-tight mt-0.5 truncate max-w-[200px] sm:max-w-[260px]">
                {organizationName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {!isSuperAdmin && (
          <>
            {/* Google Drive BYOS Sync Button */}
            <button
              onClick={() => setShowDriveModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                driveStatus.isConnected
                  ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                  : 'border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700'
              }`}
              title={
                driveStatus.isConnected
                  ? `Connected to Google Drive (${driveStatus.userEmail || 'Active'}). Click to sync or manage.`
                  : 'Connect your personal Google Drive to sync rental data and files'
              }
            >
              {driveStatus.isConnected ? (
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {driveStatus.isConnected ? 'Drive: Synced' : 'Sync to Drive'}
              </span>
            </button>

            {/* Quick Action Button */}
            {onOpenQuickActions && (
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={onOpenQuickActions}
                className="hidden sm:inline-flex shadow-xs"
              >
                Quick Action
              </Button>
            )}

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
          </>
        )}

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 pl-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100" />
            ) : (
              <div className={cn(
                "w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs",
                isSuperAdmin ? "bg-indigo-600" : "bg-slate-800"
              )}>
                {userName.charAt(0)}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isSuperAdmin ? 'Super Administrator' : 'Landlord Account'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {isSuperAdmin ? 'Platform Governance' : organizationName}
                </p>
              </div>

              <div className="p-1.5 space-y-0.5">
                {isSuperAdmin ? (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/admin');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors text-left"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Super Admin Console</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowDriveModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                    >
                      <Cloud className="w-3.5 h-3.5 text-sky-600" />
                      <span>Google Drive Sync</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        navigate('/subscription');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>My Subscription Plan</span>
                    </button>
                  </>
                )}

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Synchronization Modal */}
      {!isSuperAdmin && (
        <GoogleDriveModal isOpen={showDriveModal} onClose={() => setShowDriveModal(false)} />
      )}
    </header>
  );
};
