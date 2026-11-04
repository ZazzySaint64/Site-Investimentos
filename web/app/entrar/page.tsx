import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { SignInForm, SignUpForm } from "./AuthForms";
import { signInWithGoogle } from "./actions";

// The page reads the session cookie, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Entrar | Site Investimentos" };

const NOTICES: Record<string, string> = {
  link: "Não foi possível concluir pelo link. Ele pode ter expirado ou ter sido aberto em outro navegador. Se você já confirmou o e-mail, entre com sua senha.",
  "conta-apagada": "Sua conta e seus dados foram apagados.",
};

type Props = { searchParams: Promise<{ aviso?: string }> };

export default async function EntrarPage({ searchParams }: Props) {
  if (await getCurrentUser()) redirect("/carteira");
  const aviso = (await searchParams).aviso;
  const notice = aviso ? NOTICES[aviso] : undefined;

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      {notice && (
        <p role="status" className="rounded-lg border border-accent/60 px-4 py-3 text-sm">
          {notice}
        </p>
      )}
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium"
        >
          Entrar com Google
        </button>
      </form>
      <SignInForm />
      <p className="text-sm">
        <Link href="/esqueci-senha" className="text-accent underline-offset-2 hover:underline">
          Esqueci a senha
        </Link>
      </p>
      <details className="rounded-lg border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm text-text-soft">Criar conta</summary>
        <div className="mt-3">
          <SignUpForm />
        </div>
      </details>
    </main>
  );
}
