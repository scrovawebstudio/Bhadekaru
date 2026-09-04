import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, rentService } from '../../services/paymentService';
import { CreditCard, Plus, Search, Receipt, CheckCircle2, Clock, AlertTriangle, Send, Filter, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDate, getStatusBadgeClass } from '../../lib/utils';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { useToast } from '../../components/feedback/Toast';

export const PaymentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'charges' | 'history'>('charges');
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get('action') === 'record') {
      setRecordModalOpen(true);
    }
    if (searchParams.get('filter')) {
      setStatusFilter(searchParams.get('filter')!);
    }
  }, [searchParams]);

  const { data: rentCharges = [], isLoading: chargesLoading } = useQuery({
    queryKey: ['rentCharges'],
    queryFn: () => rentService.getRentCharges(),
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentService.getPayments(),
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => paymentService.recordPayment(data),
    onSuccess: (newPayment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['rentCharges'] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['landlordAccounts'] });
      setActiveTab('history');
      toast.success('Payment Recorded', `Receipt #${newPayment.receipt_number} generated.`);
      setSelectedReceipt(newPayment);
    },
  });

  const handleSendReminder = (charge: any) => {
    const text = `Namaste ${charge.tenant_name},\nThis is a friendly reminder from Bhadekaru regarding the rent for ${charge.month_year}.\nAmount: ${formatINR(charge.amount - (charge.paid_amount || 0))}\nDue Date: ${formatDate(charge.due_date)}.\nPlease make the payment to avoid late charges.\nThank you!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const filteredCharges = rentCharges.filter((c) => {
    const matchesSearch =
      c.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.unit_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.unit_number && p.unit_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const totalExpected = rentCharges.reduce((acc, c) => acc + c.total_amount, 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPending = rentCharges.reduce((acc, c) => acc + (c.total_amount - (c.paid_amount || 0)), 0);

  const tabs = [
    { id: 'charges', label: 'Rent Charges & Due Dues', icon: <Clock className="w-4 h-4" />, count: rentCharges.length },
    { id: 'history', label: 'Payment Ledger & Receipts', icon: <Receipt className="w-4 h-4" />, count: payments.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Rent & Payment Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Collect rent, track overdue dues, generate receipts, and send WhatsApp reminders.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setRecordModalOpen(true)}
        >
          Record Payment
        </Button>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Expected</span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatINR(totalExpected)}</p>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 uppercase">Total Collected</span>
          <p className="text-xl font-black text-emerald-800 mt-1">{formatINR(totalCollected)}</p>
        </div>
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 shadow-xs">
          <span className="text-xs font-bold text-amber-700 uppercase">Pending Rent</span>
          <p className="text-xl font-black text-amber-800 mt-1">{formatINR(totalPending)}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(t) => setActiveTab(t as any)} />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'charges' ? "Search by tenant, property, or flat..." : "Search by receipt number, tenant..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
          />
        </div>
        {activeTab === 'charges' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="due">Due</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
        )}
      </div>

      {/* Tab 1: Rent Charges */}
      {activeTab === 'charges' && (
        <div className="space-y-4">
          {filteredCharges.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-7 h-7" />}
              title="No rent charges found"
              description="All current monthly rents are settled or match no filters."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Tenant & Unit</th>
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3">Billing Month</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Rent Amount</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCharges.map((charge) => (
                      <tr key={charge.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{charge.tenant_name}</p>
                          <p className="text-[11px] text-slate-500">{charge.unit_number}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{charge.property_name}</td>
                        <td className="px-4 py-3 text-slate-700 font-semibold">{charge.billing_month}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(charge.due_date)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              charge.status === 'paid'
                                ? 'success'
                                : charge.status === 'overdue'
                                ? 'danger'
                                : 'warning'
                            }
                            className="capitalize"
                          >
                            {charge.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">{formatINR(charge.total_amount)}</td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          {charge.status !== 'paid' && (
                            <>
                              <button
                                onClick={() => handleSendReminder(charge)}
                                className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Remind</span>
                              </button>
                              <button
                                onClick={() => {
                                  const pendingAmount = charge.total_amount - (charge.paid_amount || 0);
                                  setSearchParams({ action: 'record', tenantId: charge.tenant_id, chargeId: charge.id, amount: pendingAmount.toString() });
                                  setRecordModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Collect</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payments History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-7 h-7" />}
              title="No payment records found"
              description="When you record a payment, the receipt and transaction log will appear here."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Receipt No</th>
                      <th className="px-4 py-3">Tenant & Unit</th>
                      <th className="px-4 py-3">Payment Date</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Reference / UTR</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.receipt_number}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{p.tenant_name}</p>
                          <p className="text-[11px] text-slate-500">{p.unit_number}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(p.payment_date)}</td>
                        <td className="px-4 py-3 uppercase font-bold text-slate-600">{p.payment_method}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{p.reference_number || 'Direct Payment'}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700">{formatINR(p.amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordModalOpen}
        defaultTenantId={searchParams.get('tenantId') || undefined}
        defaultRentChargeId={searchParams.get('chargeId') || undefined}
        defaultAmount={searchParams.get('amount') ? Number(searchParams.get('amount')) : undefined}
        onClose={() => {
          setRecordModalOpen(false);
          setSearchParams({});
        }}
        onSubmit={async (data) => {
          await createPaymentMutation.mutateAsync(data);
        }}
      />

      {/* View Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={Boolean(selectedReceipt)}
          payment={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
