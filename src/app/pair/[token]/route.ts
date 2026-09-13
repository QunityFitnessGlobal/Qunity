import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redeemPairingToken } from "@/services/family-mode.service";

// The target of the QR code the parent shows on their device: a plain link
// (no custom scanner needed — any phone's native camera app opens this
// directly). Redeeming here works the same as typing the 6-digit code at
// /pair, just via a URL instead of a form.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await redeemPairingToken(token);

  if (!result.success || !result.accessToken || !result.refreshToken) {
    return NextResponse.redirect(new URL("/pair?error=invalid", request.url));
  }

  const supabase = await createClient();
  await supabase.auth.setSession({
    access_token: result.accessToken,
    refresh_token: result.refreshToken,
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
