import { dbStore } from '../lib/store';
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
  }): Promise<AppDocument> {
    return dbStore.createDocument({
      ...payload,
      storage_path: `/vault/${payload.file_name}`,
    });
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
  async getSubscription() {
    return {
      planName: 'Pro Trial',
      daysRemaining: 7,
      activeUnitsCount: 5,
      maxUnitsAllowed: 50,
      isTrial: true,
    };
  },
};
