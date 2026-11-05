import { expect, test } from "@playwright/test";

test("visitor reaches the demo in one click and walks through the screens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "Ver carteira de exemplo" }).click();
  await expect(page.getByText("Exemplo com carteira fictícia")).toBeVisible();
  await expect(page.getByRole("region", { name: "Resumo da carteira" }).getByText("Valor hoje")).toBeVisible();
  await page.getByRole("link", { name: /Bruno/ }).click();
  await expect(page).toHaveURL(/\/demo\/bruno/);
  await expect(page.getByRole("heading", { name: /Bruno/ })).toBeVisible();
  await page.getByRole("link", { name: /Itaú/ }).click();
  await expect(page.getByText("O que os números dizem")).toBeVisible();
});

test("the glossary opens from a term on the panel", async ({ page }) => {
  await page.goto("/demo/ana");
  await page.getByRole("button", { name: "O que é Preço médio?" }).click();
  await expect(page.getByText("O preço pago por cada unidade")).toBeVisible();
  await page.getByRole("button", { name: "Entendi" }).locator("visible=true").click();
  await expect(page.getByText("O preço pago por cada unidade")).toBeHidden();
});

test("an unknown persona shows the not found page", async ({ page }) => {
  const response = await page.goto("/demo/naoexiste");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Página não encontrada")).toBeVisible();
});

test("the home page swaps the sheet and its sentence when another investment is picked", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article", { name: "Ficha de Petrobras PN" })).toBeVisible();
  await page.getByRole("button", { name: "Um fundo imobiliário" }).click();
  await expect(page.getByRole("article", { name: "Ficha de Petrobras PN" })).toBeHidden();
  const sheet = page.getByRole("article", { name: /^Ficha de / });
  await expect(sheet.getByRole("link", { name: "Ver a página completa" })).toHaveAttribute("href", /HGLG11/);
  await expect(sheet.getByText(/por ano em até 5 anos/)).toBeVisible();
});

test("the growth journey moves sideways and leaves the page scroll alone", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Investir em/ })).toBeInViewport();
  const roots = page.getByRole("heading", { name: "Primeiro, as raízes" });
  await expect(roots).not.toBeInViewport();

  await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(roots).toBeInViewport();
  await expect(page.getByRole("button", { name: "Raízes" })).toHaveAttribute("aria-current", "step");

  await page.getByRole("button", { name: "Árvore" }).click();
  await expect(page.getByRole("heading", { name: "O tempo faz o resto" })).toBeInViewport();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Investir em/ })).toBeInViewport();

  await page.mouse.move(400, 300);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("the growth journey works with reduced motion and fits a phone", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Galhos" }).click();
  await expect(page.getByRole("heading", { name: "Cada galho, um risco" })).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
