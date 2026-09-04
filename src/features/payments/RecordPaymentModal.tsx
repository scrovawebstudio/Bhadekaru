import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { PaymentMethod } from '../../types/database.types';
import { useQuery } from '@tanstack/react-query';
import { tenantService } from '../../services/tenantService';
import { propertyService } from '../../services/propertyService';
import { rentService } from '../../services/paymentService';

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTenantId?: string;
  defaultRentChargeId?: string;
  defaultAmount?: number;
  onSubmit: (data: any) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  defaultTenantId,
  defaultRentChargeId,
  defaultAmount,
  onSubmit,
}) => {
  const [tenantId, setTenantId] = useState(defaultTenantId || '');
  const [rentChargeId, setRentChargeId] = useState(defaultRentChargeId || '');
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantService.getTenants(),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyService.getProperties(),
  });

  const { data: rentCharges = [] } = useQuery({
    queryKey: ['rentCharges'],
    queryFn: () => rentService.getRentCharges(),
  });

  // Filter charges for selected tenant
  const tenantCharges = rentCharges.filter((rc) => !tenantId || rc.tenant_id === tenantId);

  // When default props change
  useEffect(() => {
    if (defaultTenantId) setTenantId(defaultTenantId);
    if (defaultRentChargeId) setRentChargeId(defaultRentChargeId);
    if (defaultAmount) setAmount(defaultAmount.toString());
  }, [defaultTenantId, defaultRentChargeId, defaultAmount]);

  // When charge changes, auto-fill tenant, property, unit, amount
  useEffect(() => {
    if (rentChargeId) {
      const charge = rentCharges.find((c) => c.id === rentChargeId);
      if (charge) {
        if (charge.tenant_id) setTenantId(charge.tenant_id);
        if (charge.property_id) setPropertyId(charge.property_id);
        if (charge.unit_id) setUnitId(charge.unit_id);
        const remaining = Math.max(0, charge.total_amount - (charge.paid_amount || 0));
        if (!amount || amount === '0') {
          setAmount(remaining.toString());
        }
        if (!notes) {
          setNotes(`Rent payment for ${charge.billing_month}`);
        }
      }
    }
  }, [rentChargeId, rentCharges]);

  // When tenant changes, auto-fill property, unit & rent amount if no charge selected
  useEffect(() => {
    if (tenantId && !rentChargeId) {
      const selected = tenants.find((t) => t.id === tenantId);
      if (selected) {
        if (selected.current_property_id) setPropertyId(selected.current_property_id);
        if (selected.current_unit_id) {
          setUnitId(selected.current_unit_id);
          const prop = properties.find((p) => p.id === selected.current_property_id);
          const unit = prop?.units?.find((u) => u.id === selected.current_unit_id);
          if (unit && !amount) {
            setAmount(unit.monthly_rent.toString());
          }
        }
      }
    }
  }, [tenantId, rentChargeId, tenants, properties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paymentDate) return;

    setIsLoading(true);
    try {
      await onSubmit({
        tenant_id: tenantId || undefined,
        rent_charge_id: rentChargeId || undefined,
        property_id: propertyId || undefined,
        unit_id: unitId || undefined,
        amount: Number(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Rent Payment" subtitle="Record cash, UPI, or bank transfer with automatic receipt generation" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Select
            label="Tenant *"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            required
          >
            <option value="">-- Select Tenant --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name} ({t.current_unit_number || 'No unit'}) - {t.phone}
              </option>
            ))}
          </Select>
        </div>

        {tenantCharges.length > 0 && (
          <div>
            <Select
              label="Associated Rent Charge / Dues"
              value={rentChargeId}
              onChange={(e) => setRentChargeId(e.target.value)}
            >
              <option value="">-- Auto-detect & settle oldest pending charge --</option>
              {tenantCharges.map((c) => {
                const pending = c.total_amount - (c.paid_amount || 0);
                return (
                  <option key={c.id} value={c.id}>
                    {c.billing_month} ({c.unit_number}) - ₹{pending.toLocaleString('en-IN')} pending [{c.status.toUpperCase()}]
                  </option>
                );
              })}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount Paid (₹) *"
            type="number"
            placeholder="e.g. 24000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Payment Date *"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Payment Mode"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
            <option value="bank_transfer">Net Banking / NEFT / IMPS</option>
            <option value="cash">Cash in Hand</option>
            <option value="cheque">Cheque</option>
            <option value="card">Debit / Credit Card</option>
          </Select>

          <Input
            label="Transaction ID / UTR / Cheque No"
            placeholder="e.g. UPI/4928192849"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Remarks / Month Covered
          </label>
          <input
            type="text"
            placeholder="e.g. Rent for September 2026 including maintenance"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Generate Receipt & Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
