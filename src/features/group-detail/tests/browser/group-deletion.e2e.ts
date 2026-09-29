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
    await db.people.bulkPut([
      { id: "self", name: "Amy", icon: "🦊" },
      { id: "friend", name: "Bea", icon: "🐻" },
    ]);
    await db.groups.bulkPut([
      {
        id: "trip",
        name: "Trip",
        icon: "🏕️",
        currency: "INR",
        createdAt: 1,
        frequentPayerIds: ["a"],
      },
      {
        id: "home",
        name: "Home",
        icon: "🏡",
        currency: "INR",
        createdAt: 2,
        frequentPayerIds: ["h"],
      },
    ]);
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "b", groupId: "trip", personId: "friend" },
      { id: "h", groupId: "home", personId: "self" },
    ]);
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "🍽️",
      isActive: true,
    });
    await db.tags.put({ id: "holiday", groupId: "trip", name: "Holiday", color: "#123456" });
    await db.expenses.put({
      expenseId: "lunch",
      groupId: "trip",
      expenseName: "Lunch",
      categoryId: "food",
      createdBy: "a",
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      tagIds: ["holiday"],
      attachmentIds: ["receipt"],
      transactions: {
        paid: [{ memberId: "a", amount: 100 }],
        owes: [
          { memberId: "a", amount: 50 },
          { memberId: "b", amount: 50 },
        ],
      },
    });
    await db.attachments.put({
      id: "receipt",
      expenseId: "lunch",
      mimeType: "image/png",
      createdAt: 1,
      blob: new Blob(["lunch"], { type: "image/png" }),
    });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip/settings");
});

test("warns, allows cancellation, then deletes the group and navigates home", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Export group" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Import group" })).toHaveCount(0);
  await page.getByRole("button", { name: "Delete group", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Delete Trip?" });
  await expect(dialog).toContainText("permanent and cannot be undone");
  await expect(dialog).toContainText("shared contacts and other groups will remain");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();
  expect(
    await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      return db.groups.count();
    }),
  ).toBe(2);

  await page.getByRole("button", { name: "Delete group", exact: true }).click();
  await dialog.getByRole("button", { name: "Delete group permanently" }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
  await expect(page.getByText("Trip", { exact: true })).toHaveCount(0);
  const remaining = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return {
      groups: (await db.groups.toArray()).map((row) => row.id),
      expenses: await db.expenses.count(),
      receipts: await db.attachments.count(),
      people: await db.people.count(),
      onboarding: await db.settings.get("onboarding"),
    };
  });
  expect(remaining).toMatchObject({
    groups: ["home"],
    expenses: 0,
    receipts: 0,
    people: 2,
    onboarding: { groupId: "home" },
  });
});
