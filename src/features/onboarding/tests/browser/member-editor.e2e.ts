import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

test.beforeEach(async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForFunction(async () => {
    const path = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ path)) as typeof StoreModule;
    return useStore.getState().initialized;
  });
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.localUser.put({ id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" });
    await db.people.bulkPut([
      { id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" },
      { id: "friend", name: "Bea", icon: "profile-pic/cat-3d.png" },
    ]);
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      icon: "travel-and-places/camping-3d.png",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["member"],
    });
    await db.members.put({ id: "member", groupId: "trip", personId: "self" });
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "food-and-drinks/hamburger-3d.png",
      isActive: true,
    });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: false,
      lastCompletedStep: "categories",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 700 },
  { width: 900, height: 900 },
  { width: 1280, height: 800 },
]) {
  test(`adds a person through a draft-only onboarding modal at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/onboarding/setup");
    const members = page.getByRole("list", { name: "Group members" });
    await page.getByRole("button", { name: "Bea", exact: true }).click();
    await expect(members).toContainText("Bea");
    const addPerson = page.getByRole("button", { name: "Add another member", exact: true });
    await addPerson.click();
    const dialog = page.getByRole("dialog", { name: "Add a person" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Add a person" })).toBeVisible();
    await expect(dialog.getByLabel("Name", { exact: true })).toBeFocused();
    await expect(dialog.locator("form")).not.toHaveClass(/surface/u);
    const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
    const savePerson = dialog.getByRole("button", { name: "Add person", exact: true });
    await expect(cancel).toBeInViewport();
    await expect(savePerson).toBeInViewport();
    const initialCancel = (await cancel.boundingBox())!;
    const initialSavePerson = (await savePerson.boundingBox())!;
    const body = dialog.locator(".person-editor-dialog-body");
    await body.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(cancel).toBeInViewport();
    await expect(savePerson).toBeInViewport();
    expect((await cancel.boundingBox())!.y).toBeCloseTo(initialCancel.y, 0);
    expect((await savePerson.boundingBox())!.y).toBeCloseTo(initialSavePerson.y, 0);
    expect(await dialog.evaluate((element) => element.scrollTop)).toBe(0);
    await expect(page.locator(".onboarding-continue")).toBeDisabled();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await dialog.getByLabel("Name", { exact: true }).fill("Cal");
    await dialog.getByRole("button", { name: "Add person", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(addPerson).toBeFocused();
    await expect(members).toContainText("Cal");
    await expect(members).toContainText("Bea");
    await expect(page.getByRole("button", { name: "Save and Finish", exact: true })).toBeEnabled();
    const draftCounts = await page.evaluate(async () => {
      const path = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
      return { people: await db.people.count(), members: await db.members.count() };
    });
    expect(draftCounts).toEqual({ people: 2, members: 1 });
    await page.getByRole("button", { name: "Save and Finish", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/u);
    const saved = await page.evaluate(async () => {
      const path = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
      return {
        people: (await db.people.toArray()).map((person) => person.name).sort(),
        members: await db.members.where("groupId").equals("trip").count(),
      };
    });
    expect(saved).toEqual({ people: ["Amy", "Bea", "Cal"], members: 3 });
  });
}

test("validates the person modal and preserves selections on Cancel and Escape", async ({
  page,
}) => {
  await page.goto("/onboarding/setup");
  await page.getByRole("button", { name: "Bea", exact: true }).click();
  const addPerson = page.getByRole("button", { name: "Add another member", exact: true });
  const members = page.getByRole("list", { name: "Group members" });
  const dialog = page.getByRole("dialog", { name: "Add a person" });
  await addPerson.click();
  const name = dialog.getByLabel("Name", { exact: true });
  await name.fill("   ");
  await dialog.getByRole("button", { name: "Add person", exact: true }).click();
  await expect(dialog.getByText("Name is required")).toBeVisible();
  await name.fill("bea");
  await expect(dialog.getByText("Someone with this name already exists")).toBeVisible();
  await name.fill("Not saved");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(addPerson).toBeFocused();
  await expect(members).toContainText("Bea");
  await expect(members).not.toContainText("Not saved");
  await addPerson.click();
  await expect(name).toBeEmpty();
  await name.fill("Also not saved");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(addPerson).toBeFocused();
  await expect(members).toContainText("Bea");
  await expect(members).not.toContainText("Also not saved");
  await expect(page.getByRole("button", { name: "Save and Finish", exact: true })).toBeEnabled();
});

test("new-group creation uses the same modal without saving on cancellation", async ({ page }) => {
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/new");
  await page.getByPlaceholder("e.g. Goa Trip, Flatmates, Family").fill("New Group");
  for (let step = 0; step < 3; step += 1) {
    await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  }
  const addPerson = page.getByRole("button", { name: "Add another member", exact: true });
  await addPerson.click();
  const dialog = page.getByRole("dialog", { name: "Add a person" });
  await dialog.getByLabel("Name", { exact: true }).fill("Not saved");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(addPerson).toBeFocused();
  const counts = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return { groups: await db.groups.count(), people: await db.people.count() };
  });
  expect(counts).toEqual({ groups: 1, people: 2 });
});
