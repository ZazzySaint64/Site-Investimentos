import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// The e2e users (python -m pipeline.e2e_users) are stored here.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// Another project may hold port 3000; E2E_PORT picks another one.
const port = Number(process.env.E2E_PORT ?? 3000);

// Local only for now: these tests read the real remote database.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1, // the tests share real users
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: "npm run dev",
    port,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
