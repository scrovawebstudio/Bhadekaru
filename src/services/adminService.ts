import { dbStore } from '../lib/store';
import { supabaseService } from './supabaseService';
import {
  LandlordAccount,
  PlatformMetrics,
  BillingEvent,
  SubscriptionPlan,
  PlanTier,
  SubscriptionStatus
} from '../types/database.types';

export const adminService = {
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    return dbStore.getPlatformMetrics();
  },

  async getLandlordAccounts(): Promise<LandlordAccount[]> {
    const remote = await supabaseService.adminGetLandlords();
    if (remote && remote.length > 0) return remote;
    return dbStore.getLandlordAccounts();
  },

  async getLandlordAccountById(id: string): Promise<LandlordAccount | undefined> {
    return dbStore.getLandlordAccountById(id);
  },

  async updateLandlordSubscription(
    id: string,
    updates: Partial<LandlordAccount>
  ): Promise<LandlordAccount> {
    const updated = dbStore.updateLandlordSubscription(id, updates);
    supabaseService.upsertEntity('landlord_accounts', { ...updated, id }).catch(() => {});
    return updated;
  },

  async suspendLandlord(id: string, reason: string): Promise<LandlordAccount> {
    const updated = dbStore.suspendLandlord(id, reason);
    await supabaseService.adminSuspendLandlord(id, reason).catch(() => {});
    return updated;
  },

  async reactivateLandlord(id: string): Promise<LandlordAccount> {
    const updated = dbStore.reactivateLandlord(id);
    await supabaseService.adminActivateLandlord(id).catch(() => {});
    return updated;
  },

  async extendTrial(id: string, daysToAdd: number = 7): Promise<LandlordAccount> {
    const updated = dbStore.extendTrial(id, daysToAdd);
    await supabaseService.adminExtendTrial(id, daysToAdd).catch(() => {});
    return updated;
  },

  async changePlan(id: string, tier: PlanTier): Promise<LandlordAccount> {
    const updated = dbStore.changeLandlordPlan(id, tier);
    await supabaseService.adminChangePlan(id, tier).catch(() => {});
    return updated;
  },

  async overrideUnitLimit(id: string, customLimit: number): Promise<LandlordAccount> {
    const updated = dbStore.overrideUnitLimit(id, customLimit);
    await supabaseService.adminOverrideUnitLimit(id, customLimit).catch(() => {});
    return updated;
  },

  async getBillingEvents(): Promise<BillingEvent[]> {
    return dbStore.getBillingEvents();
  },

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return dbStore.getSubscriptionPlans();
  },

  async updateSubscriptionPlan(
    planId: string,
    updates: Partial<SubscriptionPlan>
  ): Promise<SubscriptionPlan> {
    return dbStore.updateSubscriptionPlan(planId, updates);
  },

  async switchOrganization(orgId: string): Promise<LandlordAccount | undefined> {
    return dbStore.switchOrganization(orgId);
  },

  async switchRole(role: 'super_admin' | 'landlord'): Promise<void> {
    dbStore.switchRole(role);
  },

  async checkUnitLimit(orgId?: string) {
    return dbStore.canAddUnit(orgId);
  },
};
