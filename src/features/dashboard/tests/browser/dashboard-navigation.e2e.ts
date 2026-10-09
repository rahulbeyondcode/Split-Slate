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
    await db.localUser.put({ id: "self", name: "Rahul", icon: "profile-pic/fox-3d.png" });
    await db.people.bulkPut([
      { id: "self", name: "Rahul", icon: "profile-pic/fox-3d.png" },
      { id: "friend", name: "Sam", icon: "profile-pic/panda-3d.png" },
    ]);
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      icon: "travel-and-places/camping-3d.png",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "b", groupId: "trip", personId: "friend" },
    ]);
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "food-and-drinks/hamburger-3d.png",
      isActive: true,
    });
    await db.expenses.put({
      expenseId: "dinner",
      groupId: "trip",
      expenseName: "Dinner",
      categoryId: "food",
      createdBy: "a",
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "a", amount: 2000 }],
        owes: [
          { memberId: "a", amount: 1000 },
          { memberId: "b", amount: 1000 },
        ],
      },
    });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/dashboard");
});

test("aligns the profile image with the dashboard greeting", async ({ page }) => {
  const heading = page.getByRole("heading", { level: 1, name: /Rahul/u });
  const textBox = await heading.locator("span").boundingBox();
  const iconBox = await heading.locator("img").boundingBox();
  expect(textBox).not.toBeNull();
  expect(iconBox).not.toBeNull();
  expect(
    Math.abs(textBox!.y + textBox!.height / 2 - (iconBox!.y + iconBox!.height / 2)),
  ).toBeLessThan(3);
});

test("keeps mobile destination titles and subtitles visible at the bottom of each page", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile footer destinations only");
  await page.setViewportSize({ width: 390, height: 320 });

  for (const [route, title] of [
    ["/activity", "Activity"],
    ["/settings", "Settings"],
  ]) {
    await page.goto(route);
    const header = page.locator(".mobile-sticky-page > header");
    const heading = header.getByRole("heading", { level: 1, name: title });
    const subtitle = header.locator(".soft-caption");
    await expect(heading).toBeVisible();
    await expect(subtitle).toBeVisible();
    const initialTop = (await heading.boundingBox())!.y;

    await page.locator("#main-content").evaluate((main) => {
      main.scrollTop = main.scrollHeight;
    });
    await expect
      .poll(() => page.locator("#main-content").evaluate((main) => main.scrollTop))
      .toBeGreaterThan(0);
    await expect(heading).toBeInViewport();
    await expect(subtitle).toBeInViewport();
    expect(Math.abs((await heading.boundingBox())!.y - initialTop)).toBeLessThan(2);
  }
});

test("keeps app-wide Back and title visible while the subtitle and content scroll", async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: isMobile ? 390 : 1280, height: 320 });

  for (const [route, title] of [
    ["/unsettled", "Unsettled"],
    ["/analytics", isMobile ? "Spending by category" : "Analytics"],
  ]) {
    await page.goto(route);
    const pageContent = page.locator(".dashboard-detail-page");
    const back = pageContent.getByRole("button", { name: "Back", exact: true });
    const heading = pageContent.getByRole("heading", { level: 1, name: title });
    const subtitle = pageContent.locator(":scope > .soft-caption");
    await pageContent.locator(":scope > .surface").last().evaluate((surface) => {
      surface.style.minHeight = "700px";
    });
    const initialBackTop = (await back.boundingBox())!.y;
    const initialHeadingTop = (await heading.boundingBox())!.y;
    await expect(subtitle).toBeInViewport();

    await page.locator("#main-content").evaluate((main) => {
      main.scrollTop = main.scrollHeight;
    });
    await expect
      .poll(() => page.locator("#main-content").evaluate((main) => main.scrollTop))
      .toBeGreaterThan(0);
    await expect(back).toBeInViewport();
    await expect(heading).toBeInViewport();
    await expect(subtitle).not.toBeInViewport();
    expect(Math.abs((await back.boundingBox())!.y - initialBackTop)).toBeLessThan(2);
    expect(Math.abs((await heading.boundingBox())!.y - initialHeadingTop)).toBeLessThan(2);
  }
});

test("opens Analytics from the mobile dashboard chart and returns via Back", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile dashboard navigation only");
  await page.setViewportSize({ width: 667, height: 800 });
  const footer = page.getByRole("navigation", { name: "Bottom navigation" });
  await expect(footer.getByRole("link", { name: "Analytics" })).toHaveCount(0);
  await expect(footer.getByRole("link")).toHaveCount(5);

  const unsettled = page.locator(".dashboard-lower .surface").filter({
    has: page.getByRole("heading", { name: "Unsettled balances" }),
  });
  await expect(unsettled.getByText("Across all groups")).toBeVisible();

  const chart = page.locator(".dashboard-lower .surface").filter({
    has: page.getByRole("heading", { name: "Spending by category" }),
  });
  await expect(chart).toBeVisible();
  await expect(chart.getByText("All groups · ever")).toBeVisible();
  await chart.getByRole("link", { name: "View all" }).click();
  await expect(page).toHaveURL(/\/analytics$/u);
  const dashboardBack = page.getByRole("button", { name: "Back", exact: true });
  await expect(dashboardBack).toBeVisible();
  await dashboardBack.click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  await chart.getByRole("link", { name: "Spending by category" }).click();
  await expect(page).toHaveURL(/\/analytics$/u);
  await expect(page.getByRole("heading", { name: "Spending by category" })).toBeVisible();
  await expect(page.getByText("Every category across your groups, all time")).toBeVisible();
  await dashboardBack.click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  await chart.getByRole("link", { name: /Food/u }).click();
  await expect(page).toHaveURL(/\/analytics$/u);
  await dashboardBack.click();
  await expect(page).toHaveURL(/\/dashboard$/u);
});

test("returns from Unsettled through history and falls back after direct entry", async ({
  page,
  isMobile,
}) => {
  if (isMobile) {
    await page
      .getByRole("navigation", { name: "Bottom navigation" })
      .getByRole("link", { name: "Unsettled" })
      .click();
  } else {
    const preview = page.locator(".dashboard-lower .surface").filter({
      has: page.getByRole("heading", { name: "Unsettled balances" }),
    });
    await preview.getByRole("link", { name: /View all/u }).click();
  }
  await expect(page).toHaveURL(/\/unsettled$/u);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  await page.goto("/unsettled");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
});

test("app-wide Analytics Back falls back to Dashboard after direct entry", async ({ page }) => {
  await page.goto("/analytics");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
});

test("places the purple New group action at the center of the mobile dashboard footer", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile dashboard navigation only");
  await page.setViewportSize({ width: 320, height: 800 });
  const footer = page.getByRole("navigation", { name: "Bottom navigation" });
  await expect(footer.getByRole("link")).toHaveText([
    "Groups",
    "Activity",
    "New group",
    "Unsettled",
    "Settings",
  ]);
  await expect(page.locator(".dashboard-page .mobile-cta")).toHaveCount(0);
  const createLink = footer.getByRole("link", { name: "New group" });
  await expect(createLink).toHaveClass(/mobile-nav-create/u);
  await expect(createLink.locator(".nav-icon")).toHaveCSS("color", "rgb(255, 255, 255)");
  await createLink.click();
  await expect(page).toHaveURL(/\/groups\/new$/u);
  await expect(page.getByRole("heading", { name: "New group" })).toBeVisible();
  await expect(createLink).toHaveAttribute("aria-current", "page");

  await page.goto("/groups/trip");
  await expect(footer.getByRole("link", { name: "New group" })).toHaveCount(0);
});

test("keeps the dashboard banner and both group balance states readable on narrow mobiles", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile dashboard layout only");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.expenses.update("dinner", {
      transactions: {
        paid: [{ memberId: "a", amount: 18996120 }],
        owes: [
          { memberId: "a", amount: 9498060 },
          { memberId: "b", amount: 9498060 },
        ],
      },
    });
    await db.groups.put({
      id: "lunch",
      name: "Lunch group with a longer name",
      icon: "food-and-drinks/hamburger-3d.png",
      currency: "INR",
      createdAt: 2,
      frequentPayerIds: [],
    });
    await db.members.bulkPut([
      { id: "c", groupId: "lunch", personId: "self" },
      { id: "d", groupId: "lunch", personId: "friend" },
    ]);
    await db.categories.put({
      id: "lunch-food",
      groupId: "lunch",
      name: "Food",
      icon: "food-and-drinks/hamburger-3d.png",
      isActive: true,
    });
    await db.expenses.put({
      expenseId: "meal",
      groupId: "lunch",
      expenseName: "Meal",
      categoryId: "lunch-food",
      createdBy: "d",
      createdAt: 2,
      when: 2,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "d", amount: 246913578 }],
        owes: [
          { memberId: "c", amount: 123456789 },
          { memberId: "d", amount: 123456789 },
        ],
      },
    });
  });
  await page.reload();

  for (const width of [320, 393]) {
    await page.setViewportSize({ width, height: 800 });
    const cards = page.locator(".dashboard-page .group-card");
    await expect(cards).toHaveCount(2);
    await expect(
      cards.filter({ hasText: "↓ collect" }).locator(".dashboard-group-status"),
    ).toBeVisible();
    await expect(
      cards.filter({ hasText: "↑ settle" }).locator(".dashboard-group-status"),
    ).toBeVisible();
    await expect(
      cards.filter({ hasText: "↓ collect" }).locator(".dashboard-group-amount"),
    ).toContainText("+₹");
    await expect(
      cards.filter({ hasText: "↑ settle" }).locator(".dashboard-group-amount"),
    ).toContainText("−₹");
    await expect(page.locator(".dashboard-page .hero-box")).toHaveCount(2);

    const layout = await page.evaluate(() => {
      const banner = document.querySelector(".dashboard-page .hero")!;
      const cards = [...document.querySelectorAll(".dashboard-page .group-card")];
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        bannerWidth: banner.getBoundingClientRect().width,
        boxes: [...banner.querySelectorAll(".hero-box")].map(
          (box) => box.getBoundingClientRect().width,
        ),
        cards: cards.map((card) => {
          const amount = card.querySelector(".dashboard-group-amount")!;
          const status = card.querySelector(".dashboard-group-status")!;
          const cardBox = card.getBoundingClientRect();
          const amountBox = amount.getBoundingClientRect();
          const statusBox = status.getBoundingClientRect();
          return {
            amountWithinCard: amountBox.left >= cardBox.left && amountBox.right <= cardBox.right,
            statusWithinCard: statusBox.left >= cardBox.left && statusBox.right <= cardBox.right,
            notOverlapping: amountBox.right <= statusBox.left || amountBox.bottom <= statusBox.top,
            amountUnbroken: getComputedStyle(amount).whiteSpace === "nowrap",
            statusUnbroken: getComputedStyle(status).whiteSpace === "nowrap",
            amountFullyVisible: amount.scrollWidth <= amount.clientWidth,
            status: status.textContent?.trim(),
          };
        }),
      };
    });
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.boxes).toHaveLength(2);
    expect(layout.boxes.every((boxWidth) => boxWidth > layout.bannerWidth / 3)).toBe(true);
    for (const card of layout.cards) {
      expect(card.amountWithinCard).toBe(true);
      expect(card.statusWithinCard).toBe(true);
      expect(card.notOverlapping).toBe(true);
      expect(card.amountUnbroken).toBe(true);
      expect(card.statusUnbroken).toBe(true);
    }
    expect(layout.cards.find((card) => card.status === "↓ collect")?.amountFullyVisible).toBe(true);
  }
});

test("wraps desktop group cards without breaking collect or settle status", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop dashboard layout only");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.groups.bulkPut(
      [2, 3, 4, 5].map((number) => ({
        id: `group-${number}`,
        name: `Group ${number}`,
        icon: "travel-and-places/camping-3d.png",
        currency: "INR",
        createdAt: number,
        frequentPayerIds: [],
      })),
    );
    await db.members.bulkPut([
      { id: "group-2-self", groupId: "group-2", personId: "self" },
      { id: "group-2-friend", groupId: "group-2", personId: "friend" },
    ]);
    await db.categories.put({
      id: "group-2-food",
      groupId: "group-2",
      name: "Food",
      icon: "food-and-drinks/hamburger-3d.png",
      isActive: true,
    });
    await db.expenses.update("dinner", {
      transactions: {
        paid: [{ memberId: "a", amount: 246913578000 }],
        owes: [
          { memberId: "a", amount: 123456789000 },
          { memberId: "b", amount: 123456789000 },
        ],
      },
    });
    await db.expenses.put({
      expenseId: "group-2-meal",
      groupId: "group-2",
      expenseName: "Meal",
      categoryId: "group-2-food",
      createdBy: "group-2-friend",
      createdAt: 2,
      when: 2,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "group-2-friend", amount: 18996120 }],
        owes: [
          { memberId: "group-2-self", amount: 9498060 },
          { memberId: "group-2-friend", amount: 9498060 },
        ],
      },
    });
  });
  await page.reload();

  for (const width of [768, 868, 894, 1079, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const cards = page.locator(".dashboard-page .group-card");
    await expect(cards).toHaveCount(5);
    await expect(page.locator(".dashboard-page .hero")).toHaveCSS("padding", "28px 32px");

    const layout = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".dashboard-page .group-card")];
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        rows: cards.map((card) => card.getBoundingClientRect().top),
        cards: cards.map((card) => {
          const amount = card.querySelector(".dashboard-group-amount")!;
          const status = card.querySelector(".dashboard-group-status")!;
          const cardBox = card.getBoundingClientRect();
          const amountBox = amount.getBoundingClientRect();
          const statusBox = status.getBoundingClientRect();
          return {
            direction: getComputedStyle(card).flexDirection,
            amountFontSize: getComputedStyle(amount).fontSize,
            amountUnbroken: getComputedStyle(amount).whiteSpace === "nowrap",
            statusUnbroken: getComputedStyle(status).whiteSpace === "nowrap",
            amountWithinCard: amountBox.left >= cardBox.left && amountBox.right <= cardBox.right,
            amountFullyVisible: amount.scrollWidth <= amount.clientWidth,
            statusWithinCard: statusBox.left >= cardBox.left && statusBox.right <= cardBox.right,
            notOverlapping: amountBox.right <= statusBox.left || amountBox.bottom <= statusBox.top,
            statusWrapped: statusBox.top >= amountBox.bottom,
            status: status.textContent?.trim(),
          };
        }),
      };
    });
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.rows[3]).toBeGreaterThan(layout.rows[0]);
    expect(layout.rows.filter((top) => top === layout.rows[0]).length).toBeLessThanOrEqual(3);
    if (width === 768) expect(layout.rows[1]).toBeGreaterThan(layout.rows[0]);
    if (width === 868 || width === 894 || width === 1079) {
      expect(layout.rows[1]).toBe(layout.rows[0]);
      expect(layout.rows[2]).toBeGreaterThan(layout.rows[0]);
    }
    if (width === 1920) expect(layout.rows[2]).toBe(layout.rows[0]);
    if (width === 1280) expect(layout.cards.some((card) => card.statusWrapped)).toBe(true);
    expect(layout.cards.some((card) => card.status === "↓ collect")).toBe(true);
    expect(layout.cards.some((card) => card.status === "↑ settle")).toBe(true);
    expect(layout.cards.find((card) => card.status === "↑ settle")?.amountFullyVisible).toBe(true);
    for (const card of layout.cards) {
      expect(card.direction).toBe("column");
      expect(card.amountFontSize).toBe("22px");
      expect(card.amountUnbroken).toBe(true);
      expect(card.statusUnbroken).toBe(true);
      expect(card.amountWithinCard).toBe(true);
      expect(card.statusWithinCard).toBe(true);
      expect(card.notOverlapping).toBe(true);
    }
  }
});

test("labels the unsettled destination as a navigable link", async ({ page, isMobile }) => {
  test.skip(isMobile, "The dashboard's unsettled preview is desktop-only");
  const link = page.getByRole("link", { name: "View all (1)" });
  await expect(link.locator("svg.ui-icon")).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/unsettled$/u);
});

test("keeps group import available from app settings after creating a group", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("link", { name: "Import group" }).click();
  await expect(page).toHaveURL(/\/import$/u);
});
