/**
 * Links to other places where a person can check the same investment. The site only links:
 * B3 forbids automated collection and redistribution, and Status Invest blocks automated access.
 */
export function externalSources(
  ticker: string,
  assetClass: string,
): { name: string; href: string; what: string }[] {
  const code = ticker.toLowerCase();
  if (assetClass === "fii") {
    return [
      {
        name: "Status Invest",
        href: `https://statusinvest.com.br/fundos-imobiliarios/${code}`,
        what: "indicadores e histórico de rendimentos",
      },
      {
        name: "B3",
        href: "https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/fundos-de-investimentos/fii/fiis-listados/",
        what: "lista oficial de FIIs, com documentos do fundo",
      },
    ];
  }
  if (assetClass === "acao_br") {
    return [
      {
        name: "Status Invest",
        href: `https://statusinvest.com.br/acoes/${code}`,
        what: "indicadores e histórico de proventos",
      },
      {
        name: "B3",
        href: "https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/empresas-listadas.htm",
        what: "cadastro oficial da empresa e eventos corporativos",
      },
    ];
  }
  return [];
}

export function ExternalSources({ ticker, assetClass }: { ticker: string; assetClass: string }) {
  const links = externalSources(ticker, assetClass);
  if (!links.length) return null;
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">Confira também em outras fontes</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.name}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent underline-offset-2 hover:underline"
            >
              {link.name}
            </a>
            <span className="text-text-soft">: {link.what}. Abre em outra aba.</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        São sites de terceiros. O Site Investimentos não copia dados deles, e os números podem
        diferir pela data e pelo método de cada um.
      </p>
    </div>
  );
}
