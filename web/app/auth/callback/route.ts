import { NextResponse, type NextRequest } from "next/server";
import { callbackTarget } from "@/lib/auth-messages";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  let exchanged = false;
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      exchanged = !error;
    } catch {
      // An invalid link can throw; it is shown as an expired link.
    }
  }
  return NextResponse.redirect(new URL(callbackTarget(searchParams, exchanged), request.url));
}
