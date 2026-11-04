"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authMessage } from "@/lib/auth-messages";
import { createClient, requireUser } from "@/lib/supabase/server";

type State = { message: string; email?: string } | null;

const MIN_PASSWORD = 8;
const CONFIRM_WORD = "APAGAR";
const GENERIC = authMessage(undefined);

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function origin(): Promise<string | null> {
  return (await headers()).get("origin");
}

// No redirect on success: the client does a full reload, so nothing of the previous person survives.
export async function signInWithPassword(_state: State, formData: FormData): Promise<State> {
  const email = field(formData, "email");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { message: authMessage(error.code), email };
  return null;
}

export async function signUp(_state: State, formData: FormData): Promise<State> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { message: authMessage("weak_password"), email };
  const base = await origin();
  if (!base) return { message: GENERIC, email };
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${base}/auth/callback` },
  });
  if (error) return { message: authMessage(error.code), email };
  // Same sentence for a new and an existing e-mail, so it does not reveal who has an account.
  return {
    message: `Enviamos um link para ${email}. Abra-o neste navegador para confirmar a conta.`,
    email,
  };
}

export async function signInWithGoogle(): Promise<void> {
  const base = await origin();
  if (!base) redirect("/entrar?aviso=link");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${base}/auth/callback` },
  });
  if (error || !data.url) redirect("/entrar?aviso=link");
  redirect(data.url);
}

export async function requestPasswordReset(_state: State, formData: FormData): Promise<State> {
  const email = field(formData, "email");
  const base = await origin();
  if (!base) return { message: GENERIC, email };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?type=recovery`,
  });
  return {
    message: "Se esse e-mail tiver conta, enviamos um link para criar uma nova senha.",
    email,
  };
}

export async function setNewPassword(_state: State, formData: FormData): Promise<State> {
  await requireUser();
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { message: authMessage("weak_password") };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { message: authMessage(error.code) };
  redirect("/carteira");
}

// No redirect here: the client reloads the page, so no state of this user survives in memory.
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
}

export async function deleteAccount(_state: State, formData: FormData): Promise<State> {
  await requireUser();
  if (field(formData, "confirm") !== CONFIRM_WORD) {
    return { message: `Digite ${CONFIRM_WORD} para confirmar.` };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { message: GENERIC };
  await supabase.auth.signOut({ scope: "local" });
  return null;
}
