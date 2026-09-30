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
      icon: "🏕️",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.put({ id: "a", groupId: "trip", personId: "self" });
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "🍽️",
      isActive: true,
    });
    await db.expenses.bulkPut(
      Array.from({ length: 5 }, (_, index) => ({
        expenseId: `expense-${index + 1}`,
        groupId: "trip",
        expenseName: `Expense ${index + 1}`,
        createdBy: "a",
        categoryId: "food",
        tagIds: [],
        attachmentIds: [],
        createdAt: index + 1,
        when: new Date(2026, 8, index + 1).getTime(),
        splitType: "equal" as const,
        splitMeta: [],
        transactions: {
          paid: [{ memberId: "a", amount: (index + 1) * 1000 }],
          owes: [{ memberId: "a", amount: (index + 1) * 1000 }],
        },
      })),
    );
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip");
});

test("distinguishes the snapshot from the complete expense history", async ({ page }) => {
  const navigation = page
    .getByRole("navigation", { name: "Group navigation" })
    .or(page.getByRole("navigation", { name: "Bottom navigation" }));
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    await expect(sidebar.getByRole("link", { name: "All groups" })).toBeVisible();
    await expect(sidebar.getByText("Weekend Trip")).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "New group" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: /Weekend Trip/u })).toHaveCount(0);
  }
  if ((page.viewportSize()?.width ?? 0) >= 1080) {
    const activity = page.getByRole("complementary", { name: "Recent activity" });
    await expect(activity.locator(".activity-entry")).toHaveCount(5);
    await expect(activity.locator(".surface")).toHaveCount(0);
    await expect(activity.locator(".activity-entry-amount").first()).toBeVisible();
    await expect
      .poll(() => activity.evaluate((panel) => panel.scrollWidth <= panel.clientWidth))
      .toBe(true);
  }
  await expect(page.getByRole("navigation", { name: "Group views" })).toHaveCount(0);
  await expect(navigation.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    navigation.getByRole("link", { name: "Overview" }).locator("svg.ui-icon"),
  ).toHaveAttribute("aria-hidden", "true");
  await expect(
    page.getByRole("link", { name: "Group settings" }).locator("svg.ui-icon"),
  ).toBeVisible();
  await expect(page.getByText("Your position in this group")).toBeVisible();
  await expect(page.getByRole("heading", { name: "At a glance" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Members (1)" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent expenses (5)" })).toBeVisible();
  await expect(page.getByText("Expense 5", { exact: true })).toBeVisible();
  await expect(page.getByText("Expense 2", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("searchbox", { name: "Search expenses" })).toHaveCount(0);

  await page.getByRole("link", { name: "View all members" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/members$/u);
  await expect(page.getByRole("heading", { level: 1, name: "Weekend Trip" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Members", exact: true })).toBeVisible();
  await navigation.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByRole("heading", { name: "At a glance" })).toBeVisible();

  await navigation.locator('a[href="/groups/trip/categories"]').click();
  await expect(page.getByRole("heading", { level: 1, name: "Weekend Trip" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Categories & Tags", exact: true }),
  ).toBeVisible();

  await navigation.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Weekend Trip" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Group settings" })).toBeVisible();
  await navigation.getByRole("link", { name: "Overview" }).click();

  await page.getByRole("link", { name: "View all balances" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/balances$/u);
  await expect(page.getByRole("heading", { name: "Net per member" })).toBeVisible();
  await expect(page.getByText("Your position in this group")).toHaveCount(0);
  await navigation.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByText("Your position in this group")).toBeVisible();

  await page.getByRole("link", { name: "View all expenses" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    await expect(sidebar.getByRole("link", { name: "All groups" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "New group" })).toHaveCount(0);
  }
  await expect(navigation.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(navigation.getByRole("link", { name: "Expenses" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { name: "All expenses" })).toBeVisible();
  await expect(page.getByText("Your position in this group")).toHaveCount(0);
  await expect(page.getByRole("searchbox", { name: "Search expenses" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Expenses" }).locator("li")).toHaveCount(5);

  await navigation.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByText("Your position in this group")).toBeVisible();
});
