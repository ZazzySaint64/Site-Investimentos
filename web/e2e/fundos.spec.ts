import { expect, test } from "@playwright/test";

test("a brick fund shows its type, holdings, buildings and contracts", async ({ page }) => {
  await page.goto("/dados/HGLG11");
  const report = page.getByRole("region", { name: "O que este fundo tem" });
  await expect(report.getByText("Pela carteira, é um")).toContainText("FII de tijolo");
  await expect(report.getByText("Imóveis prontos")).toBeVisible();
  await expect(report.getByText("Rendimentos em 12 meses")).toBeVisible();
  await expect(report.getByRole("heading", { name: "Os imóveis" })).toBeVisible();
  await expect(report.getByText(/da receita vem de contratos que terminam em até 1 ano/)).toBeVisible();
  await expect(report.getByText(/\d+,\d%/).first()).toBeVisible();
});

test("a paper fund says it is credit and shows no buildings", async ({ page }) => {
  await page.goto("/dados/KNCR11");
  const report = page.getByRole("region", { name: "O que este fundo tem" });
  await expect(report.getByText("Pela carteira, é um")).toContainText("FII de papel");
  await expect(report.getByText(/Quem compra a cota empresta, indiretamente/)).toBeVisible();
  await expect(report.getByRole("heading", { name: "Os imóveis" })).toHaveCount(0);
});

test("a doubtful vacancy is explained instead of shown", async ({ page }) => {
  await page.goto("/dados/HSML11");
  await expect(page.getByText(/não combina com a receita dos imóveis/)).toBeVisible();
});

test("a stock shows the dividends of the last 12 months", async ({ page }) => {
  await page.goto("/dados/ITUB4");
  await expect(page.getByText("Proventos em 12 meses")).toBeVisible();
  await expect(page.getByText(/por ação em \d+ pagamentos? desde/)).toBeVisible();
});

test("the fixed income sums answer the inputs", async ({ page }) => {
  await page.goto("/renda-fixa?anos=10");
  await page.getByLabel("O título isento rende").fill("12");
  await page.getByLabel("Medido em").selectOption("year");
  await page.getByLabel("Prazo, em dias").fill("800");
  await expect(page.getByText("14,12% ao ano", { exact: true })).toBeVisible();

  await page.getByLabel("Taxa do título, % ao ano").fill("13");
  await expect(page.getByText(/custa hoje R\$\s294,59/)).toBeVisible();
  await expect(page.getByText(/R\$\s269,74/)).toBeVisible();
});

test("a Tesouro title without coupons links to the rate sum with its term", async ({ page }) => {
  await page.goto("/dados");
  const link = page.locator('a[href^="/dados/TD-PRE-"]').first();
  await link.click();
  await page.getByRole("link", { name: "Ver quanto o preço muda se os juros mudarem" }).click();
  await expect(page).toHaveURL(/\/renda-fixa\?anos=\d/);
  await expect(page.getByRole("heading", { name: "Se os juros mudarem" })).toBeVisible();
});
