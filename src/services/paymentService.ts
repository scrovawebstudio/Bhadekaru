import { dbStore } from '../lib/store';
import { RentCharge, Payment, PaymentMethod } from '../types/database.types';
import { generateReceiptNumber } from '../lib/utils';

export const rentService = {
  async getRentCharges(filterMonth?: string): Promise<RentCharge[]> {
    const state = dbStore.getState();
    const orgId = state.organization.id;
    let charges = state.rentCharges.filter((c) => c.organization_id === orgId);
    if (filterMonth) {
      charges = charges.filter((c) => c.billing_month === filterMonth);
    }
    return charges.sort((a, b) => new Date(b.billing_month).getTime() - new Date(a.billing_month).getTime());
  },

  async generateMonthlyChargesForActiveAgreements(billingMonth: string): Promise<number> {
    const state = dbStore.getState();
    let count = 0;

    dbStore.updateState((s) => {
      const existingCharges = s.rentCharges;
      const newCharges: RentCharge[] = [];

      s.agreements.filter((a) => a.is_active && a.organization_id === s.organization.id).forEach((agr) => {
        // Check if charge already generated for this agreement and month
        const alreadyGenerated = existingCharges.some(
          (c) => c.agreement_id === agr.id && c.billing_month === billingMonth
        );

        if (!alreadyGenerated) {
          const unit = s.units.find((u) => u.id === agr.unit_id);
          const property = s.properties.find((p) => p.id === agr.property_id);
          const tenant = s.tenants.find((t) => t.id === agr.tenant_id);

          const dueDay = String(agr.rent_due_day || 5).padStart(2, '0');
          const [year, month] = billingMonth.split('-');
          const dueDate = `${year}-${month}-${dueDay}`;

          newCharges.push({
            id: `rc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            organization_id: s.organization.id,
            agreement_id: agr.id,
            property_id: agr.property_id,
            property_name: property?.name || 'Property',
            unit_id: agr.unit_id,
            unit_number: unit?.unit_number || 'Unit',
            tenant_id: agr.tenant_id,
            tenant_name: tenant?.full_name || 'Tenant',
            billing_month: billingMonth,
            base_rent: agr.monthly_rent,
            maintenance_charge: unit?.maintenance_charge || 0,
            parking_charge: 0,
            late_fee: 0,
            other_charges: 0,
            total_amount: (agr.monthly_rent || 0) + (unit?.maintenance_charge || 0),
            paid_amount: 0,
            due_date: dueDate,
            status: 'due',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          count++;
        }
      });

      return {
        ...s,
        rentCharges: [...newCharges, ...s.rentCharges],
      };
    });

    return count;
  },
};

export const paymentService = {
  async getPayments(): Promise<Payment[]> {
    const state = dbStore.getState();
    const orgId = state.organization.id;
    return state.payments
      .filter((p) => p.organization_id === orgId)
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  },

  async getPaymentById(id: string): Promise<Payment | null> {
    const state = dbStore.getState();
    const orgId = state.organization.id;
    return state.payments.find((p) => p.id === id && p.organization_id === orgId) || null;
  },

  async recordPayment(payload: {
    tenant_id: string;
    property_id?: string;
    unit_id?: string;
    rent_charge_id?: string;
    amount: number;
    payment_date: string;
    payment_method: PaymentMethod;
    reference_number?: string;
    notes?: string;
  }): Promise<Payment> {
    const state = dbStore.getState();
    const tenant = state.tenants.find((t) => t.id === payload.tenant_id);
    const unit = payload.unit_id ? state.units.find((u) => u.id === payload.unit_id) : (
      tenant?.current_unit_id ? state.units.find((u) => u.id === tenant.current_unit_id) : undefined
    );
    const property = payload.property_id ? state.properties.find((p) => p.id === payload.property_id) : (
      unit?.property_id ? state.properties.find((p) => p.id === unit.property_id) : undefined
    );
    const agreement = state.agreements.find((a) => a.tenant_id === payload.tenant_id && a.is_active);

    // Identify target rent charge to update
    let targetChargeId = payload.rent_charge_id;
    if (!targetChargeId && payload.tenant_id) {
      const openCharge = state.rentCharges.find((rc) => 
        rc.tenant_id === payload.tenant_id && 
        rc.status !== 'paid' && 
        rc.status !== 'cancelled' && 
        rc.status !== 'waived'
      );
      if (openCharge) {
        targetChargeId = openCharge.id;
      }
    }

    const receiptNumber = generateReceiptNumber();
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      organization_id: state.organization.id,
      receipt_number: receiptNumber,
      rent_charge_id: targetChargeId,
      tenant_id: payload.tenant_id,
      tenant_name: tenant?.full_name || 'Tenant',
      property_id: payload.property_id || property?.id || unit?.property_id || '',
      property_name: property?.name || unit?.property_name || 'Property',
      unit_id: payload.unit_id || unit?.id || '',
      unit_number: unit?.unit_number || 'Unit',
      amount: Number(payload.amount),
      payment_date: payload.payment_date,
      payment_method: payload.payment_method,
      reference_number: payload.reference_number,
      notes: payload.notes,
      is_void: false,
      created_by: state.profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.updateState((s) => {
      // Update related rent charge if found, or create a paid charge so both tables reflect it immediately
      let updatedRentCharges = [...s.rentCharges];
      if (targetChargeId) {
        updatedRentCharges = updatedRentCharges.map((rc) => {
          if (rc.id === targetChargeId) {
            const newPaid = Number(rc.paid_amount || 0) + Number(payload.amount);
            const isFull = newPaid >= rc.total_amount;
            return {
              ...rc,
              paid_amount: newPaid,
              status: isFull ? 'paid' : 'partially_paid',
              updated_at: new Date().toISOString(),
            };
          }
          return rc;
        });
      } else if (payload.tenant_id) {
        const billingMonth = payload.payment_date.slice(0, 7);
        const existingForMonth = updatedRentCharges.find((rc) => rc.tenant_id === payload.tenant_id && rc.billing_month === billingMonth);
        if (existingForMonth) {
          updatedRentCharges = updatedRentCharges.map((rc) => {
            if (rc.id === existingForMonth.id) {
              const newPaid = Number(rc.paid_amount || 0) + Number(payload.amount);
              return {
                ...rc,
                paid_amount: newPaid,
                status: newPaid >= rc.total_amount ? 'paid' : 'partially_paid',
                updated_at: new Date().toISOString(),
              };
            }
            return rc;
          });
          newPayment.rent_charge_id = existingForMonth.id;
        } else {
          const directCharge: RentCharge = {
            id: `rc-${Date.now()}`,
            organization_id: s.organization.id,
            agreement_id: agreement?.id || 'agr-direct',
            tenant_id: payload.tenant_id,
            tenant_name: tenant?.full_name || 'Tenant',
            unit_id: payload.unit_id || unit?.id || '',
            unit_number: unit?.unit_number || 'Unit',
            property_id: payload.property_id || property?.id || '',
            property_name: property?.name || 'Property',
            billing_month: billingMonth,
            due_date: payload.payment_date,
            base_rent: Number(payload.amount),
            maintenance_charge: 0,
            parking_charge: 0,
            late_fee: 0,
            other_charges: 0,
            total_amount: Number(payload.amount),
            paid_amount: Number(payload.amount),
            status: 'paid' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          updatedRentCharges = [directCharge, ...updatedRentCharges];
          newPayment.rent_charge_id = directCharge.id;
        }
      }

      // Update landlord account stats
      const updatedAccounts = s.landlordAccounts.map((a) => {
        if (a.id === s.currentOrgId) {
          return {
            ...a,
            stats: {
              ...a.stats,
              monthly_collection_inr: (a.stats?.monthly_collection_inr || 0) + Number(payload.amount),
            },
          };
        }
        return a;
      });

      // Add notification and audit log
      const newNotification = {
        id: `notif-${Date.now()}`,
        organization_id: s.organization.id,
        type: 'payment_received' as const,
        title: `Payment Recorded: ₹${payload.amount.toLocaleString('en-IN')}`,
        message: `Received ₹${payload.amount.toLocaleString('en-IN')} from ${tenant?.full_name || 'tenant'} (${payload.payment_method.toUpperCase()}) - ${receiptNumber}`,
        link_url: `/payments`,
        is_read: false,
        channel: 'in_app' as const,
        created_at: new Date().toISOString(),
      };

      const newAuditLog = {
        id: `aud-${Date.now()}`,
        organization_id: s.organization.id,
        user_id: s.profile.id,
        user_name: s.profile.full_name,
        action: 'create' as const,
        entity_name: 'Payment',
        entity_id: newPayment.id,
        summary: `Recorded ₹${payload.amount.toLocaleString('en-IN')} payment for ${tenant?.full_name} (${receiptNumber})`,
        created_at: new Date().toISOString(),
      };

      return {
        ...s,
        payments: [newPayment, ...s.payments],
        rentCharges: updatedRentCharges,
        landlordAccounts: updatedAccounts,
        notifications: [newNotification, ...s.notifications],
        auditLogs: [newAuditLog, ...s.auditLogs],
      };
    });

    return newPayment;
  },

  async voidPayment(id: string, reason: string): Promise<void> {
    dbStore.updateState((s) => {
      const payment = s.payments.find((p) => p.id === id);
      if (!payment) return s;

      // Revert charge paid_amount if applicable
      let updatedRentCharges = s.rentCharges;
      if (payment.rent_charge_id) {
        updatedRentCharges = s.rentCharges.map((rc) => {
          if (rc.id === payment.rent_charge_id) {
            const newPaid = Math.max(0, Number(rc.paid_amount || 0) - Number(payment.amount));
            return {
              ...rc,
              paid_amount: newPaid,
              status: newPaid === 0 ? 'due' : 'partially_paid',
              updated_at: new Date().toISOString(),
            };
          }
          return rc;
        });
      }

      return {
        ...s,
        rentCharges: updatedRentCharges,
        payments: s.payments.map((p) =>
          p.id === id ? { ...p, is_void: true, void_reason: reason, updated_at: new Date().toISOString() } : p
        ),
      };
    });
  },
};
