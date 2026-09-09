import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Property,
  PropertyUnit,
  Tenant,
  RentalAgreement,
  Payment,
  RentCharge,
  Expense,
  MaintenanceRequest,
  AppDocument,
  Reminder,
  SecurityDeposit,
  DepositTransaction,
  Profile,
  Organization,
  LandlordAccount,
  PlatformMetrics,
  BillingEvent,
} from '../types/database.types';
import { DBState } from '../lib/store';

export class SupabaseService {
  public isReady(): boolean {
    return Boolean(isSupabaseConfigured && supabase);
  }

  // ==========================================
  // PROFILE & ORGANIZATION
  // ==========================================

  async getProfile(userId: string): Promise<Profile | null> {
    if (!this.isReady()) return null;
    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[SupabaseService] getProfile error:', error.message);
      return null;
    }
    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    if (!this.isReady()) return null;
    const { data, error } = await supabase!
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    if (!this.isReady()) return null;
    const { data, error } = await supabase!
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .maybeSingle();

    if (error) {
      console.warn('[SupabaseService] getOrganization error:', error.message);
      return null;
    }
    return data;
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization | null> {
    if (!this.isReady()) return null;
    const { data, error } = await supabase!
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // ==========================================
  // FULL PORTFOLIO SYNC (POSTGRESQL SOURCE OF TRUTH)
  // ==========================================

  async loadPortfolioState(orgId: string): Promise<Partial<DBState> | null> {
    if (!this.isReady()) return null;

    try {
      const [
        orgRes,
        propsRes,
        unitsRes,
        tenantsRes,
        agreementsRes,
        paymentsRes,
        chargesRes,
        depositsRes,
        depositTxRes,
        maintenanceRes,
        expensesRes,
        documentsRes,
        remindersRes,
      ] = await Promise.all([
        supabase!.from('organizations').select('*').eq('id', orgId).maybeSingle(),
        supabase!.from('properties').select('*').eq('organization_id', orgId),
        supabase!.from('property_units').select('*').eq('organization_id', orgId),
        supabase!.from('tenants').select('*').eq('organization_id', orgId),
        supabase!.from('rental_agreements').select('*').eq('organization_id', orgId),
        supabase!.from('payments').select('*').eq('organization_id', orgId),
        supabase!.from('rent_charges').select('*').eq('organization_id', orgId),
        supabase!.from('security_deposits').select('*').eq('organization_id', orgId),
        supabase!.from('deposit_transactions').select('*').eq('organization_id', orgId),
        supabase!.from('maintenance_requests').select('*').eq('organization_id', orgId),
        supabase!.from('expenses').select('*').eq('organization_id', orgId),
        supabase!.from('documents').select('*').eq('organization_id', orgId),
        supabase!.from('reminders').select('*').eq('organization_id', orgId),
      ]);

      const stateSlice: Partial<DBState> = {};

      if (orgRes.data) {
        stateSlice.organization = orgRes.data;
      }
      if (propsRes.data) stateSlice.properties = propsRes.data;
      if (unitsRes.data) stateSlice.units = unitsRes.data;
      if (tenantsRes.data) stateSlice.tenants = tenantsRes.data;
      if (agreementsRes.data) stateSlice.agreements = agreementsRes.data;
      if (paymentsRes.data) stateSlice.payments = paymentsRes.data;
      if (chargesRes.data) stateSlice.rentCharges = chargesRes.data;
      if (depositsRes.data) stateSlice.deposits = depositsRes.data;
      if (depositTxRes.data) stateSlice.depositTransactions = depositTxRes.data;
      if (maintenanceRes.data) stateSlice.maintenance = maintenanceRes.data;
      if (expensesRes.data) stateSlice.expenses = expensesRes.data;
      if (documentsRes.data) stateSlice.documents = documentsRes.data;
      if (remindersRes.data) stateSlice.reminders = remindersRes.data;

      return stateSlice;
    } catch (err) {
      console.warn('[SupabaseService] loadPortfolioState failed:', err);
      return null;
    }
  }

  // Push individual entity changes or upserts to Supabase PostgreSQL
  async upsertEntity<T extends { id: string; organization_id?: string }>(
    table: string,
    entity: T
  ): Promise<T | null> {
    if (!this.isReady()) return null;

    const { data, error } = await supabase!
      .from(table)
      .upsert(entity)
      .select()
      .maybeSingle();

    if (error) {
      console.warn(`[SupabaseService] upsert on ${table} error:`, error.message);
      throw error;
    }
    return data;
  }

  async deleteEntity(table: string, id: string, orgId?: string): Promise<boolean> {
    if (!this.isReady()) return false;

    let query = supabase!.from(table).delete().eq('id', id);
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { error } = await query;
    if (error) {
      console.warn(`[SupabaseService] delete on ${table} error:`, error.message);
      return false;
    }
    return true;
  }

  // ==========================================
  // FILE STORAGE (VAULT / DOCUMENTS BUCKET)
  // ==========================================

  async uploadFileToStorage(
    bucket: string,
    filePath: string,
    file: File | Blob
  ): Promise<{ path: string; publicUrl?: string } | null> {
    if (!this.isReady()) return null;

    const { data, error } = await supabase!.storage.from(bucket).upload(filePath, file, {
      upsert: true,
    });

    if (error) {
      console.error('[SupabaseService] Storage upload error:', error.message);
      throw error;
    }

    const { data: publicData } = supabase!.storage.from(bucket).getPublicUrl(data.path);
    return {
      path: data.path,
      publicUrl: publicData?.publicUrl,
    };
  }

  // ==========================================
  // SUPER ADMIN & PLATFORM GOVERNANCE
  // ==========================================

  async adminGetLandlords(): Promise<LandlordAccount[]> {
    if (!this.isReady()) return [];

    // Try edge function if available, otherwise direct query on landlord_accounts table
    try {
      const { data, error } = await supabase!
        .from('landlord_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as LandlordAccount[];
      }
    } catch {
      // ignore
    }

    return [];
  }

  async adminSuspendLandlord(orgId: string, reason?: string): Promise<any> {
    if (!this.isReady()) return null;

    // Prefer Edge Function for administrative isolation
    try {
      const { data, error } = await supabase!.functions.invoke('admin-actions', {
        body: { action: 'suspend_landlord', orgId, reason },
      });
      if (!error && data) return data;
    } catch {
      // Fallback to direct table update if RLS allows super admin
    }

    const { data, error } = await supabase!
      .from('landlord_accounts')
      .update({
        is_suspended: true,
        status: 'suspended',
        suspension_reason: reason || 'Account suspended by administrator.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { success: true, landlord: data };
  }

  async adminActivateLandlord(orgId: string): Promise<any> {
    if (!this.isReady()) return null;

    try {
      const { data, error } = await supabase!.functions.invoke('admin-actions', {
        body: { action: 'activate_landlord', orgId },
      });
      if (!error && data) return data;
    } catch {
      // Fallback
    }

    const { data, error } = await supabase!
      .from('landlord_accounts')
      .update({
        is_suspended: false,
        status: 'active',
        suspension_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { success: true, landlord: data };
  }

  async adminChangePlan(orgId: string, planTier: string): Promise<any> {
    if (!this.isReady()) return null;

    try {
      const { data, error } = await supabase!.functions.invoke('admin-actions', {
        body: { action: 'change_plan', orgId, planTier },
      });
      if (!error && data) return data;
    } catch {
      // Fallback
    }

    const { data, error } = await supabase!
      .from('landlord_accounts')
      .update({
        plan_tier: planTier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { success: true, landlord: data };
  }

  async adminOverrideUnitLimit(orgId: string, customLimit: number): Promise<any> {
    if (!this.isReady()) return null;

    try {
      const { data, error } = await supabase!.functions.invoke('admin-actions', {
        body: { action: 'override_unit_limit', orgId, customLimit },
      });
      if (!error && data) return data;
    } catch {
      // Fallback
    }

    const { data, error } = await supabase!
      .from('landlord_accounts')
      .update({
        custom_unit_limit: customLimit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { success: true, landlord: data };
  }

  async adminExtendTrial(orgId: string, daysToAdd: number = 7): Promise<any> {
    if (!this.isReady()) return null;

    try {
      const { data, error } = await supabase!.functions.invoke('admin-actions', {
        body: { action: 'extend_trial', orgId, daysToAdd },
      });
      if (!error && data) return data;
    } catch {
      // Fallback
    }

    const newDate = new Date(Date.now() + daysToAdd * 86400000).toISOString();
    const { data, error } = await supabase!
      .from('landlord_accounts')
      .update({
        trial_end: newDate,
        current_period_end: newDate,
        status: 'trialing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { success: true, landlord: data };
  }
}

export const supabaseService = new SupabaseService();
