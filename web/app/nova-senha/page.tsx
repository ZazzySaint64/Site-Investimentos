import { requireUser } from "@/lib/supabase/server";
import { NewPasswordForm } from "../entrar/AuthForms";

// The page reads the session cookie, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Nova senha | Site Investimentos" };

export default async function NovaSenhaPage() {
  await requireUser();
  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Nova senha</h1>
      <NewPasswordForm />
    </main>
  );
}
