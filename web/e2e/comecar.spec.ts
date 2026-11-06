import { expect, test } from "@playwright/test";
import { deleteEverything, launch, signIn, skipWithoutUsers } from "./session";

test("the seed of the plant leads to the path, with each stage and its tool", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Ver o caminho em passos" }).click();
  await expect(page.getByRole("heading", { name: "Por onde começar", level: 1 })).toBeVisible();
  const steps = page.getByRole("main").getByRole("listitem");
  await expect(steps).toHaveCount(6);
  await expect(steps.nth(1).getByRole("link", { name: "Calcular minha reserva" })).toHaveAttribute(
    "href",
    "/primeiros-passos#reserva",
  );
  await expect(page.getByRole("link", { name: "Entre na sua conta" })).toBeVisible();
});

test("with a purchase the last stage is marked from the records", async ({ page }) => {
  skipWithoutUsers();
  await signIn(page, "A");
  try {
    await deleteEverything(page);
    await page.goto("/comecar");
    await expect(page.getByText(/[0-6] de 6 etapas marcadas/)).toBeVisible();
    await page.goto("/carteira/lancar");
    await launch(page, { asset: "ITUB4", operation: "Compra", quantity: "1", price: "30", date: "2024-03-15" });
    await expect(page.getByRole("listitem").filter({ hasText: "Itaú" })).toBeVisible();
    await page.goto("/comecar");
    await expect(page.getByRole("listitem", { name: "6. Árvore, feita" })).toBeVisible();
    await expect(page.getByRole("listitem", { name: "3. Broto" })).toContainText(
      "Marcado quando há compras em três meses diferentes.",
    );
  } finally {
    await deleteEverything(page);
  }
});

test("the path fits a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/comecar");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
