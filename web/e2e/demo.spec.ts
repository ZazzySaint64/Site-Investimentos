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

test("the growth journey moves sideways with the scroll", async ({ page }) => {
  await page.goto("/");
  const first = page.getByRole("heading", { level: 1, name: /Investir em/ });
  const roots = page.getByRole("heading", { name: "Primeiro, as raízes" });
  await expect(first).toBeInViewport();
  await expect(roots).not.toBeInViewport();

  await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(roots).toBeInViewport();
  await expect(page.getByRole("button", { name: "Raízes" })).toHaveAttribute("aria-current", "step");

  await page.waitForTimeout(1200); // the smooth scroll of the click must end first
  await page.mouse.move(400, 300);
  await page.mouse.wheel(0, 800);
  await expect(page.getByRole("button", { name: "Broto" })).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("heading", { name: "Depois, a constância" })).toBeInViewport();

  await page.getByRole("button", { name: "Galhos" }).click();
  await page.getByRole("button", { name: "Ações" }).click();
  await expect(page.getByText("Partes de empresas")).toBeVisible();

  await page.getByRole("button", { name: "Árvore" }).click();
  await expect(page.getByRole("heading", { name: "O tempo faz o resto" })).toBeInViewport();

  await page.getByRole("link", { name: "Pular" }).click();
  await expect(page.getByRole("main").getByRole("link", { name: "Ver carteira de exemplo" })).toBeInViewport();
});

test("the growth journey moves when dragged sideways and by the arrow keys", async ({ page }) => {
  await page.goto("/");
  const box = page.getByRole("group", { name: /Etapas/ });
  await expect(page.getByRole("heading", { level: 1, name: /Investir em/ })).toBeInViewport();

  await page.mouse.move(1000, 300);
  await page.mouse.down();
  await page.mouse.move(100, 300, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Semente" })).not.toHaveAttribute("aria-current", "step");

  await page.getByRole("button", { name: "Semente" }).click();
  await expect(page.getByRole("button", { name: "Semente" })).toHaveAttribute("aria-current", "step");
  await box.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Raízes" })).toHaveAttribute("aria-current", "step");
});

test("with reduced motion it is a plain sideways row that still fits a phone", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Galhos" }).click();
  await expect(page.getByRole("heading", { name: "Cada galho, um risco" })).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("the phone layout does not overflow while pinned", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Galhos" }).click();
  await expect(page.getByRole("heading", { name: "Cada galho, um risco" })).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("on a short phone the text of each stage ends above the stage buttons", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Etapas do crescimento" });
  for (const [stage, heading] of [
    ["Semente", /Investir em/],
    ["Galhos", "Cada galho, um risco"],
    ["Seca", "Toda árvore passa por secas"],
  ] as const) {
    await page.getByRole("button", { name: stage, exact: true }).click();
    const title = page.getByRole("heading", { name: heading });
    await expect(title).toBeInViewport();
    await page.waitForTimeout(1200); // the smooth scroll of the click must end first
    const text = title.locator("xpath=..");
    const textBottom = await text.evaluate((element) => element.getBoundingClientRect().bottom);
    const navTop = await nav.evaluate((element) => element.getBoundingClientRect().top);
    expect(textBottom, stage).toBeLessThanOrEqual(navTop);
  }
});

test("the leaves stay on the tree on a scaled screen", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Árvore" }).click();
    await expect(page.getByRole("heading", { name: "O tempo faz o resto" })).toBeInViewport();
    await page.waitForTimeout(1500);
    const leaves = await page.evaluate(() => {
      const canvas = document.querySelector("canvas")!;
      const { width, height } = canvas;
      const data = canvas.getContext("2d")!.getImageData(0, 0, width, Math.round(height * 0.7)).data;
      let near = 0;
      let far = 0;
      for (let i = 0; i < data.length; i += 4) {
        const isLeaf = data[i + 1] > 150 && data[i + 1] > data[i + 2] * 1.5;
        if (!isLeaf) continue;
        const x = (i / 4) % width;
        if (x > width * 0.45) near++;
        else if (x < width * 0.3) far++;
      }
      return { near, far };
    });
    expect(leaves.near).toBeGreaterThan(20000);
    expect(leaves.far).toBeLessThan(leaves.near / 20);
  } finally {
    await context.close();
  }
});

test("the example wallet shows the dividends and the same money in the CDI and the IPCA", async ({
  page,
}) => {
  await page.goto("/demo/ana");
  const income = page.getByRole("region", { name: "Proventos e comparação" });
  await expect(income.getByText(/nos últimos 12 meses/)).toBeVisible();
  await expect(
    income.getByText(/Ficou R\$\s[\d.,]+ (acima|abaixo) do CDI|igual ao CDI/),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Resumo da carteira" }).getByText("Com os"),
  ).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "HGLG11" });
  await expect(row.getByRole("cell").nth(6)).toHaveText(/R\$\s[\d.,]+/);
});
