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
