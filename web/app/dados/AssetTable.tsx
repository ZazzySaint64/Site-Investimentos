"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AssetRow } from "@/lib/data";
import { formatMoney, formatPercent, formatSignedPercent } from "@/lib/phrases";

const CLASS_LABELS: Record<string, string> = {
  acao_br: "Ação",
  fii: "Fundo imobiliário",
  tesouro: "Tesouro Direto",
  indice: "Índice",
};

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
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs text-muted">
          Buscar
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="PETR4, Vale, Tesouro..."
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Tipo
          <select
            value={assetClass}
            onChange={(event) => setAssetClass(event.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
          >
            <option value="">Todos</option>
            {Object.entries(CLASS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <p aria-live="polite" className="py-2 text-sm text-text-soft">
          {visible.length} de {assets.length} ativos
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-3 font-medium">Ativo</th>
              <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Último preço</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Retorno ao ano</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Oscilação</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Maior queda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((asset) => {
              const stats = asset.asset_stats;
              return (
                <tr key={asset.ticker} className="hover:bg-border/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dados/${encodeURIComponent(asset.ticker)}`}
                      className="font-mono text-accent underline-offset-2 hover:underline"
                    >
                      {asset.ticker}
                    </Link>
                    <span className="block text-xs text-text-soft">{asset.name}</span>
                  </td>
                  <td className="px-4 py-3 text-text-soft">{CLASS_LABELS[asset.class]}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {asset.class === "indice"
                      ? (asset.prices[0]?.close.toLocaleString("pt-BR") ?? "—")
                      : formatMoney(asset.prices[0]?.close ?? null)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatSignedPercent(stats?.return_annual ?? null)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatPercent(stats?.volatility ?? null)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatSignedPercent(stats?.max_drawdown ?? null)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="p-4 text-sm text-text-soft">Nenhum ativo encontrado.</p>
        )}
      </div>
    </div>
  );
}
