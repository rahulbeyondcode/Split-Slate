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
      { id: "third", name: "Cal", icon: "🐱" },
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
      { id: "b", groupId: "trip", personId: "friend" },
      { id: "c", groupId: "trip", personId: "third" },
    ]);
    await db.categories.bulkPut([
      { id: "food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
      { id: "inactive", groupId: "trip", name: "Old category", icon: "📦", isActive: false },
    ]);
    await db.tags.put({ id: "holiday", groupId: "trip", name: "Holiday", color: "#123456" });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip");
  await page.getByRole("link", { name: "Add expense", exact: true }).first().click();
  const hour = page.getByRole("textbox", { name: "Hour" });
  const minute = page.getByRole("textbox", { name: "Minute" });
  await expect(hour).toBeEmpty();
  await expect(hour).toHaveAttribute("placeholder", "hh");
  await expect(minute).toBeEmpty();
  await expect(minute).toHaveAttribute("placeholder", "mm");
  await expect(page.getByLabel("Date", { exact: true })).not.toBeEmpty();
  await hour.fill("12");
  await minute.fill("00");
});

test("places date and time beneath tags, side by side when possible and stacked on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 800 });
  const tags = page.getByRole("group", { name: "Tags (optional)" });
  const when = page.getByRole("group", { name: "Date and time" });
  const dateField = when.locator(".when-picker-field").first();
  const timeField = when.locator(".when-picker-field").last();

  const tagsBox = await tags.boundingBox();
  const whenBox = await when.boundingBox();
  const dateBox = await dateField.boundingBox();
  const timeBox = await timeField.boundingBox();
  expect(whenBox!.y).toBeGreaterThanOrEqual(tagsBox!.y + tagsBox!.height);
  expect(timeBox!.y).toBe(dateBox!.y);

  await page.setViewportSize({ width: 320, height: 800 });
  const narrowDateBox = await dateField.boundingBox();
  const narrowTimeBox = await timeField.boundingBox();
  expect(narrowTimeBox!.y).toBeGreaterThanOrEqual(narrowDateBox!.y + narrowDateBox!.height);
});

test("sizes dashed Add actions like the category and tag pills", async ({ page, isMobile }) => {
  const category = page.getByRole("group", { name: "Category" });
  const categoryChip = category.locator(".choice-chip").first();
  const addCategory = category.getByRole("button", { name: "Add new category" });
  await expect(addCategory).toHaveCSS("border-style", "dashed");
  const categoryChipBox = (await categoryChip.boundingBox())!;
  const categoryButtonBox = (await addCategory.boundingBox())!;
  expect(Math.abs(categoryButtonBox.height - categoryChipBox.height)).toBeLessThan(4);
  expect(categoryButtonBox.y).toBe(categoryChipBox.y);

  const tags = page.getByRole("group", { name: "Tags (optional)" });
  const addTag = tags.getByRole("button", { name: "Add new tag", includeHidden: true });
  if (isMobile) {
    const tagChipBox = (await tags.locator(".choice-pill").first().boundingBox())!;
    const tagButtonBox = (await addTag.boundingBox())!;
    await expect(addTag).toHaveCSS("border-style", "dashed");
    expect(Math.abs(tagButtonBox.height - tagChipBox.height)).toBeLessThan(4);
    expect(tagButtonBox.y).toBe(tagChipBox.y);
  } else {
    await expect(addTag).toBeHidden();
  }
});

test("justifies the member name and values apart for every split method", async ({ page }) => {
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  const row = page.locator(".expense-split-row").first();
  for (const method of ["Equal", "Amount", "Shares", "%", "Adjust"]) {
    await page
      .getByRole("group", { name: "Split method" })
      .getByRole("button", { name: method, exact: true })
      .click();
    const nameBox = (await row.locator(":scope > label").boundingBox())!;
    const valuesBox = (await row.locator(":scope > div").boundingBox())!;
    const rowBox = (await row.boundingBox())!;
    const paddingRight = await row.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingRight),
    );
    expect(valuesBox.x).toBeGreaterThanOrEqual(nameBox.x + nameBox.width);
    expect(
      Math.abs(valuesBox.x + valuesBox.width - (rowBox.x + rowBox.width - paddingRight - 1)),
    ).toBeLessThan(3);
  }
});

test("distributes split-method tabs evenly without clipping their labels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const tabs = page.getByRole("group", { name: "Split method" });
  const buttons = tabs.getByRole("button");
  await expect(buttons).toHaveCount(5);
  const widths = await buttons.evaluateAll((elements) =>
    elements.map((element) => ({
      width: element.getBoundingClientRect().width,
      fits: element.scrollWidth <= element.clientWidth,
    })),
  );
  expect(
    Math.max(...widths.map((item) => item.width)) - Math.min(...widths.map((item) => item.width)),
  ).toBeLessThan(1);
  expect(widths.every((item) => item.fits)).toBe(true);
});

test("scrolls the mobile expense content without a second document or form scrollbar", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile expense form scroll only");
  await page.setViewportSize({ width: 320, height: 700 });
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.bulkPut(
      Array.from({ length: 12 }, (_, index) => ({
        id: `extra-person-${index}`,
        name: `Extra person ${index}`,
        icon: "🐱",
      })),
    );
    await db.members.bulkPut(
      Array.from({ length: 12 }, (_, index) => ({
        id: `extra-member-${index}`,
        groupId: "trip",
        personId: `extra-person-${index}`,
      })),
    );
  });
  await page.reload();
  const main = page.locator("#main-content");
  const rows = page.locator(".expense-split-row");
  await expect(rows).toHaveCount(15);
  await expect
    .poll(() => main.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, 10000));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const nestedScrollers = await page
    .locator(".group-page-form")
    .evaluate(
      (root) =>
        [root, ...root.querySelectorAll("*")].filter(
          (element) =>
            element instanceof HTMLElement &&
            element.scrollHeight > element.clientHeight + 2 &&
            /auto|scroll/u.test(getComputedStyle(element).overflowY),
        ).length,
    );
  expect(nestedScrollers).toBe(0);
  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(rows.last()).toBeInViewport();
  const toolbar = page.locator(".form-toolbar");
  await expect(toolbar.getByRole("link", { name: "Cancel" })).toBeInViewport();
  await expect(toolbar.getByRole("button", { name: "Save expense" })).toBeInViewport();
  expect(
    (await rows.last().boundingBox())!.y + (await rows.last().boundingBox())!.height,
  ).toBeLessThanOrEqual((await toolbar.boundingBox())!.y + 2);
});

test("fills the current clock time without changing the selected expense date", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-09-19T13:07:00.000Z"));
  const date = page.getByLabel("Date", { exact: true });
  await date.fill("2026-09-18");

  await page.getByRole("button", { name: "Use current time" }).click();
  await expect(date).toHaveValue("2026-09-18");
  await expect(page.getByRole("textbox", { name: "Hour" })).toHaveValue("06");
  await expect(page.getByRole("textbox", { name: "Minute" })).toHaveValue("37");
  await expect(page.getByRole("button", { name: "PM", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("textbox", { name: "Hour" }).fill("09");
  await page.getByRole("textbox", { name: "Minute" }).fill("15");
  await page.getByRole("button", { name: "AM", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Hour" })).toHaveValue("09");
  await expect(page.getByRole("textbox", { name: "Minute" })).toHaveValue("15");
  await expect(date).toHaveValue("2026-09-18");
});

test("advances from valid hours on desktop and mobile and returns to the end of Hour from an empty Minute", async ({
  page,
}) => {
  const hour = page.getByRole("textbox", { name: "Hour" });
  const minute = page.getByRole("textbox", { name: "Minute" });

  await hour.fill("");
  await hour.pressSequentially("0");
  await expect(hour).toBeFocused();
  await hour.pressSequentially("9");
  await expect(minute).toBeFocused();
  await expect(hour).toHaveValue("09");

  await hour.fill("");
  await hour.pressSequentially("1");
  await expect(hour).toBeFocused();
  await hour.pressSequentially("2");
  await expect(minute).toBeFocused();
  await expect(hour).toHaveValue("12");

  await hour.fill("2");
  await expect(minute).toBeFocused();
  await expect(hour).toHaveValue("02");

  await hour.fill("20");
  await expect(hour).toBeFocused();
  await expect(hour).toHaveValue("20");

  await hour.fill("09");
  await expect(minute).toBeFocused();
  await minute.fill("35");
  await minute.press("Backspace");
  await expect(minute).toBeFocused();
  await expect(minute).toHaveValue("3");
  await minute.press("Backspace");
  await expect(minute).toBeFocused();
  await expect(minute).toBeEmpty();
  await minute.press("Backspace");
  await expect(hour).toBeFocused();
  await expect(hour).toHaveValue("09");
  expect(await hour.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(2);
  expect(await hour.evaluate((input: HTMLInputElement) => input.selectionEnd)).toBe(2);
});

test("advances time entry on a tablet-sized viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Tablet viewport covered by desktop project");
  await page.setViewportSize({ width: 820, height: 900 });
  const hour = page.getByRole("textbox", { name: "Hour" });
  const minute = page.getByRole("textbox", { name: "Minute" });
  await minute.fill("");
  await hour.fill("7");
  await expect(minute).toBeFocused();
  await minute.press("Backspace");
  await expect(hour).toBeFocused();
  expect(await hour.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(2);
});

test("selects and unselects all mobile split participants", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only split selection");
  const participants = page.locator(".expense-split-row input[type=checkbox]");
  const all = page.getByRole("checkbox", { name: "Select all", exact: true });
  await expect(all).toBeChecked();
  const allLabel = all.locator("..");
  await expect(all).toHaveCSS("width", "16px");
  const checkboxBox = (await all.boundingBox())!;
  const textBox = (await allLabel.getByText("Select all", { exact: true }).boundingBox())!;
  expect(textBox.x - checkboxBox.x - checkboxBox.width).toBeGreaterThanOrEqual(8);
  await allLabel.getByText("Select all", { exact: true }).click();
  await expect(all).not.toBeChecked();
  await expect(allLabel).toContainText("Select all");
  await expect(page.locator(".expense-split-row input[type=checkbox]:checked")).toHaveCount(0);
  await all.check();
  await expect(all).toBeChecked();
  await expect(allLabel).toContainText("Select all");
  for (const participant of await participants.all()) await expect(participant).toBeChecked();
});

test("toggles mobile split participants by tapping the row without changing split inputs", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only split selection");
  const cal = page.getByRole("checkbox", { name: "Cal" });
  const row = page.locator(".expense-split-row").filter({ has: cal });

  await row.click({ position: { x: 120, y: 10 } });
  await expect(cal).not.toBeChecked();
  await row.click({ position: { x: 120, y: 10 } });
  await expect(cal).toBeChecked();
  await expect(row).toHaveCSS("border-color", "rgb(121, 94, 203)");

  await page.getByRole("combobox", { name: "Split method" }).selectOption("shares");
  await page.getByLabel("Shares for Cal").fill("2");
  await expect(cal).toBeChecked();
});

test("creates and selects a new tag without losing the unfinished mobile expense", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only tag creation");
  await page.getByLabel("Expense name", { exact: true }).fill("Weekend lunch");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("42");
  await page.getByRole("button", { name: "Add new tag" }).click();
  const dialog = page.getByRole("dialog", { name: "Create new tag" });
  await dialog.getByRole("textbox", { name: "Tag name" }).fill("Weekend");
  await dialog.getByRole("button", { name: "Create tag" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Weekend" })).toBeChecked();
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Weekend lunch");
  await expect(page.getByLabel("Amount (INR)", { exact: true })).toHaveValue("42");
  await page.getByRole("button", { name: "Save expense" }).click();
  const saved = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return { tags: await db.tags.toArray(), expenses: await db.expenses.toArray() };
  });
  expect(saved.expenses[0].tagIds).toContain(saved.tags.find((tag) => tag.name === "Weekend")?.id);
});

test("records an equal expense, updates balances, and survives reload", async ({ page }) => {
  const tag = page.getByLabel("Holiday", { exact: true });
  await expect(tag).toHaveClass(/choice-control/u);
  await expect(page.getByLabel("One person", { exact: true })).toBeChecked();
  await expect(page.getByLabel("One person", { exact: true })).toHaveClass(/choice-control/u);
  await expect(page.getByLabel("Paid by Amy", { exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Food/u })).toBeChecked();
  await page.getByLabel("Expense name", { exact: true }).fill(" Dinner ");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page.getByLabel("Date", { exact: true }).fill("2026-09-19");
  await page.getByRole("textbox", { name: "Hour" }).fill("6");
  await page.getByRole("textbox", { name: "Minute" }).fill("30");
  await page.getByRole("button", { name: "PM", exact: true }).click();
  await tag.check();
  await expect(tag).toBeChecked();
  await expect(page.getByRole("option", { name: "Old category" })).toHaveCount(0);
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/);
  await expect(page.getByText("Dinner", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Expenses" }).getByRole("link", { name: /^Dinner /u }),
  ).toContainText("₹100.00");
  await expect(
    page.getByRole("list", { name: "Expenses" }).getByRole("link", { name: /Dinner/ }),
  ).toContainText("19-Sep-2026 · 06:30 PM");
  await page.reload();
  await expect(page.getByText("Dinner", { exact: true })).toBeVisible();
  const stored = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return db.expenses.toArray();
  });
  expect(stored).toHaveLength(1);
  expect(stored[0].transactions.owes.map((row) => row.amount)).toEqual([3334, 3333, 3333]);
  expect(stored[0].tagIds).toEqual(["holiday"]);
  const storedTime = await page.evaluate((when) => {
    const date = new Date(when);
    return { hours: date.getHours(), minutes: date.getMinutes() };
  }, stored[0].when);
  expect(storedTime).toEqual({ hours: 18, minutes: 30 });
  await page.goto("/groups/trip");
  await expect(page.getByRole("main").getByText("+₹66.66", { exact: true })).toBeVisible();
});

test("adds a category without losing the unfinished expense", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Coffee with Bea");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("42");
  await page.getByRole("button", { name: "Add new category" }).click();
  const dialog = page.getByRole("dialog", { name: "Add category" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Coffee with Bea");

  await page.getByRole("button", { name: "Add new category" }).click();
  await dialog.getByRole("textbox", { name: "Category name" }).fill(" food ");
  await dialog.getByRole("button", { name: "Add category" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Category already exists");
  await dialog.getByRole("textbox", { name: "Category name" }).fill("Coffee runs");
  await dialog.getByRole("button", { name: "Add category" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Coffee runs" })).toBeChecked();
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Coffee with Bea");
  await expect(page.getByLabel("Amount (INR)", { exact: true })).toHaveValue("42");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
  const stored = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    const category = (await db.categories.toArray()).find((item) => item.name === "Coffee runs");
    const expense = (await db.expenses.toArray())[0];
    return { category, categoryId: expense?.categoryId };
  });
  expect(stored.category?.groupId).toBe("trip");
  expect(stored.categoryId).toBe(stored.category?.id);
});

test("can create the first active category from the expense form", async ({ page }) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { isActive: false });
  });
  await page.reload();
  await expect(page.getByText("No active categories yet. Add one to continue.")).toBeVisible();
  await page.getByLabel("Expense name", { exact: true }).fill("Bus tickets");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("25");
  await page.getByRole("textbox", { name: "Hour" }).fill("12");
  await page.getByRole("textbox", { name: "Minute" }).fill("00");
  await page.getByRole("button", { name: "Add new category" }).click();
  const dialog = page.getByRole("dialog", { name: "Add category" });
  await dialog.getByRole("textbox", { name: "Category name" }).fill("Transport");
  await dialog.getByRole("button", { name: "Add category" }).click();
  await expect(page.getByRole("radio", { name: "Transport" })).toBeChecked();
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Bus tickets");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/u);
  await expect(page.getByText("Bus tickets", { exact: true })).toBeVisible();
});

test("edits the time across noon and midnight with 12-hour controls", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Late snack");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("20");
  await page.getByLabel("Date", { exact: true }).fill("2026-09-19");
  await page.getByRole("textbox", { name: "Hour" }).fill("12");
  await page.getByRole("textbox", { name: "Minute" }).fill("05");
  await page.getByRole("button", { name: "AM", exact: true }).click();
  await page.getByRole("button", { name: "Save expense" }).click();
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /Late snack/ })
    .click();
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Hour" })).toHaveValue("12");
  await expect(page.getByRole("textbox", { name: "Minute" })).toHaveValue("05");
  await expect(page.getByRole("button", { name: "AM", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "PM", exact: true }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.reload();
  const when = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    const date = new Date((await db.expenses.toArray())[0].when);
    return { hours: date.getHours(), minutes: date.getMinutes() };
  });
  expect(when).toEqual({ hours: 12, minutes: 5 });
});

test("requires a complete time before saving", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Breakfast");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("20");
  await page.getByRole("textbox", { name: "Hour" }).fill("");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByRole("alert")).toContainText("Enter a valid local date and time");
  await page.getByRole("textbox", { name: "Hour" }).fill("7");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/);
});

for (const method of ["amount", "shares", "percentage", "adjustment"] as const) {
  test(`records a ${method} split with multiple payers`, async ({ page }) => {
    await page.getByLabel("Expense name", { exact: true }).fill(`Split ${method}`);
    await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
    await page.getByLabel("Multiple payers", { exact: true }).check();
    await page.getByLabel("Amy paid (INR)", { exact: true }).fill("40");
    await page.getByLabel("Bea paid (INR)", { exact: true }).fill("60");
    await page.getByRole("combobox", { name: "Split method", exact: true }).selectOption(method);
    if (method === "amount")
      await page.getByLabel("Amount owed for Amy", { exact: true }).fill("20");
    if (method === "shares") await page.getByLabel("Shares for Cal", { exact: true }).fill("2");
    if (method === "percentage") {
      await page.getByLabel("Percentage for Amy", { exact: true }).fill("20");
      await page.getByLabel("Percentage for Bea", { exact: true }).fill("30");
      await page.getByLabel("Percentage for Cal", { exact: true }).fill("50");
    }
    if (method === "adjustment")
      await page.getByLabel("Adjustment for Amy", { exact: true }).fill("-10");
    await page.getByRole("button", { name: "Save expense" }).click();
    await expect(page).toHaveURL(/\/expenses$/);
    await expect(page.getByText(`Split ${method}`, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Expenses" }).getByRole("link", {
        name: new RegExp(`^Split ${method} `, "u"),
      }),
    ).toContainText(`Amy, Bea paid · ${method}`);
    await page
      .getByRole("list", { name: "Expenses" })
      .getByRole("link", { name: new RegExp(`^Split ${method} `, "u") })
      .click();
    await page.getByRole("link", { name: "Edit expense", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Split method", exact: true })).toHaveValue(
      method,
    );
    await expect(page.getByLabel("Amy paid (INR)", { exact: true })).toHaveValue("40.00");
    await expect(page.getByLabel("Bea paid (INR)", { exact: true })).toHaveValue("60.00");
    await page.getByLabel("Expense name", { exact: true }).fill(`Edited ${method}`);
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: `Edited ${method}`, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: `Edited ${method}`, exact: true }),
    ).toBeVisible();
  });
}

test("preserves maximum shares through reload and a name-only edit", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Exact shares");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100.01");
  await page.getByRole("combobox", { name: "Split method", exact: true }).selectOption("shares");
  await page.getByLabel("Shares for Amy", { exact: true }).fill("9007199254.740991");
  await page.getByLabel("Shares for Bea", { exact: true }).fill("0.000001");
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /^Exact shares /u })
    .click();
  await page.reload();
  await expect(page.getByText("9007199254.740991 shares", { exact: true })).toBeVisible();
  const original = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.expenses.toArray())[0];
  });
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await expect(page.getByLabel("Shares for Amy", { exact: true })).toHaveValue("9007199254.740991");
  await expect(page.getByLabel("Shares for Bea", { exact: true })).toHaveValue("0.000001");
  await page.getByLabel("Expense name", { exact: true }).fill("Renamed exact shares");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Renamed exact shares", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("9007199254.740991 shares", { exact: true })).toBeVisible();
  const updated = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.expenses.toArray())[0];
  });
  expect(updated).toEqual({ ...original, expenseName: "Renamed exact shares" });
});

test("blocks invalid totals, preserves form data after save rejection, and allows retry", async ({
  page,
}) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Taxi");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page.getByLabel("Multiple payers", { exact: true }).check();
  await page.getByLabel("Amy paid (INR)", { exact: true }).fill("99");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByRole("alert")).toContainText("Payer amounts must add up");
  await page.getByLabel("Amy paid (INR)", { exact: true }).fill("100");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { isActive: false });
  });
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByRole("alert")).toContainText("active category");
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Taxi");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { isActive: true });
  });
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(/\/expenses$/);
});

test("cancels without recording anything", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Discard me");
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No expenses yet" })).toBeVisible();
});

test("inspects, edits, and deletes an expense with live balance updates", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Dinner");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("300");
  await page.getByLabel("Holiday", { exact: true }).check();
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /^Dinner /u })
    .click();
  const detailUrl = page.url();
  await expect(page.getByRole("heading", { name: "Dinner", exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Tags", exact: true })).toContainText("Holiday");
  await expect(page.getByRole("region", { name: "Split breakdown", exact: true })).toContainText(
    "₹100.00",
  );
  await page.goto("/groups/trip/balances");
  await expect(page.getByRole("list", { name: "Member balances" })).toContainText("+₹200.00");
  const suggestions = page.getByRole("region", { name: "Suggested payments" });
  await expect(suggestions.getByRole("listitem").filter({ hasText: "Bea" })).toContainText(
    "FromBeaToAmyAmount₹100.00",
  );
  await expect(suggestions.getByRole("listitem").filter({ hasText: "Cal" })).toContainText(
    "FromCalToAmyAmount₹100.00",
  );
  await page.goto(detailUrl);
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await page.getByLabel("Expense name", { exact: true }).fill("Dinner and dessert");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("600");
  await page.getByRole("radio", { name: "Paid by Bea" }).locator("..").click();
  await page.getByLabel("Holiday", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dinner and dessert", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "Tags" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Paid by", exact: true })).toContainText("Bea");
  await page.goto("/groups/trip/balances");
  await expect(
    suggestions.getByRole("listitem").filter({ hasText: /^FromAmyToBea/u }),
  ).toContainText("FromAmyToBeaAmount₹200.00");
  await page.goto(detailUrl);
  await page.getByRole("button", { name: "Delete expense", exact: true }).click();
  const deletionDialog = page.getByRole("dialog", { name: "Delete Dinner and dessert?" });
  await expect(deletionDialog).toContainText("cannot be undone");
  await expect(deletionDialog).toContainText("receipts will be permanently deleted");
  await deletionDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(deletionDialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Dinner and dessert" })).toBeVisible();
  await page.getByRole("button", { name: "Delete expense", exact: true }).click();
  await expect(deletionDialog).toBeVisible();
  await deletionDialog.press("Escape");
  await expect(deletionDialog).not.toBeVisible();
  await page.getByRole("button", { name: "Delete expense", exact: true }).click();
  await deletionDialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses$/);
  await expect(page.getByRole("heading", { name: "No expenses yet" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "No expenses yet" })).toBeVisible();
  await page.goto("/groups/trip/balances");
  await expect(page.getByRole("heading", { name: "All square!" })).toBeVisible();
  await page.goto(detailUrl);
  await expect(page.getByRole("heading", { name: "Expense not found" })).toBeVisible();
});

test("cancels an edit and retries failed update and delete operations", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Taxi");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("60");
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /^Taxi /u })
    .click();
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await page.getByLabel("Expense name", { exact: true }).fill("Discard this edit");
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Taxi", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await page.getByLabel("Expense name", { exact: true }).fill("Updated taxi");
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.categories.update("food", { groupId: "elsewhere" });
  });
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("active category");
  await expect(page.getByLabel("Expense name", { exact: true })).toHaveValue("Updated taxi");
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.categories.update("food", { groupId: "trip" });
  });
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Updated taxi", exact: true })).toBeVisible();
  const savedGroup = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    const group = await db.groups.get("trip");
    await db.groups.delete("trip");
    return group!;
  });
  await page.getByRole("button", { name: "Delete expense", exact: true }).click();
  const deletionDialog = page.getByRole("dialog", { name: "Delete Updated taxi?" });
  await deletionDialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(deletionDialog.getByRole("alert")).toContainText("Group not found");
  await expect(deletionDialog).toBeVisible();
  await page.evaluate(async (group) => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.groups.put(group);
  }, savedGroup);
  await deletionDialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("heading", { name: "No expenses yet" })).toBeVisible();
});

test("keeps an inactive historical category available while editing", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Old dinner");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("90");
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.categories.update("food", { isActive: false });
  });
  await page.reload();
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /^Old dinner /u })
    .click();
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Food (inactive)" })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Old category/u })).toHaveCount(0);
  await page.getByLabel("Expense name", { exact: true }).fill("Corrected old dinner");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Corrected old dinner", exact: true }),
  ).toBeVisible();
});

test("shows solo balances and rejects missing or foreign expense routes", async ({ page }) => {
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.members.bulkDelete(["b", "c"]);
    await db.expenses.add({
      expenseId: "foreign",
      groupId: "elsewhere",
      expenseName: "Private elsewhere",
      categoryId: "food",
      createdBy: "a",
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: { paid: [], owes: [] },
    });
  });
  await page.goto("/groups/trip/balances");
  await expect(page.getByText("Solo spending has no one to repay.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "All square!" })).toBeVisible();
  for (const route of ["missing", "foreign", "missing/edit", "foreign/edit"]) {
    await page.goto(`/groups/trip/expenses/${route}`);
    await expect(page.getByRole("heading", { name: "Expense not found" })).toBeVisible();
    const back = page.getByRole("link", { name: "Back to expenses" });
    await expect(back).toHaveCount(route.endsWith("/edit") ? 2 : 1);
    for (const link of await back.all()) {
      await expect(link).toHaveClass(/btn-secondary/u);
      await expect(link).toHaveCSS("border-radius", "100px");
    }
  }
});
