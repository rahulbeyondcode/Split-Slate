/// <reference types="node" />

import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

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
      name: "Weekend Trip",
      currency: "INR",
      icon: "🏕️",
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
    await db.tags.put({ id: "holiday", groupId: "trip", name: "Holiday", color: "#123456" });
    await db.expenses.put({
      expenseId: "dinner",
      groupId: "trip",
      expenseName: "Dinner",
      categoryId: "food",
      createdBy: "a",
      createdAt: 2,
      when: 3,
      splitType: "equal",
      splitMeta: [],
      tagIds: ["holiday"],
      attachmentIds: ["receipt"],
      transactions: {
        paid: [{ memberId: "a", amount: 10000 }],
        owes: [
          { memberId: "a", amount: 5000 },
          { memberId: "b", amount: 5000 },
        ],
      },
    });
    await db.attachments.put({
      id: "receipt",
      expenseId: "dinner",
      blob: new Blob(["receipt bytes"], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
      createdAt: 4,
    });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip/settings");
});

test("imports a Link on a fresh device and maps the chosen member to local identity", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Export group" }).click();
  await page.getByLabel(/^Expenses/).check();
  await page.getByRole("button", { name: "Got it" }).click();
  await page.getByLabel(/^Tags/).check();
  await page.getByRole("button", { name: "Create transfer link" }).click();
  const link = await page.getByLabel("Transfer link", { exact: true }).inputValue();

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.delete();
  });
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Import Weekend Trip" })).toBeVisible();
  await expect(page.getByText("Verified transfer contents")).toBeVisible();
  await expect(page.getByText("Expenses").locator("..")).toContainText("1");
  await page.getByRole("button", { name: "Import group" }).click();
  await expect(page.getByRole("group", { name: "Which member are you?" })).toBeVisible();
  await page.getByLabel("Amy").check();
  await page.getByRole("button", { name: "Import group" }).click();
  await expect(page).toHaveURL(/\/groups\/[^/]+$/u);
  await expect(page.getByRole("heading", { name: "Weekend Trip", exact: true })).toBeVisible();

  const result = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return {
      group: await db.groups.toCollection().first(),
      localUser: await db.localUser.toCollection().first(),
      expenseCount: await db.expenses.count(),
      onboarding: await db.settings.get("onboarding"),
    };
  });
  expect(result.group?.id).not.toBe("trip");
  expect(result.localUser?.name).toBe("Amy");
  expect(result.expenseCount).toBe(1);
  expect(result.onboarding).toMatchObject({ complete: true, groupId: result.group?.id });
});

test("requires a choice for same-name contacts and cancels without writing", async ({ page }) => {
  await page.getByRole("button", { name: "Export group" }).click();
  await page.getByLabel(/^Members/).check();
  await page.getByRole("button", { name: "Create transfer link" }).click();
  const link = await page.getByLabel("Transfer link", { exact: true }).inputValue();
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.groups.update("trip", { name: "First Trip" });
    await db.members.update("b", { personId: "different-bea" });
    await db.people.delete("friend");
    await db.people.add({ id: "different-bea", name: "Bea", icon: "🐼" });
  });
  await page.goto(link);
  await page.getByLabel("Amy").check();
  await page.getByRole("button", { name: "Import group" }).click();
  const dialog = page.getByRole("dialog", { name: "Resolve matching names" });
  await expect(dialog).toContainText("First Trip");
  await expect(dialog).toContainText("Weekend Trip");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();
  expect(
    await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      return db.groups.count();
    }),
  ).toBe(1);

  await page.getByRole("button", { name: "Import group" }).click();
  await dialog.getByLabel("Name for the incoming contact").fill("Bea from Weekend Trip");
  await dialog.getByRole("button", { name: "Confirm and import" }).click();
  await expect(page.getByRole("heading", { name: "Weekend Trip", exact: true })).toBeVisible();
  const names = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return (await db.people.toArray()).map((person) => person.name).sort();
  });
  expect(names).toEqual(["Amy", "Bea", "Bea from Weekend Trip"]);
});

test("imports a group-only CSV through the fresh-device identity step", async ({ page }) => {
  await page.getByRole("button", { name: "Export group" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.delete();
  });
  await page.goto("/import");
  await page.getByLabel("Choose your group transfer").setInputFiles({
    name: "weekend-trip.csv",
    mimeType: "text/csv",
    buffer: await readFile(path!),
  });
  await expect(page.getByText("No categories were transferred")).toBeVisible();
  await page.getByPlaceholder("Enter your name").fill("Recipient");
  await page.getByRole("button", { name: "Import group" }).click();
  await expect(page).toHaveURL(/\/groups\/[^/]+$/u);

  const result = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return {
      localUser: await db.localUser.toCollection().first(),
      members: await db.members.count(),
      categories: await db.categories.count(),
      expenses: await db.expenses.count(),
    };
  });
  expect(result.localUser?.name).toBe("Recipient");
  expect(result.members).toBe(1);
  expect(result.categories).toBeGreaterThan(0);
  expect(result.expenses).toBe(0);
});

test("imports a receipt ZIP beside an existing same-name group without overwriting it", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Export group" }).click();
  await expect(
    page.getByText(/Keep downloaded ZIP and CSV files unchanged/u).locator(".."),
  ).toHaveClass(/status-banner--warning/u);
  await page.getByLabel(/^Receipt attachments/).check();
  await page.getByRole("button", { name: "Got it" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download ZIP" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();

  await page.goto("/import");
  await page.getByLabel("Choose your group transfer").setInputFiles({
    name: "weekend-trip.zip",
    mimeType: "application/zip",
    buffer: await readFile(path!),
  });
  await expect(page.getByText(/new editable group named/)).toContainText("Weekend Trip (2)");
  await page.getByLabel("Amy").check();
  await page.getByRole("button", { name: "Import group" }).click();
  await expect(page.getByRole("heading", { name: "Weekend Trip (2)", exact: true })).toBeVisible();

  const result = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    const groups = await db.groups.toArray();
    const attachments = await db.attachments.toArray();
    return {
      names: groups.map((group) => group.name).sort(),
      attachmentCount: attachments.length,
      receiptTexts: await Promise.all(attachments.map((attachment) => attachment.blob.text())),
    };
  });
  expect(result.names).toEqual(["Weekend Trip", "Weekend Trip (2)"]);
  expect(result.attachmentCount).toBe(2);
  expect(result.receiptTexts).toContain("receipt bytes");
});

test("points an app backup uploaded as a group to Restore app backup", async ({ page }) => {
  await page.goto("/import");
  const back = page.getByRole("link", { name: "Back to SplitSlate" });
  await expect(back).toHaveClass(/page-back-link/u);
  const backBox = await back.boundingBox();
  const titleBox = await page.getByRole("heading", { name: "Import a group" }).boundingBox();
  expect(backBox!.y).toBeLessThan(titleBox!.y);
  await expect(
    page.getByText(/Look for your-group-name\.zip or your-group-name\.csv/u),
  ).toBeVisible();
  await page.getByLabel("Choose your group transfer").setInputFiles({
    name: "split-slate-backup-2026-09-29.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(zipSync({ "backup.json": strToU8("{}"), "manifest.json": strToU8("{}") })),
  });
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("backs up the whole app");
  await expect(alert).toHaveClass(/status-banner--error/u);
  await expect(alert.locator(":scope > svg.ui-icon")).toHaveCount(1);
  await expect(alert.getByRole("link", { name: "Go to Restore app backup" })).toHaveClass(
    /status-banner-action/u,
  );
  await expect(alert.getByRole("link", { name: "Go to Restore app backup" })).toHaveAttribute(
    "href",
    "/restore",
  );
});
