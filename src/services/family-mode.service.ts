"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin, verifyPin } from "@/lib/pin";
import type { Gender } from "@/lib/types";

// ---------------------------------------------------------------------------
// Create a child profile directly from the parent's own device — no email,
// no separate signup, no code to copy. Behind the scenes this still creates
// a completely normal auth.users account for the child (via the existing
// public.handle_new_user() trigger), it's just done by the app with a hidden
// auto-generated login (stored in child_credentials, service-role-only) that
// nobody ever sees or needs to type.
// ---------------------------------------------------------------------------

export interface CreateChildProfileResult {
  success: boolean;
  childId?: string;
  nickname?: string;
  error?: "NOT_AUTHENTICATED" | "NOT_A_PARENT" | "MISSING_NICKNAME" | "CREATE_FAILED";
}

export async function createChildProfile(
  nickname: string,
  gender: Gender,
): Promise<CreateChildProfileResult> {
  const trimmedNickname = nickname.trim();
  if (!trimmedNickname) {
    return { success: false, error: "MISSING_NICKNAME" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  if (profile?.role !== "parent") {
    return { success: false, error: "NOT_A_PARENT" };
  }

  const admin = createAdminClient();
  const hiddenEmail = `child-${randomBytes(12).toString("hex")}@child.qunity.internal`;
  const hiddenPassword = randomBytes(24).toString("base64url");

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: hiddenEmail,
    password: hiddenPassword,
    email_confirm: true,
    user_metadata: { full_name: trimmedNickname, role: "child", gender },
  });

  if (createError || !created.user) {
    return { success: false, error: "CREATE_FAILED" };
  }

  const childId = created.user.id;

  const { error: credError } = await admin
    .from("child_credentials")
    .insert({ child_id: childId, hidden_email: hiddenEmail, hidden_password: hiddenPassword });
  if (credError) {
    await admin.auth.admin.deleteUser(childId); // cascades: users -> children -> links/credentials
    return { success: false, error: "CREATE_FAILED" };
  }

  const { error: linkError } = await admin
    .from("parent_child_links")
    .insert({ parent_id: user.id, child_id: childId });
  if (linkError) {
    await admin.auth.admin.deleteUser(childId);
    return { success: false, error: "CREATE_FAILED" };
  }

  return { success: true, childId, nickname: trimmedNickname };
}

// ---------------------------------------------------------------------------
// Parent PIN — gates returning from Child Mode to Parent Mode on the same
// device (see schema.sql's ADDED FOR PARENT/CHILD MODE SWITCHING comment for
// what this can and can't do).
// ---------------------------------------------------------------------------

export async function setParentPin(pin: string): Promise<{ success: boolean }> {
  if (!/^\d{4}$/.test(pin)) {
    return { success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false };
  }

  const { error } = await supabase
    .from("parents")
    .update({ pin_hash: hashPin(pin) })
    .eq("id", user.id);

  return { success: !error };
}

// Verifies pin against parentId's stored hash. Callable only from a session
// that the given parent actually linked (checked via the CURRENT session's
// own parent_child_links row, respecting RLS), so a child session can't
// probe arbitrary parent ids.
export async function verifyParentPin(parentId: string, pin: string): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false };
  }

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("parent_id")
    .eq("child_id", user.id)
    .eq("parent_id", parentId)
    .maybeSingle();
  if (!link) {
    return { success: false };
  }

  const admin = createAdminClient();
  const { data: parent } = await admin
    .from("parents")
    .select("pin_hash")
    .eq("id", parentId)
    .maybeSingle<{ pin_hash: string | null }>();

  if (!parent?.pin_hash) {
    return { success: false };
  }

  return { success: verifyPin(pin, parent.pin_hash) };
}

// ---------------------------------------------------------------------------
// Switch Mode — issues a real session for a linked child's hidden account.
// This is the same primitive a future QR-pairing flow on a second device
// will call too: given an authorized request for child X, hand back a
// session for child X. Switch Mode is just "authorized because it's the
// linking parent, on this device, right now"; QR pairing will be "authorized
// because it presented a valid short-lived pairing code" — same function,
// different authorization check in front of it.
// ---------------------------------------------------------------------------

export interface SwitchToChildResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: "NOT_AUTHENTICATED" | "NOT_LINKED" | "NO_HIDDEN_ACCOUNT" | "SIGN_IN_FAILED";
}

export async function switchToChild(childId: string): Promise<SwitchToChildResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("parent_id", user.id)
    .eq("child_id", childId)
    .maybeSingle();
  if (!link) {
    return { success: false, error: "NOT_LINKED" };
  }

  const admin = createAdminClient();
  const { data: creds } = await admin
    .from("child_credentials")
    .select("hidden_email, hidden_password")
    .eq("child_id", childId)
    .maybeSingle<{ hidden_email: string; hidden_password: string }>();
  if (!creds) {
    return { success: false, error: "NO_HIDDEN_ACCOUNT" };
  }

  const anon = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    email: creds.hidden_email,
    password: creds.hidden_password,
  });

  if (signInError || !signIn.session) {
    return { success: false, error: "SIGN_IN_FAILED" };
  }

  return {
    success: true,
    accessToken: signIn.session.access_token,
    refreshToken: signIn.session.refresh_token,
  };
}
