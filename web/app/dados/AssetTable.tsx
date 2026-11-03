"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Term } from "@/components/Term";
import type { AssetRow } from "@/lib/data";
import {
  CLASS_LABELS,
  formatMoney,
  formatPercent,
  formatSignedPercent,
  riskLabel,
} from "@/lib/phrases";

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "acao_br", label: "Ações" },
  { value: "fii", label: "Fundos imobiliários" },
  { value: "tesouro", label: "Tesouro Direto" },
  { value: "indice", label: "Índice" },
];
const HEADER_CELL = "px-4 py-3 text-right font-medium";

export function AssetTable({ assets }: { assets: AssetRow[] }) {
  const [search, setSearch] = useState("");
  const [assetClass, setAssetClass] = useState("");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter(
      (asset) =>
        (!assetClass || asset.class === assetClass) &&
        (!term || `${asset.ticker} ${asset.name}`.toLowerCase().includes(term)),
    );
  }, [assets, search, assetClass]);

  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-1 text-xs text-muted">
        Buscar por nome ou código
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Petrobras, VALE3, Tesouro Selic..."
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const active = assetClass === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={active}
              onClick={() => setAssetClass(filter.value)}
              className={`rounded-full border px-3 py-1 text-sm ${
                active
                  ? "border-accent font-medium text-accent"
                  : "border-border text-text-soft hover:text-text"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
        <p aria-live="polite" className="ml-auto text-sm text-muted">
          {visible.length} de {assets.length}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Ativo
              </th>
              <th scope="col" className={`${HEADER_CELL} hidden sm:table-cell`}>
                Último preço
              </th>
              <th scope="col" className={HEADER_CELL}>
                <Term name="retorno">Retorno ao ano</Term>
              </th>
              <th scope="col" className={HEADER_CELL}>
                <Term name="volatilidade">Oscilação</Term>
              </th>
              <th scope="col" className={`${HEADER_CELL} hidden sm:table-cell`}>
                <Term name="queda">Maior queda</Term>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((asset) => {
              const stats = asset.asset_stats;
              const volatility = stats?.volatility ?? null;
              const close = asset.prices[0]?.close ?? null;
              return (
                <tr key={asset.ticker} className="hover:bg-border/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dados/${encodeURIComponent(asset.ticker)}`}
                      className="font-medium text-accent underline-offset-2 hover:underline"
                    >
                      {asset.name}
                    </Link>
                    <span className="block text-xs text-muted">
                      {CLASS_LABELS[asset.class]}
                      {asset.class !== "tesouro" && (
                        <span className="font-mono"> · {asset.ticker}</span>
                      )}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono sm:table-cell">
                    {asset.class === "indice"
                      ? (close?.toLocaleString("pt-BR") ?? "—")
                      : formatMoney(close)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatSignedPercent(stats?.return_annual ?? null)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span>{riskLabel(volatility)}</span>
                    <span className="block font-mono text-xs text-muted">
                      {volatility === null ? "" : formatPercent(volatility)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono sm:table-cell">
                    {formatSignedPercent(stats?.max_drawdown ?? null)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="p-4 text-sm text-text-soft">
            Nenhum ativo encontrado. Tente outro nome ou limpe a busca.
          </p>
        )}
      </div>
    </div>
  );
}
