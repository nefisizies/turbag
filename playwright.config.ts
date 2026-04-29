import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: process.env.TEST_URL ?? "https://turbag-app-production.up.railway.app",
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
