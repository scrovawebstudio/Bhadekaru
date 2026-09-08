import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const TOKEN_KEY = 'bhadekaru_auth_token';
const SESSION_KEY = 'bhadekaru_current_auth_session';

class ApiService {
  private currentToken: string | null = null;

  private getApiUrl(path: string): string {
    const configuredUrl = (import.meta as any).env?.VITE_SERVER_URL?.trim();
    const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('bhadekaru_cloud_server_url') : null;
    const baseUrl = (savedUrl || configuredUrl || '').replace(/\/+$/, '');

    if (baseUrl) {
      return `${baseUrl}${path}`;
    }

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      return `http://10.0.2.2:3000${path}`;
    }

    return path;
  }

  async init(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: TOKEN_KEY });
      if (value) {
        this.currentToken = value;
        return value;
      }
    } catch {
      // ignore
    }
    const local = localStorage.getItem(TOKEN_KEY);
    if (local) {
      this.currentToken = local;
      return local;
    }
    return null;
  }

  getToken(): string | null {
    if (this.currentToken) return this.currentToken;
    return localStorage.getItem(TOKEN_KEY);
  }

  async setToken(token: string | null): Promise<void> {
    this.currentToken = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      try {
        await Preferences.set({ key: TOKEN_KEY, value: token });
      } catch {
        // ignore
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      try {
        await Preferences.remove({ key: TOKEN_KEY });
      } catch {
        // ignore
      }
    }
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-session-token'] = token;
    }
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (rawSession) {
      try {
        const s = JSON.parse(rawSession);
        if (s.organizationId) {
          headers['x-org-id'] = s.organizationId;
        }
      } catch {
        // ignore
      }
    }
    return headers;
  }

  // 1. Phone number / Account lookup
  async lookupAccount(identifier: string): Promise<{
    exists: boolean;
    role?: 'super_admin' | 'landlord';
    title?: string;
    subtitle?: string;
    name?: string;
    orgName?: string;
    phone?: string;
    email?: string;
    isSuspended?: boolean;
    suspensionReason?: string;
    message?: string;
  }> {
    const res = await fetch(this.getApiUrl('/api/auth/lookup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to check account');
    }
    return res.json();
  }

  // 2. Strict login verified via backend API
  async login(
    identifier: string,
    password: string
  ): Promise<{
    success: boolean;
    token: string;
    session: any;
    message?: string;
  }> {
    const res = await fetch(this.getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials or login failed');
    }
    if (data.token) {
      await this.setToken(data.token);
    }
    return data;
  }

  // 3. Persistent session validation
  async validateSession(token?: string): Promise<{ valid: boolean; session?: any }> {
    const t = token || this.getToken();
    if (!t) return { valid: false };

    try {
      const res = await fetch(this.getApiUrl('/api/auth/session'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
          'x-session-token': t,
        },
      });
      if (res.ok) {
        return res.json();
      }
      return { valid: false };
    } catch {
      // offline fallback: allow stored local session
      return { valid: true };
    }
  }

  // 4. Logout
  async logout(): Promise<void> {
    try {
      await fetch(this.getApiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // ignore
    }
    await this.setToken(null);
  }

  // 5. Landlord Register
  async register(payload: {
    email?: string;
    password?: string;
    fullName?: string;
    phone?: string;
    organizationName?: string;
  }): Promise<{ success: boolean; token: string; session: any }> {
    const res = await fetch(this.getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    if (data.token) {
      await this.setToken(data.token);
    }
    return data;
  }

  // ==========================================
  // ISOLATED DATABASE CRUD OPERATIONS
  // ==========================================

  async getOrgData(): Promise<any> {
    const res = await fetch(this.getApiUrl('/api/data/org'), {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load organization data');
    const json = await res.json();
    return json.data;
  }

  async saveOrgData(data: any): Promise<void> {
    const res = await fetch(this.getApiUrl('/api/data/org'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });
    if (!res.ok) throw new Error('Failed to save organization data');
  }

  async crudGet(collection: string): Promise<any[]> {
    const res = await fetch(this.getApiUrl(`/api/crud/${collection}`), {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  }

  async crudCreate(collection: string, item: any): Promise<any> {
    const res = await fetch(this.getApiUrl(`/api/crud/${collection}`), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error(`Failed to create item in ${collection}`);
    const json = await res.json();
    return json.item;
  }

  async crudUpdate(collection: string, id: string, updates: any): Promise<any> {
    const res = await fetch(this.getApiUrl(`/api/crud/${collection}/${id}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Failed to update item ${id} in ${collection}`);
    const json = await res.json();
    return json.item;
  }

  async crudDelete(collection: string, id: string): Promise<boolean> {
    const res = await fetch(this.getApiUrl(`/api/crud/${collection}/${id}`), {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  // Admin APIs
  async adminGetLandlords(): Promise<any[]> {
    const res = await fetch(this.getApiUrl('/api/admin/landlords'), {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load landlords');
    const json = await res.json();
    return json.landlords || [];
  }

  async adminSuspendLandlord(orgId: string, reason?: string): Promise<any> {
    const res = await fetch(this.getApiUrl(`/api/admin/landlords/${orgId}/suspend`), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to suspend landlord');
    return res.json();
  }

  async adminActivateLandlord(orgId: string): Promise<any> {
    const res = await fetch(this.getApiUrl(`/api/admin/landlords/${orgId}/activate`), {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to activate landlord');
    return res.json();
  }
}

export const apiService = new ApiService();
