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
