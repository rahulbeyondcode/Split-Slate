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
    await db.localUser.put({ id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" });
    await db.people.put({ id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" });
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      icon: "travel-and-places/camping-3d.png",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.put({ id: "a", groupId: "trip", personId: "self" });
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "food-and-drinks/hamburger-3d.png",
      isActive: true,
    });
    await db.expenses.bulkPut(
      Array.from({ length: 32 }, (_, index) => ({
        expenseId: `expense-${index}`,
        groupId: "trip",
        expenseName: `Expense ${index}`,
        categoryId: "food",
        createdBy: "a",
        createdAt: index + 1,
        when: index + 1,
        splitType: "equal" as const,
        splitMeta: [],
        tagIds: [],
        attachmentIds: [],
        transactions: {
          paid: [{ memberId: "a", amount: 100 }],
          owes: [{ memberId: "a", amount: 100 }],
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
  await page.goto("/groups/trip/expenses");
});

test("uses only the outer expense-page scroll and resets it on navigation", async ({ page }) => {
  const main = page.locator("#main-content");
  const ledger = page.locator(".expense-ledger-list");
  const header = page.locator(".group-page-header");
  const title = page.locator(".expense-ledger > header");
  const toolbar = page.getByRole("form", { name: "Expense filters" });
  const pageBackground = await header.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  for (const sticky of [title, toolbar]) {
    await expect(sticky).toHaveCSS("background-color", pageBackground);
    await expect(sticky).toHaveCSS("opacity", "1");
  }
  expect(await toolbar.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
  const navigation = page
    .getByRole("navigation", { name: "Group navigation" })
    .or(page.getByRole("navigation", { name: "Bottom navigation" }));

  const banner = page.getByRole("region", { name: "Expense insights" });
  await expect(ledger).toHaveCSS("overflow-y", "visible");
  await expect(ledger).toHaveCSS("max-height", "none");
  await expect
    .poll(() => main.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await expect
    .poll(() => ledger.evaluate((element) => element.scrollHeight <= element.clientHeight + 1))
    .toBe(true);
  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight / 2;
  });
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(title).toBeInViewport();
  await expect(toolbar).toBeInViewport();
  const groupBottom = (await header.boundingBox())!.y + (await header.boundingBox())!.height;
  const titleBox = (await title.boundingBox())!;
  const toolbarBox = (await toolbar.boundingBox())!;
  expect(Math.abs(titleBox.y - groupBottom)).toBeLessThan(3);
  expect(Math.abs(toolbarBox.y - (titleBox.y + titleBox.height))).toBeLessThan(3);
  expect((await banner.boundingBox())!.y + (await banner.boundingBox())!.height).toBeLessThan(
    toolbarBox.y,
  );
  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(
    ledger.getByRole("list", { name: "Expenses" }).locator(":scope > li").last(),
  ).toBeInViewport();
  const pageScroll = await main.evaluate((element) => element.scrollTop);
  await ledger.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(await ledger.evaluate((element) => element.scrollTop)).toBe(0);
  expect(await main.evaluate((element) => element.scrollTop)).toBe(pageScroll);
  await expect(header).toBeInViewport();

  await navigation.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByRole("heading", { name: "Recent transactions" })).toBeVisible();
  await expect(
    page.locator(".recent-activity-card").getByRole("link", { name: "View all (32)" }),
  ).toBeVisible();
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);

  await navigation.getByRole("link", { name: "Expenses" }).click();
  await expect(page.getByRole("heading", { name: "Expenses and payments" })).toBeVisible();
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);

  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Recent transactions" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Expenses and payments" })).toBeVisible();
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);
});

test("tablet expenses use outer-only scrolling for long and short filtered lists", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Tablet-sized viewport in the desktop project");
  await page.setViewportSize({ width: 820, height: 800 });
  const main = page.locator("#main-content");
  const ledger = page.locator(".expense-ledger-list");
  const rows = ledger.getByRole("list", { name: "Expenses" }).locator(":scope > li");
  await expect(rows).toHaveCount(32);
  await expect
    .poll(() => ledger.evaluate((element) => element.scrollHeight <= element.clientHeight + 1))
    .toBe(true);
  await expect
    .poll(() => main.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await expect(ledger).toHaveCSS("overflow-y", "visible");
  await expect(ledger).toHaveCSS("max-height", "none");
  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(rows.last()).toBeInViewport();
  const banner = page.getByRole("region", { name: "Expense insights" });
  const toolbar = page.getByRole("form", { name: "Expense filters" });
  expect((await banner.boundingBox())!.y + (await banner.boundingBox())!.height).toBeLessThan(
    (await toolbar.boundingBox())!.y,
  );

  await page.getByRole("searchbox", { name: "Search expenses" }).fill("Expense 31");
  await expect(rows).toHaveCount(1);
  await expect
    .poll(() => ledger.evaluate((element) => element.scrollHeight <= element.clientHeight + 1))
    .toBe(true);
  expect((await ledger.boundingBox())!.height).toBeLessThanOrEqual(
    (await rows.first().boundingBox())!.height + 4,
  );
});

for (const width of [320, 820, 1440]) {
  test(`scrolls mixed expense/payment history only in the outer pane at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      await db.people.put({ id: "friend", name: "Bea", icon: "🐻" });
      await db.members.put({ id: "b", groupId: "trip", personId: "friend" });
      await db.settlements.bulkPut(
        Array.from({ length: 20 }, (_, index) => ({
          id: `payment-${index}`,
          groupId: "trip",
          kind: "payment" as const,
          fromMemberId: "a",
          toMemberId: "b",
          recordedBy: "a",
          amount: 100,
          when: index + 100,
          createdAt: index + 100,
          tagIds: [],
        })),
      );
    });
    await page.goto("/groups/trip/expenses?sort=oldest");
    const main = page.locator("#main-content");
    const ledger = page.locator(".expense-ledger-list");
    const rows = ledger.getByRole("list", { name: "Expenses" }).locator(":scope > li");
    await expect(rows).toHaveCount(52);
    await expect(ledger.locator(".settlement-entry")).toHaveCount(20);
    await expect(ledger).toHaveCSS("overflow-y", "visible");
    await expect(ledger).toHaveCSS("max-height", "none");
    expect(await ledger.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(
      true,
    );
    await main.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(rows.last().locator(".settlement-entry")).toBeInViewport();
    expect(await ledger.evaluate((element) => element.scrollTop)).toBe(0);
  });
}

test("shows full expense titles above amounts in mobile list and overview", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile expense rows only");
  await page.setViewportSize({ width: 320, height: 800 });
  const name = "A very long expense title for our entire weekend adventure and everyone involved";
  await page.evaluate(async (expenseName) => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.expenses.update("expense-31", { expenseName });
  }, name);

  for (const route of ["/groups/trip/expenses", "/groups/trip"]) {
    await page.goto(route);
    const row = page.locator(".expense-entry-link").filter({ hasText: name }).first();
    const title = row.locator(".expense-entry-title");
    const amount = row.locator(".expense-entry-amount");
    await expect(title).toHaveText(name);
    if (route.endsWith("/expenses")) {
      const category = row.locator(".expense-entry-category");
      await expect(category).toBeVisible();
      await expect(category).toContainText("Food");
    }
    await expect(title).toHaveCSS("white-space", "normal");
    const titleBox = (await title.boundingBox())!;
    const amountBox = (await amount.boundingBox())!;
    expect(titleBox.height).toBeGreaterThan(36);
    expect(amountBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height);
    expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(
      (await row.boundingBox())!.x + (await row.boundingBox())!.width + 1,
    );
  }
});

test("keeps category, tag, and member lists inside their own cards", async ({ page, isMobile }) => {
  await page.goto("/groups/trip/categories");
  const main = page.locator("#main-content");
  const header = page.locator(".group-page-header");
  const cards = page.locator(".group-management-grid > .management-section > .surface");
  for (const card of await cards.all()) {
    const scroller = isMobile ? card.locator(".management-card-content") : card;
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollHeight <= element.clientHeight))
      .toBe(true);
  }
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.bulkPut(
      Array.from({ length: 20 }, (_, index) => ({
        id: `category-${index}`,
        groupId: "trip",
        name: `Category ${index}`,
        icon: "🍽️",
        isActive: true,
      })),
    );
    await db.tags.bulkPut(
      Array.from({ length: 20 }, (_, index) => ({
        id: `tag-${index}`,
        groupId: "trip",
        name: `Tag ${index}`,
        color: "#abcdef",
      })),
    );
    await db.people.bulkPut(
      Array.from({ length: 20 }, (_, index) => ({
        id: `person-${index}`,
        name: `Person ${index}`,
        icon: "🦊",
      })),
    );
    await db.members.bulkPut(
      Array.from({ length: 20 }, (_, index) => ({
        id: `member-${index}`,
        groupId: "trip",
        personId: `person-${index}`,
      })),
    );
  });
  await page.goto("/groups/trip/categories");
  await page.evaluate(() => window.scrollTo(0, 10000));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  for (const card of await cards.all()) {
    const scroller = isMobile ? card.locator(".management-card-content") : card;
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollHeight))
      .toBeGreaterThan(await scroller.evaluate((element) => element.clientHeight));
    await scroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  }
  if (isMobile) {
    await main.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  } else {
    await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);
  }
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(header).toBeInViewport();

  await page.goto("/groups/trip/members");
  const members = page.locator(".member-list-scroll");
  await expect
    .poll(() => members.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await members.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => members.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(header).toBeInViewport();
});

test("lets mobile Categories & Tags page scroll around two 50vh cards with headers above them", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile category and tag layout only");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.bulkPut(
      Array.from({ length: 20 }, (_, index) => ({
        id: `category-${index}`,
        groupId: "trip",
        name: `Category ${index}`,
        icon: "🍽️",
        isActive: true,
      })),
    );
    await db.tags.bulkPut(
      Array.from({ length: 20 }, (_, index) => ({
        id: `tag-${index}`,
        groupId: "trip",
        name: `Tag ${index}`,
        color: "#abcdef",
      })),
    );
  });
  await page.goto("/groups/trip/categories");

  const main = page.locator("#main-content");
  const cards = page.locator(".group-management-grid > .management-section > .surface");
  const headings = page.locator(".management-card-header");
  await expect(cards).toHaveCount(2);
  await expect
    .poll(() => main.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  for (const card of await cards.all()) {
    const height = (await card.boundingBox())!.height;
    expect(Math.abs(height - 400)).toBeLessThan(2);
    const scroller = card.locator(".management-card-content");
    await scroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const cardHeader = card.locator("..").locator(".management-card-header");
    await expect(cardHeader).toHaveCSS("position", "static");
    expect((await scroller.boundingBox())!.y).toBeGreaterThanOrEqual(
      (await cardHeader.boundingBox())!.y + (await cardHeader.boundingBox())!.height,
    );
    await expect.poll(() => card.evaluate((element) => element.scrollTop)).toBe(0);

    const row = card.locator("li.management-entry").first();
    const identity = (await row.locator(".management-entry-identity").boundingBox())!;
    const actions = (await row.locator(".management-entry-actions").boundingBox())!;
    expect(actions.y).toBeGreaterThanOrEqual(identity.y + identity.height);
    const buttons = await row.locator(".management-entry-actions button").all();
    const widths = await Promise.all(
      buttons.map(async (button) => (await button.boundingBox())!.width),
    );
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeGreaterThanOrEqual(
      (await row.boundingBox())!.width * 0.75,
    );
    const buttonRadius = await page.evaluate(
      () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.75,
    );
    await expect(buttons[0]).toHaveCSS("border-radius", `${buttonRadius}px`);
  }

  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator(".group-page-header")).toBeInViewport();
  await expect(headings.nth(0)).not.toBeInViewport();
  await expect(headings.nth(1).getByRole("button", { name: "Add tag" })).toBeInViewport();
});
