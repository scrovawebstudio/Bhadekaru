import { dbStore } from '../lib/store';
import { RentalAgreement, SecurityDeposit, DepositTransaction } from '../types/database.types';
import { generateAgreementNumber } from '../lib/utils';

export const agreementService = {
  async getAgreements(): Promise<RentalAgreement[]> {
    const state = dbStore.getState();
    return state.agreements;
  },

  async createAgreement(payload: Omit<RentalAgreement, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<RentalAgreement> {
    const state = dbStore.getState();
    const unit = state.units.find((u) => u.id === payload.unit_id);
    const property = state.properties.find((p) => p.id === payload.property_id);
    const tenant = state.tenants.find((t) => t.id === payload.tenant_id);

    const newAgreement: RentalAgreement = {
      ...payload,
      id: `agr-${Date.now()}`,
      organization_id: state.organization.id,
      agreement_number: payload.agreement_number || generateAgreementNumber(),
      property_name: property?.name || unit?.property_name,
      unit_number: unit?.unit_number,
      tenant_name: tenant?.full_name,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => {
      // Mark unit as occupied
      const updatedUnits = s.units.map((u) => (u.id === payload.unit_id ? { ...u, status: 'occupied' as const } : u));
      
      // Create associated security deposit ledger entry
      const depositId = `dep-${Date.now()}`;
      const newDeposit: SecurityDeposit = {
        id: depositId,
        organization_id: s.organization.id,
        agreement_id: newAgreement.id,
        tenant_id: payload.tenant_id,
        tenant_name: tenant?.full_name,
        unit_id: payload.unit_id,
        unit_number: unit?.unit_number,
        property_id: payload.property_id,
        property_name: property?.name,
        agreed_amount: payload.security_deposit,
        collected_amount: payload.security_deposit, // Initially assume collected upon signing
        deductions_amount: 0,
        refunded_amount: 0,
        balance_amount: payload.security_deposit,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newDepositTx: DepositTransaction = {
        id: `dt-${Date.now()}`,
        organization_id: s.organization.id,
        deposit_id: depositId,
        transaction_type: 'collection',
        amount: payload.security_deposit,
        transaction_date: payload.start_date,
        category: 'initial_deposit',
        notes: 'Deposit collected upon agreement creation',
        created_at: new Date().toISOString(),
      };

      return {
        ...s,
        agreements: [newAgreement, ...s.agreements],
        units: updatedUnits,
        deposits: [newDeposit, ...s.deposits],
        depositTransactions: [newDepositTx, ...s.depositTransactions],
      };
    });

    return newAgreement;
  },

  async updateAgreement(id: string, updates: Partial<RentalAgreement>): Promise<RentalAgreement> {
    const state = dbStore.getState();
    const existing = state.agreements.find((a) => a.id === id);
    if (!existing) throw new Error('Agreement not found');

    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    dbStore.updateState((s) => ({
      ...s,
      agreements: s.agreements.map((a) => (a.id === id ? updated : a)),
    }));
    return updated;
  },
};

export const depositService = {
  async getDeposits(): Promise<SecurityDeposit[]> {
    return dbStore.getState().deposits;
  },

  async getDepositTransactions(depositId: string): Promise<DepositTransaction[]> {
    return dbStore.getState().depositTransactions.filter((tx) => tx.deposit_id === depositId);
  },

  async processMoveOutSettlement(payload: {
    deposit_id: string;
    pending_rent_deduction: number;
    utility_dues_deduction: number;
    damage_deduction: number;
    cleaning_deduction: number;
    notes?: string;
  }): Promise<void> {
    const state = dbStore.getState();
    const deposit = state.deposits.find((d) => d.id === payload.deposit_id);
    if (!deposit) throw new Error('Deposit not found');

    const totalDeductions =
      payload.pending_rent_deduction +
      payload.utility_dues_deduction +
      payload.damage_deduction +
      payload.cleaning_deduction;

    const refundAmount = Math.max(0, deposit.collected_amount - totalDeductions);

    dbStore.updateState((s) => {
      const txs: DepositTransaction[] = [];
      if (totalDeductions > 0) {
        txs.push({
          id: `dt-${Date.now()}-1`,
          organization_id: s.organization.id,
          deposit_id: deposit.id,
          transaction_type: 'deduction',
          amount: totalDeductions,
          transaction_date: new Date().toISOString().split('T')[0],
          category: 'damages',
          notes: `Deductions applied during move-out settlement: ${payload.notes || 'Damage/Utilities/Rent'}`,
          created_at: new Date().toISOString(),
        });
      }
      if (refundAmount > 0) {
        txs.push({
          id: `dt-${Date.now()}-2`,
          organization_id: s.organization.id,
          deposit_id: deposit.id,
          transaction_type: 'refund',
          amount: refundAmount,
          transaction_date: new Date().toISOString().split('T')[0],
          category: 'initial_deposit',
          notes: `Refunded net deposit balance to tenant`,
          created_at: new Date().toISOString(),
        });
      }

      // Mark unit as vacant & agreement as inactive
      const updatedUnits = s.units.map((u) => (u.id === deposit.unit_id ? { ...u, status: 'vacant' as const } : u));
      const updatedAgreements = s.agreements.map((a) => (a.id === deposit.agreement_id ? { ...a, is_active: false } : a));

      return {
        ...s,
        units: updatedUnits,
        agreements: updatedAgreements,
        deposits: s.deposits.map((d) =>
          d.id === deposit.id
            ? {
                ...d,
                deductions_amount: totalDeductions,
                refunded_amount: refundAmount,
                status: 'settled',
                updated_at: new Date().toISOString(),
              }
            : d
        ),
        depositTransactions: [...txs, ...s.depositTransactions],
      };
    });
  },
};
