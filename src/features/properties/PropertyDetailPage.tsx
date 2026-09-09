import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '../../services/propertyService';
import { paymentService } from '../../services/paymentService';
import { maintenanceService } from '../../services/maintenanceService';
import { expenseService } from '../../services/maintenanceService';
import { documentService } from '../../services/documentService';
import {
  Building2,
  MapPin,
  ArrowLeft,
  Plus,
  Users,
  CreditCard,
  Wrench,
  TrendingDown,
  FolderOpen,
  FileText,
  DoorOpen,
  CheckCircle2,
  Clock,
  Car,
  UserPlus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDate, getStatusBadgeClass } from '../../lib/utils';
import { AddUnitModal } from './AddPropertyModal';
import { useToast } from '../../components/feedback/Toast';

export const PropertyDetailPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [activeTab, setActiveTab] = useState('units');
  const [addUnitModalOpen, setAddUnitModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyService.getPropertyById(propertyId!),
    enabled: Boolean(propertyId),
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentService.getPayments(),
  });

  const { data: allMaintenance = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceService.getMaintenanceRequests(),
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses(),
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getDocuments(),
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: any) => propertyService.createUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
      toast.success('Unit Created', 'The rental unit has been added successfully.');
    },
  });

  if (isLoading || !property) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading property details...</div>;
  }

  const units = property.units || [];
  const propertyPayments = allPayments.filter((p) => p.property_id === property.id);
  const propertyMaintenance = allMaintenance.filter((m) => m.property_id === property.id);
  const propertyExpenses = allExpenses.filter((e) => e.property_id === property.id);
  const propertyDocuments = allDocuments.filter((d) => d.property_id === property.id);

  const occupiedUnits = units.filter((u) => u.status === 'occupied').length;
  const totalRent = units.reduce((acc, u) => acc + (u.status === 'occupied' ? Number(u.monthly_rent || 0) : 0), 0);

  const tabs = [
    { id: 'units', label: 'Units & Flats', icon: <DoorOpen className="w-4 h-4" />, count: units.length },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" />, count: propertyPayments.length },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" />, count: propertyMaintenance.length },
    { id: 'expenses', label: 'Expenses', icon: <TrendingDown className="w-4 h-4" />, count: propertyExpenses.length },
    { id: 'documents', label: 'Documents', icon: <FolderOpen className="w-4 h-4" />, count: propertyDocuments.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button & Main Header */}
      <div>
        <button
          onClick={() => navigate('/properties')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all properties</span>
        </button>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">{property.name}</h1>
              <Badge variant="neutral" className="uppercase text-[10px]">
                {property.type}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {property.address_line1}, {property.city} - {property.pincode}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setAddUnitModalOpen(true)}
            >
              Add Unit / Flat
            </Button>
          </div>
        </div>
      </div>

      {/* Property Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 text-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Units</span>
          <p className="text-xl font-extrabold text-slate-900 mt-0.5">{units.length}</p>
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-center">
          <span className="text-xs font-bold text-emerald-700 uppercase">Occupied</span>
          <p className="text-xl font-extrabold text-emerald-800 mt-0.5">{occupiedUnits}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Vacant</span>
          <p className="text-xl font-extrabold text-slate-700 mt-0.5">{units.length - occupiedUnits}</p>
        </div>
        <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 text-center">
          <span className="text-xs font-bold text-sky-700 uppercase">Monthly Income</span>
          <p className="text-xl font-extrabold text-sky-800 mt-0.5">{formatINR(totalRent)}</p>
        </div>
      </div>

      {/* Property Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Units List */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Rental Units ({units.length})</h3>
            <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAddUnitModalOpen(true)}>
              New Unit
            </Button>
          </div>

          {units.length === 0 ? (
            <EmptyState
              icon={<DoorOpen className="w-7 h-7" />}
              title="No units in this property"
              description="Add flats, office suites, or shop spaces belonging to this property."
              actionLabel="Add Unit"
              onAction={() => setAddUnitModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-extrabold text-slate-900">{unit.unit_number}</h4>
                      <Badge variant={unit.status === 'occupied' ? 'success' : 'neutral'} className="capitalize text-[10px]">
                        {unit.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">
                      {unit.bedrooms ? `${unit.bedrooms} BHK • ` : ''}
                      {unit.furnishing.replace('_', ' ')} • {unit.area_sqft || '—'} sq.ft
                    </p>

                    {unit.active_tenant ? (
                      <div
                        onClick={() => navigate(`/tenants/${unit.active_tenant?.id}`)}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-sky-50/50 transition-colors mb-3"
                      >
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Current Tenant</span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">{unit.active_tenant.full_name}</p>
                        <p className="text-[11px] text-slate-500">{unit.active_tenant.phone}</p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center mb-3">
                        <span className="text-xs text-slate-500 font-medium block mb-2">Vacant (No active tenant)</span>
                        <button
                          type="button"
                          onClick={() => navigate(`/agreements?action=create&propertyId=${property.id}&unitId=${unit.id}`)}
                          className="w-full py-1.5 px-3 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-sky-200/80"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Assign Tenant
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Rent</span>
                      <p className="font-extrabold text-slate-900">{formatINR(unit.monthly_rent)}/mo</p>
                    </div>
                    {unit.parking_included && (
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-400" /> Parking Inc.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Payment Records for {property.name}</h3>
          {propertyPayments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-7 h-7" />}
              title="No payments recorded yet"
              description="Payments recorded for units in this property will appear here."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Tenant & Unit</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {propertyPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.receipt_number}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {p.tenant_name} <span className="text-slate-400 font-normal">({p.unit_number})</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(p.payment_date)}</td>
                      <td className="px-4 py-3 uppercase font-bold text-slate-500">{p.payment_method}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-700">{formatINR(p.amount)}</td>
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
          <h3 className="text-sm font-bold text-slate-900">Maintenance Tickets</h3>
          {propertyMaintenance.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-7 h-7" />}
              title="No maintenance issues logged"
              description="Any plumbing, electrical, or repair tickets for this property will show here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {propertyMaintenance.map((m) => (
                <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-900">{m.title}</h4>
                    <Badge variant={m.status === 'completed' ? 'success' : 'warning'} className="capitalize">
                      {m.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500">{m.description}</p>
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                    <span>{m.unit_number || 'Building Area'}</span>
                    <span>Reported: {formatDate(m.reported_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Expenses Logged</h3>
          {propertyExpenses.length === 0 ? (
            <EmptyState
              icon={<TrendingDown className="w-7 h-7" />}
              title="No expenses recorded"
              description="Tax, society pool, and repair expenses for this property will appear here."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {propertyExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold uppercase text-slate-700">{e.category}</td>
                      <td className="px-4 py-3 text-slate-700">{e.description}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(e.expense_date)}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-rose-600">{formatINR(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Property Documents & Vault</h3>
          {propertyDocuments.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="w-7 h-7" />}
              title="No documents uploaded for this property"
              description="Upload building insurance, property tax receipts, or title documents."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {propertyDocuments.map((doc) => (
                <div key={doc.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{doc.name}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{doc.category}</span>
                    </div>
                  </div>
                  <Badge variant="neutral">Secure</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Unit Modal */}
      <AddUnitModal
        isOpen={addUnitModalOpen}
        propertyId={property.id}
        onClose={() => setAddUnitModalOpen(false)}
        onSubmit={async (data) => {
          await createUnitMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
