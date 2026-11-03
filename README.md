# Site-Investimentos

Um site que trabalha com dados de investimentos, focado em pessoas leigas: carteira, estatísticas, previsões e uma IA que explica os números.

> **Projeto educativo e não comercial.** Nada aqui é recomendação de investimento. Rentabilidade passada não garante resultado futuro.

## Estado atual

O job de dados está pronto, e a página `/dados` mostra o que ele gravou: juros e inflação, ativos, gráfico de preços, estatísticas e as últimas atualizações. As demais telas vêm nas próximas fases.

Todas as noites, às 02:30 UTC, o job no GitHub Actions atualiza preços, séries macro, Tesouro Direto e estatísticas no Supabase. O site só vai ler do banco, nunca das fontes externas.

## Fontes de dados

| Fonte | Dados |
|---|---|
| Yahoo Finance, via `yfinance` | Ações e fundos imobiliários do Brasil e o Ibovespa |
| [API SGS do Banco Central](https://dadosabertos.bcb.gov.br/) | Selic, CDI e IPCA |
| [Tesouro Transparente](https://www.tesourotransparente.gov.br/) | Preços do Tesouro Direto |

Os catálogos de ações e fundos seguem as maiores participações do Ibovespa e do IFIX publicadas pela B3.

## Abrir o site localmente

É preciso Node.js 24. Copie `web/.env.example` para `web/.env.local` e preencha com a URL do projeto Supabase e a chave publicável.

```bash
cd web
npm install
npm run dev
```

Abra `http://localhost:3000`. Testes: `npm test`.

## Rodar os jobs localmente

É preciso Python 3.12. Copie `.env.example` para `.env` e preencha `SUPABASE_URL` e `SUPABASE_SECRET_KEY`. O arquivo `.env` fica fora do Git.

```bash
cd jobs
python -m venv .venv
.venv/Scripts/pip install -r requirements-dev.txt
```

Testes e lint:

```bash
.venv/Scripts/ruff check .
.venv/Scripts/pytest -m "not integration"
```

Os testes com a marca `integration` usam o projeto Supabase remoto e o Yahoo.

Job, em poucos ativos ou com o histórico completo:

```bash
.venv/Scripts/python -m pipeline.nightly --tickers PETR4,HGLG11
.venv/Scripts/python -m pipeline.nightly --full
```

Um preço com variação acima de 50% sem desdobramento é rejeitado e registrado em `job_runs`. Se a variação for real, registre a data em `jobs/catalog/released_prices.csv`. Para uma única execução, use `--release TICKER:AAAA-MM-DD`. Se o erro estiver nos preços anteriores da fonte, registre o início confiável do histórico em `jobs/catalog/history_starts.csv`.

## Documentação

- [Spec](docs/superpowers/specs/2026-11-03-site-investimentos-design.md)
- [Plano das fases 0 e 1](docs/superpowers/plans/2026-11-03-fase-0-1-validacao-e-dados.md)
- [Relatório da fase 0](docs/fase-0-relatorio.md)
