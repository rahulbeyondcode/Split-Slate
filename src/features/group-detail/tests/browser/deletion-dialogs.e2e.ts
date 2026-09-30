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
  const foodDelete = categories
    .getByRole("listitem")
    .filter({ hasText: "Food" })
    .getByRole("button", { name: "Delete" });
  await expect(foodDelete).toHaveClass(/btn-blocked/u);
  await expect(foodDelete).toHaveAttribute("aria-describedby", "blocked-category-food");
  await foodDelete.click();
  const blocked = page.getByRole("dialog", { name: "Cannot delete Food" });
  await expect(blocked).toContainText("Reassign those expenses");
  await expect(blocked.getByRole("link", { name: "View expenses" })).toHaveAttribute(
    "href",
    "/groups/trip/expenses?categoryIds=food",
  );
  await expect(page.getByRole("dialog", { name: /Delete Food/u })).toHaveCount(0);
  await blocked.getByRole("button", { name: "Close" }).click();

  const travel = categories.getByRole("listitem").filter({ hasText: "Travel" });
  const travelDelete = travel.getByRole("button", { name: "Delete" });
  await expect(travelDelete).toHaveClass(/btn-danger/u);
  await travelDelete.click();
  const confirmation = page.getByRole("dialog", { name: "Delete Travel?" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(travel).toBeVisible();
  await travel.getByRole("button", { name: "Delete" }).click();
  await confirmation.getByRole("button", { name: "Delete category" }).click();
  await expect(travel).toHaveCount(0);
  await page.reload();
  await expect(categories.getByText("Travel", { exact: true })).toHaveCount(0);
  await foodDelete.click();
  await expect(page.getByRole("dialog", { name: "Cannot delete Food" })).toContainText(
    "Add another category and reassign those expenses",
  );
});

test("explains why the last unused category cannot be deleted", async ({ page }) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.expenses.delete("lunch");
    await db.categories.delete("travel");
  });
  await page.reload();

  const categories = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Categories" }) });
  const foodDelete = categories.getByRole("listitem").getByRole("button", { name: "Delete" });
  await expect(foodDelete).toHaveClass(/btn-blocked/u);
  await foodDelete.click();
  const blocked = page.getByRole("dialog", { name: "Cannot delete Food" });
  await expect(blocked).toContainText("Add another category before deleting this one");
  await expect(blocked.getByRole("link", { name: "View expenses" })).toHaveCount(0);
  await blocked.getByRole("button", { name: "Close" }).click();
  await expect(categories.getByText("Food", { exact: true })).toBeVisible();
});

test("confirms removing a tag from expenses without deleting them", async ({ page }) => {
  const tags = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Tags" }) });
  const summer = tags.getByRole("listitem").filter({ hasText: "Summer" });
  await expect(summer.getByRole("button", { name: "Delete" })).toHaveClass(/btn-danger/u);
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
