import { expect, test } from "@playwright/test";

test("shows a helpful missing-page screen with a way home", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");

  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Magnifying glass" })).toBeVisible();
  await expect(page.getByText("Hey developer")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);

  await page.getByRole("link", { name: "Go to home" }).click();
  await expect(page).toHaveURL(/\/onboarding$/u);
});
