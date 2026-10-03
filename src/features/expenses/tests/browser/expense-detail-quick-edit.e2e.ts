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
    await db.localUser.put({ id: "self", name: "Rahul", icon: "🦊" });
    await db.people.put({ id: "self", name: "Rahul", icon: "🦊" });
    await db.groups.put({
      id: "trip",
      name: "Trip",
      currency: "INR",
      icon: "🏕️",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.put({ id: "a", groupId: "trip", personId: "self" });
    await db.categories.bulkPut([
      { id: "food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
      { id: "travel", groupId: "trip", name: "Travel", icon: "🚗", isActive: true },
      { id: "old", groupId: "trip", name: "Old", icon: "📦", isActive: false },
    ]);
    await db.tags.put({ id: "holiday", groupId: "trip", name: "Holiday", color: "#123456" });
    await db.expenses.put({
      expenseId: "dinner",
      groupId: "trip",
      expenseName: "Dinner",
      categoryId: "food",
      createdBy: "a",
      createdAt: new Date(2026, 0, 11, 8, 0).getTime(),
      when: new Date(2026, 0, 12, 15, 7).getTime(),
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "a", amount: 10000 }],
        owes: [{ memberId: "a", amount: 10000 }],
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
  await page.goto("/groups/trip/expenses/dinner");
});

test("stacks Paid by above Split on mobile without changing desktop columns", async ({
  page,
  isMobile,
}) => {
  const paidBy = (await page.getByRole("region", { name: "Paid by" }).boundingBox())!;
  const split = (await page.getByRole("region", { name: "Split breakdown" }).boundingBox())!;
  if (isMobile) {
    expect(split.y).toBeGreaterThanOrEqual(paidBy.y + paidBy.height);
  } else {
    expect(Math.abs(split.y - paidBy.y)).toBeLessThan(2);
  }
});

test("quick-saves category and tags, including a newly created tag", async ({ page }) => {
  const hero = page.locator(".hero");
  await expect(hero).toContainText("Date: 12-Jan-2026");
  await expect(hero).toContainText("Time: 03:07 PM");
  await expect(page.getByText("Recorded by Rahul · 11-Jan-2026")).toBeVisible();
  await expect(page.getByRole("region", { name: "Paid by" })).not.toContainText("Recorded by");

  await page.getByRole("button", { name: "Change category" }).click();
  await page
    .locator('[popover][aria-label="Choose category"]')
    .getByRole("button", { name: /Travel/u })
    .click();
  await expect(page.getByRole("button", { name: "Change category" })).toContainText("Travel");

  await page.getByRole("button", { name: "Add tags" }).click();
  const chooser = page.locator('[popover][aria-label="Choose tags"]');
  await chooser.getByRole("checkbox", { name: "Holiday" }).check();
  await expect(hero.getByRole("list", { name: "Tags" })).toContainText("Holiday");
  await chooser.getByRole("button", { name: "Create new tag" }).click();
  await page.getByRole("textbox", { name: "Tag name" }).fill("Weekend");
  await page.getByRole("button", { name: "Create tag", exact: true }).click();
  await expect(hero.getByRole("list", { name: "Tags" })).toContainText("Weekend");

  await page.reload();
  await expect(page.getByRole("button", { name: "Change category" })).toContainText("Travel");
  await expect(page.getByRole("list", { name: "Tags" })).toContainText("Holiday");
  await expect(page.getByRole("list", { name: "Tags" })).toContainText("Weekend");
  await page.getByRole("button", { name: "Add tags" }).click();
  await page
    .locator('[popover][aria-label="Choose tags"]')
    .getByRole("checkbox", { name: "Holiday" })
    .uncheck();
  await expect(page.getByRole("list", { name: "Tags" })).not.toContainText("Holiday");
});

test("shows the add-tags control even without existing tags and keeps inactive categories out", async ({
  page,
}) => {
  await expect(page.getByRole("button", { name: "Add tags" })).toBeVisible();
  await page.getByRole("button", { name: "Change category" }).click();
  await expect(
    page.locator('[popover][aria-label="Choose category"]').getByText("Old"),
  ).toHaveCount(0);
});
