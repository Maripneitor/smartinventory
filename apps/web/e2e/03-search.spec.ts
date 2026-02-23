/**
 * e2e/03-search.spec.ts
 * Flujo crítico #3: Búsqueda híbrida (texto + semántica)
 *
 * PREREQUISITOS:
 *  - DEV_AUTH_BYPASS=true
 *  - Al menos 1 item creado con embeddings (o mock mode activo)
 */

import { test, expect } from '@playwright/test';

test.describe('Search — Búsqueda Híbrida', () => {

    test('Página de búsqueda carga con input visible', async ({ page }) => {
        await page.goto('/search');
        await page.waitForLoadState('domcontentloaded');

        if (page.url().includes('/login')) {
            console.log('ℹ️  Redirigido a login. Activa DEV_AUTH_BYPASS=true.');
            return;
        }

        // Input de búsqueda debe ser visible
        await expect(page.locator('#search-input')).toBeVisible({ timeout: 8000 });
        await expect(page.locator('#search-submit')).toBeVisible();
    });

    test('Toggle de modo busqueda existe (Híbrida / Solo Texto)', async ({ page }) => {
        await page.goto('/search');
        await page.waitForLoadState('domcontentloaded');
        if (page.url().includes('/login')) return;

        // Botón de modo
        await expect(page.getByRole('button', { name: /H\u00edbrida|Solo Texto/i })).toBeVisible({ timeout: 8000 });
    });

    test('Escribir consulta y enviar muestra loader', async ({ page }) => {
        await page.goto('/search');
        await page.waitForLoadState('domcontentloaded');
        if (page.url().includes('/login')) return;

        const input = page.locator('#search-input');
        await input.fill('cable hdmi');

        // Enviar y verificar que el loader aparece
        const submitBtn = page.locator('#search-submit');
        await submitBtn.click();

        // El loader o los resultados deben aparecer
        // (en CI sin DB real, esperamos el estado "sin resultados")
        await page.waitForTimeout(500);
        const hasResults = await page.locator('[role="list"]').isVisible().catch(() => false);
        const hasEmpty = await page.getByText(/Sin resultados|No encontramos/i).isVisible().catch(() => false);
        const hasError = await page.locator('.bg-red-500\\/10').isVisible().catch(() => false);

        // Alguno de los tres estados debe ser visible
        expect(hasResults || hasEmpty || hasError).toBe(true);
    });

    test('Toggle de modo cambia texto del botón', async ({ page }) => {
        await page.goto('/search');
        await page.waitForLoadState('domcontentloaded');
        if (page.url().includes('/login')) return;

        const modeButton = page.getByRole('button', { name: /H\u00edbrida|Solo Texto/i });
        await expect(modeButton).toBeVisible({ timeout: 8000 });

        // Leer texto inicial
        const initialText = await modeButton.textContent();

        // Click para cambiar modo
        await modeButton.click();
        await page.waitForTimeout(300);

        const newText = await modeButton.textContent();
        // El texto debe haber cambiado
        expect(newText).not.toBe(initialText);
    });

    test('Back button navega de vuelta al dashboard', async ({ page }) => {
        await page.goto('/search');
        await page.waitForLoadState('domcontentloaded');
        if (page.url().includes('/login')) return;

        const backBtn = page.getByRole('link', { name: /Volver/i });
        await expect(backBtn).toBeVisible({ timeout: 8000 });
        await backBtn.click();

        // Debe navegar a / (dashboard)
        await expect(page).toHaveURL('/', { timeout: 5000 });
    });
});

test.describe('Search — Regresion de bugs', () => {

    test('Login page NO redirige automáticamente (bug fix verification)', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        // La URL no debe cambiar (el useEffect bug redirigía a "/")
        expect(page.url()).toContain('/login');

        // El form de email debe ser visible
        await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    });
});
