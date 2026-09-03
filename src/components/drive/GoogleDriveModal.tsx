import React, { useState, useEffect } from 'react';
import { googleDriveService, DriveSyncStatus, DriveFileItem } from '../../services/googleDriveService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../feedback/Toast';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  FolderSync,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  LogOut,
  UploadCloud
} from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<DriveSyncStatus>(googleDriveService.getStatus());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = googleDriveService.subscribe((s) => {
      setStatus(s);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOpen && status.isConnected) {
      loadDriveFiles();
    }
  }, [isOpen, status.isConnected]);

  const loadDriveFiles = async () => {
    setLoadingFiles(true);
    try {
      const files = await googleDriveService.listDriveFiles();
      setDriveFiles(files);
    } catch (e: any) {
      console.warn('Could not load drive files', e);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await googleDriveService.connect();
      toast.success('Connected to Google Drive', 'Your personal Google Drive folder has been initialized.');
      loadDriveFiles();
    } catch (err: any) {
      toast.error('Connection Failed', err?.message || 'Could not authenticate with Google');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const result = await googleDriveService.syncToDrive();
      toast.success(
        'Synced to Google Drive',
        `Backed up ${result.counts?.properties || 0} properties, ${result.counts?.units || 0} units, and ${result.counts?.tenants || 0} tenants to your Drive.`
      );
      loadDriveFiles();
    } catch (err: any) {
      toast.error('Sync Failed', err?.message || 'Could not sync data to Google Drive');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (
      !window.confirm(
        'Restore portfolio data from your Google Drive backup? This will update your local workspace with the data saved in your Drive.'
      )
    ) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await googleDriveService.restoreFromDrive();
      toast.success(
        'Restored from Google Drive',
        `Successfully restored ${res.stats?.propertiesCount || 0} properties and ${res.stats?.tenantsCount || 0} tenants.`
      );
      window.location.reload();
    } catch (err: any) {
      toast.error('Restore Failed', err?.message || 'Could not restore backup from Google Drive');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect your Google Drive? Your files in Drive will remain intact.')) {
      googleDriveService.disconnect();
      toast.info('Google Drive Disconnected', 'You can reconnect anytime.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Drive Cloud Sync & Storage"
      subtitle="Private Bring-Your-Own-Storage (BYOS) data sync for landlords"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Architecture Info Callout */}
        <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50/50 rounded-2xl border border-sky-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sky-950">Zero-Server-Cost & 100% Private Data Architecture</p>
            <p className="text-sky-800 leading-relaxed">
              Your rental properties, tenant KYC files, lease documents, and payment receipts are stored directly in your personal Google Drive folder.
              The SaaS platform manages your login and subscription tier without storing your tenant files.
            </p>
          </div>
        </div>

        {/* Connection Status Card */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {status.isConnected ? <CloudCheck className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {status.isConnected ? 'Google Drive Connected' : 'Google Drive Disconnected'}
                  </h4>
                  <Badge variant={status.isConnected ? 'success' : 'neutral'}>
                    {status.isConnected ? 'Connected' : 'Not Linked'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {status.isConnected && status.userEmail
                    ? `Account: ${status.userEmail}`
                    : 'Connect your personal or business Google Drive'}
                </p>
              </div>
            </div>

            <div>
              {status.isConnected ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDisconnect}
                    leftIcon={<LogOut className="w-3.5 h-3.5" />}
                    className="text-slate-600 text-xs"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleConnect}
                  isLoading={isConnecting}
                  leftIcon={<Cloud className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Connect Google Drive
                </Button>
              )}
            </div>
          </div>

          {/* Sync Stats & Folder Links */}
          {status.isConnected && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium block">Google Drive Folder</span>
                <span className="font-bold text-slate-900 block mt-0.5">📁 Bhadekaru - Rental Manager Data</span>
                {status.folderLink && (
                  <a
                    href={status.folderLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1 mt-1 text-[11px]"
                  >
                    <span>Open in Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium block">Last Portfolio Sync</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {status.lastSyncedAt
                    ? new Date(status.lastSyncedAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Not synced yet'}
                </span>
                <span className="text-emerald-600 text-[11px] font-semibold block mt-1">
                  ✓ Snapshot ready
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sync Controls */}
        {status.isConnected ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                className="flex-1 font-bold"
                onClick={handleSyncNow}
                isLoading={isSyncing}
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                Sync Portfolio to Google Drive Now
              </Button>
              <Button
                variant="outline"
                className="flex-1 font-bold"
                onClick={handleRestore}
                isLoading={isRestoring}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Restore Portfolio from Drive
              </Button>
            </div>

            {/* Files in Google Drive Folder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Files in your Google Drive Folder
                </h5>
                <button
                  onClick={loadDriveFiles}
                  className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingFiles ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                {loadingFiles ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading files from Google Drive...</div>
                ) : driveFiles.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No files yet. Click <strong>Sync Portfolio to Google Drive Now</strong> to create your first backup.
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <div key={file.id} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {file.modifiedTime
                              ? new Date(file.modifiedTime).toLocaleDateString()
                              : 'Recent'}
                          </p>
                        </div>
                      </div>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 hover:text-sky-700 font-bold p-1 rounded hover:bg-sky-50 flex items-center gap-1 shrink-0"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
            <Cloud className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Connecting your Google Drive allows Bhadekaru to store your tenant lease agreements, ID proofs, and rent rolls in your own private cloud storage.
            </p>
            <Button
              variant="primary"
              onClick={handleConnect}
              isLoading={isConnecting}
              leftIcon={<Cloud className="w-4 h-4" />}
            >
              Sign In with Google to Connect Drive
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
