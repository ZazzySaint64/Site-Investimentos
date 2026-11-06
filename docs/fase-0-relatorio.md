# Relatório da fase 0

Validações feitas em 2026-11-03.

| Fonte ou serviço | Resultado |
|---|---|
| `yfinance` | Aprovado |
| Tesouro Transparente | Aprovado |
| API SGS do Banco Central | Aprovado |
| Supabase | Aprovado; projeto criado em `us-east-1` |
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

Projeto `site-investimentos` criado e saudável, com Postgres 17. A chave secreta respondeu HTTP 200 na API REST e a chave publicável, HTTP 200 na API de autenticação.

**Região:** o projeto ficou em `us-east-1`, não em `sa-east-1` como o plano pedia. A spec não fixa região. As funções da Vercel rodam por [padrão em `iad1`](https://vercel.com/docs/functions/configuring-functions/region), Washington, perto de `us-east-1`, então a rota do chat fica perto do banco. Quem está no Brasil espera mais nas leituras diretas do navegador ao banco. Trocar de região exige criar outro projeto, o que hoje não custa nada, porque o banco está vazio.

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

## Fase 1

Carga completa disparada pelo autor no GitHub Actions em 2026-11-03: concluída em 124 s, com estado `partial`. Os únicos avisos são 3 cotações erradas de `XPML11`, de 14 a 16/01/2026, rejeitadas como esperado.

| Medida | Valor |
|---|---:|
| Ativos em uso | 159 (70 ações, 30 FIIs, 58 títulos do Tesouro, `^BVSP`) |
| Preços | 279.049 linhas |
| Retornos mensais | 13.312 linhas |
| Setores com estatística | 24 |
| Tamanho do banco | 61 MB, dos quais 48 MB são `prices` |

**Tamanho:** o banco já passou dos 50 MB estimados, mesmo só com o Brasil. O limite do plano gratuito é 500 MB, então ainda há folga. Vale medir de novo ao incluir EUA e cripto.

**Problemas encontrados nos dados reais:**

- `NATU3`: Yahoo mantém o preço parado em 36,86 de dezembro de 2019 a julho de 2025. Trocado por `AZZA3`, o próximo maior peso do Ibovespa.
- `UGPA3`: Yahoo muda de escala em 28/06/2021 (de 8,75 para 19,19). O histórico começa nessa data, por `jobs/catalog/history_starts.csv`.
- `XPML11`: cotações ruins em janeiro de 2026 criaram um fator de ajuste falso. `repair_adjusted_close` remove esse degrau.
- `MGLU3`: queda de 58% em 26/10/2026, com volume alto e sem desdobramento informado. Liberada em `jobs/catalog/released_prices.csv`, mas não confirmada em outra fonte.

**Execução agendada:** a primeira execução automática de `nightly` foi criada às 09:39 UTC de 2026-11-04, cerca de 7 horas depois do horário marcado de 02:30 UTC, e terminou com sucesso. A fase 1 está pronta.

## Fase 2

Publicada em https://site-investimentos-gray.vercel.app em 2026-11-04, a partir de `main`, no plano Hobby da Vercel.

Tempos medidos de um computador no Brasil. A função roda em `iad1`, na mesma região do banco.

| Medida | Valor |
|---|---:|
| Carga de `/` no navegador | 0,5 s |
| Carga de `/dados` no navegador | 0,65 s |
| Carga de `/` logo depois de um deploy | 3,1 a 4,4 s |
| Primeira visita a `/dados/PETR4`, por `curl` | 2,5 s |
| Visitas seguintes às páginas com dados, por `curl` | 0,5 a 0,7 s |
| Tamanho do banco | 61 MB |
| Preços | 279.047 linhas |

Foram poucas medições, então os valores servem como ordem de grandeza.

**Conferido na URL pública, em navegador novo e sem login:** chegada à carteira de exemplo em um clique, troca de pessoa, abertura de um ativo, data dos dados e largura de 375 px em seis páginas, sem rolagem horizontal. O celular foi simulado no Chromium.

**Erro na publicação:** o primeiro deploy falhou com `Next.js encountered uncached or runtime data during prerendering`. A causa provável foi um valor errado nas variáveis da Vercel: no commit que falhou, `SUPABASE_URL` inexistente ou com espaço no final reproduz o mesmo erro em `/`. O valor exato não foi confirmado. O site passou a funcionar depois que as variáveis foram corrigidas.

A primeira correção, com `Suspense` em `/` e `instant = false` em `/dados`, deixou o build passar e escondeu o problema, porque as telas com dados continuaram em erro. Ela foi mantida para que a tela inicial abra com o banco fora. O custo é que uma variável errada não impede mais o deploy, então é preciso conferir a URL pública depois de mudar uma variável.

## Fase 3

Publicada em https://site-investimentos-gray.vercel.app em 2026-11-06, a partir de `main` (`c32351e`). Nenhuma variável nova na Vercel.

Entraram login por e-mail e senha, questionário de perfil, lançamento de compras, vendas e renda fixa, importação do extrato de negociação da B3, carteira própria com proventos e comparação com CDI e IPCA, "Por onde começar", reserva de emergência, simulador de aportes, "Conferir um investimento" e links para o Status Invest e a B3.

Antes do envio: lint sem erros, 120 testes unitários passando e `next build` sem erro nas 21 rotas.

Tempos medidos por `curl`, de um computador no Brasil, três visitas por página, logo depois do deploy:

| Medida | Valor |
|---|---:|
| `/` | 0,7 a 3,0 s (a mais lenta foi a primeira) |
| `/demo/ana` | 0,4 a 0,7 s |
| `/dados/PETR4` | 0,5 a 1,6 s |
| `/comecar`, `/primeiros-passos`, `/conferir` | 0,3 a 0,7 s |
| Tamanho do banco | 62 MB |
| Preços | 279.109 linhas |
| Proventos | 3.657 linhas |

**Conferido na URL pública, sem login:** 12 páginas respondem 200. A carteira de exemplo mostra os proventos e a comparação com CDI e IPCA. `/carteira/importar` leva a `/entrar`. Oito páginas na largura de 375 px não têm rolagem horizontal e não deram erro de JavaScript. O celular foi simulado no Chromium.

**Não conferido:** o tempo de `/carteira` com login, o cadastro real com confirmação por e-mail e a recuperação de senha na URL pública, o provedor e o limite do SMTP, um celular físico e a importação com um extrato real da B3. O autor informou que configurou Site URL, Redirect URLs e SMTP no Supabase. Pela API pública, só foi possível confirmar que a confirmação de e-mail está ligada.
