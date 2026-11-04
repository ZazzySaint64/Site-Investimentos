import { expect, test } from "@playwright/test";
import { launch, signIn, skipWithoutUsers } from "./session";

test.describe.configure({ mode: "serial" });

test("a purchase is saved, an impossible sale shows the rule, and deleting clears it", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/carteira/lancar");
  const row = page.getByRole("listitem").filter({ hasText: "Itaú" });

  await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
  await expect(row).toBeVisible();

  await launch(page, { asset: "ITUB4", operation: "Venda", quantity: "99999", price: "30", date: "2024-04-15" });
  await expect(page.getByRole("alert")).toContainText("posição negativa");
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
