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
