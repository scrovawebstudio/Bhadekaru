import { dbStore, SUBSCRIPTION_PLANS } from '../lib/store';
import { AppDocument, Reminder, AppNotification, Subscription, SubscriptionPlan, AuditLog } from '../types/database.types';

export const documentService = {
  async getDocuments(): Promise<AppDocument[]> {
    return dbStore.getState().documents;
  },

  async uploadDocument(payload: Omit<AppDocument, 'id' | 'organization_id' | 'created_at'>): Promise<AppDocument> {
    const state = dbStore.getState();
    const property = payload.property_id ? state.properties.find((p) => p.id === payload.property_id) : undefined;
    const unit = payload.unit_id ? state.units.find((u) => u.id === payload.unit_id) : undefined;
    const tenant = payload.tenant_id ? state.tenants.find((t) => t.id === payload.tenant_id) : undefined;

    const newDoc: AppDocument = {
      ...payload,
      id: `doc-${Date.now()}`,
      organization_id: state.organization.id,
      property_name: property?.name,
      unit_number: unit?.unit_number,
      tenant_name: tenant?.full_name,
      created_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      documents: [newDoc, ...s.documents],
    }));

    return newDoc;
  },

  async deleteDocument(id: string): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      documents: s.documents.filter((d) => d.id !== id),
    }));
  },
};

export const reminderService = {
  async getReminders(): Promise<Reminder[]> {
    return dbStore.getState().reminders.sort((a, b) => new Date(a.remind_date).getTime() - new Date(b.remind_date).getTime());
  },

  async createReminder(payload: Omit<Reminder, 'id' | 'organization_id' | 'is_completed' | 'created_at'>): Promise<Reminder> {
    const state = dbStore.getState();
    const property = payload.property_id ? state.properties.find((p) => p.id === payload.property_id) : undefined;
    const tenant = payload.tenant_id ? state.tenants.find((t) => t.id === payload.tenant_id) : undefined;

    const newReminder: Reminder = {
      ...payload,
      id: `rem-${Date.now()}`,
      organization_id: state.organization.id,
      property_name: property?.name,
      tenant_name: tenant?.full_name,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      reminders: [newReminder, ...s.reminders],
    }));

    return newReminder;
  },

  async toggleComplete(id: string): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      reminders: s.reminders.map((r) =>
        r.id === id ? { ...r, is_completed: !r.is_completed, completed_at: !r.is_completed ? new Date().toISOString() : undefined } : r
      ),
    }));
  },

  async deleteReminder(id: string): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      reminders: s.reminders.filter((r) => r.id !== id),
    }));
  },
};

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    return dbStore.getState().notifications;
  },

  async markAsRead(id: string): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    }));
  },

  async markAllAsRead(): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
    }));
  },
};

export const subscriptionService = {
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  },

  async getSubscription(): Promise<{ subscription: Subscription; plan: SubscriptionPlan; daysRemaining: number; activeUnitsCount: number; maxUnitsAllowed: number }> {
    const state = dbStore.getState();
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === state.subscription.plan_id) || SUBSCRIPTION_PLANS[0];
    
    // Calculate trial days remaining
    const trialEnd = new Date(state.subscription.trial_end).getTime();
    const now = Date.now();
    const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
    const activeUnitsCount = state.units.length;

    return {
      subscription: state.subscription,
      plan,
      daysRemaining,
      activeUnitsCount,
      maxUnitsAllowed: plan.max_active_units,
    };
  },

  async upgradePlan(planId: string): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      subscription: {
        ...s.subscription,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    }));
  },
};

export const reportService = {
  async getFinancialSummary() {
    const state = dbStore.getState();
    
    // Calculate monthly totals
    const currentMonth = '2026-09';
    const currentMonthCharges = state.rentCharges.filter((rc) => rc.billing_month.startsWith(currentMonth));
    
    const expectedRent = currentMonthCharges.reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
    const collectedRent = currentMonthCharges.reduce((acc, c) => acc + Number(c.paid_amount || 0), 0);
    const pendingRent = expectedRent - collectedRent;

    const currentMonthExpenses = state.expenses
      .filter((e) => e.expense_date.startsWith(currentMonth))
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const totalUnits = state.units.length;
    const occupiedUnits = state.units.filter((u) => u.status === 'occupied').length;
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const overdueCharges = state.rentCharges.filter((rc) => rc.status === 'overdue');
    const totalOverdueAmount = overdueCharges.reduce((acc, rc) => acc + (Number(rc.total_amount || 0) - Number(rc.paid_amount || 0)), 0);

    return {
      totalProperties: state.properties.length,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      expectedRent,
      collectedRent,
      pendingRent,
      currentMonthExpenses,
      netIncome: collectedRent - currentMonthExpenses,
      overdueChargesCount: overdueCharges.length,
      totalOverdueAmount,
    };
  },
};
