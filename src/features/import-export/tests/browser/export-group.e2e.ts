/// <reference types="node" />

import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

import { parsePortableGroupCsv } from "@/features/import-export/utils/export-csv";
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
      when: new Date("2026-09-20T12:00:00+05:30").getTime(),
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
      createdAt: 3,
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

test("enforces questionnaire dependencies and receipt-aware format availability", async ({
  page,
}) => {
  await expect(page.getByLabel(/Group information/)).toBeChecked();
  await expect(page.getByLabel(/Group information/)).toBeDisabled();
  await expect(page.getByLabel(/^Categories/)).not.toBeChecked();
  await expect(page.getByLabel(/^Tags/)).not.toBeChecked();
  await expect(page.getByLabel(/^Members/)).not.toBeChecked();
  await expect(page.getByLabel(/^Expenses/)).not.toBeChecked();
  await expect(page.getByLabel(/^Receipt attachments/)).not.toBeChecked();
  await expect(page.getByText(/Anyone holding this unencrypted link/)).toBeVisible();

  await page.getByLabel(/^Expenses/).check();
  await expect(page.getByRole("dialog", { name: "Related content included" })).toContainText(
    "Expenses reference categories and members",
  );
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByLabel(/^Categories/)).toBeChecked();
  await expect(page.getByLabel(/^Categories/)).toBeDisabled();
  await expect(page.getByLabel(/^Members/)).toBeChecked();
  await expect(page.getByLabel(/^Members/)).toBeDisabled();

  await page.getByLabel(/^Receipt attachments/).check();
  await expect(page.getByRole("dialog", { name: "Related content included" })).toContainText(
    "Receipt files belong to expenses",
  );
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByLabel(/^Expenses/)).toBeDisabled();
  await expect(page.getByRole("button", { name: "Create transfer link" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Download CSV" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Download ZIP" })).toBeEnabled();

  await page.getByLabel(/^Receipt attachments/).uncheck();
  await expect(page.getByLabel(/^Expenses/)).toBeEnabled();
  await expect(page.getByRole("button", { name: "Create transfer link" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Download CSV" })).toBeEnabled();
});

test("creates a durable import link and downloads a selected typed CSV", async ({ page }) => {
  await page.getByLabel(/^Expenses/).check();
  await page.getByRole("button", { name: "Got it" }).click();
  await page.getByLabel(/^Tags/).check();
  await page.getByRole("button", { name: "Create transfer link" }).click();
  const link = await page.getByLabel("Transfer link", { exact: true }).inputValue();
  expect(link.length).toBeLessThanOrEqual(32_000);
  expect(link).toContain("/import#v1.");

  await page.getByLabel(/^Tags/).uncheck();
  await expect(page.getByLabel("Transfer link", { exact: true })).toHaveCount(0);
  await page.getByLabel(/^Tags/).check();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("weekend-trip.csv");
  const path = await download.path();
  expect(path).not.toBeNull();
  const bundle = await parsePortableGroupCsv(await readFile(path!, "utf8"));
  expect(bundle.manifest.includedCounts).toMatchObject({
    categories: 1,
    tags: 1,
    members: 2,
    expenses: 1,
    attachments: 0,
  });
  expect(bundle.expenses[0].attachmentIds).toEqual([]);
  await expect(page.getByRole("status")).toHaveText(
    "CSV downloaded. Receipt files are not included.",
  );
});

test("downloads ZIP with verified selected receipt bytes", async ({ page }) => {
  await page.getByLabel(/^Receipt attachments/).check();
  await page.getByRole("button", { name: "Got it" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download ZIP" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("weekend-trip.zip");
  const path = await download.path();
  expect(path).not.toBeNull();
  const archive = unzipSync(new Uint8Array(await readFile(path!)));
  expect(Object.keys(archive).sort()).toEqual([
    "README.txt",
    "attachments/1-receipt.jpg",
    "attachments/index.json",
    "group.csv",
    "manifest.json",
  ]);
  expect(strFromU8(archive["attachments/1-receipt.jpg"])).toBe("receipt bytes");
  expect((await parsePortableGroupCsv(strFromU8(archive["group.csv"]))).attachments).toHaveLength(
    1,
  );
});
