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
  const buttonRadius = await page.evaluate(
    () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.75,
  );
  await expect(buttons[0]).toHaveCSS("border-radius", `${buttonRadius}px`);
  await expect(nameButton).toHaveAttribute("data-tooltip", name);
  await nameButton.focus();
  await expect
    .poll(() => nameButton.evaluate((element) => getComputedStyle(element, "::after").opacity))
    .toBe("1");

  await row.getByRole("button", { name: "Edit" }).click();
  const editor = page.getByRole("dialog", { name: "Edit person" });
  await expect(editor.getByRole("heading", { name: "Edit person" })).toBeVisible();
  await editor.getByRole("button", { name: "Cancel" }).click();
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
  await expect(explanation).toContainText("3 expenses and 0 payments");
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

test("opens the new-person modal on the first Add member click at every width", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.people.put({ id: "new-friend", name: "Dana", icon: "🐨" });
  });
  await page.reload();
  const opener = page.getByRole("button", { name: "Add member" });
  await opener.click();
  const editor = page.getByRole("dialog", { name: "Add a person" });
  await expect(editor.getByRole("heading", { name: "Add a person" })).toBeVisible();
  await expect(editor.getByRole("textbox", { name: "Name" })).toBeVisible();
  await expect(editor.getByRole("textbox", { name: "Name" })).toBeFocused();
  await expect(editor.getByRole("button", { name: /Dana/u })).toBeVisible();
  await editor.getByRole("textbox", { name: "Name" }).fill("Unsaved person");
  await editor.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Add a person" })).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(editor.getByRole("textbox", { name: "Name" })).toHaveValue("");
  await editor.getByRole("textbox", { name: "Name" }).fill("Escape also cancels");
  await page.keyboard.press("Escape");
  await expect(editor).toHaveCount(0);
  await expect(opener).toBeFocused();
  const unsavedPeople = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return db.people
      .filter((person) => ["Unsaved person", "Escape also cancels"].includes(person.name))
      .count();
  });
  expect(unsavedPeople).toBe(0);
});

test("opens Edit in a modal and discards cancelled drafts at every width", async ({ page }) => {
  const row = page.locator(".member-list-scroll li").filter({ hasText: "Cal" });
  const opener = row.getByRole("button", { name: "Edit" });
  const editor = page.getByRole("dialog", { name: "Edit person" });
  for (const dismissal of ["Cancel", "Escape", "Close dialog"]) {
    await opener.click();
    await expect(editor.getByRole("textbox", { name: "Name" })).toHaveValue("Cal");
    await expect(editor.getByRole("textbox", { name: "Name" })).toBeFocused();
    await expect(page.locator(".member-editor")).toHaveCount(0);
    await editor.getByRole("textbox", { name: "Name" }).fill("Unsaved edit");
    if (dismissal === "Escape") await page.keyboard.press("Escape");
    else await editor.getByRole("button", { name: dismissal, exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(opener).toBeFocused();
  }
  const person = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return db.people.get("cal");
  });
  expect(person?.name).toBe("Cal");

  await page.setViewportSize({ width: 820, height: 900 });
  await opener.click();
  await expect(editor.getByRole("heading", { name: "Edit person" })).toBeVisible();
  await expect(page.locator(".member-editor")).toHaveCount(0);
});

test("creates and edits a group member from modals at every width", async ({ page }) => {
  await page.getByRole("button", { name: "Add member" }).click();
  const addDialog = page.getByRole("dialog", { name: "Add a person" });
  await addDialog.getByRole("textbox", { name: "Name" }).fill("Dee");
  await addDialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(addDialog).toHaveCount(0);

  const row = page.locator(".member-list-scroll li").filter({ hasText: "Dee" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit" }).click();
  const editEditor = page.getByRole("dialog", { name: "Edit person" });
  await editEditor.getByRole("textbox", { name: "Name" }).fill("Dee Updated");
  await editEditor.getByRole("button", { name: "Save" }).click();
  await expect(editEditor).toHaveCount(0);
  await expect(
    page.locator(".member-list-scroll li").filter({ hasText: "Dee Updated" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".member-list-scroll li").filter({ hasText: "Dee Updated" }),
  ).toBeVisible();
});

test("links an existing friend from the Add member modal", async ({ page }) => {
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.people.put({ id: "new-friend", name: "Dana", icon: "🐨" });
  });
  await page.reload();
  await page.getByRole("button", { name: "Add member" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a person" });
  await dialog.getByRole("button", { name: /Dana/u }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".member-list-scroll li").filter({ hasText: "Dana" })).toBeVisible();
  await page.getByRole("button", { name: "Add member" }).click();
  await expect(dialog.getByRole("button", { name: /Dana/u })).toHaveCount(0);
});

for (const viewport of [
  { width: 280, height: 480 },
  { width: 820, height: 600 },
  { width: 1440, height: 700 },
]) {
  for (const editorMode of ["add", "edit"] as const) {
    test(`keeps ${editorMode} member heading and actions fixed at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      if (editorMode === "add") {
        await page.getByRole("button", { name: "Add member" }).click();
      } else {
        await page
          .locator(".member-list-scroll li")
          .filter({ hasText: "Cal" })
          .getByRole("button", { name: "Edit" })
          .click();
      }
      const title = editorMode === "add" ? "Add a person" : "Edit person";
      const submitLabel = editorMode === "add" ? "Add" : "Save";
      const dialog = page.getByRole("dialog", { name: title });
      const body = dialog.locator(".dialog-body");
      const header = dialog.locator(".dialog-header");
      const footer = dialog.locator(".dialog-footer");
      await expect(header.getByRole("heading", { name: title })).toBeVisible();
      await dialog.getByRole("textbox", { name: "Name" }).fill("");
      await dialog.getByRole("button", { name: submitLabel, exact: true }).click();
      await expect(body.getByText("Name is required", { exact: true })).toBeVisible();
      await body.evaluate((element) => {
        const content = document.createElement("div");
        for (let index = 0; index < 40; index += 1) {
          const paragraph = document.createElement("p");
          paragraph.textContent = `Additional member modal content ${index + 1}`;
          content.append(paragraph);
        }
        element.append(content);
      });
      const initialHeader = (await header.boundingBox())!;
      const initialFooter = (await footer.boundingBox())!;
      await body.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      expect(await body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      expect((await header.boundingBox())!.y).toBeCloseTo(initialHeader.y, 0);
      expect((await footer.boundingBox())!.y).toBeCloseTo(initialFooter.y, 0);
      await expect(header.getByRole("button", { name: "Close dialog" })).toBeInViewport();
      await expect(footer.getByRole("button", { name: "Cancel" })).toBeInViewport();
      await expect(footer.getByRole("button", { name: submitLabel, exact: true })).toBeInViewport();
      const dimensions = await dialog.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const viewport = window.visualViewport;
        return {
          gaps: [
            bounds.left - (viewport?.offsetLeft ?? 0),
            bounds.top - (viewport?.offsetTop ?? 0),
            (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - bounds.right,
            (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - bounds.bottom,
          ],
          scrollTop: element.scrollTop,
          scrollWidth: element.scrollWidth,
          width: element.clientWidth,
        };
      });
      for (const gap of dimensions.gaps) expect(gap).toBeGreaterThanOrEqual(15.5);
      expect(dimensions.scrollTop).toBe(0);
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
      await header.getByRole("button", { name: "Close dialog" }).click();
      await expect(dialog).toHaveCount(0);
    });
  }
}

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
