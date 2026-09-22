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
    await page.getByRole("link", { name: `Split ${method}`, exact: true }).click();
    await page.getByRole("link", { name: "Edit expense", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Split method", exact: true })).toHaveValue(
      method,
    );
    await expect(page.getByLabel("Amy paid (INR)", { exact: true })).toHaveValue("40.00");
    await expect(page.getByLabel("Bea paid (INR)", { exact: true })).toHaveValue("60.00");
    await page.getByLabel("Expense name", { exact: true }).fill(`Edited ${method}`);
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: `Edited ${method}`, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: `Edited ${method}`, exact: true }),
    ).toBeVisible();
  });
}

test("preserves maximum shares through reload and a name-only edit", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Exact shares");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100.01");
  await page.getByRole("combobox", { name: "Split method", exact: true }).selectOption("shares");
  await page.getByLabel("Shares for Amy", { exact: true }).fill("9007199254.740991");
  await page.getByLabel("Shares for Bea", { exact: true }).fill("0.000001");
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page.getByRole("link", { name: "Exact shares", exact: true }).click();
  await page.reload();
  await expect(page.getByText("9007199254.740991 shares", { exact: true })).toBeVisible();
  const original = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.expenses.toArray())[0];
  });
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await expect(page.getByLabel("Shares for Amy", { exact: true })).toHaveValue("9007199254.740991");
  await expect(page.getByLabel("Shares for Bea", { exact: true })).toHaveValue("0.000001");
  await page.getByLabel("Expense name", { exact: true }).fill("Renamed exact shares");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Renamed exact shares", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("9007199254.740991 shares", { exact: true })).toBeVisible();
  const updated = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.expenses.toArray())[0];
  });
  expect(updated).toEqual({ ...original, expenseName: "Renamed exact shares" });
});

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

test("inspects, edits, and deletes an expense with live balance updates", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Dinner");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("300");
  await page.getByLabel("Holiday", { exact: true }).check();
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page.getByRole("link", { name: "Dinner", exact: true }).click();
  const detailUrl = page.url();
  await expect(page.getByRole("heading", { name: "Dinner", exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Tags", exact: true })).toContainText("Holiday");
  await expect(page.getByRole("region", { name: "Split breakdown", exact: true })).toContainText(
    "₹100.00",
  );
  await page.getByRole("link", { name: "Balances", exact: true }).click();
  await expect(page.getByRole("list", { name: "Member balances" })).toContainText(
    "Is owed ₹200.00",
  );
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText(
    "Bea pays Amy ₹100.00",
  );
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText(
    "Cal pays Amy ₹100.00",
  );
  await page.goto(detailUrl);
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await page.getByLabel("Expense name", { exact: true }).fill("Dinner and dessert");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("600");
  await page.getByLabel("Paid by Bea", { exact: true }).check();
  await page.getByLabel("Holiday", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dinner and dessert", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "Tags" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Paid by", exact: true })).toContainText("Bea");
  await page.getByRole("link", { name: "Balances", exact: true }).click();
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText(
    "Amy pays Bea ₹200.00",
  );
  await page.goto(detailUrl);
  await page.getByRole("button", { name: "Delete expense", exact: true }).click();
  await expect(page.getByRole("region", { name: "Confirm expense deletion" })).toContainText(
    "cannot be undone",
  );
  await page.getByRole("button", { name: "Keep expense", exact: true }).click();
  await expect(page.getByRole("button", { name: "Delete permanently", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Delete expense", exact: true }).click();
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/);
  await expect(page.getByText("No expenses have been added yet.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("No expenses have been added yet.")).toBeVisible();
  await page.getByRole("link", { name: "Balances", exact: true }).click();
  await expect(page.getByText("No payments needed.", { exact: true })).toBeVisible();
  await page.goto(detailUrl);
  await expect(page.getByRole("heading", { name: "Expense not found" })).toBeVisible();
});

test("cancels an edit and retries failed update and delete operations", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Taxi");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("60");
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page.getByRole("link", { name: "Taxi", exact: true }).click();
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await page.getByLabel("Expense name", { exact: true }).fill("Discard this edit");
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Taxi", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await page.getByLabel("Expense name", { exact: true }).fill("Updated taxi");
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.categories.update("food", { groupId: "elsewhere" });
  });
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("active category");
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Updated taxi");
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.categories.update("food", { groupId: "trip" });
  });
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Updated taxi", exact: true })).toBeVisible();
  const savedGroup = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    const group = await db.groups.get("trip");
    await db.groups.delete("trip");
    return group!;
  });
  await page.getByRole("button", { name: "Delete expense", exact: true }).click();
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Group not found");
  await page.evaluate(async (group) => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.groups.put(group);
  }, savedGroup);
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(page.getByText("No expenses have been added yet.")).toBeVisible();
});

test("keeps an inactive historical category available while editing", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Old dinner");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("90");
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.categories.update("food", { isActive: false });
  });
  await page.reload();
  await page.getByRole("link", { name: "Old dinner", exact: true }).click();
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Category", exact: true })).toHaveValue("food");
  await expect(page.getByRole("option", { name: "🍽️ Food (inactive)", exact: true })).toHaveCount(
    1,
  );
  await expect(page.getByRole("option", { name: /Old category/ })).toHaveCount(0);
  await page.getByLabel("Expense name", { exact: true }).fill("Corrected old dinner");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Corrected old dinner", exact: true }),
  ).toBeVisible();
});

test("shows solo balances and rejects missing or foreign expense routes", async ({ page }) => {
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.members.bulkDelete(["b", "c"]);
    await db.expenses.add({
      expenseId: "foreign",
      groupId: "elsewhere",
      expenseName: "Private elsewhere",
      categoryId: "food",
      createdBy: "a",
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: { paid: [], owes: [] },
    });
  });
  await page.goto("/groups/trip/balances");
  await expect(page.getByText(/This is a solo group/)).toBeVisible();
  await expect(page.getByText("No payments needed.", { exact: true })).toBeVisible();
  for (const route of ["missing", "foreign", "missing/edit", "foreign/edit"]) {
    await page.goto(`/groups/trip/expenses/${route}`);
    await expect(page.getByRole("heading", { name: "Expense not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to expenses", exact: true })).toBeVisible();
  }
});
