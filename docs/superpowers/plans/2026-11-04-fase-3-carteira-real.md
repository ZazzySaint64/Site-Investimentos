# Fase 3: carteira real. Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uma pessoa cria conta, responde ao questionário, lança compras, vendas e renda fixa e vê a própria carteira no painel. Ninguém mais lê ou altera esses dados.

**Architecture:** Três tabelas novas, protegidas por RLS. `transactions` e `fixed_income` só mudam por funções SQL, que aplicam as regras e devolvem a mensagem em português. O login usa Supabase Auth só no servidor, com cookies e Server Actions, então nenhuma variável nova vai para o navegador. O painel reaproveita `computePortfolio`.

**Tech Stack:** Next.js 16.4.5 (Cache Components, `proxy.ts`, Server Actions), TypeScript, Tailwind 4, `@supabase/ssr`, `@supabase/supabase-js`, `node --test`, Playwright, Python 3.12 com `pytest`, Supabase, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-03-site-investimentos-design.md`

**Escopo:** só o que a fase 3 entrega. Nota de saúde, simulador e rebalanceamento ficam para a fase 4. Faixa de previsão e backtest na tela do ativo ficam para a fase 5. `chat_usage` fica para a fase 6. Limite de lançamentos por usuário fica para quando houver abuso real. Editar lançamento fica de fora, como na spec: apaga e lança de novo.

**Pronto quando:** o usuário lança uma compra e vê o painel, e os testes de RLS passam.

## Decisões a confirmar na revisão

> **Mudança de 2026-11-04, depois das Tarefas 1 a 8:** o autor escolheu **só Google nesta fase** na decisão 1. O site não tem mais formulários de e-mail e senha, `/esqueci-senha`, `/nova-senha` nem `lib/auth-messages.ts`. Os testes E2E criam a sessão em `e2e/session.ts`, com a senha dos usuários de teste, sem passar por uma tela. O provedor de e-mail do Supabase fica ligado, com "Confirm email" ativo, só para isso. Onde este plano ainda citar e-mail, senha, SMTP ou Brevo, vale esta nota; o texto fica como registro do que foi planejado.

A spec não decide estes pontos, ou entra em conflito com fatos novos. O plano segue a opção indicada, salvo decisão diferente do autor.

1. **E-mail de login.** O serviço de e-mail padrão do Supabase [só envia para membros da equipe do projeto](https://supabase.com/docs/guides/auth/auth-smtp) e tem limite baixo por hora. Sem outro serviço, um visitante não recebe a confirmação nem a recuperação de senha.
   - **Indicada:** configurar um SMTP gratuito e manter a confirmação de e-mail ligada. Candidato: Brevo, com [300 e-mails por dia no plano gratuito](https://www.brevo.com/free-smtp-server). As fontes divergem sobre exigir domínio próprio, então isso se confirma no cadastro (Tarefa 2).
   - **Alternativa:** só Google nesta fase. Tira o e-mail e a senha, e isso muda a spec.
   - **Rejeitada:** desligar a confirmação. A conta nasceria com e-mail tratado como confirmado sem prova de posse. Como o Supabase [liga contas com o mesmo e-mail](https://supabase.com/docs/guides/auth/auth-identity-linking), alguém poderia criar uma senha no e-mail de outra pessoa antes de ela entrar com Google. Isso é uma inferência a partir da documentação, não um teste.
2. **Apagar conta sem chave secreta.** A seção 11 da spec põe a chave secreta na rota de apagar conta, mas a regra do projeto é nunca ter essa chave em `web/`. O plano usa a função SQL `delete_my_account()`, que apaga só o usuário da sessão. A Tarefa 8 atualiza a spec.
3. **Pontuação do questionário.** A spec define as perguntas, mas não a conta. O plano soma de 0 a 2 pontos por pergunta: até 3 é conservador, de 4 a 6 é moderado e de 7 a 10 é arrojado. É escolha de projeto e a tela de metodologia da fase 5 a apresentará como tal.
4. **Tela do ativo.** `/dados/[ticker]` já tem gráfico e estatísticas, feitos por Claude na fase 1. Nesta fase, a tela ganha o bloco "Sua posição" nessa mesma página. Não há tela nova nem reescrita da existente.
5. **Dependências novas:** `@supabase/ssr` e `@supabase/supabase-js`. Renovar token e guardar sessão em cookie é código de segurança, e por isso vale a dependência oficial.

## Global Constraints

- Custo mensal zero.
- A chave secreta nunca entra em `web/`. O site usa só `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. Nenhuma variável nova na Vercel.
- O site nunca chama as fontes externas. Ele lê apenas do banco.
- **Toda tarefa termina com um teste pela interface do projeto**, descrito no passo "Testar pela interface". Depois dela, `abrir-site.bat` precisa mostrar o que a tarefa entregou.
- Autoria: Claude constrói todas as telas, por decisão do autor em 2026-11-04. O modo guiado saiu do projeto.
- Carteira real: a tela nunca sugere comprar ou vender um ativo específico.
- Questionário: "Este questionário é simplificado e não substitui avaliação profissional."
- A posição nunca é salva. É sempre calculada a partir das transações.
- Quantidade corrigida = quantidade da transação × produto dos `ratio` de `splits` posteriores à data da transação. Preço de cada ativo: último `close`.
- CDB e similares: `principal` corrigido por `cdi_pct` do CDI diário, de `start_date` até hoje ou até `maturity`. Valor bruto, sem imposto.
- Proventos não entram no valor nem no resultado da carteira.
- Cada número traz uma frase simples abaixo. Termos técnicos abrem o glossário. Toda tela informa a data dos dados. Alta e queda usam sinal `+` ou `−`, além da cor. Todas as telas funcionam no celular.
- Lançamento inválido: mensagem no formulário, com a regra aplicada pela função SQL. Carteira vazia: convida a lançar a primeira compra ou ver o demo.
- Dados de usuário nunca passam por `get()` de `lib/data.ts` nem por `use cache`. Esse caminho guarda resposta em cache.
- Toda página que lê a sessão usa `export const instant = false`, como `/demo/[persona]`, ou lê a sessão dentro de `<Suspense>`.
- Toda Server Action chama `requireUser()` antes de gravar, mesmo em página protegida.
- Commits em português, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Aprovar este plano autoriza commit e push na branch `fase-3`, criada a partir de `main`. Merge em `main` só com aprovação do autor.
- Segredos só em `.env`, `web/.env.local` e nos painéis. Claude não digita chaves em formulários: esses passos são do autor, marcados `[AUTOR]`.
- `DATABASE_URL` só é lida por script que oculta a senha na saída.

## Review Focus

Entradas que a spec implica e costumam morder. Cada uma tem teste na tarefa dona.

1. Outra pessoa entra no mesmo navegador depois de "Sair": não pode ver nada da anterior, nem por cache do servidor nem por prefetch do navegador (Tarefa 8).
2. Mudança no passado: venda com data anterior à compra, ou apagar uma compra de que uma venda posterior depende. O banco recusa e diz a data em que a posição ficaria negativa (Tarefa 1).
3. Número estranho no formulário: vazio, `NaN`, sete casas decimais ou grande demais. A tela mostra a regra, nunca um erro cru do Postgres (Tarefas 1 e 3).
4. Link de e-mail expirado, já usado ou aberto em outro navegador: leva a `/entrar` com uma explicação, não a uma tela de erro (Tarefa 2).
5. Supabase Auth fora do ar ou variável errada: as páginas públicas continuam abrindo, e a carteira não mostra dado nenhum (Tarefa 2).

---

### Task 1: Tabelas e regras da carteira

**Files:**
- Create: `supabase/migrations/20261104000000_user_data.sql`, `jobs/pipeline/auth_admin.py`
- Modify: `jobs/tests/conftest.py`
- Test: `jobs/tests/test_user_data_integration.py`

**Interfaces:**
- Consumes: `assets`, `splits`, `macro_series`; fixture `rest`.
- Produces:

| Tabela | Colunas | Restrições |
|---|---|---|
| `profiles` | `user_id uuid pk`, `risk_profile text`, `target_allocation jsonb` | `user_id` referencia `auth.users` com `on delete cascade`; `risk_profile in ('conservador','moderado','arrojado')`; `jsonb_typeof(target_allocation) = 'object'` |
| `transactions` | `id bigint identity`, `user_id uuid`, `asset_id bigint`, `type text`, `quantity numeric(18,6)`, `price numeric(18,6)`, `date date` | `user_id` com cascade; `asset_id` referencia `assets`; `type in ('buy','sell')`; `quantity > 0`; `price > 0`; índice (`user_id`, `asset_id`, `date`) |
| `fixed_income` | `id bigint identity`, `user_id uuid`, `name text`, `principal numeric(18,2)`, `cdi_pct numeric(8,4)`, `start_date date`, `maturity date null`, `daily_liquidity boolean` | `user_id` com cascade; índice (`user_id`) |

RLS nas três, com `(select auth.uid()) = user_id`, só para `authenticated`. `anon` não tem acesso. `transactions` e `fixed_income`: só `select`. `profiles`: `select`, `insert` e `update`. `service_role` tem `all`.

Funções em `public`, com `security definer` e `set search_path = ''`. Revogue `execute` de `public` e `anon` e conceda só a `authenticated`.

| Função | Retorno |
|---|---|
| `add_transaction(p_ticker text, p_type text, p_quantity numeric, p_price numeric, p_date date)` | `bigint` |
| `delete_transaction(p_id bigint)` | `void` |
| `add_fixed_income(p_name text, p_principal numeric, p_cdi_pct numeric, p_start_date date, p_maturity date, p_daily_liquidity boolean)` | `bigint` |
| `delete_fixed_income(p_id bigint)` | `void` |
| `delete_my_account()` | `void`: `delete from auth.users where id = auth.uid()` |

Todas usam `auth.uid()`, nunca um argumento. Erros de regra usam `raise exception` com `errcode 'P0001'` e exatamente estas mensagens:

| Regra | Mensagem |
|---|---|
| Ticker desconhecido, depois de `upper(trim())` | `Ativo não encontrado.` |
| `holdable = false`. Ativo inativo é aceito, para registrar operação antiga | `Este ativo não pode entrar na carteira.` |
| `p_type` diferente de `buy` e `sell` | `Operação inválida.` |
| Quantidade nula, depois de `round(x, 6)` `<= 0`, ou `> 1e11` | `Informe uma quantidade maior que zero e menor que 100 bilhões.` |
| Preço nulo, depois de `round(x, 6)` `<= 0`, ou `> 1e11` | `Informe um preço maior que zero e menor que 100 bilhões.` |
| Data nula ou depois de hoje em `America/Sao_Paulo` | `Informe uma data que não esteja no futuro.` |
| Posição negativa | `Esta operação deixaria a posição negativa em DD/MM/AAAA. Confira as datas e as quantidades.` |
| Linha inexistente ou de outro usuário | `Lançamento não encontrado.` |
| Nome vazio ou com mais de 80 caracteres | `Informe um nome de até 80 caracteres.` |
| Valor nulo, `<= 0` ou `> 1e11` | `Informe um valor maior que zero e menor que 100 bilhões.` |
| `cdi_pct` nulo, `<= 0` ou `> 1000` | `Informe um percentual do CDI entre 0 e 1000.` |
| Início nulo ou no futuro | `Informe uma data de início que não esteja no futuro.` |
| Início antes do primeiro CDI gravado | `Só há CDI a partir de DD/MM/AAAA.` |
| `maturity <= start_date` | `O vencimento precisa ser depois do início.` |

`NaN` é maior que qualquer número no Postgres, então o limite superior também o recusa.

Checagem de posição, em `private.check_position(p_user uuid, p_asset bigint)`, no schema `private`, sem acesso para `anon` e `authenticated`. `add_transaction` e `delete_transaction` pegam `pg_advisory_xact_lock(hashtextextended(p_user::text || p_asset::text, 0))`, fazem a mudança e chamam a checagem antes de terminar:

```sql
select date from (
  select t.date,
         sum((case t.type when 'buy' then 1 else -1 end) * t.quantity::float8 *
             coalesce((select exp(sum(ln(s.ratio))) from public.splits s
                       where s.asset_id = t.asset_id and s.date > t.date), 1))
           over (order by t.date, t.type, t.id) as running
  from public.transactions t
  where t.user_id = p_user and t.asset_id = p_asset
) moves
where running < -1e-6
order by date
limit 1;
```

`t.type` em ordem alfabética põe `buy` antes de `sell` no mesmo dia, igual a `computePortfolio`. A tolerância de `1e-6` é a escala da coluna e precisa ser igual a `EMPTY_QUANTITY` da Tarefa 4. Há razões reais como `1,3333` no banco, que deixam resíduos.

`jobs/pipeline/auth_admin.py`, com a chave secreta só no header `apikey`:

```python
def create_user(email: str, password: str, user_id: str | None = None) -> str: ...  # email_confirm=True; devolve o id
def delete_user(user_id: str) -> None: ...  # 404 não é erro
def sign_in(email: str, password: str) -> str: ...  # devolve o access token; usa a chave publicável
```

`conftest.py`: `Rest.request`, `get`, `post` e `delete` ganham `token=None`, enviado em `Authorization: Bearer`. Fixture `sandbox_asset`: grava `ZZTESTE3` (`acao_br`, `BRL`, `holdable=true`, `ml_enabled=false`, `active=false`) e um split de razão 2 em `2024-06-01`, e apaga os dois no fim. Fixture `users`, que depende de `sandbox_asset`: a cada teste, cria dois usuários com e-mail `rls-<uuid>@example.com` e senha de `secrets.token_urlsafe`, devolve `{"a": token, "b": token}` e os apaga no fim. Nenhum valor é impresso.

- [ ] **Step 1: Escrever os testes de integração**

```python
pytestmark = pytest.mark.integration

def test_each_user_sees_only_their_own_rows(rest, users):
    assert add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01").status_code == 200
    assert len(rest.get("/transactions?select=id", key="publishable", token=users["a"]).json()) == 1
    assert rest.get("/transactions?select=id", key="publishable", token=users["b"]).json() == []

def test_other_user_cannot_delete_a_transaction(rest, users):
    row_id = add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01").json()
    response = call(rest, users["b"], "delete_transaction", p_id=row_id)
    assert response.status_code == 400
    assert response.json()["message"] == "Lançamento não encontrado."

def test_tables_refuse_direct_writes(rest, users):
    # POST, PATCH e DELETE em transactions e fixed_income com token: 401 ou 403

def test_anonymous_gets_nothing(rest):
    # chave publicável sem token: leitura das 3 tabelas e chamada de add_transaction, 401 ou 403

def test_profile_cannot_be_written_for_another_user(rest, users): ...
    # B faz POST em /profiles com o user_id de A: 401 ou 403

@pytest.mark.parametrize("quantity", [0, -1, None, "NaN", 1e13, 0.0000001])
def test_invalid_quantity_gets_the_rule_message(rest, users, quantity): ...
    # 400 e "Informe uma quantidade maior que zero e menor que 100 bilhões."

def test_future_date_empty_date_unknown_ticker_and_index_are_rejected(rest, users): ...
    # hoje + 2 dias; None; "NAOEXISTE"; "^BVSP"; cada um com a mensagem da tabela

def test_ticker_is_accepted_in_lowercase(rest, users): ...

def test_selling_more_than_held_names_the_date(rest, users):
    add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01")
    response = add(rest, users["a"], "ZZTESTE3", "sell", 11, 5, "2024-02-01")
    assert "posição negativa em 01/02/2024" in response.json()["message"]

def test_sale_dated_before_the_buy_is_rejected(rest, users): ...
def test_buy_and_full_sale_on_the_same_day_is_accepted(rest, users): ...

def test_deleting_a_buy_that_a_later_sale_needs_is_rejected(rest, users): ...
    # a compra continua lá depois da recusa

def test_later_split_counts_for_the_sale(rest, users):
    add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01")
    assert add(rest, users["a"], "ZZTESTE3", "sell", 20, 5, "2024-07-01").status_code == 200
    assert add(rest, users["a"], "ZZTESTE3", "sell", 1, 5, "2024-07-02").status_code == 400

def test_split_on_the_sale_date_applies_only_to_earlier_buys(rest, users): ...
    # compra de 10 em 01/01, split em 01/06, venda de 20 em 01/06: aceita

def test_two_simultaneous_sales_do_not_both_pass(rest, users): ...
    # 10 em carteira; duas vendas de 6 em ThreadPoolExecutor: um 200 e um 400

def test_fixed_income_rules(rest, users): ...
    # principal 0 e "NaN"; início no futuro; início em 2010-01-01; vencimento antes do início;
    # nome vazio e com 81 caracteres; cada um com a mensagem da tabela. Linha válida: 200

def test_other_user_cannot_read_or_delete_fixed_income(rest, users): ...

def test_delete_my_account_removes_everything(rest, sandbox_asset):
    # cria usuário, grava nas 3 tabelas, chama delete_my_account
    # chave secreta: 0 linhas nas 3 tabelas para aquele user_id; sign_in falha
```

- [ ] **Step 2: Confirmar a falha**

Run: `cd jobs && .venv/Scripts/pytest -m integration tests/test_user_data_integration.py -v`
Expected: FAIL, tabela não existe.

- [ ] **Step 3: Escrever a migration e aplicar**

Aplicar com `npx supabase@latest db push --db-url "$DATABASE_URL"`, por um script que carrega `.env` e oculta o valor na saída. Migration aditiva: o site publicado continua igual.
Expected: migration aplicada, sem erro.

- [ ] **Step 4: Rodar os testes e o linter**

Run: `cd jobs && .venv/Scripts/ruff check . && .venv/Scripts/pytest -m integration tests/test_user_data_integration.py -v`
Expected: todos passam, e `auth.users` volta a 0 linhas.

- [ ] **Step 5: Conferir o Security Advisor**

Use a ferramenta `get_advisors` do Supabase, tipo `security`.
Expected: nenhum erro nas tabelas novas. Avisos sobre funções `security definer` executáveis por `authenticated` são intencionais.

- [ ] **Step 6: Testar pela interface**

Esta tarefa não muda telas. `abrir-site.bat` continua abrindo o site sem erro.

- [ ] **Step 7: Commit**

```bash
git switch -c fase-3
git add supabase jobs
git commit -m "feat: adiciona tabelas e regras da carteira real"
```

### Task 2: Login

**Files:**
- Create: `web/lib/supabase/server.ts`, `web/proxy.ts`, `web/lib/auth-messages.ts`, `web/app/auth/callback/route.ts`, `web/app/entrar/page.tsx`, `web/app/entrar/AuthForms.tsx`, `web/app/entrar/actions.ts`, `web/app/esqueci-senha/page.tsx`, `web/app/nova-senha/page.tsx`, `web/app/conta/page.tsx`, `web/app/carteira/page.tsx`, `web/app/carteira/error.tsx`, `web/app/conta/error.tsx`, `web/e2e/session.ts`, `web/e2e/conta.spec.ts`, `jobs/pipeline/e2e_users.py`
- Modify: `web/package.json`, `web/app/layout.tsx`, `web/playwright.config.ts`, `README.md`
- Test: `web/lib/auth-messages.test.ts`, `jobs/tests/test_e2e_users.py`

**Interfaces:**
- Consumes: `delete_my_account`; `auth_admin` da Tarefa 1.
- Produces:
  - `lib/supabase/server.ts`: `createClient(): Promise<SupabaseClient>`, com `createServerClient` de `@supabase/ssr`, `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`; `getCurrentUser(): Promise<{ id: string; email: string | null } | null>`, por `auth.getClaims()`; `requireUser()`, igual, mas com `redirect("/entrar")` quando não há sessão.
  - `lib/auth-messages.ts`, funções puras: `authMessage(code: string | undefined): string` e `callbackTarget(params: URLSearchParams, exchanged: boolean): string`.
  - `app/entrar/actions.ts`: `signInWithPassword`, `signUp`, `signInWithGoogle`, `requestPasswordReset`, `setNewPassword`, `signOut`, `deleteAccount`. As de formulário têm a forma `(state: { message: string } | null, formData: FormData) => Promise<{ message: string } | null>`.
  - `npm run test:e2e` com `e2e/session.ts`: `signIn(page: Page, who: "A" | "B"): Promise<void>` e `skipWithoutUsers(): void`.
  - `python -m pipeline.e2e_users`: apaga e recria `e2e-a@example.com` e `e2e-b@example.com`, com ids fixos e senhas novas, e grava `E2E_EMAIL_A`, `E2E_PASSWORD_A`, `E2E_EMAIL_B` e `E2E_PASSWORD_B` em `web/.env.local`, sem imprimir os valores. Função pura `replace_env_lines(text: str, values: dict[str, str]) -> str`.

`proxy.ts`: receita do [guia do Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client), com as nossas variáveis. Só renova a sessão, sem redirecionar. Uma falha de `getClaims` não pode derrubar a resposta, então fica em `try/catch`. `matcher`: `/carteira/:path*`, `/questionario`, `/conta`, `/entrar`, `/nova-senha`, `/dados/:path*`.

`/auth/callback`: lê `code`, chama `exchangeCodeForSession` em `try/catch`, porque um link inválido pode lançar erro, e redireciona para `callbackTarget`. O destino é fixo, sem `next` na URL, então não há redirecionamento aberto.

Telas, todas com `instant = false`:

- `/entrar`: botão "Entrar com Google", formulário "Entrar" e, em `<details>`, "Criar conta" (e-mail, senha, mínimo de 8 caracteres). Link "Esqueci a senha". Sessão ativa redireciona a `/carteira`. `?aviso=link`: "Não foi possível concluir pelo link. Ele pode ter expirado ou ter sido aberto em outro navegador. Se você já confirmou o e-mail, entre com sua senha." `?aviso=conta-apagada`: "Sua conta e seus dados foram apagados."
- Depois de "Criar conta": "Enviamos um link para {e-mail}. Abra-o neste navegador para confirmar a conta." A mesma frase vale para e-mail já cadastrado, para não revelar quem tem conta.
- `/esqueci-senha`: e-mail. Resposta sempre igual: "Se esse e-mail tiver conta, enviamos um link para criar uma nova senha."
- `/nova-senha`: nova senha; sem sessão, `requireUser` manda a `/entrar`.
- `/conta`: e-mail da sessão, botão "Sair" e, em `<details>`, "Apagar minha conta": "Isso apaga sua conta e todos os seus lançamentos. Não dá para desfazer." Exige digitar `APAGAR`, com checagem também na Server Action.
- `/carteira`, provisória até a Tarefa 6: título "Minha carteira", "Você entrou como {e-mail}." e link "Conta".
- `carteira/error.tsx` e `conta/error.tsx`: `export { default } from "../dados/error"`, como `demo/error.tsx`.

`signOut` chama `auth.signOut()`, depois `revalidatePath("/", "layout")` e `redirect("/")`. `deleteAccount` chama a função SQL, depois `signOut({ scope: "local" })`, `revalidatePath("/", "layout")` e `redirect("/entrar?aviso=conta-apagada")`. A origem para os links vem de `headers().get("origin")`, e a lista de URLs do Supabase é quem a limita. O menu do layout ganha `<Link href="/carteira" prefetch={false}>Minha carteira</Link>`, sem ler a sessão no layout, para `/` continuar pré-renderizada.

- [ ] **Step 1: [AUTOR] Configurar o Supabase Auth**

Em Supabase > Authentication:

1. **URL Configuration:** Site URL `https://site-investimentos-gray.vercel.app`. Redirect URLs: `http://localhost:3000/auth/callback**` e `https://site-investimentos-gray.vercel.app/auth/callback**`.
2. **E-mail:** deixe "Confirm email" ligado e use senha mínima de 8 caracteres.
3. **SMTP:** não se aplica. O login é só com Google.
4. **Google:** no Google Cloud Console, crie um cliente OAuth do tipo Web, com a URI de redirecionamento `https://dlxjoowezwoyoedkcvac.supabase.co/auth/v1/callback`, e publique a tela de consentimento em produção, só com e-mail e perfil. Preencha o ID e o segredo em Authentication > Providers > Google.

Avise Claude quando terminar, sem colar nenhum valor na conversa.

- [ ] **Step 2: Escrever os testes**

```ts
test("known auth errors become plain sentences and unknown ones stay generic", () => {
  assert.equal(authMessage("invalid_credentials"), "E-mail ou senha incorretos.");
  assert.equal(authMessage("email_not_confirmed"), "Confirme seu e-mail pelo link que enviamos.");
  assert.equal(authMessage("weak_password"), "A senha precisa de pelo menos 8 caracteres.");
  assert.equal(authMessage("over_email_send_rate_limit"), "Muitos e-mails enviados agora. Tente de novo em alguns minutos.");
  assert.equal(authMessage("algo_novo"), "Não foi possível concluir agora. Tente de novo.");
  assert.equal(authMessage(undefined), "Não foi possível concluir agora. Tente de novo.");
});

test("the callback only goes to fixed places", () => {
  assert.equal(callbackTarget(new URLSearchParams(""), true), "/carteira");
  assert.equal(callbackTarget(new URLSearchParams("type=recovery"), true), "/nova-senha");
  assert.equal(callbackTarget(new URLSearchParams("type=recovery"), false), "/entrar?aviso=link");
  assert.equal(callbackTarget(new URLSearchParams("next=//malicioso.example"), true), "/carteira");
});
```

```python
def test_replace_env_lines_keeps_other_lines_and_replaces_ours():
    text = "SUPABASE_URL=x\nE2E_EMAIL_A=velho\n"
    result = replace_env_lines(text, {"E2E_EMAIL_A": "novo", "E2E_PASSWORD_A": "p"})
    assert result == "SUPABASE_URL=x\nE2E_EMAIL_A=novo\nE2E_PASSWORD_A=p\n"
```

`e2e/conta.spec.ts`:

```ts
test("visitor without a session is sent to the login page", async ({ page }) => {
  await page.goto("/carteira");
  await expect(page).toHaveURL(/\/entrar/);
});

test("wrong password shows a plain message", async ({ page }) => { /* "E-mail ou senha incorretos." */ });

test("sign in reaches the wallet and sign out ends the session", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await expect(page).toHaveURL(/\/carteira/);
  await page.getByRole("link", { name: "Conta" }).click();
  await page.getByRole("button", { name: "Sair" }).click();
  await page.goto("/carteira");
  await expect(page).toHaveURL(/\/entrar/);
});

test("a broken email link explains what happened", async ({ page }) => {
  await page.goto("/auth/callback?code=invalido");
  await expect(page.getByText("Não foi possível concluir pelo link")).toBeVisible();
});
```

`playwright.config.ts` carrega `web/.env.local` com `process.loadEnvFile`, se o arquivo existir.

- [ ] **Step 3: Confirmar a falha**

Run: `cd web && npm test` e `cd jobs && .venv/Scripts/pytest tests/test_e2e_users.py -v`
Expected: FAIL, módulos não existem.

- [ ] **Step 4: Implementar**

Run: `cd web && npm install @supabase/supabase-js @supabase/ssr`, com versão exata no `package.json`. Depois, escreva os arquivos da lista. Antes, leia `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md` e `.../03-api-reference/03-file-conventions/proxy.md`.

- [ ] **Step 5: Rodar tudo**

Run: `cd jobs && .venv/Scripts/ruff check . && .venv/Scripts/pytest -m "not integration" && .venv/Scripts/python -m pipeline.e2e_users`
Run: `cd web && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e`
Expected: tudo passa. O build não falha por ler `cookies()`, e `/` continua pré-renderizada na saída do build.

- [ ] **Step 6: Testar pela interface**

Com `abrir-site.bat`:

- Crie conta com um e-mail seu que **não** seja da equipe do projeto. O e-mail chega, inclusive se cair no spam, e o link abre a carteira. Se não chegar, pare e revise o Step 1.
- Saia e entre de novo. Entre com Google.
- Peça nova senha, abra o link e entre com a senha nova.
- Abra o link de nova senha em outro navegador: aparece a explicação, não uma tela de erro.
- Em `/conta`, apague a conta criada para o teste. Entrar de novo com ela não funciona.
- Falha no Auth: rode `npm run dev` com `SUPABASE_URL` trocada por um endereço inválido. `/`, `/glossario` e `/dados` mostram tela ou erro de dados, sem erro do proxy. `/carteira` não mostra dado nenhum. Desfaça a troca.
- Largura de 375 px em `/entrar`: sem rolagem horizontal.

- [ ] **Step 7: Atualizar o README e commitar**

README: `python -m pipeline.e2e_users` antes de `npm run test:e2e`.

```bash
git add web jobs README.md
git commit -m "feat: adiciona login e conta"
```

### Task 3: Questionário

**Files:**
- Create: `web/lib/profile.ts`, `web/lib/action-result.ts`, `web/lib/wallet.ts`, `web/app/questionario/page.tsx`, `web/app/questionario/QuestionnaireForm.tsx`, `web/app/questionario/actions.ts`, `web/app/questionario/error.tsx`
- Modify: `web/e2e/conta.spec.ts`
- Test: `web/lib/profile.test.ts`, `web/lib/action-result.test.ts`

**Interfaces:**
- Consumes: `createClient`, `requireUser`; tabela `profiles`.
- Produces:

```ts
// lib/profile.ts, puro
export type RiskProfile = "conservador" | "moderado" | "arrojado";
export type TargetClass = "renda_fixa" | "acao_br" | "fii" | "acao_eua" | "cripto";
export type TargetAllocation = Record<TargetClass, number>; // inteiros que somam 100
export const QUESTIONS: { text: string; options: string[] }[]; // 5 perguntas; a opção i vale i pontos
export const TARGETS: Record<RiskProfile, TargetAllocation>;
export function riskProfileFromAnswers(answers: number[]): RiskProfile; // lança erro se não forem 5 respostas de 0 a 2
export function isValidTarget(target: unknown): target is TargetAllocation;

// lib/wallet.ts, servidor
export type Profile = { risk_profile: RiskProfile; target_allocation: TargetAllocation };
export async function getProfile(): Promise<Profile | null>;
export async function saveProfile(profile: Profile): Promise<ActionResult>;

// lib/action-result.ts, puro
export type ActionResult = { ok: true } | { ok: false; message: string };
export const GENERIC_SAVE_ERROR = "Não foi possível salvar. Tente de novo.";
export function toActionResult(error: { code?: string; message: string } | null): ActionResult;
```

Texto das perguntas:

| Pergunta | 0 pontos | 1 ponto | 2 pontos |
|---|---|---|---|
| Em quanto tempo você pretende usar esse dinheiro? | Em menos de 2 anos | De 2 a 5 anos | Daqui a mais de 5 anos |
| Se sua carteira caísse 20% em um mês, o que você faria? | Venderia tudo para não perder mais | Esperaria a situação melhorar | Aproveitaria para investir mais |
| Qual é o seu principal objetivo? | Proteger o que já tenho | Crescer aos poucos, com alguns altos e baixos | Buscar mais retorno, aceitando perdas no caminho |
| Quanta experiência você tem com investimentos? | Nenhuma ou só poupança | Já usei renda fixa ou fundos | Já investi em ações ou fundos imobiliários |
| Você tem dinheiro guardado para emergências? | Não tenho | Menos de 6 meses de gastos | 6 meses de gastos ou mais |

Tela `/questionario`: as 5 perguntas com `<fieldset>` e rádios nativos, e abaixo "Este questionário é simplificado e não substitui avaliação profissional." Com as 5 respondidas, mostra o perfil em palavras e a meta sugerida, com um campo numérico por classe e a soma ao vivo. O botão "Salvar meu perfil" só funciona com soma 100%, regra repetida em `saveProfile` por `isValidTarget`. Abaixo da meta: "Ações dos EUA e cripto chegam em fases seguintes. Por enquanto, essa parte fica só como intenção." Quem já salvou vê os valores gravados. Depois de salvar, volta a `/carteira`. Cada classe usa o glossário quando o termo existir.

Nenhuma tela força o questionário: o painel só convida a responder.

- [ ] **Step 1: Escrever os testes**

```ts
test("answers become a profile at the chosen limits", () => {
  assert.equal(riskProfileFromAnswers([0, 0, 0, 0, 0]), "conservador");
  assert.equal(riskProfileFromAnswers([1, 1, 1, 0, 0]), "conservador");
  assert.equal(riskProfileFromAnswers([1, 1, 1, 1, 0]), "moderado");
  assert.equal(riskProfileFromAnswers([2, 1, 1, 1, 1]), "moderado");
  assert.equal(riskProfileFromAnswers([2, 2, 1, 1, 1]), "arrojado");
  assert.equal(riskProfileFromAnswers([2, 2, 2, 2, 2]), "arrojado");
});

test("wrong answers raise an error", () => {
  assert.throws(() => riskProfileFromAnswers([0, 0, 0, 0]));
  assert.throws(() => riskProfileFromAnswers([0, 0, 0, 0, 3]));
});

test("targets are the ones in the spec and add up to 100", () => {
  assert.deepEqual(TARGETS.conservador, { renda_fixa: 70, acao_br: 15, fii: 10, acao_eua: 5, cripto: 0 });
  assert.deepEqual(TARGETS.moderado, { renda_fixa: 40, acao_br: 30, fii: 15, acao_eua: 10, cripto: 5 });
  assert.deepEqual(TARGETS.arrojado, { renda_fixa: 15, acao_br: 40, fii: 15, acao_eua: 20, cripto: 10 });
  for (const target of Object.values(TARGETS)) assert.equal(isValidTarget(target), true);
});

test("invalid targets are refused", () => {
  const base = TARGETS.moderado;
  assert.equal(isValidTarget({ ...base, cripto: 6 }), false);
  assert.equal(isValidTarget({ ...base, cripto: 4.5, fii: 15.5 }), false);
  assert.equal(isValidTarget({ ...base, cripto: -5, fii: 25 }), false);
  assert.equal(isValidTarget({ renda_fixa: 100 }), false);
  assert.equal(isValidTarget(null), false);
});

test("rule messages pass through and raw database errors do not", () => {
  assert.deepEqual(toActionResult(null), { ok: true });
  assert.deepEqual(toActionResult({ code: "P0001", message: "Lançamento não encontrado." }), { ok: false, message: "Lançamento não encontrado." });
  assert.deepEqual(toActionResult({ code: "22003", message: "numeric field overflow" }), { ok: false, message: GENERIC_SAVE_ERROR });
  assert.deepEqual(toActionResult({ message: "fetch failed" }), { ok: false, message: GENERIC_SAVE_ERROR });
});
```

Em `conta.spec.ts`: A responde a todas as perguntas, muda uma classe para a soma virar 101, vê o botão recusar, corrige e salva. Ao voltar a `/questionario`, o valor salvo aparece.

- [ ] **Step 2: Confirmar a falha, implementar e rodar**

Run: `cd web && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e`
Expected: testes falham antes, tudo passa depois.

- [ ] **Step 3: Testar pela interface**

Com `abrir-site.bat`: entre, responda ao questionário de um jeito conservador e de um jeito arrojado, e veja a meta mudar. Altere a meta para somar 90%: o botão recusa. Salve, feche o navegador, entre de novo e confira que o perfil continua lá. Largura de 375 px sem rolagem horizontal.

- [ ] **Step 4: Commit**

```bash
git add web
git commit -m "feat: adiciona questionario de perfil"
```

### Task 4: Cálculo e dados da carteira

Claude deixa pronta a parte de dados e cálculo. As telas das Tarefas 5 a 7 usam estas funções.

**Files:**
- Create: `web/lib/fixed-income.ts`
- Modify: `web/lib/portfolio.ts`, `web/lib/data.ts`, `web/lib/wallet.ts`, `web/lib/phrases.ts`, `web/lib/glossary.ts`, `web/lib/portfolio.test.ts`
- Test: `web/lib/fixed-income.test.ts`, `web/lib/portfolio.test.ts`, `web/lib/phrases.test.ts`

**Interfaces:**
- Consumes: funções SQL da Tarefa 1; `createClient`, `requireUser`, `getCurrentUser`; `getCdiHistory`; `ActionResult`, `toActionResult`.
- Produces:

```ts
// lib/portfolio.ts
// DemoTransaction passa a se chamar Transaction: o formato é o mesmo.
// Position ganha maturity: string | null. Em ativos da bolsa, é null.
export function computePortfolio(transactions: Transaction[], extras: Position[] = []): Portfolio;

// lib/fixed-income.ts, puro
export type FixedIncome = { id: number; name: string; principal: number; cdi_pct: number; start_date: string; maturity: string | null; daily_liquidity: boolean };
export function fixedIncomeValue(row: FixedIncome, cdi: { date: string; value: number }[], today: string): number;
export function fixedIncomePositions(rows: FixedIncome[], cdi: { date: string; value: number }[], today: string): Position[];

// lib/phrases.ts
export function todayInBrazil(nowMs?: number): string; // AAAA-MM-DD em America/Sao_Paulo

// lib/data.ts: cache público, como o resto do arquivo
export type HoldableAsset = { ticker: string; name: string; class: string };
export function getHoldableAssets(): Promise<HoldableAsset[]>; // holdable e active, por nome

// lib/wallet.ts: servidor, sempre com o cliente da sessão, nunca pelo get() de data.ts
export type TransactionInput = { ticker: string; type: "buy" | "sell"; quantity: number; price: number; date: string };
export type FixedIncomeInput = { name: string; principal: number; cdi_pct: number; start_date: string; maturity: string | null; daily_liquidity: boolean };
export async function getTransactions(): Promise<Transaction[]>; // mesmas colunas do demo, por data e id
export async function getFixedIncome(): Promise<FixedIncome[]>;
export async function getWallet(): Promise<{ portfolio: Portfolio; transactions: Transaction[]; fixedIncome: FixedIncome[]; profile: Profile | null }>;
export async function getMyPosition(ticker: string): Promise<Position | null>; // null sem sessão, sem posição ou em erro: nunca derruba a página pública
export async function addTransaction(input: TransactionInput): Promise<ActionResult>;
export async function deleteTransaction(id: number): Promise<ActionResult>;
export async function addFixedIncome(input: FixedIncomeInput): Promise<ActionResult>;
export async function deleteFixedIncome(id: number): Promise<ActionResult>;
```

`fixedIncomeValue` = `principal` × produto de `1 + (cdi_pct / 100) × (cdi / 100)` nos dias depois de `start_date` e até o menor entre `today` e `maturity`. O valor de `macro_series` para `cdi` já é percentual ao dia, como em `growthOfThousand`.

`fixedIncomePositions` gera: `ticker` `RF-{id}`, `name`, `assetClass` `renda_fixa`, `sector` null, `active` true, `quantity` 1, `averageCost` e `cost` iguais ao `principal`, `price` e `value` calculados, `priceDate` no último dia de CDI usado, `result` = `value − cost`, `maturity`. O `share` fica para `computePortfolio`.

`computePortfolio`: extras entram em `positions`, `value`, `invested`, `result`, no total comprado de `resultShare` e em `allocation`. As partes são calculadas sobre o total com extras. `EMPTY_QUANTITY` passa a `1e-6`, igual à tolerância da Tarefa 1.

`getWallet` só lê o CDI se houver linha de renda fixa. `CLASS_LABELS` ganha `renda_fixa: "Renda fixa"`. Glossário ganha `renda_fixa`, `liquidez_diaria` e `perfil_risco`.

- [ ] **Step 1: Escrever os testes**

```ts
const cdb = { id: 1, name: "CDB", principal: 1000, cdi_pct: 100, start_date: "2024-01-01", maturity: null, daily_liquidity: true };
const cdi = [
  { date: "2024-01-01", value: 0.05 },
  { date: "2024-01-02", value: 0.05 },
  { date: "2024-01-03", value: 0.05 },
  { date: "2024-01-04", value: 0.05 },
];
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test("value grows from the day after the start up to today", () => {
  near(fixedIncomeValue(cdb, cdi, "2024-01-03"), 1000 * 1.0005 ** 2);
});
test("the percentage applies to each day of CDI", () => {
  near(fixedIncomeValue({ ...cdb, cdi_pct: 120 }, cdi, "2024-01-03"), 1000 * 1.0006 ** 2);
});
test("value stops at maturity", () => {
  near(fixedIncomeValue({ ...cdb, maturity: "2024-01-02" }, cdi, "2024-01-04"), 1000 * 1.0005);
});
test("no CDI after the start keeps the principal", () => {
  assert.equal(fixedIncomeValue(cdb, [], "2024-01-03"), 1000);
});
test("fixed income joins totals, allocation and shares", () => {
  const [extra] = fixedIncomePositions([cdb], [], "2024-01-03");
  const p = computePortfolio([buy("A", 10, 100, "2024-01-01", { close: 100 })], [extra]);
  assert.equal(p.value, 2000);
  assert.equal(p.invested, 2000);
  assert.equal(p.positions.find((x) => x.assetClass === "renda_fixa")?.share, 0.5);
  assert.deepEqual(p.allocation.map((x) => x.share), [0.5, 0.5]);
});
test("only fixed income works and result share uses the principal", () => {
  const [extra] = fixedIncomePositions([cdb], cdi, "2024-01-03");
  const p = computePortfolio([], [extra]);
  near(p.result, 1000 * 1.0005 ** 2 - 1000);
  near(p.resultShare, 1.0005 ** 2 - 1);
});
test("fractional split residue does not leave a ghost position", () => {
  // compra de 10, razão 1/3, venda de 3,333333 depois: sobra menos de 1e-6
  const p = computePortfolio([
    buy("A", 10, 100, "2024-01-01", { close: 100, splits: [{ date: "2024-06-01", ratio: 1 / 3 }] }),
    sell("A", 3.333333, 300, "2024-07-01", { close: 100, splits: [{ date: "2024-06-01", ratio: 1 / 3 }] }),
  ]);
  assert.equal(p.positions.length, 0);
});

test("today follows the Brazilian clock", () => {
  assert.equal(todayInBrazil(Date.parse("2026-11-05T02:00:00Z")), "2026-11-04");
  assert.equal(todayInBrazil(Date.parse("2026-11-05T03:00:00Z")), "2026-11-05");
});
```

- [ ] **Step 2: Confirmar a falha**

Run: `cd web && npm test`
Expected: FAIL, módulos não existem.

- [ ] **Step 3: Implementar**

No `supabase-js`, o preço mais recente de cada ativo sai com `.order("date", { referencedTable: "asset.prices", ascending: false }).limit(1, { referencedTable: "asset.prices" })`, equivalente a `asset.prices.order` e `asset.prices.limit` do demo.

- [ ] **Step 4: Rodar tudo**

Run: `cd web && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e`
Expected: tudo passa, inclusive os testes antigos de `portfolio.test.ts` e do demo.

- [ ] **Step 5: Testar pela interface**

Esta tarefa não muda telas novas. Com `abrir-site.bat`, confira que `/demo/ana` mostra os mesmos números de antes. O resultado aparece nas próximas tarefas.

- [ ] **Step 6: Commit**

```bash
git add web
git commit -m "feat: adiciona calculo e dados da carteira real"
```

### Task 5: Lançamento

**Files:**
- Create: `web/app/carteira/lancar/page.tsx`, `web/app/carteira/lancar/TransactionForm.tsx`, `web/app/carteira/lancar/FixedIncomeForm.tsx`, `web/app/carteira/lancar/actions.ts`, `web/e2e/carteira.spec.ts`
- Modify: `web/e2e/session.ts`

**Interfaces:**
- Consumes: `requireUser`; `getTransactions`, `getFixedIncome`, `addTransaction`, `deleteTransaction`, `addFixedIncome`, `deleteFixedIncome`, `ActionResult`; `getHoldableAssets`; `todayInBrazil`, `hasLaterSplit` e formatadores; `DataDate`, `Term`.
- Produces: rota `/carteira/lancar`, com `instant = false`. Em `e2e/session.ts`: `launch(page: Page, input: { asset: string; operation: "Compra" | "Venda"; quantity: string; price: string; date: string }): Promise<void>` e `deleteEverything(page: Page): Promise<void>`, que apaga tudo pela tela de lançamento.

Rótulos fixos, porque o teste de aceitação os usa:

| Formulário | Campos | Botão |
|---|---|---|
| Compra e venda | `Ativo` (`<input list>` com `<datalist>`, valor é o ticker), `Operação` (`Compra`, `Venda`), `Quantidade`, `Preço por unidade`, `Data` (`max` = hoje) | `Salvar lançamento` |
| Renda fixa | `Nome`, `Valor aplicado`, `Percentual do CDI`, `Data de início`, `Vencimento` (opcional), `Liquidez diária` (checkbox) | `Salvar renda fixa` |

Comportamento:

- `<input type="number" step="any" min="0">`, que cuida da vírgula no navegador em português.
- `useActionState`: mostra `message` em `role="alert"` e mantém o que foi digitado. O React limpa o formulário ao fim da action, então a action devolve também os valores enviados, e os campos os usam em `defaultValue`. O botão fica desabilitado enquanto envia, o que evita lançamento duplo.
- A Server Action chama `requireUser()`, depois a função de `wallet.ts`, e `revalidatePath("/carteira", "layout")` no sucesso.
- Abaixo, a seção "Seus lançamentos", em `<ul>`: data, operação em palavras, ativo, quantidade e preço, com botão `Apagar` em cada linha e a nota de desdobramento do demo. Mesma coisa para renda fixa. Erro ao apagar aparece na tela.
- Frase sob o título: "A quantidade e o preço são os da data da operação. Desdobramentos posteriores são corrigidos automaticamente."
- Link "Ver minha carteira", para `/carteira`.

- [ ] **Step 1: Escrever o teste de aceitação e confirmar a falha**

```ts
test.describe.configure({ mode: "serial" });

test("a purchase is saved, an impossible sale shows the rule, and deleting clears it", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/carteira/lancar");
  await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
  await expect(page.getByRole("listitem").filter({ hasText: "Itaú" })).toBeVisible();

  await launch(page, { asset: "ITUB4", operation: "Venda", quantity: "99999", price: "30", date: "2024-04-15" });
  await expect(page.getByRole("alert")).toContainText("posição negativa");
  await expect(page.getByLabel("Quantidade")).toHaveValue("99999");

  await page.getByRole("listitem").filter({ hasText: "Itaú" }).getByRole("button", { name: "Apagar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Itaú" })).toHaveCount(0);
});

test("fixed income is saved and can be deleted", async ({ page }) => { /* com os rótulos da tabela */ });
```

Run: `cd web && npm run test:e2e -- carteira`
Expected: FAIL, a rota não existe.

- [ ] **Step 2: Construir a tela**

- [ ] **Step 3: Rodar**

Run: `cd web && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e -- carteira`
Expected: tudo passa.

- [ ] **Step 4: Testar pela interface**

Com `abrir-site.bat`:

- Lance uma compra com vírgula na quantidade. Lance uma venda maior que a posição e leia a mensagem.
- Tente uma data futura e um campo vazio.
- Clique duas vezes rápido em "Salvar lançamento": só uma linha aparece.
- Apague uma compra de que uma venda depende: a mensagem aparece e a compra continua.
- Lance um ativo com desdobramento, como `MGLU3`, com data antiga: a nota aparece.
- Lance um CDB com início antes de 03/11/2016: a mensagem diz desde quando há CDI.
- Largura de 375 px sem rolagem horizontal.

- [ ] **Step 5: Commit**

```bash
git add web
git commit -m "feat: adiciona tela de lancamento"
```

### Task 6: Painel da carteira real

**Files:**
- Modify: `web/app/carteira/page.tsx`, substituindo a tela provisória
- Modify: `web/e2e/carteira.spec.ts`

**Interfaces:**
- Consumes: `requireUser`, `getWallet`; `CLASS_LABELS`, `priceNote`, `paysCoupons`, `resultPhrase` e formatadores; `DataDate`, `Term`.
- Produces: rota `/carteira`, com `instant = false`.

De cima para baixo, como o demo, mas sem faixa de exemplo nem seletor de persona:

1. Título "Minha carteira". Links "Lançar" e "Conta". `DataDate`.
2. Sem perfil: "Responda ao questionário para definir seu perfil e sua meta", com link para `/questionario`. Com perfil: o perfil em palavras e link "Rever meu perfil".
3. Três blocos: **Valor hoje**, **Resultado** e **Quanto está investido**, com as frases do demo. Abaixo: "Proventos não entram nesta conta. Renda fixa aparece em valor bruto, sem imposto."
4. **Onde o dinheiro está**: mesmas barras do demo.
5. **O que tem na carteira**: tabela igual à do demo. Ativo da bolsa leva a `/dados/[ticker]`. Renda fixa (`assetClass === "renda_fixa"`) não tem link. Com `maturity` no passado: "Venceu em {data}. O valor parou de render nesse dia." Título com `paysCoupons`: "Os juros pagos a cada seis meses não entram no resultado."
6. Sem nenhuma posição e sem nada vendido: "Sua carteira está vazia.", com os links "Lançar a primeira compra" (`/carteira/lancar`) e "Ver carteira de exemplo" (`/demo/ana`), no lugar dos blocos 3 a 5.

A tela não sugere comprar nem vender.

- [ ] **Step 1: Escrever o teste de aceitação e confirmar a falha**

```ts
test("an empty wallet invites to launch or see the demo", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await expect(page.getByText("Sua carteira está vazia.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Lançar a primeira compra" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver carteira de exemplo" })).toBeVisible();
});

test("a purchase appears on the panel with figures", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/carteira/lancar");
  await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
  await page.getByRole("link", { name: "Ver minha carteira" }).click();
  await expect(page.getByText("Valor hoje")).toBeVisible();
  await expect(page.getByRole("link", { name: /Itaú/ })).toBeVisible();
  await expect(page.locator("main")).not.toContainText("NaN");
  await deleteEverything(page);
});

test("fixed income appears without a link to an asset page", async ({ page }) => { /* ... */ });
```

Run: `cd web && npm run test:e2e -- carteira`
Expected: FAIL.

- [ ] **Step 2: Construir a tela**

- [ ] **Step 3: Rodar**

Run: `cd web && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e`
Expected: tudo passa.

- [ ] **Step 4: Testar pela interface**

Com `abrir-site.bat`, entre com uma conta nova:

- Carteira vazia mostra o convite.
- Lance uma compra de ação, uma de fundo imobiliário, um título do Tesouro e um CDB. A soma das posições bate com "Valor hoje", e as partes da alocação somam 100%.
- Venda parte de um ativo: o resultado inclui o que foi realizado.
- Toque em um termo sublinhado: o glossário abre.
- Largura de 375 px sem rolagem horizontal.

- [ ] **Step 5: Commit**

```bash
git add web
git commit -m "feat: adiciona painel da carteira real"
```

### Task 7: Ativo: sua posição

**Files:**
- Create: `web/app/dados/[ticker]/MyPosition.tsx`
- Modify: `web/app/dados/[ticker]/page.tsx`, `web/e2e/carteira.spec.ts`

**Interfaces:**
- Consumes: `getMyPosition`; formatadores; `Term`.
- Produces: `MyPosition({ ticker }: { ticker: string })`, componente de servidor assíncrono, dentro de `<Suspense fallback={null}>`, entre o cabeçalho e "Na prática".

Sem sessão ou sem posição, não mostra nada. Com posição, a seção "Sua posição": quantidade, preço médio, valor, resultado com sinal e a frase "Você comprou por {preço médio} em média. Hoje cada unidade vale {preço}." Link "Lançar" para `/carteira/lancar`. Nenhuma sugestão de compra ou venda. A faixa de previsão e o backtest chegam na fase 5.

- [ ] **Step 1: Escrever o teste de aceitação e confirmar a falha**

```ts
test("the asset page shows the position only to whoever holds it", async ({ page, browser }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/carteira/lancar");
  await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
  await page.goto("/dados/ITUB4");
  await expect(page.getByRole("heading", { name: "Sua posição" })).toBeVisible();
  await page.goto("/dados/PETR4");
  await expect(page.getByRole("heading", { name: "Sua posição" })).toHaveCount(0);

  const anonymous = await (await browser.newContext({ baseURL: "http://localhost:3000" })).newPage();
  await anonymous.goto("/dados/ITUB4");
  await expect(anonymous.getByText("O que os números dizem")).toBeVisible();
  await expect(anonymous.getByRole("heading", { name: "Sua posição" })).toHaveCount(0);
  await deleteEverything(page);
});
```

Run: `cd web && npm run test:e2e -- carteira`
Expected: FAIL.

- [ ] **Step 2: Construir o bloco**

- [ ] **Step 3: Rodar**

Run: `cd web && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e`
Expected: tudo passa.

- [ ] **Step 4: Testar pela interface**

Com `abrir-site.bat`: a partir do painel, clique em um ativo seu e veja "Sua posição". Em janela anônima, a mesma página abre sem o bloco. Venda tudo: o bloco some.

- [ ] **Step 5: Commit**

```bash
git add web
git commit -m "feat: mostra a posicao na pagina do ativo"
```

### Task 8: Isolamento entre pessoas e documentação

**Files:**
- Modify: `web/e2e/carteira.spec.ts`, `web/app/page.tsx`, `README.md`, `docs/superpowers/specs/2026-11-03-site-investimentos-design.md`

**Interfaces:**
- Consumes: todas as telas das Tarefas 2 a 7.

`/`: "Sua própria carteira, com login" passa para "Pronto para usar", e a tela ganha um botão secundário "Criar minha carteira", que leva a `/entrar`. README: estado atual, que o site foi construído com Claude sob direção do autor, e o aviso de que a Brevo ou outro SMTP é configurado no painel. Spec, seção 11: "A chave secreta do Supabase só existe nos secrets do GitHub. Apagar a conta usa a função SQL `delete_my_account`, que age só sobre o usuário da sessão."

- [ ] **Step 1: Escrever os testes**

```ts
test("the next person in the same browser sees nothing from the previous one", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/carteira/lancar");
  await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
  await page.goto("/carteira");
  await expect(page.getByRole("link", { name: /Itaú/ })).toBeVisible();

  await page.goto("/conta");
  await page.getByRole("button", { name: "Sair" }).click();
  await signIn(page, "B");
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Minha carteira" }).click();
  await expect(page.getByText("Sua carteira está vazia.")).toBeVisible();
  await page.goto("/dados/ITUB4");
  await expect(page.getByRole("heading", { name: "Sua posição" })).toHaveCount(0);

  await page.goto("/conta");
  await page.getByRole("button", { name: "Sair" }).click();
  await signIn(page, "A");
  await deleteEverything(page);
});

test("two people at the same time get their own wallets", async ({ browser }) => {
  // dois contextos: A com ITUB4 e B com PETR4. Cada um recarrega /carteira 3 vezes
  // e vê só o próprio ativo. Isso pegaria cache no servidor por URL.
});

test("the user pages fit a phone", async ({ page }) => {
  // 375 px, para /entrar, /carteira, /carteira/lancar, /questionario e /conta:
  // document.documentElement.scrollWidth <= window.innerWidth
});
```

- [ ] **Step 2: Rodar**

Run: `cd web && npm run test:e2e`
Expected: PASS. Se o primeiro ou o segundo teste falhar, há vazamento de dados: trate como bloqueio e corrija a causa antes de seguir, com `superpowers:systematic-debugging`.

- [ ] **Step 3: Rodar a suíte inteira**

Run: `cd web && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e`
Run: `cd jobs && .venv/Scripts/ruff check . && .venv/Scripts/pytest -m "not integration" && .venv/Scripts/pytest -m integration tests/test_user_data_integration.py -v`
Expected: tudo passa.

- [ ] **Step 4: Testar pela interface**

Com `abrir-site.bat`, faça o caminho inteiro em uma conta nova: tela inicial, "Criar minha carteira", confirmação por e-mail, questionário, primeira compra, painel, ativo, sair. Em outro navegador, confirme que outra conta não vê nada disso. Apague a conta nova no fim.

- [ ] **Step 5: Commit**

```bash
git add web README.md docs
git commit -m "test: prova o isolamento entre usuarios e atualiza a documentacao"
```

### Task 9: Publicação

**Files:**
- Modify: `README.md`, `docs/fase-0-relatorio.md`

**Interfaces:**
- Consumes: tudo acima.
- Produces: carteira real na URL pública.

- [ ] **Step 1: Revisão da branch**

Revisor novo, no modelo mais capaz disponível sem créditos pagos. Foco: autorização nas Server Actions, RLS, cache de dados de usuário e a Review Focus. Uma passada de correção, com teste que falha antes.

- [ ] **Step 2: [AUTOR] Aprovar o merge**

Aprove o merge de `fase-3` em `main`. A Vercel publica sozinha. Nenhuma variável muda.

- [ ] **Step 3: Conferir a URL pública**

Em `https://site-investimentos-gray.vercel.app`, em navegador novo:

- `/`, `/demo/ana`, `/dados/PETR4` e `/glossario` abrem sem login, sem cair em erro de dados.
- O autor entra com Google, o que cria a conta. Claude não digita a credencial do Google.
- O autor lança uma compra e vê o painel, a posição na página do ativo e a data dos dados.
- O autor sai, e `/carteira` volta para `/entrar`.
- O autor apaga a conta de teste.
- Celular de 375 px sem rolagem horizontal.

- [ ] **Step 4: Registrar**

Relatório, seção "Fase 3": login só com Google, tamanho do banco e tempo de carga de `/carteira`. README com o estado atual. Commit e push com autorização do autor, porque a branch já foi integrada.
