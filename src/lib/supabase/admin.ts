import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS, therefore it may only be imported by
 * server-only modules and used for narrowly scoped operations:
 *
 *  - reading quiz answer keys to grade submissions on the server
 *  - issuing certificates after server-side eligibility checks
 *  - recording AI usage/quota
 *  - resolving a certificate by its public verification code
 *
 * Never pass user-controlled data to `from(...)`/`rpc(...)` names. Never return
 * rows from this client to the browser unfiltered.
 */
let adminClient: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!config || !serviceKey) {
    throw new Error(
      "Supabase service role belum dikonfigurasi. Isi SUPABASE_SERVICE_ROLE_KEY pada environment server.",
    );
  }

  if (!adminClient) {
    adminClient = createClient(config.url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return adminClient;
}

export function hasAdminClient(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
