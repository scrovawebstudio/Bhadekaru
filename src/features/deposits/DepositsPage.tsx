import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agreementService } from '../../services/agreementService';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Shield, Calculator, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDate } from '../../lib/utils';
import { useToast } from '../../components/feedback/Toast';

export const DepositsPage: React.FC = () => {
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [unpaidRent, setUnpaidRent] = useState('0');
  const [paintingDeduction, setPaintingDeduction] = useState('4000');
  const [damageDeduction, setDamageDeduction] = useState('0');
  const [notes, setNotes] = useState('Move-out deep cleaning & standard painting cost deducted as per agreement.');
  const [settlementSuccess, setSettlementSuccess] = useState(false);

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementService.getAgreements(),
  });

  const totalDepositsHeld = agreements
    .filter((a) => a.is_active)
    .reduce((acc, a) => acc + Number(a.security_deposit || 0), 0);

  // Settlement Calculation
  const depositAmount = selectedAgreement ? Number(selectedAgreement.security_deposit || 0) : 0;
  const totalDeductions = Number(unpaidRent) + Number(paintingDeduction) + Number(damageDeduction);
  const netRefund = Math.max(0, depositAmount - totalDeductions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Security Deposits & Move-Out Settlement
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track deposit liabilities, calculate deduction settlements, painting & deep-cleaning charges.
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Total Security Deposits Held</span>
          <p className="text-2xl md:text-3xl font-black text-white mt-1">{formatINR(totalDepositsHeld)}</p>
          <p className="text-xs text-emerald-200 mt-1">Across {agreements.filter((a) => a.is_active).length} active rental leases</p>
        </div>
        <div className="bg-emerald-800/80 px-4 py-3 rounded-2xl border border-emerald-700/60 text-xs text-emerald-100 max-w-sm">
          <p className="font-semibold flex items-center gap-1.5 text-white">
            <Shield className="w-4 h-4 text-emerald-300" /> Safe Holding Policy
          </p>
          <p className="mt-1 text-[11px] text-emerald-200">
            Deposits are fully refundable at the end of the tenancy upon inspection and deduction clearance.
          </p>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Active Tenant Deposit Registry</h3>
          <span className="text-xs text-slate-500">{agreements.length} Total records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Tenant Name</th>
                <th className="px-4 py-3">Property & Flat</th>
                <th className="px-4 py-3">Lease Period</th>
                <th className="px-4 py-3 text-right">Monthly Rent</th>
                <th className="px-4 py-3 text-right">Deposit Held</th>
                <th className="px-4 py-3 text-center">Move-Out Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agreements.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{a.tenant_name}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {a.property_name} ({a.unit_number})
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(a.start_date)} - {formatDate(a.end_date)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatINR(a.monthly_rent)}</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700">{formatINR(a.security_deposit)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedAgreement(a);
                        setSettlementSuccess(false);
                      }}
                      className="px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Calculate Settlement</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move-Out Settlement Modal */}
      {selectedAgreement && (
        <Modal
          isOpen={Boolean(selectedAgreement)}
          onClose={() => setSelectedAgreement(null)}
          title="Move-Out Deposit Settlement"
          subtitle={`Final account settlement for ${selectedAgreement.tenant_name} (${selectedAgreement.unit_number})`}
          maxWidth="lg"
        >
          {settlementSuccess ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Settlement Statement Generated</h3>
              <p className="text-xs text-slate-600">
                Net refund of <strong>{formatINR(netRefund)}</strong> calculated. Settlement report ready to share with tenant.
              </p>
              <Button variant="primary" className="w-full" onClick={() => setSelectedAgreement(null)}>
                Close Settlement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Deposit Held</span>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">{formatINR(selectedAgreement.security_deposit)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Rent</span>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">{formatINR(selectedAgreement.monthly_rent)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Deductions at Move-Out</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Unpaid Rent (₹)"
                    type="number"
                    value={unpaidRent}
                    onChange={(e) => setUnpaidRent(e.target.value)}
                  />
                  <Input
                    label="Painting Charges (₹)"
                    type="number"
                    value={paintingDeduction}
                    onChange={(e) => setPaintingDeduction(e.target.value)}
                  />
                  <Input
                    label="Repair Damages (₹)"
                    type="number"
                    value={damageDeduction}
                    onChange={(e) => setDamageDeduction(e.target.value)}
                  />
                </div>

                <Input
                  label="Settlement Remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Calculation Summary Box */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Initial Deposit:</span>
                  <span className="font-bold text-slate-900">{formatINR(depositAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Total Deductions:</span>
                  <span className="font-bold">- {formatINR(totalDeductions)}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 flex justify-between text-sm font-extrabold text-emerald-900">
                  <span>Net Refundable to Tenant:</span>
                  <span>{formatINR(netRefund)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" onClick={() => setSelectedAgreement(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setSettlementSuccess(true)}>
                  Confirm & Finalize Settlement
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
