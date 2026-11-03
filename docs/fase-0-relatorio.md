# Relatório da fase 0

Validações feitas em 2026-11-03.

| Fonte ou serviço | Resultado |
|---|---|
| `yfinance` | Aprovado |
| Tesouro Transparente | Aprovado |
| API SGS do Banco Central | Aprovado |
| Supabase | Aprovado nos limites oficiais; projeto ainda não criado |
| Vercel | Aprovado |
| Groq | Pendente: depende da chave do autor |

## yfinance

Todos os símbolos responderam localmente e nas três execuções no GitHub Actions: [1](https://github.com/ZazzySaint64/Site-Investimentos/actions/runs/41651876571), [2](https://github.com/ZazzySaint64/Site-Investimentos/actions/runs/41652026966), [3](https://github.com/ZazzySaint64/Site-Investimentos/actions/runs/41652167515). O script termina com erro se qualquer símbolo falhar.

Resultado local, 10 anos:

| Símbolo | Linhas | Desdobramentos |
|---|---:|---:|
| `PETR4.SA` | 2.491 | 0 |
| `HGLG11.SA` | 2.491 | 1 |
| `MGLU3.SA` | 2.491 | 5 |
| `AAPL` | 2.512 | 1 |
| `BTC-USD` | 3.653 | 0 |
| `USDBRL=X` | 2.601 | 0 |
| `^BVSP` | 2.483 | 0 |
| `^GSPC` | 2.512 | 0 |

- **Ajuste por desdobramento:** `Close` de `AAPL` em 2020-08-28 veio 124,81, já ajustado, com razão 4,0 em 2020-08-31. A Tarefa 8 não precisa ajustar por conta própria.
- **Barra do dia:** durante o pregão, a última linha é parcial. O job roda às 02:30 UTC, depois do fechamento, então isso não o afeta.
- **Limite do teste:** as três execuções ocorreram em poucos minutos. Só a execução agendada da fase 1 mostra o comportamento ao longo dos dias.

## Tesouro Transparente

- 14,6 MB, baixados em 9,9 s. Decodifica em UTF-8.
- 178.072 linhas desde 2004-12-31, das quais 90.785 nos últimos 10 anos.
- Última data base: 2026-10-30. Nenhuma célula vazia em `PU Base Manha`.
- 58 títulos vigentes.
- Os tipos de título são exatamente os oito da tabela da Tarefa 10.

## API SGS do Banco Central

| Consulta | Resultado |
|---|---|
| Série 12, 1 ano | HTTP 200, 0,5 s, 249 linhas |
| Série 12, 3 anos | HTTP 200, 3,1 s, 751 linhas |
| Série 12, 5 anos | HTTP 200, 0,5 s, 1.254 linhas |
| Série 433, 10 anos | HTTP 200, 0,9 s, 119 linhas |
| Janela sem dados | HTTP 404 |
| Série 12, 16 anos | HTTP 406 |

O tempo de resposta varia: uma janela de 9 anos passou de 20 s em um teste anterior. O job usa janelas de um ano, com timeout de 60 s. HTTP 404 significa janela sem dados, não erro.

## Supabase

Plano gratuito, segundo a [página de preços](https://supabase.com/pricing):

- Banco de 500 MB por projeto. Os 50 MB estimados cabem com folga.
- Pausa depois de 1 semana de inatividade. O job noturno precisa continuar ativo.
- Limite de 2 projetos ativos. Projetos pausados não contam.
- 5 GB de egress padrão e 5 GB de egress em cache.
- 50.000 usuários ativos por mês.

## Vercel

Plano Hobby, segundo a [documentação](https://vercel.com/docs/plans/hobby):

- Gratuito, restrito a uso pessoal e não comercial, o que combina com o projeto.
- 100 GB de transferência e 1 milhão de invocações de função por mês.
- 4 horas de CPU ativa por mês. O Monte Carlo roda no navegador e não consome essa cota.
- Duração máxima de função de 300 s. Suficiente para o chat.

## Groq

Pendente.
