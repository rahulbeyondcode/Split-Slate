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

test("stacks mobile search above usable sort and filter controls after scrolling", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile expense toolbar only");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    const example = await db.expenses.get("dinner");
    if (!example) throw new Error("Missing sample expense");
    await db.expenses.bulkPut(
      Array.from({ length: 20 }, (_, index) => ({
        ...example,
        expenseId: `extra-${index}`,
        expenseName: `Extra ${index}`,
        createdAt: index + 10,
        when: example.when + index + 1,
      })),
    );
  });
  await page.reload();

  const form = page.getByRole("form", { name: "Expense filters" });
  const search = form.getByRole("searchbox", { name: "Search expenses" });
  const sort = form.locator("summary").filter({ hasText: "Sort" });
  const filters = form.locator("summary").filter({ hasText: "Filters" });
  const searchBox = (await search.boundingBox())!;
  const sortBox = (await sort.boundingBox())!;
  const filtersBox = (await filters.boundingBox())!;
  expect(sortBox.y).toBeGreaterThanOrEqual(searchBox.y + searchBox.height);
  expect(Math.abs(sortBox.y - filtersBox.y)).toBeLessThan(2);
  expect(Math.abs(sortBox.width - filtersBox.width)).toBeLessThan(2);
  expect(searchBox.width).toBeGreaterThan(sortBox.width + filtersBox.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await page.locator("#main-content").evaluate((main) => {
    main.scrollTop = main.scrollHeight / 2;
  });
  await expect(form).toBeInViewport();
  await sort.click();
  await expect(page.getByRole("group", { name: "Sort expenses" })).toBeVisible();
  await filters.click();
  await expect(page.getByRole("group", { name: "Categories" })).toBeVisible();
  await search.fill("Airport taxi");
  await expect(page.getByRole("status")).toHaveText("1 of 23 expenses");
  await form.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("summarizes matching expenses without changing full-group balances", async ({ page }) => {
  const insights = page.getByRole("region", { name: "Expense insights" });
  if ((page.viewportSize()?.width ?? 0) < 640) {
    await expect(page.locator(".mobile-cta")).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: "Add expense" })).toHaveCount(0);
  }
  await expect(insights.getByText("₹350.01")).toBeVisible();
  await expect(insights.getByText("Travel")).toBeVisible();
  await page.getByLabel("Search expenses", { exact: true }).fill("dinner");
  await expect(insights.getByText("Matching expenses only")).toBeVisible();
  await expect(insights.getByText("₹100.01").first()).toBeVisible();
  await expect(insights.locator("details")).toHaveCount(0);
  const balancesLink = insights.getByRole("link", { name: "View full-group balances" });
  await expect(balancesLink).toHaveClass(/btn-secondary/u);
  await expect(balancesLink).toHaveAttribute("href", "/groups/trip/balances");
  const filteredUrl = page.url();
  await balancesLink.click();
  await expect(page.getByRole("heading", { name: "Net per member" })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(filteredUrl);
  await expect(insights.getByText("Matching expenses only")).toBeVisible();

  await page.locator("summary").filter({ hasText: "Sort" }).click();
  const sortPanel = page.getByRole("group", { name: "Sort expenses" }).locator("..");
  await expect(sortPanel).toBeVisible();
  await expect
    .poll(() => sortPanel.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await page
    .getByRole("group", { name: "Sort expenses" })
    .getByRole("radio", { name: "High to low" })
    .check();
  await expect(insights.getByText("₹100.01").first()).toBeVisible();

  await page.getByLabel("Search expenses", { exact: true }).fill("no matching expense");
  await expect(insights.getByText("₹0.00").first()).toBeVisible();
  await expect(insights.locator("details")).toHaveCount(0);
  await page.getByLabel("Search expenses", { exact: true }).fill("");
  await expect(insights.getByText("₹350.01")).toBeVisible();

  await page.goto("/groups/trip/expenses?dateFrom=2026-09-21&dateTo=2026-09-20");
  await expect(page.getByRole("status")).toHaveText(
    "Correct the highlighted filters to see results.",
  );
  await expect(insights).toHaveCount(0);
});

test("balances opened directly return to the group's expenses", async ({ page }) => {
  await page.goto("/groups/trip/balances");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
});

test("filters expenses through every field, validates ranges, and clears all controls", async ({
  page,
  isMobile,
}) => {
  if (isMobile) {
    await expect(page.getByRole("status")).toHaveCount(0);
  } else {
    await expect(page.getByRole("status")).toHaveText("3 of 3 expenses · 0 payments");
  }
  await page.getByLabel("Search expenses", { exact: true }).fill(" dinner ");
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  const fromDate = page.getByLabel("From date", { exact: true });
  await expect(fromDate).toHaveAttribute("data-empty", "true");
  await expect(fromDate).toHaveCSS("font-weight", "400");
  await fromDate.fill("2026-09-20");
  await expect(fromDate).not.toHaveAttribute("data-empty", "true");
  await page.getByLabel("To date", { exact: true }).fill("2026-09-20");
  await page.getByLabel("Minimum amount (INR)", { exact: true }).fill("100.01");
  await page.getByLabel("Maximum amount (INR)", { exact: true }).fill("100.01");
  await page.getByRole("group", { name: "Categories" }).getByLabel("Food").check();
  await expect(page.getByRole("group", { name: "Categories" }).getByLabel("Food")).toHaveClass(
    /choice-control/u,
  );
  await page.getByRole("group", { name: "Tags" }).getByLabel("Holiday").check();
  await page.getByRole("group", { name: "Paid by" }).getByLabel("Amy").check();
  await page.getByRole("group", { name: "Member involved" }).getByLabel("Cal").check();
  await page.getByRole("group", { name: "Split types" }).getByLabel("Equal").check();

  await expect(page.getByText("8 active filters", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");
  await expect(page.getByRole("list", { name: "Expenses" }).getByText("Dinner")).toBeVisible();
  await expect(page.getByRole("list", { name: "Expenses" }).getByText("Airport taxi")).toHaveCount(
    0,
  );
  await expect(page).toHaveURL(/name=.*&dateFrom=2026-09-20.*memberIds=c/u);

  await page.reload();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  await expect(
    page.getByRole("group", { name: "Member involved" }).getByLabel("Cal"),
  ).toBeChecked();

  await page.getByLabel("To date", { exact: true }).fill("2026-09-19");
  await expect(
    page.getByText("End date must be on or after start date", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    "Correct the highlighted filters to see results.",
  );

  await page.getByRole("button", { name: "Clear all filters", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
  await expect(page.getByText("0 active filters", { exact: true })).toBeVisible();
  if (isMobile) {
    await expect(page.getByRole("status")).toHaveCount(0);
  } else {
    await expect(page.getByRole("status")).toHaveText("3 of 3 expenses · 0 payments");
  }
  await expect(page.getByLabel("Search expenses", { exact: true })).toHaveValue("");
});

test("preserves the query through expense detail and removes a deleted selected option", async ({
  page,
  isMobile,
}) => {
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  await page.getByRole("group", { name: "Tags" }).getByLabel("Holiday").check();
  await expect(page).toHaveURL(/tagIds=holiday/u);
  await expect(page.getByText("1 active filter", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");

  await page.getByRole("list", { name: "Expenses" }).getByText("Dinner").click();
  await expect(page).toHaveURL(/\/expenses\/dinner\?tagIds=holiday$/u);
  await page.getByRole("link", { name: "Back to expenses", exact: true }).click();
  await expect(page).toHaveURL(/\/expenses\?tagIds=holiday$/u);
  await expect(page.getByText("1 active filter", { exact: true })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  await expect(page.getByRole("group", { name: "Tags" }).getByLabel("Holiday")).toBeChecked();

  await page.getByRole("list", { name: "Expenses" }).getByText("Dinner").click();
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    await useStore.getState().removeTag("holiday");
  });
  await page.getByRole("link", { name: "Back to expenses", exact: true }).click();

  await expect(page.getByText("0 active filters", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
  if (isMobile) {
    await expect(page.getByRole("status")).toHaveCount(0);
  } else {
    await expect(page.getByRole("status")).toHaveText("3 of 3 expenses · 0 payments");
  }
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  await expect(page.getByRole("group", { name: "Tags" }).getByLabel("Holiday")).toHaveCount(0);
});

test("sorts by total paid and date, preserving sort through filters and detail navigation", async ({
  page,
}) => {
  const names = page.getByRole("list", { name: "Expenses" }).locator(":scope > li");
  const sortSummary = page.locator("summary").filter({ hasText: "Sort" });
  const sort = page.getByRole("group", { name: "Sort expenses" });
  await sortSummary.click();
  await expect(sort.getByRole("group", { name: "Date" }).getByRole("radio")).toHaveCount(2);
  await expect(sort.getByRole("group", { name: "Price" }).getByRole("radio")).toHaveCount(2);
  await expect(sort.getByRole("group", { name: "Name" }).getByRole("radio")).toHaveCount(2);
  await expect(sort.getByRole("group", { name: "Group by" }).getByRole("radio")).toHaveCount(2);
  await expect(sort.getByRole("radio", { name: "Newest first" })).toBeChecked();
  await expect(names).toContainText(["Hotel", "Airport taxi", "Dinner"]);

  await sort.getByRole("radio", { name: "High to low" }).check();
  await expect(names).toContainText(["Hotel", "Dinner", "Airport taxi"]);
  await expect(page).toHaveURL(/sort=highest/u);

  await sortSummary.click();
  await sort.getByRole("radio", { name: "Low to high" }).check();
  await expect(names).toContainText(["Airport taxi", "Dinner", "Hotel"]);
  await page.getByLabel("Search expenses", { exact: true }).fill("hotel");
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page).toHaveURL(/\/expenses\?sort=lowest$/u);
  await sortSummary.click();
  await expect(sort.getByRole("radio", { name: "Low to high" })).toBeChecked();

  await page.reload();
  await expect(names).toContainText(["Airport taxi", "Dinner", "Hotel"]);
  await page.getByRole("list", { name: "Expenses" }).getByText("Dinner").click();
  await page.getByRole("link", { name: "Back to expenses", exact: true }).click();
  await sortSummary.click();
  await expect(sort.getByRole("radio", { name: "Low to high" })).toBeChecked();

  await sort.getByRole("radio", { name: "Oldest first" }).check();
  await expect(names).toContainText(["Dinner", "Airport taxi", "Hotel"]);
  await sortSummary.click();
  await sort.getByRole("group", { name: "Name" }).getByRole("radio", { name: "A–Z" }).check();
  await expect(names).toContainText(["Airport taxi", "Dinner", "Hotel"]);
  await sortSummary.click();
  await sort.getByRole("group", { name: "Name" }).getByRole("radio", { name: "Z–A" }).check();
  await expect(names).toContainText(["Hotel", "Dinner", "Airport taxi"]);
  await sortSummary.click();
  await sort.getByRole("radio", { name: "Same category" }).check();
  await expect(names).toContainText(["Dinner", "Hotel", "Airport taxi"]);
  await sortSummary.click();
  await sort.getByRole("radio", { name: "Same tags" }).check();
  await expect(names).toContainText(["Dinner", "Airport taxi", "Hotel"]);
  await expect(page).toHaveURL(/sort=tags/u);
  await sortSummary.click();
  await sort.getByRole("radio", { name: "Newest first" }).check();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
});
