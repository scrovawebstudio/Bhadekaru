import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { dbStore } from '../../lib/store';
import { Settings, User, Building2, Globe, Database, Download, RotateCcw, ShieldCheck, Check } from 'lucide-react';
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
    </div>
  );
};
