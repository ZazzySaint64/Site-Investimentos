import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  let exchanged = false;
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      exchanged = !error;
    } catch {
      // An invalid code can throw; it is shown as a failed login.
    }
  }
  // The destination is fixed on purpose: a `next` parameter would be an open redirect.
  const target = exchanged ? "/carteira" : "/entrar?aviso=link";
  return NextResponse.redirect(new URL(target, request.url));
}
