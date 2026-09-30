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
    await db.groups.bulkPut([
      {
        id: "first",
        name: "First Trip",
        icon: "🏕️",
        currency: "INR",
        createdAt: 1,
        frequentPayerIds: [],
      },
      {
        id: "second",
        name: "Second Trip",
        icon: "🏖️",
        currency: "INR",
        createdAt: 2,
        frequentPayerIds: [],
      },
    ]);
    await db.members.bulkPut([
      { id: "first-member", groupId: "first", personId: "self" },
      { id: "second-member", groupId: "second", personId: "self" },
    ]);
    await db.categories.bulkPut([
      { id: "first-category", groupId: "first", name: "Food", icon: "🍽️", isActive: true },
      { id: "second-category", groupId: "second", name: "Travel", icon: "🚕", isActive: true },
    ]);
    await db.expenses.bulkPut([
      {
        expenseId: "first-old",
        groupId: "first",
        expenseName: "Earlier recording",
        categoryId: "first-category",
        createdBy: "first-member",
        createdAt: Date.UTC(2026, 8, 10, 12),
        when: Date.UTC(2026, 8, 29, 12),
        splitType: "equal",
        splitMeta: [],
        tagIds: [],
        attachmentIds: [],
        transactions: {
          paid: [{ memberId: "first-member", amount: 1000 }],
          owes: [{ memberId: "first-member", amount: 1000 }],
        },
      },
      {
        expenseId: "second-new",
        groupId: "second",
        expenseName: "Later recording",
        categoryId: "second-category",
        createdBy: "second-member",
        createdAt: Date.UTC(2026, 8, 20, 12),
        when: Date.UTC(2026, 8, 1, 12),
        splitType: "equal",
        splitMeta: [],
        tagIds: [],
        attachmentIds: [],
        transactions: {
          paid: [{ memberId: "second-member", amount: 2000 }],
          owes: [{ memberId: "second-member", amount: 2000 }],
        },
      },
    ]);
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "first",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/dashboard");
});

test("shows activity on dashboard and group overview, but not group expenses", async ({ page }) => {
  if ((page.viewportSize()?.width ?? 0) < 1080) {
    await page.goto("/activity");
    const feed = page.locator("main").getByRole("link", { name: /recording/u });
    await expect(feed).toHaveCount(2);
    await expect(feed.nth(0)).toContainText("Later recording");
    await expect(feed.nth(1)).toContainText("Earlier recording");
    return;
  }

  const panel = page.getByRole("complementary", { name: "Recent activity" });
  const entries = panel.locator(".activity-entry");
  await expect(entries).toHaveCount(2);
  await expect(entries.nth(0)).toContainText("Later recording");
  await expect(entries.nth(0)).toContainText("Second Trip");
  await expect(entries.nth(1)).toContainText("Earlier recording");
  const recordedAt = await page.evaluate(() => {
    const date = new Date(Date.UTC(2026, 8, 20, 12));
    const hour = date.getHours();
    return `${String(date.getDate()).padStart(2, "0")}-Sep-${date.getFullYear()} · ${String(hour % 12 || 12).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
  });
  await expect(entries.nth(0).locator(".activity-entry-meta")).toContainText(recordedAt);

  await page.goto("/groups/first");
  await expect(entries).toHaveCount(1);
  await expect(entries.first()).toContainText("Earlier recording");
  await expect(panel).not.toContainText("Later recording");

  await page.goto("/groups/second/expenses");
  await expect(panel).toHaveCount(0);
});

test("shows more activity text with group and date on separate lines, without a tooltip", async ({
  page,
}) => {
  if ((page.viewportSize()?.width ?? 0) < 1080) return;
  const longGroup = "Second Trip with an exceptionally long name for everyone traveling together";
  const longExpense = "Later recording with an especially long dinner and transport description";
  await page.evaluate(
    async ({ groupName, expenseName }) => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      await db.groups.update("second", { name: groupName });
      await db.expenses.update("second-new", { expenseName });
    },
    { groupName: longGroup, expenseName: longExpense },
  );
  await page.reload();

  const row = page
    .getByRole("complementary", { name: "Recent activity" })
    .locator(".activity-entry")
    .first();
  await expect(row.locator(".activity-entry-group")).toContainText(longGroup);
  await expect(row.locator(".activity-entry-date")).toContainText("20-Sep-2026");
  await expect(row.locator(".activity-entry-title")).toContainText(longExpense);
  await expect(row).not.toHaveAttribute("title", /.+/u);
  await row.hover();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await row.focus();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
