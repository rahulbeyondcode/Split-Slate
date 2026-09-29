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
    await db.categories.bulkPut([
      { id: "food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
      { id: "travel", groupId: "trip", name: "Travel", icon: "✈️", isActive: true },
    ]);
    await db.tags.put({ id: "summer", groupId: "trip", name: "Summer", color: "#6366f1" });
    await db.expenses.put({
      expenseId: "lunch",
      groupId: "trip",
      expenseName: "Lunch",
      categoryId: "food",
      createdBy: "a",
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      tagIds: ["summer"],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "a", amount: 100 }],
        owes: [{ memberId: "a", amount: 100 }],
      },
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

test("guards referenced categories and confirms deletion of unused categories", async ({
  page,
}) => {
  const categories = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Categories" }) });
  await categories
    .getByRole("listitem")
    .filter({ hasText: "Food" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(categories.getByRole("alert")).toContainText("Reassign those expenses");
  await expect(page.getByRole("dialog", { name: /Delete Food/u })).toHaveCount(0);

  const travel = categories.getByRole("listitem").filter({ hasText: "Travel" });
  await travel.getByRole("button", { name: "Delete" }).click();
  const confirmation = page.getByRole("dialog", { name: "Delete Travel?" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(travel).toBeVisible();
  await travel.getByRole("button", { name: "Delete" }).click();
  await confirmation.getByRole("button", { name: "Delete category" }).click();
  await expect(travel).toHaveCount(0);
  await page.reload();
  await expect(categories.getByText("Travel", { exact: true })).toHaveCount(0);
});

test("confirms removing a tag from expenses without deleting them", async ({ page }) => {
  const tags = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Tags" }) });
  const summer = tags.getByRole("listitem").filter({ hasText: "Summer" });
  await summer.getByRole("button", { name: "Delete" }).click();
  const confirmation = page.getByRole("dialog", { name: "Delete Summer?" });
  await expect(confirmation).toContainText("removed from 1 expense");
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(summer).toBeVisible();
  await summer.getByRole("button", { name: "Delete" }).click();
  await confirmation.getByRole("button", { name: "Delete tag" }).click();
  await expect(summer).toHaveCount(0);
  await page.goto("/groups/trip/expenses/lunch");
  await expect(page.getByRole("heading", { name: "Lunch" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Tags" })).toHaveCount(0);
});
