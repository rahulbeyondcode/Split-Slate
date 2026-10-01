import { expect, test } from "@playwright/test";

test("installs its shell, launches an onboarding deep link offline, and keeps local storage", async ({
  page,
  context,
}) => {
  await page.goto("/onboarding/setup");
  await expect(page.getByLabel("Your name")).toBeVisible();
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest.name).toContain("Split Slate");
  expect(manifest.icons).toHaveLength(3);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await new Promise<void>((resolve) => {
      if (navigator.serviceWorker.controller) resolve();
      else
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        });
    });
    if (!registration.active) throw new Error("No active service worker");
    localStorage.setItem("pwa-test", "preserved");
  });
  await context.setOffline(true);
  await page.goto("/onboarding/setup");
  await expect(page.getByLabel("Your name")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pwa-test"))).toBe("preserved");
  expect(
    await page.evaluate(
      () =>
        new Promise<boolean>((resolve, reject) => {
          const opening = indexedDB.open("split-slate");
          opening.onerror = () => reject(opening.error);
          opening.onsuccess = () => {
            const transaction = opening.result.transaction("settings", "readonly");
            const request = transaction.objectStore("settings").get("onboarding");
            request.onsuccess = () => resolve(Boolean(request.result));
            request.onerror = () => reject(request.error);
          };
        }),
    ),
  ).toBe(true);
});

test("downloads the selected icon library and repairs a missing file without clearing others", async ({
  page,
}) => {
  await page.goto("/onboarding/setup");
  await expect(page.getByLabel("Your name")).toBeVisible();
  const inventory = await (await page.request.get("/icon-inventory.json")).json();
  await expect
    .poll(
      () =>
        page.evaluate(
          async () => (await (await caches.open("split-slate-icons-v1")).keys()).length,
        ),
      { timeout: 110_000 },
    )
    .toBe(inventory.length);
  await page.evaluate(async () => {
    const cache = await caches.open("split-slate-icons-v1");
    const other = new URL("emoji-icons/profile-pic/fox-3d.png", location.origin);
    const missing = new URL("emoji-icons/activities/balloon-3d.png", location.origin);
    const otherPresent = Boolean(await cache.match(other.href));
    const missingRemoved = await cache.delete(missing.href);
    if (!otherPresent || !missingRemoved) {
      throw new Error(
        `Icon cache setup failed: other=${otherPresent} missing=${missingRemoved}; first=${(await cache.keys())[0]?.url}`,
      );
    }
    await cache.put(
      other.href,
      new Response("broken image", { headers: { "content-type": "image/png" } }),
    );
    (await navigator.serviceWorker.ready).active?.postMessage({ type: "SYNC_ICONS" });
  });
  await expect
    .poll(
      () =>
        page.evaluate(async () =>
          Boolean(
            await (
              await caches.open("split-slate-icons-v1")
            ).match(new URL("emoji-icons/activities/balloon-3d.png", location.origin).href),
          ),
        ),
      { timeout: 110_000 },
    )
    .toBe(true);
  expect(
    await page.evaluate(async () =>
      Boolean(
        await (
          await caches.open("split-slate-icons-v1")
        ).match(new URL("emoji-icons/profile-pic/fox-3d.png", location.origin).href),
      ),
    ),
  ).toBe(true);
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const response = await (
            await caches.open("split-slate-icons-v1")
          ).match(new URL("emoji-icons/profile-pic/fox-3d.png", location.origin).href);
          return (await response?.arrayBuffer())?.byteLength ?? 0;
        }),
      { timeout: 110_000 },
    )
    .toBeGreaterThan(1000);
});

test("announces a waiting update and does not apply it without consent", async ({ page }) => {
  await page.addInitScript(() => {
    const events = new EventTarget();
    const registration = new EventTarget();
    const worker = {
      postMessage(message: { type: string }) {
        if (message.type === "SKIP_WAITING") {
          sessionStorage.setItem("pwa-update-applied", "yes");
          events.dispatchEvent(new Event("controllerchange"));
        }
      },
    };
    Object.assign(registration, {
      waiting: worker,
      active: worker,
      update: async () => undefined,
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: Object.assign(events, {
        controller: worker,
        register: async () => registration,
      }),
    });
  });
  await page.goto("/onboarding/setup");
  await expect(page.getByText("Split Slate update available")).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("pwa-update-applied"))).toBeNull();
  await page.getByRole("button", { name: "Update and reload" }).click();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("pwa-update-applied")))
    .toBe("yes");
});
