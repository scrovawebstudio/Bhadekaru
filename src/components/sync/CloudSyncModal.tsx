import React, { useState } from 'react';
import { useCloudSync } from '../../hooks/useCloudSync';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RefreshCw, Cloud, Smartphone, Globe, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft, Server } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    status,
    lastSyncedAt,
    serverVersion,
    lastModifiedByPlatform,
    error,
    deviceInfo,
    serverUrl,
    syncNow,
    forcePush,
    setServerUrl,
  } = useCloudSync();

  const [customUrl, setCustomUrl] = useState(serverUrl);
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleManualSync = async () => {
    const success = await syncNow();
    if (success) {
      setFeedbackMsg('Successfully synchronized with Cloud Server!');
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleForcePush = async () => {
    const success = await forcePush();
    if (success) {
      setFeedbackMsg('Local portfolio pushed to Cloud successfully!');
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleSaveUrl = async () => {
    setIsUpdatingUrl(true);
    await setServerUrl(customUrl);
    setIsUpdatingUrl(false);
    setFeedbackMsg('Cloud server endpoint updated.');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mobile & Web Cloud Synchronization"
      description="Keep your portfolio, tenants, rent payments, and documents synced in real-time across your phone, tablet, and web browser."
      size="md"
    >
      <div className="space-y-4">
        {/* Sync Status Banner */}
        <div className={`p-4 rounded-2xl border ${
          status === 'synced'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : status === 'syncing'
            ? 'bg-sky-50/70 border-sky-200 text-sky-900'
            : status === 'offline'
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                status === 'synced'
                  ? 'bg-emerald-600 text-white'
                  : status === 'syncing'
                  ? 'bg-sky-600 text-white'
                  : status === 'offline'
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {status === 'synced' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : status === 'syncing' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold capitalize">
                  {status === 'synced'
                    ? 'Fully Synchronized'
                    : status === 'syncing'
                    ? 'Syncing in Progress...'
                    : status === 'offline'
                    ? 'Working Offline (Cached)'
                    : 'Sync Error'}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  {lastSyncedAt
                    ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    : 'Awaiting first synchronization'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white/60 font-bold">
              v{serverVersion}
            </span>
          </div>

          {error && (
            <p className="mt-2 text-xs text-rose-700 bg-rose-100/60 p-2 rounded-lg font-medium">
              {error}
            </p>
          )}

          {feedbackMsg && (
            <p className="mt-2 text-xs text-emerald-800 bg-emerald-100/60 p-2 rounded-lg font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {feedbackMsg}
            </p>
          )}
        </div>

        {/* Current Platform & Environment */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              {deviceInfo.isNative ? <Smartphone className="w-3.5 h-3.5 text-sky-600" /> : <Globe className="w-3.5 h-3.5 text-indigo-600" />}
              <span className="font-semibold">Current Device</span>
            </div>
            <p className="text-xs font-bold text-slate-900 capitalize">
              {deviceInfo.isNative ? `Capacitor (${deviceInfo.platform})` : 'Web Browser'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">Last Modified By</span>
            </div>
            <p className="text-xs font-bold text-slate-900 capitalize">
              {lastModifiedByPlatform}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Button
              className="flex-1"
              variant="primary"
              onClick={handleManualSync}
              isLoading={status === 'syncing'}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Sync Now
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={handleForcePush}
              disabled={status === 'syncing'}
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              Push Changes
            </Button>
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Automatic background sync runs whenever you add or edit properties, units, tenants, or rent receipts.
          </p>
        </div>

        {/* Mobile Server URL Config (Useful for standalone Android/iOS APK builds) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              Cloud Server Address
            </label>
            <span className="text-[10px] text-slate-400">For Installed Mobile App</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="e.g. https://your-bhadekaru-domain.com"
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveUrl}
              isLoading={isUpdatingUrl}
            >
              Save
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Leave empty to use the auto-detected server host.
          </p>
        </div>
      </div>
    </Modal>
  );
};
