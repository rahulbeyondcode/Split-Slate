/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

import { ICON_CACHE, syncIcons } from "./icon-cache";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));
clientsClaim();

registerRoute(
  ({ request, url }) =>
    request.destination === "image" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith(new URL("emoji-icons/", self.registration.scope).pathname),
  async ({ request }) => {
    const cache = await caches.open(ICON_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.headers.get("content-type")?.includes("image/png")) {
      try {
        await cache.put(request, response.clone());
      } catch {
        // Quota pressure must never prevent the original image from rendering.
      }
    }
    return response;
  },
);

let syncing: Promise<void> | null = null;

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
  if (event.data?.type === "SYNC_ICONS") {
    syncing ??= syncIcons(self.registration.scope, async (progress) => {
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.postMessage(progress);
    }).finally(() => {
      syncing = null;
    });
    event.waitUntil(syncing);
  }
});
