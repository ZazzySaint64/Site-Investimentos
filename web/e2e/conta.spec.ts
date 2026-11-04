import { expect, test } from "@playwright/test";
import { signIn, skipWithoutUsers } from "./session";

test("visitor without a session is sent to the login page", async ({ page }) => {
  await page.goto("/carteira");
  await expect(page).toHaveURL(/\/entrar/);
});

test("wrong password shows a plain message", async ({ page }) => {
  await page.goto("/entrar");
  const form = page.getByRole("form", { name: "Entrar", exact: true });
  await form.getByLabel("E-mail").fill("ninguem@example.com");
  await form.getByLabel("Senha").fill("senha-errada-123");
  await form.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
});

test("sign in reaches the wallet and sign out ends the session", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await expect(page).toHaveURL(/\/carteira/);
  const sessionCookies = (await page.context().cookies()).filter((c) => c.name.startsWith("sb-"));
  expect(sessionCookies.length).toBeGreaterThan(0);
  for (const cookie of sessionCookies) expect(cookie.httpOnly).toBe(true);
  await page.getByRole("link", { name: "Conta" }).click();
  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await page.goto("/carteira");
  await expect(page).toHaveURL(/\/entrar/);
});

test("a broken email link explains what happened", async ({ page }) => {
  await page.goto("/auth/callback?code=invalido");
  await expect(page.getByText("Não foi possível concluir pelo link")).toBeVisible();
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

  const login = page.getByRole("form", { name: "Entrar", exact: true });
  await login.getByLabel("E-mail").fill(process.env.E2E_EMAIL_C!);
  await login.getByLabel("Senha").fill(process.env.E2E_PASSWORD_C!);
  await login.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
});
