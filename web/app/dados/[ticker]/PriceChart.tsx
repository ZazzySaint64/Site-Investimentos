"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PricePoint } from "@/lib/data";
import { formatDate, formatMoney, yearTicks } from "@/lib/phrases";

const AXIS_TICK = { fill: "var(--color-muted)", fontSize: 12 };

function formatPrice(value: number, isIndex: boolean): string {
  return isIndex ? value.toLocaleString("pt-BR") : formatMoney(value);
}

export function PriceChart({ points, isIndex }: { points: PricePoint[]; isIndex: boolean }) {
  const ticks = yearTicks(points.map((point) => point.date));
  return (
    <div className="h-72 w-full" role="img" aria-label="Gráfico do preço de fechamento ao longo do tempo">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            ticks={ticks.length ? ticks : undefined}
            tickFormatter={(date: string) =>
              ticks.length ? date.slice(0, 4) : `${date.slice(5, 7)}/${date.slice(0, 4)}`
            }
            minTickGap={ticks.length ? 8 : 48}
            stroke="var(--color-border)"
          />
          <YAxis
            tick={AXIS_TICK}
            width={64}
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => value.toLocaleString("pt-BR")}
            stroke="var(--color-border)"
          />
          <Tooltip
            cursor={{ stroke: "var(--color-muted)" }}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-text)",
            }}
            labelStyle={{ color: "var(--color-text-soft)" }}
            itemStyle={{ color: "var(--color-text)" }}
            labelFormatter={(date) => formatDate(String(date))}
            formatter={(value) => [formatPrice(Number(value), isIndex), "Preço"]}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: "var(--color-surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
