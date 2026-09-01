import {
  Organization,
  Profile,
  Property,
  PropertyUnit,
  Tenant,
  RentalAgreement,
  RentCharge,
  Payment,
  SecurityDeposit,
  DepositTransaction,
  MaintenanceRequest,
  Vendor,
  Expense,
  AppDocument,
  Reminder,
  AppNotification,
  SubscriptionPlan,
  Subscription,
  AuditLog
} from '../types/database.types';

const STORAGE_KEY = 'bhadekaru_db_state_v1';

// Seed Initial Data
const SEED_PROFILE: Profile = {
  id: 'usr-1001',
  email: 'landlord@bhadekaru.app',
  full_name: 'Rajesh Patil',
  phone: '+91 98230 45678',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SEED_ORG: Organization = {
  id: 'org-2001',
  name: 'Patil Real Estate & Rentals',
  owner_id: 'usr-1001',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  onboarding_completed: true,
  onboarding_units_managed: '6–20',
  onboarding_property_types: ['Flats', 'Shops'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    tier: 'free',
    name: 'Free',
    monthly_price_inr: 0,
    annual_price_inr: 0,
    max_active_units: 1,
    max_properties: 1,
    max_members: 1,
    features: ['1 Active Unit', 'Rent & Payment Tracking', 'Basic Reminders', 'Standard Dashboard'],
    is_active: true,
  },
  {
    id: 'plan-starter',
    tier: 'starter',
    name: 'Starter',
    monthly_price_inr: 99,
    annual_price_inr: 999,
    max_active_units: 5,
    max_properties: 3,
    max_members: 1,
    features: ['Up to 5 Active Units', 'Rental Agreements', 'Document Vault', 'Maintenance & Expenses', 'Automated Reminders', 'Standard Reports'],
    is_active: true,
  },
  {
    id: 'plan-growth',
    tier: 'growth',
    name: 'Growth',
    monthly_price_inr: 249,
    annual_price_inr: 2490,
    max_active_units: 20,
    max_properties: 10,
    max_members: 2,
    features: ['Up to 20 Active Units', 'Everything in Starter', 'Advanced Reports & CSV Export', 'Tenant Notifications', 'Move-In/Move-Out Inspections', 'WhatsApp-Ready Formats'],
    is_active: true,
  },
  {
    id: 'plan-pro',
    tier: 'professional',
    name: 'Professional',
    monthly_price_inr: 499,
    annual_price_inr: 4990,
    max_active_units: 50,
    max_properties: 50,
    max_members: 5,
    features: ['Up to 50 Active Units', 'Everything in Growth', 'Multiple Property Managers', 'Advanced Profitability Analytics', 'Priority Support', 'Full Audit Logs'],
    is_active: true,
  },
];

const SEED_SUBSCRIPTION: Subscription = {
  id: 'sub-3001',
  organization_id: 'org-2001',
  plan_id: 'plan-pro',
  status: 'trialing',
  trial_start: new Date().toISOString(),
  trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  cancel_at_period_end: false,
  payment_provider: 'razorpay_ready',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SEED_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    organization_id: 'org-2001',
    name: 'Shree Residency',
    type: 'apartment',
    status: 'active',
    address_line1: 'Plot 42, Baner Road',
    address_line2: 'Near D-Mart, Baner',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411045',
    country: 'IN',
    purchase_date: '2021-03-15',
    purchase_price: 18500000,
    current_valuation: 22000000,
    notes: 'Premium residential apartment building with 4 residential flats and elevator.',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prop-2',
    organization_id: 'org-2001',
    name: 'Sai Commercial Complex',
    type: 'shop',
    status: 'active',
    address_line1: 'Shop 101-103, FC Road',
    address_line2: 'Shivajinagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411005',
    country: 'IN',
    purchase_date: '2019-08-10',
    purchase_price: 14000000,
    current_valuation: 17500000,
    notes: 'High-footfall commercial shop units on main road.',
    created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_UNITS: PropertyUnit[] = [
  {
    id: 'unit-1',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_number: 'Flat A-101',
    floor_number: 1,
    area_sqft: 950,
    bedrooms: 2,
    bathrooms: 2,
    furnishing: 'fully_furnished',
    monthly_rent: 22000,
    security_deposit: 60000,
    maintenance_charge: 2000,
    parking_included: true,
    status: 'occupied',
    notes: 'Includes 2 ACs, modular kitchen and geysers.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'unit-2',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_number: 'Flat A-102',
    floor_number: 1,
    area_sqft: 650,
    bedrooms: 1,
    bathrooms: 1,
    furnishing: 'semi_furnished',
    monthly_rent: 16000,
    security_deposit: 45000,
    maintenance_charge: 1500,
    parking_included: true,
    status: 'occupied',
    notes: 'Wardrobes, lights and fans installed.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'unit-3',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_number: 'Flat A-201',
    floor_number: 2,
    area_sqft: 1200,
    bedrooms: 3,
    bathrooms: 3,
    furnishing: 'fully_furnished',
    monthly_rent: 32000,
    security_deposit: 90000,
    maintenance_charge: 2500,
    parking_included: true,
    status: 'occupied',
    notes: 'Spacious 3BHK with terrace balcony.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'unit-4',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_number: 'Flat A-202',
    floor_number: 2,
    area_sqft: 950,
    bedrooms: 2,
    bathrooms: 2,
    furnishing: 'semi_furnished',
    monthly_rent: 21000,
    security_deposit: 60000,
    maintenance_charge: 2000,
    parking_included: false,
    status: 'vacant',
    notes: 'Freshly painted, ready for immediate tenant move-in.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'unit-5',
    organization_id: 'org-2001',
    property_id: 'prop-2',
    property_name: 'Sai Commercial Complex',
    unit_number: 'Shop G-01',
    floor_number: 0,
    area_sqft: 400,
    bedrooms: 0,
    bathrooms: 1,
    furnishing: 'unfurnished',
    monthly_rent: 28000,
    security_deposit: 100000,
    maintenance_charge: 1000,
    parking_included: false,
    status: 'occupied',
    notes: 'Front facing commercial glass-front shop.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_TENANTS: Tenant[] = [
  {
    id: 'ten-1',
    organization_id: 'org-2001',
    full_name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul.sharma@techcorp.in',
    emergency_contact_name: 'Sunil Sharma (Father)',
    emergency_contact_phone: '+91 98111 22334',
    permanent_address: '14, Civil Lines, Jaipur, Rajasthan 302006',
    occupation: 'Senior Software Engineer',
    company_name: 'Infosys Ltd',
    occupants_count: 2,
    vehicle_details: 'Honda City (MH 12 AB 4590)',
    is_active: true,
    current_unit_id: 'unit-1',
    current_property_id: 'prop-1',
    current_property_name: 'Shree Residency',
    current_unit_number: 'Flat A-101',
    notes: 'Very punctual with rent. IT professional with family.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ten-2',
    organization_id: 'org-2001',
    full_name: 'Priya Deshmukh',
    phone: '+91 97654 32109',
    email: 'priya.deshmukh@gmail.com',
    emergency_contact_name: 'Kavita Deshmukh (Mother)',
    emergency_contact_phone: '+91 98222 55667',
    permanent_address: 'Flat 4, Sharda Society, Kolhapur 416001',
    occupation: 'Financial Analyst',
    company_name: 'Deloitte India',
    occupants_count: 1,
    vehicle_details: 'TVS Jupiter (MH 12 CD 1234)',
    is_active: true,
    current_unit_id: 'unit-2',
    current_property_id: 'prop-1',
    current_property_name: 'Shree Residency',
    current_unit_number: 'Flat A-102',
    notes: 'Single working woman, polite and quiet.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ten-3',
    organization_id: 'org-2001',
    full_name: 'Amit Verma',
    phone: '+91 96543 21098',
    email: 'amit.verma@globaltech.com',
    emergency_contact_name: 'Neelam Verma (Wife)',
    emergency_contact_phone: '+91 98333 44556',
    permanent_address: 'B-201, Golf Links, Noida, UP 201301',
    occupation: 'VP Product Management',
    company_name: 'GlobalTech Solutions',
    occupants_count: 3,
    vehicle_details: 'Hyundai Creta (MH 14 EF 9876)',
    is_active: true,
    current_unit_id: 'unit-3',
    current_property_id: 'prop-1',
    current_property_name: 'Shree Residency',
    current_unit_number: 'Flat A-201',
    notes: 'Family of 3. Excellent tenant.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ten-4',
    organization_id: 'org-2001',
    full_name: 'Vikram Joshi (QuickBites Cafe)',
    phone: '+91 95432 10987',
    email: 'vikram@quickbites.in',
    emergency_contact_name: 'Anand Joshi (Brother)',
    emergency_contact_phone: '+91 98444 77889',
    permanent_address: '22, Sadashiv Peth, Pune 411030',
    occupation: 'Business Owner',
    company_name: 'QuickBites Cafe Franchise',
    occupants_count: 4,
    vehicle_details: 'Commercial Van (MH 12 XY 3322)',
    is_active: true,
    current_unit_id: 'unit-5',
    current_property_id: 'prop-2',
    current_property_name: 'Sai Commercial Complex',
    current_unit_number: 'Shop G-01',
    notes: 'Running a boutique takeaway cafe. 3-year commercial lease.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_AGREEMENTS: RentalAgreement[] = [
  {
    id: 'agr-1',
    organization_id: 'org-2001',
    agreement_number: 'AGR-2026-081',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-1',
    unit_number: 'Flat A-101',
    tenant_id: 'ten-1',
    tenant_name: 'Rahul Sharma',
    start_date: '2026-01-01',
    end_date: '2026-11-30',
    monthly_rent: 22000,
    security_deposit: 60000,
    rent_due_day: 5,
    grace_period_days: 5,
    late_fee_amount: 500,
    lock_in_months: 6,
    notice_period_days: 30,
    annual_escalation_percent: 5,
    is_active: true,
    notes: 'Registered agreement. 11 months standard format.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agr-2',
    organization_id: 'org-2001',
    agreement_number: 'AGR-2026-092',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-2',
    unit_number: 'Flat A-102',
    tenant_id: 'ten-2',
    tenant_name: 'Priya Deshmukh',
    start_date: '2025-10-01',
    end_date: '2026-09-15', // Expiring in ~14 days
    monthly_rent: 16000,
    security_deposit: 45000,
    rent_due_day: 1,
    grace_period_days: 3,
    late_fee_amount: 300,
    lock_in_months: 6,
    notice_period_days: 30,
    annual_escalation_percent: 5,
    is_active: true,
    notes: 'Expiring soon! Needs renewal discussion.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agr-3',
    organization_id: 'org-2001',
    agreement_number: 'AGR-2026-104',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-3',
    unit_number: 'Flat A-201',
    tenant_id: 'ten-3',
    tenant_name: 'Amit Verma',
    start_date: '2026-03-01',
    end_date: '2027-02-28',
    monthly_rent: 32000,
    security_deposit: 90000,
    rent_due_day: 10,
    grace_period_days: 5,
    late_fee_amount: 1000,
    lock_in_months: 6,
    notice_period_days: 60,
    annual_escalation_percent: 7,
    is_active: true,
    notes: 'Registered notarized agreement.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agr-4',
    organization_id: 'org-2001',
    agreement_number: 'AGR-2025-442',
    property_id: 'prop-2',
    property_name: 'Sai Commercial Complex',
    unit_id: 'unit-5',
    unit_number: 'Shop G-01',
    tenant_id: 'ten-4',
    tenant_name: 'Vikram Joshi (QuickBites Cafe)',
    start_date: '2025-06-01',
    end_date: '2028-05-31',
    monthly_rent: 28000,
    security_deposit: 100000,
    rent_due_day: 1,
    grace_period_days: 5,
    late_fee_amount: 1500,
    lock_in_months: 12,
    notice_period_days: 90,
    annual_escalation_percent: 10,
    is_active: true,
    notes: '36-month commercial lease with 10% annual escalation.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_RENT_CHARGES: RentCharge[] = [
  {
    id: 'rc-1',
    organization_id: 'org-2001',
    agreement_id: 'agr-1',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-1',
    unit_number: 'Flat A-101',
    tenant_id: 'ten-1',
    tenant_name: 'Rahul Sharma',
    billing_month: '2026-09-01',
    base_rent: 22000,
    maintenance_charge: 2000,
    parking_charge: 0,
    late_fee: 0,
    other_charges: 0,
    total_amount: 24000,
    paid_amount: 24000,
    due_date: '2026-09-05',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rc-2',
    organization_id: 'org-2001',
    agreement_id: 'agr-2',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-2',
    unit_number: 'Flat A-102',
    tenant_id: 'ten-2',
    tenant_name: 'Priya Deshmukh',
    billing_month: '2026-09-01',
    base_rent: 16000,
    maintenance_charge: 1500,
    parking_charge: 0,
    late_fee: 0,
    other_charges: 0,
    total_amount: 17500,
    paid_amount: 0,
    due_date: '2026-09-01',
    status: 'due',
    notes: 'Due today, reminder generated.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rc-3',
    organization_id: 'org-2001',
    agreement_id: 'agr-3',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-3',
    unit_number: 'Flat A-201',
    tenant_id: 'ten-3',
    tenant_name: 'Amit Verma',
    billing_month: '2026-09-01',
    base_rent: 32000,
    maintenance_charge: 2500,
    parking_charge: 0,
    late_fee: 0,
    other_charges: 0,
    total_amount: 34500,
    paid_amount: 0,
    due_date: '2026-09-10',
    status: 'upcoming',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rc-4',
    organization_id: 'org-2001',
    agreement_id: 'agr-4',
    property_id: 'prop-2',
    property_name: 'Sai Commercial Complex',
    unit_id: 'unit-5',
    unit_number: 'Shop G-01',
    tenant_id: 'ten-4',
    tenant_name: 'Vikram Joshi (QuickBites Cafe)',
    billing_month: '2026-08-01', // Overdue from August
    base_rent: 28000,
    maintenance_charge: 1000,
    parking_charge: 0,
    late_fee: 1500,
    other_charges: 0,
    total_amount: 30500,
    paid_amount: 10000,
    due_date: '2026-08-01',
    status: 'overdue',
    notes: 'Partial payment of ₹10,000 made on Aug 15. Remaining ₹20,500 overdue.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    organization_id: 'org-2001',
    receipt_number: 'RCP-2026-7782',
    rent_charge_id: 'rc-1',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-1',
    unit_number: 'Flat A-101',
    tenant_id: 'ten-1',
    tenant_name: 'Rahul Sharma',
    amount: 24000,
    payment_date: '2026-09-01',
    payment_method: 'upi',
    reference_number: 'UPI/229045890123/HDFC',
    notes: 'September rent & maintenance paid via GooglePay.',
    is_void: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pay-2',
    organization_id: 'org-2001',
    receipt_number: 'RCP-2026-6541',
    rent_charge_id: 'rc-4',
    property_id: 'prop-2',
    property_name: 'Sai Commercial Complex',
    unit_id: 'unit-5',
    unit_number: 'Shop G-01',
    tenant_id: 'ten-4',
    tenant_name: 'Vikram Joshi (QuickBites Cafe)',
    amount: 10000,
    payment_date: '2026-08-15',
    payment_method: 'bank_transfer',
    reference_number: 'NEFT/N123490812/ICICI',
    notes: 'Partial payment for August.',
    is_void: false,
    created_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pay-3',
    organization_id: 'org-2001',
    receipt_number: 'RCP-2026-5120',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-3',
    unit_number: 'Flat A-201',
    tenant_id: 'ten-3',
    tenant_name: 'Amit Verma',
    amount: 34500,
    payment_date: '2026-08-08',
    payment_method: 'bank_transfer',
    reference_number: 'IMPS/60981244567/SBI',
    notes: 'August rent & society charges paid on time.',
    is_void: false,
    created_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_DEPOSITS: SecurityDeposit[] = [
  {
    id: 'dep-1',
    organization_id: 'org-2001',
    agreement_id: 'agr-1',
    tenant_id: 'ten-1',
    tenant_name: 'Rahul Sharma',
    unit_id: 'unit-1',
    unit_number: 'Flat A-101',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    agreed_amount: 60000,
    collected_amount: 60000,
    deductions_amount: 0,
    refunded_amount: 0,
    balance_amount: 60000,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dep-2',
    organization_id: 'org-2001',
    agreement_id: 'agr-2',
    tenant_id: 'ten-2',
    tenant_name: 'Priya Deshmukh',
    unit_id: 'unit-2',
    unit_number: 'Flat A-102',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    agreed_amount: 45000,
    collected_amount: 45000,
    deductions_amount: 0,
    refunded_amount: 0,
    balance_amount: 45000,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dep-3',
    organization_id: 'org-2001',
    agreement_id: 'agr-3',
    tenant_id: 'ten-3',
    tenant_name: 'Amit Verma',
    unit_id: 'unit-3',
    unit_number: 'Flat A-201',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    agreed_amount: 90000,
    collected_amount: 90000,
    deductions_amount: 0,
    refunded_amount: 0,
    balance_amount: 90000,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dep-4',
    organization_id: 'org-2001',
    agreement_id: 'agr-4',
    tenant_id: 'ten-4',
    tenant_name: 'Vikram Joshi (QuickBites Cafe)',
    unit_id: 'unit-5',
    unit_number: 'Shop G-01',
    property_id: 'prop-2',
    property_name: 'Sai Commercial Complex',
    agreed_amount: 100000,
    collected_amount: 100000,
    deductions_amount: 0,
    refunded_amount: 0,
    balance_amount: 100000,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_DEPOSIT_TRANSACTIONS: DepositTransaction[] = [
  {
    id: 'dt-1',
    organization_id: 'org-2001',
    deposit_id: 'dep-1',
    transaction_type: 'collection',
    amount: 60000,
    transaction_date: '2026-01-01',
    category: 'initial_deposit',
    notes: 'Received full security deposit via NEFT at move-in.',
    created_at: new Date().toISOString(),
  },
];

const SEED_VENDORS: Vendor[] = [
  {
    id: 'ven-1',
    organization_id: 'org-2001',
    name: 'Sanjay Shinde (Plumbing)',
    service_type: 'Plumber',
    phone: '+91 98220 11223',
    address: 'Baner Gavthan, Pune',
    rating: 4.8,
    notes: 'Reliable for pipe leaks, taps, and geyser fittings.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ven-2',
    organization_id: 'org-2001',
    name: 'Mahesh Electricals',
    service_type: 'Electrician',
    phone: '+91 98233 44556',
    address: 'Aundh Road, Pune',
    rating: 4.9,
    notes: 'Wiring, MCB tripping, fan installation.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ven-3',
    organization_id: 'org-2001',
    name: 'CoolAir AC Solutions',
    service_type: 'AC Technician',
    phone: '+91 97660 77889',
    address: 'Shivajinagar, Pune',
    rating: 4.7,
    notes: 'Split AC servicing and gas refills.',
    created_at: new Date().toISOString(),
  },
];

const SEED_MAINTENANCE: MaintenanceRequest[] = [
  {
    id: 'mnt-1',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-2',
    unit_number: 'Flat A-102',
    tenant_id: 'ten-2',
    tenant_name: 'Priya Deshmukh',
    vendor_id: 'ven-1',
    vendor_name: 'Sanjay Shinde (Plumbing)',
    title: 'Bathroom tap leaking continuously',
    description: 'Master bathroom washbasin faucet valve is worn out and dripping water.',
    priority: 'medium',
    status: 'assigned',
    estimated_cost: 650,
    actual_cost: 0,
    reported_date: '2026-08-30',
    notes: 'Plumber scheduled for today 4 PM.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mnt-2',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-4',
    unit_number: 'Flat A-202',
    title: 'Vacant unit deep cleaning & touch-up paint',
    description: 'Prepare flat A-202 for new tenant showing.',
    priority: 'low',
    status: 'completed',
    estimated_cost: 3500,
    actual_cost: 3200,
    reported_date: '2026-08-20',
    completed_date: '2026-08-25',
    notes: 'Cleaning and wall touchups finished.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mnt-3',
    organization_id: 'org-2001',
    property_id: 'prop-2',
    property_name: 'Sai Commercial Complex',
    unit_id: 'unit-5',
    unit_number: 'Shop G-01',
    tenant_id: 'ten-4',
    tenant_name: 'Vikram Joshi (QuickBites Cafe)',
    vendor_id: 'ven-2',
    vendor_name: 'Mahesh Electricals',
    title: 'Main MCB switch heating issue',
    description: 'High load from coffee machine causing MCB switch to get hot.',
    priority: 'high',
    status: 'in_progress',
    estimated_cost: 1800,
    actual_cost: 0,
    reported_date: '2026-08-31',
    notes: 'Upgrading to 40A industrial breaker.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-4',
    unit_number: 'Flat A-202',
    category: 'repairs',
    amount: 3200,
    expense_date: '2026-08-25',
    description: 'Deep cleaning & paint touchup for unit A-202',
    notes: 'Paid cash to contractor with voucher receipt.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    category: 'society',
    amount: 6000,
    expense_date: '2026-08-05',
    description: 'Quarterly society elevator and security maintenance pool',
    notes: 'Paid via cheque to Shree CHS.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exp-3',
    organization_id: 'org-2001',
    property_id: 'prop-2',
    property_name: 'Sai Commercial Complex',
    category: 'property_tax',
    amount: 14500,
    expense_date: '2026-07-20',
    description: 'PMC Annual Commercial Property Tax H1',
    notes: 'PMC online receipt #TAX-2026-8891',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_DOCUMENTS: AppDocument[] = [
  {
    id: 'doc-1',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-1',
    unit_number: 'Flat A-101',
    tenant_id: 'ten-1',
    tenant_name: 'Rahul Sharma',
    name: 'Aadhaar Card — Rahul Sharma.pdf',
    category: 'tenant_kyc',
    storage_path: 'tenant-documents/ten-1/aadhaar.pdf',
    file_size_bytes: 1048576,
    mime_type: 'application/pdf',
    notes: 'Verified Aadhaar KYC.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-2',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-1',
    unit_number: 'Flat A-101',
    tenant_id: 'ten-1',
    tenant_name: 'Rahul Sharma',
    name: 'Registered Rent Agreement (AGR-2026-081).pdf',
    category: 'rental_agreement',
    storage_path: 'agreements/agr-1.pdf',
    file_size_bytes: 2450000,
    mime_type: 'application/pdf',
    expiry_date: '2026-11-30',
    notes: 'Govt e-registered agreement.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-3',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    name: 'Property Insurance Policy 2026.pdf',
    category: 'insurance',
    storage_path: 'property-documents/prop-1/insurance.pdf',
    file_size_bytes: 1890000,
    mime_type: 'application/pdf',
    expiry_date: '2026-09-12', // Expiring in 11 days
    notes: 'HDFC ERGO Building Insurance.',
    created_at: new Date().toISOString(),
  },
];

const SEED_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    unit_id: 'unit-2',
    unit_number: 'Flat A-102',
    tenant_id: 'ten-2',
    tenant_name: 'Priya Deshmukh',
    title: 'Agreement Renewal Discussion — Priya Deshmukh',
    description: 'Agreement expires on 15th Sep. Check if she plans to extend for another 11 months.',
    remind_date: '2026-09-02',
    remind_time: '10:00',
    repeat_interval: 'none',
    is_completed: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'rem-2',
    organization_id: 'org-2001',
    property_id: 'prop-2',
    property_name: 'Sai Commercial Complex',
    unit_id: 'unit-5',
    unit_number: 'Shop G-01',
    tenant_id: 'ten-4',
    tenant_name: 'Vikram Joshi (QuickBites Cafe)',
    title: 'Collect pending August rent balance ₹20,500',
    description: 'Follow up with Vikram for remaining ₹20,500 due from August rent.',
    remind_date: '2026-09-03',
    remind_time: '11:30',
    repeat_interval: 'none',
    is_completed: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'rem-3',
    organization_id: 'org-2001',
    property_id: 'prop-1',
    property_name: 'Shree Residency',
    title: 'Renew Shree Residency Building Insurance',
    description: 'Policy expires on 12th Sep with HDFC ERGO.',
    remind_date: '2026-09-05',
    remind_time: '14:00',
    repeat_interval: 'none',
    is_completed: false,
    created_at: new Date().toISOString(),
  },
];

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    organization_id: 'org-2001',
    type: 'rent_overdue',
    title: '₹20,500 Rent Overdue',
    message: 'Vikram Joshi (Shop G-01) has an outstanding balance of ₹20,500 from August.',
    link_url: '/payments?filter=overdue',
    is_read: false,
    channel: 'in_app',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    organization_id: 'org-2001',
    type: 'rent_due_soon',
    title: 'Rent Due Today — Priya Deshmukh',
    message: '₹17,500 for Flat A-102 (Shree Residency) is due today.',
    link_url: '/payments',
    is_read: false,
    channel: 'in_app',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-3',
    organization_id: 'org-2001',
    type: 'agreement_expiry',
    title: 'Agreement Expiring in 14 Days',
    message: 'Rental Agreement for Priya Deshmukh (Flat A-102) expires on 15 Sep 2026.',
    link_url: '/agreements',
    is_read: false,
    channel: 'in_app',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-4',
    organization_id: 'org-2001',
    type: 'maintenance_update',
    title: 'Maintenance Assigned',
    message: 'Bathroom tap leak in Flat A-102 assigned to Sanjay Shinde.',
    link_url: '/maintenance',
    is_read: true,
    channel: 'in_app',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    organization_id: 'org-2001',
    user_id: 'usr-1001',
    user_name: 'Rajesh Patil',
    action: 'create',
    entity_name: 'Payment',
    entity_id: 'pay-1',
    summary: 'Recorded ₹24,000 rent payment for Rahul Sharma (RCP-2026-7782)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'aud-2',
    organization_id: 'org-2001',
    user_id: 'usr-1001',
    user_name: 'Rajesh Patil',
    action: 'update',
    entity_name: 'MaintenanceRequest',
    entity_id: 'mnt-1',
    summary: 'Assigned plumber Sanjay Shinde to Flat A-102 maintenance ticket',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export interface DBState {
  profile: Profile;
  organization: Organization;
  subscription: Subscription;
  properties: Property[];
  units: PropertyUnit[];
  tenants: Tenant[];
  agreements: RentalAgreement[];
  rentCharges: RentCharge[];
  payments: Payment[];
  deposits: SecurityDeposit[];
  depositTransactions: DepositTransaction[];
  vendors: Vendor[];
  maintenance: MaintenanceRequest[];
  expenses: Expense[];
  documents: AppDocument[];
  reminders: Reminder[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
}

class LocalDBStore {
  private state: DBState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DBState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }

    const defaultState: DBState = {
      profile: SEED_PROFILE,
      organization: SEED_ORG,
      subscription: SEED_SUBSCRIPTION,
      properties: SEED_PROPERTIES,
      units: SEED_UNITS,
      tenants: SEED_TENANTS,
      agreements: SEED_AGREEMENTS,
      rentCharges: SEED_RENT_CHARGES,
      payments: SEED_PAYMENTS,
      deposits: SEED_DEPOSITS,
      depositTransactions: SEED_DEPOSIT_TRANSACTIONS,
      vendors: SEED_VENDORS,
      maintenance: SEED_MAINTENANCE,
      expenses: SEED_EXPENSES,
      documents: SEED_DOCUMENTS,
      reminders: SEED_REMINDERS,
      notifications: SEED_NOTIFICATIONS,
      auditLogs: SEED_AUDIT_LOGS,
    };
    this.saveState(defaultState);
    return defaultState;
  }

  private saveState(state: DBState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  public getState(): DBState {
    return this.state;
  }

  public updateState(updater: (current: DBState) => DBState): DBState {
    this.state = updater(this.state);
    this.saveState(this.state);
    return this.state;
  }

  public resetToDefault(): DBState {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    return this.state;
  }

  public resetToSeed(): DBState {
    return this.resetToDefault();
  }

  public exportAllData(): DBState {
    return this.state;
  }

  public getDocuments(): AppDocument[] {
    return this.state.documents;
  }

  public createDocument(payload: Omit<AppDocument, 'id' | 'organization_id' | 'created_at'>): AppDocument {
    const property = payload.property_id ? this.state.properties.find((p) => p.id === payload.property_id) : undefined;
    const tenant = payload.tenant_id ? this.state.tenants.find((t) => t.id === payload.tenant_id) : undefined;
    const newDoc: AppDocument = {
      ...payload,
      id: `doc-${Date.now()}`,
      organization_id: this.state.organization.id,
      property_name: property?.name,
      tenant_name: tenant?.full_name,
      created_at: new Date().toISOString(),
    };
    this.updateState((s) => ({
      ...s,
      documents: [newDoc, ...s.documents],
    }));
    return newDoc;
  }

  public getReminders(): Reminder[] {
    return this.state.reminders;
  }

  public createReminder(payload: Omit<Reminder, 'id' | 'organization_id' | 'created_at'>): Reminder {
    const property = payload.property_id ? this.state.properties.find((p) => p.id === payload.property_id) : undefined;
    const tenant = payload.tenant_id ? this.state.tenants.find((t) => t.id === payload.tenant_id) : undefined;
    const newRem: Reminder = {
      ...payload,
      id: `rem-${Date.now()}`,
      organization_id: this.state.organization.id,
      property_name: property?.name,
      tenant_name: tenant?.full_name,
      created_at: new Date().toISOString(),
    };
    this.updateState((s) => ({
      ...s,
      reminders: [newRem, ...s.reminders],
    }));
    return newRem;
  }

  public completeReminder(id: string): Reminder {
    let completedRem: Reminder | undefined;
    this.updateState((s) => {
      const updated = s.reminders.map((r) => {
        if (r.id === id) {
          completedRem = { ...r, is_completed: true, completed_at: new Date().toISOString() };
          return completedRem;
        }
        return r;
      });
      return { ...s, reminders: updated };
    });
    return completedRem!;
  }
}

export const dbStore = new LocalDBStore();
