import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";

// The page reads the session cookie, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Minha carteira | Site Investimentos" };

// Placeholder until Task 6 builds the real wallet.
export default async function CarteiraPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Minha carteira</h1>
      <p className="text-sm text-text-soft">Você entrou como {user.email}.</p>
      <Link href="/carteira/lancar" className="mr-4 text-sm text-accent underline-offset-2 hover:underline">
        Lançar
      </Link>
      <Link href="/conta" className="text-sm text-accent underline-offset-2 hover:underline">
        Conta
      </Link>
    </main>
  );
}
