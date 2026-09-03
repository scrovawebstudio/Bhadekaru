import React, { useState, useEffect } from 'react';
import {
  googleDriveService,
  DriveSyncStatus,
  DriveFileItem,
  getCustomClientId,
  setCustomClientId,
  getEffectiveClientId,
  DEFAULT_GOOGLE_CLIENT_ID,
} from '../../services/googleDriveService';
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
  UploadCloud,
  Copy,
  Check,
  HelpCircle,
  Key,
  Code,
  Download,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
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
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState(getCustomClientId());
  const [savedClientIdMsg, setSavedClientIdMsg] = useState(false);
  const toast = useToast();

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  useEffect(() => {
    const unsubscribe = googleDriveService.subscribe((s) => {
      setStatus(s);
      if (s.error) {
        // Automatically open the troubleshooting guide if an origin or oauth error occurs
        setShowConfigGuide(true);
      }
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
      const msg = err?.message || 'Could not authenticate with Google';
      toast.error('Connection Failed', msg);
      setShowConfigGuide(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggleSandbox = () => {
    if (status.isSandbox) {
      googleDriveService.enableSandboxMode(false);
      toast.info('Sandbox Deactivated', 'Local sandbox test mode turned off.');
    } else {
      googleDriveService.enableSandboxMode(true);
      toast.success('Sandbox Activated', 'Local dev sandbox active. You can test backup and restore immediately.');
      loadDriveFiles();
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
      setTimeout(() => {
        window.location.reload();
      }, 800);
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

  const copyOriginToClipboard = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    toast.success('Origin Copied', `"${currentOrigin}" copied to clipboard.`);
    setTimeout(() => setCopiedOrigin(false), 2500);
  };

  const handleSaveCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomClientId(customClientIdInput);
    setSavedClientIdMsg(true);
    toast.success('Client ID Saved', 'Custom Google OAuth Client ID updated.');
    setTimeout(() => setSavedClientIdMsg(false), 3000);
  };

  const handleResetClientId = () => {
    setCustomClientId('');
    setCustomClientIdInput('');
    toast.info('Reset Client ID', 'Restored default application client ID.');
  };

  const handleDownloadOfflineJson = () => {
    googleDriveService.exportBackupJsonFile();
    toast.success('Backup Exported', 'Portfolio backup downloaded as a JSON file.');
  };

  const handleUploadOfflineJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await googleDriveService.importBackupJsonFile(file);
      toast.success(
        'Portfolio Restored',
        `Imported ${res.stats.propertiesCount} properties and ${res.stats.tenantsCount} tenants from backup file.`
      );
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error('Import Failed', err?.message || 'Invalid backup JSON file');
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

        {/* Error Alert with Context */}
        {status.error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-bold text-rose-950">Google Sign-in Error Detected</p>
              <p className="text-rose-800 leading-relaxed font-mono bg-white/70 p-2 rounded-lg border border-rose-100 break-words">
                {status.error}
              </p>
              <p className="text-rose-900 font-medium">
                👉 <strong>Do I have to host this app?</strong> No! See the Google Cloud Console guide below to register <code className="bg-rose-100 px-1 py-0.5 rounded font-mono font-bold">{currentOrigin}</code> in 1 minute.
              </p>
            </div>
          </div>
        )}

        {/* Connection Status Card */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  status.isConnected
                    ? status.isSandbox
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {status.isConnected ? <CloudCheck className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {status.isConnected
                      ? status.isSandbox
                        ? 'Local Sandbox Drive (Dev Mode)'
                        : 'Google Drive Connected'
                      : 'Google Drive Disconnected'}
                  </h4>
                  <Badge
                    variant={status.isConnected ? (status.isSandbox ? 'warning' : 'success') : 'neutral'}
                    className="text-[10px]"
                  >
                    {status.isConnected ? (status.isSandbox ? 'Sandbox Active' : 'Connected') : 'Not Linked'}
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
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleConnect}
                    isLoading={isConnecting}
                    leftIcon={<Cloud className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    Sign In with Google
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sync Stats & Folder Links */}
          {status.isConnected && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium block">Target Folder</span>
                <span className="font-bold text-slate-900 block mt-0.5 truncate">
                  📁 Bhadekaru - Rental Manager Data
                </span>
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
          <div className="p-5 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-4">
            <Cloud className="w-9 h-9 text-slate-400 mx-auto" />
            <div className="max-w-md mx-auto space-y-1">
              <p className="text-xs font-semibold text-slate-800">
                Connect your Google Drive to store tenant leases, KYC documents, and ledgers in your own personal cloud.
              </p>
              <p className="text-[11px] text-slate-500">
                Works seamlessly on localhost:3000 and any custom domain.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <Button
                variant="primary"
                onClick={handleConnect}
                isLoading={isConnecting}
                leftIcon={<Cloud className="w-4 h-4" />}
                className="w-full sm:w-auto text-xs"
              >
                Sign In with Google to Connect Drive
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleSandbox}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                className="w-full sm:w-auto text-xs text-amber-900 border-amber-200 bg-amber-50 hover:bg-amber-100"
              >
                Test in Local Sandbox Mode
              </Button>
            </div>
          </div>
        )}

        {/* OAuth Troubleshooting & Origin Setup Guide */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
          <button
            type="button"
            onClick={() => setShowConfigGuide(!showConfigGuide)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-800">
                Fix "Error 400: origin_mismatch" & Google Cloud Console Setup
              </span>
            </div>
            {showConfigGuide ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showConfigGuide && (
            <div className="p-4 pt-1 border-t border-slate-200/60 bg-white space-y-4 text-xs">
              {/* Direct Answer */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Do you have to host this app to use Google Drive?
                </p>
                <p className="text-emerald-900 leading-relaxed text-[11px]">
                  <strong>No, you do NOT have to host this app.</strong> Google OAuth 2.0 works with{' '}
                  <code className="bg-emerald-100 font-mono px-1 py-0.5 rounded font-bold">http://localhost:3000</code>.
                  Google merely requires that any URL running the web app is registered under{' '}
                  <strong>Authorized JavaScript origins</strong> in your Google Cloud Console.
                </p>
              </div>

              {/* Origin Copy Box */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  1. Your Current Origin to Add in Google Cloud Console:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentOrigin}
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-bold select-all"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyOriginToClipboard}
                    leftIcon={copiedOrigin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    className="shrink-0 text-xs"
                  >
                    {copiedOrigin ? 'Copied!' : 'Copy Origin'}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tip: Also add <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">http://localhost</code> as an extra authorized origin.
                </p>
              </div>

              {/* Step by step guide */}
              <div className="space-y-2">
                <p className="font-bold text-slate-700">2. How to Add This in Google Cloud Console:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 font-bold underline inline-flex items-center gap-0.5"
                    >
                      console.cloud.google.com/apis/credentials <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                  <li>Select your project, click on your <strong>OAuth 2.0 Web Client ID</strong>.</li>
                  <li>Scroll down to the <strong>"Authorized JavaScript origins"</strong> section.</li>
                  <li>Click <strong>+ ADD URI</strong> and paste: <code className="bg-white font-mono px-1 py-0.5 rounded border">{currentOrigin}</code></li>
                  <li>Click <strong>Save</strong>. (Note: Google takes 2 to 5 minutes to propagate the changes).</li>
                  <li>
                    Under <strong>OAuth consent screen</strong>, ensure user type is External, and add your test email under "Test users".
                  </li>
                </ol>
              </div>

              {/* Custom Google Client ID Input */}
              <form onSubmit={handleSaveCustomClientId} className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">
                    3. Use Your Own Google OAuth Client ID (Optional):
                  </label>
                  {customClientIdInput && (
                    <button
                      type="button"
                      onClick={handleResetClientId}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                    >
                      Reset to default
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                    value={customClientIdInput}
                    onChange={(e) => setCustomClientIdInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                  />
                  <Button size="sm" variant="primary" type="submit" className="shrink-0 text-xs">
                    Save Client ID
                  </Button>
                </div>
                {savedClientIdMsg && (
                  <p className="text-[11px] text-emerald-600 font-semibold">✓ Client ID saved successfully!</p>
                )}
                <p className="text-[11px] text-slate-400">
                  Current active client ID: <span className="font-mono text-slate-600 truncate inline-block max-w-xs align-bottom">{getEffectiveClientId()}</span>
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Offline File Vault (Alternative to Google Drive) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-600" />
            <h5 className="font-bold text-slate-800">Direct Offline File Vault (No Cloud Account Needed)</h5>
          </div>
          <p className="text-slate-500 leading-relaxed">
            You can also export and import your entire portfolio data (tenants, agreements, payments, expenses) as a local encrypted JSON file anytime.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadOfflineJson}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              Export Portfolio File (.json)
            </Button>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore from Backup (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleUploadOfflineJson}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};
