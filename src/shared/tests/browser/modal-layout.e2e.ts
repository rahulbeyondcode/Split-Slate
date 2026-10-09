import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { Expense, OnboardingSettings } from "@/shared/types/domain.types";

const expectInsetDialog = async (dialog: Locator) => {
  await expect(dialog).toBeVisible();
  const dimensions = await dialog.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const viewport = window.visualViewport;
    return {
      left: bounds.left - (viewport?.offsetLeft ?? 0),
      top: bounds.top - (viewport?.offsetTop ?? 0),
      right: (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - bounds.right,
      bottom: (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - bounds.bottom,
      scrollTop: element.scrollTop,
      scrollWidth: element.scrollWidth,
      width: element.clientWidth,
    };
  });
  for (const gap of [dimensions.left, dimensions.top, dimensions.right, dimensions.bottom]) {
    expect(gap).toBeGreaterThanOrEqual(15.5);
  }
  expect(dimensions.scrollTop).toBe(0);
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
  await expect(dialog.locator(".dialog-header")).toBeInViewport();
  await expect(dialog.locator(".dialog-header button")).toBeInViewport();
  const actions = dialog.locator(".dialog-footer").getByRole("button");
  for (const action of await actions.all()) await expect(action).toBeInViewport();
};

const expectFixedControls = async (dialog: Locator) => {
  await expectInsetDialog(dialog);
  const body = dialog.locator(".dialog-body");
  // Stress each real modal with long content, including otherwise short explanations.
  await body.evaluate((element) => {
    const content = document.createElement("div");
    content.dataset.modalLayoutTest = "overflow";
    for (let index = 0; index < 40; index += 1) {
      const paragraph = document.createElement("p");
      paragraph.textContent = `Additional modal content ${index + 1} stays in the scrolling body.`;
      content.append(paragraph);
    }
    element.append(content);
  });
  await expect
    .poll(() => body.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await expectInsetDialog(dialog);
  const header = dialog.locator(".dialog-header");
  const footer = dialog.locator(".dialog-footer");
  const initialHeader = (await header.boundingBox())!;
  const initialFooter = (await footer.boundingBox())!;
  await body.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(await body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect((await header.boundingBox())!.y).toBeCloseTo(initialHeader.y, 0);
  expect((await footer.boundingBox())!.y).toBeCloseTo(initialFooter.y, 0);
  await expectInsetDialog(dialog);
};

const dismissDialog = async (page: Page, dialog: Locator) => {
  await dialog.locator(".dialog-header").getByRole("button").click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("split-slate-install-dismissed", String(Date.now()));
  });
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
      { id: "other", name: "Cal", icon: "🐱" },
    ]);
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      icon: "✈️",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "b", groupId: "trip", personId: "friend" },
    ]);
    await db.categories.bulkPut([
      { id: "food", groupId: "trip", name: "Food", icon: "🍔", isActive: true },
      { id: "spare", groupId: "trip", name: "Spare", icon: "📚", isActive: true },
    ]);
    await db.tags.put({ id: "holiday", groupId: "trip", name: "Holiday", color: "#6366f1" });
    const expense: Expense = {
      expenseId: "dinner",
      groupId: "trip",
      expenseName: "Dinner",
      createdBy: "a",
      categoryId: "food",
      createdAt: 1,
      when: new Date(2026, 8, 20, 12).getTime(),
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "a", amount: 10000 }],
        owes: [
          { memberId: "a", amount: 5000 },
          { memberId: "b", amount: 5000 },
        ],
      },
    };
    await db.expenses.put(expense);
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
});

for (const viewport of [
  { width: 280, height: 480 },
  { width: 320, height: 568 },
  { width: 820, height: 600 },
  { width: 1440, height: 700 },
]) {
  test(`keeps management modal controls fixed at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/groups/trip/categories");
    for (const title of ["Add category", "Add tag"]) {
      await page.getByRole("button", { name: title, exact: true }).click();
      const dialog = page.getByRole("dialog", { name: title, exact: true });
      await expectFixedControls(dialog);
      await dismissDialog(page, dialog);
    }
    const categories = page.locator(".management-section").filter({ hasText: "Categories" });
    await categories
      .getByRole("listitem")
      .filter({ hasText: "Food" })
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    const blocked = page.getByRole("dialog", { name: "Cannot delete Food", exact: true });
    await expectFixedControls(blocked);
    await dismissDialog(page, blocked);
    await categories
      .getByRole("listitem")
      .filter({ hasText: "Spare" })
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    const confirmation = page.getByRole("dialog", { name: "Delete Spare?", exact: true });
    await expect(confirmation).toBeVisible();
    const shortHeight = await confirmation.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    expect(shortHeight).toBeLessThan(viewport.height - 32);
    await expectFixedControls(confirmation);
    await dismissDialog(page, confirmation);
  });

  test(`keeps expense and payment modal controls fixed at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/groups/trip/expenses/new");
    for (const { trigger, title } of [
      { trigger: "Add new category", title: "Add category" },
      { trigger: "Add new tag", title: "Create new tag" },
    ]) {
      await page.getByRole("button", { name: trigger, exact: true }).click();
      const dialog = page.getByRole("dialog", { name: title, exact: true });
      await expectFixedControls(dialog);
      await dismissDialog(page, dialog);
    }
    await page.goto("/groups/trip/balances");
    await page.getByRole("button", { name: "Add payment", exact: true }).click();
    const payment = page.getByRole("dialog", { name: "Record payment", exact: true });
    await expectFixedControls(payment);
    await dismissDialog(page, payment);
  });

  test(`edits group identity in a modal at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/groups/trip/settings");
    const edit = page.getByRole("button", { name: "Edit name & icon", exact: true });
    const dialog = page.getByRole("dialog", { name: "Edit name & icon", exact: true });
    await edit.click();
    await expect(dialog.getByLabel("Group name", { exact: true })).toHaveValue("Weekend Trip");
    await expectFixedControls(dialog);
    await dialog.getByLabel("Group name", { exact: true }).fill("Unsaved name");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(edit).toBeFocused();
    await expect(page.locator(".group-settings-summary")).toContainText("Weekend Trip");
    await edit.click();
    await expect(dialog.getByLabel("Group name", { exact: true })).toHaveValue("Weekend Trip");
    await dialog.getByLabel("Group name", { exact: true }).fill("Escape also cancels");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await edit.click();
    await dialog.getByLabel("Group name", { exact: true }).fill("");
    await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(dialog.getByText("Group name is required", { exact: true })).toBeVisible();
    await expect(dialog.locator(".dialog-footer")).toBeInViewport();
    await dialog.getByLabel("Group name", { exact: true }).fill("Updated Weekend Trip");
    await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".group-settings-summary")).toContainText("Updated Weekend Trip");
    await page.reload();
    await expect(page.locator(".group-settings-summary")).toContainText("Updated Weekend Trip");
    const saved = await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      const group = await db.groups.get("trip");
      return { name: group?.name, icon: group?.icon, currency: group?.currency };
    });
    expect(saved).toEqual({ name: "Updated Weekend Trip", icon: "✈️", currency: "INR" });
  });

  test(`keeps settings modal controls fixed at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/groups/trip/settings");
    await page.getByRole("button", { name: "Change", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Change currency", exact: true });
    await expectFixedControls(picker);
    await expect(picker.getByRole("searchbox", { name: "Search currencies" })).toBeFocused();
    await picker.getByRole("searchbox", { name: "Search currencies" }).fill("JPY");
    await picker.getByRole("button", { name: /JPY Japanese Yen/u }).click();
    await picker.getByRole("button", { name: "Save currency", exact: true }).click();
    const currency = page.getByRole("dialog", { name: "Confirm currency change", exact: true });
    await expect(picker).toBeHidden();
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await expectFixedControls(currency);
    await currency.getByRole("button", { name: "Keep current currency", exact: true }).click();
    await expect(currency).toBeHidden();
    await expect(picker).toBeVisible();
    await expect(picker.getByRole("button", { name: /JPY Japanese Yen/u })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await dismissDialog(page, picker);
    await page.getByRole("button", { name: "Change", exact: true }).click();
    await expect(picker.getByRole("searchbox", { name: "Search currencies" })).toHaveValue("");
    await expect(picker.getByRole("button", { name: /INR Indian Rupee/u })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await picker.getByRole("searchbox", { name: "Search currencies" }).fill("JPY");
    await picker.getByRole("button", { name: /JPY Japanese Yen/u }).click();
    await picker.getByRole("button", { name: "Save currency", exact: true }).click();
    await currency.getByRole("button", { name: "Change currency", exact: true }).click();
    await expect(currency).toBeHidden();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    const savedCurrency = await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      const group = await db.groups.get("trip");
      const expense = await db.expenses.get("dinner");
      return { currency: group?.currency, paid: expense?.transactions.paid };
    });
    expect(savedCurrency).toEqual({
      currency: "JPY",
      paid: [{ memberId: "a", amount: 10000 }],
    });
    await page.getByRole("button", { name: "Export group", exact: true }).click();
    await page.getByLabel(/^Expenses/u).check();
    const notice = page.getByRole("dialog", { name: "Included automatically", exact: true });
    await expectFixedControls(notice);
    await dismissDialog(page, notice);
  });
}
