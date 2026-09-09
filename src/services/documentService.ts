import { dbStore } from '../lib/store';
import { supabaseService } from './supabaseService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { AppDocument, Reminder, DocumentCategory, AppNotification } from '../types/database.types';

export const documentService = {
  async getDocuments(): Promise<AppDocument[]> {
    return dbStore.getDocuments();
  },

  async uploadDocument(payload: {
    name: string;
    category: DocumentCategory;
    property_id?: string;
    tenant_id?: string;
    file_name: string;
    file_size_bytes?: number;
    mime_type?: string;
    storage_path?: string;
  }): Promise<AppDocument> {
    const doc = dbStore.createDocument({
      ...payload,
      storage_path: payload.storage_path || `/vault/${payload.file_name}`,
    });

    if (isSupabaseConfigured && supabase) {
      supabaseService.upsertEntity('documents', doc).catch(() => {});
    }

    return doc;
  },

  async uploadFileToStorage(file: File | Blob, fileName: string, folder: string = 'vault'): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      try {
        const cleanName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const path = `${folder}/${cleanName}`;
        const res = await supabaseService.uploadFileToStorage('vault', path, file);
        if (res?.publicUrl) return res.publicUrl;
        if (res?.path) return res.path;
      } catch (err) {
        console.warn('[documentService] Storage upload fallback:', err);
      }
    }
    return `/vault/${fileName}`;
  },
};

export const reminderService = {
  async getReminders(): Promise<Reminder[]> {
    return dbStore.getReminders();
  },

  async createReminder(payload: {
    title: string;
    type?: any;
    remind_date: string;
    property_id?: string;
    tenant_id?: string;
    description?: string;
    is_completed?: boolean;
  }): Promise<Reminder> {
    return dbStore.createReminder({
      title: payload.title,
      type: payload.type,
      remind_date: payload.remind_date,
      property_id: payload.property_id,
      tenant_id: payload.tenant_id,
      description: payload.description,
      repeat_interval: 'none',
      is_completed: false,
    });
  },

  async completeReminder(id: string): Promise<Reminder> {
    return dbStore.completeReminder(id);
  },
};

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    const state = dbStore.getState();
    const orgId = state.organization.id;
    return state.notifications.filter((n) => n.organization_id === orgId);
  },

  async markAsRead(id: string): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    }));
  },

  async markAllAsRead(): Promise<void> {
    const orgId = dbStore.getState().organization.id;
    dbStore.updateState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.organization_id === orgId ? { ...n, is_read: true } : n)),
    }));
  },
};

export const subscriptionService = {
  async getSubscription() {
    const state = dbStore.getState();
    const orgId = state.organization.id;
    const account = state.landlordAccounts.find((a) => a.id === orgId);
    const plan = state.subscriptionPlans.find((p) => p.tier === account?.plan_tier) || state.subscriptionPlans[3];
    const currentUnits = state.units.filter((u) => u.organization_id === orgId).length;
    const trialEnd = account?.trial_end ? new Date(account.trial_end).getTime() : Date.now() + 7 * 86400000;
    const daysRemaining = Math.max(0, Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24)));

    return {
      planName: account?.plan_name || plan.name,
      planTier: account?.plan_tier || 'professional',
      daysRemaining,
      activeUnitsCount: currentUnits,
      maxUnitsAllowed: account?.custom_unit_limit || account?.max_units_allowed || plan.max_active_units,
      isTrial: account?.status === 'trialing',
      isSuspended: !!account?.is_suspended,
      suspensionReason: account?.suspension_reason,
    };
  },
};
