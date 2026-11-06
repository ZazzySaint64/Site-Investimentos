import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { deleteEverything, launch, signIn, signOut, skipWithoutUsers } from "./session";

async function settled(page: Page) {
  await expect(page.getByRole("main").getByText("O que os números dizem")).toBeVisible();
  await page.waitForLoadState("networkidle");
}

test.describe.configure({ mode: "serial" });

test("a purchase is saved, an impossible sale shows the rule, and deleting clears it", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  try {
    await page.goto("/carteira/lancar");
    const row = page.getByRole("listitem").filter({ hasText: "Itaú" });

    await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
    await expect(row).toBeVisible();

    await launch(page, { asset: "ITUB4", operation: "Venda", quantity: "99999", price: "30", date: "2024-04-15" });
    await expect(page.getByRole("form", { name: "Compra e venda" }).getByRole("alert")).toContainText("posição negativa");
    await expect(page.getByLabel("Quantidade", { exact: true })).toHaveValue("99999");

    await row.getByRole("button", { name: "Apagar" }).click();
    await expect(row).toHaveCount(0);
  } finally {
    await deleteEverything(page);
  }
});

test("a purchase made long ago shows the dividends it received", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  try {
    await page.goto("/carteira/lancar");
    await launch(page, {
      asset: "ITUB4",
      operation: "Compra",
      quantity: "10",
      price: "30",
      date: "2024-03-15",
    });
    await expect(page.getByRole("listitem").filter({ hasText: "Itaú" })).toBeVisible();
    await page.goto("/carteira");
    const income = page.getByRole("region", { name: "Proventos e comparação" });
    await expect(income.getByText(/Mesmo dinheiro no/)).toBeVisible();
    await expect(income.getByText(/em 15\/03\/2024/)).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: "ITUB4" });
    await expect(row.getByRole("cell").nth(6)).toHaveText(/R\$\s[1-9][\d.,]*/);
  } finally {
    await deleteEverything(page);
  }
});

test("the B3 statement is previewed, saved once and not twice", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  const file = path.join(__dirname, "fixtures", "negociacao.xlsx");
  try {
    await deleteEverything(page);
    await page.goto("/carteira");
    await page.getByRole("link", { name: "Importar da B3" }).click();
    const form = page.getByRole("region", { name: "Importar extrato" });
    await form.getByLabel("Extrato de negociação (.xlsx)").setInputFiles(file);
    await expect(form.getByText("4 operações lidas, 3 para lançar.")).toBeVisible();
    await expect(form.getByRole("row").filter({ hasText: "ZZZZ3" })).toContainText("Fora da lista do site");
    await expect(form.getByText(/Linha 5: Mercado “Opção de Compra”/)).toBeVisible();
    await form.getByRole("button", { name: "Lançar 3 operações" }).click();
    await expect(form.getByRole("status")).toContainText("3 operações salvas.");

    await page.reload();
    await form.getByLabel("Extrato de negociação (.xlsx)").setInputFiles(file);
    await expect(form.getByText("4 operações lidas, 0 para lançar.")).toBeVisible();
    await expect(form.getByRole("button", { name: "Lançar 0 operações" })).toBeDisabled();

    await page.goto("/carteira");
    await expect(page.getByRole("row").filter({ hasText: "ITUB4" }).getByRole("cell").nth(1)).toHaveText(/^6(,\d+)?$/); // later bonus shares raise it
  } finally {
    await deleteEverything(page);
  }
});

test("an empty wallet invites to launch or see the demo", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  await deleteEverything(page);
  await page.goto("/carteira");
  const main = page.getByRole("main");
  await expect(main.getByText("Sua carteira está vazia.")).toBeVisible();
  await expect(main.getByRole("link", { name: "Lançar a primeira compra" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Ver carteira de exemplo" })).toBeVisible();
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
  try {
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
  } finally {
    await deleteEverything(page);
  }
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

test("the asset page shows the position only to whoever holds it", async ({ page, browser, baseURL }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  const context = await browser.newContext({ baseURL });
  try {
    await page.goto("/carteira/lancar");
    await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
    const heading = (target: typeof page) => target.getByRole("main").getByRole("heading", { name: "Sua posição" });
    await page.goto("/dados/ITUB4");
    await expect(heading(page)).toBeVisible();
    await page.goto("/dados/PETR4");
    await settled(page);
    await expect(heading(page)).toHaveCount(0);

    const anonymous = await context.newPage();
    await anonymous.goto("/dados/ITUB4");
    await settled(anonymous);
    await expect(heading(anonymous)).toHaveCount(0);
  } finally {
    await context.close();
    await deleteEverything(page);
  }
});

test("the next person in the same browser sees nothing from the previous one", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  try {
    await page.goto("/carteira/lancar");
    await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
    await page.goto("/carteira");
    await expect(page.getByRole("main").getByRole("link", { name: /Itaú/ })).toBeVisible();

    await signOut(page);
    await page.goBack();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("main").getByRole("link", { name: /Itaú/ })).not.toBeVisible();
    await signIn(page, "B");
    await deleteEverything(page); // B starts empty; A's data must still not appear
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Minha carteira" }).click();
    const main = page.getByRole("main");
    await expect(main.getByText("Sua carteira está vazia.")).toBeVisible();
    await expect(main.getByRole("link", { name: /Itaú/ })).toHaveCount(0);
    await page.goto("/dados/ITUB4");
    await settled(page);
    await expect(page.getByRole("main").getByRole("heading", { name: "Sua posição" })).toHaveCount(0);
  } finally {
    await signOut(page);
    await signIn(page, "A");
    await deleteEverything(page);
  }
});

test("two people at the same time get their own wallets", async ({ browser, baseURL }) => {
  skipWithoutUsers();
  const contextA = await browser.newContext({ baseURL });
  const contextB = await browser.newContext({ baseURL });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  try {
    await signIn(pageA, "A");
    await signIn(pageB, "B");
    await pageA.goto("/carteira/lancar");
    await launch(pageA, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
    await pageB.goto("/carteira/lancar");
    await launch(pageB, { asset: "PETR4", operation: "Compra", quantity: "5", price: "35", date: "2024-03-15" });

    for (let round = 0; round < 3; round++) {
      await pageA.goto("/carteira");
      await expect(pageA.getByRole("main").getByRole("link", { name: /Itaú/ })).toBeVisible();
      await expect(pageA.getByRole("main").getByRole("link", { name: /Petrobras/ })).toHaveCount(0);
      await pageB.goto("/carteira");
      await expect(pageB.getByRole("main").getByRole("link", { name: /Petrobras/ })).toBeVisible();
      await expect(pageB.getByRole("main").getByRole("link", { name: /Itaú/ })).toHaveCount(0);
    }
  } finally {
    await deleteEverything(pageA).catch(() => {});
    await deleteEverything(pageB).catch(() => {});
    await contextA.close();
    await contextB.close();
  }
});

test("the user pages fit a phone", async ({ page }) => {
  skipWithoutUsers();
  await page.setViewportSize({ width: 375, height: 812 });
  const fits = async (path: string) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `${path} overflows 375 px`).toBe(false);
  };
  await fits("/entrar"); // before signing in: a session redirects it to /carteira
  await signIn(page, "A");
  try {
    await deleteEverything(page);
    for (const path of ["/carteira", "/carteira/lancar", "/carteira/importar", "/questionario", "/conta"]) await fits(path);
    await page.goto("/carteira/importar");
    await page.getByLabel("Extrato de negociação (.xlsx)").setInputFiles(path.join(__dirname, "fixtures", "negociacao.xlsx"));
    await expect(page.getByText(/Vai entrar/).first()).toBeVisible(); // the status shows on a phone too
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

    await page.goto("/carteira/lancar");
    await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "10", price: "30", date: "2024-03-15" });
    for (const path of ["/carteira", "/carteira/lancar", "/dados/ITUB4"]) await fits(path);
  } finally {
    await deleteEverything(page);
  }
});
