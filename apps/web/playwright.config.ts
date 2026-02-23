import { defineConfig, devices } from '@playwright/test';

/**
 * SmartInventory — Playwright E2E Config
 * Docs: https://playwright.dev/docs/test-configuration
 *
 * Require:
 *  - docker compose up -d (stack completo corriendo)
 *  - DEV_AUTH_BYPASS=true en apps/web/.env.local (para tests que no prueban auth)
 *  - O un magic link válido para el test de login real
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,       // Secuencial para no interferir entre tests
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ],

    use: {
        // URL base de la app (web en Docker en :3001, o dev local en :3000)
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        locale: 'es-MX',
        timezoneId: 'America/Mexico_City',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 14'] },
        },
    ],

    // Arrancar el servidor Next si no está corriendo (dev local)
    // webServer: {
    //     command: 'npm run dev',
    //     url: 'http://localhost:3000',
    //     reuseExistingServer: !process.env.CI,
    // },
});
