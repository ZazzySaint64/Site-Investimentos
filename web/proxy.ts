import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Only refreshes the session cookie. Each page and Server Action checks access by itself.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production" },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(cookiesToSet, headers) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
            Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
          },
        },
      },
    );
    await supabase.auth.getClaims();
  } catch {
    // An Auth failure must not take the page down.
  }
  return response;
}

export const config = {
  matcher: [
    "/carteira/:path*",
    "/questionario",
    "/conta",
    "/entrar",
    "/dados/:path*",
  ],
};
