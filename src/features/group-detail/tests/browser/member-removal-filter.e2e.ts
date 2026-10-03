import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { Expense, OnboardingSettings } from "@/shared/types/domain.types";

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
      { id: "bea", name: "Bea", icon: "🐻" },
      { id: "cal", name: "Cal", icon: "🐱" },
    ]);
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      currency: "INR",
      icon: "🏕️",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "b", groupId: "trip", personId: "bea" },
      { id: "c", groupId: "trip", personId: "cal" },
    ]);
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "🍽️",
      isActive: true,
    });
    const expense = (id: string, creator: string, payer: string, participant: string): Expense => ({
      expenseId: id,
      groupId: "trip",
      expenseName: id,
      categoryId: "food",
      createdBy: creator,
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: payer, amount: 100 }],
        owes: [{ memberId: participant, amount: 100 }],
      },
    });
    await db.expenses.bulkPut([
      expense("Bea created", "b", "a", "a"),
      expense("Bea paid", "a", "b", "a"),
      expense("Bea owes", "a", "a", "b"),
      expense("Amy only", "a", "a", "a"),
    ]);
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip/members");
});

test("keeps long mobile member names accessible above their edit and delete actions", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile member rows only");
  const name = "Cal with a remarkably long full name that cannot fit on one row";
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(async (fullName) => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.update("cal", { name: fullName });
  }, name);
  await page.reload();

  const row = page.locator(".member-list-scroll li").filter({
    has: page.getByRole("button", { name: `Show full name: ${name}` }),
  });
  const nameButton = row.getByRole("button", { name: `Show full name: ${name}` });
  const nameText = nameButton.locator("span").first();
  const identity = row.locator(".member-entry-identity");
  const actions = row.locator(".member-entry-actions");
  await expect(nameText).toHaveCSS("text-overflow", "ellipsis");
  await expect
    .poll(() => nameText.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  const identityBox = (await identity.boundingBox())!;
  const actionsBox = (await actions.boundingBox())!;
  expect(actionsBox.y).toBeGreaterThanOrEqual(identityBox.y + identityBox.height);
  const buttons = await actions.getByRole("button").all();
  const widths = await Promise.all(
    buttons.map(async (button) => (await button.boundingBox())!.width),
  );
  expect(widths.reduce((total, width) => total + width, 0)).toBeGreaterThanOrEqual(
    (await row.boundingBox())!.width * 0.75,
  );
  await expect(buttons[0]).toHaveCSS("border-radius", "12px");
  await expect(nameButton).toHaveAttribute("data-tooltip", name);
  await nameButton.focus();
  await expect
    .poll(() => nameButton.evaluate((element) => getComputedStyle(element, "::after").opacity))
    .toBe("1");

  await row.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit person" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await row.getByRole("button", { name: `Delete ${name}` }).click();
  await expect(page.getByRole("dialog", { name: `Remove ${name}?` })).toBeVisible();
});

test("explains blocked removal and links to every expense referencing the member", async ({
  page,
}) => {
  await expect(page.getByRole("button", { name: "Add member" })).toBeVisible();
  const blockedDelete = page.getByRole("button", { name: "Delete Bea" });
  await expect(blockedDelete).toHaveClass(/btn-blocked/u);
  await expect(blockedDelete).toBeEnabled();
  await expect(page.getByRole("button", { name: "Delete Cal" })).toHaveClass(/btn-danger/u);
  await blockedDelete.click();
  const explanation = page.getByRole("dialog", { name: "Cannot remove Bea" });
  await expect(explanation).toBeVisible();
  await expect(explanation).toContainText("3 group expenses");
  await explanation.getByRole("link", { name: "View Bea's expenses" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses\?memberIds=b$/u);
  await expect(page.getByRole("status")).toHaveText("3 of 4 expenses");
  const expenses = page.getByRole("list", { name: "Expenses" });
  await expect(expenses.getByText("Bea created", { exact: true })).toBeVisible();
  await expect(expenses.getByText("Bea paid", { exact: true })).toBeVisible();
  await expect(expenses.getByText("Bea owes", { exact: true })).toBeVisible();
  await expect(expenses.getByText("Amy only")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("3 of 4 expenses");
});

test("opens the new-person form on the first Add member click", async ({ page }) => {
  await page.getByRole("button", { name: "Add member" }).click();
  await expect(page.getByRole("heading", { name: "Add a person" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Add a person" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add member" })).toBeVisible();
});

test("confirms eligible member removal without deleting the contact", async ({ page }) => {
  const deleteCal = page.getByRole("button", { name: "Delete Cal" });
  await deleteCal.click();
  const confirmation = page.getByRole("dialog", { name: "Remove Cal?" });
  await expect(confirmation).toContainText("remain in your contacts");
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(deleteCal).toBeVisible();
  await deleteCal.click();
  await confirmation.getByRole("button", { name: "Remove member" }).click();
  await expect(deleteCal).toHaveCount(0);
  await page.goto("/friends");
  await expect(page.getByText("Cal", { exact: true })).toBeVisible();
});
