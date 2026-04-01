// ⚠️  SERVER-ONLY — never import this file in client components or pages.
// It uses the service_role key which bypasses RLS and must stay server-side.

import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
