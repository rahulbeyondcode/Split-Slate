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
      { id: "friend", name: "Bea", icon: "🐻" },
      { id: "third", name: "Cal", icon: "🐱" },
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
      { id: "b", groupId: "trip", personId: "friend" },
      { id: "c", groupId: "trip", personId: "third" },
    ]);
    await db.categories.bulkPut([
      { id: "food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
      { id: "travel", groupId: "trip", name: "Travel", icon: "🚕", isActive: true },
    ]);
    await db.tags.bulkPut([
      { id: "holiday", groupId: "trip", name: "Holiday", color: "#123456" },
      { id: "work", groupId: "trip", name: "Work", color: "#654321" },
    ]);
    const expenses: Expense[] = [
      {
        expenseId: "dinner",
        groupId: "trip",
        expenseName: "Dinner",
        categoryId: "food",
        createdBy: "a",
        createdAt: 1,
        when: new Date("2026-09-20T12:00:00+05:30").getTime(),
        splitType: "equal",
        splitMeta: [],
        tagIds: ["holiday"],
        attachmentIds: [],
        transactions: {
          paid: [{ memberId: "a", amount: 10001 }],
          owes: [
            { memberId: "a", amount: 3335 },
            { memberId: "b", amount: 3333 },
            { memberId: "c", amount: 3333 },
          ],
        },
      },
      {
        expenseId: "taxi",
        groupId: "trip",
        expenseName: "Airport taxi",
        categoryId: "travel",
        createdBy: "b",
        createdAt: 2,
        when: new Date("2026-09-21T12:00:00+05:30").getTime(),
        splitType: "amount",
        splitMeta: [],
        tagIds: ["work"],
        attachmentIds: [],
        transactions: {
          paid: [{ memberId: "b", amount: 5000 }],
          owes: [
            { memberId: "a", amount: 2500 },
            { memberId: "b", amount: 2500 },
          ],
        },
      },
      {
        expenseId: "hotel",
        groupId: "trip",
        expenseName: "Hotel",
        categoryId: "travel",
        createdBy: "a",
        createdAt: 3,
        when: new Date("2026-09-22T12:00:00+05:30").getTime(),
        splitType: "shares",
        splitMeta: [
          { memberId: "a", value: "1" },
          { memberId: "b", value: "1" },
        ],
        tagIds: [],
        attachmentIds: [],
        transactions: {
          paid: [
            { memberId: "a", amount: 10000 },
            { memberId: "b", amount: 10000 },
          ],
          owes: [
            { memberId: "a", amount: 10000 },
            { memberId: "b", amount: 10000 },
          ],
        },
      },
    ];
    await db.expenses.bulkPut(expenses);
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip/expenses");
});

test("filters expenses through every field, validates ranges, and clears all controls", async ({
  page,
}) => {
  await expect(page.getByRole("status")).toHaveText("3 of 3 expenses");
  await page.getByLabel("Search expenses", { exact: true }).fill(" dinner ");
  await page.getByText("More filters", { exact: true }).click();
  await page.getByLabel("From date", { exact: true }).fill("2026-09-20");
  await page.getByLabel("To date", { exact: true }).fill("2026-09-20");
  await page.getByLabel("Minimum amount (INR)", { exact: true }).fill("100.01");
  await page.getByLabel("Maximum amount (INR)", { exact: true }).fill("100.01");
  await page.getByRole("group", { name: "Categories" }).getByLabel("Food").check();
  await page.getByRole("group", { name: "Tags" }).getByLabel("Holiday").check();
  await page.getByRole("group", { name: "Paid by" }).getByLabel("Amy").check();
  await page.getByRole("group", { name: "Member involved" }).getByLabel("Cal").check();
  await page.getByRole("group", { name: "Split types" }).getByLabel("Equal").check();

  await expect(page.getByText("8 active filters", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");
  await expect(page.getByRole("link", { name: "Dinner", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Airport taxi", exact: true })).toHaveCount(0);

  await page.getByLabel("To date", { exact: true }).fill("2026-09-19");
  await expect(
    page.getByText("End date must be on or after start date", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    "Correct the highlighted filters to see results.",
  );

  await page.getByRole("button", { name: "Clear all filters", exact: true }).click();
  await expect(page.getByText("0 active filters", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("3 of 3 expenses");
  await expect(page.getByLabel("Search expenses", { exact: true })).toHaveValue("");
});

test("preserves filters across group routes and removes a deleted selected option", async ({
  page,
}) => {
  await page.getByText("More filters", { exact: true }).click();
  await page.getByRole("group", { name: "Tags" }).getByLabel("Holiday").check();
  await expect(page.getByText("1 active filter", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");

  await page.getByRole("link", { name: "Dinner", exact: true }).click();
  await page.getByRole("link", { name: "Back to expenses", exact: true }).click();
  await expect(page.getByText("1 active filter", { exact: true })).toBeVisible();
  await page.getByText("More filters", { exact: true }).click();
  await expect(page.getByRole("group", { name: "Tags" }).getByLabel("Holiday")).toBeChecked();

  await page.getByRole("link", { name: "Dinner", exact: true }).click();
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    await useStore.getState().removeTag("holiday");
  });
  await page.getByRole("link", { name: "Back to expenses", exact: true }).click();

  await expect(page.getByText("0 active filters", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("3 of 3 expenses");
  await page.getByText("More filters", { exact: true }).click();
  await expect(page.getByRole("group", { name: "Tags" }).getByLabel("Holiday")).toHaveCount(0);
});
