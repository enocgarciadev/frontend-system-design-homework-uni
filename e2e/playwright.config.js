import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    {
      command: 'go run ./server/cmd/api',
      cwd: root,
      url: 'http://127.0.0.1:3001/api/health',
      reuseExisting: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm dev --host 127.0.0.1',
      cwd: root,
      url: 'http://127.0.0.1:5173',
      reuseExisting: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
