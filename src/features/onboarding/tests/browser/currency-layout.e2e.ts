import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

const MOBILE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 390, height: 700 },
  { width: 390, height: 749 },
  { width: 390, height: 844 },
  { width: 667, height: 375 },
];

test.beforeEach(async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForFunction(async () => {
    const path = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ path)) as typeof StoreModule;
    return useStore.getState().initialized;
  });
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.localUser.put({ id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" });
    await db.people.put({ id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" });
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      icon: "travel-and-places/camping-3d.png",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["member"],
    });
    await db.members.put({ id: "member", groupId: "trip", personId: "self" });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: false,
      lastCompletedStep: "group",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
});

for (const viewport of MOBILE_VIEWPORTS) {
  test(`scrolls the whole currency form while keeping actions visible at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/onboarding/setup");
    const options = page.getByRole("region", { name: "Currency options", exact: true });
    const allCurrencies = page.getByRole("region", { name: "All currencies", exact: true });
    const back = page.getByRole("button", { name: "Back", exact: true });
    const save = page.getByRole("button", { name: "Save and Proceed", exact: true });
    await expect(
      page.getByRole("heading", { name: "One currency for this group", exact: true }),
    ).toBeVisible();
    await expect(back).toBeInViewport();
    await expect(save).toBeInViewport();
    await expect
      .poll(() => options.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);
    const initialSave = (await save.boundingBox())!;
    const initialBack = (await back.boundingBox())!;
    const actionRow = (await page.locator(".onboarding-actions").boundingBox())!;
    expect(initialBack.x).toBeCloseTo(actionRow.x, 0);
    expect(initialBack.width).toBeLessThan(initialSave.width);
    expect(initialSave.x + initialSave.width).toBeCloseTo(actionRow.x + actionRow.width, 0);
    await allCurrencies
      .getByRole("heading", { name: "All currencies", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      allCurrencies.getByRole("heading", { name: "All currencies", exact: true }),
    ).toBeInViewport();
    await options.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(allCurrencies.getByRole("button", { name: /ZMW/u })).toBeInViewport();
    await expect.poll(() => options.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect((await save.boundingBox())!.y).toBeCloseTo(initialSave.y, 0);
    expect((await back.boundingBox())!.y).toBeCloseTo(initialBack.y, 0);
    expect(
      await allCurrencies.locator(".currency-list").evaluate((element) => element.scrollTop),
    ).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    await allCurrencies.getByRole("button", { name: /ZMW/u }).click();
    await expect(allCurrencies.getByRole("button", { name: /ZMW/u })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await save.click();
    await expect(
      page.getByRole("heading", { name: "What will you spend on?", exact: true }),
    ).toBeVisible();
    const currency = await page.evaluate(async () => {
      const path = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
      return (await db.groups.get("trip"))?.currency;
    });
    expect(currency).toBe("ZMW");
  });
}

test("search and quick picks remain usable on a short mobile currency form", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/onboarding/setup");
  const search = page.getByRole("searchbox", { name: "Search currencies" });
  await search.fill("Japanese");
  const results = page.getByRole("region", { name: "All currencies", exact: true });
  await expect(results.getByRole("button")).toHaveCount(1);
  await results.getByRole("button", { name: /JPY/u }).click();
  await expect(results.getByRole("button", { name: /JPY/u })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await search.fill("not-a-currency");
  await expect(results.getByText("No currencies match your search.")).toBeVisible();
  await page.getByRole("button", { name: "Clear currency search" }).click();
  await expect(search).toBeEmpty();
  await page
    .getByRole("region", { name: "Quick picks" })
    .getByRole("button", { name: /USD/u })
    .click();
  await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "What will you spend on?", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Quick picks" }).getByRole("button", { name: /USD/u }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("desktop keeps its independently scrolling currency list", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("/onboarding/setup");
  const form = page.locator(".onboarding-form-scroll");
  const list = page
    .getByRole("region", { name: "All currencies", exact: true })
    .locator(".currency-list");
  await expect(form).toHaveCSS("display", "contents");
  await expect(list).toHaveCSS("overflow-y", "auto");
  await expect
    .poll(() => list.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await list.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(list.getByRole("button", { name: /ZMW/u })).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Save and Proceed", exact: true }),
  ).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
