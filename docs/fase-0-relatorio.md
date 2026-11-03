# Relatório da fase 0

Validações feitas em 2026-11-03.

| Fonte ou serviço | Resultado |
|---|---|
| `yfinance` | Aprovado |
| Tesouro Transparente | Aprovado |
| API SGS do Banco Central | Aprovado |
| Supabase | Aprovado nos limites oficiais; projeto ainda não criado |
| Vercel | Aprovado |
| Groq | Aprovado com `openai/gpt-oss-120b`; `llama-3.3-70b-versatile` não existe mais para esta conta |

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

**Modelo escolhido: `openai/gpt-oss-120b`.**

`llama-3.3-70b-versatile`, o modelo inicial da spec, respondeu HTTP 404 (`model_not_found`) e não aparece em `GET /models`. Testei as alternativas de chat listadas para esta conta:

| Modelo | Resultado | Tokens nas 5 perguntas | Média |
|---|---|---:|---:|
| `openai/gpt-oss-120b` | HTTP 200 em tudo; ferramenta chamada na 1ª pergunta | 622, 869, 675, 337, 844 | 669 |
| `openai/gpt-oss-20b` | HTTP 200 em tudo; ferramenta chamada na 1ª pergunta | 604, 1.121, 607, 231, 828 | 678 |
| `qwen/qwen3.8-27b` | Reprovado: HTTP 400 `tool_use_failed` na 1ª pergunta e HTTP 429 em seguida | Incompleto | n/a |

**Por que o 120b:** o português ficou melhor e os números da ferramenta vieram corretos. Recusou o pedido de compra e disse que não dá para prever a alta de PETR4. O 20b explicou volatilidade de forma errada ("variação diária média... ao ano") e, na pergunta sobre a alta, não disse que não dá para prever.

**Problemas a tratar na fase 6:**

- A resposta sobre Sharpe foi cortada pelo limite de 500 tokens. O prompt precisa pedir respostas curtas.
- O modelo citou faixas de Sharpe que não vieram da ferramenta. Isso confirma a necessidade do validador de números.

**Cota:**

| Limite | Valor | Origem |
|---|---:|---|
| Requisições por dia | 1.000 | Header da resposta e documentação |
| Tokens por minuto | 8.000 | Header da resposta e documentação |
| Requisições por minuto | 30 | [Documentação](https://console.groq.com/docs/rate-limits) |
| Tokens por dia | 200.000 | Documentação; não vem nos headers |

`CHAT_GLOBAL_DAILY_LIMIT` = 70% de (200.000 / 669) = **209 perguntas por dia**. Acima do mínimo de 20.

- A pergunta com ferramenta usa 2 requisições: 209 perguntas usam no máximo 418 das 1.000.
- Os 8.000 tokens por minuto permitem cerca de 11 perguntas por minuto no site inteiro.
- O teste enviou uma pergunta por vez. As últimas 6 mensagens do chat aumentam o custo, então o valor precisa de nova medição na fase 6.
- A documentação não deixa claro se a tabela vale para o plano gratuito. Os headers desta conta coincidem com ela, mas os 200.000 tokens por dia dependem de confirmação no painel.

**Retenção zero:** a [documentação](https://console.groq.com/docs/your-data) diz que todos os clientes podem ativá-la em Data Controls. Sem ela, entradas e saídas podem ficar até 30 dias em registros de diagnóstico. A página não diz se os dados são usados para treinamento. Confirmação da ativação nesta conta: pendente do autor.
