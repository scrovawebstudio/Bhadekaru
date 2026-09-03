import { dbStore } from '../lib/store';
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
    return updated;
  },

  async suspendLandlord(id: string, reason: string): Promise<LandlordAccount> {
    return dbStore.suspendLandlord(id, reason);
  },

  async reactivateLandlord(id: string): Promise<LandlordAccount> {
    return dbStore.reactivateLandlord(id);
  },

  async extendTrial(id: string, daysToAdd: number = 7): Promise<LandlordAccount> {
    return dbStore.extendTrial(id, daysToAdd);
  },

  async changePlan(id: string, tier: PlanTier): Promise<LandlordAccount> {
    return dbStore.changeLandlordPlan(id, tier);
  },

  async overrideUnitLimit(id: string, customLimit: number): Promise<LandlordAccount> {
    return dbStore.overrideUnitLimit(id, customLimit);
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
