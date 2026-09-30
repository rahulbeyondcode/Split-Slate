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
  await page.getByRole("link", { name: "Add expense", exact: true }).first().click();
  const hour = page.getByRole("textbox", { name: "Hour" });
  const minute = page.getByRole("textbox", { name: "Minute" });
  await expect(hour).toBeEmpty();
  await expect(hour).toHaveAttribute("placeholder", "hh");
  await expect(minute).toBeEmpty();
  await expect(minute).toHaveAttribute("placeholder", "mm");
  await expect(page.getByLabel("Date", { exact: true })).not.toBeEmpty();
  await hour.fill("12");
  await minute.fill("00");
});

test("fills the current clock time without changing the selected expense date", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-09-19T13:07:00.000Z"));
  const date = page.getByLabel("Date", { exact: true });
  await date.fill("2026-09-18");

  await page.getByRole("button", { name: "Use current time" }).click();
  await expect(date).toHaveValue("2026-09-18");
  await expect(page.getByRole("textbox", { name: "Hour" })).toHaveValue("06");
  await expect(page.getByRole("textbox", { name: "Minute" })).toHaveValue("37");
  await expect(page.getByRole("button", { name: "PM", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("textbox", { name: "Hour" }).fill("09");
  await page.getByRole("textbox", { name: "Minute" }).fill("15");
  await page.getByRole("button", { name: "AM", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Hour" })).toHaveValue("09");
  await expect(page.getByRole("textbox", { name: "Minute" })).toHaveValue("15");
  await expect(date).toHaveValue("2026-09-18");
});

test("records an equal expense, updates balances, and survives reload", async ({ page }) => {
  const tag = page.getByLabel("Holiday", { exact: true });
  await expect(tag).toHaveClass(/choice-control/u);
  await expect(page.getByLabel("One person", { exact: true })).toBeChecked();
  await expect(page.getByLabel("One person", { exact: true })).toHaveClass(/choice-control/u);
  await expect(page.getByLabel("Paid by Amy", { exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Food/u })).toBeChecked();
  await page.getByLabel("Expense name", { exact: true }).fill(" Dinner ");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page.getByLabel("Date", { exact: true }).fill("2026-09-19");
  await page.getByRole("textbox", { name: "Hour" }).fill("6");
  await page.getByRole("textbox", { name: "Minute" }).fill("30");
  await page.getByRole("button", { name: "PM", exact: true }).click();
  await tag.check();
  await expect(tag).toBeChecked();
  await expect(page.getByRole("option", { name: "Old category" })).toHaveCount(0);
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/);
  await expect(page.getByText("Dinner", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByText("₹100.00", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Expenses" }).getByRole("link", { name: /Dinner/ }),
  ).toContainText(/19 Sept?, 6:30 pm/i);
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
  expect(new Date(stored[0].when).getHours()).toBe(18);
  expect(new Date(stored[0].when).getMinutes()).toBe(30);
  await page.goto("/groups/trip");
  await expect(page.getByRole("main").getByText("+₹66.66", { exact: true })).toBeVisible();
});

test("adds a category without losing the unfinished expense", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Coffee with Bea");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("42");
  await page.getByRole("button", { name: "Add new category" }).click();
  const dialog = page.getByRole("dialog", { name: "Add category" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Coffee with Bea");

  await page.getByRole("button", { name: "Add new category" }).click();
  await dialog.getByRole("textbox", { name: "Category name" }).fill(" food ");
  await dialog.getByRole("button", { name: "Add category" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Category already exists");
  await dialog.getByRole("textbox", { name: "Category name" }).fill("Coffee runs");
  await dialog.getByRole("button", { name: "Add category" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Coffee runs" })).toBeChecked();
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Coffee with Bea");
  await expect(page.getByLabel("Amount (INR)", { exact: true })).toHaveValue("42");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
  const stored = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    const category = (await db.categories.toArray()).find((item) => item.name === "Coffee runs");
    const expense = (await db.expenses.toArray())[0];
    return { category, categoryId: expense?.categoryId };
  });
  expect(stored.category?.groupId).toBe("trip");
  expect(stored.categoryId).toBe(stored.category?.id);
});

test("can create the first active category from the expense form", async ({ page }) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { isActive: false });
  });
  await page.reload();
  await expect(page.getByText("No active categories yet. Add one to continue.")).toBeVisible();
  await page.getByLabel("Expense name", { exact: true }).fill("Bus tickets");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("25");
  await page.getByRole("textbox", { name: "Hour" }).fill("12");
  await page.getByRole("textbox", { name: "Minute" }).fill("00");
  await page.getByRole("button", { name: "Add new category" }).click();
  const dialog = page.getByRole("dialog", { name: "Add category" });
  await dialog.getByRole("textbox", { name: "Category name" }).fill("Transport");
  await dialog.getByRole("button", { name: "Add category" }).click();
  await expect(page.getByRole("radio", { name: "Transport" })).toBeChecked();
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Bus tickets");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
  await expect(page.getByText("Bus tickets", { exact: true })).toBeVisible();
});

test("edits the time across noon and midnight with 12-hour controls", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Late snack");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("20");
  await page.getByLabel("Date", { exact: true }).fill("2026-09-19");
  await page.getByRole("textbox", { name: "Hour" }).fill("12");
  await page.getByRole("textbox", { name: "Minute" }).fill("05");
  await page.getByRole("button", { name: "AM", exact: true }).click();
  await page.getByRole("button", { name: "Save expense" }).click();
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /Late snack/ })
    .click();
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Hour" })).toHaveValue("12");
  await expect(page.getByRole("textbox", { name: "Minute" })).toHaveValue("05");
  await expect(page.getByRole("button", { name: "AM", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "PM", exact: true }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.reload();
  const when = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.expenses.toArray())[0].when;
  });
  expect(new Date(when).getHours()).toBe(12);
  expect(new Date(when).getMinutes()).toBe(5);
});

test("requires a complete time before saving", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Breakfast");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("20");
  await page.getByRole("textbox", { name: "Hour" }).fill("");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByRole("alert")).toContainText("Enter a valid local date and time");
  await page.getByRole("textbox", { name: "Hour" }).fill("7");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/);
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
    await expect(page.getByText(`Amy, Bea paid · ${method}`, { exact: true })).toBeVisible();
    await page
      .getByRole("list", { name: "Expenses" })
      .getByRole("link", { name: new RegExp(`^Split ${method} `, "u") })
      .click();
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
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /^Exact shares /u })
    .click();
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
  await expect(page.getByRole("heading", { name: "No expenses yet" })).toBeVisible();
});

test("inspects, edits, and deletes an expense with live balance updates", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Dinner");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("300");
  await page.getByLabel("Holiday", { exact: true }).check();
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /^Dinner /u })
    .click();
  const detailUrl = page.url();
  await expect(page.getByRole("heading", { name: "Dinner", exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Tags", exact: true })).toContainText("Holiday");
  await expect(page.getByRole("region", { name: "Split breakdown", exact: true })).toContainText(
    "₹100.00",
  );
  await page.goto("/groups/trip/balances");
  await expect(page.getByRole("list", { name: "Member balances" })).toContainText("+₹200.00");
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText(
    "Bea → Amy₹100.00",
  );
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText(
    "Cal → Amy₹100.00",
  );
  await page.goto(detailUrl);
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await page.getByLabel("Expense name", { exact: true }).fill("Dinner and dessert");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("600");
  await page.getByRole("radio", { name: "Paid by Bea" }).locator("..").click();
  await page.getByLabel("Holiday", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dinner and dessert", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "Tags" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Paid by", exact: true })).toContainText("Bea");
  await page.goto("/groups/trip/balances");
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText(
    "Amy → Bea₹200.00",
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
  await expect(page.getByRole("heading", { name: "No expenses yet" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "No expenses yet" })).toBeVisible();
  await page.goto("/groups/trip/balances");
  await expect(page.getByRole("heading", { name: "All square!" })).toBeVisible();
  await page.goto(detailUrl);
  await expect(page.getByRole("heading", { name: "Expense not found" })).toBeVisible();
});

test("cancels an edit and retries failed update and delete operations", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Taxi");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("60");
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /^Taxi /u })
    .click();
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
  await expect(page.getByRole("heading", { name: "No expenses yet" })).toBeVisible();
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
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /^Old dinner /u })
    .click();
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Food (inactive)" })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Old category/u })).toHaveCount(0);
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
  await expect(page.getByText("Solo spending has no one to repay.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "All square!" })).toBeVisible();
  for (const route of ["missing", "foreign", "missing/edit", "foreign/edit"]) {
    await page.goto(`/groups/trip/expenses/${route}`);
    await expect(page.getByRole("heading", { name: "Expense not found" })).toBeVisible();
    await expect(page.getByText("Back to expenses", { exact: true })).toBeVisible();
  }
});
