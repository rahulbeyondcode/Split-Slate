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
  isMobile,
}) => {
  const categories = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Categories", exact: true }) });
  await categories.getByRole("button", { name: "Add category" }).click();
  const form = isMobile
    ? page.getByRole("dialog", { name: "Add category" }).locator("form")
    : categories.locator("form");
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
  const editForm = isMobile
    ? page.getByRole("dialog", { name: "Edit category" }).locator("form")
    : categories.locator("form");
  await expect(editForm.getByRole("heading", { name: "Edit category" })).toBeVisible();
  await expect(editForm.getByLabel("Category name")).toHaveValue("Coffee runs");
  await editForm.getByLabel("Category name").fill("Cafe trips");
  await editForm
    .getByRole("group", { name: "Choose icon" })
    .getByRole("button", { name: "Browse more" })
    .click();
  await editForm
    .getByRole("group", { name: "Choose icon" })
    .getByRole("button", { name: "Icon Clinking beer mugs" })
    .click();
  await editForm.getByRole("button", { name: "Save", exact: true }).click();
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

test("adds and edits tags in a mobile dialog and inline on desktop", async ({ page, isMobile }) => {
  const tags = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Tags", exact: true }) });
  await tags.getByRole("button", { name: "Add tag" }).click();
  const addForm = isMobile
    ? page.getByRole("dialog", { name: "Add tag" }).locator("form")
    : tags.locator("form");
  await addForm.getByPlaceholder("Tag name").fill("Weekend");
  await addForm.getByRole("button", { name: "Green #22c55e" }).click();
  await addForm.getByRole("button", { name: "Add", exact: true }).click();
  const row = tags.getByRole("listitem").filter({ hasText: "Weekend" });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Edit" }).click();
  const editForm = isMobile
    ? page.getByRole("dialog", { name: "Edit tag" }).locator("form")
    : tags.locator("form");
  await expect(editForm.getByPlaceholder("Tag name")).toHaveValue("Weekend");
  await editForm.getByPlaceholder("Tag name").fill("Holiday");
  await editForm.getByRole("button", { name: "Save", exact: true }).click();
  await expect(tags.getByRole("listitem").filter({ hasText: "Holiday" })).toBeVisible();
});

test("keeps category and tag editors inline at tablet width", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  const categories = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Categories", exact: true }) });
  await categories.getByRole("button", { name: "Add category" }).click();
  await expect(categories.locator("form")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Add category" })).toHaveCount(0);
  await categories.locator("form").getByRole("button", { name: "Cancel" }).click();

  const tags = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Tags", exact: true }) });
  await tags.getByRole("button", { name: "Add tag" }).click();
  await expect(tags.locator("form")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Add tag" })).toHaveCount(0);
});
