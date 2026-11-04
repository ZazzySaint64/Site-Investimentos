import { expect, test } from "@playwright/test";
import { deleteEverything, launch, signIn, skipWithoutUsers } from "./session";

test.describe.configure({ mode: "serial" });

test("a purchase is saved, an impossible sale shows the rule, and deleting clears it", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/carteira/lancar");
  const row = page.getByRole("listitem").filter({ hasText: "Itaú" });

  await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
  await expect(row).toBeVisible();

  await launch(page, { asset: "ITUB4", operation: "Venda", quantity: "99999", price: "30", date: "2024-04-15" });
  await expect(page.getByRole("form", { name: "Compra e venda" }).getByRole("alert")).toContainText("posição negativa");
  await expect(page.getByLabel("Quantidade", { exact: true })).toHaveValue("99999");

  await row.getByRole("button", { name: "Apagar" }).click();
  await expect(row).toHaveCount(0);
});

test("fixed income is saved and can be deleted", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/carteira/lancar");
  const row = page.getByRole("listitem").filter({ hasText: "CDB de teste" });

  await page.getByLabel("Nome", { exact: true }).fill("CDB de teste");
  await page.getByLabel("Valor aplicado", { exact: true }).fill("1000");
  await page.getByLabel("Percentual do CDI", { exact: true }).fill("100");
  await page.getByLabel("Data de início", { exact: true }).fill("2024-01-02");
  await page.getByLabel("Liquidez diária", { exact: true }).check();
  await page.getByRole("button", { name: "Salvar renda fixa" }).click();
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Apagar" }).click();
  await expect(row).toHaveCount(0);
});

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

test("fixed income appears without a link to an asset page", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/carteira/lancar");
  await page.getByLabel("Nome", { exact: true }).fill("CDB de teste");
  await page.getByLabel("Valor aplicado", { exact: true }).fill("1000");
  await page.getByLabel("Percentual do CDI", { exact: true }).fill("100");
  await page.getByLabel("Data de início", { exact: true }).fill("2024-01-02");
  await page.getByLabel("Liquidez diária", { exact: true }).check();
  await page.getByRole("button", { name: "Salvar renda fixa" }).click();
  await page.getByRole("link", { name: "Ver minha carteira" }).click();
  await expect(page.getByText("CDB de teste")).toBeVisible();
  await expect(page.getByRole("link", { name: "CDB de teste" })).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("RF-");
  await deleteEverything(page);
});
