import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 30000,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5174" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: process.env.FG_BUILD
    ? [
        {
          command:
            "php -S 127.0.0.1:5174 -t tests/server tests/server/production-router.php",
          url: "http://127.0.0.1:5174",
          reuseExistingServer: false,
          stderr: "ignore",
        },
      ]
    : [
        {
          command:
            "php -S 127.0.0.1:5175 -t tests/server tests/server/router.php",
          url: "http://127.0.0.1:5175/health",
          reuseExistingServer: false,
          stderr: "ignore",
        },
        {
          command:
            "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174",
          url: "http://127.0.0.1:5174",
          reuseExistingServer: false,
          stderr: "ignore",
        },
      ],
});
