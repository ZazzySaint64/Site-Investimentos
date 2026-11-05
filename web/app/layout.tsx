import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Link from "next/link";
import { StaleBanner } from "@/components/DataFreshness";
import "./globals.css";

export const metadata: Metadata = {
  title: "Site Investimentos",
  description: "Dados de investimentos explicados para quem não é especialista. Projeto educativo.",
};

const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
  variable: "--font-fraunces",
});
const text = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

const NAV_LINK = "rounded-full px-3 py-1.5 text-mist hover:text-lime";
const FOOT_LINK = "text-forest-soft underline-offset-2 hover:text-lime hover:underline";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${text.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <StaleBanner />
        <header className="on-forest sticky top-0 z-30 h-[var(--header-height)] bg-forest">
          <nav
            aria-label="Principal"
            className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-1 gap-y-1 px-4 py-3 text-sm sm:px-8"
          >
            <Link href="/" className="font-display mr-auto text-xl text-mist">
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
            <Link
              href="/carteira"
              prefetch={false}
              className="ml-1 rounded-full bg-lime px-4 py-1.5 font-semibold text-forest hover:bg-mist"
            >
              Minha carteira
            </Link>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="on-forest overflow-hidden bg-forest text-mist">
          <div className="mx-auto max-w-6xl px-4 pt-12 pb-6 sm:px-8">
            <div className="grid gap-8 text-base sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr]">
              <ul className="space-y-1.5">
                <li className="font-semibold">Site</li>
                <li>
                  <Link href="/demo/ana" className={FOOT_LINK}>
                    Carteira de exemplo
                  </Link>
                </li>
                <li>
                  <Link href="/dados" className={FOOT_LINK}>
                    Ativos
                  </Link>
                </li>
                <li>
                  <Link href="/glossario" className={FOOT_LINK}>
                    Glossário
                  </Link>
                </li>
              </ul>
              <ul className="space-y-1.5">
                <li className="font-semibold">De onde vêm os dados</li>
                <li className="text-forest-soft">Yahoo Finance</li>
                <li className="text-forest-soft">Tesouro Transparente</li>
                <li className="text-forest-soft">Banco Central do Brasil</li>
              </ul>
              <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                <p className="font-semibold">Projeto educativo e não comercial</p>
                <p className="text-forest-soft">
                  Nada aqui é recomendação de investimento. Resultados passados não garantem
                  resultados futuros.
                </p>
              </div>
            </div>
          </div>
          <p
            aria-hidden="true"
            className="font-display mx-auto max-w-6xl whitespace-nowrap px-4 pb-4 text-[10.2vw] leading-none sm:px-8 2xl:text-[9.5rem]"
          >
            Site Investimentos
          </p>
        </footer>
      </body>
    </html>
  );
}
