import { dbStore } from '../lib/store';
import { MaintenanceRequest, Vendor, Expense } from '../types/database.types';

export const maintenanceService = {
  async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const state = dbStore.getState();
    const orgId = state.organization.id;
    return state.maintenance.filter((m) => m.organization_id === orgId);
  },

  async getVendors(): Promise<Vendor[]> {
    const state = dbStore.getState();
    const orgId = state.organization.id;
    return state.vendors.filter((v) => v.organization_id === orgId);
  },

  async createMaintenanceRequest(payload: Omit<MaintenanceRequest, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<MaintenanceRequest> {
    const state = dbStore.getState();
    const property = state.properties.find((p) => p.id === payload.property_id);
    const unit = payload.unit_id ? state.units.find((u) => u.id === payload.unit_id) : undefined;
    const vendor = payload.vendor_id ? state.vendors.find((v) => v.id === payload.vendor_id) : undefined;

    const newRequest: MaintenanceRequest = {
      ...payload,
      id: `mnt-${Date.now()}`,
      organization_id: state.organization.id,
      property_name: property?.name,
      unit_number: unit?.unit_number,
      vendor_name: vendor?.name,
      reported_date: payload.reported_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      maintenance: [newRequest, ...s.maintenance],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          organization_id: s.organization.id,
          type: 'maintenance_update',
          title: `New Maintenance: ${newRequest.title}`,
          message: `${property?.name || ''} ${unit ? '(' + unit.unit_number + ')' : ''} - Priority: ${newRequest.priority.toUpperCase()}`,
          link_url: '/maintenance',
          is_read: false,
          channel: 'in_app',
          created_at: new Date().toISOString(),
        },
        ...s.notifications,
      ],
    }));

    return newRequest;
  },

  async updateMaintenanceRequest(id: string, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const state = dbStore.getState();
    const existing = state.maintenance.find((m) => m.id === id);
    if (!existing) throw new Error('Maintenance request not found');

    const vendor = updates.vendor_id ? state.vendors.find((v) => v.id === updates.vendor_id) : undefined;

    const updated: MaintenanceRequest = {
      ...existing,
      ...updates,
      vendor_name: vendor ? vendor.name : existing.vendor_name,
      completed_date: updates.status === 'completed' && !existing.completed_date ? new Date().toISOString().split('T')[0] : existing.completed_date,
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      maintenance: s.maintenance.map((m) => (m.id === id ? updated : m)),
    }));

    return updated;
  },

  async createVendor(payload: Omit<Vendor, 'id' | 'organization_id' | 'created_at'>): Promise<Vendor> {
    const state = dbStore.getState();
    const newVendor: Vendor = {
      ...payload,
      id: `ven-${Date.now()}`,
      organization_id: state.organization.id,
      created_at: new Date().toISOString(),
    };
    dbStore.updateState((s) => ({
      ...s,
      vendors: [...s.vendors, newVendor],
    }));
    return newVendor;
  },
};

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    const state = dbStore.getState();
    const orgId = state.organization.id;
    return state.expenses
      .filter((e) => e.organization_id === orgId)
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  },

  async createExpense(payload: Omit<Expense, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<Expense> {
    const state = dbStore.getState();
    const property = state.properties.find((p) => p.id === payload.property_id);
    const unit = payload.unit_id ? state.units.find((u) => u.id === payload.unit_id) : undefined;
    const vendor = payload.vendor_id ? state.vendors.find((v) => v.id === payload.vendor_id) : undefined;

    const newExpense: Expense = {
      ...payload,
      id: `exp-${Date.now()}`,
      organization_id: state.organization.id,
      property_name: property?.name,
      unit_number: unit?.unit_number,
      vendor_name: vendor?.name,
      amount: Number(payload.amount),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      expenses: [newExpense, ...s.expenses],
    }));

    return newExpense;
  },

  async deleteExpense(id: string): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      expenses: s.expenses.filter((e) => e.id !== id),
    }));
  },
};
