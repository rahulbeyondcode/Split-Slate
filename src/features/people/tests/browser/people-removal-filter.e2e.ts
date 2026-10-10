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
    await db.groups.bulkPut([
      {
        id: "trip",
        name: "Weekend Trip",
        currency: "INR",
        icon: "🏕️",
        createdAt: 1,
        frequentPayerIds: [],
      },
      { id: "home", name: "Home", currency: "USD", icon: "🏠", createdAt: 2, frequentPayerIds: [] },
    ]);
    await db.members.bulkPut([
      { id: "trip-self", groupId: "trip", personId: "self" },
      { id: "trip-bea", groupId: "trip", personId: "bea" },
      { id: "home-self", groupId: "home", personId: "self" },
      { id: "home-bea", groupId: "home", personId: "bea" },
    ]);
    await db.categories.bulkPut([
      { id: "trip-food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
      { id: "home-food", groupId: "home", name: "Food", icon: "🍽️", isActive: true },
    ]);
    const expense = (
      id: string,
      groupId: string,
      creator: string,
      payer: string,
      participant: string,
    ): Expense => ({
      expenseId: id,
      groupId,
      expenseName: id,
      categoryId: `${groupId}-food`,
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
      expense("Trip created by Bea", "trip", "trip-bea", "trip-self", "trip-self"),
      expense("Trip other", "trip", "trip-self", "trip-self", "trip-self"),
      expense("Home split with Bea", "home", "home-self", "home-self", "home-bea"),
    ]);
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/friends");
});

test("creates and edits contacts in modals at every width", async ({ page }) => {
  await page.getByRole("button", { name: "New contact", exact: true }).first().click();
  const addDialog = page.getByRole("dialog", { name: "Add a person" });
  await expect(addDialog.getByRole("textbox", { name: "Name" })).toBeFocused();
  await addDialog.getByRole("textbox", { name: "Name" }).fill("Dana");
  await addDialog.getByRole("button", { name: "Add contact", exact: true }).click();
  await expect(addDialog).toHaveCount(0);
  await page.getByRole("button", { name: "Edit Dana", exact: true }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit person" });
  await expect(editDialog.getByRole("textbox", { name: "Name" })).toHaveValue("Dana");
  await editDialog.getByRole("textbox", { name: "Name" }).fill("Dana Updated");
  await editDialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(editDialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit Dana Updated", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Edit Dana Updated", exact: true })).toBeVisible();
});

test("discards cancelled contact drafts and restores focus", async ({ page }) => {
  for (const editorMode of ["add", "edit"] as const) {
    const opener = page
      .getByRole("button", {
        name: editorMode === "add" ? "New contact" : "Edit Cal",
        exact: true,
      })
      .first();
    const dialog = page.getByRole("dialog", {
      name: editorMode === "add" ? "Add a person" : "Edit person",
    });
    for (const dismissal of ["Cancel", "Escape", "Close dialog"]) {
      await opener.click();
      await expect(dialog.getByRole("textbox", { name: "Name" })).toHaveValue(
        editorMode === "add" ? "" : "Cal",
      );
      await expect(dialog.getByRole("textbox", { name: "Name" })).toBeFocused();
      await dialog.getByRole("textbox", { name: "Name" }).fill("Unsaved contact");
      if (dismissal === "Escape") await page.keyboard.press("Escape");
      else await dialog.getByRole("button", { name: dismissal, exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  }
  const saved = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.people.toArray()).map((person) => person.name).sort();
  });
  expect(saved).toEqual(["Amy", "Bea", "Cal"]);
});

test("contact edits still propagate to every linked group", async ({ page }) => {
  await page.getByRole("button", { name: "Edit Bea", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit person" });
  await dialog.getByRole("textbox", { name: "Name" }).fill("Bea Updated");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  for (const groupId of ["trip", "home"]) {
    await page.goto(`/groups/${groupId}/members`);
    await expect(
      page.locator(".member-list-scroll li").filter({ hasText: "Bea Updated" }),
    ).toBeVisible();
  }
});

for (const viewport of [
  { width: 280, height: 480 },
  { width: 820, height: 600 },
  { width: 1440, height: 700 },
]) {
  for (const editorMode of ["add", "edit"] as const) {
    test(`keeps ${editorMode} contact heading and actions fixed at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page
        .getByRole("button", {
          name: editorMode === "add" ? "New contact" : "Edit Cal",
          exact: true,
        })
        .first()
        .click();
      const title = editorMode === "add" ? "Add a person" : "Edit person";
      const submitLabel = editorMode === "add" ? "Add contact" : "Save";
      const dialog = page.getByRole("dialog", { name: title });
      const body = dialog.locator(".dialog-body");
      const header = dialog.locator(".dialog-header");
      const footer = dialog.locator(".dialog-footer");
      await expect(header.getByRole("heading", { name: title })).toBeVisible();
      await dialog.getByRole("textbox", { name: "Name" }).fill("");
      await footer.getByRole("button", { name: submitLabel, exact: true }).click();
      await expect(body.getByText("Name is required", { exact: true })).toBeVisible();
      await dialog.getByRole("textbox", { name: "Name" }).fill("Bea");
      await footer.getByRole("button", { name: submitLabel, exact: true }).click();
      await expect(body.getByText("Someone with this name already exists")).toBeVisible();
      await body.evaluate((element) => {
        const content = document.createElement("div");
        for (let index = 0; index < 40; index += 1) {
          const paragraph = document.createElement("p");
          paragraph.textContent = `Additional contact modal content ${index + 1}`;
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
      await footer.getByRole("button", { name: "Cancel" }).click();
      await expect(dialog).toHaveCount(0);
    });
  }
}

test("shows per-group expense links when a contact cannot be deleted", async ({ page }) => {
  const blockedDelete = page.getByRole("button", { name: "Delete Bea" });
  await expect(blockedDelete).toHaveClass(/btn-blocked/u);
  await expect(blockedDelete).toBeEnabled();
  await expect(page.getByRole("button", { name: "Delete Cal" })).toHaveClass(/btn-danger/u);
  await blockedDelete.click();

  const explanation = page.getByRole("dialog", { name: "Cannot delete Bea" });
  await expect(explanation).toBeVisible();
  await expect(explanation.getByRole("link")).toHaveCount(2);
  await explanation.getByRole("link", { name: /Weekend Trip/u }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses\?memberIds=trip-bea$/u);
  await expect(page.getByRole("status")).toHaveText("1 of 2 expenses");
  await expect(
    page.getByRole("list", { name: "Expenses" }).getByText("Trip created by Bea"),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "Expenses" }).getByText("Trip other")).toHaveCount(0);

  await page.goto("/friends");
  await page.getByRole("button", { name: "Delete Bea" }).click();
  await page
    .getByRole("dialog", { name: "Cannot delete Bea" })
    .getByRole("link", { name: /Home/u })
    .click();
  await expect(page).toHaveURL(/\/groups\/home\/expenses\?memberIds=home-bea$/u);
  await expect(page.getByRole("status")).toHaveText("1 of 1 expenses");
  await expect(
    page.getByRole("list", { name: "Expenses" }).getByText("Home split with Bea"),
  ).toBeVisible();
});

test("confirms eligible contact deletion in an app dialog", async ({ page }) => {
  const deleteCal = page.getByRole("button", { name: "Delete Cal" });
  await deleteCal.click();
  const confirmation = page.getByRole("dialog", { name: "Delete Cal?" });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText("any groups they belong to");
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(confirmation).not.toBeVisible();
  await expect(deleteCal).toBeVisible();

  await deleteCal.click();
  await page.keyboard.press("Escape");
  await expect(confirmation).not.toBeVisible();
  await deleteCal.click();
  await confirmation.getByRole("button", { name: "Delete contact" }).click();
  await expect(deleteCal).toHaveCount(0);
  await page.reload();
  await expect(deleteCal).toHaveCount(0);
});
