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
    localStorage.setItem("split-slate-install-dismissed", String(Date.now()));
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

test("offers installation on desktop and mobile and opens the browser prompt", async ({ page }) => {
  await page.goto("/onboarding/setup");
  const dialog = page.getByRole("dialog", { name: "Take Split Slate with you" });
  await expect(dialog).toBeVisible();
  await page.evaluate(() => {
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: async () => {
        sessionStorage.setItem("native-install-prompt", "shown");
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
    if (!event.defaultPrevented) throw new Error("Install event was not captured");
  });
  await dialog.getByRole("button", { name: "Install", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("native-install-prompt")))
    .toBe("shown");
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(dialog).toHaveCount(0);
  await page.evaluate(() =>
    localStorage.setItem(
      "split-slate-install-dismissed",
      String(Date.now() - 6 * 24 * 60 * 60 * 1000),
    ),
  );
  await page.reload();
  await expect(dialog).toHaveCount(0);
});

test("shows browser instructions when no install prompt is available", async ({ page }) => {
  await page.goto("/onboarding/setup");
  const dialog = page.getByRole("dialog", { name: "Take Split Slate with you" });
  await dialog.getByRole("button", { name: "Install", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText(/browser|menu/i);
  await expect(dialog).toBeVisible();
});

test("prevents accidental dismissal for two seconds and never closes on overlay clicks", async ({
  page,
}) => {
  await page.goto("/onboarding/setup");
  const dialog = page.getByRole("dialog", { name: "Take Split Slate with you" });
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const close = dialog.getByRole("button", { name: "Close install message" });
  await expect(cancel).toBeDisabled();
  await expect(close).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await page.mouse.click(1, 1);
  await expect(dialog).toBeVisible();
  await expect(cancel).toBeEnabled();
  await expect(close).toBeEnabled();
  await page.mouse.click(1, 1);
  await expect(dialog).toBeVisible();
  await close.click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(dialog).toHaveCount(0);
});

test("reminds again after five days, including earlier permanent dismissals", async ({ page }) => {
  await page.goto("/onboarding/setup");
  const dialog = page.getByRole("dialog", { name: "Take Split Slate with you" });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  expect(
    Number(await page.evaluate(() => localStorage.getItem("split-slate-install-dismissed"))),
  ).toBeGreaterThan(0);
  await page.reload();
  await expect(dialog).toHaveCount(0);

  await page.evaluate(() => localStorage.setItem("split-slate-install-dismissed", "true"));
  await page.reload();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await page.evaluate(() =>
    localStorage.setItem(
      "split-slate-install-dismissed",
      String(Date.now() - 4 * 24 * 60 * 60 * 1000),
    ),
  );
  await page.reload();
  await expect(dialog).toHaveCount(0);

  await page.evaluate(() =>
    localStorage.setItem(
      "split-slate-install-dismissed",
      String(Date.now() - 5 * 24 * 60 * 60 * 1000),
    ),
  );
  await page.reload();
  await expect(dialog).toBeVisible();
});

test("reopens installation from Settings after dismissal and captures a later browser prompt", async ({
  page,
}) => {
  await page.goto("/onboarding/setup");
  const dialog = page.getByRole("dialog", { name: "Take Split Slate with you" });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("split-slate");
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => reject(opening.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(["settings", "localUser"], "readwrite");
      transaction.objectStore("settings").put({
        id: "onboarding",
        complete: true,
        lastCompletedStep: "members",
        groupId: null,
      });
      transaction.objectStore("localUser").put({ id: "self", name: "Amy", icon: "🦊" });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.goto("/settings");
  await expect(dialog).toHaveCount(0);
  await page.evaluate(() => {
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: async () => sessionStorage.setItem("manual-install-prompt", "shown"),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
    if (!event.defaultPrevented) throw new Error("Install event was not captured while hidden");
  });
  await page.getByRole("button", { name: "Install app" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Install", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("manual-install-prompt")))
    .toBe("shown");
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(dialog).toHaveCount(0);
});

test("does not invite someone already using the installed app", async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) =>
      query === "(display-mode: standalone)"
        ? Object.assign(original(query), { matches: true })
        : original(query);
  });
  await page.goto("/onboarding/setup");
  await expect(page.getByRole("dialog", { name: "Take Split Slate with you" })).toHaveCount(0);
});
