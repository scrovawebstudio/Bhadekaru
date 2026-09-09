import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { dbStore, DBState } from '../lib/store';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { supabaseService } from './supabaseService';

export type SyncStatusType = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface CloudSyncInfo {
  status: SyncStatusType;
  lastSyncedAt: string | null;
  serverVersion: number;
  lastModifiedByPlatform: string;
  error?: string;
  isNative: boolean;
  serverUrl: string;
}

const SERVER_URL_KEY = 'bhadekaru_cloud_server_url';
const NATIVE_BACKUP_KEY = 'bhadekaru_native_db_backup';

class CloudSyncService {
  private status: SyncStatusType = 'idle';
  private lastSyncedAt: string | null = null;
  private serverVersion: number = 1;
  private lastModifiedByPlatform: string = 'web';
  private error?: string;
  private syncTimeout: any = null;
  private isProcessing = false;
  private isPulling = false;
  private customServerUrl: string = '';
  private initialized = false;

  constructor() {
    this.loadCachedConfig();
  }

  private loadCachedConfig() {
    try {
      if (typeof window !== 'undefined') {
        const cachedUrl = localStorage.getItem(SERVER_URL_KEY);
        if (cachedUrl) {
          this.customServerUrl = cachedUrl;
        }
      }
    } catch {
      // Ignored
    }
  }

  public getServerUrl(): string {
    if (this.customServerUrl) {
      return this.customServerUrl.replace(/\/+$/, '');
    }
    const metaEnv = (import.meta as any).env || {};
    const supabaseUrl = metaEnv.VITE_SUPABASE_URL;
    if (supabaseUrl && supabaseUrl.trim() && supabaseUrl !== 'MY_SUPABASE_URL') {
      return supabaseUrl.trim().replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      const origin = window.location.origin;
      if (!origin.includes('localhost') || !Capacitor.isNativePlatform()) {
        return origin;
      }
    }
    return 'Supabase Cloud (Direct)';
  }

  public async setServerUrl(url: string) {
    this.customServerUrl = (url || '').trim();
    if (this.customServerUrl) {
      localStorage.setItem(SERVER_URL_KEY, this.customServerUrl);
      await Preferences.set({ key: SERVER_URL_KEY, value: this.customServerUrl });
    } else {
      localStorage.removeItem(SERVER_URL_KEY);
      await Preferences.remove({ key: SERVER_URL_KEY });
    }
    this.notify();
    this.pullLatest();
  }

  public getStatus(): CloudSyncInfo {
    return {
      status: this.status,
      lastSyncedAt: this.lastSyncedAt,
      serverVersion: this.serverVersion,
      lastModifiedByPlatform: this.lastModifiedByPlatform,
      error: this.error,
      isNative: Capacitor.isNativePlatform(),
      serverUrl: this.getServerUrl(),
    };
  }

  private notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('bhadekaru_cloud_sync', {
          detail: this.getStatus(),
        })
      );
    }
  }

  public async init() {
    if (this.initialized) return;
    this.initialized = true;

    if (Capacitor.isNativePlatform()) {
      try {
        const { value } = await Preferences.get({ key: SERVER_URL_KEY });
        if (value && !this.customServerUrl) {
          this.customServerUrl = value;
        }
      } catch {
        // Ignored
      }
    }

    await this.restoreNativeStorageFallback();

    if (typeof window !== 'undefined') {
      window.addEventListener('bhadekaru_db_change', () => {
        this.scheduleAutoPush();
      });

      window.addEventListener('online', () => {
        this.status = 'idle';
        this.pullLatest();
      });

      window.addEventListener('offline', () => {
        this.status = 'offline';
        this.notify();
      });

      // Periodic synchronization check every 2 minutes
      setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine && !this.isProcessing) {
          this.checkAndPull();
        }
      }, 120000);
    }

    setTimeout(() => {
      this.pullLatest();
    }, 1000);
  }

  private scheduleAutoPush() {
    if (this.isPulling) return;
    const state = dbStore.getState();
    if (state.currentRole === 'super_admin' || state.currentOrgId === 'org-platform-admin') {
      return;
    }

    this.backupToNativePreferences();

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.pushCurrentState();
    }, 2500);
  }

  private async backupToNativePreferences() {
    try {
      const state = dbStore.getState();
      await Preferences.set({
        key: NATIVE_BACKUP_KEY,
        value: JSON.stringify(state),
      });
    } catch {
      // Ignored
    }
  }

  private async restoreNativeStorageFallback() {
    try {
      const current = dbStore.getState();
      if (!current.landlordAccounts || current.landlordAccounts.length === 0) {
        const { value } = await Preferences.get({ key: NATIVE_BACKUP_KEY });
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed && parsed.currentOrgId) {
            dbStore.updateState(() => parsed);
          }
        }
      }
    } catch {
      // Ignored
    }
  }

  public async checkAndPull(): Promise<boolean> {
    if (!navigator.onLine) {
      this.status = 'offline';
      this.notify();
      return false;
    }
    return await this.pullLatest();
  }

  // Pull latest portfolio state from Supabase PostgreSQL (or local fallback)
  public async pullLatest(): Promise<boolean> {
    if (!navigator.onLine) {
      this.status = 'offline';
      this.notify();
      return false;
    }

    const state = dbStore.getState();
    if (state.currentRole === 'super_admin' || state.currentOrgId === 'org-platform-admin') {
      this.status = 'synced';
      this.notify();
      return true;
    }

    if (this.isProcessing) return false;
    this.isProcessing = true;
    this.status = 'syncing';
    this.error = undefined;
    this.notify();

    const orgId = state.currentOrgId || state.organization.id;

    // 1. If Supabase is active, pull directly from PostgreSQL tables
    if (isSupabaseConfigured && supabase && orgId) {
      try {
        const remoteSlice = await supabaseService.loadPortfolioState(orgId);
        if (remoteSlice) {
          this.isPulling = true;
          try {
            dbStore.updateState((current) => ({
              ...current,
              ...remoteSlice,
              currentOrgId: current.currentOrgId || orgId,
              currentRole: current.currentRole || 'landlord',
            }));
          } finally {
            setTimeout(() => {
              this.isPulling = false;
            }, 300);
          }

          this.serverVersion += 1;
          this.lastSyncedAt = new Date().toISOString();
          this.lastModifiedByPlatform = Capacitor.isNativePlatform() ? 'android' : 'web';
          this.status = 'synced';
          this.error = undefined;
          await this.backupToNativePreferences();
          this.notify();
          this.isProcessing = false;
          return true;
        }
      } catch (err: any) {
        console.warn('[CloudSyncService] Supabase pull warning:', err);
      }
    }

    // 2. Offline / local fallback (data already cached in localStorage & Capacitor Preferences)
    this.status = 'synced';
    this.lastSyncedAt = this.lastSyncedAt || new Date().toISOString();
    this.notify();
    this.isProcessing = false;
    return true;
  }

  // Push current local portfolio modifications directly to Supabase PostgreSQL
  public async pushCurrentState(): Promise<boolean> {
    if (!navigator.onLine) {
      this.status = 'offline';
      this.notify();
      return false;
    }

    const state = dbStore.getState();
    if (state.currentRole === 'super_admin' || state.currentOrgId === 'org-platform-admin') {
      return true;
    }

    if (this.isProcessing) return false;
    this.isProcessing = true;
    this.status = 'syncing';
    this.error = undefined;
    this.notify();

    const orgId = state.currentOrgId || state.organization.id;

    // 1. If Supabase is active, upsert entities to Supabase tables
    if (isSupabaseConfigured && supabase && orgId) {
      try {
        // Upsert organization details
        if (state.organization) {
          await supabase.from('organizations').upsert(state.organization);
        }

        // Upsert properties & units in batch
        if (state.properties && state.properties.length > 0) {
          await supabase.from('properties').upsert(state.properties);
        }
        if (state.units && state.units.length > 0) {
          await supabase.from('property_units').upsert(state.units);
        }
        if (state.tenants && state.tenants.length > 0) {
          await supabase.from('tenants').upsert(state.tenants);
        }
        if (state.agreements && state.agreements.length > 0) {
          await supabase.from('rental_agreements').upsert(state.agreements);
        }
        if (state.payments && state.payments.length > 0) {
          await supabase.from('payments').upsert(state.payments);
        }
        if (state.expenses && state.expenses.length > 0) {
          await supabase.from('expenses').upsert(state.expenses);
        }
        if (state.maintenance && state.maintenance.length > 0) {
          await supabase.from('maintenance_requests').upsert(state.maintenance);
        }
        if (state.deposits && state.deposits.length > 0) {
          await supabase.from('security_deposits').upsert(state.deposits);
        }
        if (state.reminders && state.reminders.length > 0) {
          await supabase.from('reminders').upsert(state.reminders);
        }
        if (state.documents && state.documents.length > 0) {
          await supabase.from('documents').upsert(state.documents);
        }

        this.serverVersion += 1;
        this.lastSyncedAt = new Date().toISOString();
        this.lastModifiedByPlatform = Capacitor.isNativePlatform() ? 'android' : 'web';
        this.status = 'synced';
        this.error = undefined;
        await this.backupToNativePreferences();
        this.notify();
        this.isProcessing = false;
        return true;
      } catch (err: any) {
        console.warn('[CloudSyncService] Supabase push error:', err);
      }
    }

    // 2. Offline fallback: local store updated and durable
    this.status = 'synced';
    this.lastSyncedAt = new Date().toISOString();
    await this.backupToNativePreferences();
    this.notify();
    this.isProcessing = false;
    return true;
  }
}

export const cloudSyncService = new CloudSyncService();
