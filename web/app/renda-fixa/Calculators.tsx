"use client";

import { useId, useState } from "react";
import {
  modifiedDuration,
  priceChange,
  regressiveTax,
  taxedEquivalent,
  zeroCouponPrice,
} from "@/lib/fixed-income";
import { formatMoney, formatPercent, formatSignedPercent } from "@/lib/phrases";

export const number = (value: number, digits = 2) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: digits });
export const FIELD = "w-full rounded-md border border-border bg-surface px-3 py-2 tabular-nums";
export const CARD = "space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** A number field that keeps what is typed and reports only valid values. */
export function parse(text: string): number | null {
  const value = Number(text.replace(",", "."));
  return text.trim() && Number.isFinite(value) ? value : null;
}

export function ExemptCalculator() {
  const [rate, setRate] = useState("90");
  const [unit, setUnit] = useState<"cdi" | "year">("cdi");
  const [days, setDays] = useState("400");
  const rateValue = parse(rate);
  const daysValue = parse(days);
  const valid = rateValue !== null && rateValue > 0 && daysValue !== null && daysValue >= 1;
  const tax = valid ? regressiveTax(Math.round(daysValue)) : null;
  const equivalent = valid ? taxedEquivalent(rateValue, Math.round(daysValue)) : null;
  const suffix = unit === "cdi" ? "% do CDI" : "% ao ano";

  return (
    <section aria-labelledby="isento" className={CARD}>
      <header className="space-y-1">
        <h2 id="isento" className="font-display text-2xl">
          Isento ou tributado?
        </h2>
        <p className="text-sm text-text-soft">
          LCI e LCA não pagam imposto de renda para pessoa física. CDB e Tesouro pagam, pela tabela
          regressiva. Esta conta mostra quanto um título tributado precisa render para empatar.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="O título isento rende">
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
        <Field label="Medido em">
          {(id) => (
            <select
              id={id}
              value={unit}
              onChange={(event) => setUnit(event.target.value as "cdi" | "year")}
              className={FIELD}
            >
              <option value="cdi">% do CDI</option>
              <option value="year">% ao ano</option>
            </select>
          )}
        </Field>
        <Field label="Prazo, em dias" hint="Até o vencimento ou o resgate.">
          {(id) => (
            <input
              id={id}
              inputMode="numeric"
              value={days}
              onChange={(event) => setDays(event.target.value)}
              className={FIELD}
            />
          )}
        </Field>
      </div>
      <div aria-live="polite" className="rounded-lg bg-paper p-4">
        {equivalent !== null && tax !== null ? (
          <>
            <p className="text-sm text-text-soft">Um título tributado precisa render</p>
            <p className="font-display text-4xl tabular-nums text-accent">
              {number(equivalent)}
              {suffix}
            </p>
            <p className="mt-2 text-sm text-text-soft">
              Em {number(Math.round(daysValue!), 0)} dias, o imposto é de {formatPercent(tax)}. Quem
              rende {number(rateValue!)}
              {suffix} sem imposto fica com o mesmo que quem rende {number(equivalent)}
              {suffix} e paga {formatPercent(tax)} sobre o ganho.
            </p>
          </>
        ) : (
          <p className="text-sm text-text-soft">
            Preencha uma taxa maior que zero e um prazo de pelo menos 1 dia.
          </p>
        )}
      </div>
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
        <li>
          Tabela regressiva: 22,5% até 180 dias, 20% até 360, 17,5% até 720 e 15% depois disso.
        </li>
        <li>Resgates em menos de 30 dias também pagam IOF, que esta conta não inclui.</li>
        <li>
          LCI e LCA têm prazo mínimo antes do resgate, e o governo discute mudar a isenção. Confira
          as regras do dia antes de decidir.
        </li>
      </ul>
    </section>
  );
}

const SHIFTS = Array.from({ length: 25 }, (_, i) => -0.03 + i * 0.0025);
const SHORT_YEARS = 2;

/** Price change against the change in rates, for the chosen term and for a short title. */
function ShockChart({ years, rate, shift }: { years: number; rate: number; shift: number }) {
  const width = 320;
  const height = 170;
  const pad = { left: 40, right: 24, top: 12, bottom: 30 };
  const lines = [
    { years, color: "var(--color-forest)", label: `${number(years, 1)} anos` },
    { years: SHORT_YEARS, color: "#7fae6a", label: `${SHORT_YEARS} anos` },
  ];
  const all = lines.flatMap((line) => SHIFTS.map((s) => priceChange(line.years, rate, s)));
  const top = Math.max(0.05, ...all);
  const bottom = Math.min(-0.05, ...all);
  const x = (s: number) => pad.left + ((s + 0.03) / 0.06) * (width - pad.left - pad.right);
  const y = (v: number) => pad.top + ((top - v) / (top - bottom)) * (height - pad.top - pad.bottom);
  const path = (lineYears: number) =>
    SHIFTS.map(
      (s, i) =>
        `${i ? "L" : "M"}${x(s).toFixed(1)},${y(priceChange(lineYears, rate, s)).toFixed(1)}`,
    ).join("");

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Variação do preço quando os juros mudam de −3 a +3 pontos. Em ${number(years, 1)} anos, vai de ${formatSignedPercent(priceChange(years, rate, 0.03))} a ${formatSignedPercent(priceChange(years, rate, -0.03))}. Em ${SHORT_YEARS} anos, de ${formatSignedPercent(priceChange(SHORT_YEARS, rate, 0.03))} a ${formatSignedPercent(priceChange(SHORT_YEARS, rate, -0.03))}.`}
        className="w-full max-w-lg"
      >
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--color-border)"
        />
        <line
          x1={x(0)}
          x2={x(0)}
          y1={pad.top}
          y2={height - pad.bottom}
          stroke="var(--color-border)"
        />
        {[top, 0, bottom].map((v) => (
          <text
            key={v}
            x={pad.left - 6}
            y={y(v) + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--color-muted)"
          >
            {formatSignedPercent(Math.round(v * 100) / 100)}
          </text>
        ))}
        {[-0.03, 0, 0.03].map((s) => (
          <text
            key={s}
            x={x(s)}
            y={height - 12}
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-muted)"
          >
            {s === 0 ? "0" : `${s > 0 ? "+" : "−"}${Math.abs(s * 100)} pts`}
          </text>
        ))}
        {lines.map((line) => (
          <path
            key={line.label}
            d={path(line.years)}
            fill="none"
            stroke={line.color}
            strokeWidth="2.5"
          />
        ))}
        <circle
          cx={x(shift)}
          cy={y(priceChange(years, rate, shift))}
          r="4.5"
          fill="var(--color-lime)"
          stroke="var(--color-forest)"
          strokeWidth="2"
        />
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-soft">
        {lines.map((line) => (
          <span key={line.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-5" style={{ background: line.color }} />
            Título de {line.label}
          </span>
        ))}
        <span>Eixo de baixo: quanto os juros mudam. Eixo do lado: quanto o preço muda.</span>
      </figcaption>
    </figure>
  );
}

export function RateShockCalculator({
  years: initialYears,
  rate: initialRate,
}: {
  years: number;
  rate: number;
}) {
  const [years, setYears] = useState(initialYears);
  const [rate, setRate] = useState(String(number(initialRate * 100)));
  const [shift, setShift] = useState(0.01);
  const rateValue = parse(rate);
  const valid = rateValue !== null && rateValue > -50 && rateValue < 100;
  const r = valid ? rateValue / 100 : 0;
  const before = zeroCouponPrice(years, r) * 1000;
  const after = zeroCouponPrice(years, r + shift) * 1000;
  const change = priceChange(years, r, shift);
  const duration = modifiedDuration(years, r);
  const moved =
    shift === 0
      ? "não mudarem"
      : `${shift > 0 ? "subirem" : "caírem"} ${number(Math.abs(shift * 100))} ${Math.abs(shift) === 0.01 ? "ponto" : "pontos"}`;

  return (
    <section id="juros" aria-labelledby="juros-titulo" className={CARD}>
      <header className="space-y-1">
        <h2 id="juros-titulo" className="font-display text-2xl">
          Se os juros mudarem
        </h2>
        <p className="text-sm text-text-soft">
          O preço de um título muda todo dia com os juros do mercado. Quem fica até o vencimento
          recebe o combinado. Quem vende antes recebe o preço do dia, que pode ser maior ou menor
          que o pago.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={`Anos até o vencimento: ${number(years, 1)}`}>
          {(id) => (
            <input
              id={id}
              type="range"
              min={0.5}
              max={30}
              step={0.5}
              value={years}
              onChange={(event) => setYears(Number(event.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          )}
        </Field>
        <Field label="Taxa do título, % ao ano" hint="No IPCA+, use a taxa acima da inflação.">
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
        <Field
          label={`Os juros mudam: ${shift > 0 ? "+" : shift < 0 ? "−" : ""}${number(Math.abs(shift * 100))} ${Math.abs(shift) === 0.01 ? "ponto" : "pontos"}`}
        >
          {(id) => (
            <input
              id={id}
              type="range"
              min={-0.03}
              max={0.03}
              step={0.0025}
              value={shift}
              onChange={(event) => setShift(Number(event.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          )}
        </Field>
      </div>
      {valid ? (
        <>
          <div aria-live="polite" className="rounded-lg bg-paper p-4">
            <p className="text-sm text-text-soft">
              Um título que paga {formatMoney(1000)} no vencimento custa hoje {formatMoney(before)}.
              Se os juros {moved}, passa a valer
            </p>
            <p className="font-display text-4xl tabular-nums text-accent">
              {formatMoney(after)}{" "}
              <span className="text-2xl text-text">({formatSignedPercent(change)})</span>
            </p>
            <p className="mt-2 text-sm text-text-soft">
              Duration modificada: {number(duration, 1)} anos. Cada ponto de juros mexe cerca de{" "}
              {number(duration, 1)}% no preço. A conta exata, acima, é um pouco diferente, porque a
              relação é curva.
            </p>
          </div>
          <ShockChart years={years} rate={r} shift={shift} />
        </>
      ) : (
        <p className="text-sm text-text-soft">Preencha uma taxa válida, como 13 ou 6,5.</p>
      )}
      <p className="text-xs text-muted">
        Vale para títulos que pagam tudo no vencimento, como o Tesouro Prefixado e o Tesouro IPCA+
        sem juros semestrais. Exemplo hipotético, sem impostos e custos.
      </p>
    </section>
  );
}
