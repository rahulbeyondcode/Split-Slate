/// <reference types="node" />

import { readFile } from "node:fs/promises";
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
  await expect(page.getByText("Choose who you are", { exact: true })).toBeVisible();
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

test("imports a group-only CSV through the fresh-device identity step", async ({ page }) => {
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
  await page.getByLabel(/Choose CSV or ZIP/).setInputFiles({
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
  await page.getByLabel(/^Receipt attachments/).check();
  await page.getByRole("button", { name: "Got it" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download ZIP" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();

  await page.goto("/import");
  await page.getByLabel(/Choose CSV or ZIP/).setInputFiles({
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
