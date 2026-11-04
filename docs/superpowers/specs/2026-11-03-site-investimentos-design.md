# Site Investimentos: design

Data: 2026-11-03. Estado: aguardando revisão.

## 1. Objetivo

Site público de análise de investimentos para quem não entende do assunto. Funciona como carteira, mostra estatísticas e previsões com a incerteza visível, e tem um assistente de IA que só afirma o que os dados sustentam.

O projeto é peça de portfólio com foco em front-end. Também demonstra análise de dados, integração de APIs, IA e banco de dados.

### Critérios de sucesso

- Um visitante vê o site completo, com dados, em um clique e sem criar conta.
- Um leigo entende cada número da tela pela frase simples que o acompanha.
- Toda afirmação numérica da IA vem de uma ferramenta e passa pela validação automática.
- O site continua no ar quando uma fonte de dados falha, mostrando a data do último dado.
- O custo mensal é zero.

### Fora da v1

Alertas, notícias, imposto de renda, importação da B3, Open Finance, proventos na carteira, ETFs e histórico salvo de conversas. A importação da B3 é a primeira candidata depois da v1.

## 2. Decisões

| Tema | Decisão |
|---|---|
| Mercados | Brasil, EUA e cripto, entregues nessa ordem |
| Carteira | Lançamento manual com login, mais modo demo sem login |
| IA | Educativa na carteira real; "compre/venda" só no demo fictício |
| Previsões | Monte Carlo para a carteira; ML com backtest para cada ativo |
| Arquitetura | Jobs Python noturnos gravam no banco; o site só lê do banco |
| Stack | Next.js, TypeScript, Tailwind, Recharts, Supabase, Python, GitHub Actions, Vercel |
| Modelo de IA | Groq, plano gratuito |
| Visual | "Terminal calmo": escuro e denso, com frase simples sob cada número |
| Autoria | Claude constrói o site, sob direção do autor. O autor decide, testa e configura os painéis |
| Custo e prazo | Custo zero, sem data limite |
| Idioma | Interface em português do Brasil; README em português e inglês |

## 3. Limite regulatório

A Resolução CVM 19 define consultoria como orientação profissional e individualizada. O risco está em recomendar ativos com base na carteira real de uma pessoa, e um aviso legal provavelmente não elimina esse risco.

Regras que decorrem disso:

- Carteira real: a IA explica, aponta riscos e compara cenários. Nunca sugere comprar ou vender um ativo específico.
- Rebalanceamento da carteira real: só por classe de ativo, com meta escolhida pelo usuário.
- Demo: sugestões "compre X" e "venda Y" aparecem só com carteira fictícia e a faixa "exemplo com carteira fictícia".
- O questionário de perfil é simplificado e a tela informa que ele não substitui avaliação profissional.
- Aviso fixo no chat: "Conteúdo educativo. Não é recomendação de investimento."
- O site não cobra nada e o README informa que é projeto educativo e não comercial. Qualquer monetização exige consulta jurídica antes.

Esta seção é uma leitura técnica, não parecer jurídico.

## 4. Arquitetura

```
Fontes externas        Jobs Python               Supabase            Next.js (Vercel)
yfinance          -->  ingestão            -->   dados públicos  --> páginas
API SGS (BCB)          estatísticas              dados do usuário    Monte Carlo (Web Worker)
Tesouro Transparente   ML e backtest             uso da IA           rota do chat --> Groq
                       motor de regras
```

Regra central: o site nunca chama as fontes externas. Ele lê apenas do banco.

### Estrutura do repositório

```
web/                  Next.js
jobs/                 Python: ingestão, estatísticas, ML, regras
supabase/migrations/  esquema e políticas RLS
.github/workflows/    CI e jobs agendados
docs/                 specs e planos
```

### Agendamento

- `nightly`, todo dia às 02:30 UTC, depois do fechamento dos mercados: ingestão, estatísticas, ML, regras.
- `weekly-demo`, aos domingos: gera `demo_answers`.
- `backfill`, manual: baixa o histórico completo de um ou mais ativos.

O GitHub desativa workflows agendados de repositórios públicos sem atividade por 60 dias. O job `nightly` só grava no banco, então isso não conta como atividade. Um workflow mensal reativa os agendamentos pela API do GitHub. Se os jobs pararem, o Supabase gratuito também pode pausar por inatividade.

## 5. Fontes de dados

| Dado | Fonte |
|---|---|
| Ações B3 e FIIs | `yfinance`, sufixo `.SA` |
| Ações EUA | `yfinance` |
| Cripto | `yfinance`, formato `BTC-USD` |
| Dólar | `yfinance`, `USDBRL=X`, gravado em `macro_series` |
| Índices de referência | `yfinance`: `^BVSP`, `^GSPC`; para cripto, `BTC-USD` |
| Selic, CDI, IPCA | API SGS do Banco Central |
| Tesouro Direto | Planilha de preços e taxas do Tesouro Transparente, coluna PU Base |

A brapi foi descartada como fonte principal: seu plano gratuito traz só 3 meses de histórico diário.

O `yfinance` não é oficial e os termos do Yahoo restringem o uso a fins pessoais. O site é educativo e não comercial. A fase 0 valida a fonte. Se ela reprovar, o projeto volta à alternativa de uma API por mercado (arquivos históricos da B3, Twelve Data ou Finnhub, CoinGecko) antes de continuar.

### Catálogo

Lista fixa em arquivo versionado no repositório, com cerca de 150 ativos:

- 70 ações B3 e 30 FIIs
- 30 ações EUA
- 20 cripto
- Títulos vigentes do Tesouro Direto, à parte dessa contagem

O ML cobre 50 deles: 20 ações B3, 5 FIIs, 15 ações EUA e 10 cripto.

## 6. Modelo de dados

### Dados públicos

Qualquer um lê. Só os jobs escrevem, com a chave secreta do Supabase (`sb_secret_...`, papel `service_role`) guardada nos secrets do GitHub.

| Tabela | Colunas principais |
|---|---|
| `assets` | `id`, `ticker`, `name`, `class`, `currency`, `sector`, `maturity`, `holdable`, `ml_enabled`, `active` |
| `prices` | `asset_id`, `date`, `close`, `adj_close`; chave (`asset_id`, `date`) |
| `splits` | `asset_id`, `date`, `ratio` |
| `macro_series` | `series`, `date`, `value` |
| `monthly_returns` | `asset_id`, `month`, `ret_local`, `ret_brl` |
| `asset_stats` | `asset_id`, `as_of`, `return_annual`, `volatility`, `sharpe`, `max_drawdown`, `corr_benchmark` |
| `sector_stats` | `sector`, `as_of`, `worst_month_ret`, `worst_month`, `volatility` |
| `forecasts` | `asset_id`, `as_of`, `model`, `p10`, `p50`, `p90` |
| `backtests` | `asset_id`, `as_of`, `pinball_ml`, `pinball_baseline`, `coverage`, `use_ml` |
| `job_runs` | `job`, `started_at`, `finished_at`, `status`, `details` |

`class` aceita `acao_br`, `fii`, `acao_eua`, `cripto`, `tesouro` e `indice`. Índices têm `holdable = false`.

### Demo

Público e fictício: `demo_personas`, `demo_transactions`, `demo_recommendations`, `demo_answers`.

Personas: Bruno (conservador), Ana (moderada) e Carla (arrojada). Os nomes são fictícios.

### Dados do usuário

Protegidos por RLS com `auth.uid() = user_id`.

| Tabela | Colunas principais |
|---|---|
| `profiles` | `user_id`, `risk_profile`, `target_allocation` |
| `transactions` | `id`, `user_id`, `asset_id`, `type`, `quantity`, `price`, `date` |
| `fixed_income` | `id`, `user_id`, `name`, `principal`, `cdi_pct`, `start_date`, `maturity`, `daily_liquidity` |
| `chat_usage` | `user_id`, `day`, `count` |

### Regras do modelo

- A posição nunca é salva. É sempre calculada a partir das transações.
- `transactions` só muda pelas funções SQL `add_transaction` e `delete_transaction`. Elas rejeitam quantidade zero ou negativa, data futura e qualquer mudança que deixe a posição negativa em alguma data.
- O chat não guarda histórico no banco. A conversa fica só na aba aberta.
- Apagar a conta remove todos os dados do usuário em cascata.

## 7. Cálculos

### Valor da carteira

- Valores são convertidos para reais pelo dólar do dia.
- Quantidade corrigida = quantidade da transação × produto dos `ratio` de `splits` posteriores à data da transação.
- Preço de cada ativo: último `close` até a data. Isso também cobre fins de semana e feriados.
- CDB e similares: `principal` corrigido por `cdi_pct` do CDI diário, de `start_date` até hoje ou até `maturity`. Valor bruto, sem imposto.
- Proventos não entram no valor nem no resultado da carteira. As estatísticas usam preço ajustado, que considera proventos. A tela de metodologia explica essa diferença.

Ao detectar novo desdobramento, o job baixa de novo todo o histórico do ativo, porque a fonte reajusta os preços passados.

### Estatísticas por ativo (Python)

Janela: últimos 5 anos ou o histórico disponível, com mínimo de 12 meses. Abaixo disso, as métricas ficam nulas.

- `return_annual`: retorno ajustado composto e anualizado.
- `volatility`: desvio-padrão dos retornos mensais × √12. Base mensal evita diferenças entre mercados com 252 e 365 dias de negociação.
- `sharpe`: (`return_annual` − CDI anualizado) / `volatility`, em reais.
- `max_drawdown`: maior queda desde um pico, com `adj_close` diário.
- `corr_benchmark`: correlação com o índice de referência.

### Perfil e metas

O questionário tem 5 perguntas (prazo, reação a uma queda de 20%, objetivo, experiência e reserva) e define um perfil. O usuário pode alterar a meta sugerida.

| Classe | Conservador | Moderado | Arrojado |
|---|---:|---:|---:|
| Renda fixa | 70% | 40% | 15% |
| Ações Brasil | 15% | 30% | 40% |
| FIIs | 10% | 15% | 15% |
| Ações EUA | 5% | 10% | 20% |
| Cripto | 0% | 5% | 10% |
| **Volatilidade alvo** | 6% | 12% | 20% |
| **Reserva alvo** | 30% | 15% | 5% |

Renda fixa inclui Tesouro e `fixed_income`.

### Nota de saúde (0 a 100, TypeScript)

Fórmula pública, sem IA. Cada parte mostra o que faria a nota subir.

| Parte | Peso | Cálculo |
|---|---:|---|
| Concentração | 30 | Metade pelo maior ativo (cheia até 10%, zero em 40%). Metade pelo maior setor (cheia até 25%, zero em 60%). Linear entre os limites. |
| Diversificação | 25 | `N = 1 / soma(peso_classe²)`. Nota = 25 × min(1, (N − 1) / 2). |
| Risco × perfil | 25 | Nota = 25 × (1 − min(1, excesso / alvo)), com `excesso = max(0, vol_carteira − alvo)`. |
| Reserva | 20 | Nota = 20 × min(1, parte_em_reserva / reserva_alvo). |

- `vol_carteira`: desvio-padrão dos retornos mensais da carteira com os pesos atuais × √12. Renda fixa indexada usa CDI.
- Reserva: Tesouro Selic e `fixed_income` com `daily_liquidity = true`.
- Faixas: 0 a 39 "atenção", 40 a 69 "regular", 70 a 84 "boa", 85 a 100 "muito boa".

Os pesos e limites são escolhas de projeto, e a tela de metodologia os apresenta como tal. Carteira com menos de 12 meses de dados em comum não recebe a parte de risco; as outras partes são reescaladas para 100.

### Monte Carlo (TypeScript, Web Worker)

- 5.000 caminhos. Cada mês simulado sorteia um mês real do histórico, com reposição.
- O mesmo mês sorteado vale para todos os ativos e para o IPCA, o que preserva correlação e quedas reais.
- Usa `ret_brl`. Renda fixa indexada usa CDI do mês sorteado.
- O usuário ajusta prazo (1 a 10 anos) e aporte mensal. O aporte segue os pesos atuais. Não há rebalanceamento durante a simulação.
- Saída: P5, P50 e P95 por mês, em valor nominal ou descontando o IPCA sorteado.
- Usa só meses em que todos os ativos têm dados. Com menos de 36 meses em comum, a tela avisa que a faixa é pouco confiável.
- Semente configurável, para os testes serem reproduzíveis.

Sortear meses independentes ignora sequências de quedas. Se isso pesar nos resultados, trocar por sorteio em blocos.

### ML (Python)

- Um modelo único para os 50 ativos: `HistGradientBoostingRegressor(loss="quantile")`, com um ajuste para cada quantil: `p10`, `p50` e `p90`.
- Alvo: retorno em 21 pregões; em cripto, 30 dias corridos.
- Entradas: retorno de 1, 3, 6 e 12 meses, volatilidade, queda atual, retorno do índice de referência e Selic.
- Backtest walk-forward nos últimos 3 anos, em passos mensais, com intervalo de um horizonte entre treino e teste.
- Modelo ingênuo: quantis empíricos dos retornos do próprio ativo nos 5 anos anteriores.
- Métricas: pinball loss e cobertura da faixa, comparada aos 80% esperados.
- `use_ml = pinball_ml < pinball_baseline`. Quando for falso, `forecasts` grava a faixa ingênua e a tela diz que o ML não venceu nesse ativo.

### Motor de regras (Python, só demo)

Compara cada persona com sua meta. Gera no máximo 5 sugestões e guarda os números que originaram cada uma.

1. Classe mais de 5 pontos acima da meta: vender o maior ativo da classe até voltar à meta.
2. Ativo acima de 20% da carteira: reduzir até 20%.
3. Classe mais de 5 pontos abaixo da meta: comprar o ativo da classe com `ml_enabled`, `p50` positivo e menor correlação com a carteira. Em renda fixa, Tesouro Selic. Sem candidato, não gera sugestão.

### Rebalanceamento (TypeScript, carteira real)

O usuário define a meta por classe e vê quanto falta ou sobra em reais em cada uma. A tela nunca cita ativo específico.

## 8. IA

### Fluxo

1. A rota `POST /api/chat`, no servidor, verifica sessão e cota e incrementa o contador de forma atômica.
2. Chama a Groq por `fetch` no endpoint compatível com OpenAI, com as últimas 6 mensagens e no máximo 500 tokens de resposta.
3. Executa as ferramentas pedidas pela IA.
4. Valida a resposta final.
5. Devolve o texto e as fontes usadas.

Não há streaming, porque a validação precisa da resposta completa. A tela mostra as etapas em andamento, por exemplo "consultando previsão de PETR4...".

### Ferramentas (somente leitura)

| Ferramenta | Retorna |
|---|---|
| `get_portfolio_summary` | Percentuais por classe e setor, nota de saúde e métricas |
| `get_asset_stats(ticker)` | Linha de `asset_stats` |
| `get_sector_stats(sector)` | Linha de `sector_stats` |
| `get_forecast(ticker)` | Faixa e resultado do backtest |
| `get_macro(serie)` | Último valor e variação em 12 meses |
| `get_simulation_result` | Última simulação feita no navegador, recebida com a pergunta e validada por esquema |

O ID do usuário vem da sessão, nunca de um argumento da IA. O texto do usuário e os resultados das ferramentas são dados, não instruções.

### Travas no código

- **Números:** todo número da resposta precisa corresponder a um valor de ferramenta, considerando formato brasileiro, arredondamento e a escala ×100 de percentuais. Ficam isentos tickers, datas presentes nos resultados e números da própria pergunta. A IA não faz contas próprias: um número derivado é rejeitado de propósito.
- **Recomendação:** na carteira real, bloqueia "compre", "venda", "recomendo" e variações perto de um ticker.
- **Promessa:** bloqueia "garantido", "sem risco" e parecidos.
- **Falha na validação:** uma nova tentativa, com o motivo da rejeição. Falhando de novo, a resposta é "não consegui confirmar esses dados".

Filtro por palavras não pega tudo. O conjunto de avaliação mede esse limite e a tela de metodologia o declara.

### Privacidade

Só vão à Groq percentuais e métricas. Nome, e-mail e valores em reais não são enviados. A retenção zero da Groq é ativada se o plano gratuito permitir (verificar na fase 0).

### Limites

- 10 mensagens por usuário por dia.
- Teto diário do site em `CHAT_GLOBAL_DAILY_LIMIT`, inicialmente 40, ajustado na fase 0 à cota real do painel da Groq.
- Cota esgotada mostra aviso no chat; o resto do site segue normal.

### Demo

Visitante sem login só usa perguntas sugeridas. O job `weekly-demo` gera 5 respostas por persona, 15 no total, salvas em `demo_answers`. Elas passam pelas travas de números e promessa, mas não pela de recomendação, porque o demo pode citar sugestões do motor de regras.

### Modelo

Começa com `llama-3.3-70b-versatile`. A fase 0 compara com `openai/gpt-oss-120b` em português e chamada de ferramentas, e o melhor fica.

## 9. Telas

| # | Tela | Conteúdo | Quem constrói |
|---|---|---|---|
| 1 | Início | Proposta do site e botão "ver demo" | Claude |
| 2 | Questionário | 5 perguntas, perfil e meta | Claude |
| 3 | Painel | Valor, resultado, nota, alocação, posições | Claude |
| 4 | Lançamento | Compra, venda e renda fixa | Claude |
| 5 | Ativo | Gráfico, estatísticas, faixa de previsão, confiabilidade | Claude |
| 6 | Simulador | Monte Carlo e rebalanceamento | Claude |
| 7 | Chat | Painel lateral em todas as telas | Claude |
| 8 | Metodologia | Fórmulas, fontes, backtest e limites | Claude |

O README informa como o site foi construído.

O login é pelo Supabase Auth, com Google e com e-mail e senha.

### Padrões de interface

- Cada métrica traz uma frase simples abaixo.
- Termos técnicos abrem o glossário por mouse, teclado e toque. O glossário é um arquivo estático.
- Toda tela informa a data dos dados, vinda de `job_runs`.
- Alta e queda usam sinal `+` ou `−`, além da cor.
- Respeita `prefers-reduced-motion`.
- Todas as telas funcionam no celular. Lá, o chat abre por botão.

### Tokens do visual

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#0e1416` | Fundo |
| `surface` | `#161f22` | Blocos |
| `border` | `#243034` | Divisões |
| `text` | `#dbe4e3` | Texto principal |
| `text-soft` | `#a9b8b6` | Frases simples |
| `muted` | `#7f908f` | Rótulos |
| `accent` | `#6fd6b4` | Destaque, alta, faixas de previsão |

Números em fonte monoespaçada; texto em fonte do sistema. As faixas de previsão são sempre mostradas como faixa, nunca como linha única.

## 10. Erros

| Situação | Comportamento |
|---|---|
| Fonte de dados falha | Outros ativos seguem. O site mostra o último dado e a data |
| Dados com mais de 3 dias | Faixa de aviso no topo. O GitHub avisa por e-mail que o job falhou |
| Preço zero, negativo ou variação acima de 50% sem desdobramento | Linha não é gravada e fica registrada em `job_runs`. O workflow `backfill` aceita liberar a data após revisão |
| Ativo sai da bolsa | `active = false`. Mantém o último preço, com aviso na carteira |
| Groq fora do ar ou sem cota | Só o chat avisa |
| Lançamento inválido | Mensagem no formulário, com a regra aplicada pela função SQL |
| Carteira vazia | Convida a lançar a primeira compra ou ver o demo |
| Falha no Web Worker | O simulador mostra erro e oferece tentar de novo |

## 11. Segurança

- A chave secreta do Supabase só existe nos secrets do GitHub. Apagar a conta usa a função SQL `delete_my_account`, que age só sobre o usuário da sessão. A chave da Groq só existe no servidor.
- Tabelas públicas são somente leitura para `anon` e `authenticated`.
- Dados do usuário: RLS em todas as tabelas.
- A rota do chat valida entrada por esquema e limita o tamanho das mensagens.

## 12. Testes

- **Python (`pytest`):** estatísticas com séries de resultado conhecido, validação de preços, motor de regras e prova de que o ML não vê dados futuros.
- **TypeScript (`node --test`):** posições com venda parcial e desdobramento, nota de saúde, Monte Carlo com semente fixa, validador de números e filtros da IA.
- **RLS e funções SQL:** usuário A tenta ler e alterar dados do usuário B; lançamentos inválidos são rejeitados.
- **IA:** cerca de 30 perguntas difíceis, incluindo prompt injection e "o que eu compro?". Rodam manualmente antes de cada deploy do chat, para não gastar cota.
- **Fluxo completo:** um teste Playwright abre o demo e navega pelas telas.
- **CI:** lint e testes a cada push.

## 13. Fases

Cada fase deixa o site funcionando.

| Fase | Entrega | Pronto quando |
|---|---|---|
| 0. Validação | Scripts descartáveis testam as fontes, os modelos e os limites | Relatório aprova ou troca cada fonte |
| 1. Dados | Esquema e job noturno, só Brasil | Job grava preços, macro, Tesouro e estatísticas sem intervenção |
| 2. Site + demo | Next.js, visual, início e painel do demo, publicado na Vercel | Visitante abre o demo pela URL pública |
| 3. Carteira real | Login, questionário, lançamentos, painel, ativo | Usuário lança compra e vê o painel; testes de RLS passam |
| 4. Análise | Nota de saúde, simulador, rebalanceamento | Simulador responde aos controles sem travar a tela |
| 5. ML | Previsões, backtest, metodologia | Página do ativo mostra faixa e resultado do backtest |
| 6. IA | Chat, travas, motor de regras, respostas do demo | Conjunto de avaliação passa e a cota é respeitada |
| 7. EUA | Ações em dólar e câmbio | Carteira mista aparece corretamente em reais |
| 8. Cripto | Ativos cripto | Cripto entra em carteira, simulador e previsões |
| 9. Acabamento | Acessibilidade, README em português e inglês, capturas de tela | Revisão de acessibilidade concluída |

### Fase 0: o que validar

- `yfinance`: histórico de ativos B3, EUA e cripto, desdobramentos, comportamento no GitHub Actions.
- Tesouro Transparente: formato, cobertura e estabilidade da planilha.
- Groq: cota real do plano gratuito, retenção zero, qualidade em português e chamada de ferramentas.
- Supabase: limite atual do plano gratuito e regra de pausa por inatividade.
- Vercel: condições do plano gratuito.

## 14. Riscos

| Risco | Efeito | Resposta |
|---|---|---|
| `yfinance` quebra ou é bloqueado | Dados param de atualizar | Site segue com último dado; trocar por APIs por mercado |
| Cota da Groq é pequena | Poucas perguntas por dia | Limites, respostas salvas no demo; o Gemini é a alternativa gratuita, mas usa o conteúdo para melhorar produtos |
| ML não vence o modelo ingênuo | Previsões fracas | A tela diz isso e usa a faixa ingênua |
| Filtro de recomendação falha | IA sugere ativo na carteira real | Conjunto de avaliação; limite declarado; aviso fixo |
| Validador rejeita respostas boas | Mais falhas no chat | Ajustar com o conjunto de avaliação |
