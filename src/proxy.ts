import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same mechanism, new name/export).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims refreshes an expired session (writing the new cookies above)
  // and verifies the token. With Supabase's asymmetric signing keys that's
  // done locally against cached keys — no round trip to the Auth server on
  // every request, as getUser() needed.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const { pathname } = request.nextUrl;
  const publicRoutes = ["/", "/login", "/signup", "/forgot-password"];
  // /pair (manual code entry) and /pair/<token> (QR link target) both need
  // to work for a child who has no session at all yet — that's the whole
  // point of device pairing (see family-mode.service.ts's redeemPairingCode).
  // /auth/confirm is where the password-reset email's link lands.
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/pair") || pathname.startsWith("/auth/");

  // The new-password screen only works with the session the reset link
  // opened; without one, the link expired or was already used.
  if (!user && pathname === "/reset-password") {
    return NextResponse.redirect(new URL("/forgot-password?error=expired", request.url));
  }

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Someone already signed in skips the welcome and sign-in screens.
  if (user && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
