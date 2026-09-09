// ==========================================================
// BHADEKARU SAAS — SUPABASE EDGE FUNCTION: admin-actions
// Secure, privileged administrative operations for Super Admins
// ==========================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client with service role for administrative execution
    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // Client using caller's JWT to verify caller's identity and privileges
    const callerSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await callerSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired caller token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller has role = 'super_admin' in public.profiles or matches platform admin email
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isSuperAdmin = profile?.role === 'super_admin' || user.email === 'scrovawebstudio@gmail.com';
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Caller is not a platform Super Admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { action, orgId, reason, planTier, customLimit, daysToAdd } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'list_landlords': {
        const { data, error } = await adminSupabase
          .from('landlord_accounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, landlords: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_metrics': {
        const { data: accounts, error } = await adminSupabase
          .from('landlord_accounts')
          .select('*');

        if (error) throw error;
        const totalLandlords = accounts?.length || 0;
        const activeLandlords = accounts?.filter((a) => !a.is_suspended && a.status === 'active').length || 0;
        const trialingLandlords = accounts?.filter((a) => a.status === 'trialing').length || 0;
        const totalMrr = accounts?.reduce((acc, curr) => acc + (Number(curr.mrr_inr) || 0), 0) || 0;

        return new Response(
          JSON.stringify({
            success: true,
            metrics: {
              total_landlords: totalLandlords,
              active_landlords: activeLandlords,
              trialing_landlords: trialingLandlords,
              monthly_recurring_revenue_inr: totalMrr,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'suspend_landlord': {
        if (!orgId) throw new Error('Missing orgId');
        const { data, error } = await adminSupabase
          .from('landlord_accounts')
          .update({
            is_suspended: true,
            status: 'suspended',
            suspension_reason: reason || 'Account suspended by platform administrator.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId)
          .select()
          .maybeSingle();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, action: 'suspended', landlord: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'activate_landlord': {
        if (!orgId) throw new Error('Missing orgId');
        const { data, error } = await adminSupabase
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
        return new Response(
          JSON.stringify({ success: true, action: 'activated', landlord: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'change_plan': {
        if (!orgId || !planTier) throw new Error('Missing orgId or planTier');
        const { data, error } = await adminSupabase
          .from('landlord_accounts')
          .update({
            plan_tier: planTier,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId)
          .select()
          .maybeSingle();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, action: 'plan_changed', landlord: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'override_unit_limit': {
        if (!orgId || customLimit === undefined) throw new Error('Missing orgId or customLimit');
        const { data, error } = await adminSupabase
          .from('landlord_accounts')
          .update({
            custom_unit_limit: customLimit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId)
          .select()
          .maybeSingle();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, action: 'unit_limit_updated', landlord: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'extend_trial': {
        if (!orgId) throw new Error('Missing orgId');
        const days = Number(daysToAdd) || 7;
        const newDate = new Date(Date.now() + days * 86400000).toISOString();

        const { data, error } = await adminSupabase
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
        return new Response(
          JSON.stringify({ success: true, action: 'trial_extended', landlord: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
