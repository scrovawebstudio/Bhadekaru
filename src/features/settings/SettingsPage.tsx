import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { dbStore } from '../../lib/store';
import { googleDriveService, DriveSyncStatus } from '../../services/googleDriveService';
import { GoogleDriveModal } from '../../components/drive/GoogleDriveModal';
import { PWAInstallModal } from '../../components/pwa/PWAInstallModal';
import { Settings, User, Building2, Globe, Database, Download, RotateCcw, ShieldCheck, Check, Cloud, CloudCheck, UploadCloud, RefreshCw, ExternalLink, HardDrive, Smartphone } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/feedback/Toast';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => authService.getProfile() });
  const { data: organization } = useQuery({ queryKey: ['organization'], queryFn: () => authService.getOrganization() });

  const [fullName, setFullName] = useState(profile?.full_name || 'Rajesh Patil');
  const [phone, setPhone] = useState(profile?.phone || '+91 98220 12345');
  const [email, setEmail] = useState(profile?.email || 'scrovawebstudio@gmail.com');
  const [orgName, setOrgName] = useState(organization?.name || 'Patil Real Estate');
  const [currency, setCurrency] = useState(organization?.currency || 'INR');
  const [timezone, setTimezone] = useState(organization?.timezone || 'Asia/Kolkata');
  const [isSaving, setIsSaving] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [driveStatus, setDriveStatus] = useState<DriveSyncStatus>(googleDriveService.getStatus());
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);

  useEffect(() => {
    return googleDriveService.subscribe((s) => {
      setDriveStatus(s);
    });
  }, []);

  const handleSyncToDrive = async () => {
    setIsDriveSyncing(true);
    try {
      const res = await googleDriveService.syncToDrive();
      toast.success(
        'Google Drive Synced',
        `Successfully backed up ${res.counts?.properties || 0} properties and ${res.counts?.tenants || 0} tenants.`
      );
    } catch (err: any) {
      toast.error('Sync Error', err?.message);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await authService.updateProfile({ full_name: fullName, phone });
      await authService.updateOrganization({ name: orgName, currency, timezone });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Settings Saved', 'Profile and portfolio details updated.');
    } catch (err: any) {
      toast.error('Error saving', err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJSON = () => {
    const data = dbStore.exportAllData();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Bhadekaru_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Backup Exported', 'Complete JSON dataset saved to your computer.');
  };

  const handleResetSeed = () => {
    if (window.confirm('Reset all demo properties, tenants, and payment records back to default sample state?')) {
      dbStore.resetToSeed();
      queryClient.invalidateQueries();
      toast.info('Data Reset', 'Default demo properties and tenants reloaded.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
          Account & Business Settings
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Manage your landlord profile, organization branding, data backups, and database settings.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Landlord Profile */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Landlord Profile</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label="Mobile Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <div className="sm:col-span-2">
              <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled helperText="Email address associated with your primary account" />
            </div>
          </div>
        </Card>

        {/* Portfolio / Business Branding */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Portfolio & Receipts Branding</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <Input
                label="Portfolio / Real Estate Agency Name"
                placeholder="e.g. Patil Properties & Flats"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD</option>
              <option value="AED">AED (UAE Dirham)</option>
            </Select>
            <Select label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="Asia/Kolkata">IST (Asia/Kolkata - UTC+5:30)</option>
              <option value="Asia/Dubai">GST (Asia/Dubai - UTC+4)</option>
              <option value="UTC">UTC</option>
            </Select>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Receipt Prefix
              </label>
              <input
                type="text"
                disabled
                value="BHD"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 font-mono"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Check className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Google Drive Cloud Storage & Sync (BYOS) */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${driveStatus.isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
              {driveStatus.isConnected ? <CloudCheck className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Google Drive Cloud Storage & Sync</h3>
                <Badge variant={driveStatus.isConnected ? 'success' : 'neutral'}>
                  {driveStatus.isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Private Bring-Your-Own-Storage (BYOS) architecture for maximum privacy & zero server bloat.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant={driveStatus.isConnected ? 'outline' : 'primary'}
            onClick={() => setShowDriveModal(true)}
            leftIcon={driveStatus.isConnected ? <RefreshCw className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
          >
            {driveStatus.isConnected ? 'Manage Drive Sync' : 'Connect Google Drive'}
          </Button>
        </div>

        {driveStatus.isConnected ? (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Google Account</span>
                <span className="font-bold text-slate-900 block truncate mt-0.5">{driveStatus.userEmail || 'Active'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Target Drive Folder</span>
                <span className="font-bold text-slate-900 block truncate mt-0.5">📁 Bhadekaru - Rental Manager Data</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Last Cloud Backup</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {driveStatus.lastSyncedAt
                    ? new Date(driveStatus.lastSyncedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Ready to sync'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSyncToDrive}
                isLoading={isDriveSyncing}
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                Sync Now to Google Drive
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDriveModal(true)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Restore or View Drive Backups
              </Button>

              {driveStatus.folderLink && (
                <a
                  href={driveStatus.folderLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-sky-50 transition-colors ml-auto"
                >
                  <span>Open Folder in Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <p className="text-slate-600 max-w-lg">
              Connect your Google Drive to keep your lease contracts, tenant identity proofs, rent slips, and portfolio data in your own storage without relying on central database servers.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowDriveModal(true)}
              leftIcon={<Cloud className="w-4 h-4" />}
              className="shrink-0"
            >
              Setup Drive Sync
            </Button>
          </div>
        )}
      </Card>

      {/* Data Management & Persistence */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">Data Management & Offline Persistence</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Bhadekaru operates on high-speed local encrypted storage with offline readiness and full export capabilities.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportJSON}>
            Export Full Backup (JSON)
          </Button>
          <Button variant="danger" size="sm" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={handleResetSeed}>
            Reset Demo Data
          </Button>
        </div>
      </Card>

      {/* Mobile Application (PWA) */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-sky-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mobile Application (Android & iOS)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Install Bhadekaru on your phone or tablet for instant access, home screen launching, and offline usage.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPwaModal(true)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Install App Guide
          </Button>
        </div>
      </Card>

      {/* Google Drive Modal */}
      <GoogleDriveModal isOpen={showDriveModal} onClose={() => setShowDriveModal(false)} />

      {/* PWA Installation Modal */}
      <PWAInstallModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </div>
  );
};
