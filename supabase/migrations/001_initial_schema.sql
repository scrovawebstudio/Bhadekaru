-- ==========================================================
-- BHADEKARU SAAS — SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- Complete Data Model, RLS Policies, Triggers & Storage Buckets
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 1. ENUMS
-- ==========================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'landlord', 'manager');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('apartment', 'independent_house', 'villa', 'commercial', 'pg_coliving', 'plot_land');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE unit_status AS ENUM ('vacant', 'occupied', 'under_maintenance', 'reserved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE furnishing_type AS ENUM ('unfurnished', 'semi_furnished', 'fully_furnished');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('upi', 'bank_transfer', 'cash', 'cheque', 'credit_card', 'debit_card');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE charge_status AS ENUM ('pending', 'partially_paid', 'paid', 'overdue', 'waived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('reported', 'in_progress', 'resolved', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE document_category AS ENUM ('agreement', 'id_proof', 'police_verification', 'electricity_bill', 'property_tax', 'receipt', 'photo', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==========================================================
-- 2. USER PROFILES & ORGANIZATIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'landlord',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id TEXT PRIMARY KEY DEFAULT ('org-' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_units_managed TEXT,
  onboarding_property_types TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id TEXT PRIMARY KEY DEFAULT ('mem-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.landlord_accounts (
  id TEXT PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  owner_id UUID,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Pune',
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  plan_tier TEXT NOT NULL DEFAULT 'professional',
  plan_name TEXT NOT NULL DEFAULT 'Professional Plan (7-Day Trial)',
  status TEXT NOT NULL DEFAULT 'trialing',
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspension_reason TEXT,
  trial_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '7 days'),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '7 days'),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  max_units_allowed INTEGER NOT NULL DEFAULT 50,
  custom_unit_limit INTEGER,
  mrr_inr NUMERIC NOT NULL DEFAULT 0,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- 3. CORE PORTFOLIO TABLES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY DEFAULT ('prop-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'apartment',
  status TEXT NOT NULL DEFAULT 'active',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL DEFAULT 'Pune',
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL DEFAULT '411001',
  country TEXT NOT NULL DEFAULT 'IN',
  latitude NUMERIC,
  longitude NUMERIC,
  purchase_date DATE,
  purchase_price NUMERIC,
  current_valuation NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_units (
  id TEXT PRIMARY KEY DEFAULT ('unit-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  floor_number INTEGER,
  area_sqft NUMERIC,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  furnishing TEXT NOT NULL DEFAULT 'semi_furnished',
  monthly_rent NUMERIC NOT NULL DEFAULT 10000,
  security_deposit NUMERIC NOT NULL DEFAULT 30000,
  maintenance_charge NUMERIC NOT NULL DEFAULT 0,
  parking_included BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'vacant',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenants (
  id TEXT PRIMARY KEY DEFAULT ('ten-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  permanent_address TEXT,
  occupation TEXT,
  company_name TEXT,
  occupants_count INTEGER DEFAULT 1,
  vehicle_details TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  current_unit_id TEXT,
  current_property_id TEXT,
  current_property_name TEXT,
  current_unit_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rental_agreements (
  id TEXT PRIMARY KEY DEFAULT ('agr-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agreement_number TEXT NOT NULL,
  property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  unit_id TEXT NOT NULL REFERENCES public.property_units(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC NOT NULL,
  security_deposit NUMERIC NOT NULL,
  rent_due_day INTEGER NOT NULL DEFAULT 5,
  grace_period_days INTEGER NOT NULL DEFAULT 3,
  late_fee_amount NUMERIC NOT NULL DEFAULT 0,
  lock_in_months INTEGER DEFAULT 6,
  notice_period_days INTEGER DEFAULT 30,
  annual_escalation_percent NUMERIC DEFAULT 5,
  police_verification_done BOOLEAN DEFAULT false,
  document_storage_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT ('pay-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  rent_charge_id TEXT,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'upi',
  reference_number TEXT,
  receipt_pdf_path TEXT,
  notes TEXT,
  is_void BOOLEAN NOT NULL DEFAULT false,
  void_reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rent_charges (
  id TEXT PRIMARY KEY DEFAULT ('chg-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agreement_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  billing_month TEXT NOT NULL,
  base_rent NUMERIC NOT NULL,
  maintenance_charge NUMERIC NOT NULL DEFAULT 0,
  parking_charge NUMERIC NOT NULL DEFAULT 0,
  late_fee NUMERIC NOT NULL DEFAULT 0,
  other_charges NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_deposits (
  id TEXT PRIMARY KEY DEFAULT ('dep-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agreement_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  agreed_amount NUMERIC NOT NULL,
  collected_amount NUMERIC NOT NULL DEFAULT 0,
  deductions_amount NUMERIC NOT NULL DEFAULT 0,
  refunded_amount NUMERIC NOT NULL DEFAULT 0,
  balance_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_collection',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deposit_transactions (
  id TEXT PRIMARY KEY DEFAULT ('dtx-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deposit_id TEXT NOT NULL REFERENCES public.security_deposits(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id TEXT PRIMARY KEY DEFAULT ('mnt-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  unit_id TEXT,
  unit_number TEXT,
  tenant_id TEXT,
  tenant_name TEXT,
  vendor_id TEXT,
  vendor_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'reported',
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_date DATE,
  photos TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY DEFAULT ('exp-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  unit_id TEXT,
  unit_number TEXT,
  vendor_id TEXT,
  vendor_name TEXT,
  category TEXT NOT NULL DEFAULT 'maintenance',
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  receipt_storage_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY DEFAULT ('doc-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id TEXT,
  property_name TEXT,
  unit_id TEXT,
  unit_number TEXT,
  tenant_id TEXT,
  tenant_name TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id TEXT PRIMARY KEY DEFAULT ('rem-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id TEXT,
  property_name TEXT,
  unit_id TEXT,
  unit_number TEXT,
  tenant_id TEXT,
  tenant_name TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'rent_due',
  description TEXT,
  remind_date DATE NOT NULL,
  remind_time TEXT,
  repeat_interval TEXT NOT NULL DEFAULT 'none',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY DEFAULT ('ven-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  rating NUMERIC DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  name TEXT NOT NULL,
  price_monthly_inr NUMERIC NOT NULL,
  price_annual_inr NUMERIC NOT NULL,
  max_properties INTEGER NOT NULL,
  max_units INTEGER NOT NULL,
  features TEXT[] NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_events (
  id TEXT PRIMARY KEY DEFAULT ('evt-' || substr(md5(random()::text), 1, 8)),
  landlord_id TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  plan_tier TEXT NOT NULL,
  amount_inr NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- ==========================================================
-- 4. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==========================================================

-- Check if current authenticated user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has access to organization
CREATE OR REPLACE FUNCTION public.has_org_access(org_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_super_admin() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public account lookup for login flow (does NOT leak sensitive credentials)
CREATE OR REPLACE FUNCTION public.lookup_account(identifier TEXT)
RETURNS TABLE (
  account_exists BOOLEAN,
  role TEXT,
  name TEXT,
  org_name TEXT,
  phone TEXT,
  email TEXT,
  is_suspended BOOLEAN,
  suspension_reason TEXT
) AS $$
DECLARE
  clean_id TEXT := LOWER(TRIM(identifier));
  clean_phone TEXT := REGEXP_REPLACE(identifier, '[^0-9]', '', 'g');
BEGIN
  RETURN QUERY
  SELECT
    true AS account_exists,
    'landlord'::TEXT AS role,
    la.owner_name AS name,
    la.organization_name AS org_name,
    la.owner_phone AS phone,
    la.owner_email AS email,
    la.is_suspended AS is_suspended,
    la.suspension_reason AS suspension_reason
  FROM public.landlord_accounts la
  WHERE
    (clean_id LIKE '%@%' AND LOWER(la.owner_email) = clean_id)
    OR (clean_phone <> '' AND REGEXP_REPLACE(la.owner_phone, '[^0-9]', '', 'g') LIKE ('%' || clean_phone || '%'))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- 5. APPLY ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile. Super admins can access all.
DROP POLICY IF EXISTS "profiles_owner_select" ON public.profiles;
CREATE POLICY "profiles_owner_select" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "profiles_owner_insert" ON public.profiles;
CREATE POLICY "profiles_owner_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- Organizations
DROP POLICY IF EXISTS "org_access_select" ON public.organizations;
CREATE POLICY "org_access_select" ON public.organizations FOR SELECT USING (public.has_org_access(id));

DROP POLICY IF EXISTS "org_access_insert" ON public.organizations;
CREATE POLICY "org_access_insert" ON public.organizations FOR INSERT WITH CHECK (owner_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "org_access_update" ON public.organizations;
CREATE POLICY "org_access_update" ON public.organizations FOR UPDATE USING (public.has_org_access(id));

DROP POLICY IF EXISTS "org_access_delete" ON public.organizations;
CREATE POLICY "org_access_delete" ON public.organizations FOR DELETE USING (owner_id = auth.uid() OR public.is_super_admin());

-- Organization Members
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
CREATE POLICY "org_members_select" ON public.organization_members FOR SELECT USING (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
CREATE POLICY "org_members_insert" ON public.organization_members FOR INSERT WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;
CREATE POLICY "org_members_delete" ON public.organization_members FOR DELETE USING (public.has_org_access(organization_id));

-- Landlord Accounts: Landlords read their own; Super admins read and update all
DROP POLICY IF EXISTS "landlords_select" ON public.landlord_accounts;
CREATE POLICY "landlords_select" ON public.landlord_accounts FOR SELECT USING (public.has_org_access(id));

DROP POLICY IF EXISTS "landlords_insert" ON public.landlord_accounts;
CREATE POLICY "landlords_insert" ON public.landlord_accounts FOR INSERT WITH CHECK (public.has_org_access(id));

DROP POLICY IF EXISTS "landlords_update" ON public.landlord_accounts;
CREATE POLICY "landlords_update" ON public.landlord_accounts FOR UPDATE USING (public.has_org_access(id));

-- Generic Organization Isolation Macros for Portfolio Tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'properties', 'property_units', 'tenants', 'rental_agreements',
      'payments', 'rent_charges', 'security_deposits', 'deposit_transactions',
      'maintenance_requests', 'expenses', 'documents', 'reminders', 'vendors'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (public.has_org_access(organization_id));', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT WITH CHECK (public.has_org_access(organization_id));', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE USING (public.has_org_access(organization_id));', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE USING (public.has_org_access(organization_id));', tbl, tbl);
  END LOOP;
END $$;

-- Subscription Plans: Public read for all authenticated users
DROP POLICY IF EXISTS "plans_read" ON public.subscription_plans;
CREATE POLICY "plans_read" ON public.subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "plans_admin_manage" ON public.subscription_plans;
CREATE POLICY "plans_admin_manage" ON public.subscription_plans FOR ALL USING (public.is_super_admin());

-- Billing Events: Super admin and account owners
DROP POLICY IF EXISTS "billing_events_access" ON public.billing_events;
CREATE POLICY "billing_events_access" ON public.billing_events FOR SELECT USING (
  public.is_super_admin() OR public.has_org_access(landlord_id)
);

-- ==========================================================
-- 6. AUTH HOOK TRIGGER: AUTO CREATE PROFILE & ORG
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT := COALESCE(new.raw_user_meta_data->>'full_name', 'New Landlord');
  v_phone TEXT := new.raw_user_meta_data->>'phone';
  v_org_name TEXT := COALESCE(new.raw_user_meta_data->>'organization_name', v_full_name || '''s Portfolio');
  v_org_id TEXT := 'org-' || substr(md5(random()::text), 1, 8);
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (new.id, new.email, v_full_name, v_phone, 'landlord')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

  -- Insert initial organization
  INSERT INTO public.organizations (id, name, owner_id)
  VALUES (v_org_id, v_org_name, new.id)
  ON CONFLICT (id) DO NOTHING;

  -- Add to organization_members
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, new.id, 'owner')
  ON CONFLICT DO NOTHING;

  -- Insert landlord_accounts
  INSERT INTO public.landlord_accounts (
    id, organization_name, owner_id, owner_name, owner_email, owner_phone,
    plan_tier, plan_name, status, max_units_allowed, trial_start, trial_end
  )
  VALUES (
    v_org_id, v_org_name, new.id, v_full_name, new.email, COALESCE(v_phone, ''),
    'professional', 'Professional Plan (7-Day Trial)', 'trialing', 50,
    NOW(), NOW() + interval '7 days'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- 7. SUPABASE STORAGE SETUP (VAULT / DOCUMENTS BUCKET)
-- ==========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('vault', 'vault', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Authenticated users can upload and read their files
DROP POLICY IF EXISTS "vault_public_read" ON storage.objects;
CREATE POLICY "vault_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'vault');

DROP POLICY IF EXISTS "vault_auth_insert" ON storage.objects;
CREATE POLICY "vault_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vault' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "vault_auth_update" ON storage.objects;
CREATE POLICY "vault_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'vault' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "vault_auth_delete" ON storage.objects;
CREATE POLICY "vault_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'vault' AND auth.role() = 'authenticated');

-- ==========================================================
-- 8. INITIAL SEED DATA (SUBSCRIPTION PLANS)
-- ==========================================================

INSERT INTO public.subscription_plans (id, tier, name, price_monthly_inr, price_annual_inr, max_properties, max_units, features, is_popular)
VALUES
  ('plan_free', 'free', 'Starter Free', 0, 0, 2, 5, ARRAY['Up to 2 properties', 'Up to 5 units', 'Standard rent receipts', 'Basic payment tracking'], false),
  ('plan_starter', 'starter', 'Growth Plan', 499, 4999, 10, 25, ARRAY['Up to 10 properties', 'Up to 25 units', 'WhatsApp rent reminders', 'Automated rent ledger', 'Document vault'], false),
  ('plan_professional', 'professional', 'Professional Plan', 999, 9999, 50, 100, ARRAY['Up to 50 properties', 'Up to 100 units', 'Automated GST invoices', 'Staff & manager logins', 'Direct UPI payment collection', 'Priority support'], true),
  ('plan_enterprise', 'enterprise', 'Enterprise Fleet', 2499, 24999, 500, 1000, ARRAY['Unlimited properties', 'Up to 1000 units', 'Custom branding', 'Dedicated account manager', 'Custom payment gateway integration', 'SLA 99.9%'], false)
ON CONFLICT (id) DO NOTHING;
