import { test, expect } from '@playwright/test';

test.describe('Offline and Sync Stress Tests', () => {

    test('Violent Network Interruption: Create items offline and sync', async ({ page, context }) => {
        // 1. Go to new item page
        await page.goto('/items/new');

        // 2. Go offline abruptly
        await context.setOffline(true);

        // 3. Create 3 items quickly
        for (let i = 1; i <= 3; i++) {
            await page.locator('input[name="name"]').fill(`Offline Item ${i}`);
            await page.locator('input[name="quantity"]').fill('1');
            await page.getByRole('button', { name: /Guardar Item/i }).click();

            // Should show offline warning or toast that it was saved locally
            await expect(page.getByText(/Guardado localmente|offline/i)).toBeVisible({ timeout: 5000 });

            // Go back to create another one
            if (i < 3) await page.goto('/items/new');
        }

        // 4. Force reload or close "tab"
        await page.reload();

        // 5. Go online
        await context.setOffline(false);

        // 6. Navigate to dashboard or items list to force sync
        await page.goto('/containers');

        // 7. Verify items are eventually synced
        for (let i = 1; i <= 3; i++) {
            await expect(page.getByText(`Offline Item ${i}`)).toBeVisible({ timeout: 15000 });
        }
    });

    // TODO: Add Race Condition test for offline edits vs online deletes using Playwright multiple contexts

    // TODO: Add Quota Exceeded test by injecting massive local storage/indexedDb blobs and verifying app doesn't crash
});
