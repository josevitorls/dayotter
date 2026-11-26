import { defineConfig, devices } from "@playwright/test";

// Mobile first (80/20 rule), then desktop; one worker so bookings don't race for slots.
export default defineConfig({
  testDir: ".",
  workers: 2,
  timeout: 180_000,
  reporter: [["list"], ["json", { outputFile: "/out/report.json" }]],
  use: {
    baseURL: "https://agenda.dzb.events",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  outputDir: "/out/artifacts",
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
