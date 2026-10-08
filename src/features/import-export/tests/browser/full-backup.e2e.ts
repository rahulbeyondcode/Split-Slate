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

test("Back to SplitSlate returns home from every restore entry point", async ({ page }) => {
  await page.getByRole("link", { name: "Restore app backup" }).click();
  await expect(page).toHaveURL(/\/restore$/u);
  const back = page.getByRole("link", { name: "Back to SplitSlate", exact: true });
  await expect(back).toHaveClass(/page-back-link/u);
  await expect(back).toHaveAttribute("href", "/");
  const backBox = await back.boundingBox();
  const titleBox = await page.getByRole("heading", { name: "Restore SplitSlate" }).boundingBox();
  expect(backBox!.y).toBeLessThan(titleBox!.y);
  await back.click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  await page.goto("/import");
  const prompt = page.getByText("Have a ZIP containing all your groups?", { exact: true });
  const restoreLink = page.getByRole("link", { name: "Restore the whole app instead." });
  await expect(restoreLink).toHaveCSS("text-decoration-line", "underline");
  const promptColor = await prompt.evaluate((element) => getComputedStyle(element).color);
  expect(await restoreLink.evaluate((element) => getComputedStyle(element).color)).not.toBe(
    promptColor,
  );
  const promptBox = (await prompt.boundingBox())!;
  const linkBox = (await restoreLink.boundingBox())!;
  expect(linkBox.y).toBeGreaterThanOrEqual(promptBox.y + promptBox.height);
  expect(linkBox.x + linkBox.width / 2).toBeCloseTo(promptBox.x + promptBox.width / 2, 0);
  await restoreLink.click();
  await page.getByRole("link", { name: "Back to SplitSlate", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
  await page.goto("/restore");
  await page.getByRole("link", { name: "Back to SplitSlate", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.delete();
  });
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Start with your saved data" })
    .getByRole("link", { name: /^Restore your app/u })
    .click();
  await page.getByRole("link", { name: "Back to SplitSlate", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/u);
  await page.goto("/import");
  await expect(page.getByRole("link", { name: "Back to SplitSlate", exact: true })).toHaveAttribute(
    "href",
    "/",
  );
  await page.getByRole("link", { name: "Back to SplitSlate", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/u);
});

test("keeps import branding without a stacked decorative icon on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/import");
  const panel = page.getByRole("complementary", { name: "About group import" });
  await expect(panel.getByText("SplitSlate", { exact: true })).toBeVisible();
  await expect(panel.locator(".import-panel-icon")).toBeHidden();
  await expect(page.getByLabel("Choose your group transfer")).toHaveAttribute("type", "file");
  await expect(page.locator(".import-file-icon")).toBeVisible();
  await expect(page.getByText("Choose your group transfer", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(panel.locator(".import-panel-icon")).toBeVisible();
});

test("offers a clear group-import link from the restore page", async ({ page }) => {
  await page.goto("/restore");
  const prompt = page.getByText("Have a file or link for just one group?", { exact: true });
  const importLink = page.getByRole("link", { name: "Import a group instead.", exact: true });
  await expect(prompt).toBeVisible();
  await expect(importLink).toHaveAttribute("href", "/import");
  await expect(importLink).toHaveCSS("text-decoration-line", "underline");
  const promptColor = await prompt.evaluate((element) => getComputedStyle(element).color);
  expect(await importLink.evaluate((element) => getComputedStyle(element).color)).not.toBe(
    promptColor,
  );
  const promptBox = (await prompt.boundingBox())!;
  const linkBox = (await importLink.boundingBox())!;
  expect(linkBox.y).toBeGreaterThanOrEqual(promptBox.y + promptBox.height);
  expect(linkBox.x + linkBox.width / 2).toBeCloseTo(promptBox.x + promptBox.width / 2, 0);
  await importLink.click();
  await expect(page).toHaveURL(/\/import$/u);
  await expect(page.getByRole("heading", { name: "Import a group", exact: true })).toBeVisible();
});

test("matches import and restore entry layouts with distinct panel colors at every width", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 900, height: 900 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/import");
    const importPanel = page.getByRole("complementary", { name: "About group import" });
    await expect(importPanel).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const importPanelBox = (await importPanel.boundingBox())!;
    const importColor = await importPanel.evaluate(
      (element) => getComputedStyle(element).backgroundImage,
    );
    const importColumns = await page
      .locator(".import-layout")
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
    await expect(
      page.getByRole("link", { name: "Restore the whole app instead." }),
    ).toHaveAttribute("href", "/restore");
    await page.goto("/restore");
    const restorePanel = page.getByRole("complementary", { name: "About app restore" });
    const restoreMain = page.getByRole("region", { name: "Restore your app", exact: true });
    await expect(restorePanel.getByText("SplitSlate", { exact: true })).toBeVisible();
    await expect(
      restorePanel.getByRole("heading", { name: "Just as you saved it." }),
    ).toBeVisible();
    const restorePanelBox = (await restorePanel.boundingBox())!;
    const restoreMainBox = (await restoreMain.boundingBox())!;
    const restoreColor = await restorePanel.evaluate(
      (element) => getComputedStyle(element).backgroundImage,
    );
    const restoreColumns = await page
      .locator(".import-layout")
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
    expect(restoreColor).not.toBe(importColor);
    expect(restoreColor).toContain("linear-gradient");
    expect(importColor).toContain("linear-gradient");
    expect(restoreColumns).toBe(importColumns);
    expect(restorePanelBox.width).toBeCloseTo(importPanelBox.width, 0);
    if (viewport.width < 768) {
      await expect(restorePanel.locator(".import-panel-icon")).toBeHidden();
      expect(restoreMainBox.y).toBeGreaterThanOrEqual(restorePanelBox.y + restorePanelBox.height);
    } else {
      await expect(restorePanel.locator(".import-panel-icon")).toBeVisible();
      expect(restoreMainBox.x).toBeGreaterThanOrEqual(restorePanelBox.x + restorePanelBox.width);
      expect(restoreMainBox.y).toBeCloseTo(restorePanelBox.y, 0);
    }
    await expect(page.locator(".import-file-icon")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
  }
});

for (const complete of [false, true]) {
  for (const theme of ["dark", "light"]) {
    test(`applies the saved theme on direct import and restore visits with ${complete ? "completed" : "incomplete"} onboarding in ${theme} mode`, async ({
      page,
    }) => {
      await page.evaluate(
        async ({ complete, theme }) => {
          const modulePath = "/src/shared/configs/db.ts";
          const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
          const onboarding: OnboardingSettings = {
            id: "onboarding",
            complete,
            lastCompletedStep: "members",
            groupId: "trip",
          };
          await db.settings.put(onboarding);
          localStorage.setItem("split-slate-theme", theme);
        },
        { complete, theme },
      );
      for (const path of ["/import", "/restore"]) {
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(`${path}$`, "u"));
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
    });
  }
}

test("settings backup actions stay readable and use the app theme at every width", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 900, height: 900 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/settings");
    const theme = page.getByRole("switch", { name: "Dark theme" });
    if ((await theme.getAttribute("aria-checked")) === "true") await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const actions = page.getByRole("group", { name: "App backup actions" });
    await actions.scrollIntoViewIfNeeded();
    const download = actions.getByRole("button", { name: "Download app backup", exact: true });
    const restore = actions.getByRole("link", { name: "Restore app backup", exact: true });
    const importGroup = page.getByRole("link", { name: "Import group", exact: true });
    await expect(download).toBeVisible();
    await expect(restore).toBeVisible();
    await expect(download).toBeEnabled();
    await expect(download).toHaveAttribute("aria-busy", "false");
    await expect(download).toHaveAccessibleDescription("Save a snapshot of everything.");
    await expect(restore).toHaveAccessibleDescription("Bring back a saved snapshot.");
    await expect(restore).toHaveAttribute("href", "/restore");
    await expect(importGroup).toHaveAttribute("href", "/import");
    await expect(importGroup).toHaveAccessibleDescription("Bring a shared or saved group.");
    const actionsBox = (await actions.boundingBox())!;
    const downloadBox = (await download.boundingBox())!;
    const restoreBox = (await restore.boundingBox())!;
    for (const action of [download, restore, importGroup]) {
      const box = (await action.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(actionsBox.x);
      expect(box.x + box.width).toBeLessThanOrEqual(actionsBox.x + actionsBox.width + 1);
      expect(await action.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );
      await expect(action.locator(".settings-data-action-icon svg")).toHaveCount(1);
    }
    if (viewport.width < 768) {
      expect(restoreBox.y).toBeGreaterThanOrEqual(downloadBox.y + downloadBox.height);
      expect(downloadBox.width).toBeCloseTo(actionsBox.width, 0);
      expect(restoreBox.width).toBeCloseTo(actionsBox.width, 0);
    }
    const downloadColor = await download.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    const restoreColor = await restore.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(downloadColor).toBe(restoreColor);
    const titleColor = await restore
      .locator(".settings-data-action-title")
      .evaluate((element) => getComputedStyle(element).color);
    for (const action of [download, restore, importGroup]) {
      await expect(action.locator(".settings-data-action-title")).toHaveCSS("color", titleColor);
      await expect(action.locator(".settings-data-action-title")).toHaveCSS("font-weight", "400");
    }
    await page.getByRole("switch", { name: "Dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(download).not.toHaveCSS("background-color", downloadColor);
    await expect(restore).not.toHaveCSS("background-color", restoreColor);
    await page.getByRole("switch", { name: "Dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
  }
});
