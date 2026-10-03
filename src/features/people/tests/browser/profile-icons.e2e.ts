import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

const seedGroup = async (page: Page) => {
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
    await db.people.put({ id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" });
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      icon: "travel-and-places/camping-3d.png",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: [],
    });
    await db.members.put({ id: "owner", groupId: "trip", personId: "self" });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
};

test("offers all profile images while creating an account", async ({ page }) => {
  await page.goto("/onboarding/setup");
  await page.getByLabel("Your name").fill("Amy");
  const picker = page.getByRole("group", { name: "Choose icon" });
  await expect(picker.getByRole("button", { name: "Icon Fox" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(picker.getByRole("button", { name: "Icon Fox" })).toHaveAttribute("title", "Fox");
  const selected = picker.getByRole("img", { name: "Selected icon: Fox" });
  await expect(selected).toHaveAttribute("title", "Fox");
  await expect(picker.getByText("Fox", { exact: true })).toHaveCount(0);
  const selectedBox = await selected.boundingBox();
  const quickBox = await picker.getByRole("button", { name: "Icon Fox" }).boundingBox();
  expect(selectedBox).not.toBeNull();
  expect(quickBox).not.toBeNull();
  expect(selectedBox!.width).toBeGreaterThan(quickBox!.width);
  expect(quickBox!.y).toBeGreaterThan(selectedBox!.y + selectedBox!.height);
  await picker.getByRole("button", { name: "Browse more" }).click();
  await expect(picker.locator(".emoji-picker-featured")).toHaveCount(0);
  await expect(picker.locator(".emoji-picker-gallery")).toBeVisible();
  await picker.getByRole("button", { name: "Close gallery" }).click();
  await expect(picker.locator(".emoji-picker-featured")).toBeVisible();
  await expect(picker.locator(".emoji-picker-gallery")).toHaveCount(0);
  await picker.getByRole("button", { name: "Browse more" }).click();
  await picker.getByRole("searchbox", { name: "Search icons" }).fill("woman teacher");
  await expect(picker.getByText("1 icon")).toBeVisible();
  await picker.getByRole("button", { name: "Icon Woman teacher" }).click();
  await expect(picker.getByRole("img", { name: "Selected icon: Woman teacher" })).toHaveAttribute(
    "title",
    "Woman teacher",
  );
  await page.getByRole("button", { name: "Save and Proceed" }).click();
  const icon = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.localUser.toArray())[0]?.icon;
  });
  expect(icon).toBe("profile-pic/woman-teacher-3d-default.png");
});

test("creates and edits a contact with a profile image, then adds that contact to a group", async ({
  page,
}) => {
  await seedGroup(page);
  await page.goto("/friends");
  await page.locator("button:visible").filter({ hasText: "New contact" }).first().click();
  const editor = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Add a person" }) });
  await editor.getByLabel("Name").fill("Sam");
  const picker = editor.getByRole("group", { name: "Choose icon" });
  await picker.getByRole("button", { name: "Browse more" }).click();
  await picker.getByRole("searchbox", { name: "Search icons" }).fill("robot");
  await picker.getByRole("button", { name: "Icon Robot" }).last().click();
  await editor.getByRole("button", { name: "Add contact" }).click();
  const contact = page.getByRole("listitem").filter({ hasText: "Sam" });
  await expect(contact.locator('img[src$="/profile-pic/robot-3d.png"]')).toBeVisible();
  await contact.getByRole("button", { name: "Edit Sam" }).click();
  const editForm = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Edit person" }) });
  const editPicker = editForm.getByRole("group", { name: "Choose icon" });
  await editPicker.getByRole("button", { name: "Icon Panda" }).click();
  await editForm.getByRole("button", { name: "Save" }).click();
  await page.goto("/groups/trip/members");
  await page.getByRole("button", { name: "Add member" }).click();
  await page.getByRole("button", { name: /Sam/ }).click();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "Sam" })
      .locator('img[src$="/profile-pic/panda-3d.png"]'),
  ).toBeVisible();
});
