import { ResetRequestForm } from "../entrar/AuthForms";

export const instant = false;

export const metadata = { title: "Esqueci a senha | Site Investimentos" };

export default function EsqueciSenhaPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-10">
      <h1>Esqueci a senha</h1>
      <ResetRequestForm />
    </main>
  );
}
