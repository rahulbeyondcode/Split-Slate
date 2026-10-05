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

test("places both section headings and dark Add actions above their cards", async ({ page }) => {
  await expect(page.locator(".group-management > h2")).toHaveCount(0);
  await expect(page.locator(".group-page-header h1")).toHaveClass(/sr-only/u);
  const sections = page.locator(".management-section");
  await expect(sections).toHaveCount(2);
  for (const [index, name] of ["Categories", "Tags"].entries()) {
    const section = sections.nth(index);
    const header = section.locator(".management-card-header");
    const card = section.locator(":scope > .surface");
    await expect(header.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(header).toHaveCSS("position", "static");
    const add = header.getByRole("button", { name: index === 0 ? "Add category" : "Add tag" });
    await expect(add).toHaveClass(/btn-primary/u);
    expect((await card.boundingBox())!.y).toBeGreaterThanOrEqual(
      (await header.boundingBox())!.y + (await header.boundingBox())!.height,
    );
  }
});

test("stacks tablet management cards and keeps short desktop names beside row actions", async ({
  page,
}) => {
  const sections = page.locator(".group-management-grid > .management-section");
  await page.setViewportSize({ width: 820, height: 900 });
  const tabletCategories = (await sections.first().boundingBox())!;
  const tabletTags = (await sections.last().boundingBox())!;
  expect(tabletTags.y).toBeGreaterThanOrEqual(tabletCategories.y + tabletCategories.height);
  expect(Math.abs(tabletTags.width - tabletCategories.width)).toBeLessThan(2);

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.tags.put({ id: "weekend", groupId: "trip", name: "Weekend", color: "#795ecb" });
  });
  await page.setViewportSize({ width: 1440, height: 744 });
  await page.reload();
  const desktopCategories = (await sections.first().boundingBox())!;
  const desktopTags = (await sections.last().boundingBox())!;
  expect(Math.abs(desktopTags.y - desktopCategories.y)).toBeLessThan(2);
  expect(desktopTags.x).toBeGreaterThanOrEqual(desktopCategories.x + desktopCategories.width);
  for (const row of [page.locator(".category-entry").first(), page.locator(".tag-entry").first()]) {
    const identity = (await row.locator(".management-entry-identity").boundingBox())!;
    const actions = (await row.locator(".management-entry-actions").boundingBox())!;
    expect(
      Math.abs(actions.y + actions.height / 2 - identity.y - identity.height / 2),
    ).toBeLessThan(3);
  }

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { name: "Pets and veterinary care for the whole family" });
  });
  await page.reload();
  const longRow = page.locator(".category-entry").first();
  const identity = (await longRow.locator(".management-entry-identity").boundingBox())!;
  const actions = (await longRow.locator(".management-entry-actions").boundingBox())!;
  expect(actions.y).toBeGreaterThanOrEqual(identity.y + identity.height);
});

test("wraps category names without an inline expense count and explains blocked deletion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { name: "Pets and veterinary care for the whole family" });
    await db.expenses.put({
      expenseId: "pet-care",
      groupId: "trip",
      expenseName: "Vet visit",
      createdBy: "a",
      categoryId: "food",
      tagIds: [],
      attachmentIds: [],
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      transactions: {
        paid: [{ memberId: "a", amount: 100 }],
        owes: [{ memberId: "a", amount: 100 }],
      },
    });
  });
  await page.reload();
  const row = page.locator(".category-entry").filter({ hasText: "Pets and veterinary care" });
  const name = row.locator(".management-entry-identity > span:last-child");
  await expect(name).toHaveText("Pets and veterinary care for the whole family");
  await expect(name).toHaveCSS("white-space", "normal");
  await expect(row).not.toContainText("1 expense");
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("dialog", { name: /Cannot delete/u })).toContainText("1 expense");
});

test("adds and edits categories in a dialog with a full-width name field above the icon picker", async ({
  page,
}) => {
  const categories = page
    .locator(".management-section")
    .filter({ has: page.getByRole("heading", { name: "Categories", exact: true }) });
  await categories.getByRole("button", { name: "Add category" }).click();
  const form = page.getByRole("dialog", { name: "Add category" }).locator("form");
  await expect(categories.locator(".management-card-content form")).toHaveCount(0);
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
  const editForm = page.getByRole("dialog", { name: "Edit category" }).locator("form");
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

test("adds and edits tags in a dialog at every width", async ({ page }) => {
  const tags = page
    .locator(".management-section")
    .filter({ has: page.getByRole("heading", { name: "Tags", exact: true }) });
  await tags.getByRole("button", { name: "Add tag" }).click();
  const addForm = page.getByRole("dialog", { name: "Add tag" }).locator("form");
  await addForm.getByPlaceholder("Tag name").fill("Weekend");
  await addForm.getByRole("button", { name: "Green #22c55e" }).click();
  await addForm.getByRole("button", { name: "Add", exact: true }).click();
  const row = tags.getByRole("listitem").filter({ hasText: "Weekend" });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Edit" }).click();
  const editForm = page.getByRole("dialog", { name: "Edit tag" }).locator("form");
  await expect(editForm.getByPlaceholder("Tag name")).toHaveValue("Weekend");
  await editForm.getByPlaceholder("Tag name").fill("Holiday");
  await editForm.getByRole("button", { name: "Save", exact: true }).click();
  await expect(tags.getByRole("listitem").filter({ hasText: "Holiday" })).toBeVisible();
});

test("opens category and tag editors in dialogs at tablet width", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  const categories = page
    .locator(".management-section")
    .filter({ has: page.getByRole("heading", { name: "Categories", exact: true }) });
  await categories.getByRole("button", { name: "Add category" }).click();
  const categoryDialog = page.getByRole("dialog", { name: "Add category" });
  await expect(categoryDialog.locator("form")).toBeVisible();
  await categoryDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(categoryDialog).toHaveCount(0);
  await categories
    .getByRole("listitem")
    .filter({ hasText: "Food" })
    .getByRole("button", { name: "Edit" })
    .click();
  const editCategoryDialog = page.getByRole("dialog", { name: "Edit category" });
  await expect(editCategoryDialog.getByLabel("Category name")).toHaveValue("Food");
  await editCategoryDialog.getByRole("button", { name: "Cancel" }).click();

  const tags = page
    .locator(".management-section")
    .filter({ has: page.getByRole("heading", { name: "Tags", exact: true }) });
  await tags.getByRole("button", { name: "Add tag" }).click();
  const tagDialog = page.getByRole("dialog", { name: "Add tag" });
  await expect(tagDialog.locator("form")).toBeVisible();
  await tagDialog.getByPlaceholder("Tag name").fill("Weekend");
  await tagDialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(tagDialog).toHaveCount(0);
  await tags
    .getByRole("listitem")
    .filter({ hasText: "Weekend" })
    .getByRole("button", { name: "Edit" })
    .click();
  const editTagDialog = page.getByRole("dialog", { name: "Edit tag" });
  await expect(editTagDialog.getByPlaceholder("Tag name")).toHaveValue("Weekend");
  await editTagDialog.getByRole("button", { name: "Cancel" }).click();
});
