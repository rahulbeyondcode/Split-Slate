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
    await db.localUser.put({ id: "self", name: "Rahul", icon: "profile-pic/fox-3d.png" });
    await db.people.bulkPut([
      { id: "self", name: "Rahul", icon: "profile-pic/fox-3d.png" },
      { id: "friend", name: "Sam", icon: "profile-pic/panda-3d.png" },
    ]);
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      icon: "travel-and-places/camping-3d.png",
      currency: "INR",
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
      icon: "food-and-drinks/hamburger-3d.png",
      isActive: true,
    });
    await db.expenses.put({
      expenseId: "dinner",
      groupId: "trip",
      expenseName: "Dinner",
      categoryId: "food",
      createdBy: "a",
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "a", amount: 2000 }],
        owes: [
          { memberId: "a", amount: 1000 },
          { memberId: "b", amount: 1000 },
        ],
      },
    });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/dashboard");
});

for (const width of [768, 820, 1440]) {
  test(`stacks sidebar group balances below wrapping names and separates unfilled rows at ${width}px`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Sidebar is only shown on tablet and desktop");
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      await db.groups.update("trip", {
        name: "Weekend trip with a very long group name and SuperLongUnbrokenGroupNameForWrapping",
      });
      await db.expenses.update("dinner", {
        transactions: {
          paid: [{ memberId: "a", amount: 246913578 }],
          owes: [
            { memberId: "a", amount: 123456789 },
            { memberId: "b", amount: 123456789 },
          ],
        },
      });
      await db.groups.put({
        id: "lunch",
        name: "Lunch group with another long name",
        icon: "food-and-drinks/hamburger-3d.png",
        currency: "INR",
        createdAt: 2,
        frequentPayerIds: [],
      });
      await db.members.bulkPut([
        { id: "c", groupId: "lunch", personId: "self" },
        { id: "d", groupId: "lunch", personId: "friend" },
      ]);
      await db.categories.put({
        id: "lunch-food",
        groupId: "lunch",
        name: "Food",
        icon: "food-and-drinks/hamburger-3d.png",
        isActive: true,
      });
      const dinner = (await db.expenses.get("dinner"))!;
      await db.expenses.put({
        ...dinner,
        expenseId: "meal",
        groupId: "lunch",
        expenseName: "Meal",
        categoryId: "lunch-food",
        createdBy: "d",
        transactions: {
          paid: [{ memberId: "d", amount: 246913578 }],
          owes: [
            { memberId: "c", amount: 123456789 },
            { memberId: "d", amount: 123456789 },
          ],
        },
      });
    });
    await page.reload();
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    const rows = sidebar.locator(".side-group");
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toHaveCSS("border-top-width", "0px");
    await expect(rows.last()).toHaveCSS("border-top-width", "1px");
    await expect(rows.locator(".money-positive")).toContainText("+₹");
    await expect(rows.locator(".money-negative")).toContainText("−₹");

    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
      for (const row of await rows.all()) {
        await expect(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await row.hover();
        await expect(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await row.focus();
        await expect(row).toBeFocused();
        await expect(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        // Exercise the existing active class without navigating away from the groups list.
        await row.evaluate((element) => element.classList.add("active"));
        await expect(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await row.evaluate((element) => element.classList.remove("active"));
        await expect(row.locator(".soft-caption")).toHaveText("2 members · 1 expenses");
        const layout = await row.evaluate((element) => {
          const details = element.querySelector(".side-group-details")!;
          const name = details.firstElementChild!;
          const counts = details.querySelector(".soft-caption")!;
          const balance = details.querySelector(".money")!;
          const rowBox = element.getBoundingClientRect();
          return {
            nameTop: name.getBoundingClientRect().top,
            nameBottom: name.getBoundingClientRect().bottom,
            nameLineHeight: parseFloat(getComputedStyle(name).lineHeight),
            countsTop: counts.getBoundingClientRect().top,
            countsBottom: counts.getBoundingClientRect().bottom,
            balanceTop: balance.getBoundingClientRect().top,
            balanceLeft: balance.getBoundingClientRect().left,
            detailsLeft: details.getBoundingClientRect().left,
            contentFits: [name, counts, balance].every((child) => {
              const box = child.getBoundingClientRect();
              return (
                child.scrollWidth <= child.clientWidth + 1 &&
                box.right <= rowBox.right &&
                box.bottom <= rowBox.bottom
              );
            }),
          };
        });
        expect(layout.nameBottom - layout.nameTop).toBeGreaterThan(layout.nameLineHeight);
        expect(layout.countsTop).toBeGreaterThanOrEqual(layout.nameBottom);
        expect(layout.balanceTop).toBeGreaterThan(layout.countsBottom);
        expect(Math.abs(layout.balanceLeft - layout.detailsLeft)).toBeLessThan(1);
        expect(layout.contentFits).toBe(true);
      }
    }
    await sidebar.locator('.side-group[href="/groups/trip"]').click();
    await expect(page).toHaveURL(/\/groups\/trip$/u);
  });
}

for (const width of [320, 820, 1440]) {
  test(`shows group-card member avatars and overflow counts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      await db.groups.put({
        id: "avatar-preview",
        name: "Member avatar preview",
        icon: "travel-and-places/camping-3d.png",
        currency: "INR",
        createdAt: 2,
        frequentPayerIds: [],
      });
      await db.people.bulkPut(
        Array.from({ length: 8 }, (_, index) => ({
          id: `avatar-person-${index}`,
          name: `Extra member ${index + 1}`,
          icon: "profile-pic/fox-3d.png",
        })),
      );
    });
    const card = page.locator('.dashboard-page .group-card[href="/groups/avatar-preview"]');

    for (const count of [0, 1, 2, 3, 5, 6, 10]) {
      await page.evaluate(async (memberCount) => {
        const modulePath = "/src/shared/configs/db.ts";
        const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
        await db.members.where("groupId").equals("avatar-preview").delete();
        const personIds = [
          "self",
          "friend",
          ...Array.from({ length: 8 }, (_, index) => `avatar-person-${index}`),
        ];
        await db.members.bulkPut(
          personIds.slice(0, memberCount).map((personId, index) => ({
            id: `avatar-member-${index}`,
            groupId: "avatar-preview",
            personId,
          })),
        );
      }, count);
      await page.reload();
      await expect(card.locator(".soft-caption")).toHaveText(`${count} members · 0 expenses`);
      const members = card.getByRole("group", { name: "Group members", exact: true });
      if (count === 0) {
        await expect(members).toHaveCount(0);
        continue;
      }

      await expect(members.getByRole("img")).toHaveCount(Math.min(count, 5));
      await expect(members.getByRole("img", { name: "Rahul", exact: true })).toBeVisible();
      await expect(members.getByRole("img", { name: "Rahul", exact: true })).toHaveAttribute(
        "title",
        "Rahul",
      );
      await expect(members.locator('img[alt="Rahul"]')).toHaveAttribute(
        "src",
        /profile-pic\/fox-3d\.png/u,
      );
      if (count > 1) {
        await expect(members.getByRole("img", { name: "Sam", exact: true })).toBeVisible();
        await expect(members.locator('img[alt="Sam"]')).toHaveAttribute(
          "src",
          /profile-pic\/panda-3d\.png/u,
        );
      }
      if (count >= 5) {
        await expect(members.getByRole("img", { name: "Extra member 3", exact: true })).toBeVisible();
      }
      if (count > 5) {
        await expect(
          members.getByLabel(`${count - 5} more members`, { exact: true }),
        ).toHaveText(`+${count - 5}`);
        await expect(members.getByRole("img", { name: "Extra member 4", exact: true })).toHaveCount(0);
      } else {
        await expect(members.getByText(/^\+/u)).toHaveCount(0);
      }

      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
        await expect(members).toBeVisible();
        const layout = await members.evaluate((element) => {
          const cardBox = element.closest(".group-card")!.getBoundingClientRect();
          return {
            widthFits: element.scrollWidth <= element.clientWidth + 1,
            avatarsFit: [...element.querySelectorAll(".avatar")].every((avatar) => {
              const box = avatar.getBoundingClientRect();
              return (
                box.width <= 24 &&
                box.height <= 24 &&
                box.left >= cardBox.left &&
                box.right <= cardBox.right
              );
            }),
          };
        });
        expect(layout.widthFits).toBe(true);
        expect(layout.avatarsFit).toBe(true);
      }
    }
    await card.click();
    await expect(page).toHaveURL(/\/groups\/avatar-preview$/u);
  });
}

test("aligns the profile image with the dashboard greeting", async ({ page }) => {
  const heading = page.getByRole("heading", { level: 1, name: /Rahul/u });
  const textBox = await heading.locator("span").boundingBox();
  const iconBox = await heading.locator("img").boundingBox();
  expect(textBox).not.toBeNull();
  expect(iconBox).not.toBeNull();
  expect(
    Math.abs(textBox!.y + textBox!.height / 2 - (iconBox!.y + iconBox!.height / 2)),
  ).toBeLessThan(3);
});

test("keeps mobile destination titles and subtitles visible at the bottom of each page", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile footer destinations only");
  await page.setViewportSize({ width: 390, height: 320 });

  for (const [route, title] of [
    ["/activity", "Activity"],
    ["/settings", "Settings"],
  ]) {
    await page.goto(route);
    const header = page.locator(".mobile-sticky-page > header");
    const heading = header.getByRole("heading", { level: 1, name: title });
    const subtitle = header.locator(".soft-caption");
    await expect(heading).toBeVisible();
    await expect(subtitle).toBeVisible();
    const initialTop = (await heading.boundingBox())!.y;

    await page.locator("#main-content").evaluate((main) => {
      main.scrollTop = main.scrollHeight;
    });
    await expect
      .poll(() => page.locator("#main-content").evaluate((main) => main.scrollTop))
      .toBeGreaterThan(0);
    await expect(heading).toBeInViewport();
    await expect(subtitle).toBeInViewport();
    expect(Math.abs((await heading.boundingBox())!.y - initialTop)).toBeLessThan(2);
  }
});

test("keeps app-wide Back and title visible while the subtitle and content scroll", async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: isMobile ? 390 : 1280, height: 320 });

  for (const [route, title] of [
    ["/unsettled", "Unsettled"],
    ["/analytics", isMobile ? "Spending by category" : "Analytics"],
  ]) {
    await page.goto(route);
    const pageContent = page.locator(".dashboard-detail-page");
    const back = pageContent.getByRole("button", { name: "Back", exact: true });
    const heading = pageContent.getByRole("heading", { level: 1, name: title });
    const subtitle = pageContent.locator(":scope > .soft-caption");
    await pageContent
      .locator(":scope > .surface")
      .last()
      .evaluate((surface) => {
        surface.style.minHeight = "700px";
      });
    const initialBackTop = (await back.boundingBox())!.y;
    const initialHeadingTop = (await heading.boundingBox())!.y;
    await expect(subtitle).toBeInViewport();

    await page.locator("#main-content").evaluate((main) => {
      main.scrollTop = main.scrollHeight;
    });
    await expect
      .poll(() => page.locator("#main-content").evaluate((main) => main.scrollTop))
      .toBeGreaterThan(0);
    await expect(back).toBeInViewport();
    await expect(heading).toBeInViewport();
    await expect(subtitle).not.toBeInViewport();
    expect(Math.abs((await back.boundingBox())!.y - initialBackTop)).toBeLessThan(2);
    expect(Math.abs((await heading.boundingBox())!.y - initialHeadingTop)).toBeLessThan(2);
  }
});

for (const width of [667, 820, 1440, 1920]) {
  test(`keeps dashboard summary headers outside their boxes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const unsettled = page.getByRole("region", { name: "Unsettled balances", exact: true });
    const chart = page.getByRole("region", { name: "Spending by category", exact: true });

    for (const content of ["populated", "empty"]) {
      if (content === "empty") {
        await page.evaluate(async () => {
          const modulePath = "/src/shared/configs/db.ts";
          const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
          await db.expenses.delete("dinner");
        });
        await page.reload();
        await expect(unsettled.locator(".surface")).toHaveText("All square!");
        await expect(chart.locator(".surface")).toHaveText("No spending yet.");
      } else {
        await expect(unsettled.locator(".surface .ui-row")).toHaveCount(1);
        await expect(chart.locator(".surface").getByRole("link", { name: /Food/u })).toBeVisible();
      }

      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
        for (const section of [unsettled, chart]) {
          const header = section.locator(":scope > header");
          const surface = section.locator(":scope > .surface");
          await expect(header.getByRole("heading", { level: 2 })).toBeVisible();
          await expect(surface).toBeVisible();
          await expect(surface.getByRole("heading")).toHaveCount(0);
          await expect(surface.getByRole("link", { name: /View all/u })).toHaveCount(0);
          const layout = await section.evaluate((element) => {
            const header = element.querySelector(":scope > header")!;
            const surface = element.querySelector(":scope > .surface")!;
            const heading = header.querySelector("h2")!;
            const headerBox = header.getBoundingClientRect();
            const surfaceBox = surface.getBoundingClientRect();
            const sectionBox = element.getBoundingClientRect();
            return {
              topMargin: parseFloat(getComputedStyle(element).marginTop),
              rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
              gap: surfaceBox.top - headerBox.bottom,
              headingOutside: heading.closest(".surface") === null,
              headerBackground: getComputedStyle(header).backgroundColor,
              headerFits: header.scrollWidth <= header.clientWidth + 1,
              surfaceFits:
                surfaceBox.left >= sectionBox.left && surfaceBox.right <= sectionBox.right + 1,
              controlsAbove: [...header.querySelectorAll("a, .soft-caption")].every(
                (control) => control.getBoundingClientRect().bottom < surfaceBox.top,
              ),
            };
          });
          expect(layout.topMargin).toBeCloseTo(layout.rootFontSize, 1);
          expect(layout.gap).toBeCloseTo(layout.rootFontSize * 0.75, 1);
          expect(layout.headingOutside).toBe(true);
          expect(layout.headerBackground).toBe("rgba(0, 0, 0, 0)");
          expect(layout.headerFits).toBe(true);
          expect(layout.surfaceFits).toBe(true);
          expect(layout.controlsAbove).toBe(true);
        }
        await expect(unsettled.locator("header").getByRole("link", { name: /View all/u })).toBeVisible();
        if (width < 768) {
          await expect(chart.locator("header").getByRole("link", { name: "View all" })).toBeVisible();
        }
        if (width >= 1440) {
          const columns = await page.locator(".dashboard-lower").evaluate((element) =>
            getComputedStyle(element).gridTemplateColumns.split(" "),
          );
          expect(columns).toHaveLength(2);
          for (const headerSize of ["natural", "tall-action", "wrapped-title"]) {
            const action = unsettled.locator("header").getByRole("link", { name: /View all/u });
            const title = chart.getByRole("heading", { name: "Spending by category", exact: true });
            if (headerSize === "tall-action") {
              await action.evaluate((element) => {
                element.style.minHeight = "5rem";
              });
            }
            if (headerSize === "wrapped-title") {
              await title.evaluate((element) => {
                element.style.maxWidth = "8rem";
              });
            }
            const unsettledHeader = (await unsettled.locator("header").boundingBox())!;
            const chartHeader = (await chart.locator("header").boundingBox())!;
            const unsettledBox = (await unsettled.locator(".surface").boundingBox())!;
            const chartBox = (await chart.locator(".surface").boundingBox())!;
            expect(chartBox.x).toBeGreaterThan(unsettledBox.x + unsettledBox.width);
            expect(Math.abs(unsettledHeader.y - chartHeader.y)).toBeLessThan(1);
            expect(Math.abs(unsettledHeader.height - chartHeader.height)).toBeLessThan(1);
            expect(Math.abs(unsettledBox.y - chartBox.y)).toBeLessThan(1);
            expect(
              Math.abs(unsettledBox.y + unsettledBox.height - (chartBox.y + chartBox.height)),
            ).toBeLessThan(1);
          }
          await unsettled.locator("header a").evaluate((element) => {
            element.style.removeProperty("min-height");
          });
          await chart.getByRole("heading").evaluate((element) => {
            element.style.removeProperty("max-width");
          });
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator(".dashboard-lower")).toBeHidden();
  });
}

test("opens Analytics from the mobile dashboard chart and returns via Back", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile dashboard navigation only");
  await page.setViewportSize({ width: 667, height: 800 });
  const footer = page.getByRole("navigation", { name: "Bottom navigation" });
  await expect(footer.getByRole("link", { name: "Analytics" })).toHaveCount(0);
  await expect(footer.getByRole("link")).toHaveCount(5);

  const unsettled = page.getByRole("region", { name: "Unsettled balances", exact: true });
  await expect(unsettled.getByText("Across all groups")).toBeVisible();

  const chart = page.getByRole("region", { name: "Spending by category", exact: true });
  await expect(chart).toBeVisible();
  await expect(chart.getByText("All groups · ever")).toBeVisible();
  await chart.getByRole("link", { name: "View all" }).click();
  await expect(page).toHaveURL(/\/analytics$/u);
  const dashboardBack = page.getByRole("button", { name: "Back", exact: true });
  await expect(dashboardBack).toBeVisible();
  await dashboardBack.click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  await chart.getByRole("link", { name: "Spending by category" }).click();
  await expect(page).toHaveURL(/\/analytics$/u);
  await expect(page.getByRole("heading", { name: "Spending by category" })).toBeVisible();
  await expect(page.getByText("Every category across your groups, all time")).toBeVisible();
  await dashboardBack.click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  await chart.getByRole("link", { name: /Food/u }).click();
  await expect(page).toHaveURL(/\/analytics$/u);
  await dashboardBack.click();
  await expect(page).toHaveURL(/\/dashboard$/u);
});

test("returns from Unsettled through history and falls back after direct entry", async ({
  page,
  isMobile,
}) => {
  if (isMobile) {
    await page
      .getByRole("navigation", { name: "Bottom navigation" })
      .getByRole("link", { name: "Unsettled" })
      .click();
  } else {
    const preview = page.getByRole("region", { name: "Unsettled balances", exact: true });
    await preview.getByRole("link", { name: /View all/u }).click();
  }
  await expect(page).toHaveURL(/\/unsettled$/u);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  await page.goto("/unsettled");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
});

test("app-wide Analytics Back falls back to Dashboard after direct entry", async ({ page }) => {
  await page.goto("/analytics");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
});

test("places the purple New group action at the center of the mobile dashboard footer", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile dashboard navigation only");
  await page.setViewportSize({ width: 320, height: 800 });
  const footer = page.getByRole("navigation", { name: "Bottom navigation" });
  await expect(footer.getByRole("link")).toHaveText([
    "Groups",
    "Activity",
    "New group",
    "Unsettled",
    "Settings",
  ]);
  await expect(page.locator(".dashboard-page .mobile-cta")).toHaveCount(0);
  const createLink = footer.getByRole("link", { name: "New group" });
  await expect(createLink).toHaveClass(/mobile-nav-create/u);
  await expect(createLink.locator(".nav-icon")).toHaveCSS("color", "rgb(255, 255, 255)");
  await createLink.click();
  await expect(page).toHaveURL(/\/groups\/new$/u);
  await expect(page.getByRole("heading", { name: "New group" })).toBeVisible();
  await expect(createLink).toHaveAttribute("aria-current", "page");

  await page.goto("/groups/trip");
  await expect(footer.getByRole("link", { name: "New group" })).toHaveCount(0);
});

test("keeps the dashboard banner and both group balance states readable on narrow mobiles", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile dashboard layout only");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.expenses.update("dinner", {
      transactions: {
        paid: [{ memberId: "a", amount: 18996120 }],
        owes: [
          { memberId: "a", amount: 9498060 },
          { memberId: "b", amount: 9498060 },
        ],
      },
    });
    await db.groups.put({
      id: "lunch",
      name: "Lunch group with a longer name",
      icon: "food-and-drinks/hamburger-3d.png",
      currency: "INR",
      createdAt: 2,
      frequentPayerIds: [],
    });
    await db.members.bulkPut([
      { id: "c", groupId: "lunch", personId: "self" },
      { id: "d", groupId: "lunch", personId: "friend" },
    ]);
    await db.categories.put({
      id: "lunch-food",
      groupId: "lunch",
      name: "Food",
      icon: "food-and-drinks/hamburger-3d.png",
      isActive: true,
    });
    await db.expenses.put({
      expenseId: "meal",
      groupId: "lunch",
      expenseName: "Meal",
      categoryId: "lunch-food",
      createdBy: "d",
      createdAt: 2,
      when: 2,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "d", amount: 246913578 }],
        owes: [
          { memberId: "c", amount: 123456789 },
          { memberId: "d", amount: 123456789 },
        ],
      },
    });
  });
  await page.reload();

  for (const width of [320, 393]) {
    await page.setViewportSize({ width, height: 800 });
    const cards = page.locator(".dashboard-page .group-card");
    await expect(cards).toHaveCount(2);
    await expect(
      cards.filter({ hasText: "↓ collect" }).locator(".dashboard-group-status"),
    ).toBeVisible();
    await expect(
      cards.filter({ hasText: "↑ settle" }).locator(".dashboard-group-status"),
    ).toBeVisible();
    await expect(
      cards.filter({ hasText: "↓ collect" }).locator(".dashboard-group-amount"),
    ).toContainText("+₹");
    await expect(
      cards.filter({ hasText: "↑ settle" }).locator(".dashboard-group-amount"),
    ).toContainText("−₹");
    await expect(page.locator(".dashboard-page .hero-box")).toHaveCount(2);

    const layout = await page.evaluate(() => {
      const banner = document.querySelector(".dashboard-page .hero")!;
      const cards = [...document.querySelectorAll(".dashboard-page .group-card")];
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        bannerWidth: banner.getBoundingClientRect().width,
        boxes: [...banner.querySelectorAll(".hero-box")].map(
          (box) => box.getBoundingClientRect().width,
        ),
        cards: cards.map((card) => {
          const amount = card.querySelector(".dashboard-group-amount")!;
          const status = card.querySelector(".dashboard-group-status")!;
          const cardBox = card.getBoundingClientRect();
          const amountBox = amount.getBoundingClientRect();
          const statusBox = status.getBoundingClientRect();
          return {
            amountWithinCard: amountBox.left >= cardBox.left && amountBox.right <= cardBox.right,
            statusWithinCard: statusBox.left >= cardBox.left && statusBox.right <= cardBox.right,
            notOverlapping: amountBox.right <= statusBox.left || amountBox.bottom <= statusBox.top,
            amountUnbroken: getComputedStyle(amount).whiteSpace === "nowrap",
            statusUnbroken: getComputedStyle(status).whiteSpace === "nowrap",
            amountFullyVisible: amount.scrollWidth <= amount.clientWidth,
            status: status.textContent?.trim(),
          };
        }),
      };
    });
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.boxes).toHaveLength(2);
    expect(layout.boxes.every((boxWidth) => boxWidth > layout.bannerWidth / 3)).toBe(true);
    for (const card of layout.cards) {
      expect(card.amountWithinCard).toBe(true);
      expect(card.statusWithinCard).toBe(true);
      expect(card.notOverlapping).toBe(true);
      expect(card.amountUnbroken).toBe(true);
      expect(card.statusUnbroken).toBe(true);
    }
    expect(layout.cards.find((card) => card.status === "↓ collect")?.amountFullyVisible).toBe(true);
  }
});

test("wraps desktop group cards without breaking collect or settle status", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop dashboard layout only");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.groups.bulkPut(
      [2, 3, 4, 5].map((number) => ({
        id: `group-${number}`,
        name: `Group ${number}`,
        icon: "travel-and-places/camping-3d.png",
        currency: "INR",
        createdAt: number,
        frequentPayerIds: [],
      })),
    );
    await db.members.bulkPut([
      { id: "group-2-self", groupId: "group-2", personId: "self" },
      { id: "group-2-friend", groupId: "group-2", personId: "friend" },
    ]);
    await db.categories.put({
      id: "group-2-food",
      groupId: "group-2",
      name: "Food",
      icon: "food-and-drinks/hamburger-3d.png",
      isActive: true,
    });
    await db.expenses.update("dinner", {
      transactions: {
        paid: [{ memberId: "a", amount: 246913578000 }],
        owes: [
          { memberId: "a", amount: 123456789000 },
          { memberId: "b", amount: 123456789000 },
        ],
      },
    });
    await db.expenses.put({
      expenseId: "group-2-meal",
      groupId: "group-2",
      expenseName: "Meal",
      categoryId: "group-2-food",
      createdBy: "group-2-friend",
      createdAt: 2,
      when: 2,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "group-2-friend", amount: 18996120 }],
        owes: [
          { memberId: "group-2-self", amount: 9498060 },
          { memberId: "group-2-friend", amount: 9498060 },
        ],
      },
    });
  });
  await page.reload();

  for (const width of [768, 868, 894, 1079, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const cards = page.locator(".dashboard-page .group-card");
    await expect(cards).toHaveCount(5);
    await expect(page.locator(".dashboard-page .hero")).toHaveCSS("padding", "28px 32px");

    const layout = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".dashboard-page .group-card")];
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        rows: cards.map((card) => card.getBoundingClientRect().top),
        cards: cards.map((card) => {
          const amount = card.querySelector(".dashboard-group-amount")!;
          const status = card.querySelector(".dashboard-group-status")!;
          const cardBox = card.getBoundingClientRect();
          const amountBox = amount.getBoundingClientRect();
          const statusBox = status.getBoundingClientRect();
          return {
            direction: getComputedStyle(card).flexDirection,
            amountFontSize: getComputedStyle(amount).fontSize,
            amountUnbroken: getComputedStyle(amount).whiteSpace === "nowrap",
            statusUnbroken: getComputedStyle(status).whiteSpace === "nowrap",
            amountWithinCard: amountBox.left >= cardBox.left && amountBox.right <= cardBox.right,
            amountFullyVisible: amount.scrollWidth <= amount.clientWidth,
            statusWithinCard: statusBox.left >= cardBox.left && statusBox.right <= cardBox.right,
            notOverlapping: amountBox.right <= statusBox.left || amountBox.bottom <= statusBox.top,
            statusWrapped: statusBox.top >= amountBox.bottom,
            status: status.textContent?.trim(),
          };
        }),
      };
    });
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.rows[3]).toBeGreaterThan(layout.rows[0]);
    expect(layout.rows.filter((top) => top === layout.rows[0]).length).toBeLessThanOrEqual(3);
    if (width === 768) expect(layout.rows[1]).toBeGreaterThan(layout.rows[0]);
    if (width === 868 || width === 894 || width === 1079) {
      expect(layout.rows[1]).toBe(layout.rows[0]);
      expect(layout.rows[2]).toBeGreaterThan(layout.rows[0]);
    }
    if (width === 1920) expect(layout.rows[2]).toBe(layout.rows[0]);
    if (width === 1280) expect(layout.cards.some((card) => card.statusWrapped)).toBe(true);
    expect(layout.cards.some((card) => card.status === "↓ collect")).toBe(true);
    expect(layout.cards.some((card) => card.status === "↑ settle")).toBe(true);
    expect(layout.cards.find((card) => card.status === "↑ settle")?.amountFullyVisible).toBe(true);
    for (const card of layout.cards) {
      expect(card.direction).toBe("column");
      expect(card.amountFontSize).toBe("22px");
      expect(card.amountUnbroken).toBe(true);
      expect(card.statusUnbroken).toBe(true);
      expect(card.amountWithinCard).toBe(true);
      expect(card.statusWithinCard).toBe(true);
      expect(card.notOverlapping).toBe(true);
    }
  }
});

test("labels the unsettled destination as a navigable link", async ({ page, isMobile }) => {
  test.skip(isMobile, "The dashboard's unsettled preview is desktop-only");
  const link = page.getByRole("link", { name: "View all (1)" });
  await expect(link.locator("svg.ui-icon")).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/unsettled$/u);
});

test("keeps group import available from app settings after creating a group", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("link", { name: "Import group" }).click();
  await expect(page).toHaveURL(/\/import$/u);
});
