import { expect, test } from "@playwright/test";

test("the reserve follows the expenses and the kind of income", async ({ page }) => {
  await page.goto("/primeiros-passos");
  const reserve = page.getByRole("region", { name: "Quanto guardar de reserva" });
  await reserve.getByLabel("Gastos essenciais por mês").fill("2.000");
  await reserve.getByLabel("Quanto já tem guardado").fill("12.000");
  await expect(reserve.getByText(/R\$\s12\.000,00/).first()).toBeVisible();
  await expect(reserve.getByText(/Você já tem a reserva inteira/)).toBeVisible();

  await reserve.getByText("Variável").click();
  await expect(reserve.getByText("Meses de gastos guardados: 12")).toBeVisible();
  await expect(reserve.getByText(/R\$\s24\.000,00/)).toBeVisible();
  await expect(reserve.getByText(/Faltam R\$\s12\.000,00/)).toBeVisible();
});

test("without interest the contributions are only what was put in", async ({ page }) => {
  await page.goto("/primeiros-passos");
  const plan = page.getByRole("region", { name: "Quanto os aportes podem virar" });
  await plan.getByLabel("Aporte por mês").fill("100");
  await plan.getByLabel("Rendimento acima da inflação, % ao ano").fill("0");
  await expect(plan.getByText(/Você aportaria R\$\s24\.000,00, e os juros somariam R\$\s0,00/)).toBeVisible();
  await expect(plan.getByText(/Desde \d{4}, o CDI rendeu entre/)).toBeVisible();
});

test("the plant's roots and tree stages lead to the sums", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Calcular minha reserva" })).toHaveAttribute(
    "href",
    "/primeiros-passos#reserva",
  );
  await expect(page.getByRole("link", { name: "Simular meus aportes" })).toHaveAttribute(
    "href",
    "/primeiros-passos#aportes",
  );
});

test("the first steps page fits a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/primeiros-passos");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
