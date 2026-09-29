import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { Expense, OnboardingSettings } from "@/shared/types/domain.types";

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
    await db.people.bulkPut([
      { id: "self", name: "Amy", icon: "🦊" },
      { id: "bea", name: "Bea", icon: "🐻" },
      { id: "cal", name: "Cal", icon: "🐱" },
    ]);
    await db.groups.bulkPut([
      {
        id: "trip",
        name: "Weekend Trip",
        currency: "INR",
        icon: "🏕️",
        createdAt: 1,
        frequentPayerIds: [],
      },
      { id: "home", name: "Home", currency: "USD", icon: "🏠", createdAt: 2, frequentPayerIds: [] },
    ]);
    await db.members.bulkPut([
      { id: "trip-self", groupId: "trip", personId: "self" },
      { id: "trip-bea", groupId: "trip", personId: "bea" },
      { id: "home-self", groupId: "home", personId: "self" },
      { id: "home-bea", groupId: "home", personId: "bea" },
    ]);
    await db.categories.bulkPut([
      { id: "trip-food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
      { id: "home-food", groupId: "home", name: "Food", icon: "🍽️", isActive: true },
    ]);
    const expense = (
      id: string,
      groupId: string,
      creator: string,
      payer: string,
      participant: string,
    ): Expense => ({
      expenseId: id,
      groupId,
      expenseName: id,
      categoryId: `${groupId}-food`,
      createdBy: creator,
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: payer, amount: 100 }],
        owes: [{ memberId: participant, amount: 100 }],
      },
    });
    await db.expenses.bulkPut([
      expense("Trip created by Bea", "trip", "trip-bea", "trip-self", "trip-self"),
      expense("Trip other", "trip", "trip-self", "trip-self", "trip-self"),
      expense("Home split with Bea", "home", "home-self", "home-self", "home-bea"),
    ]);
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/friends");
});

test("shows per-group expense links when a contact cannot be deleted", async ({ page }) => {
  const blockedDelete = page.getByRole("button", { name: "Delete Bea" });
  await expect(blockedDelete).toHaveClass(/btn-blocked/u);
  await expect(blockedDelete).toBeEnabled();
  await expect(page.getByRole("button", { name: "Delete Cal" })).toHaveClass(/btn-danger/u);
  await blockedDelete.click();

  const explanation = page.getByRole("dialog", { name: "Cannot delete Bea" });
  await expect(explanation).toBeVisible();
  await expect(explanation.getByRole("link")).toHaveCount(2);
  await explanation.getByRole("link", { name: /Weekend Trip/u }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses\?memberIds=trip-bea$/u);
  await expect(page.getByRole("status")).toHaveText("1 of 2 expenses");
  await expect(
    page.getByRole("list", { name: "Expenses" }).getByText("Trip created by Bea"),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "Expenses" }).getByText("Trip other")).toHaveCount(0);

  await page.goto("/friends");
  await page.getByRole("button", { name: "Delete Bea" }).click();
  await page
    .getByRole("dialog", { name: "Cannot delete Bea" })
    .getByRole("link", { name: /Home/u })
    .click();
  await expect(page).toHaveURL(/\/groups\/home\/expenses\?memberIds=home-bea$/u);
  await expect(page.getByRole("status")).toHaveText("1 of 1 expenses");
  await expect(
    page.getByRole("list", { name: "Expenses" }).getByText("Home split with Bea"),
  ).toBeVisible();
});

test("confirms eligible contact deletion in an app dialog", async ({ page }) => {
  const deleteCal = page.getByRole("button", { name: "Delete Cal" });
  await deleteCal.click();
  const confirmation = page.getByRole("dialog", { name: "Delete Cal?" });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText("any groups they belong to");
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(confirmation).not.toBeVisible();
  await expect(deleteCal).toBeVisible();

  await deleteCal.click();
  await page.keyboard.press("Escape");
  await expect(confirmation).not.toBeVisible();
  await deleteCal.click();
  await confirmation.getByRole("button", { name: "Delete contact" }).click();
  await expect(deleteCal).toHaveCount(0);
  await page.reload();
  await expect(deleteCal).toHaveCount(0);
});
