export type UserRole = 'owner' | 'admin' | 'manager' | 'viewer';
export type PropertyType = 'apartment' | 'house' | 'shop' | 'office' | 'warehouse' | 'room' | 'pg' | 'other';
export type PropertyStatus = 'active' | 'archived' | 'draft';
export type UnitStatus = 'vacant' | 'occupied' | 'reserved' | 'notice_period' | 'maintenance';
export type UnitFurnishing = 'unfurnished' | 'semi_furnished' | 'fully_furnished';
export type PaymentStatus = 'upcoming' | 'due' | 'partially_paid' | 'paid' | 'overdue' | 'waived' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
export type MaintenanceStatus = 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type DocumentCategory = 'rental_agreement' | 'tenant_kyc' | 'property_document' | 'insurance' | 'tax_document' | 'bill' | 'receipt' | 'maintenance_doc' | 'other';
export type ExpenseCategory = 'repairs' | 'maintenance' | 'electricity' | 'water' | 'society' | 'property_tax' | 'insurance' | 'cleaning' | 'brokerage' | 'renovation' | 'other';
export type ReminderType = 'rent_collection' | 'agreement_expiry' | 'maintenance' | 'document_renewal' | 'inspection' | 'utility_bill' | 'tax_due' | 'general';
export type PlanTier = 'free' | 'starter' | 'growth' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
export type AuditAction = 'create' | 'update' | 'delete' | 'void' | 'archive' | 'login' | 'export';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  currency: string; // 'INR'
  timezone: string; // 'Asia/Kolkata'
  onboarding_completed: boolean;
  onboarding_units_managed?: string;
  onboarding_property_types?: string[];
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface SubscriptionPlan {
  id: string;
  tier: PlanTier;
  name: string;
  monthly_price_inr: number;
  annual_price_inr: number;
  max_active_units: number;
  max_properties: number;
  max_members: number;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_start: string;
  trial_end: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_provider: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  organization_id: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  purchase_date?: string;
  purchase_price?: number;
  current_valuation?: number;
  notes?: string;
  photos?: PropertyPhoto[];
  units?: PropertyUnit[];
  created_at: string;
  updated_at: string;
}

export interface PropertyPhoto {
  id: string;
  organization_id: string;
  property_id: string;
  storage_path: string;
  caption?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface PropertyUnit {
  id: string;
  organization_id: string;
  property_id: string;
  property_name?: string;
  unit_number: string;
  floor_number?: number;
  area_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing: UnitFurnishing;
  monthly_rent: number;
  security_deposit: number;
  maintenance_charge: number;
  parking_included: boolean;
  status: UnitStatus;
  notes?: string;
  active_tenant?: Tenant;
  active_agreement?: RentalAgreement;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  permanent_address?: string;
  occupation?: string;
  company_name?: string;
  occupants_count: number;
  vehicle_details?: string;
  is_active: boolean;
  notes?: string;
  current_unit_id?: string;
  current_property_id?: string;
  current_property_name?: string;
  current_unit_number?: string;
  created_at: string;
  updated_at: string;
}

export interface RentalAgreement {
  id: string;
  organization_id: string;
  agreement_number: string;
  property_id: string;
  property_name?: string;
  unit_id: string;
  unit_number?: string;
  tenant_id: string;
  tenant_name?: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  rent_due_day: number;
  grace_period_days: number;
  late_fee_amount: number;
  lock_in_months: number;
  notice_period_days: number;
  annual_escalation_percent: number;
  escalation_rate_percent?: number;
  lock_in_period_months?: number;
  police_verification_done?: boolean;
  document_storage_path?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RentCharge {
  id: string;
  organization_id: string;
  agreement_id: string;
  property_id: string;
  property_name?: string;
  unit_id: string;
  unit_number?: string;
  tenant_id: string;
  tenant_name?: string;
  billing_month: string; // YYYY-MM-01
  base_rent: number;
  maintenance_charge: number;
  parking_charge: number;
  late_fee: number;
  other_charges: number;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  receipt_number: string;
  rent_charge_id?: string;
  property_id: string;
  property_name?: string;
  unit_id: string;
  unit_number?: string;
  tenant_id: string;
  tenant_name?: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number?: string;
  receipt_pdf_path?: string;
  notes?: string;
  is_void: boolean;
  void_reason?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityDeposit {
  id: string;
  organization_id: string;
  agreement_id: string;
  tenant_id: string;
  tenant_name?: string;
  unit_id: string;
  unit_number?: string;
  property_id?: string;
  property_name?: string;
  agreed_amount: number;
  collected_amount: number;
  deductions_amount: number;
  refunded_amount: number;
  balance_amount: number;
  status: 'active' | 'settled';
  created_at: string;
  updated_at: string;
}

export interface DepositTransaction {
  id: string;
  organization_id: string;
  deposit_id: string;
  transaction_type: 'collection' | 'deduction' | 'refund';
  amount: number;
  transaction_date: string;
  category?: 'initial_deposit' | 'pending_rent' | 'damages' | 'cleaning' | 'utilities' | 'other';
  notes?: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  service_type: string;
  phone: string;
  address?: string;
  rating: number;
  notes?: string;
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  organization_id: string;
  property_id: string;
  property_name?: string;
  unit_id?: string;
  unit_number?: string;
  tenant_id?: string;
  tenant_name?: string;
  vendor_id?: string;
  vendor_name?: string;
  title: string;
  description?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  estimated_cost: number;
  actual_cost: number;
  reported_date: string;
  completed_date?: string;
  photos?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  property_id: string;
  property_name?: string;
  unit_id?: string;
  unit_number?: string;
  vendor_id?: string;
  vendor_name?: string;
  category: 'repairs' | 'maintenance' | 'electricity' | 'water' | 'society' | 'property_tax' | 'insurance' | 'cleaning' | 'brokerage' | 'renovation' | 'other';
  amount: number;
  expense_date: string;
  description: string;
  receipt_storage_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AppDocument {
  id: string;
  organization_id: string;
  property_id?: string;
  property_name?: string;
  unit_id?: string;
  unit_number?: string;
  tenant_id?: string;
  tenant_name?: string;
  name: string;
  category: DocumentCategory;
  storage_path: string;
  file_size_bytes?: number;
  mime_type?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  organization_id: string;
  property_id?: string;
  property_name?: string;
  unit_id?: string;
  unit_number?: string;
  tenant_id?: string;
  tenant_name?: string;
  title: string;
  type?: ReminderType;
  description?: string;
  remind_date: string;
  remind_time?: string;
  repeat_interval: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  organization_id: string;
  recipient_user_id?: string;
  type: 'rent_overdue' | 'rent_due_soon' | 'agreement_expiry' | 'maintenance_update' | 'reminder' | 'payment_received' | 'system';
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  channel: 'in_app' | 'email' | 'push' | 'whatsapp' | 'sms';
  created_at: string;
}

export interface Inspection {
  id: string;
  organization_id: string;
  unit_id: string;
  unit_number?: string;
  property_id?: string;
  property_name?: string;
  tenant_id: string;
  tenant_name?: string;
  agreement_id: string;
  inspection_type: 'move_in' | 'move_out';
  inspection_date: string;
  meter_readings: {
    electricity: string;
    water: string;
    gas: string;
  };
  checklist_items: Array<{
    item: string;
    status: 'good' | 'fair' | 'damaged' | 'missing';
    remarks?: string;
  }>;
  damages_noted?: string;
  keys_handed_over: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  user_name?: string;
  action: AuditAction;
  entity_name: string;
  entity_id: string;
  summary: string;
  created_at: string;
}
