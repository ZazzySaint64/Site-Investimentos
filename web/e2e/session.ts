import { expect, test, type Page } from "@playwright/test";

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

export async function signOut(page: Page): Promise<void> {
  await page.goto("/conta");
  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL((url) => url.pathname === "/");
}

export type LaunchInput = {
  asset: string;
  operation: "Compra" | "Venda";
  quantity: string;
  price: string;
  date: string;
};

const isAction = (response: { request(): { method(): string } }) =>
  response.request().method() === "POST";

export async function launch(page: Page, input: LaunchInput): Promise<void> {
  await page.getByLabel("Ativo", { exact: true }).fill(input.asset);
  await page.getByLabel("Operação", { exact: true }).selectOption({ label: input.operation });
  await page.getByLabel("Quantidade", { exact: true }).fill(input.quantity);
  await page.getByLabel("Preço por unidade", { exact: true }).fill(input.price);
  await page.getByLabel("Data", { exact: true }).fill(input.date);
  await Promise.all([
    page.waitForResponse(isAction),
    page.getByRole("button", { name: "Salvar lançamento" }).click(),
  ]);
  // pending ends in the same commit that resets the form
  await expect(page.getByRole("button", { name: "Salvar lançamento" })).toBeEnabled();
}

/** Newest first, because a purchase cannot be deleted while a later sale needs it. */
export async function deleteEverything(page: Page): Promise<void> {
  await page.goto("/carteira/lancar");
  const buttons = page.getByRole("button", { name: "Apagar" });
  for (let count = await buttons.count(); count > 0; count = await buttons.count()) {
    await Promise.all([page.waitForResponse(isAction), buttons.last().click()]);
    await expect(buttons).toHaveCount(count - 1);
  }
}
