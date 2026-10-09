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
    await db.localUser.put({ id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" });
    await db.people.bulkPut([
      { id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" },
      { id: "friend", name: "Bea", icon: "profile-pic/panda-3d.png" },
      { id: "third", name: "Cal", icon: "profile-pic/cat-face-3d.png" },
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
  const fields = when.locator(".when-picker");
  const dateField = when.locator(".when-picker-field").first();
  const timeField = when.locator(".when-picker-field").last();

  const tagsBox = await tags.boundingBox();
  const whenBox = await when.boundingBox();
  const dateBox = await dateField.boundingBox();
  const timeBox = await timeField.boundingBox();
  expect(whenBox!.y).toBeGreaterThanOrEqual(tagsBox!.y + tagsBox!.height);
  expect(timeBox!.y).toBe(dateBox!.y);

  for (const width of [320, 280]) {
    await page.setViewportSize({ width, height: 800 });
    await expect
      .poll(() =>
        page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)),
      )
      .toBe(14);
    const narrowDateBox = (await dateField.boundingBox())!;
    const narrowTimeBox = (await timeField.boundingBox())!;
    const availableWidth = await fields.evaluate((element) => element.clientWidth);
    const fieldBasis = await dateField.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).flexBasis),
    );
    const gap = await fields.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).columnGap),
    );
    if (availableWidth >= fieldBasis * 2 + gap) {
      expect(narrowTimeBox.y).toBe(narrowDateBox.y);
    } else {
      expect(narrowTimeBox.y).toBeGreaterThanOrEqual(narrowDateBox.y + narrowDateBox.height);
    }
  }
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

test("shows the member, owed amount, then narrow input for every split method", async ({
  page,
}) => {
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  const row = page.locator(".expense-split-row").first();
  for (const [method, title] of [
    ["Equal", "Equal share for each person (INR)"],
    ["Unequal", "Amount each person owes (INR)"],
    ["Shares", "Shares for each person"],
    ["%", "Percentage for each person"],
    ["Adjust", "Adjustment per person (INR)"],
  ]) {
    await page
      .getByRole("group", { name: "Split method" })
      .getByRole("button", { name: method, exact: true })
      .click();
    const heading = page.getByRole("heading", { level: 3, name: title, exact: true });
    const summary = page.locator(".expense-split-summary");
    await expect(summary).toHaveCount(0);
    const selectAll = page.getByRole("checkbox", { name: "Select all", exact: true });
    expect((await heading.boundingBox())!.y).toBeGreaterThan((await selectAll.boundingBox())!.y);
    expect((await row.boundingBox())!.y).toBeGreaterThan((await heading.boundingBox())!.y);
    const memberBox = (await row.locator(".expense-split-member").boundingBox())!;
    const amountBox = (await row.locator(".expense-split-values > span").boundingBox())!;
    expect(amountBox.x > memberBox.x || amountBox.y > memberBox.y).toBe(true);
    await expect(row.locator(".avatar img")).toHaveAttribute("src", /\/fox-3d\.png$/u);
    await expect(page.locator(".expense-split-row").nth(1).locator(".avatar img")).toHaveAttribute(
      "src",
      /\/panda-3d\.png$/u,
    );
    if (method !== "Equal") {
      const input = row.locator(".expense-split-input input");
      const inputBox = (await input.boundingBox())!;
      expect(inputBox.width).toBeLessThanOrEqual(100);
      if (method !== "%") await expect(input).not.toHaveAttribute("placeholder", /.+/u);
      await expect(input).toHaveCSS("text-align", "center");
      expect(inputBox.x > amountBox.x || inputBox.y > amountBox.y).toBe(true);
    }
  }
});

test("summarizes only unequal and percentage splits with bold values", async ({ page }) => {
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  const methods = page.getByRole("group", { name: "Split method" });
  const summary = page.locator(".expense-split-summary");
  await expect(summary).toHaveCount(0);

  await methods.getByRole("button", { name: "Unequal" }).click();
  await expect(summary).toHaveCount(0);
  await page.getByLabel("Amount owed for Amy").fill("25");
  await expect(summary).toHaveText(
    "✓ ₹25.00 entered · remaining ₹75.00 auto-splits across 2 blank fields",
  );
  await expect(summary).toHaveCSS("color", /rgb\((33, 143, 104|99, 190, 148)\)/u);
  await expect(summary).toHaveCSS("font-weight", "400");
  await expect(summary.locator("strong")).toHaveText(["₹25.00", "₹75.00", "2"]);
  await page.getByLabel("Amount owed for Amy").fill("");
  await expect(summary).toHaveCount(0);

  await methods.getByRole("button", { name: "Shares" }).click();
  await expect(summary).toHaveCount(0);

  await methods.getByRole("button", { name: "%", exact: true }).click();
  await expect(summary).toHaveCount(0);
  await page.getByLabel("Percentage for Amy").fill("20");
  await expect(summary).toHaveText(
    "✓ 20% entered · remaining 80% auto-splits across 2 blank fields",
  );
  await expect(summary.locator("strong")).toHaveText(["20%", "80%", "2"]);
  await page.getByLabel("Percentage for Amy").fill("");
  await expect(summary).toHaveCount(0);

  await methods.getByRole("button", { name: "Adjust" }).click();
  await expect(summary).toHaveCount(0);
  await page.getByLabel("Adjustment for Amy").fill("10");
  await expect(summary).toHaveCount(0);
});

test("shows only one plain red message for an invalid split", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Too much owed");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page
    .getByRole("group", { name: "Split method" })
    .getByRole("button", { name: "Unequal" })
    .click();
  await page.getByLabel("Amount owed for Amy").fill("110");
  await expect(page.locator(".expense-split-summary")).toHaveCount(0);
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(
    page.getByText("Split amounts must add up to the total", { exact: true }),
  ).toHaveCount(1);
  await expect(page.locator(".note.money-negative")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("uses separate validation messages for shares and percentages", async ({ page }) => {
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  const methods = page.getByRole("group", { name: "Split method" });
  await methods.getByRole("button", { name: "Shares" }).click();
  await page.getByLabel("Shares for Amy").fill("0");
  await expect(
    page.getByText("Shares must be positive and within range", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Shares and percentages must be positive and within range"),
  ).toHaveCount(0);

  await methods.getByRole("button", { name: "%", exact: true }).click();
  await page.getByLabel("Percentage for Amy").fill("0");
  await expect(page.getByText("Percentages must be positive", { exact: true })).toBeVisible();
  await expect(page.getByText("Shares must be positive and within range")).toHaveCount(0);
});

test("shows a missing-payer error once without an alert box", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Missing payer");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page.getByLabel("Multiple payers", { exact: true }).check();
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByText("Choose who paid", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("uses emoji pills and suggested amounts for selected multiple payers", async ({ page }) => {
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await expect(page.getByRole("radio", { name: "Paid by Amy" })).toBeChecked();
  await expect(page.locator(".payer-choice-chip .avatar img").first()).toHaveAttribute(
    "src",
    /\/fox-3d\.png$/u,
  );
  await page.getByLabel("Multiple payers", { exact: true }).check();
  const amyPill = page.getByRole("checkbox", { name: "Paid by Amy" });
  const beaPill = page.getByRole("checkbox", { name: "Paid by Bea" });
  const calPill = page.getByRole("checkbox", { name: "Paid by Cal" });
  await expect(amyPill).not.toBeChecked();
  const heading = page.getByRole("heading", {
    level: 3,
    name: "Amount paid by each person (INR)",
  });
  const rows = page.locator(".expense-payer-row");
  await expect(rows).toHaveCount(0);
  await amyPill.locator("..").click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator(".expense-payer-preview")).toHaveText("₹100.00");
  await expect(page.getByLabel("Amy paid (INR)")).toBeDisabled();
  await expect(page.getByLabel("Amy paid (INR)")).toHaveAttribute("placeholder", "100.00");
  await beaPill.locator("..").click();
  await expect(rows).toHaveCount(2);
  expect((await heading.boundingBox())!.y).toBeLessThan((await rows.first().boundingBox())!.y);
  await expect(rows.first().locator(".avatar img")).toHaveAttribute("src", /\/fox-3d\.png$/u);
  await expect(rows.nth(1).locator(".avatar img")).toHaveAttribute("src", /\/panda-3d\.png$/u);
  const amount = page.getByLabel("Amy paid (INR)", { exact: true });
  expect((await amount.boundingBox())!.width).toBeLessThanOrEqual(100);
  await expect(amount).toBeEnabled();
  await expect(amount).toHaveAttribute("placeholder", "50.00");
  await expect(amount).toHaveCSS("text-align", "center");
  await amount.fill("40abc.5");
  await expect(amount).toHaveValue("40.5");
  await expect(rows.nth(1).locator(".expense-payer-preview")).toHaveText("₹59.50");
  const beaAmount = page.getByLabel("Bea paid (INR)");
  await beaAmount.click();
  await expect(amount).toHaveValue("40.5");
  await beaAmount.pressSequentially("30");
  await expect(amount).toBeEmpty();
  await expect(amount).toHaveAttribute("placeholder", "70.00");
  await calPill.locator("..").click();
  await expect(rows).toHaveCount(3);
  await calPill.locator("..").click();
  await expect(calPill).not.toBeChecked();
  await expect(rows).toHaveCount(2);
  await expect(rows.first().locator(".expense-payer-preview")).toHaveText("₹70.00");
  expect((await rows.first().boundingBox())!.height).toBeLessThan(64);
});

test("omits a selected payer with a zero suggested remainder on save", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Shared ride");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page.getByLabel("Multiple payers", { exact: true }).check();
  for (const name of ["Amy", "Bea", "Cal"]) {
    await page
      .getByRole("checkbox", { name: `Paid by ${name}` })
      .locator("..")
      .click();
  }
  await page.getByLabel("Amy paid (INR)").fill("40");
  await page.getByLabel("Bea paid (INR)").fill("60");
  const cal = page.locator(".expense-payer-row").filter({ hasText: "Cal" });
  await expect(cal.locator(".expense-payer-preview")).toHaveText("₹0.00");
  await page.getByRole("button", { name: "Save expense" }).click();
  const paid = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.expenses.toArray())[0].transactions.paid;
  });
  expect(paid).toEqual([
    { memberId: "a", amount: 4000 },
    { memberId: "b", amount: 6000 },
  ]);
});

test("keeps split rows compact while preserving a 44px tap target", async ({ page }) => {
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  const row = page.locator(".expense-split-row").first();
  for (const width of [320, 820, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    for (const method of ["Equal", "Unequal"]) {
      await page
        .getByRole("group", { name: "Split method" })
        .getByRole("button", { name: method, exact: true })
        .click();
      const height = (await row.boundingBox())!.height;
      expect(height).toBeGreaterThanOrEqual(44);
      expect(height).toBeLessThan(width === 320 ? 86 : 64);
    }
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

test("places Select all below the methods and toggles everyone", async ({ page }) => {
  const participants = page.locator(".expense-split-row input[type=checkbox]");
  const all = page.getByRole("checkbox", { name: "Select all", exact: true });
  const tabs = page.getByRole("group", { name: "Split method" });
  expect((await all.boundingBox())!.y).toBeGreaterThan((await tabs.boundingBox())!.y);
  await expect(all).toBeChecked();
  const allLabel = all.locator("..");
  const checkboxBox = (await all.boundingBox())!;
  expect(checkboxBox.width).toBeGreaterThanOrEqual(14);
  expect(checkboxBox.width).toBeLessThanOrEqual(16);
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

test("toggles split participants by clicking the row without changing split inputs", async ({
  page,
}) => {
  const cal = page.getByRole("checkbox", { name: "Cal" });
  const row = page.locator(".expense-split-row").filter({ has: cal });
  const clickPosition = { x: (await row.boundingBox())!.width - 8, y: 8 };

  await row.click({ position: clickPosition });
  await expect(cal).not.toBeChecked();
  await expect(row.locator(".expense-split-values")).toContainText("₹0.00");
  await row.click({ position: clickPosition });
  await expect(cal).toBeChecked();
  await expect(row).toHaveCSS("border-color", "rgb(121, 94, 203)");

  await page.getByRole("combobox", { name: "Split method" }).selectOption("shares");
  await page.getByLabel("Shares for Cal").fill("2");
  await expect(cal).toBeChecked();
});

test("makes the whole participant row selectable on tablet", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Tablet width covered by the desktop project");
  await page.setViewportSize({ width: 820, height: 800 });
  const row = page.locator(".expense-split-row").last();
  const checkbox = row.getByRole("checkbox", { name: "Cal" });
  await row.click({ position: { x: (await row.boundingBox())!.width - 8, y: 8 } });
  await expect(checkbox).not.toBeChecked();
  await expect(row.locator(".expense-split-values > span")).toHaveText("₹0.00");
});

test("updates owed amounts while typing and filters pasted split inputs", async ({ page }) => {
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  const amy = page.locator(".expense-split-row").filter({
    has: page.getByRole("checkbox", { name: "Amy" }),
  });
  const bea = page.locator(".expense-split-row").filter({
    has: page.getByRole("checkbox", { name: "Bea" }),
  });
  const methods = page.getByRole("group", { name: "Split method" });
  await expect(amy.locator(".expense-split-values > span")).toHaveText("₹33.34");

  await methods.getByRole("button", { name: "Unequal" }).click();
  await page.getByLabel("Amount owed for Amy").fill("25.5x");
  await expect(page.getByLabel("Amount owed for Amy")).toHaveValue("25.5");
  await expect(amy.locator(".expense-split-values > span")).toHaveText("₹25.50");
  await expect(bea.locator(".expense-split-values > span")).toHaveText("₹37.25");

  await methods.getByRole("button", { name: "%", exact: true }).click();
  await page.getByLabel("Percentage for Amy").fill("25e1");
  await expect(page.getByLabel("Percentage for Amy")).toHaveValue("100");
  await page.getByLabel("Percentage for Amy").fill("25");
  await expect(amy.locator(".expense-split-values > span")).toHaveText("₹25.00");
  await expect(page.getByLabel("Percentage for Bea")).toHaveAttribute("placeholder", "37.5");
  await expect(bea.locator(".expense-split-values > span")).toHaveText("₹37.50");
  await page.getByLabel("Percentage for Bea").fill("90");
  await expect(page.getByLabel("Percentage for Bea")).toHaveValue("75");
  await expect(page.getByLabel("Percentage for Cal")).toHaveAttribute("placeholder", "0");
  await expect(bea.locator(".expense-split-values > span")).toHaveText("₹75.00");

  await methods.getByRole("button", { name: "Adjust" }).click();
  await page.getByLabel("Adjustment for Amy").fill("-10abc");
  await expect(page.getByLabel("Adjustment for Amy")).toHaveValue("-10");
  await expect(amy.locator(".expense-split-values > span")).toHaveText("₹26.67");
});

test("saves blank percentage suggestions as the displayed owed amounts", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Suggested split");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page
    .getByRole("group", { name: "Split method" })
    .getByRole("button", { name: "%" })
    .click();
  await page.getByLabel("Percentage for Amy").fill("20");
  for (const name of ["Bea", "Cal"]) {
    await expect(page.getByLabel(`Percentage for ${name}`)).toHaveAttribute("placeholder", "40");
    await expect(
      page
        .locator(".expense-split-row")
        .filter({ hasText: name })
        .locator(".expense-split-values > span"),
    ).toHaveText("₹40.00");
  }
  await page.getByRole("button", { name: "Save expense" }).click();
  const expense = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.expenses.toArray())[0];
  });
  expect(expense.transactions.owes).toEqual([
    { memberId: "a", amount: 2000 },
    { memberId: "b", amount: 4000 },
    { memberId: "c", amount: 4000 },
  ]);
  expect(expense.splitMeta.map((row) => row.value)).toEqual(["20", "40", "40"]);
});

test("rounds displayed percentages without changing saved or editable values", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Precise percentages");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100.01");
  await page
    .getByRole("group", { name: "Split method" })
    .getByRole("button", { name: "%", exact: true })
    .click();
  await page.getByLabel("Percentage for Amy").fill("33.333334");
  await expect(page.getByLabel("Percentage for Amy")).toHaveValue("33.333334");
  await expect(page.getByLabel("Percentage for Bea")).toHaveAttribute("placeholder", "33.333");
  await expect(page.getByLabel("Percentage for Cal")).toHaveAttribute("placeholder", "33.333");
  await expect(page.locator(".expense-split-summary strong")).toHaveText([
    "33.333%",
    "66.667%",
    "2",
  ]);

  await page.getByRole("button", { name: "Save expense" }).click();
  const expense = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.expenses.toArray())[0];
  });
  expect(expense.splitMeta.map((row) => row.value)).toEqual([
    "33.333334",
    "33.333333",
    "33.333333",
  ]);
  await page
    .getByRole("list", { name: "Expenses" })
    .getByRole("link", { name: /^Precise percentages /u })
    .click();
  await expect(page.getByText("33.333%", { exact: true })).toHaveCount(3);
  await page.getByRole("link", { name: "Edit expense", exact: true }).click();
  await expect(page.getByLabel("Percentage for Amy")).toHaveValue("33.333334");
  await expect(page.getByLabel("Percentage for Bea")).toHaveValue("33.333333");
});

test("omits zero-percent suggested members when saving", async ({ page }) => {
  await page.getByLabel("Expense name", { exact: true }).fill("Solo share");
  await page.getByLabel("Amount (INR)", { exact: true }).fill("100");
  await page
    .getByRole("group", { name: "Split method" })
    .getByRole("button", { name: "%" })
    .click();
  await page.getByLabel("Percentage for Amy").fill("100");
  await expect(page.getByLabel("Percentage for Bea")).toHaveAttribute("placeholder", "0");
  await page.getByRole("button", { name: "Save expense" }).click();
  const expense = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.expenses.toArray())[0];
  });
  expect(expense.transactions.owes).toEqual([{ memberId: "a", amount: 10000 }]);
  expect(expense.splitMeta).toEqual([{ memberId: "a", value: "100" }]);
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
    await page.getByRole("checkbox", { name: "Paid by Amy" }).locator("..").click();
    await page.getByRole("checkbox", { name: "Paid by Bea" }).locator("..").click();
    await page.getByLabel("Amy paid (INR)", { exact: true }).fill("40");
    await expect(page.getByLabel("Bea paid (INR)", { exact: true })).toHaveAttribute(
      "placeholder",
      "60.00",
    );
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
    if (method === "amount") {
      await page.getByLabel("Amy paid (INR)", { exact: true }).click();
      await expect(page.getByLabel("Bea paid (INR)", { exact: true })).toHaveValue("60.00");
      await page.getByLabel("Amy paid (INR)", { exact: true }).fill("50");
      await expect(page.getByLabel("Bea paid (INR)", { exact: true })).toBeEmpty();
      await expect(page.getByLabel("Bea paid (INR)", { exact: true })).toHaveAttribute(
        "placeholder",
        "50.00",
      );
    }
    await expect(page.getByRole("checkbox", { name: "Paid by Amy" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Paid by Bea" })).toBeChecked();
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
  await page.getByRole("checkbox", { name: "Paid by Amy" }).locator("..").click();
  await page.getByRole("checkbox", { name: "Paid by Bea" }).locator("..").click();
  await page.getByRole("checkbox", { name: "Paid by Cal" }).locator("..").click();
  await page.getByLabel("Amy paid (INR)", { exact: true }).fill("99");
  await page.getByLabel("Bea paid (INR)", { exact: true }).fill("99");
  await expect(page.getByText("Payer amounts exceed the total", { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByText("Payer amounts exceed the total", { exact: true })).toHaveCount(1);
  await expect(page.locator(".note.money-negative")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByLabel("Bea paid (INR)", { exact: true }).fill("1");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.categories.update("food", { isActive: false });
  });
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.locator(".surface.form-card .money-negative")).toContainText("active category");
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
  await expect(page.locator(".surface.form-card .money-negative")).toContainText("active category");
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
