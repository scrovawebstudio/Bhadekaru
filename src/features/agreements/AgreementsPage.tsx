import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agreementService } from '../../services/agreementService';
import { propertyService } from '../../services/propertyService';
import { tenantService } from '../../services/tenantService';
import { FileText, Plus, Search, Calendar, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDate } from '../../lib/utils';
import { useToast } from '../../components/feedback/Toast';

export const AddAgreementModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => Promise<void> }> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 330 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [escalationRate, setEscalationRate] = useState('5');
  const [lockInPeriodMonths, setLockInPeriodMonths] = useState('6');
  const [noticePeriodDays, setNoticePeriodDays] = useState('30');
  const [policeVerificationDone, setPoliceVerificationDone] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyService.getProperties(),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantService.getTenants(),
  });

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const availableUnits = selectedProperty?.units || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !unitId || !tenantId || !monthlyRent) return;

    setIsLoading(true);
    try {
      await onSubmit({
        property_id: propertyId,
        unit_id: unitId,
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
        monthly_rent: Number(monthlyRent),
        security_deposit: Number(securityDeposit) || Number(monthlyRent) * 3,
        escalation_rate_percent: Number(escalationRate) || 5,
        lock_in_period_months: Number(lockInPeriodMonths) || 6,
        notice_period_days: Number(noticePeriodDays) || 30,
        police_verification_done: policeVerificationDone,
        is_active: true,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Rent Agreement" subtitle="Set lease duration, rent escalation & lock-in terms" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Property *" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
            <option value="">-- Select Property --</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Select label="Unit / Flat *" value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
            <option value="">-- Select Unit --</option>
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_number} ({formatINR(u.monthly_rent)}/mo)
              </option>
            ))}
          </Select>
        </div>

        <Select label="Tenant *" value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
          <option value="">-- Select Tenant --</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name} ({t.phone})
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Agreement Start Date *" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <Input label="Agreement End Date *" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Monthly Rent (₹) *" type="number" placeholder="24000" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} required />
          <Input label="Security Deposit (₹)" type="number" placeholder="72000" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input label="Escalation (%)" type="number" value={escalationRate} onChange={(e) => setEscalationRate(e.target.value)} helperText="Annual rent increase" />
          <Input label="Lock-in (Months)" type="number" value={lockInPeriodMonths} onChange={(e) => setLockInPeriodMonths(e.target.value)} />
          <Input label="Notice Period (Days)" type="number" value={noticePeriodDays} onChange={(e) => setNoticePeriodDays(e.target.value)} />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="police"
            checked={policeVerificationDone}
            onChange={(e) => setPoliceVerificationDone(e.target.checked)}
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
          />
          <label htmlFor="police" className="text-xs font-semibold text-slate-700">
            Tenant Police Intimation / Verification Filed
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Agreement
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const AgreementsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementService.getAgreements(),
  });

  const createAgreementMutation = useMutation({
    mutationFn: (data: any) => agreementService.createAgreement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement Created', '11-month lease agreement saved to records.');
    },
  });

  const filteredAgreements = agreements.filter((a) => {
    const matches =
      a.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.unit_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matches;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Rent Agreements & Lease Terms
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage 11-month residential agreements, rent escalations, lock-in periods, and expiry dates.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddModalOpen(true)}>
          New Agreement
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant, property, or flat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Agreements Cards Grid */}
      {filteredAgreements.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-7 h-7" />}
          title="No agreements found"
          description="Create your first lease agreement to track expiry and automatic 5% or 10% rent increments."
          actionLabel="Create Agreement"
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgreements.map((a) => {
            const endDate = new Date(a.end_date);
            const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysLeft > 0 && daysLeft <= 30;

            return (
              <div
                key={a.id}
                className={`bg-white p-5 rounded-2xl border transition-all shadow-xs ${
                  isExpiringSoon ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{a.tenant_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {a.property_name} ({a.unit_number})
                    </p>
                  </div>
                  <Badge variant={a.is_active ? 'success' : 'neutral'}>
                    {a.is_active ? 'Active Lease' : 'Expired'}
                  </Badge>
                </div>

                {isExpiringSoon && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Expires in {daysLeft} days! Prepare renewal or notice.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {formatDate(a.start_date)} — {formatDate(a.end_date)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Rent</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{formatINR(a.monthly_rent)}/mo</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Deposit Held</span>
                    <p className="font-bold text-emerald-700 mt-0.5">{formatINR(a.security_deposit)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Annual Escalation</span>
                    <p className="font-bold text-sky-700 mt-0.5">+{a.annual_escalation_percent || a.escalation_rate_percent || 10}% on renewal</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">
                    Notice: <strong>{a.notice_period_days} days</strong> • Lock-in: <strong>{a.lock_in_months || a.lock_in_period_months || 6} mo</strong>
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Stamp Paper Ready
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Agreement Modal */}
      <AddAgreementModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={async (data) => {
          await createAgreementMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
