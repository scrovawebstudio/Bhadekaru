import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../../services/maintenanceService';
import { propertyService } from '../../services/propertyService';
import { tenantService } from '../../services/tenantService';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  User,
  Check
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDate } from '../../lib/utils';
import { MaintenancePriority, MaintenanceStatus } from '../../types/database.types';
import { useToast } from '../../components/feedback/Toast';

export const AddMaintenanceModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => Promise<void> }> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('medium');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyService.getProperties(),
  });

  const selectedProp = properties.find((p) => p.id === propertyId);
  const units = selectedProp?.units || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !propertyId) return;

    setIsLoading(true);
    try {
      await onSubmit({
        property_id: propertyId,
        unit_id: unitId || undefined,
        tenant_id: tenantId || undefined,
        title,
        description,
        priority,
        status: 'new',
        estimated_cost: estimatedCost ? Number(estimatedCost) : 0,
        actual_cost: 0,
        reported_date: new Date().toISOString().split('T')[0],
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Maintenance Issue" subtitle="Report repairs, plumbing, or electrical tasks" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Issue Title *"
          placeholder="e.g. Master bathroom tap leakage"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Property *" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
            <option value="">-- Select Property --</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>

          <Select label="Unit (Optional)" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            <option value="">Common Area / Entire Building</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.unit_number}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as MaintenancePriority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>

          <Input
            label="Estimated Cost (₹)"
            type="number"
            placeholder="e.g. 1500"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Issue Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide specific details about the issue..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Log Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const AddVendorModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => Promise<void> }> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('Plumber');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('Pune');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsLoading(true);
    try {
      await onSubmit({
        name,
        service_type: serviceType,
        phone,
        address,
        rating: 5,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Vendor / Contractor" subtitle="Save contact for plumbers, electricians, or painters" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Vendor / Technician Name *" placeholder="e.g. Ramesh Kulkarni" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Service Type" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
            <option value="Plumber">Plumber</option>
            <option value="Electrician">Electrician</option>
            <option value="Carpenter">Carpenter</option>
            <option value="Painter">Painter</option>
            <option value="Deep Cleaner">Deep Cleaner</option>
            <option value="Appliance Repair">Appliance Repair</option>
          </Select>
          <Input label="Phone Number *" placeholder="+91 98222 11223" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <Input label="Location / Area" value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>Save Vendor</Button>
        </div>
      </form>
    </Modal>
  );
};

export const MaintenancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'vendors'>('tickets');
  const [addTicketOpen, setAddTicketOpen] = useState(false);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceService.getMaintenanceRequests(),
  });

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => maintenanceService.getVendors(),
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: any) => maintenanceService.createMaintenanceRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Ticket Logged', 'Maintenance request is saved.');
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: (data: any) => maintenanceService.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor Added', 'Technician saved to vendor directory.');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaintenanceStatus }) =>
      maintenanceService.updateMaintenanceRequest(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Status Updated', 'Ticket updated successfully.');
    },
  });

  const filteredTickets = tickets.filter((t) => {
    const matches =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.property_name && t.property_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matches;
  });

  const tabs = [
    { id: 'tickets', label: 'Maintenance Tickets', icon: <Wrench className="w-4 h-4" />, count: tickets.length },
    { id: 'vendors', label: 'Vendor Directory', icon: <Phone className="w-4 h-4" />, count: vendors.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Maintenance & Service Tickets
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Log repair requests, assign plumbers/electricians, and track resolution costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'tickets' ? (
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddTicketOpen(true)}>
              Log Issue
            </Button>
          ) : (
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddVendorOpen(true)}>
              Add Vendor
            </Button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(t) => setActiveTab(t as any)} />

      {/* Tab 1: Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets by issue title or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-7 h-7" />}
              title="No maintenance issues logged"
              description="Click below to record plumbing, electrical, or painting jobs."
              actionLabel="Log Issue"
              onAction={() => setAddTicketOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTickets.map((t) => (
                <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                        Priority: {t.priority}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{t.title}</h3>
                      <p className="text-xs text-slate-500">
                        {t.property_name} {t.unit_number ? `(${t.unit_number})` : '• Common Area'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        t.status === 'completed'
                          ? 'success'
                          : t.status === 'in_progress'
                          ? 'info'
                          : 'warning'
                      }
                      className="capitalize"
                    >
                      {t.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {t.description && <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{t.description}</p>}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Reported: {formatDate(t.reported_date)}</span>
                    {t.estimated_cost > 0 && <span className="font-bold text-slate-800">Est. Cost: {formatINR(t.estimated_cost)}</span>}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    {t.status !== 'completed' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: t.id, status: 'completed' })}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Vendors */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{v.name}</h4>
                    <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                      {v.service_type}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-500">★ {v.rating}.0</span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{v.phone}</strong>
                  </p>
                  {v.address && <p className="text-slate-500">Area: {v.address}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddMaintenanceModal
        isOpen={addTicketOpen}
        onClose={() => setAddTicketOpen(false)}
        onSubmit={async (data) => {
          await createTicketMutation.mutateAsync(data);
        }}
      />
      <AddVendorModal
        isOpen={addVendorOpen}
        onClose={() => setAddVendorOpen(false)}
        onSubmit={async (data) => {
          await createVendorMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
