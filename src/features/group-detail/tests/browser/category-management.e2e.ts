import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

test.beforeEach(async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForFunction(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    return useStore.getState().initialized;
  });
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.localUser.put({ id: "self", name: "Amy", icon: "🦊" });
    await db.people.put({ id: "self", name: "Amy", icon: "🦊" });
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      currency: "INR",
      icon: "🏕️",
      createdAt: 1,
      frequentPayerIds: [],
    });
    await db.members.put({ id: "a", groupId: "trip", personId: "self" });
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "🍔",
      isActive: true,
    });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip/categories");
});

test("adds and edits categories with a full-width name field above the icon picker", async ({
  page,
}) => {
  const categories = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Categories", exact: true }) });
  await categories.getByRole("button", { name: "Add category" }).click();
  const form = categories.locator("form");
  const name = form.getByLabel("Category name");
  const icons = form.getByRole("group", { name: "Choose icon" });
  await expect(name).toBeVisible();
  const nameBox = await name.boundingBox();
  const iconsBox = await icons.boundingBox();
  expect(nameBox).not.toBeNull();
  expect(iconsBox).not.toBeNull();
  expect(iconsBox!.y).toBeGreaterThan(nameBox!.y + nameBox!.height);
  const selected = icons.getByRole("img", { name: "Selected icon: Hamburger" });
  await expect(selected).toHaveAttribute("title", "Hamburger");
  await name.fill("Coffee runs");
  await expect(icons.locator(".emoji-picker-featured")).toBeVisible();
  await icons.getByRole("button", { name: "Browse more" }).click();
  await expect(icons.locator(".emoji-picker-featured")).toHaveCount(0);
  await expect(icons.locator(".emoji-picker-gallery")).toBeVisible();
  await icons.getByRole("button", { name: "Close gallery" }).click();
  await expect(icons.locator(".emoji-picker-featured")).toBeVisible();
  await expect(icons.locator(".emoji-picker-gallery")).toHaveCount(0);
  await icons.getByRole("button", { name: "Browse more" }).click();
  await icons.getByRole("button", { name: "Icon Hot beverage" }).last().click();
  await expect(icons.getByRole("img", { name: "Selected icon: Hot beverage" })).toHaveAttribute(
    "title",
    "Hot beverage",
  );
  await form.getByRole("button", { name: "Add", exact: true }).click();

  const row = categories.getByRole("listitem").filter({ hasText: "Coffee runs" });
  await expect(row.locator('img[src$="/food-and-drinks/hot-beverage-3d.png"]')).toBeVisible();
  await row.getByRole("button", { name: "Edit" }).click();
  await expect(form.getByRole("heading", { name: "Edit category" })).toBeVisible();
  await expect(name).toHaveValue("Coffee runs");
  await name.fill("Cafe trips");
  await icons.getByRole("button", { name: "Browse more" }).click();
  await icons.getByRole("button", { name: "Icon Clinking beer mugs" }).click();
  await form.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    categories
      .getByRole("listitem")
      .filter({ hasText: "Cafe trips" })
      .locator('img[src$="/food-and-drinks/clinking-beer-mugs-3d.png"]'),
  ).toBeVisible();
  await page.reload();
  await expect(
    categories
      .getByRole("listitem")
      .filter({ hasText: "Cafe trips" })
      .locator('img[src$="/food-and-drinks/clinking-beer-mugs-3d.png"]'),
  ).toBeVisible();
});
