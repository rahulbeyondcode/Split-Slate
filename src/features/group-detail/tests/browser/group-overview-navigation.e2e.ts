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

test("offers a mobile return to dashboard from every group screen without changing desktop", async ({
  page,
  isMobile,
}) => {
  const dashboardLink = page
    .locator(".group-page-header")
    .getByRole("link", { name: "Back to dashboard" });
  if (!isMobile) {
    await expect(dashboardLink).toHaveCount(0);
    return;
  }

  for (const route of [
    "/groups/trip",
    "/groups/trip/expenses",
    "/groups/trip/members",
    "/groups/trip/categories",
    "/groups/trip/balances",
    "/groups/trip/settings",
    "/groups/trip/expenses/expense-1",
  ]) {
    await page.goto(route);
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();
    await expect(page).toHaveURL(/\/dashboard$/u);
  }

  await page.goto("/groups/trip/expenses/new");
  await expect(dashboardLink).toHaveCount(0);
  await page.getByRole("link", { name: "Back to expenses" }).click();
  await expect(dashboardLink).toBeVisible();
});

test("distinguishes the snapshot from the complete expense history", async ({ page, isMobile }) => {
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
    page.locator(".group-page-header").getByRole("link", { name: "Group settings" }),
  ).toHaveCount(0);
  await expect(navigation.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Your position in this group")).toBeVisible();
  await expect(page.getByRole("heading", { name: "At a glance" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: isMobile ? "Members" : "Members (1)", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent expenses (5)" })).toBeVisible();
  await expect(page.getByText("Expense 5", { exact: true })).toBeVisible();
  await expect(page.getByText("Expense 2", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("searchbox", { name: "Search expenses" })).toHaveCount(0);

  if (isMobile) {
    await expect(page.getByRole("link", { name: "View all members" })).toHaveCount(0);
    await navigation.getByRole("link", { name: "Members", exact: true }).click();
  } else {
    await page.getByRole("link", { name: "View all members" }).click();
  }
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
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/trip$/u);
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

test("shows the mobile member count and View all only beyond six members", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile overview preview only");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.bulkPut(
      Array.from({ length: 5 }, (_, index) => ({
        id: `friend-${index}`,
        name: `Friend ${index}`,
        icon: "🐼",
      })),
    );
    await db.members.bulkPut(
      Array.from({ length: 5 }, (_, index) => ({
        id: `member-${index}`,
        groupId: "trip",
        personId: `friend-${index}`,
      })),
    );
  });
  await page.reload();
  const memberCard = page.locator(".responsive-grid .surface").first();
  await expect(memberCard.getByRole("heading", { name: "Members", exact: true })).toBeVisible();
  await expect(memberCard.getByRole("link", { name: "View all members" })).toHaveCount(0);
  await expect(memberCard.locator("a.chip")).toHaveCount(6);

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.put({ id: "friend-5", name: "Friend 5", icon: "🐼" });
    await db.members.put({ id: "member-5", groupId: "trip", personId: "friend-5" });
  });
  await page.reload();
  await expect(memberCard.getByRole("heading", { name: "Members (7)" })).toBeVisible();
  await expect(memberCard.locator("a.chip")).toHaveCount(6);
  await memberCard.getByRole("link", { name: "View all members" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/members$/u);
});

test("pairs each suggested-transfer name with its avatar", async ({ page }) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.put({ id: "friend", name: "Lekshmi", icon: "🐼" });
    await db.members.put({ id: "b", groupId: "trip", personId: "friend" });
    await db.expenses.update("expense-5", {
      transactions: {
        paid: [{ memberId: "a", amount: 5000 }],
        owes: [
          { memberId: "a", amount: 2500 },
          { memberId: "b", amount: 2500 },
        ],
      },
    });
  });
  await page.goto("/groups/trip/balances");
  const transfer = page.getByRole("region", { name: "Suggested payments" }).locator("li").first();
  const people = transfer.locator(".transfer-person");
  await expect(people).toHaveCount(2);
  await expect(people.nth(0)).toContainText("Lekshmi");
  await expect(people.nth(0).locator(".avatar")).toHaveCount(1);
  await expect(people.nth(1)).toContainText("Amy");
  await expect(people.nth(1).locator(".avatar")).toHaveCount(1);
  await expect(transfer).toContainText("₹25.00");
});
