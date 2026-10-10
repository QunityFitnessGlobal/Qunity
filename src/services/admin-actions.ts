"use server";

import { getSessionUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Marks (or unmarks) a family as a test one on the admin dashboard's
// families screen. A server action is a public endpoint, so it checks the
// admin itself rather than trusting that only the dashboard calls it.
export async function setTestFamily(parentId: string, isTest: boolean): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email) || typeof parentId !== "string" || !UUID.test(parentId)) {
    return { ok: false };
  }
  const admin = createAdminClient();
  const { error } = isTest
    ? await admin.from("admin_test_families").upsert({ parent_id: parentId })
    : await admin.from("admin_test_families").delete().eq("parent_id", parentId);
  return { ok: !error };
}
