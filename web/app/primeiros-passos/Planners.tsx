"use client";

import { useState } from "react";
import { CARD, FIELD, Field, number } from "@/app/renda-fixa/Calculators";
import { growthByYear, monthsToReach, parseMoney, RESERVE_MONTHS } from "@/lib/planning";
import { formatMoney, formatPercent, formatSignedPercent } from "@/lib/phrases";

function MoneyInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-border bg-surface">
      <span className="pl-3 text-sm text-muted" aria-hidden="true">
        R$
      </span>
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${FIELD} border-0`}
      />
    </div>
  );
}

function duration(months: number): string {
  if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearText = `${years} ${years === 1 ? "ano" : "anos"}`;
  return rest ? `${yearText} e ${rest} ${rest === 1 ? "mês" : "meses"}` : yearText;
}

export function ReservePlanner({ cdi }: { cdi: number }) {
  const [expenses, setExpenses] = useState("3.000");
  const [income, setIncome] = useState<"stable" | "variable">("stable");
  const [months, setMonths] = useState<number>(RESERVE_MONTHS.stable.max);
  const [saved, setSaved] = useState("0");
  const [monthly, setMonthly] = useState("300");
  const range = RESERVE_MONTHS[income];
  const expensesValue = parseMoney(expenses);
  const savedValue = parseMoney(saved) ?? 0;
  const monthlyValue = parseMoney(monthly) ?? 0;
  const target = expensesValue === null ? null : expensesValue * months;
  const missing = target === null ? null : Math.max(0, target - savedValue);
  const time = target === null ? null : monthsToReach(target, savedValue, monthlyValue, cdi);

  function chooseIncome(kind: "stable" | "variable") {
    setIncome(kind);
    setMonths(RESERVE_MONTHS[kind].max);
  }

  return (
    <section id="reserva" aria-labelledby="reserva-titulo" className={CARD}>
      <header className="space-y-1">
        <p className="text-sm font-medium text-accent">Passo 1 · as raízes</p>
        <h2 id="reserva-titulo" className="font-display text-2xl">
          Quanto guardar de reserva
        </h2>
        <p className="text-sm text-text-soft">
          A reserva paga um imprevisto, como perder o emprego ou uma conta de saúde, sem obrigar a
          vender um investimento na pior hora. Vem antes de qualquer outro investimento.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Gastos essenciais por mês"
          hint="Moradia, comida, contas, transporte e saúde."
        >
          {(id) => <MoneyInput id={id} value={expenses} onChange={setExpenses} />}
        </Field>
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">Sua renda é</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["stable", "Estável", "salário fixo"],
                ["variable", "Variável", "autônomo, comissão"],
              ] as const
            ).map(([kind, label, hint]) => (
              <label
                key={kind}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${income === kind ? "border-forest bg-forest text-lime" : "border-border bg-surface"}`}
              >
                <input
                  type="radio"
                  name="renda"
                  value={kind}
                  checked={income === kind}
                  onChange={() => chooseIncome(kind)}
                  className="sr-only"
                />
                {label} <span className="opacity-75">({hint})</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          label={`Meses de gastos guardados: ${months}`}
          hint={`Para renda ${income === "stable" ? "estável" : "variável"}, guias costumam falar em ${range.min} a ${range.max} meses.`}
        >
          {(id) => (
            <input
              id={id}
              type="range"
              min={1}
              max={24}
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          )}
        </Field>
        <Field label="Quanto já tem guardado">
          {(id) => <MoneyInput id={id} value={saved} onChange={setSaved} />}
        </Field>
        <Field label="Quanto consegue guardar por mês">
          {(id) => <MoneyInput id={id} value={monthly} onChange={setMonthly} />}
        </Field>
      </div>
      <div aria-live="polite" className="rounded-lg bg-paper p-4">
        {target === null ? (
          <p className="text-sm text-text-soft">Preencha os gastos do mês com um número.</p>
        ) : (
          <>
            <p className="text-sm text-text-soft">Sua reserva</p>
            <p className="font-display text-4xl tabular-nums text-accent">{formatMoney(target)}</p>
            <p className="mt-2 text-sm text-text-soft">
              {missing === 0
                ? "Você já tem a reserva inteira. O próximo passo é investir com prazo mais longo."
                : time === null
                  ? `Faltam ${formatMoney(missing)}. Guardando algum valor por mês, a conta mostra quando você chega lá.`
                  : `Faltam ${formatMoney(missing)}. Guardando ${formatMoney(monthlyValue)} por mês, rendendo 100% do CDI, você chega lá em ${duration(time)}.`}
            </p>
          </>
        )}
      </div>
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
        <li>
          A reserva precisa de liquidez diária e de baixo risco: resgate no mesmo dia ou no dia
          seguinte, sem perder valor. Tesouro Selic e CDB com liquidez diária coberto pelo FGC são
          exemplos de tipo, não indicações.
        </li>
        <li>
          Não há regra oficial de quantos meses guardar. As faixas acima são as mais repetidas em
          guias de educação financeira.
        </li>
        <li>
          A conta usa o CDI de hoje, de {formatPercent(cdi)} ao ano, sem imposto. O CDI muda, e o
          rendimento real pode ser menor.
        </li>
      </ul>
    </section>
  );
}

type Band = {
  since: number;
  worst: { year: number; real: number };
  best: { year: number; real: number };
} | null;

/** Stacked bars: what was put in and what interest added, year by year. */
function GrowthChart({ points }: { points: ReturnType<typeof growthByYear> }) {
  const width = 320;
  const height = 150;
  const top = Math.max(...points.map((point) => point.total), 1);
  const step = (width - 8) / points.length;
  const bar = Math.max(step * 0.7, 1);
  const y = (value: number) => height - 20 - (value / top) * (height - 30);
  const last = points.at(-1)!;
  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Em ${last.year} anos: ${formatMoney(last.contributed)} aportados e ${formatMoney(last.total - last.contributed)} de juros.`}
        className="w-full max-w-lg"
      >
        {points.map((point, index) => (
          <g key={point.year}>
            <rect
              x={4 + index * step}
              y={y(point.total)}
              width={bar}
              height={y(point.contributed) - y(point.total)}
              fill="#a7d13a"
            />
            <rect
              x={4 + index * step}
              y={y(point.contributed)}
              width={bar}
              height={height - 20 - y(point.contributed)}
              fill="var(--color-forest)"
            />
          </g>
        ))}
        <text x={4} y={height - 6} fontSize="10" fill="var(--color-muted)">
          hoje
        </text>
        <text x={width - 4} y={height - 6} fontSize="10" textAnchor="end" fill="var(--color-muted)">
          {last.year} anos
        </text>
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 text-xs text-text-soft">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm bg-forest" />O que você aportou
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded-sm"
            style={{ background: "#a7d13a" }}
          />
          O que os juros somaram
        </span>
      </figcaption>
    </figure>
  );
}

export function ContributionPlanner({
  real,
  band,
  since,
}: {
  real: number;
  band: Band;
  since: number | null;
}) {
  const [initial, setInitial] = useState("0");
  const [monthly, setMonthly] = useState("300");
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(number(real * 100));
  const initialValue = parseMoney(initial) ?? 0;
  const monthlyValue = parseMoney(monthly) ?? 0;
  const rateValue = Number(rate.replace(",", "."));
  const valid =
    rate.trim() !== "" && Number.isFinite(rateValue) && rateValue > -20 && rateValue < 30;
  const points = valid ? growthByYear(initialValue, monthlyValue, years, rateValue / 100) : [];
  const last = points.at(-1);
  const worst = band
    ? growthByYear(initialValue, monthlyValue, years, band.worst.real).at(-1)!
    : null;
  const best = band
    ? growthByYear(initialValue, monthlyValue, years, band.best.real).at(-1)!
    : null;

  return (
    <section id="aportes" aria-labelledby="aportes-titulo" className={CARD}>
      <header className="space-y-1">
        <p className="text-sm font-medium text-accent">Passo 2 · o tempo faz o resto</p>
        <h2 id="aportes-titulo" className="font-display text-2xl">
          Quanto os aportes podem virar
        </h2>
        <p className="text-sm text-text-soft">
          Guardando um valor todo mês, os juros passam a render sobre os juros. A conta mostra tudo
          em dinheiro de hoje, já descontada a inflação, para o número ter o mesmo peso de agora.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor para começar">
          {(id) => <MoneyInput id={id} value={initial} onChange={setInitial} />}
        </Field>
        <Field label="Aporte por mês">
          {(id) => <MoneyInput id={id} value={monthly} onChange={setMonthly} />}
        </Field>
        <Field label={`Prazo: ${years} anos`}>
          {(id) => (
            <input
              id={id}
              type="range"
              min={1}
              max={40}
              value={years}
              onChange={(event) => setYears(Number(event.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          )}
        </Field>
        <Field
          label="Rendimento acima da inflação, % ao ano"
          hint={
            since
              ? `Começa com a média do CDI acima da inflação desde ${since}.`
              : "Começa com o CDI de hoje menos a inflação dos últimos 12 meses."
          }
        >
          {(id) => (
            <input
              id={id}
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              className={FIELD}
            />
          )}
        </Field>
      </div>
      {last ? (
        <>
          <div aria-live="polite" className="rounded-lg bg-paper p-4">
            <p className="text-sm text-text-soft">Em {years} anos, em dinheiro de hoje</p>
            <p className="font-display text-4xl tabular-nums text-accent">
              {formatMoney(last.total)}
            </p>
            <p className="mt-2 text-sm text-text-soft">
              Você aportaria {formatMoney(last.contributed)}, e os juros somariam{" "}
              {formatMoney(last.total - last.contributed)}.
            </p>
            {worst && best && band && (
              <p className="mt-2 text-sm text-text-soft">
                Desde {band.since}, o CDI rendeu entre {formatPercent(band.worst.real)} (
                {band.worst.year}) e {formatSignedPercent(band.best.real)} ({band.best.year}) acima
                da inflação em um ano. Com a menor taxa todo ano, seriam {formatMoney(worst.total)}.
                Com a maior, {formatMoney(best.total)}.
              </p>
            )}
          </div>
          <GrowthChart points={points} />
        </>
      ) : (
        <p className="text-sm text-text-soft">Preencha um rendimento válido, como 4 ou 5,5.</p>
      )}
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
        <li>
          Vale para quem investe em algo que rende perto do CDI. Ações e fundos imobiliários oscilam
          muito mais, e a faixa acima não vale para eles.
        </li>
        <li>Sem imposto, taxas e custos. Os aportes entram no fim de cada mês.</li>
        <li>É um exemplo com taxa fixa. O futuro não repete o passado, e nada aqui é promessa.</li>
      </ul>
    </section>
  );
}
