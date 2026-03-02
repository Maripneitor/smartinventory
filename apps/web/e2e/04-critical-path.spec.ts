/**
 * e2e/04-critical-path.spec.ts
 * Complete flow: Auth -> Create Container -> Add Item
 */
import { test, expect } from '@playwright/test';

test.describe('Critical Path', () => {

    test('Flow: Login -> Create Container -> Add Item', async ({ page }) => {
        // 1. Login (Mock or Bypass assumed)
        await page.goto('/login');
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
            await emailInput.fill('test@example.com');
            await page.getByRole('button', { name: /Enviar Acceso/i }).click();
            // In bypass mode, it should redirect or stay. Test depends on bypass.
        }

        // 2. Go to Containers and create new
        await page.goto('/containers/new');
        await expect(page.locator('h1')).toContainText(/Nueva Caja/i);

        const containerLabel = `Test Box ${Date.now()}`;
        await page.locator('input[name="label"], input:not([type])').first().fill(containerLabel);

        // Select location (if any)
        const locationSelect = page.locator('select');
        if (await locationSelect.isVisible()) {
            await locationSelect.selectOption({ index: 1 });
        }

        await page.getByRole('button', { name: /Crear Caja/i }).click();

        // 3. Verify Container was created and redirect to detail
        await expect(page).toHaveURL(/\/containers\/[a-f0-9-]+/);
        await expect(page.locator('h1')).toContainText(containerLabel);

        // 4. Add an Item to this container
        await page.getByRole('link', { name: /Agregar Item/i }).click();
        await expect(page).toHaveURL(/\/items\/new/);

        const itemName = `Test Item ${Date.now()}`;
        await page.locator('input[placeholder*="Nombre"]').fill(itemName);

        // Mock a file upload for the photo
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.locator('button:has-text("Paso 1")').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
            name: 'test-item.png',
            mimeType: 'image/png',
            buffer: Buffer.from('fake-image-data'),
        });

        // Wait for AI analysis (mocked or real)
        await expect(page.getByText(/¡IA completó los datos!/i)).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: /Guardar Item/i }).click();

        // 5. Final verification
        await expect(page).toHaveURL(/\/containers\/[a-f0-9-]+/);
        await expect(page.getByText(itemName)).toBeVisible();
    });
});
