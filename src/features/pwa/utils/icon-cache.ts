/// <reference lib="webworker" />

interface IconRecord {
  file: string;
  sha256: string;
}

export interface IconProgress {
  type: "ICON_PROGRESS";
  state: "downloading" | "ready" | "error";
  completed: number;
  total: number;
  message?: string;
}

export const ICON_CACHE = "split-slate-icons-v1";

const digest = async (response: Response) => {
  const bytes = await response.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const syncIcons = async (
  scope: string,
  report: (progress: IconProgress) => Promise<void>,
) => {
  let completed = 0;
  let total = 0;
  try {
    const manifestResponse = await fetch(new URL("icon-inventory.json", scope), {
      cache: "no-store",
    });
    if (!manifestResponse.ok) throw new Error("Could not check the icon library");
    const inventory: unknown = await manifestResponse.json();
    if (
      !Array.isArray(inventory) ||
      inventory.length === 0 ||
      !inventory.every(
        (entry): entry is IconRecord =>
          typeof entry?.file === "string" &&
          /^[a-z0-9-]+\/[a-z0-9-]+\.png$/.test(entry.file) &&
          typeof entry?.sha256 === "string" &&
          /^[a-f0-9]{64}$/.test(entry.sha256),
      )
    ) {
      throw new Error("Invalid icon inventory");
    }
    total = inventory.length;
    const cache = await caches.open(ICON_CACHE);
    await report({ type: "ICON_PROGRESS", state: "downloading", completed, total });
    for (const { file, sha256 } of inventory) {
      const url = new URL(`emoji-icons/${file}`, scope);
      const cached = await cache.match(url.href);
      if (!cached || (await digest(cached)) !== sha256) {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok || !response.headers.get("content-type")?.includes("image/png")) {
          throw new Error(`Could not download ${file}`);
        }
        if ((await digest(response.clone())) !== sha256) {
          throw new Error(`Icon verification failed: ${file}`);
        }
        // Replace one verified file at a time. A failed download never removes its old copy.
        await cache.put(url.href, response);
      }
      completed += 1;
      if (completed % 10 === 0 || completed === total) {
        await report({ type: "ICON_PROGRESS", state: "downloading", completed, total });
      }
    }
    await report({ type: "ICON_PROGRESS", state: "ready", completed, total });
  } catch (error) {
    await report({
      type: "ICON_PROGRESS",
      state: "error",
      completed,
      total,
      message: error instanceof Error ? error.message : "Could not cache icons",
    });
  }
};
