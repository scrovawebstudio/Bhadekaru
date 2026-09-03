import { dbStore } from '../lib/store';
import { Profile, Organization, LandlordAccount } from '../types/database.types';

export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'landlord' | 'manager';
  organizationId: string;
  organizationName: string;
  loginTime: string;
}

const SESSION_KEY = 'bhadekaru_current_auth_session';

export const authService = {
  getCurrentSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentSession();
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
  },

  async login(email: string, password?: string): Promise<{ user: Profile; org: Organization; session: AuthSession }> {
    const cleanEmail = email.trim().toLowerCase();

    // Check for Super Admin account
    if (cleanEmail === 'admin@bhadekaru.app') {
      const state = dbStore.getState();
      const session: AuthSession = {
        userId: 'usr-admin',
        email: 'admin@bhadekaru.app',
        fullName: 'Super Admin',
        role: 'super_admin',
        organizationId: state.currentOrgId,
        organizationName: 'Platform Governance',
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { user: state.profile, org: state.organization, session };
    }

    // Find account in tenant directory
    let account = dbStore.findAccountByEmail(cleanEmail);

    if (!account) {
      // Fallback: check current profile or match by first name
      const state = dbStore.getState();
      if (state.profile.email.toLowerCase() === cleanEmail) {
        account = dbStore.getLandlordAccountById(state.currentOrgId);
      }
    }

    // If still not found, create a new landlord workspace for this user
    if (!account) {
      const nameFromEmail = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const capitalized = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      account = dbStore.registerLandlordAccount({
        fullName: capitalized || 'New Landlord',
        email: cleanEmail,
        phone: '+91 98000 00000',
        organizationName: `${capitalized}'s Real Estate`,
        planTier: 'professional',
      });
    }

    // Enforce SaaS Admin suspension check
    if (account.is_suspended || account.status === 'suspended') {
      throw new Error(
        `ACCOUNT_SUSPENDED: ${account.suspension_reason || 'This landlord account has been suspended by the platform administrator. Please contact admin@bhadekaru.app for assistance.'}`
      );
    }

    // Switch active organization context
    dbStore.switchOrganization(account.id);
    const updatedState = dbStore.getState();

    const session: AuthSession = {
      userId: account.owner_id,
      email: account.owner_email,
      fullName: account.owner_name,
      role: 'landlord',
      organizationId: account.id,
      organizationName: account.organization_name,
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { user: updatedState.profile, org: updatedState.organization, session };
  },

  async register(
    email: string,
    password?: string,
    fullName?: string,
    phone?: string,
    orgName?: string
  ): Promise<{ user: Profile; org: Organization; session: AuthSession }> {
    const cleanEmail = email.trim().toLowerCase();
    const existing = dbStore.findAccountByEmail(cleanEmail);

    if (existing) {
      throw new Error('An account with this email address already exists. Please log in instead.');
    }

    const account = dbStore.registerLandlordAccount({
      fullName: fullName || 'New Landlord',
      email: cleanEmail,
      phone: phone || '+91 98765 43210',
      organizationName: orgName || `${fullName || 'My'}'s Portfolio`,
      planTier: 'professional', // 7-day free trial on Pro tier
    });

    const state = dbStore.getState();
    const session: AuthSession = {
      userId: account.owner_id,
      email: account.owner_email,
      fullName: account.owner_name,
      role: 'landlord',
      organizationId: account.id,
      organizationName: account.organization_name,
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { user: state.profile, org: state.organization, session };
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  },
};
