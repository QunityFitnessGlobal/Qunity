import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Where the links in Supabase's emails land (password reset). Verifies the
// link on the server and signs the user in, then continues to `next`.
//
// Two link shapes are accepted:
// - token_hash + type: from our own email template
//   (supabase/email-templates/reset-password.html). Works whichever browser
//   or device the email is opened on.
// - code: Supabase's default email, which only works in the same browser
//   that asked for the reset (it carries a one-time code paired with a
//   cookie set by that browser).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Only ever continue within this site.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  // The session cookies written above travel with this redirect.
  redirect(ok ? next : "/forgot-password?error=expired");
}
