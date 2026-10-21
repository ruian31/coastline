import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
const baseURL=process.env.TEST_BASE_URL??'http://127.0.0.1:5188';
const webkitProjects=process.env.RUN_WEBKIT==='1'?[{name:'mobile-webkit',timeout:150000,use:{...devices['iPhone 13'],browserName:'webkit' as const,launchOptions:{executablePath:path.resolve('work/webkit-runtime/launch-webkit.sh'),args:[]}}}]:[];

export default defineConfig({
  testDir: './tests',
  // One worker: parallel headless WebGL contexts contend for the GPU, and the
  // frame-time collapse makes game time drift from wall time, flaking timed
  // gameplay phases and screenshot baselines.
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    launchOptions: {args: ['--enable-gpu', '--use-gl=angle', '--use-angle=gl']},
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: baseURL.includes(':4188')?'npm run preview':'npm run dev',
    url: baseURL,
    // Reuse a dev server that is already running for the canvas inspector;
    // CI always starts a fresh one.
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
  projects: [
    ...webkitProjects,
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // devices['Desktop Chrome'] sets no channel, so Playwright launches the
        // bundled headless shell, which has no GPU backend and falls back to
        // SwiftShader (CPU) — roughly 4x slower raster and meaningless FPS.
        // The full Chromium build renders headless on the real GPU.
        channel: 'chrome',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      // Android Chrome viewport/touch/UA; iOS WebKit has its own project above.
      // Both emulators still use this host GPU, so phone performance needs real hardware.
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        defaultBrowserType: 'chromium',
        channel: 'chrome',
      },
    },
  ],
});
