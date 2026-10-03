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
    await db.people.put({ id: "self", name: "Amy", icon: "🦊" });
    await db.groups.put({
      id: "trip",
      name: "Trip",
      icon: "🏕️",
      currency: "USD",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.put({ id: "a", groupId: "trip", personId: "self" });
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "🍽️",
      isActive: true,
    });
    await db.expenses.put({
      expenseId: "dinner",
      groupId: "trip",
      expenseName: "Dinner",
      createdBy: "a",
      categoryId: "food",
      tagIds: [],
      attachmentIds: [],
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      transactions: {
        paid: [{ memberId: "a", amount: 12345 }],
        owes: [{ memberId: "a", amount: 12345 }],
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
  await page.goto("/groups/trip/settings");
});

test("keeps a long group name readable above its edit button on mobile", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile group Settings layout only");
  await page.setViewportSize({ width: 320, height: 800 });
  const name = "Our friends' very long autumn trip together";
  await page.evaluate(async (groupName) => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.groups.update("trip", { name: groupName });
  }, name);
  await page.goto("/groups/trip/settings");

  const card = page.locator(".group-settings-identity");
  const summary = card.locator(".group-settings-summary");
  const button = card.getByRole("button", { name: "Edit name & icon" });
  await expect(summary.getByText(name)).toBeVisible();
  const summaryBox = (await summary.boundingBox())!;
  const buttonBox = (await button.boundingBox())!;
  expect(buttonBox.y).toBeGreaterThanOrEqual(summaryBox.y + summaryBox.height);
  expect(buttonBox.x).toBeGreaterThanOrEqual(summaryBox.x);
  expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(
    (await card.boundingBox())!.x + (await card.boundingBox())!.width,
  );
});

test("confirms a currency relabel without changing saved amounts", async ({ page }) => {
  const currencyRow = page.locator(".ui-row").filter({ hasText: "One currency per group" });
  await expect(currencyRow.locator(".avatar-square svg.ui-icon")).toBeVisible();
  await expect(currencyRow.locator(".avatar-square img")).toHaveCount(0);
  await page.getByRole("button", { name: "Change", exact: true }).click();
  const search = page.getByRole("searchbox", { name: "Search currencies" });
  await expect(search).toHaveClass(/currency-search-input/u);
  expect(
    await search.evaluate((input) => {
      const icon = input.parentElement?.querySelector("svg.ui-icon");
      if (!icon) return false;
      return (
        Number.parseFloat(getComputedStyle(input).paddingLeft) >=
        icon.getBoundingClientRect().right - input.getBoundingClientRect().left + 6
      );
    }),
  ).toBe(true);
  await search.fill("JPY");
  const yenOption = page.getByRole("button", { name: /JPY Japanese Yen/u });
  await yenOption.click();
  await page.getByRole("button", { name: "Save currency" }).click();
  const confirmation = page.getByRole("dialog", { name: "Confirm currency change" });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByText("No exchange conversion will happen.")).toBeVisible();
  await expect(confirmation.getByText(/\$1,000\.00 becomes ¥1,000\.00/u)).toBeVisible();
  await confirmation.getByRole("button", { name: "Keep current currency" }).click();
  await expect(confirmation).not.toBeVisible();
  await expect(yenOption).toHaveAttribute("aria-pressed", "true");
  const originalCurrency = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return (await db.groups.get("trip"))?.currency;
  });
  expect(originalCurrency).toBe("USD");

  await page.getByRole("button", { name: "Save currency" }).click();
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Change currency" }).click();
  await expect(page.getByRole("button", { name: "Change", exact: true })).toBeVisible();
  await page.goto("/groups/trip/expenses");
  await expect(page.getByText(/¥123\.45/u).first()).toBeVisible();

  const persisted = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return {
      currency: (await db.groups.get("trip"))?.currency,
      transactions: (await db.expenses.get("dinner"))?.transactions,
    };
  });
  expect(persisted).toEqual({
    currency: "JPY",
    transactions: {
      paid: [{ memberId: "a", amount: 12345 }],
      owes: [{ memberId: "a", amount: 12345 }],
    },
  });
});
