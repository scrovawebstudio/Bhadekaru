import { dbStore } from '../lib/store';
import { Tenant } from '../types/database.types';

export const tenantService = {
  async getTenants(): Promise<Tenant[]> {
    const state = dbStore.getState();
    const orgId = state.organization.id;
    return state.tenants
      .filter((t) => t.organization_id === orgId)
      .map((t) => {
        const agreement = state.agreements.find((a) => a.tenant_id === t.id && a.is_active && a.organization_id === orgId);
        const unit = agreement ? state.units.find((u) => u.id === agreement.unit_id && u.organization_id === orgId) : undefined;
        const property = unit ? state.properties.find((p) => p.id === unit.property_id && p.organization_id === orgId) : undefined;

        return {
          ...t,
          current_unit_id: unit?.id,
          current_unit_number: unit?.unit_number,
          current_property_id: property?.id,
          current_property_name: property?.name,
        };
      });
  },

  async getTenantById(id: string): Promise<Tenant | null> {
    const tenants = await this.getTenants();
    return tenants.find((t) => t.id === id) || null;
  },

  async createTenant(payload: Omit<Tenant, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<Tenant> {
    const state = dbStore.getState();
    const newTenant: Tenant = {
      ...payload,
      id: `ten-${Date.now()}`,
      organization_id: state.organization.id,
      is_active: payload.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      tenants: [newTenant, ...s.tenants],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          organization_id: s.organization.id,
          user_id: s.profile.id,
          user_name: s.profile.full_name,
          action: 'create',
          entity_name: 'Tenant',
          entity_id: newTenant.id,
          summary: `Added tenant ${newTenant.full_name} (${newTenant.phone})`,
          created_at: new Date().toISOString(),
        },
        ...s.auditLogs,
      ],
    }));

    return newTenant;
  },

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const state = dbStore.getState();
    const existing = state.tenants.find((t) => t.id === id);
    if (!existing) throw new Error('Tenant not found');

    const updated: Tenant = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => ({
      ...s,
      tenants: s.tenants.map((t) => (t.id === id ? updated : t)),
    }));

    return updated;
  },

  async deleteTenant(id: string): Promise<void> {
    dbStore.updateState((s) => ({
      ...s,
      tenants: s.tenants.filter((t) => t.id !== id),
    }));
  },
};
