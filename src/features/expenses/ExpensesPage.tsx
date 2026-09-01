import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../../services/maintenanceService';
import { propertyService } from '../../services/propertyService';
import { TrendingDown, Plus, Search, Filter, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR, formatDate } from '../../lib/utils';
import { ExpenseCategory } from '../../types/database.types';
import { useToast } from '../../components/feedback/Toast';

export const AddExpenseModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => Promise<void> }> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('repairs');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyService.getProperties(),
  });

  const selectedProp = properties.find((p) => p.id === propertyId);
  const units = selectedProp?.units || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !amount || !expenseDate) return;

    setIsLoading(true);
    try {
      await onSubmit({
        property_id: propertyId,
        unit_id: unitId || undefined,
        category,
        amount: Number(amount),
        expense_date: expenseDate,
        description: description || undefined,
        vendor_name: vendorName || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Property Expense" subtitle="Track repairs, society maintenance, taxes & utility bills" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Select label="Expense Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            <option value="repairs">Repairs & Renovation</option>
            <option value="maintenance">Society Maintenance Pool</option>
            <option value="property_tax">Property Tax / Municipal Tax</option>
            <option value="insurance">Building Insurance</option>
            <option value="utilities">Utilities (Water / Electricity)</option>
            <option value="cleaning">Deep Cleaning</option>
            <option value="legal">Legal & Registration Fees</option>
            <option value="other">Other Miscellaneous</option>
          </Select>

          <Input label="Amount (₹) *" type="number" placeholder="2500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Expense Date *" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
          <Input label="Vendor / Paid To" placeholder="e.g. Mahavitaran / Society Office" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
        </div>

        <Input label="Description" placeholder="e.g. Q3 Society maintenance charges paid via cheque" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>Save Expense</Button>
        </div>
      </form>
    </Modal>
  );
};

export const ExpensesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setAddModalOpen(true);
    }
  }, [searchParams]);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses(),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => expenseService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
      toast.success('Expense Logged', 'Property expense added to financials.');
    },
  });

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.vendor_name && e.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Property Expenses & Outflows
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track society maintenance, repair bills, property taxes, and net ROI deductions.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddModalOpen(true)}>
          Record Expense
        </Button>
      </div>

      {/* Total Card */}
      <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Total Recorded Outflow</span>
          <p className="text-2xl font-black text-rose-900 mt-0.5">{formatINR(totalExpenseAmount)}</p>
        </div>
        <TrendingDown className="w-8 h-8 text-rose-400" />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by description, vendor, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-slate-700"
        >
          <option value="all">All Categories</option>
          <option value="repairs">Repairs & Renovation</option>
          <option value="maintenance">Society Maintenance</option>
          <option value="property_tax">Property Tax</option>
          <option value="insurance">Insurance</option>
          <option value="utilities">Utilities</option>
        </select>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<TrendingDown className="w-7 h-7" />}
          title="No expenses logged"
          description="Log society bills or maintenance outlays to see true net property yields."
          actionLabel="Add Expense"
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Paid To / Vendor</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-extrabold uppercase text-slate-800 tracking-wider text-[10px]">
                      {exp.category.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{exp.description || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{exp.vendor_name || 'Direct'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(exp.expense_date)}</td>
                    <td className="px-4 py-3 text-right font-black text-rose-600">{formatINR(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setSearchParams({});
        }}
        onSubmit={async (data) => {
          await createExpenseMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};
