import { test, type Page } from "@playwright/test";

const REQUIRED = ["E2E_EMAIL_A", "E2E_PASSWORD_A", "E2E_EMAIL_B", "E2E_PASSWORD_B"];

export function skipWithoutUsers(): void {
  test.skip(
    REQUIRED.some((name) => !process.env[name]),
    "Run `python -m pipeline.e2e_users` first.",
  );
}

export async function signIn(page: Page, who: "A" | "B"): Promise<void> {
  await page.goto("/entrar");
  const form = page.getByRole("form", { name: "Entrar", exact: true });
  await form.getByLabel("E-mail").fill(process.env[`E2E_EMAIL_${who}`]!);
  await form.getByLabel("Senha").fill(process.env[`E2E_PASSWORD_${who}`]!);
  await form.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/carteira/);
}
