import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/features/pwa/tests/browser",
  testMatch: "*.pwa.ts",
  outputDir: "/tmp/split-slate-pwa-playwright",
  timeout: 120_000,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:4174" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm preview --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
