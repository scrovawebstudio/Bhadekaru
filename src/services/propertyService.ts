import { dbStore } from '../lib/store';
import { Property, PropertyUnit, PropertyPhoto } from '../types/database.types';

export const propertyService = {
  async getProperties(): Promise<Property[]> {
    const state = dbStore.getState();
    return state.properties.map((p) => {
      const units = state.units.filter((u) => u.property_id === p.id);
      return {
        ...p,
        units,
      };
    });
  },

  async getPropertyById(id: string): Promise<Property | null> {
    const state = dbStore.getState();
    const prop = state.properties.find((p) => p.id === id);
    if (!prop) return null;
    const units = state.units.filter((u) => u.property_id === id).map((u) => {
      const agreement = state.agreements.find((a) => a.unit_id === u.id && a.is_active);
      const tenant = agreement ? state.tenants.find((t) => t.id === agreement.tenant_id) : undefined;
      return {
        ...u,
        active_agreement: agreement,
        active_tenant: tenant,
      };
    });
    return {
      ...prop,
      units,
    };
  },

  async createProperty(payload: Omit<Property, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<Property> {
    const state = dbStore.getState();
    const newProperty: Property = {
      ...payload,
      id: `prop-${Date.now()}`,
      organization_id: state.organization.id,
      status: payload.status || 'active',
      country: payload.country || 'IN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      properties: [newProperty, ...s.properties],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          organization_id: s.organization.id,
          user_id: s.profile.id,
          user_name: s.profile.full_name,
          action: 'create',
          entity_name: 'Property',
          entity_id: newProperty.id,
          summary: `Added new property "${newProperty.name}" in ${newProperty.city}`,
          created_at: new Date().toISOString(),
        },
        ...s.auditLogs,
      ],
    }));

    return newProperty;
  },

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
    const state = dbStore.getState();
    const existing = state.properties.find((p) => p.id === id);
    if (!existing) throw new Error('Property not found');

    const updated: Property = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      properties: s.properties.map((p) => (p.id === id ? updated : p)),
    }));

    return updated;
  },

  async deleteProperty(id: string): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      properties: s.properties.filter((p) => p.id !== id),
      units: s.units.filter((u) => u.property_id !== id),
    }));
  },

  // Units
  async getUnits(): Promise<PropertyUnit[]> {
    const state = dbStore.getState();
    return state.units.map((u) => {
      const agreement = state.agreements.find((a) => a.unit_id === u.id && a.is_active);
      const tenant = agreement ? state.tenants.find((t) => t.id === agreement.tenant_id) : undefined;
      const property = state.properties.find((p) => p.id === u.property_id);
      return {
        ...u,
        property_name: property?.name || u.property_name,
        active_agreement: agreement,
        active_tenant: tenant,
      };
    });
  },

  async createUnit(payload: Omit<PropertyUnit, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<PropertyUnit> {
    const state = dbStore.getState();
    const property = state.properties.find((p) => p.id === payload.property_id);
    const newUnit: PropertyUnit = {
      ...payload,
      id: `unit-${Date.now()}`,
      organization_id: state.organization.id,
      property_name: property?.name || 'Property',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      units: [...s.units, newUnit],
    }));

    return newUnit;
  },

  async updateUnit(id: string, updates: Partial<PropertyUnit>): Promise<PropertyUnit> {
    const state = dbStore.getState();
    const existing = state.units.find((u) => u.id === id);
    if (!existing) throw new Error('Unit not found');

    const updated: PropertyUnit = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      units: s.units.map((u) => (u.id === id ? updated : u)),
    }));

    return updated;
  },
};
