// ==========================================================
// BHADEKARU SAAS — CLOUDFLARE WORKER ROUTER & API HANDLER
// Handles Edge API routes (/api/*) and serves Static Assets (SPA)
// ==========================================================

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SUPER_ADMIN_PHONE?: string;
  SUPER_ADMIN_EMAIL?: string;
  SUPER_ADMIN_PASSWORD?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Client-Platform, X-Org-Id, apikey',
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function normalizePhone(raw: string): string {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  if (digits.length > 10 && (digits.startsWith('91') || digits.startsWith('1'))) {
    return digits.slice(-10);
  }
  return digits;
}

function normalizeIdentifier(raw: string): string {
  return String(raw || '').trim().toLowerCase();
}

function isSuperAdmin(raw: string, env: Env): boolean {
  const cleanId = normalizeIdentifier(raw);
  const cleanPhone = normalizePhone(raw);

  const envPhone = normalizePhone(env.SUPER_ADMIN_PHONE || '8149862034');
  const envEmail = normalizeIdentifier(env.SUPER_ADMIN_EMAIL || 'scrovawebstudio@gmail.com');

  if (cleanId && (cleanId === envEmail || cleanId === 'admin@bhadekaru.app' || cleanId === 'scrovawebstudio@gmail.com')) {
    return true;
  }
  if (cleanPhone && (cleanPhone === envPhone || cleanPhone === '8149862034' || cleanPhone.endsWith(envPhone) || envPhone.endsWith(cleanPhone))) {
    return true;
  }
  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight for all endpoints
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Handle API endpoints
    if (url.pathname === '/api/health') {
      return jsonResponse({
        status: 'ok',
        service: 'bhadekaru-edge-worker',
        timestamp: new Date().toISOString(),
      });
    }

    // 1. Account Lookup (Public lookup for login step 1)
    if (url.pathname === '/api/auth/lookup') {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
      }

      try {
        const body: any = await request.json().catch(() => ({}));
        const identifier = String(body?.identifier || '').trim();

        if (!identifier) {
          return jsonResponse({ exists: false, error: 'Phone number or email is required' }, 400);
        }

        // Check Super Admin first
        if (isSuperAdmin(identifier, env)) {
          return jsonResponse({
            exists: true,
            role: 'super_admin',
            title: 'Super Admin Governance Console',
            subtitle: 'Platform Administrator Access',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          });
        }

        // Query Supabase for landlord account
        const supabaseUrl = env.VITE_SUPABASE_URL || 'https://ktapkmwsxeppcxroqjvx.supabase.co';
        const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0YXBrbXdzeGVwcGN4cm9xanZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTQyNTIsImV4cCI6MjEwMzgzMDI1Mn0.ccb2LrFxS8461c7YS51jcbmgTWh_0OvwAspBOTg8ejo';

        // Try lookup_account RPC first
        try {
          const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/lookup_account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ identifier }),
          });

          if (rpcRes.ok) {
            const rows: any[] = await rpcRes.json();
            if (Array.isArray(rows) && rows.length > 0) {
              const r = rows[0];
              return jsonResponse({
                exists: true,
                role: 'landlord',
                name: r.name,
                orgName: r.org_name,
                phone: r.phone,
                email: r.email,
                isSuspended: Boolean(r.is_suspended),
                suspensionReason: r.suspension_reason,
              });
            }
          }
        } catch {
          // RPC fallback to direct table query
        }

        // Direct table query fallback
        const cleanId = normalizeIdentifier(identifier);
        const cleanPhone = normalizePhone(identifier);
        let queryFilter = '';
        if (cleanId.includes('@')) {
          queryFilter = `owner_email=ilike.${encodeURIComponent(cleanId)}`;
        } else if (cleanPhone) {
          queryFilter = `or=(owner_phone.ilike.*${cleanPhone}*,owner_phone.ilike.*${identifier}*)`;
        } else {
          queryFilter = `owner_phone=ilike.*${encodeURIComponent(identifier)}*`;
        }

        const tableRes = await fetch(`${supabaseUrl}/rest/v1/landlord_accounts?${queryFilter}&limit=1`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });

        if (tableRes.ok) {
          const accounts: any[] = await tableRes.json();
          if (Array.isArray(accounts) && accounts.length > 0) {
            const l = accounts[0];
            return jsonResponse({
              exists: true,
              role: 'landlord',
              name: l.owner_name,
              orgName: l.organization_name,
              phone: l.owner_phone,
              email: l.owner_email,
              isSuspended: Boolean(l.is_suspended || l.status === 'suspended'),
              suspensionReason: l.suspension_reason,
              planTier: l.plan_tier,
              city: l.city,
            });
          }
        }

        return jsonResponse({
          exists: false,
          message: 'No registered landlord account found with this phone number. Please check the digits or register below.',
        });
      } catch (err: any) {
        return jsonResponse({ error: err?.message || 'Lookup internal error' }, 500);
      }
    }

    // 2. Authentication Login (Strict password verification)
    if (url.pathname === '/api/auth/login') {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
      }

      try {
        const body: any = await request.json().catch(() => ({}));
        const { identifier, password } = body || {};

        if (!identifier || !password) {
          return jsonResponse({ error: 'Phone number/identifier and password are required' }, 400);
        }

        const rawInput = String(identifier).trim();
        const rawPass = String(password).trim();

        // Super Admin verification
        if (isSuperAdmin(rawInput, env)) {
          const envAdminPass = (env.SUPER_ADMIN_PASSWORD || '814986').replace(/['"]/g, '').trim();
          if (rawPass === envAdminPass) {
            const session = {
              userId: 'usr-super-admin',
              email: env.SUPER_ADMIN_EMAIL || 'scrovawebstudio@gmail.com',
              phone: env.SUPER_ADMIN_PHONE || '8149862034',
              fullName: 'Super Admin',
              role: 'super_admin',
              organizationId: 'org-platform-admin',
              organizationName: 'Bhadekaru Platform Governance',
              loginTime: new Date().toISOString(),
            };

            return jsonResponse({
              success: true,
              token: 'bhk_sa_' + Date.now(),
              session,
              message: 'Super Admin authenticated successfully',
            });
          } else {
            return jsonResponse({ error: 'Invalid password. Please enter the correct Super Admin PIN/password.' }, 401);
          }
        }

        // Landlord Auth via Supabase
        const supabaseUrl = env.VITE_SUPABASE_URL || 'https://ktapkmwsxeppcxroqjvx.supabase.co';
        const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0YXBrbXdzeGVwcGN4cm9xanZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTQyNTIsImV4cCI6MjEwMzgzMDI1Mn0.ccb2LrFxS8461c7YS51jcbmgTWh_0OvwAspBOTg8ejo';

        let targetEmail = rawInput;
        if (!rawInput.includes('@')) {
          // Resolve email from phone number
          const lookupRes = await fetch(`${supabaseUrl}/rest/v1/landlord_accounts?owner_phone=ilike.*${normalizePhone(rawInput)}*&limit=1`, {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
          });
          if (lookupRes.ok) {
            const accts: any[] = await lookupRes.json();
            if (accts.length > 0 && accts[0].owner_email) {
              targetEmail = accts[0].owner_email;
            }
          }
        }

        const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            email: targetEmail,
            password: rawPass,
          }),
        });

        if (authRes.ok) {
          const authData: any = await authRes.json();
          return jsonResponse({
            success: true,
            token: authData.access_token,
            user: authData.user,
          });
        } else {
          const errData: any = await authRes.json().catch(() => ({}));
          return jsonResponse({ error: errData.error_description || errData.msg || 'Invalid credentials' }, 401);
        }
      } catch (err: any) {
        return jsonResponse({ error: err?.message || 'Login internal error' }, 500);
      }
    }

    // Default: Forward request to Cloudflare Static Assets (Single-Page App)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
