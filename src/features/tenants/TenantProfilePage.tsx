import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tenantService } from '../../services/tenantService';
import { paymentService } from '../../services/paymentService';
import { maintenanceService } from '../../services/maintenanceService';
import { documentService } from '../../services/documentService';
import { agreementService } from '../../services/agreementService';
import {
  Users,
  ArrowLeft,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  Wrench,
  FolderOpen,
  FileText,
  Building2,
  Receipt,
  UserCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDate } from '../../lib/utils';
import { ReceiptModal } from '../payments/ReceiptModal';

export const TenantProfilePage: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const navigate = useNavigate();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantService.getTenantById(tenantId!),
    enabled: Boolean(tenantId),
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentService.getPayments(),
  });

  const { data: allMaintenance = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceService.getMaintenanceRequests(),
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getDocuments(),
  });

  const { data: allAgreements = [] } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementService.getAgreements(),
  });

  if (isLoading || !tenant) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading tenant profile...</div>;
  }

  const activeAgreement = allAgreements.find((a) => a.tenant_id === tenant.id && a.is_active);
  const tenantPayments = allPayments.filter((p) => p.tenant_id === tenant.id);
  const tenantMaintenance = allMaintenance.filter((m) => m.tenant_id === tenant.id);
  const tenantDocuments = allDocuments.filter((d) => d.tenant_id === tenant.id);

  const tabs = [
    { id: 'overview', label: 'Overview & KYC', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'payments', label: 'Payment Ledger', icon: <CreditCard className="w-4 h-4" />, count: tenantPayments.length },
    { id: 'maintenance', label: 'Maintenance Requests', icon: <Wrench className="w-4 h-4" />, count: tenantMaintenance.length },
    { id: 'documents', label: 'Uploaded Documents', icon: <FolderOpen className="w-4 h-4" />, count: tenantDocuments.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <button
          onClick={() => navigate('/tenants')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all tenants</span>
        </button>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 font-black text-xl flex items-center justify-center border border-sky-200">
              {tenant.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {tenant.full_name}
                </h1>
                <Badge variant={tenant.is_active ? 'success' : 'neutral'} className="text-xs">
                  {tenant.is_active ? 'Active Tenant' : 'Past Tenant'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {tenant.phone}
                </span>
                {tenant.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {tenant.email}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Receipt className="w-4 h-4" />}
              onClick={() => navigate(`/payments?action=record&tenantId=${tenant.id}`)}
            >
              Record Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview & KYC */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Personal & Employment Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Occupation</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{tenant.occupation || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Company Name</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{tenant.company_name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">No. of Occupants</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{tenant.occupants_count || 1} Persons</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Vehicle Details</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{tenant.vehicle_details || 'No vehicle registered'}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Permanent Residential Address</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{tenant.permanent_address || 'Not provided'}</p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Contact Person</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{tenant.emergency_contact_name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Emergency Phone</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{tenant.emergency_contact_phone || 'Not provided'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Col: Current Residence Summary */}
          <div className="space-y-6">
            <Card className="bg-sky-50/50 border-sky-100">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-sky-950">Current Residence</h3>
              </div>

              {tenant.current_unit_number ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-sky-600 font-bold uppercase text-[10px]">Property & Unit</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      {tenant.current_property_name} ({tenant.current_unit_number})
                    </p>
                  </div>
                  <div>
                    <span className="text-sky-600 font-bold uppercase text-[10px]">Monthly Rent</span>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {formatINR(activeAgreement?.monthly_rent || 0)} <span className="text-xs text-slate-500 font-normal">/ month</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sky-600 font-bold uppercase text-[10px]">Security Deposit Held</span>
                    <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                      {formatINR(activeAgreement?.security_deposit || 0)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Tenant is not actively assigned to a unit.</p>
              )}
            </Card>

            <Card>
              <h3 className="text-sm font-bold text-slate-900 mb-2">KYC Status</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <span>Aadhaar Card</span>
                  <Badge variant="success">Verified</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <span>PAN Card</span>
                  <Badge variant="success">Verified</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <span>Police Intimation</span>
                  <Badge variant="info">Submitted</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Payment History & Receipts</h3>
          {tenantPayments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-7 h-7" />}
              title="No payments found"
              description="Payments logged for this tenant will appear here with instant printable receipts."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Reference / UTR</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenantPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.receipt_number}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(p.payment_date)}</td>
                      <td className="px-4 py-3 uppercase font-bold text-slate-500">{p.payment_method}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{p.reference_number || '—'}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-700">{formatINR(p.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Maintenance Issues</h3>
          {tenantMaintenance.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-7 h-7" />}
              title="No maintenance issues logged"
              description="Service tickets raised by or for this tenant will be listed here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tenantMaintenance.map((m) => (
                <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-900">{m.title}</h4>
                    <Badge variant={m.status === 'completed' ? 'success' : 'warning'} className="capitalize">
                      {m.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500">{m.description}</p>
                  <p className="text-[11px] text-slate-400">Reported: {formatDate(m.reported_date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Tenant Document Vault</h3>
          {tenantDocuments.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="w-7 h-7" />}
              title="No documents uploaded"
              description="Upload Aadhaar card, agreement scans, or PAN card for safe keeping."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tenantDocuments.map((doc) => (
                <div key={doc.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{doc.name}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{doc.category}</span>
                    </div>
                  </div>
                  <Badge variant="success">Verified</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
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
