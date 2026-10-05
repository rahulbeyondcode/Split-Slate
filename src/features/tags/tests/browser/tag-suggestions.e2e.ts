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
    await db.categories.put({
      id: "food",
      groupId: "current",
      name: "Food",
      icon: "🍔",
      isActive: true,
    });
    await db.tags.bulkPut([
      { id: "one-fuel", groupId: "one", name: "Expense_of_fuel", color: "#123456" },
      { id: "two-fuel", groupId: "two", name: "Expense_of_fuel", color: "#123456" },
      { id: "one-trip", groupId: "one", name: "Weekend_trip", color: "#abcdef" },
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

test("copies a tag name and color with multiple group sources", async ({ page, isMobile }) => {
  const card = page
    .locator(".surface")
    .filter({ has: page.getByRole("heading", { name: "Tags", exact: true }) });
  await card.getByRole("button", { name: "Add tag" }).click();
  const form = isMobile
    ? page.getByRole("dialog", { name: "Add tag" }).locator("form")
    : card.locator("form");
  await form.getByPlaceholder("Tag name").fill("fuel");
  const suggestion = form
    .getByLabel("tag suggestions from other groups")
    .getByRole("button", { name: /Expense_of_fuel/u });
  await expect(suggestion).toContainText("First Trip");
  await expect(suggestion).toContainText("Second Trip");
  await suggestion.click();
  const saved = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return db.tags.where("groupId").equals("current").toArray();
  });
  expect(saved).toContainEqual(
    expect.objectContaining({ name: "Expense_of_fuel", color: "#123456" }),
  );
  expect(saved[0].id).not.toBe("one-fuel");
});

test("suggests a tag inside the expense-entry dialog on mobile", async ({ page, isMobile }) => {
  if (!isMobile) return;
  await page.goto("/groups/current/expenses/new");
  await page.getByRole("button", { name: "Add new tag" }).click();
  const dialog = page.getByRole("dialog", { name: "Create new tag" });
  await dialog.getByPlaceholder("e.g. Weekend").fill("week");
  await dialog
    .getByLabel("tag suggestions from other groups")
    .getByRole("button", { name: /Weekend_trip/u })
    .click();
  await expect(dialog).toHaveCount(0);
  const saved = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return db.tags.where("groupId").equals("current").toArray();
  });
  expect(saved).toContainEqual(expect.objectContaining({ name: "Weekend_trip", color: "#abcdef" }));
});

test("attaches a suggested tag from the expense-detail creator", async ({ page }) => {
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.expenses.add({
      expenseId: "expense",
      groupId: "current",
      expenseName: "Lunch",
      categoryId: "food",
      createdBy: "member",
      createdAt: Date.now(),
      when: Date.now(),
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "member", amount: 1000 }],
        owes: [{ memberId: "member", amount: 1000 }],
      },
    });
  });
  await page.goto("/groups/current/expenses/expense");
  await page.getByRole("button", { name: "Add tags" }).click();
  await page.getByRole("button", { name: "Create new tag" }).click();
  const dialog = page.getByRole("dialog", { name: "Create new tag" });
  await dialog.getByPlaceholder("e.g. Weekend").fill("week");
  await dialog
    .getByLabel("tag suggestions from other groups")
    .getByRole("button", { name: /Weekend_trip/u })
    .click();
  await expect(dialog).toHaveCount(0);
  const saved = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return {
      tags: await db.tags.where("groupId").equals("current").toArray(),
      expense: await db.expenses.get("expense"),
    };
  });
  expect(saved.tags).toContainEqual(
    expect.objectContaining({ name: "Weekend_trip", color: "#abcdef" }),
  );
  expect(saved.expense?.tagIds).toContain(saved.tags[0].id);
});
