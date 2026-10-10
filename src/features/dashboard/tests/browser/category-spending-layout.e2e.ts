import type { Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { Expense, OnboardingSettings } from "@/shared/types/domain.types";

const CATEGORY_NAMES = [
  "International flights and connecting airport transfers with a very long category name",
  "Food & Dining",
  "Accommodation",
  "Activities",
  "Shopping",
  "Transport",
  "Wellness",
  "Essentials",
];
const CATEGORY_AMOUNTS = [10_000_000, 100_000, 90_000, 80_000, 70_000, 60_000, 50_000, 1];
const TOTAL_AMOUNT = CATEGORY_AMOUNTS.reduce((sum, amount) => sum + amount, 0);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("split-slate-install-dismissed", String(Date.now()));
  });
  await page.goto("/onboarding");
  await page.waitForFunction(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    return useStore.getState().initialized;
  });
  await page.evaluate(
    async ({ names, amounts }) => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      const person = { id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" };
      await db.localUser.put(person);
      await db.people.put(person);
      await db.groups.put({
        id: "trip",
        name: "Maldives Trip",
        currency: "INR",
        icon: "travel-and-places/camping-3d.png",
        createdAt: 1,
        frequentPayerIds: ["a"],
      });
      await db.members.put({ id: "a", groupId: "trip", personId: "self" });
      await db.categories.bulkPut(
        names.map((name, index) => ({
          id: `category-${index}`,
          groupId: "trip",
          name,
          icon: "food-and-drinks/hamburger-3d.png",
          isActive: true,
        })),
      );
      const expenses: Expense[] = amounts.map((amount, index) => ({
        expenseId: `expense-${index}`,
        expenseName: `Trip expense ${index}`,
        groupId: "trip",
        categoryId: `category-${index}`,
        createdBy: "a",
        createdAt: index + 1,
        when: index + 1,
        splitType: "equal",
        splitMeta: [],
        tagIds: [],
        attachmentIds: [],
        transactions: {
          paid: [{ memberId: "a", amount }],
          owes: [{ memberId: "a", amount }],
        },
      }));
      await db.expenses.bulkPut(expenses);
      const onboarding: OnboardingSettings = {
        id: "onboarding",
        complete: true,
        lastCompletedStep: "members",
        groupId: "trip",
      };
      await db.settings.put(onboarding);
    },
    { names: CATEGORY_NAMES, amounts: CATEGORY_AMOUNTS },
  );
});

const expectCompactBreakdown = async (list: Locator, count: number) => {
  await expect(list).toBeVisible();
  const rows = list.locator(".category-spending-item");
  await expect(rows).toHaveCount(count);
  await expect(rows.first().locator(".category-spending-name")).toHaveAttribute(
    "title",
    CATEGORY_NAMES[0],
  );
  await expect(rows.first().locator(".category-spending-amount")).toHaveText("₹1,00,000.00");
  await expect(rows.first().locator(".category-spending-share")).toHaveText("95.7%");
  await expect(rows.locator(".category-spending-name")).toHaveText(CATEGORY_NAMES.slice(0, count));
  const layout = await list.evaluate((element) => {
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return {
      rootSize,
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
      rows: [...element.querySelectorAll<HTMLElement>(".category-spending-row")].map((row) => {
        const identity = row.querySelector<HTMLElement>(".category-spending-identity")!;
        const amount = row.querySelector<HTMLElement>(".category-spending-amount")!;
        const track = row.querySelector<HTMLElement>(".category-spending-track")!;
        const fill = row.querySelector<HTMLElement>(".category-spending-fill")!;
        const style = getComputedStyle(row);
        return {
          height: row.getBoundingClientRect().height,
          width: row.getBoundingClientRect().width,
          identityWidth: identity.getBoundingClientRect().width,
          amountFits: amount.scrollWidth <= amount.clientWidth + 1,
          paddingTop: parseFloat(style.paddingTop),
          paddingBottom: parseFloat(style.paddingBottom),
          trackWidth: track.getBoundingClientRect().width,
          trackHeight: track.getBoundingClientRect().height,
          fillPercentage: parseFloat(fill.style.width),
          borderTop: getComputedStyle(row.parentElement!).borderTopWidth,
          marginTop: parseFloat(getComputedStyle(row.parentElement!).marginTop),
        };
      }),
    };
  });
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);
  expect(layout.rows[0].fillPercentage).toBeCloseTo((CATEGORY_AMOUNTS[0] / TOTAL_AMOUNT) * 100, 4);
  const identityWidths = layout.rows.map((row) => row.identityWidth);
  expect(Math.max(...identityWidths) - Math.min(...identityWidths)).toBeLessThan(1);
  if (layout.width > layout.rootSize * 22) {
    expect(identityWidths[0]).toBeCloseTo(layout.rootSize * 12, 0);
  }
  for (const [index, row] of layout.rows.entries()) {
    expect(row.height).toBeLessThanOrEqual(index === 0 ? 90 : 68);
    expect(row.paddingTop).toBeLessThanOrEqual(8);
    expect(row.paddingBottom).toBeLessThanOrEqual(8);
    expect(row.trackWidth).toBeGreaterThanOrEqual(row.width - 1);
    expect(row.trackHeight).toBeLessThanOrEqual(4);
    expect(row.amountFits).toBe(true);
    expect(row.borderTop).toBe("0px");
    expect(row.marginTop).toBeCloseTo(index === 0 ? 0 : layout.rootSize * 0.5, 1);
  }
};

for (const width of [280, 390, 820, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`keeps spending breakdowns compact and readable at ${width}px in ${theme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate((value) => localStorage.setItem("split-slate-theme", value), theme);
      const main = page.locator("#main-content");
      for (const { route, count } of [
        { route: "/groups/trip/analytics", count: 8 },
        { route: "/analytics", count: 8 },
        { route: "/groups/trip", count: 6 },
        { route: "/dashboard", count: 6 },
      ]) {
        await page.goto(route);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const list = main.locator(".category-spending-list");
        await expectCompactBreakdown(list, count);
        expect(await main.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(
          await main.evaluate((element) => element.clientWidth),
        );
        if (count === 8) {
          await expect(main.locator(".category-spending-summary")).toHaveCSS(
            "border-bottom-width",
            "0px",
          );
          await expect(main.locator(".category-spending-total")).toHaveText("₹1,04,500.01");
          await expect(main.getByText("Largest category", { exact: true })).toBeVisible();
          await expect(main.locator(".category-spending-top-name")).toHaveAttribute(
            "title",
            CATEGORY_NAMES[0],
          );
          const tiny = list.locator(".category-spending-item").last();
          await tiny.scrollIntoViewIfNeeded();
          await expect(tiny.locator(".category-spending-amount")).toHaveText("₹0.01");
          await expect(tiny.locator(".category-spending-share")).toHaveText("<0.1%");
          const percentage = await tiny.locator(".category-spending-fill").evaluate(
            (element) => parseFloat((element as HTMLElement).style.width),
          );
          expect(percentage).toBeGreaterThan(0);
          expect(percentage).toBeLessThan(0.001);
        }
        if (route === "/analytics") await expect(list.getByRole("link")).toHaveCount(0);
        if (route === "/groups/trip/analytics" && width < 768) {
          await expect(main.getByRole("link", { name: "Add expense", exact: true })).toHaveCount(0);
        }
      }
    });
  }
}

test("preserves preview navigation, group drill-down, and non-Analytics mobile actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 900 });
  await page.goto("/dashboard");
  await page.locator(".category-spending-list").getByRole("link").first().click();
  await expect(page).toHaveURL(/\/analytics$/u);
  await page.goto("/groups/trip");
  await page.locator(".category-spending-list").getByRole("link").first().click();
  await expect(page).toHaveURL(/\/groups\/trip\/analytics$/u);
  const food = page.locator(".category-spending-list").getByRole("link", { name: /Food & Dining/u });
  await food.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/groups\/trip\/expenses\?categoryIds=category-1$/u);
  await expect(page.getByRole("list", { name: "Expenses", exact: true })).toContainText(
    "Trip expense 1",
  );

  await page.setViewportSize({ width: 390, height: 900 });
  for (const route of ["/groups/trip", "/groups/trip/expenses", "/groups/trip/balances"]) {
    await page.goto(route);
    await expect(page.locator(".group-page > a.mobile-cta")).toBeVisible();
  }
  await page.goto("/groups/trip/analytics");
  await expect(page.locator(".group-page > a.mobile-cta")).toHaveCount(0);
});

test("preserves empty states and the mixed-currency boundary", async ({ page }) => {
  await page.goto("/analytics");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.groups.put({
      id: "other",
      name: "Other Trip",
      currency: "USD",
      icon: "travel-and-places/camping-3d.png",
      createdAt: 2,
      frequentPayerIds: [],
    });
  });
  await page.reload();
  await expect(page.getByText("Multiple currencies in use", { exact: true })).toBeVisible();
  await expect(page.locator(".category-spending-list")).toHaveCount(0);
  await page.goto("/groups/trip/analytics");
  await expect(page.locator(".category-spending-total")).toHaveText("₹1,04,500.01");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.expenses.clear();
    await db.groups.delete("other");
  });
  await page.reload();
  await expect(page.getByText("Nothing to chart yet", { exact: true })).toBeVisible();
  await expect(page.locator(".category-spending-list")).toHaveCount(0);
  await page.goto("/groups/trip");
  await expect(page.getByRole("region", { name: "Group spending by category" })).toContainText(
    "No spending yet.",
  );
  await page.goto("/analytics");
  await expect(page.getByText("Nothing to chart yet", { exact: true })).toBeVisible();
});
