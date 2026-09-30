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

test("resets the persistent content pane on every page navigation", async ({ page }) => {
  const main = page.locator("#main-content");
  const navigation = page
    .getByRole("navigation", { name: "Group navigation" })
    .or(page.getByRole("navigation", { name: "Bottom navigation" }));

  await expect
    .poll(() => main.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  await navigation.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByRole("heading", { name: "Recent expenses (32)" })).toBeVisible();
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);

  await navigation.getByRole("link", { name: "Expenses" }).click();
  await expect(page.getByRole("heading", { name: "All expenses" })).toBeVisible();
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);

  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Recent expenses (32)" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "All expenses" })).toBeVisible();
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBe(0);
});
