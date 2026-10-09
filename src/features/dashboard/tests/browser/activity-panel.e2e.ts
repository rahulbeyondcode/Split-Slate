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

test("shows group activity on desktop group screens except settings", async ({ page }) => {
  if ((page.viewportSize()?.width ?? 0) < 1080) {
    await page.goto("/activity");
    const feed = page.locator("main").getByRole("link", { name: /recording/u });
    await expect(feed).toHaveCount(2);
    await expect(feed.nth(0)).toContainText("Later recording");
    await expect(feed.nth(1)).toContainText("Earlier recording");
    await expect(feed.nth(0).locator("img")).toHaveAttribute(
      "src",
      /\/travel-and-places\/auto-rickshaw-3d\.png$/u,
    );
    await expect(feed.nth(1).locator("img")).toHaveAttribute(
      "src",
      /\/food-and-drinks\/fork-and-knife-with-plate-3d\.png$/u,
    );
    await page.goto("/groups/second/expenses");
    await expect(page.getByRole("complementary", { name: "Recent activity" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Group settings", exact: true })).toHaveCount(0);
    for (const route of ["/analytics", "/unsettled"]) {
      await page.goto(route);
      await expect(page.getByRole("complementary", { name: "Recent activity" })).toHaveCount(0);
    }
    return;
  }

  const panel = page.getByRole("complementary", { name: "Recent activity" });
  const entries = panel.locator(".activity-entry");
  await expect(entries).toHaveCount(2);
  await expect(entries.nth(0)).toContainText("Later recording");
  await expect(entries.nth(0)).toContainText("Second Trip");
  await expect(entries.nth(1)).toContainText("Earlier recording");
  await expect(entries.nth(0).locator("img")).toHaveAttribute(
    "src",
    /\/travel-and-places\/auto-rickshaw-3d\.png$/u,
  );
  await expect(entries.nth(1).locator("img")).toHaveAttribute(
    "src",
    /\/food-and-drinks\/fork-and-knife-with-plate-3d\.png$/u,
  );
  for (const route of ["/analytics", "/unsettled"]) {
    await page.goto(route);
    await expect(entries, `App activity is visible on ${route}`).toHaveCount(2);
  }
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
  await expect(entries).toHaveCount(1);
  await expect(entries.first()).toContainText("Later recording");
  await expect(panel).not.toContainText("Earlier recording");
  await expect(page.getByRole("link", { name: "Group settings", exact: true })).toHaveCount(0);

  for (const route of [
    "/groups/second/balances",
    "/groups/second/members",
    "/groups/second/categories",
    "/groups/second/expenses/second-new",
    "/groups/second/expenses/second-new/edit",
    "/groups/second/expenses/new",
  ]) {
    await page.goto(route);
    await expect(entries, `Activity is visible on ${route}`).toHaveCount(1);
  }

  await page.goto("/groups/second/settings");
  await expect(panel).toHaveCount(0);

  await page.goto("/groups/new");
  await expect(page.getByRole("complementary", { name: "Group preview" })).toBeVisible();
  await page.setViewportSize({ width: 900, height: 800 });
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
