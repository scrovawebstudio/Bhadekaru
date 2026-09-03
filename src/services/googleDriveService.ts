import { dbStore } from '../lib/store';

// Google Identity Services & Google Drive API Service
export const DEFAULT_GOOGLE_CLIENT_ID = '160839895946-ahahuk7vfl3e7jrslp80il8si56an89u.apps.googleusercontent.com';
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const FOLDER_NAME = 'Bhadekaru - Rental Manager Data';
const BACKUP_FILE_NAME = 'bhadekaru_portfolio_sync.json';

export function getCustomClientId(): string {
  return localStorage.getItem('bhadekaru_custom_google_client_id') || '';
}

export function setCustomClientId(clientId: string): void {
  if (!clientId || !clientId.trim()) {
    localStorage.removeItem('bhadekaru_custom_google_client_id');
  } else {
    localStorage.setItem('bhadekaru_custom_google_client_id', clientId.trim());
  }
}

export function getEffectiveClientId(): string {
  const custom = getCustomClientId();
  if (custom) return custom;
  const envVal = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (envVal && envVal.trim()) return envVal.trim();
  return DEFAULT_GOOGLE_CLIENT_ID;
}

export interface DriveSyncStatus {
  isConnected: boolean;
  isSandbox?: boolean;
  userEmail?: string;
  folderId?: string;
  folderLink?: string;
  lastSyncedAt?: string;
  isSyncing: boolean;
  error?: string;
  syncedItemCounts?: {
    properties: number;
    units: number;
    tenants: number;
    payments: number;
    documents: number;
  };
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private tokenClient: any = null;
  private isInitializing: boolean = false;
  private listeners: Set<(status: DriveSyncStatus) => void> = new Set();

  private status: DriveSyncStatus = {
    isConnected: false,
    isSyncing: false,
    lastSyncedAt: localStorage.getItem('bhadekaru_drive_last_synced') || undefined,
    folderId: localStorage.getItem('bhadekaru_drive_folder_id') || undefined,
    folderLink: localStorage.getItem('bhadekaru_drive_folder_link') || undefined,
    userEmail: localStorage.getItem('bhadekaru_drive_user_email') || undefined,
  };

  constructor() {
    // Restore token from session storage if still valid
    const savedToken = sessionStorage.getItem('bhadekaru_drive_access_token');
    const savedExp = sessionStorage.getItem('bhadekaru_drive_token_exp');
    if (savedToken && savedExp && Number(savedExp) > Date.now()) {
      this.accessToken = savedToken;
      this.tokenExpiresAt = Number(savedExp);
      this.status.isConnected = true;
    }
  }

  public subscribe(callback: (status: DriveSyncStatus) => void) {
    this.listeners.add(callback);
    callback(this.status);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.status });
    }
  }

  public getStatus(): DriveSyncStatus {
    return { ...this.status };
  }

  public isSandbox(): boolean {
    return !!this.status.isSandbox || localStorage.getItem('bhadekaru_drive_sandbox') === 'true';
  }

  public enableSandboxMode(enabled: boolean = true) {
    if (enabled) {
      localStorage.setItem('bhadekaru_drive_sandbox', 'true');
      this.status.isSandbox = true;
      this.status.isConnected = true;
      this.status.userEmail = 'dev-sandbox@bhadekaru.app (Local Sandbox)';
      this.status.folderId = 'sandbox-drive-folder';
      this.status.folderLink = 'https://drive.google.com/drive/folders/sandbox';
      this.status.error = undefined;
      localStorage.setItem('bhadekaru_drive_user_email', this.status.userEmail);
      localStorage.setItem('bhadekaru_drive_folder_id', 'sandbox-drive-folder');
      localStorage.setItem('bhadekaru_drive_folder_link', this.status.folderLink);
      this.notify();
    } else {
      localStorage.removeItem('bhadekaru_drive_sandbox');
      this.status.isSandbox = false;
      this.disconnect();
    }
  }

  public isConnected(): boolean {
    if (this.isSandbox()) return true;
    return !!this.accessToken && this.tokenExpiresAt > Date.now();
  }

  /**
   * Connect to Google Drive using Google Identity Services (GIS) token client popup
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected()) return true;

    if (this.isSandbox()) {
      this.enableSandboxMode(true);
      return true;
    }

    return new Promise((resolve, reject) => {
      try {
        if (!(window as any).google?.accounts?.oauth2) {
          throw new Error(
            'Google Identity Services script is not loaded. Please check your internet connection or browser ad-blocker.'
          );
        }

        const clientId = getEffectiveClientId();

        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: DRIVE_FILE_SCOPE,
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              let errorMsg = tokenResponse.error_description || tokenResponse.error;
              if (
                tokenResponse.error === 'origin_mismatch' ||
                String(errorMsg).toLowerCase().includes('origin_mismatch')
              ) {
                errorMsg = `Google OAuth Error 400 (origin_mismatch): The origin "${window.location.origin}" is not registered in Google Cloud Console under Authorized JavaScript origins. You do not have to host this app to fix this—simply add "${window.location.origin}" to your OAuth Client in Google Cloud Console.`;
              }
              this.status.error = errorMsg;
              this.notify();
              reject(new Error(errorMsg));
              return;
            }

            this.accessToken = tokenResponse.access_token;
            // GIS tokens generally expire in 3599 seconds (~1 hour)
            const expiresIn = (tokenResponse.expires_in ? Number(tokenResponse.expires_in) : 3600) * 1000;
            this.tokenExpiresAt = Date.now() + expiresIn - 60000; // 1 min buffer

            sessionStorage.setItem('bhadekaru_drive_access_token', this.accessToken!);
            sessionStorage.setItem('bhadekaru_drive_token_exp', String(this.tokenExpiresAt));

            this.status.isConnected = true;
            this.status.isSandbox = false;
            this.status.error = undefined;

            // Fetch user info & verify/create app folder in Drive
            try {
              await this.fetchUserInfo();
              const folder = await this.ensureAppFolder();
              this.status.folderId = folder.id;
              this.status.folderLink = folder.webViewLink;
              localStorage.setItem('bhadekaru_drive_folder_id', folder.id);
              if (folder.webViewLink) {
                localStorage.setItem('bhadekaru_drive_folder_link', folder.webViewLink);
              }
            } catch (err: any) {
              console.warn('Could not initialize folder automatically:', err);
            }

            this.notify();
            resolve(true);
          },
        });

        // Trigger Google OAuth popup
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        this.status.error = err?.message || 'Failed to initialize Google Drive sign-in';
        this.notify();
        reject(err);
      }
    });
  }

  public disconnect() {
    localStorage.removeItem('bhadekaru_drive_sandbox');
    if (this.accessToken && (window as any).google?.accounts?.oauth2) {
      try {
        (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {});
      } catch (e) {
        // ignore
      }
    }
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.status.isConnected = false;
    this.status.isSandbox = false;
    sessionStorage.removeItem('bhadekaru_drive_access_token');
    sessionStorage.removeItem('bhadekaru_drive_token_exp');
    localStorage.removeItem('bhadekaru_drive_user_email');
    localStorage.removeItem('bhadekaru_drive_folder_id');
    localStorage.removeItem('bhadekaru_drive_folder_link');
    this.notify();
  }

  private async fetchUserInfo(): Promise<void> {
    if (!this.accessToken) return;
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user?.emailAddress) {
          this.status.userEmail = data.user.emailAddress;
          localStorage.setItem('bhadekaru_drive_user_email', data.user.emailAddress);
        }
      }
    } catch (e) {
      console.warn('Could not fetch drive user info', e);
    }
  }

  /**
   * Finds or creates the dedicated root folder in Landlord's Google Drive
   */
  public async ensureAppFolder(): Promise<{ id: string; webViewLink?: string }> {
    if (!this.accessToken) {
      await this.connect();
    }

    // Check if folder exists
    const q = `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!searchRes.ok) {
      throw new Error(`Failed to query Google Drive: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const existing = searchData.files[0];
      return { id: existing.id, webViewLink: existing.webViewLink };
    }

    // Create folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Bhadekaru SaaS Rental Manager private landlord data and document vault',
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
    }

    const created = await createRes.json();
    return { id: created.id, webViewLink: created.webViewLink };
  }

  /**
   * Sync landlord's current properties, units, tenants, leases, payments to Google Drive
   */
  public async syncToDrive(): Promise<{ fileId: string; lastSyncedAt: string; counts: any }> {
    if (!this.isConnected()) {
      await this.connect();
    }

    this.status.isSyncing = true;
    this.notify();

    try {
      const state = dbStore.getState();
      const orgId = state.currentOrgId;

      // Extract records scoped to this landlord
      const orgProperties = state.properties.filter((p) => p.organization_id === orgId);
      const orgUnits = state.units.filter((u) => u.organization_id === orgId);
      const orgTenants = state.tenants.filter((t) => t.organization_id === orgId);
      const orgAgreements = state.agreements.filter((a) => a.organization_id === orgId);
      const orgRentCharges = state.rentCharges.filter((r) => r.organization_id === orgId);
      const orgPayments = state.payments.filter((p) => p.organization_id === orgId);
      const orgDeposits = state.deposits.filter((d) => d.organization_id === orgId);
      const orgExpenses = state.expenses.filter((e) => e.organization_id === orgId);
      const orgMaintenance = (state.maintenance || []).filter((m) => m.organization_id === orgId);
      const orgDocuments = state.documents.filter((d) => d.organization_id === orgId);
      const orgReminders = state.reminders.filter((r) => r.organization_id === orgId);

      const payload = {
        app: 'Bhadekaru Property & Tenant SaaS',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        landlordProfile: {
          id: state.profile.id,
          name: state.profile.full_name,
          email: state.profile.email,
          phone: state.profile.phone,
        },
        organization: {
          id: state.organization.id,
          name: state.organization.name,
          currency: state.organization.currency,
          timezone: state.organization.timezone,
        },
        subscriptionSnapshot: {
          tier: state.subscription?.plan_id,
          status: state.subscription?.status,
        },
        data: {
          properties: orgProperties,
          units: orgUnits,
          tenants: orgTenants,
          agreements: orgAgreements,
          rentCharges: orgRentCharges,
          payments: orgPayments,
          deposits: orgDeposits,
          expenses: orgExpenses,
          maintenance: orgMaintenance,
          documents: orgDocuments,
          reminders: orgReminders,
        },
        stats: {
          propertiesCount: orgProperties.length,
          unitsCount: orgUnits.length,
          tenantsCount: orgTenants.length,
          paymentsCount: orgPayments.length,
          documentsCount: orgDocuments.length,
        },
      };

      const fileContent = JSON.stringify(payload, null, 2);

      // Handle Sandbox Mode
      if (this.isSandbox()) {
        localStorage.setItem('bhadekaru_sandbox_drive_backup', fileContent);
        const now = new Date().toISOString();
        this.status.lastSyncedAt = now;
        this.status.syncedItemCounts = {
          properties: orgProperties.length,
          units: orgUnits.length,
          tenants: orgTenants.length,
          payments: orgPayments.length,
          documents: orgDocuments.length,
        };
        localStorage.setItem('bhadekaru_drive_last_synced', now);
        this.status.isSyncing = false;
        this.notify();
        return {
          fileId: 'sandbox-backup-file',
          lastSyncedAt: now,
          counts: this.status.syncedItemCounts,
        };
      }

      const folder = await this.ensureAppFolder();

      // Check if backup file already exists in folder
      const q = `name='${BACKUP_FILE_NAME}' and '${folder.id}' in parents and trashed=false`;
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      const searchData = await searchRes.json();
      const existingFile = searchData.files?.[0];

      let fileId = '';

      if (existingFile) {
        // Update existing file content
        const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        });

        if (!updateRes.ok) throw new Error('Failed to update Google Drive file');
        fileId = existingFile.id;
      } else {
        // Create new file with multipart upload (metadata + body)
        const metadata = {
          name: BACKUP_FILE_NAME,
          parents: [folder.id],
          mimeType: 'application/json',
          description: 'Bhadekaru complete landlord database backup & auto-sync snapshot',
        };

        const boundary = 'bhadekaru_multipart_boundary';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelim = `\r\n--${boundary}--`;

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          fileContent +
          closeDelim;

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        });

        if (!uploadRes.ok) throw new Error(`Google Drive upload failed: ${uploadRes.statusText}`);
        const uploaded = await uploadRes.json();
        fileId = uploaded.id;
      }

      const now = new Date().toISOString();
      this.status.lastSyncedAt = now;
      this.status.syncedItemCounts = {
        properties: orgProperties.length,
        units: orgUnits.length,
        tenants: orgTenants.length,
        payments: orgPayments.length,
        documents: orgDocuments.length,
      };

      localStorage.setItem('bhadekaru_drive_last_synced', now);
      this.status.isSyncing = false;
      this.notify();

      return {
        fileId,
        lastSyncedAt: now,
        counts: this.status.syncedItemCounts,
      };
    } catch (err: any) {
      this.status.isSyncing = false;
      this.status.error = err?.message || 'Sync to Google Drive failed';
      this.notify();
      throw err;
    }
  }

  /**
   * Pull and restore data from landlord's Google Drive backup file
   */
  public async restoreFromDrive(): Promise<{ restoredAt: string; stats: any }> {
    if (!this.isConnected()) {
      await this.connect();
    }

    this.status.isSyncing = true;
    this.notify();

    try {
      let payload: any = null;

      if (this.isSandbox()) {
        const backupStr = localStorage.getItem('bhadekaru_sandbox_drive_backup');
        if (backupStr) {
          payload = JSON.parse(backupStr);
        } else {
          throw new Error(
            'No sandbox backup found. Click "Sync Portfolio to Google Drive Now" to create a test backup first.'
          );
        }
      } else {
        const folder = await this.ensureAppFolder();
        const q = `name='${BACKUP_FILE_NAME}' and '${folder.id}' in parents and trashed=false`;
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
          {
            headers: { Authorization: `Bearer ${this.accessToken}` },
          }
        );

        const searchData = await searchRes.json();
        const existingFile = searchData.files?.[0];

        if (!existingFile) {
          throw new Error('No existing Bhadekaru backup file found in your Google Drive folder.');
        }

        // Download file content
        const downloadRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
          {
            headers: { Authorization: `Bearer ${this.accessToken}` },
          }
        );

        if (!downloadRes.ok) {
          throw new Error('Failed to download backup payload from Google Drive.');
        }

        payload = await downloadRes.json();
      }

      if (!payload || !payload.data) {
        throw new Error('Invalid backup file format.');
      }

      // Merge / restore into dbStore
      dbStore.updateState((s) => {
        const orgId = s.currentOrgId;
        // Keep other orgs intact, replace current org items with drive backup
        const filterOther = (list: any[]) => list.filter((item) => item.organization_id !== orgId);

        return {
          ...s,
          properties: [...filterOther(s.properties), ...(payload.data.properties || [])],
          units: [...filterOther(s.units), ...(payload.data.units || [])],
          tenants: [...filterOther(s.tenants), ...(payload.data.tenants || [])],
          agreements: [...filterOther(s.agreements), ...(payload.data.agreements || [])],
          rentCharges: [...filterOther(s.rentCharges), ...(payload.data.rentCharges || [])],
          payments: [...filterOther(s.payments), ...(payload.data.payments || [])],
          deposits: [...filterOther(s.deposits), ...(payload.data.deposits || [])],
          expenses: [...filterOther(s.expenses), ...(payload.data.expenses || [])],
          maintenance: [...filterOther(s.maintenance || []), ...(payload.data.maintenance || [])],
          documents: [...filterOther(s.documents), ...(payload.data.documents || [])],
          reminders: [...filterOther(s.reminders), ...(payload.data.reminders || [])],
        };
      });

      const now = new Date().toISOString();
      this.status.lastSyncedAt = now;
      this.status.isSyncing = false;
      this.notify();

      return {
        restoredAt: now,
        stats: payload.stats || {},
      };
    } catch (err: any) {
      this.status.isSyncing = false;
      this.status.error = err?.message || 'Restore from Google Drive failed';
      this.notify();
      throw err;
    }
  }

  /**
   * Upload an individual document/photo/agreement directly to the landlord's Drive
   */
  public async uploadFile(file: File | Blob, fileName: string, mimeType: string): Promise<DriveFileItem> {
    if (!this.isConnected()) {
      await this.connect();
    }

    if (this.isSandbox()) {
      return {
        id: `sandbox-doc-${Date.now()}`,
        name: fileName,
        mimeType: mimeType || 'application/pdf',
        size: String(file.size),
        modifiedTime: new Date().toISOString(),
        webViewLink: 'https://drive.google.com',
      };
    }

    const folder = await this.ensureAppFolder();

    const metadata = {
      name: fileName,
      parents: [folder.id],
      mimeType: mimeType || 'application/octet-stream',
    };

    const boundary = 'bhadekaru_file_upload_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const fileReader = new FileReader();
    const fileBase64Promise = new Promise<string>((resolve, reject) => {
      fileReader.onload = () => {
        const result = fileReader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      fileReader.onerror = reject;
      fileReader.readAsDataURL(file);
    });

    const fileBase64 = await fileBase64Promise;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      fileBase64 +
      closeDelim;

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,iconLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload file to Google Drive: ${uploadRes.statusText}`);
    }

    const item = await uploadRes.json();
    return item;
  }

  /**
   * List all files in the Landlord's Google Drive App folder
   */
  public async listDriveFiles(): Promise<DriveFileItem[]> {
    if (!this.isConnected()) {
      await this.connect();
    }

    if (this.isSandbox()) {
      return [
        {
          id: 'sandbox-1',
          name: BACKUP_FILE_NAME,
          mimeType: 'application/json',
          modifiedTime: this.status.lastSyncedAt || new Date().toISOString(),
          webViewLink: 'https://drive.google.com',
        },
        {
          id: 'sandbox-2',
          name: 'Lease_Agreement_Unit_101.pdf',
          mimeType: 'application/pdf',
          modifiedTime: new Date(Date.now() - 86400000).toISOString(),
          webViewLink: 'https://drive.google.com',
        },
        {
          id: 'sandbox-3',
          name: 'Tenant_Aadhaar_Suresh_Deshmukh.pdf',
          mimeType: 'application/pdf',
          modifiedTime: new Date(Date.now() - 172800000).toISOString(),
          webViewLink: 'https://drive.google.com',
        },
      ];
    }

    const folder = await this.ensureAppFolder();
    const q = `'${folder.id}' in parents and trashed=false`;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink)&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to list files in Google Drive folder: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * Direct Offline JSON Backup Export
   */
  public exportBackupJsonFile(): void {
    const state = dbStore.getState();
    const orgId = state.currentOrgId;
    const orgProperties = state.properties.filter((p) => p.organization_id === orgId);
    const orgUnits = state.units.filter((u) => u.organization_id === orgId);
    const orgTenants = state.tenants.filter((t) => t.organization_id === orgId);
    const orgAgreements = state.agreements.filter((a) => a.organization_id === orgId);
    const orgRentCharges = state.rentCharges.filter((r) => r.organization_id === orgId);
    const orgPayments = state.payments.filter((p) => p.organization_id === orgId);
    const orgDeposits = state.deposits.filter((d) => d.organization_id === orgId);
    const orgExpenses = state.expenses.filter((e) => e.organization_id === orgId);
    const orgMaintenance = (state.maintenance || []).filter((m) => m.organization_id === orgId);
    const orgDocuments = state.documents.filter((d) => d.organization_id === orgId);
    const orgReminders = state.reminders.filter((r) => r.organization_id === orgId);

    const payload = {
      app: 'Bhadekaru Property & Tenant SaaS',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      organization: state.organization,
      profile: state.profile,
      data: {
        properties: orgProperties,
        units: orgUnits,
        tenants: orgTenants,
        agreements: orgAgreements,
        rentCharges: orgRentCharges,
        payments: orgPayments,
        deposits: orgDeposits,
        expenses: orgExpenses,
        maintenance: orgMaintenance,
        documents: orgDocuments,
        reminders: orgReminders,
      },
      stats: {
        propertiesCount: orgProperties.length,
        unitsCount: orgUnits.length,
        tenantsCount: orgTenants.length,
        paymentsCount: orgPayments.length,
        documentsCount: orgDocuments.length,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhadekaru_vault_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Direct Offline JSON Backup Restore
   */
  public async importBackupJsonFile(file: File): Promise<{ success: boolean; stats: any }> {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (!payload.data) {
      throw new Error('Invalid Bhadekaru backup file format. Missing "data" section.');
    }
    const state = dbStore.getState();
    const orgId = state.currentOrgId;
    const filterOther = (arr: any[]) => arr.filter((x) => x.organization_id !== orgId);

    dbStore.updateState((s) => ({
      ...s,
      properties: [...filterOther(s.properties), ...(payload.data.properties || [])],
      units: [...filterOther(s.units), ...(payload.data.units || [])],
      tenants: [...filterOther(s.tenants), ...(payload.data.tenants || [])],
      agreements: [...filterOther(s.agreements), ...(payload.data.agreements || [])],
      rentCharges: [...filterOther(s.rentCharges), ...(payload.data.rentCharges || [])],
      payments: [...filterOther(s.payments), ...(payload.data.payments || [])],
      deposits: [...filterOther(s.deposits), ...(payload.data.deposits || [])],
      expenses: [...filterOther(s.expenses), ...(payload.data.expenses || [])],
      maintenance: [...filterOther(s.maintenance || []), ...(payload.data.maintenance || [])],
      documents: [...filterOther(s.documents), ...(payload.data.documents || [])],
      reminders: [...filterOther(s.reminders), ...(payload.data.reminders || [])],
    }));

    return {
      success: true,
      stats: {
        propertiesCount: payload.data.properties?.length || 0,
        tenantsCount: payload.data.tenants?.length || 0,
      },
    };
  }
}

export const googleDriveService = new GoogleDriveService();

