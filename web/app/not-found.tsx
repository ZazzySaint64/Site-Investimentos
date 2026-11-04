import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl space-y-3 px-4 py-16">
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-text-soft">Este endereço não existe ou o ativo não é acompanhado.</p>
      <Link href="/dados" className="text-sm text-accent underline-offset-2 hover:underline">
        Ver todos os ativos
      </Link>
    </main>
  );
}
