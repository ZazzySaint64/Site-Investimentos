import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Site Investimentos",
  description: "Dados de investimentos explicados para quem não é especialista. Projeto educativo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
