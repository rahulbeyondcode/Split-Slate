import { expect, test } from "@playwright/test";

import type * as SlideModule from "@/features/onboarding/components/feature-carousel/slide-data";

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 320, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];

for (const viewport of VIEWPORTS) {
  test(`keeps carousel text and actions stationary at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/onboarding");
    const slides = await page.evaluate(async () => {
      const modulePath = "/src/features/onboarding/components/feature-carousel/slide-data.ts";
      const { slides } = (await import(/* @vite-ignore */ modulePath)) as typeof SlideModule;
      return slides.map(({ title, description }) => ({ title, description }));
    });
    await expect(page.getByRole("heading", { name: slides[0].title, exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const next = page.getByRole("button", { name: /^(Next|Get started)$/u });
    const restore = page.getByRole("button", { name: "Restore", exact: true });
    await restore.scrollIntoViewIfNeeded();
    const initialNext = (await next.boundingBox())!;
    const initialRestore = (await restore.boundingBox())!;
    const initialTitle = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    const initialDescription = (await page
      .getByText(slides[0].description, { exact: true })
      .boundingBox())!;
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toHaveCount(0);

    for (let index = 1; index < slides.length; index += 1) {
      await next.click();
      await page.mouse.move(0, 0);
      await expect(
        page.getByRole("heading", { name: slides[index].title, exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect
        .poll(async () => {
          const nextBox = (await next.boundingBox())!;
          const restoreBox = (await restore.boundingBox())!;
          const titleBox = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
          const descriptionBox = (await page
            .getByText(slides[index].description, { exact: true })
            .boundingBox())!;
          return Math.max(
            Math.abs(nextBox.x + nextBox.width - initialNext.x - initialNext.width),
            Math.abs(nextBox.y - initialNext.y),
            Math.abs(nextBox.height - initialNext.height),
            Math.abs(restoreBox.y - initialRestore.y),
            Math.abs(titleBox.y - initialTitle.y),
            Math.abs(descriptionBox.y - initialDescription.y),
          );
        })
        .toBeLessThan(1);
      const previous = (await page
        .getByRole("button", { name: "Previous", exact: true })
        .boundingBox())!;
      const nextBox = (await next.boundingBox())!;
      expect(previous.x).toBeCloseTo(initialNext.x, 0);
      expect(previous.width).toBeLessThan(nextBox.width);
      expect(nextBox.width).toBeLessThan(initialNext.width);
      const description = (await page
        .getByText(slides[index].description, { exact: true })
        .boundingBox())!;
      const progress = (await page
        .getByLabel("Introduction slides", { exact: true })
        .boundingBox())!;
      expect(description.y + description.height).toBeLessThanOrEqual(progress.y);
    }

    await expect(page.getByRole("button", { name: "Get started", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Skip intro/u })).toHaveCount(0);
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(page.getByRole("heading", { name: slides[3].title, exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: `Go to slide 1: ${slides[0].title}`, exact: true })
      .click();
    await expect(page.getByRole("heading", { name: slides[0].title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
  });
}

test("offers clear restore choices and returns focus after closing or Escape", async ({ page }) => {
  await page.goto("/onboarding");
  const restore = page.getByRole("button", { name: "Restore", exact: true });
  const dialog = page.getByRole("dialog", { name: "Start with your saved data" });
  await expect(page.getByText("Have a backup?", { exact: false })).toBeVisible();
  await restore.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Open a group someone shared or you saved.")).toBeVisible();
  await expect(dialog.getByText("Bring everything back, just as you saved it.")).toBeVisible();
  const importGroup = dialog.getByRole("link", { name: /^Import a group/u });
  const restoreApp = dialog.getByRole("link", { name: /^Restore your app/u });
  await expect(importGroup).toHaveAttribute("href", "/import");
  await expect(restoreApp).toHaveAttribute("href", "/restore");
  await expect(importGroup.locator("svg[aria-hidden='true']")).toHaveCount(2);
  await expect(restoreApp.locator("svg[aria-hidden='true']")).toHaveCount(2);
  await dialog.getByRole("button", { name: "Close restore options" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(restore).toBeFocused();
  await restore.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(restore).toBeFocused();
});

test("opens group import from the restore chooser", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Start with your saved data" })
    .getByRole("link", { name: /^Import a group/u })
    .click();
  await expect(page).toHaveURL(/\/import$/u);
  await expect(page.getByRole("heading", { name: "Import a group", exact: true })).toBeVisible();
});

test("opens full-app restore from the restore chooser", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Start with your saved data" })
    .getByRole("link", { name: /^Restore your app/u })
    .click();
  await expect(page).toHaveURL(/\/restore$/u);
  await expect(
    page.getByRole("heading", { name: "Restore SplitSlate", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to SplitSlate", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/u);
});

test("applies the saved theme on direct onboarding and setup visits", async ({ page }) => {
  await page.goto("/onboarding");
  for (const theme of ["dark", "light"]) {
    await page.evaluate((value) => localStorage.setItem("split-slate-theme", value), theme);
    for (const path of ["/onboarding", "/onboarding/setup"]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  }
});

test("keeps the restore chooser within a narrow dark-theme viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/onboarding");
  await page.evaluate(() => {
    localStorage.setItem("split-slate-theme", "dark");
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Start with your saved data" });
  await expect(dialog).toBeVisible();
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(568);
  const surfaceColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--surface").trim(),
  );
  const expectedColor = await dialog.evaluate((element, color) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = color;
    element.append(probe);
    const resolved = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return resolved;
  }, surfaceColor);
  await expect(dialog).toHaveCSS("background-color", expectedColor);
});
