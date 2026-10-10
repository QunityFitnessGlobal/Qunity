"use server";

import { createAdminClient } from "@/lib/supabase/admin";

interface VisitInput {
  source: string;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  path: string;
}

const MAX_LENGTH = 120;

function clip(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, MAX_LENGTH) : null;
}

// Records one visit to the welcome or sign-up screen (see TrackVisit) for the
// admin dashboard's funnel — only where it came from, nothing about who.
// Called by signed-out visitors, so it takes nothing on trust beyond a few
// short strings, and a failure (e.g. before the site_visits table exists)
// is swallowed: counting visits must never get in the way of the screen.
export async function recordVisit(input: VisitInput): Promise<void> {
  const row = {
    source: clip(input?.source) ?? "direct",
    medium: clip(input?.medium),
    campaign: clip(input?.campaign),
    referrer: clip(input?.referrer),
    path: clip(input?.path),
  };
  try {
    await createAdminClient().from("site_visits").insert(row);
  } catch {
    // Not worth surfacing.
  }
}
