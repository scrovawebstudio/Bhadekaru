import { dbStore } from '../lib/store';
import { Profile, Organization } from '../types/database.types';

export const authService = {
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

  async login(email: string, password?: string): Promise<{ user: Profile; org: Organization }> {
    const state = dbStore.getState();
    return { user: state.profile, org: state.organization };
  },

  async register(email: string, password?: string, fullName?: string, phone?: string): Promise<{ user: Profile; org: Organization }> {
    if (fullName || email) {
      dbStore.updateState((s) => ({
        ...s,
        profile: {
          ...s.profile,
          full_name: fullName || s.profile.full_name,
          email: email || s.profile.email,
          phone: phone || s.profile.phone,
        },
      }));
    }
    const state = dbStore.getState();
    return { user: state.profile, org: state.organization };
  },

  async logout(): Promise<void> {
    // Session cleared
  },
};
