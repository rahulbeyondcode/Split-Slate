import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

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
    await db.localUser.put({ id: "self", name: "Amy", icon: "🦊" });
    await db.people.put({ id: "self", name: "Amy", icon: "🦊" });
    await db.groups.bulkPut([
      {
        id: "one",
        name: "First Trip",
        icon: "✦",
        currency: "INR",
        createdAt: 1,
        frequentPayerIds: [],
      },
      {
        id: "two",
        name: "Second Trip",
        icon: "✦",
        currency: "INR",
        createdAt: 2,
        frequentPayerIds: [],
      },
      {
        id: "current",
        name: "Current Trip",
        icon: "✦",
        currency: "INR",
        createdAt: 3,
        frequentPayerIds: ["member"],
      },
    ]);
    await db.members.put({ id: "member", groupId: "current", personId: "self" });
    await db.categories.bulkPut([
      { id: "first-fuel", groupId: "one", name: "Expense_of_fuel", icon: "⛽", isActive: true },
      { id: "second-fuel", groupId: "two", name: "Expense_of_fuel", icon: "⛽", isActive: true },
      { id: "petrol", groupId: "one", name: "Petrol Expense", icon: "🚙", isActive: true },
      { id: "current-food", groupId: "current", name: "Food", icon: "🍔", isActive: true },
    ]);
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "current",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/current/categories");
});

test("copies a first-letter match and keeps category records group-scoped", async ({ page }) => {
  const card = page
    .locator(".management-section")
    .filter({ has: page.getByRole("heading", { name: "Categories", exact: true }) });
  await card.getByRole("button", { name: "Add category" }).click();
  const form = page.getByRole("dialog", { name: "Add category" }).locator("form");
  await form.getByLabel("Category name").fill("f");
  const suggestion = form
    .getByLabel("category suggestions from other groups")
    .getByRole("button", { name: /Expense_of_fuel/u });
  await expect(suggestion).toContainText("First Trip");
  await expect(suggestion).toContainText("Second Trip");
  await suggestion.click();
  await expect(card.getByRole("listitem").filter({ hasText: "Expense_of_fuel" })).toBeVisible();
  const saved = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return db.categories.where("groupId").equals("current").toArray();
  });
  expect(saved).toContainEqual(expect.objectContaining({ name: "Expense_of_fuel", icon: "⛽" }));
  expect(saved.find((item) => item.name === "Expense_of_fuel")?.id).not.toBe("first-fuel");
  await page.reload();
  await expect(card.getByRole("listitem").filter({ hasText: "Expense_of_fuel" })).toBeVisible();
});

test("suggests existing spelling in the expense creator instead of saving the typed variant", async ({
  page,
}) => {
  await page.goto("/groups/current/expenses/new");
  await page.getByRole("button", { name: "Add new category" }).click();
  const dialog = page.getByRole("dialog", { name: "Add category" });
  await dialog.getByLabel("Category name").fill("petrol_expense");
  await dialog
    .getByLabel("category suggestions from other groups")
    .getByRole("button", { name: /Petrol Expense/u })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Petrol Expense", { exact: true })).toBeVisible();
  const saved = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return db.categories.where("groupId").equals("current").toArray();
  });
  expect(saved).toContainEqual(expect.objectContaining({ name: "Petrol Expense", icon: "🚙" }));
});

test("selecting a suggestion in a new group writes nothing until the final submit", async ({
  page,
}) => {
  await page.goto("/groups/new");
  await page.getByPlaceholder("e.g. Goa Trip, Flatmates, Family").fill("New Group");
  await page.getByRole("button", { name: "Save and Proceed" }).click();
  await page.getByRole("button", { name: "Save and Proceed" }).click();
  await page.getByRole("button", { name: "Add new category" }).click();
  await page.getByLabel("Category name").fill("fuel");
  await page
    .getByLabel("category suggestions from other groups")
    .getByRole("button", { name: /Expense_of_fuel/u })
    .click();
  await expect(page.getByRole("button", { name: /Expense_of_fuel/u })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const before = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return db.categories.count();
  });
  expect(before).toBe(4);
  await page.getByRole("button", { name: "Save and Proceed" }).click();
  await page.getByRole("button", { name: "Create group" }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
  const created = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    const group = (await db.groups.toArray()).find((item) => item.name === "New Group");
    return group ? db.categories.where("groupId").equals(group.id).toArray() : [];
  });
  expect(created).toContainEqual(expect.objectContaining({ name: "Expense_of_fuel", icon: "⛽" }));
});

test("onboarding keeps a suggested category in the draft until Save and Proceed", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: false,
      lastCompletedStep: "currency",
      groupId: "current",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/onboarding/setup");
  await page.getByRole("button", { name: "Add new category" }).click();
  await page.getByLabel("Category name").fill("fuel");
  await page
    .getByLabel("category suggestions from other groups")
    .getByRole("button", { name: /Expense_of_fuel/u })
    .click();
  await expect(page.getByRole("button", { name: /Expense_of_fuel/u })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const before = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return db.categories.where("groupId").equals("current").toArray();
  });
  expect(before.map((item) => item.name)).not.toContain("Expense_of_fuel");
  await page.getByRole("button", { name: "Save and Proceed" }).click();
  const after = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return db.categories.where("groupId").equals("current").toArray();
  });
  expect(after).toContainEqual(expect.objectContaining({ name: "Expense_of_fuel", icon: "⛽" }));
});
