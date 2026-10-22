import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  workers: 1,
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:5182" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: process.env.FG_BUILD
      ? "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5182"
      : "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5182",
    url: "http://127.0.0.1:5182",
    reuseExistingServer: false,
  },
});
