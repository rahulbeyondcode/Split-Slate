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

test("scrolls only the expense list and resets the pane on navigation", async ({ page }) => {
  const main = page.locator("#main-content");
  const ledger = page.locator(".expense-ledger-list");
  const header = page.locator(".group-page-header");
  const navigation = page
    .getByRole("navigation", { name: "Group navigation" })
    .or(page.getByRole("navigation", { name: "Bottom navigation" }));

  await expect
    .poll(() => ledger.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await ledger.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => ledger.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);
  await expect(header).toBeInViewport();

  await navigation.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByRole("heading", { name: "Recent expenses (32)" })).toBeVisible();
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);

  await navigation.getByRole("link", { name: "Expenses" }).click();
  await expect(page.getByRole("heading", { name: "All expenses" })).toBeVisible();
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);

  await ledger.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Recent expenses (32)" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "All expenses" })).toBeVisible();
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);
});

test("keeps category, tag, and member lists inside their own cards", async ({ page }) => {
  await page.goto("/groups/trip/categories");
  const main = page.locator("#main-content");
  const header = page.locator(".group-page-header");
  const cards = page.locator(".group-management-grid > .surface");
  for (const card of await cards.all()) {
    await expect
      .poll(() => card.evaluate((element) => element.scrollHeight <= element.clientHeight))
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
    await expect
      .poll(() => card.evaluate((element) => element.scrollHeight))
      .toBeGreaterThan(await card.evaluate((element) => element.clientHeight));
    await card.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect.poll(() => card.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  }
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);
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
