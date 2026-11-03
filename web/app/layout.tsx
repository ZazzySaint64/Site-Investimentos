import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Site Investimentos",
  description: "Dados de investimentos explicados para quem não é especialista. Projeto educativo.",
};

const NAV_LINK = "rounded-md px-2 py-1 text-text-soft hover:text-accent";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col antialiased">
        <header className="border-b border-border">
          <nav
            aria-label="Principal"
            className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
          >
            <Link href="/" className="mr-auto font-semibold text-text">
              Site Investimentos
            </Link>
            <Link href="/demo/ana" className={NAV_LINK}>
              Carteira de exemplo
            </Link>
            <Link href="/dados" className={NAV_LINK}>
              Ativos
            </Link>
            <Link href="/glossario" className={NAV_LINK}>
              Glossário
            </Link>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">
            Projeto educativo e não comercial. Nada aqui é recomendação de investimento. Resultados
            passados não garantem resultados futuros.
          </p>
        </footer>
      </body>
    </html>
  );
}
