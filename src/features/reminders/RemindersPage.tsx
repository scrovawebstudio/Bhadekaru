import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reminderService } from '../../services/documentService';
import { propertyService } from '../../services/propertyService';
import { tenantService } from '../../services/tenantService';
import { BellRing, Plus, CheckCircle2, Clock, Calendar, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import { ReminderType } from '../../types/database.types';
import { useToast } from '../../components/feedback/Toast';

export const AddReminderModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => Promise<void> }> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType>('rent_collection');
  const [remindDate, setRemindDate] = useState(new Date().toISOString().split('T')[0]);
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: properties = [] } = useQuery({ queryKey: ['properties'], queryFn: () => propertyService.getProperties() });
  const { data: tenants = [] } = useQuery({ queryKey: ['tenants'], queryFn: () => tenantService.getTenants() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !remindDate) return;

    setIsLoading(true);
    try {
      await onSubmit({
        title,
        type,
        remind_date: remindDate,
        property_id: propertyId || undefined,
        tenant_id: tenantId || undefined,
        description: description || undefined,
        is_completed: false,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set New Reminder" subtitle="Schedule alerts for rent dues, agreement expiry, or tax dates" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Reminder Title *" placeholder="e.g. Follow up on Flat A-102 September rent" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Reminder Category" value={type} onChange={(e) => setType(e.target.value as ReminderType)}>
            <option value="rent_due">Rent Collection Follow-up</option>
            <option value="agreement_expiry">Agreement Renewal Notice</option>
            <option value="maintenance">Maintenance Follow-up</option>
            <option value="tax_payment">Property Tax Payment</option>
            <option value="custom">Custom Reminder</option>
          </Select>

          <Input label="Due Date *" type="date" value={remindDate} onChange={(e) => setRemindDate(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Related Property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">-- None --</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>

          <Select label="Related Tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            <option value="">-- None --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </Select>
        </div>

        <Input label="Additional Notes" placeholder="e.g. Call tenant at 6 PM" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>Save Reminder</Button>
        </div>
      </form>
    </Modal>
  );
};

export const RemindersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setAddModalOpen(true);
    }
  }, [searchParams]);

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => reminderService.getReminders(),
  });

  const createReminderMutation = useMutation({
    mutationFn: (data: any) => reminderService.createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder Saved', 'Alert has been scheduled.');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => reminderService.completeReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Completed', 'Reminder marked as done.');
    },
  });

  const pending = reminders.filter((r) => !r.is_completed);
  const completed = reminders.filter((r) => r.is_completed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Reminders & Follow-up Tasks
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Never miss rent collection calls, renewal notices, or municipal tax deadlines.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddModalOpen(true)}>
          Set Reminder
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Reminders */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Pending Reminders</span>
            <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-[10px]">{pending.length}</span>
          </h3>

          {pending.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-400">
              No pending reminders. You are all caught up!
            </div>
          ) : (
            pending.map((rem) => (
              <div key={rem.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">{rem.title}</h4>
                  <Badge variant="warning" className="text-[10px] uppercase font-bold">
                    {(rem.type || 'reminder').replace('_', ' ')}
                  </Badge>
                </div>
                {rem.description && <p className="text-xs text-slate-600">{rem.description}</p>}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Due: {formatDate(rem.remind_date)}
                  </span>
                  <button
                    onClick={() => completeMutation.mutate(rem.id)}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Completed Reminders */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Completed Tasks</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{completed.length}</span>
          </h3>

          {completed.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-400">
              No completed reminders yet.
            </div>
          ) : (
            completed.map((rem) => (
              <div key={rem.id} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 space-y-1 opacity-70">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-700 line-through">{rem.title}</h4>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-400">Date: {formatDate(rem.remind_date)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <AddReminderModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setSearchParams({});
        }}
        onSubmit={async (data) => {
          await createReminderMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
