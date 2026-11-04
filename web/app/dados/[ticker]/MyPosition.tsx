import Link from "next/link";
import { Term } from "@/components/Term";
import { formatMoney, formatQuantity, formatSignedMoney } from "@/lib/phrases";
import { getMyPosition } from "@/lib/wallet";

function Figure({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-xl">{value}</p>
    </div>
  );
}

// Shows nothing without a session or without a position.
export async function MyPosition({ ticker }: { ticker: string }) {
  const position = await getMyPosition(ticker);
  if (!position) return null;

  return (
    <section
      aria-labelledby="position"
      className="space-y-3 rounded-lg border border-border bg-surface p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="position" className="text-sm font-medium text-muted">
          Sua posição
        </h2>
        <Link href="/carteira/lancar" className="text-sm text-accent underline-offset-2 hover:underline">
          Lançar
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Figure label="Quantidade" value={formatQuantity(position.quantity)} />
        <Figure label={<Term name="preco_medio">Preço médio</Term>} value={formatMoney(position.averageCost)} />
        <Figure label="Valor hoje" value={formatMoney(position.value)} />
        <Figure label={<Term name="resultado">Resultado</Term>} value={formatSignedMoney(position.result)} />
      </div>
      <p className="text-sm text-text-soft">
        Você comprou por {formatMoney(position.averageCost)} em média.{" "}
        {position.price === null
          ? "Sem preço disponível."
          : `Hoje cada unidade vale ${formatMoney(position.price)}.`}
      </p>
    </section>
  );
}
