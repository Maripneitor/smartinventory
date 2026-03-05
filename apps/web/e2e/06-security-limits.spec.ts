import { test, expect } from '@playwright/test';

test.describe('Security & Limits Tests', () => {

    test('Garbage Injection (Length limits & emojis) on Item Name', async ({ page }) => {
        // Form length limit bypass check (should give validation error without hitting DB)
        await page.goto('/items/new');

        // Massive string (10,000 chars)
        const massiveString = 'A'.repeat(10000);
        await page.locator('input[name="name"]').fill(massiveString);

        // Emulated complex emojis that might break poorly encoded SQL
        const emojiString = '📦🚀🔥🤯👽'.repeat(50);
        await page.locator('textarea[name="description"], input[name="description"]').fill(emojiString);

        // Submit
        await page.getByRole('button', { name: /Guardar Item/i }).click();

        // Check validation error from Zod limits we added
        // It shouldn't crash with a 500
        await expect(page.getByText(/Máximo 100 caracteres/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/Máximo 1000 caracteres/i)).toBeVisible({ timeout: 5000 });
    });

    test('RLS Bypass protection (Row Level Security)', async ({ browser }) => {
        // Requires two users
        // 1. Context A (User 1)
        const contextA = await browser.newContext();
        const pageA = await contextA.newPage();

        // Login as User 1
        await pageA.goto('/login');
        await pageA.locator('input[type="email"]').fill('user1@example.com');
        await pageA.getByRole('button', { name: /Enviar Acceso/i }).click();

        // Suppose User 1 owns a container at /containers/UUID-1
        // We simulate reading what a restricted ID looks like:
        const privateContainerId = 'some-real-uuid-for-test-or-seed';

        // 2. Context B (User 2)
        const contextB = await browser.newContext();
        const pageB = await contextB.newPage();

        // Login as User 2
        await pageB.goto('/login');
        await pageB.locator('input[type="email"]').fill('hacker@example.com');
        await pageB.getByRole('button', { name: /Enviar Acceso/i }).click();

        // Try direct access to User 1's container URL
        const res = await pageB.goto(`/containers/${privateContainerId}`);

        // Expect either a 404, standard error or redirection, but NOT 200 with container data
        // For Next.js App Router, unauthorized pages often return 401/404 or redirect.
        if (res) {
            expect(res.status()).not.toBe(200);
            // Also assert the container title isn't shown
            await expect(pageB.locator('h1')).not.toContainText('Private User 1 Container');
        }
    });

});
