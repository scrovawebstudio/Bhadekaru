import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { dbStore, DBState } from '../lib/store';

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
  private serverVersion: number = 0;
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
    const envUrl = (import.meta as any).env?.VITE_SERVER_URL;
    if (envUrl && envUrl.trim()) {
      return envUrl.trim().replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      const origin = window.location.origin;
      // In native mobile webview, origin might be capacitor://localhost or https://localhost
      if (!origin.includes('localhost') || !Capacitor.isNativePlatform()) {
        return origin;
      }
    }
    return '';
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
    // Trigger sync with new URL
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

  // Initialize background listeners and initial sync
  public async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load server url from native preferences if in mobile
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

    // Try restoring state from native preferences if local storage is empty
    await this.restoreNativeStorageFallback();

    // Listen to local DB changes to auto-push (debounced)
    if (typeof window !== 'undefined') {
      window.addEventListener('bhadekaru_db_change', () => {
        this.scheduleAutoPush();
      });

      window.addEventListener('online', () => {
        this.pullLatest();
      });

      // Poll periodically every 2 minutes when tab is visible
      setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine && !this.isProcessing) {
          this.checkAndPull();
        }
      }, 120000);
    }

    // Initial pull
    setTimeout(() => {
      this.pullLatest();
    }, 800);
  }

  private scheduleAutoPush() {
    if (this.isPulling) return;
    const state = dbStore.getState();
    if (state.currentRole === 'super_admin' || state.currentOrgId === 'org-platform-admin') {
      return;
    }

    // Backup to native preferences immediately for offline durability
    this.backupToNativePreferences();

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.pushCurrentState();
    }, 2000);
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
      // If store is somehow default and native backup exists, restore it
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

    const state = dbStore.getState();
    if (state.currentRole === 'super_admin' || state.currentOrgId === 'org-platform-admin') {
      return false;
    }

    const orgId = state.currentOrgId || 'org-2001';
    const baseUrl = this.getServerUrl();
    const endpoint = `${baseUrl}/api/sync/status?orgId=${encodeURIComponent(orgId)}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) return false;
      const data = await res.json();
      if (data.exists && data.version > this.serverVersion) {
        return await this.pullLatest();
      }
      return true;
    } catch {
      return false;
    }
  }

  public async pullLatest(): Promise<boolean> {
    if (!navigator.onLine) {
      this.status = 'offline';
      this.notify();
      return false;
    }

    const state = dbStore.getState();
    if (state.currentRole === 'super_admin' || state.currentOrgId === 'org-platform-admin') {
      return false;
    }

    if (this.isProcessing) return false;
    this.isProcessing = true;
    this.status = 'syncing';
    this.error = undefined;
    this.notify();

    const orgId = state.currentOrgId || 'org-2001';
    const baseUrl = this.getServerUrl();
    const endpoint = `${baseUrl}/api/sync/pull?orgId=${encodeURIComponent(orgId)}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`Cloud server returned HTTP ${res.status}`);
      }
      const data = await res.json();

      if (data.exists && data.state) {
        const serverState: DBState = data.state;
        this.serverVersion = data.version || 1;
        this.lastSyncedAt = data.lastModified || new Date().toISOString();
        this.lastModifiedByPlatform = data.lastModifiedByPlatform || 'web';

        // Suppress auto-push while applying incoming server state
        this.isPulling = true;
        try {
          dbStore.updateState((current) => {
            return {
              ...current,
              ...serverState,
              // Keep active session credentials intact
              currentRole: current.currentRole || serverState.currentRole,
              currentOrgId: current.currentOrgId || serverState.currentOrgId,
            };
          });
        } finally {
          setTimeout(() => {
            this.isPulling = false;
          }, 300);
        }

        await this.backupToNativePreferences();
        this.status = 'synced';
        this.error = undefined;
        this.notify();
        this.isProcessing = false;
        return true;
      } else {
        // First time initialization: push current state up to cloud server
        this.isProcessing = false;
        return await this.pushCurrentState();
      }
    } catch (err: any) {
      this.status = 'error';
      this.error = err.message || 'Failed to sync with cloud server';
      this.notify();
      this.isProcessing = false;
      return false;
    }
  }

  public async pushCurrentState(): Promise<boolean> {
    if (!navigator.onLine) {
      this.status = 'offline';
      this.notify();
      return false;
    }

    const state = dbStore.getState();
    if (state.currentRole === 'super_admin' || state.currentOrgId === 'org-platform-admin') {
      return false;
    }

    if (this.isProcessing) return false;
    this.isProcessing = true;
    this.status = 'syncing';
    this.error = undefined;
    this.notify();

    const orgId = state.currentOrgId || 'org-2001';
    const baseUrl = this.getServerUrl();
    const endpoint = `${baseUrl}/api/sync/push`;
    const platform = Capacitor.isNativePlatform()
      ? `mobile_${Capacitor.getPlatform()}`
      : 'web';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Platform': platform,
          'X-Org-Id': orgId,
        },
        body: JSON.stringify({
          orgId,
          state,
          platform,
          clientVersion: this.serverVersion,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned HTTP ${res.status}`);
      }

      const result = await res.json();
      this.serverVersion = result.version;
      this.lastSyncedAt = result.lastModified;
      this.lastModifiedByPlatform = platform;
      this.status = 'synced';
      this.error = undefined;
      await this.backupToNativePreferences();
      this.notify();
      this.isProcessing = false;
      return true;
    } catch (err: any) {
      this.status = 'error';
      this.error = err.message || 'Push failed';
      this.notify();
      this.isProcessing = false;
      return false;
    }
  }
}

export const cloudSyncService = new CloudSyncService();
