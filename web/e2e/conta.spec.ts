import { expect, test } from "@playwright/test";
import { signIn, skipWithoutUsers } from "./session";

test("visitor without a session is sent to the login page", async ({ page }) => {
  await page.goto("/carteira");
  await expect(page).toHaveURL(/\/entrar/);
});

test("the login page offers only Google and starts the flow from this site", async ({ page }) => {
  await page.route("**/auth/v1/authorize**", (route) => route.fulfill({ body: "google" }));
  await page.goto("/entrar");
  await expect(page.getByLabel("Senha")).toHaveCount(0);
  await page.getByRole("button", { name: "Entrar com Google" }).click();
  await page.waitForURL(/\/auth\/v1\/authorize/);

  const authorize = new URL(page.url());
  expect(authorize.searchParams.get("provider")).toBe("google");
  expect(authorize.searchParams.get("redirect_to")).toBe("http://localhost:3000/auth/callback");
  expect(authorize.searchParams.get("code_challenge")).toBeTruthy();

  // Written by the site's own Supabase client, the same one that later writes the session cookies.
  const cookies = await page.context().cookies("http://localhost:3000");
  const verifier = cookies.find((cookie) => cookie.name.endsWith("-code-verifier"));
  expect(verifier?.httpOnly).toBe(true);
});

test("sign in reaches the wallet and sign out ends the session", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await expect(page).toHaveURL(/\/carteira/);
  await page.getByRole("link", { name: "Conta" }).click();
  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await page.goto("/carteira");
  await expect(page).toHaveURL(/\/entrar/);
});

test("a failed login explains what happened", async ({ page }) => {
  await page.goto("/auth/callback?code=invalido");
  await expect(page.getByText("Não foi possível concluir o login")).toBeVisible();
});

test("questionnaire refuses a target that does not add up and saves a fixed one", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/questionario");
  const form = page.getByRole("form", { name: "Questionário de perfil" });
  for (const fieldset of await form.locator("fieldset").all()) await fieldset.getByRole("radio").nth(1).check();
  await expect(page.getByRole("heading", { name: "Seu perfil: Moderado" })).toBeVisible();
  const save = form.getByRole("button", { name: "Salvar meu perfil" });
  await expect(save).toBeEnabled();

  const cripto = form.getByLabel("Cripto (%)");
  await cripto.fill("6");
  await expect(form.getByText("Soma: 101%")).toBeVisible();
  await expect(save).toBeDisabled();

  await cripto.fill("5");
  await form.getByLabel("Renda fixa (%)").fill("41");
  await form.getByLabel("Ações do Brasil (%)").fill("29");
  await expect(save).toBeEnabled();
  await save.click();
  await page.waitForURL(/\/carteira/);

  await page.goto("/questionario");
  await expect(page.getByLabel("Renda fixa (%)")).toHaveValue("41");
  await expect(page.getByLabel("Ações do Brasil (%)")).toHaveValue("29");
});

test("deleting the account through the screen removes it for good", async ({ page }) => {
  skipWithoutUsers(); // user C is deleted here: run pipeline.e2e_users before each full run
  await signIn(page, "C");
  await page.goto("/conta");
  await page.locator("summary", { hasText: "Apagar minha conta" }).click(); // opens the <details>
  const form = page.getByRole("form", { name: "Apagar minha conta" });
  await form.getByLabel("Digite APAGAR para confirmar").fill("APAGAR");
  await form.getByRole("button", { name: "Apagar minha conta" }).click();
  await page.waitForURL(/\/entrar\?aviso=conta-apagada/);
  await expect(page.getByText("Sua conta e seus dados foram apagados.")).toBeVisible();

  await expect(signIn(page, "C")).rejects.toThrow("invalid_credentials");
});
