import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { Expense, OnboardingSettings } from "@/shared/types/domain.types";

const getFiltersTrigger = (page: Page) =>
  (page.viewportSize()?.width ?? 0) < 768
    ? page.getByRole("button", { name: /^Filters(?: \(\d+\))?$/u })
    : page.locator("summary").filter({ hasText: "Filters" });

const closeFilters = async (page: Page) => {
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page
      .getByRole("dialog", { name: "Filters", exact: true })
      .getByRole("button", { name: "Done", exact: true })
      .click();
  } else {
    await getFiltersTrigger(page).click();
  }
};

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
  const filters = getFiltersTrigger(page);
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
  await closeFilters(page);
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
  await getFiltersTrigger(page).click();
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
  await closeFilters(page);

  await expect(page.getByText("8 active filters", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");
  await expect(page.getByRole("list", { name: "Expenses" }).getByText("Dinner")).toBeVisible();
  await expect(page.getByRole("list", { name: "Expenses" }).getByText("Airport taxi")).toHaveCount(
    0,
  );
  await expect(page).toHaveURL(/name=.*&dateFrom=2026-09-20.*memberIds=c/u);

  await page.reload();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");
  await getFiltersTrigger(page).click();
  await expect(
    page.getByRole("group", { name: "Member involved" }).getByLabel("Cal"),
  ).toBeChecked();

  await page.getByLabel("To date", { exact: true }).fill("2026-09-19");
  await expect(
    page.getByText("End date must be on or after start date", { exact: true }),
  ).toBeVisible();
  if (!isMobile) {
    await expect
      .poll(async () => {
        const trigger = (await getFiltersTrigger(page).boundingBox())!;
        const popover = (await page
          .locator(".expense-filter-popover:not([hidden])")
          .boundingBox())!;
        return (
          popover.y + popover.height <= trigger.y + 1 || popover.y >= trigger.y + trigger.height - 1
        );
      })
      .toBe(true);
  }
  await closeFilters(page);
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
  await getFiltersTrigger(page).click();
  await page.getByRole("group", { name: "Tags" }).getByLabel("Holiday").check();
  await closeFilters(page);
  await expect(page).toHaveURL(/tagIds=holiday/u);
  await expect(page.getByText("1 active filter", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");

  await page.getByRole("list", { name: "Expenses" }).getByText("Dinner").click();
  await expect(page).toHaveURL(/\/expenses\/dinner\?tagIds=holiday$/u);
  await page.getByRole("link", { name: "Back to expenses", exact: true }).click();
  await expect(page).toHaveURL(/\/expenses\?tagIds=holiday$/u);
  await expect(page.getByText("1 active filter", { exact: true })).toBeVisible();
  await getFiltersTrigger(page).click();
  await expect(page.getByRole("group", { name: "Tags" }).getByLabel("Holiday")).toBeChecked();
  await closeFilters(page);

  await page.getByRole("list", { name: "Expenses" }).getByText("Dinner").click();
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    await useStore.getState().removeTag("holiday");
  });
  await page.getByRole("link", { name: "Back to expenses", exact: true }).click();

  await expect(page.getByText("0 active filters", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Selected expense filters" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
  if (isMobile) {
    await expect(page.getByRole("status")).toHaveCount(0);
  } else {
    await expect(page.getByRole("status")).toHaveText("3 of 3 expenses · 0 payments");
  }
  await getFiltersTrigger(page).click();
  await expect(page.getByRole("group", { name: "Tags" }).getByLabel("Holiday")).toHaveCount(0);
});

test("shows and removes every selected filter without opening the popover", async ({ page }) => {
  const expected = new URLSearchParams({
    name: "dinner",
    sort: "highest",
    dateFrom: "2026-09-20",
    dateTo: "2026-09-22",
    minAmount: "50",
    maxAmount: "200",
  });
  for (const [field, values] of [
    ["categoryIds", ["food", "travel"]],
    ["tagIds", ["holiday", "work"]],
    ["payerIds", ["a", "b"]],
    ["memberIds", ["c"]],
    ["splitTypes", ["equal", "amount"]],
  ] as const) {
    for (const value of values) expected.append(field, value);
  }
  await page.goto(`/groups/trip/expenses?${expected.toString()}`);
  const chips = page.getByRole("list", { name: "Selected expense filters" });
  await expect(chips.getByRole("button")).toHaveCount(11);
  await expect(page.getByText("8 active filters", { exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Categories", exact: true })).toBeHidden();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");
  await expect(chips).not.toContainText("dinner");
  await page.reload();
  await expect(chips.getByRole("button")).toHaveCount(11);

  for (const { label, fields, value } of [
    { label: "Category: Food", fields: ["categoryIds"], value: "food" },
    { label: "Tag: Holiday", fields: ["tagIds"], value: "holiday" },
    { label: "Paid by: Amy", fields: ["payerIds"], value: "a" },
    { label: "Member: Cal", fields: ["memberIds"], value: "c" },
    { label: "Split: Equal", fields: ["splitTypes"], value: "equal" },
    { label: "Date: 20-Sep-2026 – 22-Sep-2026", fields: ["dateFrom", "dateTo"] },
    { label: "Amount: ₹50.00 – ₹200.00", fields: ["minAmount", "maxAmount"] },
    { label: "Category: Travel", fields: ["categoryIds"], value: "travel" },
    { label: "Tag: Work", fields: ["tagIds"], value: "work" },
    { label: "Paid by: Bea", fields: ["payerIds"], value: "b" },
    { label: "Split: Amount", fields: ["splitTypes"], value: "amount" },
  ]) {
    await chips.getByRole("button", { name: `Remove ${label} filter`, exact: true }).click();
    for (const field of fields) {
      const remaining = value ? expected.getAll(field).filter((item) => item !== value) : [];
      expected.delete(field);
      for (const item of remaining) expected.append(field, item);
    }
    expect([...new URL(page.url()).searchParams.entries()].sort()).toEqual(
      [...expected.entries()].sort(),
    );
    await expect(page.getByRole("group", { name: "Categories", exact: true })).toBeHidden();
  }
  await expect(chips).toHaveCount(0);
  await expect(page.getByText("1 active filter", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Search expenses", { exact: true })).toHaveValue("dinner");
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");
  await page.getByRole("button", { name: "Clear all filters", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses\?sort=highest$/u);
});

test("shows open-ended and invalid range chips that can be cleared without the popover", async ({
  page,
}) => {
  for (const { field, value, label } of [
    { field: "dateFrom", value: "2026-09-20", label: "Date: From 20-Sep-2026" },
    { field: "dateTo", value: "2026-09-22", label: "Date: Until 22-Sep-2026" },
    { field: "minAmount", value: "50", label: "Amount: At least ₹50.00" },
    { field: "maxAmount", value: "200", label: "Amount: At most ₹200.00" },
    { field: "minAmount", value: "invalid", label: "Amount: At least invalid INR" },
    { field: "dateFrom", value: "2026-02-30", label: "Date: From 2026-02-30" },
  ]) {
    await page.goto(`/groups/trip/expenses?sort=highest&${field}=${value}`);
    const chips = page.getByRole("list", { name: "Selected expense filters" });
    await expect(chips.getByRole("button")).toHaveCount(1);
    if (value === "invalid" || value === "2026-02-30") {
      await expect(page.getByRole("status")).toHaveText(
        "Correct the highlighted filters to see results.",
      );
    }
    await chips.getByRole("button", { name: `Remove ${label} filter`, exact: true }).click();
    await expect(page).toHaveURL(/\/groups\/trip\/expenses\?sort=highest$/u);
    await expect(chips).toHaveCount(0);
    await expect(
      page.getByRole("list", { name: "Expenses", exact: true }).locator(":scope > li"),
    ).toHaveCount(3);
  }
});

test("immediately shows the inactive category selected from group Analytics", async ({ page }) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { isActive: false });
  });
  await page.goto("/groups/trip/analytics");
  await page.locator("#main-content .page-narrow").getByRole("link", { name: /Food/u }).click();
  const chips = page.getByRole("list", { name: "Selected expense filters" });
  await expect(
    chips.getByRole("button", { name: "Remove Category: Food (inactive) filter", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 of 3 expenses");
  await expect(page.getByRole("group", { name: "Categories", exact: true })).toBeHidden();
  await page.getByRole("list", { name: "Expenses", exact: true }).getByText("Dinner").click();
  await page.getByRole("link", { name: "Back to expenses", exact: true }).click();
  await expect(chips).toContainText("Category: Food (inactive)");
});

for (const viewport of [
  { name: "mobile", width: 320, height: 800 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  for (const theme of ["light", "dark"] as const) {
    test(`uses seven distinct readable filter colours on ${viewport.name} in ${theme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.evaluate((value) => {
        localStorage.setItem("split-slate-theme", value);
      }, theme);
      await page.goto(
        "/groups/trip/expenses?categoryIds=food&categoryIds=travel&tagIds=holiday&tagIds=work&payerIds=a&payerIds=b&memberIds=a&memberIds=b&splitTypes=equal&splitTypes=amount&dateFrom=2026-09-20&minAmount=0&sort=highest",
      );
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const chips = page.getByRole("list", { name: "Selected expense filters" });
      await expect(chips.getByRole("button")).toHaveCount(12);
      const readColours = () =>
        chips.evaluate((element) => {
          const channels = (colour: string) => {
            const values = colour.match(/[\d.]+/gu)?.map(Number);
            if (!values || values.length < 3) throw new Error(`Invalid colour: ${colour}`);
            return values.slice(0, 3);
          };
          const luminance = (colour: string) => {
            const [red, green, blue] = channels(colour).map((value) => {
              const channel = value / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return red * 0.2126 + green * 0.7152 + blue * 0.0722;
          };
          const hue = (colour: string) => {
            const [red, green, blue] = channels(colour);
            const maximum = Math.max(red, green, blue);
            const minimum = Math.min(red, green, blue);
            const delta = maximum - minimum;
            if (!delta) throw new Error("Filter borders must not be grey");
            const sector =
              maximum === red
                ? (green - blue) / delta
                : maximum === green
                  ? (blue - red) / delta + 2
                  : (red - green) / delta + 4;
            return (sector * 60 + 360) % 360;
          };
          return [...element.querySelectorAll<HTMLButtonElement>("button")].map((button) => {
            const style = getComputedStyle(button);
            const foreground = luminance(style.color);
            const background = luminance(style.backgroundColor);
            const hoverColour = style.getPropertyValue("--filter-hover-background").trim();
            const hoverChannels = hoverColour
              .match(/[a-f\d]{2}/giu)
              ?.map((hex) => Number.parseInt(hex, 16));
            if (!hoverChannels || hoverChannels.length !== 3) throw new Error("Missing hover colour");
            const hoverBackground = luminance(`rgb(${hoverChannels.join(", ")})`);
            const contrast = (first: number, second: number) =>
              (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
            return {
              type: button.dataset.filterType,
              background: style.backgroundColor,
              border: style.borderTopColor,
              ink: style.color,
              hue: hue(style.borderTopColor),
              contrast: contrast(foreground, background),
              hoverContrast: contrast(foreground, hoverBackground),
            };
          });
        });
      const colours = await readColours();
      const types = [
        "categoryIds",
        "tagIds",
        "payerIds",
        "memberIds",
        "splitTypes",
        "date",
        "amount",
      ];
      const representatives = types.map((type) => {
        const matching = colours.filter((colour) => colour.type === type);
        expect(matching).toHaveLength(type === "date" || type === "amount" ? 1 : 2);
        for (const colour of matching) {
          expect(colour.background).toBe(matching[0].background);
          expect(colour.border).toBe(matching[0].border);
          expect(colour.ink).toBe(matching[0].ink);
          expect(colour.contrast).toBeGreaterThanOrEqual(4.5);
          expect(colour.hoverContrast).toBeGreaterThanOrEqual(4.5);
        }
        return matching[0];
      });
      expect(new Set(representatives.map((colour) => colour.background)).size).toBe(7);
      expect(new Set(representatives.map((colour) => colour.border)).size).toBe(7);
      for (let first = 0; first < representatives.length; first += 1) {
        for (let second = first + 1; second < representatives.length; second += 1) {
          const difference = Math.abs(representatives[first].hue - representatives[second].hue);
          expect(Math.min(difference, 360 - difference)).toBeGreaterThanOrEqual(20);
        }
      }
      const removeCategory = chips.getByRole("button", {
        name: "Remove Category: Food filter",
        exact: true,
      });
      await removeCategory.focus();
      await page.keyboard.press("Enter");
      await expect(removeCategory).toHaveCount(0);
      const remaining = await readColours();
      for (const colour of remaining) {
        const original = representatives.find((item) => item.type === colour.type)!;
        expect(colour.border).toBe(original.border);
        expect(colour.ink).toBe(original.ink);
      }
      expect(new URL(page.url()).searchParams.get("sort")).toBe("highest");
      await page.reload();
      await expect(chips.getByRole("button")).toHaveCount(11);
      expect(await readColours()).toEqual(remaining);
    });
  }

  test(`keeps filter chips on one horizontally scrollable row on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      await db.categories.update("food", {
        name: "FoodGroceriesRestaurantMealsAndWeekendTreats",
      });
    });
    await page.goto(
      "/groups/trip/expenses?categoryIds=food&categoryIds=travel&tagIds=holiday&tagIds=work&payerIds=a&payerIds=b&payerIds=c&memberIds=a&memberIds=b&memberIds=c&splitTypes=equal&splitTypes=amount&splitTypes=shares&splitTypes=percentage&splitTypes=adjustment&dateFrom=2026-09-20&dateTo=2026-09-22&minAmount=0&maxAmount=200&sort=oldest",
    );
    const form = page.getByRole("form", { name: "Expense filters" });
    const chips = page.getByRole("list", { name: "Selected expense filters" });
    await expect(chips.getByRole("button")).toHaveCount(17);
    await expect(chips.getByRole("button").first()).toContainText(
      "Category: FoodGroceriesRestaurantMealsAndWeekendTreats",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    const dimensions = await chips.evaluate((element) => ({
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
      paddingBottom: parseFloat(getComputedStyle(element).paddingBottom),
      buttonTops: [...element.querySelectorAll("button")].map(
        (button) => button.getBoundingClientRect().top,
      ),
      bottomGap:
        element.getBoundingClientRect().top +
        element.clientTop +
        element.clientHeight -
        Math.max(
          ...[...element.querySelectorAll("button")].map(
            (button) => button.getBoundingClientRect().bottom,
          ),
        ),
      buttonHeights: [...element.querySelectorAll("button")].map(
        (button) => button.getBoundingClientRect().height,
      ),
      compactChip: (() => {
        const button = [...element.querySelectorAll("button")].find(
          (item) => item.textContent === "Category: Travel",
        );
        if (!button) throw new Error("Missing Travel chip");
        const style = getComputedStyle(button);
        return {
          height: button.getBoundingClientRect().height,
          fontSize: parseFloat(style.fontSize),
          paddingX: parseFloat(style.paddingLeft),
          paddingY: parseFloat(style.paddingTop),
        };
      })(),
    }));
    expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.width);
    expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.height + 1);
    expect(dimensions.height).toBeLessThanOrEqual(48);
    expect(Math.max(...dimensions.buttonTops) - Math.min(...dimensions.buttonTops)).toBeLessThan(1);
    expect(dimensions.paddingBottom).toBeGreaterThanOrEqual(16);
    expect(dimensions.bottomGap).toBeGreaterThanOrEqual(dimensions.paddingBottom - 1);
    for (const height of dimensions.buttonHeights) expect(height).toBeGreaterThanOrEqual(24);
    expect(dimensions.compactChip.height).toBeLessThanOrEqual(26);
    expect(dimensions.compactChip.fontSize).toBeLessThanOrEqual(10);
    expect(dimensions.compactChip.paddingX).toBeLessThanOrEqual(8);
    expect(dimensions.compactChip.paddingY).toBeLessThanOrEqual(2);

    await getFiltersTrigger(page).click();
    await expect(page.getByRole("group", { name: "Categories", exact: true })).toBeVisible();
    await closeFilters(page);
    const amount = chips.getByRole("button", {
      name: "Remove Amount: ₹0.00 – ₹200.00 filter",
      exact: true,
    });
    await amount.focus();
    await expect.poll(() => chips.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expect(amount).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(amount).toHaveCount(0);
    expect(new URL(page.url()).searchParams.has("minAmount")).toBe(false);
    expect(new URL(page.url()).searchParams.has("maxAmount")).toBe(false);
    expect(new URL(page.url()).searchParams.get("sort")).toBe("oldest");
    await page.reload();
    await expect(chips.getByRole("button")).toHaveCount(16);
    await form.getByRole("button", { name: "Clear all filters", exact: true }).click();
    await expect(chips).toHaveCount(0);
    await expect(page).toHaveURL(/\/groups\/trip\/expenses\?sort=oldest$/u);
  });
}

test("uses a scrollable mobile filter modal with live selections, clearing, and focus return", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/groups/trip/expenses?sort=highest");
  const trigger = getFiltersTrigger(page);
  const dialog = page.getByRole("dialog", { name: "Filters", exact: true });
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Filters", exact: true })).toBeVisible();
  const controls = dialog.getByRole("group", { name: "Filter controls", exact: true });
  const done = dialog.getByRole("button", { name: "Done", exact: true });
  await expect(done).toBeInViewport();
  await expect
    .poll(() => controls.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(15.5);
  expect(bounds.y).toBeGreaterThanOrEqual(15.5);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(304.5);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(552.5);
  const header = dialog.locator(".dialog-header");
  const footer = dialog.locator(".dialog-footer");
  const headerY = (await header.boundingBox())!.y;
  const footerY = (await footer.boundingBox())!.y;
  await controls.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect((await header.boundingBox())!.y).toBeCloseTo(headerY, 0);
  expect((await footer.boundingBox())!.y).toBeCloseTo(footerY, 0);
  await expect(dialog.getByRole("button", { name: "Close filters", exact: true })).toBeInViewport();
  await expect(done).toBeInViewport();
  await dialog.getByRole("group", { name: "Categories", exact: true }).getByLabel("Food").check();
  await expect(page).toHaveURL(/sort=highest&categoryIds=food$/u);
  await done.click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("list", { name: "Selected expense filters" })).toContainText(
    "Category: Food",
  );
  await trigger.click();
  await page.setViewportSize({ width: 320, height: 480 });
  await expect(dialog).toBeVisible();
  await expect(done).toBeInViewport();
  await dialog.getByRole("button", { name: "Clear all filters", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses\?sort=highest$/u);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("list", { name: "Selected expense filters" })).toHaveCount(0);
  await trigger.click();
  await dialog.getByRole("button", { name: "Close filters", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await trigger.click();
  await page.setViewportSize({ width: 820, height: 900 });
  await expect(dialog).toHaveCount(0);
  await getFiltersTrigger(page).click();
  await expect(page.getByRole("group", { name: "Categories", exact: true })).toBeVisible();
  await expect(dialog).toHaveCount(0);
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
