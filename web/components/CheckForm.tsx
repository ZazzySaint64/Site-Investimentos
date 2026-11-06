/** Search for one investment by code or name. A plain form, so it works without JavaScript. */
export function CheckForm({
  defaultValue = "",
  options = [],
  tone = "light",
}: {
  defaultValue?: string;
  options?: { ticker: string; name: string }[];
  tone?: "light" | "lime";
}) {
  const button =
    tone === "lime" ? "bg-forest text-lime hover:bg-accent" : "bg-lime text-forest hover:bg-mist";
  return (
    <form action="/conferir" role="search" className="flex w-full max-w-xl flex-wrap gap-2">
      <label htmlFor="ativo" className="w-full text-sm font-medium">
        Código ou nome do investimento
      </label>
      <input
        id="ativo"
        name="ativo"
        defaultValue={defaultValue}
        required
        list={options.length ? "ativos" : undefined}
        placeholder="Ex.: MXRF11 ou Petrobras"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-full border border-forest/20 bg-surface px-4 py-3 text-text"
      />
      {options.length > 0 && (
        <datalist id="ativos">
          {options.map((option) => (
            <option key={option.ticker} value={option.ticker}>
              {option.name}
            </option>
          ))}
        </datalist>
      )}
      <button type="submit" className={`rounded-full px-5 py-3 font-semibold ${button}`}>
        Conferir
      </button>
    </form>
  );
}
