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
    "/groups/trip/analytics",
    "/groups/trip/settings",
    "/groups/trip/expenses/expense-1",
  ]) {
    await page.goto(route);
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toHaveCSS("border-style", "none");
    await expect(dashboardLink).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const backBox = (await dashboardLink.boundingBox())!;
    const header = page.locator(".group-page-header");
    const headerBox = (await header.boundingBox())!;
    expect(backBox.width).toBeGreaterThanOrEqual(headerBox.width - 2);
    await dashboardLink.click();
    await expect(page).toHaveURL(/\/dashboard$/u);
  }

  await page.goto("/groups/trip/expenses/new");
  await expect(dashboardLink).toHaveCount(0);
  await page.getByRole("link", { name: "Back to expenses" }).click();
  await expect(dashboardLink).toBeVisible();
});

test("aligns group Analytics Back with Balances and styles it like expense detail", async ({
  page,
}) => {
  const header = page.locator(".group-page-header");
  await page.goto("/groups/trip/balances");
  const balanceBack = page.getByRole("button", { name: "Back", exact: true });
  const balanceGap =
    (await balanceBack.boundingBox())!.y -
    ((await header.boundingBox())!.y + (await header.boundingBox())!.height);

  await page.goto("/groups/trip/analytics");
  const analyticsBack = page.getByRole("button", { name: "Back", exact: true });
  const analyticsGap =
    (await analyticsBack.boundingBox())!.y -
    ((await header.boundingBox())!.y + (await header.boundingBox())!.height);
  expect(Math.abs(analyticsGap - balanceGap)).toBeLessThan(4);
  const analyticsStyle = await analyticsBack.evaluate((element) => {
    const { borderRadius, backgroundColor, borderColor } = getComputedStyle(element);
    return { borderRadius, backgroundColor, borderColor };
  });

  await page.goto("/groups/trip/expenses/expense-1");
  const detailBack = page.getByRole("link", { name: "Back to expenses" });
  expect(
    await detailBack.evaluate((element) => {
      const { borderRadius, backgroundColor, borderColor } = getComputedStyle(element);
      return { borderRadius, backgroundColor, borderColor };
    }),
  ).toEqual(analyticsStyle);
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
    page.locator(".group-page-header").getByRole("link", { name: "Group settings" }),
  ).toHaveCount(0);
  await expect(navigation.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Your position in this group")).toBeVisible();
  await expect(page.getByRole("heading", { name: "At a glance" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Members", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Manage Members (1)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View all balances (0)" })).toBeVisible();
  await expect(page.getByText("These suggestions do not record payments.")).toHaveCount(0);
  const recentCard = page.locator(".recent-activity-card");
  await expect(recentCard.getByRole("heading", { name: "Recent transactions" })).toBeVisible();
  const viewAllActivity = recentCard.getByRole("link", { name: "View all (5)" });
  await expect(viewAllActivity).toHaveClass(/btn-secondary/u);
  await expect(page.locator(".expense-entry-title")).toHaveText([
    "Expense 5",
    "Expense 4",
    "Expense 3",
    "Expense 2",
    "Expense 1",
  ]);
  await expect(page.getByRole("region", { name: "Group spending by category" })).toContainText(
    "₹150.00",
  );
  await expect(page.getByRole("searchbox", { name: "Search expenses" })).toHaveCount(0);

  await page.getByRole("link", { name: "Manage Members (1)" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/members$/u);
  await expect(page.getByRole("heading", { level: 1, name: "Weekend Trip" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Members", exact: true })).toBeVisible();
  await navigation.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByRole("heading", { name: "At a glance" })).toBeVisible();

  await navigation.locator('a[href="/groups/trip/categories"]').click();
  await expect(page.getByRole("heading", { level: 1, name: "Weekend Trip" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Categories", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Tags", exact: true })).toBeVisible();

  await navigation.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Weekend Trip" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Group settings" })).toBeVisible();
  await navigation.getByRole("link", { name: "Overview" }).click();

  await page.getByRole("link", { name: "View all balances (0)" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/balances$/u);
  await expect(page.getByRole("heading", { name: "Net per member" })).toBeVisible();
  await expect(page.getByText("Your position in this group")).toHaveCount(0);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/trip$/u);
  await expect(page.getByText("Your position in this group")).toBeVisible();

  await viewAllActivity.click();
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
  await expect(page.getByRole("heading", { name: "Expenses and payments" })).toBeVisible();
  await expect(page.getByText("Your position in this group")).toHaveCount(0);
  await expect(page.getByRole("searchbox", { name: "Search expenses" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Expenses" }).locator("li")).toHaveCount(5);

  await navigation.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByText("Your position in this group")).toBeVisible();
});

test("scopes category previews and analytics to the group without changing app analytics", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.bulkPut([
      { id: "travel", groupId: "trip", name: "Travel", icon: "🚕", isActive: true },
      { id: "other-food", groupId: "other", name: "Food", icon: "🍔", isActive: true },
    ]);
    await db.expenses.update("expense-5", { categoryId: "travel" });
    await db.groups.put({
      id: "other",
      name: "Other Group",
      icon: "🏖️",
      currency: "INR",
      createdAt: 2,
      frequentPayerIds: [],
    });
    await db.members.put({ id: "other-member", groupId: "other", personId: "self" });
    await db.expenses.put({
      expenseId: "other-expense",
      groupId: "other",
      expenseName: "Other dinner",
      categoryId: "other-food",
      createdBy: "other-member",
      createdAt: 6,
      when: 6,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "other-member", amount: 9_000 }],
        owes: [{ memberId: "other-member", amount: 9_000 }],
      },
    });
  });
  await page.reload();

  const preview = page.getByRole("region", { name: "Group spending by category" });
  await expect(preview).toContainText("This group · all time");
  await expect(preview.getByRole("link", { name: /Food/u })).toContainText("₹100.00");
  await expect(preview.getByRole("link", { name: /Travel/u })).toContainText("₹50.00");
  await expect(preview).not.toContainText("₹190.00");
  await preview.getByRole("link", { name: "View all" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/analytics$/u);
  const analytics = page.locator("#main-content .page-narrow");
  const total = analytics.locator("p.money");
  await expect(analytics.getByRole("heading", { level: 1 })).toHaveCount(0);
  await expect(
    page.locator(".group-page-header").getByRole("heading", { level: 1, name: "Weekend Trip" }),
  ).toBeVisible();
  const description = analytics.getByText("Spending by category · Weekend Trip · all time");
  await expect(description).toBeVisible();
  const back = analytics.getByRole("button", { name: "Back", exact: true });
  expect(
    (await description.boundingBox())!.y -
      ((await back.boundingBox())!.y + (await back.boundingBox())!.height),
  ).toBeGreaterThanOrEqual(12);
  await expect(total).toHaveText("₹150.00");
  await expect(analytics.getByText("₹100.00", { exact: true })).toBeVisible();
  await expect(analytics.getByText("₹50.00", { exact: true })).toBeVisible();
  await expect(analytics.getByText("₹90.00", { exact: true })).toHaveCount(0);
  await analytics.getByRole("button", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/groups\/trip$/u);
  await preview.getByRole("link", { name: "Spending by category" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/analytics$/u);
  await page.reload();
  await expect(total).toHaveText("₹150.00");

  await page.goto("/analytics");
  await expect(analytics.getByRole("heading", { level: 1 })).toHaveText(
    (page.viewportSize()?.width ?? 0) < 768 ? "Spending by category" : "Analytics",
  );
  await expect(total).toHaveText("₹240.00");
  await expect(analytics.getByText("₹190.00", { exact: true })).toBeVisible();
  await page.goto("/groups/other/analytics");
  await expect(total).toHaveText("₹90.00");
  await expect(analytics.getByText("₹150.00", { exact: true })).toHaveCount(0);

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.groups.update("other", { currency: "USD" });
  });
  await page.goto("/analytics");
  await expect(page.getByRole("heading", { name: "Multiple currencies in use" })).toBeVisible();
  await page.goto("/groups/trip/analytics");
  await expect(total).toHaveText("₹150.00");
});

test("links to group analytics even when the group has no expenses", async ({ page }) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.groups.put({
      id: "empty",
      name: "Empty Group",
      icon: "🏖️",
      currency: "USD",
      createdAt: 2,
      frequentPayerIds: [],
    });
    await db.members.put({ id: "empty-member", groupId: "empty", personId: "self" });
    await db.categories.put({
      id: "empty-food",
      groupId: "empty",
      name: "Food",
      icon: "🍔",
      isActive: true,
    });
  });
  await page.goto("/groups/empty");
  const preview = page.getByRole("region", { name: "Group spending by category" });
  await expect(preview).toContainText("No spending yet.");
  await preview.getByRole("link", { name: "View all" }).click();
  await expect(page).toHaveURL(/\/groups\/empty\/analytics$/u);
  await expect(page.getByRole("heading", { name: "Nothing to chart yet" })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/empty$/u);
  await page.goto("/groups/empty/analytics");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/empty$/u);
  await page.goto("/groups/missing/analytics");
  await expect(page.getByRole("heading", { name: "Group not found" })).toBeVisible();
});

test("keeps the mobile member preview to six while its footer CTA shows the full count", async ({
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
  await expect(memberCard.getByRole("link", { name: "Manage Members (6)" })).toBeVisible();
  await expect(memberCard.locator("a.chip")).toHaveCount(6);

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.put({ id: "friend-5", name: "Friend 5", icon: "🐼" });
    await db.members.put({ id: "member-5", groupId: "trip", personId: "friend-5" });
  });
  await page.reload();
  await expect(memberCard.getByRole("heading", { name: "Members", exact: true })).toBeVisible();
  await expect(memberCard.locator("a.chip")).toHaveCount(6);
  await memberCard.getByRole("link", { name: "Manage Members (7)" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/members$/u);
});

test("shows only the first three suggested transfers and the full count in the footer", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.bulkPut(
      Array.from({ length: 4 }, (_, index) => ({
        id: `debtor-${index}`,
        name: `Debtor ${index + 1}`,
        icon: "🐼",
      })),
    );
    await db.members.bulkPut(
      Array.from({ length: 4 }, (_, index) => ({
        id: `member-${index}`,
        groupId: "trip",
        personId: `debtor-${index}`,
      })),
    );
    await db.expenses.update("expense-1", {
      transactions: {
        paid: [{ memberId: "a", amount: 40_000 }],
        owes: Array.from({ length: 4 }, (_, index) => ({
          memberId: `member-${index}`,
          amount: 10_000,
        })),
      },
    });
  });
  await page.reload();
  const cards = page.locator(".overview-action-card");
  const preview = cards.nth(1);
  await expect(preview.locator(".overview-transfer-row")).toHaveCount(3);
  await expect(preview).toContainText("Debtor 1");
  await expect(preview).toContainText("Debtor 3");
  await expect(preview).not.toContainText("Debtor 4");
  await expect(preview).toContainText("Amy");
  await expect(preview).toContainText("₹100.00");
  await expect(preview.getByRole("link", { name: "View all balances (4)" })).toBeVisible();
  await expect(cards.first().getByRole("link", { name: "Manage Members (5)" })).toBeVisible();
});

test("centers full-width member and balance CTAs at the bottom of their cards", async ({
  page,
}) => {
  const cards = page.locator(".overview-summary-grid > .overview-action-card");
  await expect(cards).toHaveCount(2);
  for (const width of [320, 800, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    const memberBox = (await cards.first().boundingBox())!;
    const transferBox = (await cards.last().boundingBox())!;
    if (width < 1080) {
      expect(transferBox.y).toBeGreaterThanOrEqual(memberBox.y + memberBox.height);
      expect(Math.abs(transferBox.width - memberBox.width)).toBeLessThan(2);
    } else {
      expect(Math.abs(transferBox.y - memberBox.y)).toBeLessThan(2);
      expect(transferBox.x).toBeGreaterThanOrEqual(memberBox.x + memberBox.width);
    }
    for (const card of await cards.all()) {
      const action = card.locator(".overview-card-cta");
      const labelBox = (await action.locator("span").boundingBox())!;
      const actionBox = (await action.boundingBox())!;
      const cardBox = (await card.boundingBox())!;
      const paddingRight = await card.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).paddingRight),
      );
      expect(
        Math.abs(actionBox.x + actionBox.width - (cardBox.x + cardBox.width - paddingRight)),
      ).toBeLessThan(2);
      expect(actionBox.width).toBeGreaterThan(cardBox.width / 2);
      expect(
        Math.abs(labelBox.x + labelBox.width / 2 - actionBox.x - actionBox.width / 2),
      ).toBeLessThan(2);
      expect(cardBox.y + cardBox.height - (actionBox.y + actionBox.height)).toBeGreaterThan(0);
      expect(cardBox.y + cardBox.height - (actionBox.y + actionBox.height)).toBeLessThan(35);
    }
  }
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
