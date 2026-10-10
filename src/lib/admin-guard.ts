import { notFound } from "next/navigation";
import { requireUser, type SessionUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin-access";

// SERVER-ONLY. Every /admin page calls this before reading anything: a
// layout isn't re-run when moving between its pages, so the check can't live
// only there. Anyone who isn't an admin gets a plain "not found".
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) {
    notFound();
  }
  return user;
}
