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
    await db.groups.put({
      id: "trip",
      name: "Trip",
      icon: "🏕️",
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
      icon: "🍽️",
      isActive: true,
    });
    await db.tags.put({ id: "cash", groupId: "trip", name: "Cash", color: "#218f68" });
    await db.expenses.put({
      expenseId: "dinner",
      groupId: "trip",
      expenseName: "Dinner",
      createdBy: "a",
      categoryId: "food",
      tagIds: [],
      attachmentIds: [],
      createdAt: 1,
      when: new Date("2026-10-01T19:00").getTime(),
      splitType: "equal",
      splitMeta: [],
      transactions: {
        paid: [{ memberId: "a", amount: 10_000 }],
        owes: [
          { memberId: "a", amount: 5_000 },
          { memberId: "b", amount: 5_000 },
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
  await page.goto("/groups/trip/balances");
});

test("records, displays, edits, and deletes a tagged group payment without increasing spending", async ({
  page,
}) => {
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText("₹50.00");
  await page.getByRole("button", { name: "Add payment" }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment" });
  await expect(dialog).toBeVisible();
  const modalHeight = await dialog.evaluate((element) => element.getBoundingClientRect().height);
  await dialog.getByRole("button", { name: "Paid by: Choose member" }).click();
  expect(await dialog.evaluate((element) => element.getBoundingClientRect().height)).toBe(
    modalHeight,
  );
  const payerOptions = dialog.getByRole("list", { name: "Paid by options" });
  await expect(payerOptions.locator(".avatar")).toHaveCount(2);
  const search = dialog.getByRole("textbox", { name: "Search paid by" });
  await expect(search).toHaveCSS("outline-style", "none");
  await search.fill("bea");
  await expect(payerOptions.getByRole("button", { name: "Amy" })).toHaveCount(0);
  await payerOptions.getByRole("button", { name: "Bea" }).click();
  await dialog.getByRole("button", { name: "Received by: Choose member" }).click();
  await dialog
    .getByRole("list", { name: "Received by options" })
    .getByRole("button", { name: "Amy" })
    .click();
  await expect(dialog.locator(".member-picker-trigger .avatar")).toHaveCount(2);
  await dialog.getByLabel("Amount (INR)").fill("20.00");
  await dialog.getByLabel("Date", { exact: true }).fill("2026-10-01");
  await dialog
    .getByRole("group", { name: "Time" })
    .getByRole("textbox", { name: "Hour" })
    .fill("8");
  await dialog
    .getByRole("group", { name: "Time" })
    .getByRole("textbox", { name: "Minute" })
    .fill("05");
  await dialog.getByRole("button", { name: "PM", exact: true }).click();
  await dialog.getByRole("checkbox", { name: "Cash" }).check();
  await dialog.getByRole("button", { name: "Record payment" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Recorded payments" })).toContainText("Bea paid Amy");
  await expect(page.getByRole("list", { name: "Recorded payments" })).toContainText(
    "01-Oct-2026 · 08:05 PM",
  );
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText("₹30.00");
  await page.goto("/groups/trip/expenses");
  const payment = page.locator(".settlement-entry");
  await expect(payment).toContainText("Bea paid Amy");
  await expect(payment).toContainText("Cash");
  await expect(payment).toHaveCSS("background-color", "rgb(217, 246, 232)");
  await expect(page.getByRole("region", { name: "Expense insights" })).toContainText("₹100.00");
  await page.goto("/groups/trip");
  await expect(page.locator(".settlement-entry")).toHaveCount(1);
  await page.goto("/groups/trip/balances");
  await page
    .getByRole("list", { name: "Recorded payments" })
    .getByRole("button", { name: "Edit" })
    .click();
  const editDialog = page.getByRole("dialog", { name: "Edit payment" });
  await expect(editDialog.getByLabel("Date", { exact: true })).toHaveValue("2026-10-01");
  await expect(editDialog.getByRole("textbox", { name: "Hour" })).toHaveValue("08");
  await editDialog.getByLabel("Amount (INR)").fill("60.00");
  await expect(editDialog.getByText(/may reverse who owes whom/u)).toBeVisible();
  await editDialog.getByRole("button", { name: "Save payment" }).click();
  await expect(page.getByRole("list", { name: "Recorded payments" })).toContainText("₹60.00");
  await page
    .getByRole("list", { name: "Recorded payments" })
    .getByRole("button", { name: "Delete" })
    .click();
  await page.getByRole("button", { name: "Delete payment" }).click();
  await expect(page.getByText("No payments recorded in this group yet.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText("₹50.00");
});

test("prefills settle up from a suggested transfer", async ({ page }) => {
  await page.getByRole("button", { name: "Settle up" }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment" });
  await expect(dialog.getByRole("button", { name: "Paid by: Bea" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Received by: Amy" })).toBeVisible();
  await expect(dialog.getByLabel("Amount (INR)")).toHaveValue("50.00");
  await expect(dialog.getByRole("textbox", { name: "Hour" })).toHaveValue("");
  await dialog.getByRole("button", { name: "Use current time" }).click();
  await dialog.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText(
    "No payments needed",
  );
});

test("shows readable transfer cards with a prominent amount and right-aligned Settle up action", async ({
  page,
}) => {
  const suggestion = page.getByRole("region", { name: "Suggested payments" }).locator("li").first();
  const people = suggestion.locator(".suggested-transfer-people");
  const parties = people.locator(".transfer-person");
  const arrow = people.locator(".suggested-transfer-arrow");
  const actions = suggestion.locator(".suggested-transfer-actions");
  const amount = actions.locator("strong");
  const button = actions.getByRole("button", { name: "Settle up" });
  await expect(
    page.getByText("Suggestions do not record money until you save a payment."),
  ).toHaveCount(0);
  await expect(button).toHaveCSS("background-color", "rgb(121, 94, 203)");
  const viewports = [
    { width: 320, rootFontSize: 14 },
    { width: 1280, rootFontSize: 16 },
  ];
  const checkLayout = async (rootFontSize: number) => {
    await expect(page.locator("html")).toHaveCSS("font-size", `${rootFontSize}px`);
    const fontScale = rootFontSize / 16;
    const suggestionBox = (await suggestion.boundingBox())!;
    const peopleBox = (await people.boundingBox())!;
    const actionsBox = (await actions.boundingBox())!;
    const amountBox = (await amount.boundingBox())!;
    const buttonBox = (await button.boundingBox())!;
    const fromBox = (await parties.first().boundingBox())!;
    const toBox = (await parties.last().boundingBox())!;
    const arrowBox = (await arrow.boundingBox())!;
    expect(fromBox.x + fromBox.width).toBeLessThanOrEqual(arrowBox.x);
    expect(arrowBox.x + arrowBox.width).toBeLessThanOrEqual(toBox.x);
    expect(actionsBox.y).toBeGreaterThan(peopleBox.y + peopleBox.height);
    expect(suggestionBox.height).toBeGreaterThan(120);
    expect(buttonBox.height).toBeGreaterThanOrEqual(36 * fontScale);
    expect(buttonBox.height).toBeLessThanOrEqual(42 * fontScale);
    expect(buttonBox.x).toBeGreaterThanOrEqual(amountBox.x + amountBox.width);
    expect(buttonBox.width).toBeLessThan(actionsBox.width / 2);
    expect(Math.abs(buttonBox.x + buttonBox.width - actionsBox.x - actionsBox.width)).toBeLessThan(
      2,
    );
    expect(suggestionBox.width).toBeLessThanOrEqual(
      await suggestion.evaluate((element) => element.parentElement!.clientWidth),
    );
    expect(await amount.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    const nameSize = await parties
      .first()
      .locator(".suggested-transfer-name")
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    const amountSize = await amount.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    expect(amountSize).toBeGreaterThan(nameSize);
  };

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.update("friend", { name: "Alexandria Montgomery" });
  });
  await page.reload();
  await expect(parties.first()).toContainText("Alexandria Montgomery");
  await expect(parties.first().locator(".avatar")).toHaveCount(1);
  await expect(parties.last().locator(".avatar")).toHaveCount(1);
  for (const { width, rootFontSize } of viewports) {
    await page.setViewportSize({ width, height: 800 });
    await checkLayout(rootFontSize);
  }
  await expect(amount).toHaveText("₹50.00");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.expenses.update("dinner", {
      transactions: {
        paid: [{ memberId: "a", amount: 19_999_998 }],
        owes: [
          { memberId: "a", amount: 9_999_999 },
          { memberId: "b", amount: 9_999_999 },
        ],
      },
    });
  });
  await page.reload();
  await expect(amount).toHaveText("₹99,999.99");
  for (const { width, rootFontSize } of viewports) {
    await page.setViewportSize({ width, height: 800 });
    await checkLayout(rootFontSize);
  }
});

test("stacks balance sections on tablets and places them side by side on desktop", async ({
  page,
}) => {
  const cards = page.locator(".balances-summary-grid > .surface");
  await expect(cards).toHaveCount(2);
  await page.setViewportSize({ width: 800, height: 800 });
  const tabletMember = (await cards.first().boundingBox())!;
  const tabletTransfers = (await cards.last().boundingBox())!;
  expect(tabletTransfers.y).toBeGreaterThanOrEqual(tabletMember.y + tabletMember.height);
  expect(Math.abs(tabletTransfers.width - tabletMember.width)).toBeLessThan(2);

  await page.setViewportSize({ width: 1280, height: 800 });
  const desktopMember = (await cards.first().boundingBox())!;
  const desktopTransfers = (await cards.last().boundingBox())!;
  expect(Math.abs(desktopTransfers.y - desktopMember.y)).toBeLessThan(2);
  expect(desktopTransfers.x).toBeGreaterThanOrEqual(desktopMember.x + desktopMember.width);
});

test("transfers time focus in the payment modal in both directions", async ({ page }) => {
  await page.getByRole("button", { name: "Add payment" }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment" });
  const hour = dialog.getByRole("textbox", { name: "Hour" });
  const minute = dialog.getByRole("textbox", { name: "Minute" });

  await hour.pressSequentially("1");
  await expect(hour).toBeFocused();
  await hour.pressSequentially("2");
  await expect(minute).toBeFocused();
  await minute.pressSequentially("4");
  await minute.press("Backspace");
  await expect(minute).toBeFocused();
  await minute.press("Backspace");
  await expect(hour).toBeFocused();
  expect(await hour.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(2);
});

test("opens Add payment from the expense ledger and cancels without saving", async ({ page }) => {
  await page.goto("/groups/trip/expenses");
  const addPayment = page.getByRole("link", { name: "Add payment" });
  await expect(addPayment.locator("svg.ui-icon")).toHaveCount(1);
  await addPayment.click();
  const dialog = page.getByRole("dialog", { name: "Record payment" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("No payments recorded in this group yet.")).toBeVisible();
});
