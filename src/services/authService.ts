import { Preferences } from '@capacitor/preferences';
import { dbStore } from '../lib/store';
import { Profile, Organization } from '../types/database.types';
import { apiService } from './apiService';

export interface AuthSession {
  userId: string;
  email: string;
  phone?: string;
  fullName: string;
  role: 'super_admin' | 'landlord' | 'manager';
  organizationId: string;
  organizationName: string;
  loginTime: string;
}

const SESSION_KEY = 'bhadekaru_current_auth_session';

export const authService = {
  // Sync reading of session for immediate rendering
  getCurrentSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Async reading from native Capacitor Preferences (Android SharedPreferences) + localStorage
  async getPersistentSession(): Promise<AuthSession | null> {
    try {
      const { value } = await Preferences.get({ key: SESSION_KEY });
      if (value) {
        return JSON.parse(value);
      }
    } catch {
      // ignore
    }
    return this.getCurrentSession();
  },

  async saveSessionLocally(session: AuthSession): Promise<void> {
    const json = JSON.stringify(session);
    localStorage.setItem(SESSION_KEY, json);
    try {
      await Preferences.set({ key: SESSION_KEY, value: json });
    } catch {
      // ignore
    }
  },

  async clearSessionLocally(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    try {
      await Preferences.remove({ key: SESSION_KEY });
    } catch {
      // ignore
    }
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentSession();
  },

  // Initialize session on app startup (Android and Web)
  // Keeps the user logged in across app close/reopen
  async initPersistentSession(): Promise<AuthSession | null> {
    await apiService.init();
    const session = await this.getPersistentSession();

    if (!session) {
      return null;
    }

    // Validate with backend API
    const validation = await apiService.validateSession();
    if (!validation.valid) {
      // If server explicitly declared session invalid, clear it
      await this.clearSessionLocally();
      return null;
    }

    // Keep localStorage in sync
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Restore store state
    if (session.role === 'super_admin') {
      dbStore.updateState((s) => ({
        ...s,
        currentRole: 'super_admin',
        currentOrgId: session.organizationId,
        organization: {
          id: session.organizationId,
          name: session.organizationName,
          owner_id: session.userId,
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          onboarding_completed: true,
          onboarding_units_managed: '0',
          onboarding_property_types: [],
          created_at: s.organization.created_at,
          updated_at: new Date().toISOString(),
        },
        profile: {
          id: session.userId,
          full_name: session.fullName,
          email: session.email,
          phone: session.phone || '+91 81498 62034',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          created_at: s.profile.created_at,
          updated_at: new Date().toISOString(),
        },
      }));
    } else {
      dbStore.switchOrganization(session.organizationId);

      // Attempt to load isolated server database state into store
      try {
        const remoteData = await apiService.getOrgData();
        if (remoteData && remoteData.properties) {
          dbStore.updateState((s) => ({
            ...s,
            ...remoteData,
            currentOrgId: session.organizationId,
            currentRole: 'landlord',
          }));
        }
      } catch {
        // use local cached store
      }
    }

    return session;
  },

  // 1. Check phone number before asking for password
  async lookupAccount(identifier: string) {
    return apiService.lookupAccount(identifier);
  },

  // 2. Strict login verified via backend API
  async login(identifier: string, password?: string): Promise<{ user: Profile; org: Organization; session: AuthSession }> {
    if (!password) {
      throw new Error('Password is required');
    }

    // Call backend API login endpoint
    const res = await apiService.login(identifier, password);
    const s = res.session;

    const session: AuthSession = {
      userId: s.userId,
      email: s.email,
      phone: s.phone,
      fullName: s.fullName,
      role: s.role,
      organizationId: s.organizationId,
      organizationName: s.organizationName,
      loginTime: s.createdAt || new Date().toISOString(),
    };

    // Save session persistently for Android & Web
    await this.saveSessionLocally(session);

    if (session.role === 'super_admin') {
      dbStore.updateState((st) => ({
        ...st,
        currentRole: 'super_admin',
        currentOrgId: session.organizationId,
        organization: {
          id: session.organizationId,
          name: session.organizationName,
          owner_id: session.userId,
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          onboarding_completed: true,
          onboarding_units_managed: '0',
          onboarding_property_types: [],
          created_at: st.organization.created_at,
          updated_at: new Date().toISOString(),
        },
        profile: {
          id: session.userId,
          full_name: session.fullName,
          email: session.email,
          phone: session.phone || '+91 81498 62034',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          created_at: st.profile.created_at,
          updated_at: new Date().toISOString(),
        },
      }));
      return { user: dbStore.getState().profile, org: dbStore.getState().organization, session };
    }

    // Switch landlord organization in store
    dbStore.switchOrganization(session.organizationId);

    // Try fetching fresh isolated data from server
    try {
      const remoteData = await apiService.getOrgData();
      if (remoteData && remoteData.properties) {
        dbStore.updateState((st) => ({
          ...st,
          ...remoteData,
          currentOrgId: session.organizationId,
          currentRole: 'landlord',
        }));
      }
    } catch {
      // ignore
    }

    const updatedState = dbStore.getState();
    return { user: updatedState.profile, org: updatedState.organization, session };
  },

  // 3. Register
  async register(
    email: string,
    password?: string,
    fullName?: string,
    phone?: string,
    orgName?: string
  ): Promise<{ user: Profile; org: Organization; session: AuthSession }> {
    const res = await apiService.register({
      email,
      password,
      fullName,
      phone,
      organizationName: orgName,
    });

    const s = res.session;
    const session: AuthSession = {
      userId: s.userId,
      email: s.email,
      phone: s.phone,
      fullName: s.fullName,
      role: s.role,
      organizationId: s.organizationId,
      organizationName: s.organizationName,
      loginTime: s.createdAt || new Date().toISOString(),
    };

    await this.saveSessionLocally(session);
    dbStore.registerLandlordAccount({
      fullName: session.fullName,
      email: session.email,
      phone: session.phone || '+91 98765 43210',
      password: password || 'DemoPassword123!',
      organizationName: session.organizationName,
      planTier: 'professional',
    });

    dbStore.switchOrganization(session.organizationId);
    const state = dbStore.getState();
    return { user: state.profile, org: state.organization, session };
  },

  async logout(): Promise<void> {
    await apiService.logout();
    await this.clearSessionLocally();
  },

  async getProfile(): Promise<Profile> {
    return dbStore.getState().profile;
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const updated = dbStore.updateState((state) => ({
      ...state,
      profile: {
        ...state.profile,
        ...updates,
        updated_at: new Date().toISOString(),
      },
    })).profile;
    // Persist to server
    apiService.saveOrgData(dbStore.getState()).catch(() => {});
    return updated;
  },

  async getOrganization(): Promise<Organization> {
    return dbStore.getState().organization;
  },

  async updateOrganization(updates: Partial<Organization>): Promise<Organization> {
    const updated = dbStore.updateState((state) => ({
      ...state,
      organization: {
        ...state.organization,
        ...updates,
        updated_at: new Date().toISOString(),
      },
    })).organization;
    // Persist to server
    apiService.saveOrgData(dbStore.getState()).catch(() => {});
    return updated;
  },

  async completeOnboarding(data: {
    unitsManaged: string;
    propertyTypes: string[];
    propertyName?: string;
    propertyType?: string;
    address?: string;
    city?: string;
  }): Promise<void> {
    dbStore.updateState((state) => {
      let properties = [...state.properties];
      let units = [...state.units];

      if (data.propertyName) {
        const newPropId = `prop-${Date.now()}`;
        const newProperty = {
          id: newPropId,
          organization_id: state.organization.id,
          name: data.propertyName,
          type: (data.propertyType?.toLowerCase() as any) || 'apartment',
          status: 'active' as const,
          address_line1: data.address || 'Main Road',
          city: data.city || 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'IN',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        properties.push(newProperty);

        // Add a starter unit
        units.push({
          id: `unit-${Date.now()}`,
          organization_id: state.organization.id,
          property_id: newPropId,
          property_name: data.propertyName,
          unit_number: 'Unit 101',
          furnishing: 'semi_furnished',
          monthly_rent: 15000,
          security_deposit: 45000,
          maintenance_charge: 1000,
          parking_included: true,
          status: 'vacant',
          bedrooms: 2,
          bathrooms: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      return {
        ...state,
        properties,
        units,
        organization: {
          ...state.organization,
          onboarding_completed: true,
          onboarding_units_managed: data.unitsManaged,
          onboarding_property_types: data.propertyTypes,
          updated_at: new Date().toISOString(),
        },
      };
    });

    apiService.saveOrgData(dbStore.getState()).catch(() => {});
  },
};
