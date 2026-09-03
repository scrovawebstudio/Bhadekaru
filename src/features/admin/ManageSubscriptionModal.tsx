import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LandlordAccount, PlanTier, SubscriptionStatus } from '../../types/database.types';
import { adminService } from '../../services/adminService';
import { useToast } from '../../components/feedback/Toast';
import { Crown, Calendar, AlertTriangle, ShieldCheck, Zap, Building2, Clock, Check } from 'lucide-react';
import { formatINR } from '../../lib/utils';

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  landlord: LandlordAccount | null;
  onSuccess: () => void;
}

export const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({
  isOpen,
  onClose,
  landlord,
  onSuccess,
}) => {
  const toast = useToast();
  if (!landlord) return null;

  const [planTier, setPlanTier] = useState<PlanTier>(landlord.plan_tier);
  const [status, setStatus] = useState<SubscriptionStatus>(landlord.status);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(landlord.billing_cycle);
  const [customUnitLimit, setCustomUnitLimit] = useState<number>(
    landlord.custom_unit_limit || landlord.max_units_allowed || 20
  );
  const [isSuspended, setIsSuspended] = useState<boolean>(landlord.is_suspended);
  const [suspensionReason, setSuspensionReason] = useState<string>(
    landlord.suspension_reason || 'Administrative hold / Payment verification'
  );
  const [trialEndDate, setTrialEndDate] = useState<string>(
    landlord.trial_end ? new Date(landlord.trial_end).toISOString().split('T')[0] : ''
  );
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string>(
    landlord.current_period_end ? new Date(landlord.current_period_end).toISOString().split('T')[0] : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExtendTrial = async (days: number) => {
    try {
      await adminService.extendTrial(landlord.id, days);
      toast.success('Trial Extended', `Added ${days} days to ${landlord.organization_name}'s trial.`);
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed', 'Could not extend trial.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminService.updateLandlordSubscription(landlord.id, {
        plan_tier: planTier,
        status: isSuspended ? 'suspended' : status,
        is_suspended: isSuspended,
        suspension_reason: isSuspended ? suspensionReason : undefined,
        billing_cycle: billingCycle,
        custom_unit_limit: customUnitLimit,
        max_units_allowed: customUnitLimit,
        trial_end: trialEndDate ? new Date(trialEndDate).toISOString() : landlord.trial_end,
        current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : landlord.current_period_end,
      });

      toast.success(
        'Subscription Updated',
        `Successfully updated subscription settings for ${landlord.organization_name}.`
      );
      onSuccess();
      onClose();
    } catch {
      toast.error('Error', 'Failed to update subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Landlord Subscription & Access"
      description={`Configure plan tier, quota limits, and access status for ${landlord.organization_name}`}
      size="lg"
    >
      <form onSubmit={handleSave} className="space-y-6 pt-2">
        {/* Landlord Info Header Pill */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-900">{landlord.organization_name}</h4>
              <Badge variant="primary" className="text-[10px] uppercase font-bold">
                {landlord.city}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner: <strong>{landlord.owner_name}</strong> ({landlord.owner_email})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Currently:</span>
            <Badge
              variant={
                landlord.is_suspended ? 'danger' : landlord.status === 'active' ? 'success' : 'warning'
              }
            >
              {landlord.is_suspended ? 'Suspended' : landlord.plan_name}
            </Badge>
          </div>
        </div>

        {/* Plan Tier & Billing Cycle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Subscription Plan Tier"
            value={planTier}
            onChange={(e) => {
              const newTier = e.target.value as PlanTier;
              setPlanTier(newTier);
              if (newTier === 'free') setCustomUnitLimit(2);
              else if (newTier === 'starter') setCustomUnitLimit(5);
              else if (newTier === 'growth') setCustomUnitLimit(20);
              else if (newTier === 'professional') setCustomUnitLimit(50);
              else if (newTier === 'enterprise') setCustomUnitLimit(200);
            }}
          >
            <option value="free">Free Starter (Max 2 Units - ₹0)</option>
            <option value="starter">Landlord Starter (Max 5 Units - ₹99/mo)</option>
            <option value="growth">Portfolio Growth (Max 20 Units - ₹249/mo)</option>
            <option value="professional">Real Estate Pro (Max 50 Units - ₹499/mo)</option>
            <option value="enterprise">Enterprise / Co-Living (Max 200 Units - ₹1,499/mo)</option>
          </Select>

          <Select
            label="Billing Cycle"
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'annual')}
          >
            <option value="monthly">Monthly Recurring</option>
            <option value="annual">Annual Prepaid (20% Discount)</option>
          </Select>
        </div>

        {/* Custom Unit Quota & Access Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Max Active Units Quota"
            type="number"
            min={1}
            max={1000}
            value={customUnitLimit}
            onChange={(e) => setCustomUnitLimit(Number(e.target.value))}
            helperText={`Currently using ${landlord.stats?.units_count || 0} units across ${landlord.stats?.properties_count || 0} properties.`}
          />

          <Select
            label="Subscription Lifecycle Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
          >
            <option value="active">Active (Full Access)</option>
            <option value="trialing">Trialing (Active Pro Trial)</option>
            <option value="past_due">Past Due (Payment Overdue)</option>
            <option value="suspended">Suspended (Access Locked)</option>
            <option value="canceled">Canceled</option>
          </Select>
        </div>

        {/* Quick Trial Extender Bar */}
        <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-sky-900">Quick Trial Extender</p>
              <p className="text-[11px] text-sky-700">Add bonus trial days for this landlord instantly</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExtendTrial(7)}
              className="px-3 py-1.5 bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              +7 Days
            </button>
            <button
              type="button"
              onClick={() => handleExtendTrial(14)}
              className="px-3 py-1.5 bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              +14 Days
            </button>
            <button
              type="button"
              onClick={() => handleExtendTrial(30)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              +30 Days
            </button>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Trial Period End Date"
            type="date"
            value={trialEndDate}
            onChange={(e) => setTrialEndDate(e.target.value)}
          />

          <Input
            label="Current Billing Cycle End Date"
            type="date"
            value={currentPeriodEnd}
            onChange={(e) => setCurrentPeriodEnd(e.target.value)}
          />
        </div>

        {/* Suspension / Lockdown Override Section */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isSuspended ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className={`w-5 h-5 ${isSuspended ? 'text-rose-600' : 'text-slate-400'}`} />
              <div>
                <p className="text-xs font-bold text-slate-900">Account Suspension & Write Lock</p>
                <p className="text-[11px] text-slate-500">
                  When enabled, the landlord cannot add properties, units, or log payments.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSuspended}
                onChange={(e) => {
                  setIsSuspended(e.target.checked);
                  if (e.target.checked) setStatus('suspended');
                  else setStatus('active');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
            </label>
          </div>

          {isSuspended && (
            <div className="mt-3 pt-3 border-t border-rose-200/80">
              <Input
                label="Suspension Reason (Shown to Landlord)"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g. Failed mandate payments, Terms violation, KYC verification required"
                required={isSuspended}
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Check className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
