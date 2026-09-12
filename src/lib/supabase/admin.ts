import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the service-role key, which bypasses RLS entirely and
// can create/modify any auth.users account. Never import this file from a
// "use client" component or anything that ships to the browser — only from
// files marked "use server" (see src/services/family-mode.service.ts) or
// Route Handlers. There is no cookie/session handling here on purpose: this
// client always acts with full admin privileges, regardless of who is
// asking, so every caller MUST verify the request itself (via the normal
// server client's auth.getUser()) before touching this.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — the admin client needs both (service role key is server-only, set it in .env.local / Vercel env vars, never NEXT_PUBLIC_).",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
