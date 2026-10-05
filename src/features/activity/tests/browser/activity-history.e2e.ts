import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

test("records additions and deletions, retains them after reload, and filters the group panel", async ({
  page,
}) => {
  await page.goto("/onboarding");
  await page.waitForFunction(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    return useStore.getState().initialized;
  });
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.localUser.add({ id: "self", name: "Amy", icon: "🦊" });
    await db.people.add({ id: "self", name: "Amy", icon: "🦊" });
    await db.groups.add({
      id: "g",
      name: "Trip",
      icon: "🏕️",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["m"],
    });
    await db.members.add({ id: "m", groupId: "g", personId: "self" });
    await db.categories.add({ id: "food", groupId: "g", name: "Food", icon: "🍽️", isActive: true });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "g",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/dashboard");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    const state = useStore.getState();
    const category = await state.addCategory("g", "Taxi", "🚕");
    await useStore.getState().removeCategory(category.id);
    const tag = await useStore.getState().addTag("g", "Holiday", "#123456");
    await useStore.getState().removeTag(tag.id);
    const expense = await useStore.getState().addExpense({
      groupId: "g",
      currency: "INR",
      values: {
        expenseName: "Dinner",
        amount: "12.50",
        when: "2026-09-19T12:30",
        categoryId: "food",
        tagIds: [],
        payerMode: "single",
        payerId: "m",
        payers: [],
        splitType: "equal",
        participants: [{ memberId: "m", selected: true, value: "" }],
      },
    });
    await useStore.getState().removeExpense(expense.expenseId, "g");
  });

  await page.goto("/activity");
  await expect(page.locator("main")).toContainText("Category deleted: Taxi");
  await expect(page.locator("main")).toContainText("Tag deleted: Holiday");
  await expect(page.locator("main")).toContainText("Expense deleted: Dinner");
  await expect(
    page.locator("main").getByRole("link", { name: /Expense deleted: Dinner/u }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.locator("main")).toContainText("Expense deleted: Dinner");
  if ((page.viewportSize()?.width ?? 0) >= 1080) {
    await page.goto("/groups/g");
    const panel = page.getByRole("complementary", { name: "Recent activity" });
    await expect(panel).toContainText("Expense deleted: Dinner");
  }
});
