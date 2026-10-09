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
    await useStore.getState().addPerson("Global contact", "🦉");
  });

  await page.goto("/activity");
  await expect(page.locator("main")).toContainText("Category deleted: Taxi");
  await expect(page.locator("main")).toContainText("Tag deleted: Holiday");
  await expect(page.locator("main")).toContainText("Expense deleted: Dinner");
  await expect(page.locator("main")).toContainText("Person created: Global contact");
  await expect(
    page.locator("main").getByRole("link", { name: /Expense deleted: Dinner/u }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.locator("main")).toContainText("Expense deleted: Dinner");
  const width = page.viewportSize()?.width ?? 0;
  if (width >= 768 && width < 1080) {
    await page.goto("/dashboard");
    const appActivity = page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Activity", exact: true });
    await expect(appActivity).toHaveAttribute("href", "/activity");
    await appActivity.click();
    await expect(page).toHaveURL(/\/activity$/u);
    await expect(page.locator("main")).toContainText("Person created: Global contact");

    await page.goto("/groups/g");
    const groupActivity = page
      .getByRole("navigation", { name: "Group navigation" })
      .getByRole("link", { name: "Activity", exact: true });
    await expect(groupActivity).toHaveAttribute("href", "/groups/g/activity");
    await groupActivity.click();
    await expect(page).toHaveURL(/\/groups\/g\/activity$/u);
    await expect(groupActivity).toHaveAttribute("aria-current", "page");
    await expect(page.locator("main")).toContainText("Expense deleted: Dinner");
    await expect(page.locator("main")).not.toContainText("Person created: Global contact");
    await expect(page.locator("main")).toContainText("Recent changes in this group");
    await page.reload();
    await expect(page.locator("main")).not.toContainText("Person created: Global contact");
  }
  if (width >= 1080) {
    await page.goto("/groups/g");
    const panel = page.getByRole("complementary", { name: "Recent activity" });
    await expect(panel).toContainText("Expense deleted: Dinner");
    await expect(
      page.getByRole("navigation", { name: "Group navigation" }).getByRole("link", {
        name: "Activity",
        exact: true,
      }),
    ).toHaveCount(0);
    await page.goto("/groups/g/activity");
    await expect(page.getByRole("complementary", { name: "Recent activity" })).toHaveCount(0);
    await expect(page.locator("main")).toContainText("Expense deleted: Dinner");
    await expect(page.locator("main")).not.toContainText("Person created: Global contact");
  }
  await page.goto("/activity");
  if (width >= 1080) {
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", {
        name: "Activity",
        exact: true,
      }),
    ).toHaveCount(0);
  }
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    await useStore.getState().removeGroup("g");
  });
  await expect(page.locator("main")).toContainText("Group created: Trip");
  await expect(page.locator("main")).toContainText("Group deleted: Trip");
  await expect(page.locator("main")).not.toContainText("Expense deleted: Dinner");
  await expect(page.locator("main")).not.toContainText("Category deleted: Taxi");
  await expect(page.locator("main")).not.toContainText("Tag deleted: Holiday");
  await page.reload();
  await expect(page.locator("main")).toContainText("Group deleted: Trip");
  await expect(page.locator("main")).not.toContainText("Expense deleted: Dinner");
});
