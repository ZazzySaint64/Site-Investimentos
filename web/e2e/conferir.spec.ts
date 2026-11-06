import { expect, test } from "@playwright/test";

test("from the home page, a code answers the four questions with sources", async ({ page }) => {
  await page.goto("/");
  const band = page.locator("#comece");
  await band.getByLabel("Código ou nome do investimento").fill("mxrf11");
  await band.getByRole("button", { name: "Conferir" }).click();
  await expect(page).toHaveURL(/\/conferir\?ativo=mxrf11/);
  for (const question of ["O que é?", "O que pode dar errado?", "Como foi até aqui?", "De onde vêm os números?"]) {
    await expect(page.getByRole("heading", { name: question })).toBeVisible();
  }
  await expect(page.getByText(/é um FII de papel/)).toBeVisible();
  await expect(page.getByText(/informe mensal de .+ enviado à CVM/)).toBeVisible();
  await page.getByRole("link", { name: "Ver todos os números deste investimento" }).click();
  await expect(page).toHaveURL(/\/dados\/MXRF11$/);
});

test("a name shared by several investments asks which one", async ({ page }) => {
  await page.goto("/conferir?ativo=petrobras");
  await expect(page.getByRole("heading", { name: "Qual destes?" })).toBeVisible();
  await page.getByRole("link", { name: /Petrobras PN/ }).click();
  await expect(page.getByRole("heading", { name: "Petrobras PN" })).toBeVisible();
});

test("a Tesouro title explains selling before maturity", async ({ page }) => {
  await page.goto("/conferir?ativo=ipca 2035");
  await page.getByRole("link", { name: "Tesouro IPCA+ 2035", exact: true }).click();
  await expect(page.getByText(/Quem vende antes recebe o preço do dia/)).toBeVisible();
  await expect(page.getByLabel("Código ou nome do investimento")).toHaveValue("Tesouro IPCA+ 2035");
});

test("an unknown investment says so", async ({ page }) => {
  await page.goto("/conferir?ativo=bitcoin");
  await expect(page.getByRole("status")).toContainText("Não encontramos");
});

test("the check page fits a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/conferir?ativo=HGLG11");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(375);
});
