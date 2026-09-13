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
  age: number | null,
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

  if (age != null && Number.isInteger(age) && age > 0) {
    await admin.from("children").update({ age }).eq("id", childId);
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
// Shared core: issue a real session for a child's hidden account. Both
// Switch Mode and QR/code device pairing end here — they only differ in how
// they decide the request is authorized (linking parent vs. a valid pairing
// code), see each caller below.
// ---------------------------------------------------------------------------

interface IssueSessionResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: "NO_HIDDEN_ACCOUNT" | "SIGN_IN_FAILED";
}

async function issueSessionForChild(childId: string): Promise<IssueSessionResult> {
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

// ---------------------------------------------------------------------------
// Switch Mode — authorized because the caller is the linking parent, on
// this device, right now.
// ---------------------------------------------------------------------------

export type SwitchToChildResult = Omit<IssueSessionResult, "error"> & {
  error?: IssueSessionResult["error"] | "NOT_AUTHENTICATED" | "NOT_LINKED";
};

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

  return issueSessionForChild(childId);
}

// ---------------------------------------------------------------------------
// QR / code device pairing — authorized because the caller presented a
// valid, unexpired, not-yet-used pairing code. No parent session required
// here: this is exactly what runs when the CHILD's own (unauthenticated)
// device redeems a code — see src/app/pair/page.tsx and
// src/app/pair/[token]/route.ts.
// ---------------------------------------------------------------------------

const PAIRING_CODE_TTL_MINUTES = 10;

export interface CreatePairingCodeResult {
  success: boolean;
  token?: string;
  code?: string;
  expiresAt?: string;
  error?: "NOT_AUTHENTICATED" | "NOT_LINKED";
}

export async function createPairingCode(childId: string): Promise<CreatePairingCodeResult> {
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
  // Clear any still-active codes for this child first, so there's never more
  // than one valid code floating around for the same child at once.
  await admin.from("pairing_codes").delete().eq("child_id", childId).is("used_at", null);

  const token = randomBytes(24).toString("base64url");
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits, no leading zero
  const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await admin
    .from("pairing_codes")
    .insert({ child_id: childId, token, code, expires_at: expiresAt });
  if (error) {
    return { success: false };
  }

  return { success: true, token, code, expiresAt };
}

type RedeemPairingResult = Omit<IssueSessionResult, "error"> & {
  error?: IssueSessionResult["error"] | "NOT_FOUND_OR_EXPIRED";
};

async function redeemPairingRow(
  column: "code" | "token",
  value: string,
): Promise<RedeemPairingResult> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("pairing_codes")
    .select("id, child_id, expires_at, used_at")
    .eq(column, value)
    .maybeSingle<{ id: string; child_id: string; expires_at: string; used_at: string | null }>();

  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    return { success: false, error: "NOT_FOUND_OR_EXPIRED" };
  }

  const { error: markUsedError } = await admin
    .from("pairing_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("used_at", null); // guards against redeeming the same row twice concurrently
  if (markUsedError) {
    return { success: false, error: "NOT_FOUND_OR_EXPIRED" };
  }

  return issueSessionForChild(row.child_id);
}

export async function redeemPairingCode(code: string): Promise<RedeemPairingResult> {
  return redeemPairingRow("code", code.trim());
}

export async function redeemPairingToken(token: string): Promise<RedeemPairingResult> {
  return redeemPairingRow("token", token);
}
