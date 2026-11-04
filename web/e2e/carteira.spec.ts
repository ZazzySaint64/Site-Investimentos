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

test("an empty date shows the rule, not a generic error", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await page.goto("/carteira/lancar");

  const sale = page.getByRole("form", { name: "Compra e venda" });
  await sale.getByLabel("Ativo", { exact: true }).fill("ITUB4");
  await sale.getByLabel("Quantidade", { exact: true }).fill("10");
  await sale.getByLabel("Preço por unidade", { exact: true }).fill("30");
  await sale.getByRole("button", { name: "Salvar lançamento" }).click();
  await expect(sale.getByRole("alert")).toContainText("Informe uma data que não esteja no futuro.");

  const fixed = page.getByRole("form", { name: "Renda fixa" });
  await fixed.getByLabel("Nome", { exact: true }).fill("CDB sem data");
  await fixed.getByLabel("Valor aplicado", { exact: true }).fill("1000");
  await fixed.getByLabel("Percentual do CDI", { exact: true }).fill("100");
  await fixed.getByRole("button", { name: "Salvar renda fixa" }).click();
  await expect(fixed.getByRole("alert")).toContainText("Informe uma data de início que não esteja no futuro.");
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
  await expect(page.getByRole("button", { name: "Salvar renda fixa" })).toBeEnabled();
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Apagar" }).click();
  await expect(row).toHaveCount(0);
});

test("a purchase appears on the panel with figures", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  try {
    await page.goto("/carteira/lancar");
    await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
    await page.getByRole("link", { name: "Ver minha carteira" }).click();
    await expect(page.getByText("Valor hoje")).toBeVisible();
    await expect(page.getByRole("link", { name: /Itaú/ })).toBeVisible();
    await expect(page.getByRole("main")).not.toContainText("NaN");
  } finally {
    await deleteEverything(page);
  }
});

test("fixed income appears without a link to an asset page", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  try {
    await page.goto("/carteira/lancar");
    await page.getByLabel("Nome", { exact: true }).fill("CDB de teste");
    await page.getByLabel("Valor aplicado", { exact: true }).fill("1000");
    await page.getByLabel("Percentual do CDI", { exact: true }).fill("100");
    await page.getByLabel("Data de início", { exact: true }).fill("2024-01-02");
    await page.getByLabel("Liquidez diária", { exact: true }).check();
    await page.getByRole("button", { name: "Salvar renda fixa" }).click();
    await expect(page.getByRole("button", { name: "Salvar renda fixa" })).toBeEnabled();
    await page.getByRole("link", { name: "Ver minha carteira" }).click();
    await expect(page.getByRole("main").getByText("CDB de teste")).toBeVisible();
    await expect(page.getByRole("link", { name: "CDB de teste" })).toHaveCount(0);
    await expect(page.getByRole("main")).not.toContainText("RF-");
  } finally {
    await deleteEverything(page);
  }
});
