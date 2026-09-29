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
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      currency: "INR",
      icon: "🏕️",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "b", groupId: "trip", personId: "bea" },
      { id: "c", groupId: "trip", personId: "cal" },
    ]);
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "🍽️",
      isActive: true,
    });
    const expense = (id: string, creator: string, payer: string, participant: string): Expense => ({
      expenseId: id,
      groupId: "trip",
      expenseName: id,
      categoryId: "food",
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
      expense("Bea created", "b", "a", "a"),
      expense("Bea paid", "a", "b", "a"),
      expense("Bea owes", "a", "a", "b"),
      expense("Amy only", "a", "a", "a"),
    ]);
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip/members");
});

test("explains blocked removal and links to every expense referencing the member", async ({
  page,
}) => {
  await expect(page.getByRole("button", { name: "Add member" })).toBeVisible();
  const blockedDelete = page.getByRole("button", { name: "Delete Bea" });
  await expect(blockedDelete).toHaveClass(/btn-blocked/u);
  await expect(blockedDelete).toBeEnabled();
  await expect(page.getByRole("button", { name: "Delete Cal" })).toHaveClass(/btn-danger/u);
  await blockedDelete.click();
  const explanation = page.getByRole("dialog", { name: "Cannot remove Bea" });
  await expect(explanation).toBeVisible();
  await expect(explanation).toContainText("3 group expenses");
  await explanation.getByRole("link", { name: "View Bea's expenses" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses\?memberIds=b$/u);
  await expect(page.getByRole("status")).toHaveText("3 of 4 expenses");
  const expenses = page.getByRole("list", { name: "Expenses" });
  await expect(expenses.getByText("Bea created")).toBeVisible();
  await expect(expenses.getByText("Bea paid")).toBeVisible();
  await expect(expenses.getByText("Bea owes")).toBeVisible();
  await expect(expenses.getByText("Amy only")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("3 of 4 expenses");
});

test("confirms eligible member removal without deleting the contact", async ({ page }) => {
  const deleteCal = page.getByRole("button", { name: "Delete Cal" });
  await deleteCal.click();
  const confirmation = page.getByRole("dialog", { name: "Remove Cal?" });
  await expect(confirmation).toContainText("remain in your contacts");
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(deleteCal).toBeVisible();
  await deleteCal.click();
  await confirmation.getByRole("button", { name: "Remove member" }).click();
  await expect(deleteCal).toHaveCount(0);
  await page.goto("/friends");
  await expect(page.getByText("Cal", { exact: true })).toBeVisible();
});
