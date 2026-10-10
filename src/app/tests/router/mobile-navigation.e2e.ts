import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("split-slate-install-dismissed", String(Date.now()));
  });
  await page.goto("/onboarding");
  await page.waitForFunction(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    return useStore.getState().initialized;
  });
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    const person = { id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" };
    await db.localUser.put(person);
    await db.people.put(person);
    await db.groups.bulkPut([
      {
        id: "trip",
        name: "Weekend Trip",
        icon: "travel-and-places/camping-3d.png",
        currency: "INR",
        createdAt: 1,
        frequentPayerIds: ["a"],
      },
      {
        id: "other",
        name: "Other Group",
        icon: "travel-and-places/camping-3d.png",
        currency: "INR",
        createdAt: 2,
        frequentPayerIds: [],
      },
    ]);
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "other-member", groupId: "other", personId: "self" },
    ]);
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "food-and-drinks/hamburger-3d.png",
      isActive: true,
    });
    await db.expenses.bulkPut(
      Array.from({ length: 24 }, (_, index) => ({
        expenseId: `expense-${index}`,
        groupId: "trip",
        expenseName: `Expense ${index}`,
        createdBy: "a",
        categoryId: "food",
        tagIds: [],
        attachmentIds: [],
        createdAt: index + 1,
        when: new Date(2026, 8, index + 1).getTime(),
        splitType: "equal" as const,
        splitMeta: [],
        transactions: {
          paid: [{ memberId: "a", amount: 1000 }],
          owes: [{ memberId: "a", amount: 1000 }],
        },
      })),
    );
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip");
});

test("expands upward, preserves the bottom row, and reverses on Close", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile group navigation only");
  const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
  const primary = navigation.locator(".mobile-nav-primary-row");
  const more = navigation.getByRole("button", { name: "More", exact: true });
  const extra = navigation.locator("#mobile-nav-more");
  await expect(primary.getByRole("link")).toHaveText(["Overview", "Expenses", "Add", "Members"]);
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(more).toHaveAttribute("aria-controls", "mobile-nav-more");
  await expect(extra).toHaveAttribute("inert", "");
  await expect(extra).toHaveAttribute("aria-hidden", "true");
  await expect(navigation.getByRole("link")).toHaveCount(4);
  await expect(page.locator(".group-page > a.mobile-cta")).toHaveCount(0);
  const primaryBox = (await primary.boundingBox())!;
  const collapsedBox = (await navigation.boundingBox())!;
  await more.click();
  const close = navigation.getByRole("button", { name: "Close", exact: true });
  await expect(close).toHaveAttribute("aria-expanded", "true");
  await expect(extra).not.toHaveAttribute("inert", "");
  await expect(extra).toHaveAttribute("aria-hidden", "false");
  await expect(extra.getByRole("link")).toHaveText([
    "Balances",
    "Analytics",
    "Activity",
    "Cats & Tags",
    "Settings",
  ]);
  await expect
    .poll(async () => (await navigation.boundingBox())!.height)
    .toBeGreaterThan(collapsedBox.height + 40);
  await expect
    .poll(async () => Math.abs((await primary.boundingBox())!.y - primaryBox.y))
    .toBeLessThan(1);
  const expandedBox = (await navigation.boundingBox())!;
  expect(
    Math.abs(expandedBox.y + expandedBox.height - (collapsedBox.y + collapsedBox.height)),
  ).toBeLessThan(1);
  await close.click();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(extra).toHaveAttribute("inert", "");
  await expect
    .poll(async () => Math.abs((await navigation.boundingBox())!.height - collapsedBox.height))
    .toBeLessThan(1);
});

test("reaches every More destination and highlights its context after collapse", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile group navigation only");
  const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
  for (const [label, suffix] of [
    ["Balances", "balances"],
    ["Analytics", "analytics"],
    ["Activity", "activity"],
    ["Cats & Tags", "categories"],
    ["Settings", "settings"],
  ]) {
    await page.goto("/groups/trip");
    await navigation.getByRole("button", { name: "More", exact: true }).click();
    await navigation.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/groups/trip/${suffix}$`, "u"));
    const more = navigation.getByRole("button", { name: "More", exact: true });
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await expect(more).toHaveClass(/active/u);
    await more.click();
    await expect(navigation.getByRole("link", { name: label, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});

test("keeps Add available on all group screens and preserves filtered expense URLs", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile group navigation only");
  const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
  const add = navigation.getByRole("link", { name: "Add expense", exact: true });
  for (const suffix of [
    "",
    "/expenses",
    "/members",
    "/categories",
    "/balances",
    "/analytics",
    "/activity",
    "/settings",
    "/expenses/expense-0",
  ]) {
    await page.goto(`/groups/trip${suffix}`);
    await expect(add).toBeVisible();
    await expect(add).toHaveAttribute("href", "/groups/trip/expenses/new");
    await expect(add).toHaveClass(/mobile-nav-create/u);
    await expect(page.locator(".group-page > a.mobile-cta")).toHaveCount(0);
  }
  await page.goto("/groups/trip/expenses?categoryIds=food&sort=oldest");
  await expect(add).toHaveAttribute(
    "href",
    "/groups/trip/expenses/new?categoryIds=food&sort=oldest",
  );
  await navigation.getByRole("button", { name: "More", exact: true }).click();
  await add.click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses\/new\?categoryIds=food&sort=oldest$/u);
  await expect(navigation).toHaveCount(0);
  await page.getByRole("link", { name: "Back to expenses", exact: true }).click();
  await expect(page).toHaveURL(/\/groups\/trip\/expenses\?categoryIds=food&sort=oldest$/u);
  await expect(navigation.getByRole("button", { name: "More", exact: true })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.goto("/groups/trip/expenses/expense-0/edit");
  await expect(navigation).toHaveCount(0);
});

test("supports keyboard toggling, Escape, and hidden-row focus exclusion", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile group navigation only");
  const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
  const more = navigation.getByRole("button", { name: "More", exact: true });
  await more.focus();
  await page.keyboard.press("Enter");
  const balances = navigation.getByRole("link", { name: "Balances", exact: true });
  await balances.focus();
  await expect(balances).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Space");
  const close = navigation.getByRole("button", { name: "Close", exact: true });
  await expect(close).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Space");
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await navigation.getByRole("link", { name: "Overview", exact: true }).focus();
  for (const name of ["Expenses", "Add expense", "Members"]) {
    await page.keyboard.press("Tab");
    await expect(navigation.getByRole("link", { name, exact: true })).toBeFocused();
  }
  await page.keyboard.press("Tab");
  await expect(more).toBeFocused();
});

test("resets expansion on primary navigation, history, group changes, and viewport changes", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile group navigation only");
  const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
  const more = navigation.getByRole("button", { name: "More", exact: true });
  await more.click();
  await navigation.getByRole("link", { name: "Expenses", exact: true }).click();
  await expect(navigation.getByRole("link", { name: "Expenses", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  await page.goBack();
  await expect(page).toHaveURL(/\/groups\/trip$/u);
  await expect(navigation.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  await page.goForward();
  await expect(navigation.getByRole("link", { name: "Expenses", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  await page.locator(".group-page-header").getByRole("link", { name: "Back to dashboard" }).click();
  await page
    .getByRole("link", { name: /Other Group/u })
    .first()
    .click();
  await expect(page).toHaveURL(/\/groups\/other$/u);
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  await expect(navigation.getByRole("link", { name: "Balances", exact: true })).toHaveAttribute(
    "href",
    "/groups/other/balances",
  );
  await page.setViewportSize({ width: 820, height: 900 });
  await expect(navigation).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Sidebar" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(more).toHaveAttribute("aria-expanded", "false");
});

for (const width of [280, 320, 390, 767]) {
  for (const theme of ["light", "dark"] as const) {
    test(`fits navbar and content at ${width}px in ${theme} mode`, async ({ page, isMobile }) => {
      test.skip(!isMobile, "Mobile group navigation only");
      await page.setViewportSize({ width, height: 800 });
      await page.evaluate((value) => localStorage.setItem("split-slate-theme", value), theme);
      await page.goto("/groups/trip/expenses");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const main = page.locator("#main-content");
      const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
      const more = navigation.getByRole("button", { name: "More", exact: true });
      for (const expanded of [false, true]) {
        if (expanded) {
          await more.click();
          await expect(navigation.locator(".mobile-nav-more-row > a").last()).toHaveCSS(
            "transform",
            "matrix(1, 0, 0, 1, 0, 0)",
          );
        }
        await expect
          .poll(() =>
            navigation.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
          )
          .toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        await expect
          .poll(async () => {
            const padding = await main.evaluate((element) =>
              Number.parseFloat(getComputedStyle(element).paddingBottom),
            );
            return padding - (await navigation.boundingBox())!.height;
          })
          .toBeGreaterThanOrEqual(0);
        const controls = navigation.getByRole("link").or(navigation.getByRole("button"));
        for (const control of await controls.all()) {
          const box = (await control.boundingBox())!;
          expect(box.height).toBeGreaterThanOrEqual(48);
          expect(box.width).toBeGreaterThanOrEqual(48);
        }
        await main.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        const last = page.getByRole("list", { name: "Expenses", exact: true }).locator("li").last();
        await expect
          .poll(async () => {
            const box = (await last.boundingBox())!;
            return box.y + box.height - (await navigation.boundingBox())!.y;
          })
          .toBeLessThanOrEqual(1);
      }
      await navigation.getByRole("button", { name: "Close", exact: true }).click();
      await navigation.getByRole("link", { name: "Members", exact: true }).click();
      await more.click();
      const contained = page.locator(".group-page-contained");
      await expect
        .poll(async () => {
          const box = (await contained.boundingBox())!;
          return box.y + box.height - (await navigation.boundingBox())!.y;
        })
        .toBeLessThanOrEqual(1);
    });
  }
}

test("keeps desktop/tablet actions unchanged and mobile creation centered", async ({ page }) => {
  for (const width of [768, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/groups/trip");
    await expect(page.getByRole("navigation", { name: "Bottom navigation" })).toHaveCount(0);
    const navigation = page.getByRole("navigation", { name: "Group navigation" });
    await expect(navigation.getByRole("link", { name: "Categories & Tags" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Add expense", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "More", exact: true })).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  const footer = page.getByRole("navigation", { name: "Bottom navigation" });
  const addBox = (await footer.getByRole("link", { name: "Add expense" }).boundingBox())!;
  expect(Math.abs(addBox.x + addBox.width / 2 - 195)).toBeLessThan(1);
  await page.goto("/dashboard");
  await expect(footer.getByRole("link")).toHaveText([
    "Groups",
    "Activity",
    "New group",
    "Unsettled",
  ]);
  await expect(footer.getByRole("button", { name: "More", exact: true })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(footer.locator("#mobile-nav-more")).toHaveAttribute("inert", "");
  const createBox = (await footer.getByRole("link", { name: "New group" }).boundingBox())!;
  expect(Math.abs(createBox.x + createBox.width / 2 - 195)).toBeLessThan(1);
});

test("unfolds the dashboard row upward and supports Close and keyboard dismissal", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile dashboard navigation only");
  await page.goto("/dashboard");
  const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
  const primary = navigation.locator(".mobile-nav-primary-row");
  const extra = navigation.locator("#mobile-nav-more");
  const more = navigation.getByRole("button", { name: "More", exact: true });
  const collapsedBox = (await navigation.boundingBox())!;
  const primaryBox = (await primary.boundingBox())!;
  await expect(extra).toHaveAttribute("inert", "");
  await expect(extra).toHaveAttribute("aria-hidden", "true");
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(extra.getByRole("link")).toHaveText([
    "Contacts",
    "Analytics",
    "Import",
    "Restore",
    "Settings",
  ]);
  await expect(extra).not.toHaveAttribute("inert", "");
  await expect
    .poll(async () => (await navigation.boundingBox())!.height)
    .toBeGreaterThan(collapsedBox.height + 40);
  await expect
    .poll(async () => Math.abs((await primary.boundingBox())!.y - primaryBox.y))
    .toBeLessThan(1);
  const contacts = navigation.getByRole("link", { name: "Contacts", exact: true });
  await contacts.focus();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(extra).toHaveAttribute("inert", "");
  await more.click();
  await navigation.getByRole("button", { name: "Close", exact: true }).click();
  await expect
    .poll(async () => Math.abs((await navigation.boundingBox())!.height - collapsedBox.height))
    .toBeLessThan(1);
});

test("opens dashboard More destinations without changing data on public entry", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile dashboard navigation only");
  const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
  for (const [label, path] of [
    ["Contacts", "/friends"],
    ["Analytics", "/analytics"],
    ["Import", "/import"],
    ["Restore", "/restore"],
    ["Settings", "/settings"],
  ]) {
    await page.goto("/dashboard");
    await navigation.getByRole("button", { name: "More", exact: true }).click();
    const link = navigation.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", path);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${path}$`, "u"));
    if (path === "/import" || path === "/restore") {
      await expect(navigation).toHaveCount(0);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: path === "/import" ? "Import a group" : "Restore SplitSlate",
        }),
      ).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      const counts = await page.evaluate(async () => {
        const modulePath = "/src/shared/configs/db.ts";
        const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
        return { groups: await db.groups.count(), expenses: await db.expenses.count() };
      });
      expect(counts).toEqual({ groups: 2, expenses: 24 });
      await page.getByRole("link", { name: "Back to SplitSlate", exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/u);
    } else {
      const more = navigation.getByRole("button", { name: "More", exact: true });
      await expect(more).toHaveAttribute("aria-expanded", "false");
      await expect(more).toHaveClass(/active/u);
      await more.click();
      await expect(navigation.getByRole("link", { name: label, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      if (path === "/friends") {
        const addContact = page.getByRole("button", { name: "New contact", exact: true });
        await expect(addContact).toBeVisible();
        const box = (await addContact.boundingBox())!;
        expect(box.y + box.height).toBeLessThan((await navigation.boundingBox())!.y);
      }
    }
  }
});

test("keeps one mobile contact action clear of More and restores focus after cancellation", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile contact creation only");
  for (const width of [280, 390, 640, 767]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/friends");
    const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
    const addContact = page.getByRole("button", { name: "New contact", exact: true });
    await expect(addContact).toHaveCount(1);
    await expect(
      page.locator("header").getByRole("button", { name: "New contact", exact: true }),
    ).toHaveCount(0);
    await navigation.getByRole("button", { name: "More", exact: true }).click();
    await expect(addContact).toBeInViewport();
    const box = (await addContact.boundingBox())!;
    expect(box.y + box.height).toBeLessThan((await navigation.boundingBox())!.y);
    await addContact.click();
    const editor = page.getByRole("dialog", { name: "Add a person", exact: true });
    await expect(editor.getByRole("textbox", { name: "Name", exact: true })).toBeFocused();
    await editor.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(addContact).toBeFocused();
    await navigation.getByRole("button", { name: "Close", exact: true }).click();
  }
});

test("keeps the dashboard navbar across app routes and resets on navigation and resize", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile dashboard navigation only");
  const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
  const more = navigation.getByRole("button", { name: "More", exact: true });
  for (const path of [
    "/dashboard",
    "/activity",
    "/analytics",
    "/unsettled",
    "/friends",
    "/settings",
    "/groups/new",
  ]) {
    await page.goto(path);
    await expect(navigation.locator(".mobile-nav-primary-row").getByRole("link")).toHaveText([
      "Groups",
      "Activity",
      "New group",
      "Unsettled",
    ]);
    await expect(more).toHaveAttribute("aria-expanded", "false");
  }
  await page.goto("/dashboard");
  await more.click();
  await navigation.getByRole("link", { name: "Activity", exact: true }).click();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/u);
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(navigation).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Sidebar" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(more).toHaveAttribute("aria-expanded", "false");
});

for (const width of [280, 320, 390, 767]) {
  for (const theme of ["light", "dark"] as const) {
    test(`fits dashboard navbar and content at ${width}px in ${theme} mode`, async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, "Mobile dashboard navigation only");
      await page.setViewportSize({ width, height: 800 });
      await page.evaluate((value) => localStorage.setItem("split-slate-theme", value), theme);
      await page.goto("/dashboard");
      const main = page.locator("#main-content");
      const navigation = page.getByRole("navigation", { name: "Bottom navigation" });
      const primary = navigation.locator(".mobile-nav-primary-row");
      const primaryBox = (await primary.boundingBox())!;
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      for (const expanded of [false, true]) {
        if (expanded) {
          await navigation.getByRole("button", { name: "More", exact: true }).click();
          await expect(navigation.locator(".mobile-nav-more-row > a").last()).toHaveCSS(
            "transform",
            "matrix(1, 0, 0, 1, 0, 0)",
          );
        }
        await expect
          .poll(() =>
            navigation.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
          )
          .toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        expect(Math.abs((await primary.boundingBox())!.y - primaryBox.y)).toBeLessThan(1);
        const controls = navigation.getByRole("link").or(navigation.getByRole("button"));
        for (const control of await controls.all()) {
          const box = (await control.boundingBox())!;
          expect(box.height).toBeGreaterThanOrEqual(48);
          expect(box.width).toBeGreaterThanOrEqual(48);
        }
        await main.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        const last = main.locator(".dashboard-page > *").last();
        const box = (await last.boundingBox())!;
        expect(box.y + box.height).toBeLessThanOrEqual((await navigation.boundingBox())!.y + 1);
      }
    });
  }
}
