import React, { useState } from 'react';
import { useCloudSync } from '../../hooks/useCloudSync';
import { CloudSyncModal } from './CloudSyncModal';
import { RefreshCw, Check, AlertCircle, CloudOff } from 'lucide-react';

interface CloudSyncStatusButtonProps {
  className?: string;
}

export const CloudSyncStatusButton: React.FC<CloudSyncStatusButtonProps> = ({ className = '' }) => {
  const { status, lastSyncedAt } = useCloudSync();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        id="cloud-sync-status-btn"
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          status === 'synced'
            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-700 hover:bg-emerald-100/70'
            : status === 'syncing'
            ? 'bg-sky-50/70 border-sky-200/80 text-sky-700 hover:bg-sky-100/70'
            : status === 'offline'
            ? 'bg-amber-50/70 border-amber-200/80 text-amber-700 hover:bg-amber-100/70'
            : 'bg-rose-50/70 border-rose-200/80 text-rose-700 hover:bg-rose-100/70'
        } ${className}`}
        title={`Cloud Sync Status: ${status}. Click to view details and force sync.`}
      >
        {status === 'synced' ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
        ) : status === 'syncing' ? (
          <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin shrink-0" />
        ) : status === 'offline' ? (
          <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        )}

        <span className="hidden md:inline font-medium">
          {status === 'synced'
            ? 'Cloud Synced'
            : status === 'syncing'
            ? 'Syncing...'
            : status === 'offline'
            ? 'Offline'
            : 'Sync Error'}
        </span>
      </button>

      <CloudSyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
