import { getProfile } from "@/lib/wallet";
import { QuestionnaireForm } from "./QuestionnaireForm";

// The page reads the session cookie, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Meu perfil | Site Investimentos" };

export default async function QuestionarioPage() {
  const profile = await getProfile();
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Meu perfil de investidor</h1>
      <QuestionnaireForm saved={profile} />
    </main>
  );
}
