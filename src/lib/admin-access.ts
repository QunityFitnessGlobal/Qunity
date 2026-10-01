import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

// SERVER-ONLY (uses the admin client). Admins are listed by email in the
// ADMIN_EMAILS env var (comma-separated) rather than in code, since the repo
// is public. Missing or empty means nobody is an admin.
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

// Whether the TEMP testing tools (power/level-up previews, workout
// quick-finish) are shown: to an admin, and to any child linked to an admin
// — which covers an admin switching into child mode (that swaps the session
// to the child's own account) as well as a test child signed in by itself.
export async function canUseQaTools(user: User, role: Role | null | undefined): Promise<boolean> {
  if (isAdminEmail(user.email)) {
    return true;
  }
  if (role !== "child" || adminEmails().length === 0) {
    return false;
  }

  const admin = createAdminClient();
  const { data: links } = await admin.from("parent_child_links").select("parent_id").eq("child_id", user.id);

  for (const link of links ?? []) {
    const { data } = await admin.auth.admin.getUserById(link.parent_id as string);
    if (isAdminEmail(data.user?.email)) {
      return true;
    }
  }
  return false;
}
