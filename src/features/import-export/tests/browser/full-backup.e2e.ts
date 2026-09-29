/// <reference types="node" />

import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
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
      { id: "bea", name: "Bea", icon: "🐻" },
    ]);
    await db.groups.bulkPut([
      {
        id: "trip",
        name: "Weekend Trip",
        icon: "🏕️",
        currency: "INR",
        createdAt: 1,
        frequentPayerIds: ["a"],
      },
      {
        id: "home",
        name: "Home",
        icon: "🏡",
        currency: "INR",
        createdAt: 2,
        frequentPayerIds: ["h"],
      },
    ]);
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "b", groupId: "trip", personId: "bea" },
      { id: "h", groupId: "home", personId: "self" },
    ]);
    await db.categories.bulkPut([
      { id: "food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
      { id: "bills", groupId: "home", name: "Bills", icon: "💡", isActive: true },
    ]);
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
    localStorage.setItem("split-slate-theme", "dark");
  });
  await page.goto("/settings");
});

const downloadBackup = async (page: Page) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download app backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^split-slate-backup-\d{4}-\d{2}-\d{2}\.zip$/u);
  const path = await download.path();
  expect(path).not.toBeNull();
  return readFile(path!);
};

test("validates and confirms a replacement without merging existing data", async ({ page }) => {
  const archive = await downloadBackup(page);
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.groups.add({
      id: "extra",
      name: "Extra",
      icon: "🧳",
      currency: "INR",
      createdAt: 5,
      frequentPayerIds: [],
    });
  });
  await page.goto("/restore");
  await page.getByLabel("Choose your app backup").setInputFiles({
    name: "family-data.zip",
    mimeType: "application/zip",
    buffer: archive,
  });
  const dialog = page.getByRole("dialog", { name: "Replace all SplitSlate data?" });
  await expect(dialog).toContainText("2 groups");
  await expect(dialog.getByRole("status").locator("strong")).toHaveText(/^\d+ seconds?$/u);
  await expect(dialog.getByRole("status").locator("strong")).toHaveClass(/font-extrabold/u);
  await expect(dialog.getByRole("button", { name: "Replace and restore" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Keep current data" }).click();
  await expect(dialog).not.toBeVisible();
  expect(
    await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      return db.groups.count();
    }),
  ).toBe(3);

  await page.getByLabel("Choose your app backup").setInputFiles({
    name: "family-data.zip",
    mimeType: "application/zip",
    buffer: archive,
  });
  await expect(dialog.getByRole("button", { name: "Replace and restore" })).toBeEnabled({
    timeout: 15_000,
  });
  await dialog.getByRole("button", { name: "Replace and restore" }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
  const restored = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return {
      groups: (await db.groups.toArray()).map((group) => group.name).sort(),
      receipt: await (await db.attachments.get("receipt"))?.blob.text(),
      theme: localStorage.getItem("split-slate-theme"),
    };
  });
  expect(restored).toEqual({
    groups: ["Home", "Weekend Trip"],
    receipt: "receipt bytes",
    theme: "dark",
  });
});

test("restores a full backup before onboarding on a fresh device", async ({ page }) => {
  const archive = await downloadBackup(page);
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.delete();
    localStorage.removeItem("split-slate-theme");
  });
  await page.goto("/restore");
  await page.getByLabel("Choose your app backup").setInputFiles({
    name: "full-backup.zip",
    mimeType: "application/zip",
    buffer: archive,
  });
  await expect(page.getByRole("button", { name: "Replace and restore" })).toBeEnabled({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Replace and restore" }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
  await expect(page.getByText("Weekend Trip").first()).toBeVisible();
  await expect(page.getByText("Home").first()).toBeVisible();
});

test("explains the expected backup and gives guidance for the wrong ZIP", async ({ page }) => {
  await page.goto("/restore");
  await expect(page.getByText(/Look for split-slate-backup-YYYY-MM-DD\.zip/u)).toBeVisible();
  const warning = page
    .getByText("This backup ZIP is not encrypted.", { exact: false })
    .locator("..");
  await expect(warning).toHaveClass(/status-banner--warning/u);
  await expect(warning.locator(":scope > svg.ui-icon")).toHaveCount(1);
  const picker = page.getByLabel("Choose your app backup");
  await picker.setInputFiles({
    name: "notes.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(zipSync({ "notes.txt": strToU8("hi") })),
  });
  await expect(page.getByRole("alert")).toContainText("We couldn't use this file");
  await expect(page.getByRole("alert")).toHaveClass(/status-banner--error/u);
  await expect(page.getByRole("alert").locator(":scope > svg.ui-icon")).toHaveCount(1);
  await expect(page.getByRole("alert")).toContainText("split-slate-backup-YYYY-MM-DD.zip");
  await expect(
    page.getByRole("dialog", { name: "Replace all SplitSlate data?" }),
  ).not.toBeVisible();

  await picker.setInputFiles({
    name: "my-trip.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(zipSync({ "group.csv": strToU8("single group") })),
  });
  await expect(page.getByRole("alert")).toContainText("for one group");
  await expect(
    page.getByRole("alert").getByRole("link", { name: "Go to Import group" }),
  ).toHaveClass(/status-banner-action/u);
  await expect(
    page.getByRole("alert").getByRole("link", { name: "Go to Import group" }),
  ).toHaveAttribute("href", "/import");

  await picker.setInputFiles({
    name: "single-group.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("group"),
  });
  await expect(page.getByRole("alert")).toContainText("not CSV");
  await expect(
    page.getByRole("alert").getByRole("link", { name: "Go to Import group" }),
  ).toBeVisible();
});

test("Back returns to the screen that opened Restore", async ({ page }) => {
  await page.getByRole("link", { name: "Restore app backup" }).click();
  await expect(page).toHaveURL(/\/restore$/u);
  const back = page.getByRole("button", { name: "Back", exact: true });
  await expect(back).toHaveClass(/page-back-link/u);
  const backBox = await back.boundingBox();
  const titleBox = await page.getByRole("heading", { name: "Restore SplitSlate" }).boundingBox();
  expect(backBox!.y).toBeLessThan(titleBox!.y);
  await back.click();
  await expect(page).toHaveURL(/\/settings$/u);

  await page.goto("/import");
  await page.getByRole("link", { name: "Restore the whole app instead." }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/import$/u);

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.delete();
  });
  await page.goto("/onboarding");
  await page.getByRole("link", { name: /Restore everything/u }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/u);
});
