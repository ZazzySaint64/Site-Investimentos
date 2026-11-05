import { requireUser } from "@/lib/supabase/server";
import { DeleteAccountForm, SignOutForm } from "../entrar/AuthForms";

// The page reads the session cookie, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Conta | Site Investimentos" };

export default async function ContaPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-10">
      <h1>Conta</h1>
      <p className="text-sm text-text-soft">
        E-mail: <span className="tabular-nums">{user.email}</span>
      </p>
      <SignOutForm />
      <details className="rounded-lg border border-border bg-surface p-5 sm:p-6">
        <summary className="cursor-pointer text-sm text-text-soft">Apagar minha conta</summary>
        <div className="mt-3 space-y-3">
          <p className="text-sm text-text-soft">
            Isso apaga sua conta e todos os seus lançamentos. Não dá para desfazer.
          </p>
          <DeleteAccountForm />
        </div>
      </details>
    </main>
  );
}
