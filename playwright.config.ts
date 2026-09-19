import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/features/expenses/tests/browser",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  outputDir: "/tmp/split-slate-playwright",
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], locale: "en-IN", timezoneId: "Asia/Kolkata" },
    },
    { name: "mobile", use: { ...devices["Pixel 7"], locale: "en-IN", timezoneId: "Asia/Kolkata" } },
  ],
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
