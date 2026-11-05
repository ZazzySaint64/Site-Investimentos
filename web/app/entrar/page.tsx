import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { SignInForm, SignUpForm } from "./AuthForms";

// The page reads the session cookie, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Entrar | Site Investimentos" };

const NOTICES: Record<string, string> = {
  link: "Não foi possível concluir pelo link. Ele pode ter expirado ou ter sido aberto em outro navegador. Se você já confirmou o e-mail, entre com sua senha.",
  "link-senha":
    "Não foi possível abrir o link para criar uma nova senha. Ele pode ter expirado ou ter sido aberto em outro navegador. Peça outro link e abra neste navegador.",
  "conta-apagada": "Sua conta e seus dados foram apagados.",
};

type Props = { searchParams: Promise<{ aviso?: string }> };

export default async function EntrarPage({ searchParams }: Props) {
  if (await getCurrentUser()) redirect("/carteira");
  const aviso = (await searchParams).aviso;
  const notice = aviso && Object.hasOwn(NOTICES, aviso) ? NOTICES[aviso] : undefined;

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:items-start lg:py-16">
      <div className="mx-auto w-full max-w-md space-y-6">
      <h1>Entrar</h1>
      {notice && (
        <p role="status" className="rounded-lg border border-accent/60 px-4 py-3 text-sm">
          {notice}
        </p>
      )}
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
      </div>
      <aside className="on-forest overflow-hidden rounded-lg bg-forest p-6 text-mist sm:p-10">
        <p className="font-display text-3xl leading-tight">Sua carteira, só sua.</p>
        <p className="mt-2">Cada pessoa vê apenas os próprios dados.</p>
        <ul className="mt-8 space-y-3 text-lg">
          <li>Lance compras, vendas e renda fixa.</li>
          <li>Veja o valor de hoje, o resultado e onde o dinheiro está.</li>
          <li>Responda ao questionário e conheça seu perfil.</li>
        </ul>
      </aside>
    </main>
  );
}
