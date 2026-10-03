import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Gender, Role } from "@/lib/types";

// SERVER-ONLY. Everything here is wrapped in React's `cache`, so within one
// request the layout and the page share a single Supabase client, a single
// sign-in check and a single profile read instead of each doing its own.

export interface SessionUser {
  id: string;
  email: string | null;
}

export interface Profile {
  role: Role;
  full_name: string;
  gender: Gender | null;
}

export const getSupabase = cache(createClient);

// Verifies the signed-in user's token. With Supabase's asymmetric signing
// keys this happens locally (the keys are cached); with the legacy shared
// secret it falls back to asking the Auth server, like getUser() did.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) {
    return null;
  }
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("users")
    .select("role, full_name, gender")
    .eq("id", userId)
    .maybeSingle<Profile>();
  return data ?? null;
});
