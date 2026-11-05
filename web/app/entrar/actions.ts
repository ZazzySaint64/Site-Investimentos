"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";

type State = { message: string } | null;

const CONFIRM_WORD = "APAGAR";
const GENERIC = "Não foi possível concluir agora. Tente de novo.";

export async function signInWithGoogle(): Promise<void> {
  const base = (await headers()).get("origin");
  if (!base) redirect("/entrar?aviso=link");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${base}/auth/callback` },
  });
  if (error || !data.url) redirect("/entrar?aviso=link");
  redirect(data.url);
}

// No redirect here: the client reloads the page, so no state of this user survives in memory.
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
}

export async function deleteAccount(_state: State, formData: FormData): Promise<State> {
  await requireUser();
  const confirm = formData.get("confirm");
  if (typeof confirm !== "string" || confirm.trim() !== CONFIRM_WORD) {
    return { message: `Digite ${CONFIRM_WORD} para confirmar.` };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { message: GENERIC };
  await supabase.auth.signOut({ scope: "local" });
  return null;
}
