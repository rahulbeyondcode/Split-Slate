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
      { id: "inactive", groupId: "trip", name: "Old category", icon: "📦", isActive: false },
    ]);
    await db.tags.put({ id: "holiday", groupId: "trip", name: "Holiday", color: "#123456" });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip");
  await page.getByRole("link", { name: "Add expense", exact: true }).click();
});

test("records an equal expense, updates balances, and survives reload", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill(" Dinner ");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page.getByLabel("Date and time", { exact: true }).fill("2026-09-19T18:30");
  await page.getByLabel("Holiday", { exact: true }).check();
  await expect(page.getByRole("option", { name: "📦 Old category" })).toHaveCount(0);
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/);
  await expect(page.getByText("Dinner", { exact: true })).toBeVisible();
  await expect(page.getByText("₹100.00", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Dinner", { exact: true })).toBeVisible();
  const stored = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return db.expenses.toArray();
  });
  expect(stored).toHaveLength(1);
  expect(stored[0].transactions.owes.map((row) => row.amount)).toEqual([3334, 3333, 3333]);
  expect(stored[0].tagIds).toEqual(["holiday"]);
  await page.goto("/groups/trip");
  await expect(page.getByRole("main").getByText("+₹66.66", { exact: true })).toBeVisible();
});

for (const method of ["amount", "shares", "percentage", "adjustment"] as const) {
  test(`records a ${method} split with multiple payers`, async ({ page }) => {
    await page.getByLabel("Expense name", { exact: true }).fill(`Split ${method}`);
    await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
    await page.getByLabel("Multiple payers", { exact: true }).check();
    await page.getByLabel("Amy paid (INR)", { exact: true }).fill("40");
    await page.getByLabel("Bea paid (INR)", { exact: true }).fill("60");
    await page.getByRole("combobox", { name: "Split method", exact: true }).selectOption(method);
    if (method === "amount")
      await page.getByLabel("Amount owed for Amy", { exact: true }).fill("20");
    if (method === "shares") await page.getByLabel("Shares for Cal", { exact: true }).fill("2");
    if (method === "percentage") {
      await page.getByLabel("Percentage for Amy", { exact: true }).fill("20");
      await page.getByLabel("Percentage for Bea", { exact: true }).fill("30");
      await page.getByLabel("Percentage for Cal", { exact: true }).fill("50");
    }
    if (method === "adjustment")
      await page.getByLabel("Adjustment for Amy", { exact: true }).fill("-10");
    await page.getByRole("button", { name: "Save expense" }).click();
    await expect(page).toHaveURL(/\/expenses$/);
    await expect(page.getByText(`Split ${method}`, { exact: true })).toBeVisible();
    await expect(page.getByText(/Paid by Amy, Bea/)).toBeVisible();
  });
}

test("blocks invalid totals, preserves form data after save rejection, and allows retry", async ({
  page,
}) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Taxi");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page.getByLabel("Multiple payers", { exact: true }).check();
  await page.getByLabel("Amy paid (INR)", { exact: true }).fill("99");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByRole("alert")).toContainText("Payer amounts must add up");
  await page.getByLabel("Amy paid (INR)", { exact: true }).fill("100");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { isActive: false });
  });
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByRole("alert")).toContainText("active category");
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Taxi");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { isActive: true });
  });
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/expenses$/);
});

test("cancels without recording anything", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Discard me");
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("No expenses have been added yet.")).toBeVisible();
});
