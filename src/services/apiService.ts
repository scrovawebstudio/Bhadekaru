import { authService } from './authService';
import { supabaseService } from './supabaseService';
import { cloudSyncService } from './cloudSyncService';
import { dbStore } from '../lib/store';

class ApiService {
  async init(): Promise<string | null> {
    const session = await authService.getPersistentSession();
    return session ? session.userId : null;
  }

  getToken(): string | null {
    const session = authService.getCurrentSession();
    return session ? session.userId : null;
  }

  async setToken(_token: string | null): Promise<void> {
    // Session token managed by authService & Supabase Auth
  }

  // 1. Phone number / Account lookup via Supabase
  async lookupAccount(identifier: string) {
    return authService.lookupAccount(identifier);
  }

  // 2. Strict login verified via Supabase Auth
  async login(identifier: string, password?: string) {
    const res = await authService.login(identifier, password);
    return {
      success: true,
      token: res.session.userId,
      session: res.session,
    };
  }

  // 3. Persistent session validation
  async validateSession(): Promise<{ valid: boolean; session?: any }> {
    const session = await authService.getPersistentSession();
    return {
      valid: !!session,
      session,
    };
  }

  // 4. Logout
  async logout(): Promise<void> {
    await authService.logout();
  }

  // 5. Landlord Register via Supabase Auth
  async register(payload: {
    email?: string;
    password?: string;
    fullName?: string;
    phone?: string;
    organizationName?: string;
  }) {
    const res = await authService.register(
      payload.email || '',
      payload.password,
      payload.fullName,
      payload.phone,
      payload.organizationName
    );
    return {
      success: true,
      token: res.session.userId,
      session: res.session,
    };
  }

  // ==========================================
  // SUPABASE POSTGRESQL CRUD & PORTFOLIO DATA
  // ==========================================

  async getOrgData(): Promise<any> {
    const state = dbStore.getState();
    const orgId = state.currentOrgId || state.organization.id;
    if (orgId) {
      const data = await supabaseService.loadPortfolioState(orgId);
      if (data) return data;
    }
    return state;
  }

  async saveOrgData(data: any): Promise<void> {
    await cloudSyncService.pushCurrentState();
  }

  async crudGet(collection: string): Promise<any[]> {
    const state = dbStore.getState() as any;
    return Array.isArray(state[collection]) ? state[collection] : [];
  }

  async crudCreate(collection: string, item: any): Promise<any> {
    const state = dbStore.getState();
    const orgId = state.currentOrgId || state.organization.id;
    const newItem = {
      ...item,
      id: item.id || `${collection.slice(0, 4)}-${Date.now()}`,
      organization_id: orgId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await supabaseService.upsertEntity(collection, newItem).catch(() => {});
    return newItem;
  }

  async crudUpdate(collection: string, id: string, updates: any): Promise<any> {
    const state = dbStore.getState();
    const orgId = state.currentOrgId || state.organization.id;
    const updated = {
      ...updates,
      id,
      organization_id: orgId,
      updated_at: new Date().toISOString(),
    };
    await supabaseService.upsertEntity(collection, updated).catch(() => {});
    return updated;
  }

  async crudDelete(collection: string, id: string): Promise<boolean> {
    const state = dbStore.getState();
    const orgId = state.currentOrgId || state.organization.id;
    return await supabaseService.deleteEntity(collection, id, orgId);
  }

  // ==========================================
  // SUPER ADMIN MANAGEMENT VIA SUPABASE
  // ==========================================

  async adminGetLandlords(): Promise<any[]> {
    const landlords = await supabaseService.adminGetLandlords();
    if (landlords && landlords.length > 0) return landlords;
    return dbStore.getLandlordAccounts();
  }

  async adminSuspendLandlord(orgId: string, reason?: string): Promise<any> {
    const res = await supabaseService.adminSuspendLandlord(orgId, reason);
    dbStore.suspendLandlord(orgId, reason || 'Suspended by admin');
    return res;
  }

  async adminActivateLandlord(orgId: string): Promise<any> {
    const res = await supabaseService.adminActivateLandlord(orgId);
    dbStore.reactivateLandlord(orgId);
    return res;
  }
}

export const apiService = new ApiService();
