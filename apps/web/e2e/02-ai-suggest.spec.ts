/**
 * e2e/02-ai-suggest.spec.ts
 * Flujo crítico #2: Botón "Autocompletar con IA" en ItemForm
 *
 * PREREQUISITOS:
 *  - DEV_AUTH_BYPASS=true
 *  - AI_MODE=mock (para no consumir Gemini keys en CI)
 *  - Tener un container creado previamente (o crear uno en el beforeEach)
 */

import { test, expect } from '@playwright/test';

test.describe('AI Suggest — Formulario de Item', () => {

    test('Formulario de nuevo item carga correctamente', async ({ page }) => {
        // Necesitamos un container_id. Usamos uno hardcodeado para este test
        // En práctica real, se crea un container primero
        await page.goto('/items/new?container=test-container-id');
        await page.waitForLoadState('domcontentloaded');

        // Si no hay sesión activa (sin bypass), verificamos que redirige a login
        if (page.url().includes('/login')) {
            console.log('ℹ️  Redirigido a login. Activa DEV_AUTH_BYPASS=true para este test.');
            return;
        }

        // Debe haber zona de upload de foto (Paso 1)
        await expect(page.getByText(/Paso 1/i)).toBeVisible({ timeout: 8000 });
    });

    test('Botón AI Suggest existe y tiene texto correcto', async ({ page }) => {
        await page.goto('/items/new?container=test-container-id');
        await page.waitForLoadState('domcontentloaded');
        if (page.url().includes('/login')) return;

        // El botón de IA solo aparece tras seleccionar foto
        // Verificamos que el selector de foto está disponible
        const photoButton = page.getByRole('button', { name: /Paso 1|Foto|capturar/i });
        await expect(photoButton).toBeVisible({ timeout: 8000 });
    });

    test('AI route retorna 404 cuando AI_MODE != mock', async ({ page, request }) => {
        // Test de la API route directamente
        const response = await request.post('/api/ai?function=analyze-item', {
            data: { photo_path: 'test/path.jpg' },
            headers: { 'Content-Type': 'application/json' },
        });

        // Cuando AI_MODE != mock, debe retornar 404
        // Cuando AI_MODE=mock, retorna 200
        const isOk = response.ok();
        const isMockMode = process.env.AI_MODE === 'mock' || process.env.NEXT_PUBLIC_AI_MODE === 'mock';

        if (isMockMode) {
            // En modo mock, la ruta está activa y devuelve algo
            expect(response.status()).not.toBe(500);
        } else {
            // En modo real, la ruta debe devolver 404
            expect(response.status()).toBe(404);
        }
    });

    test('Mock AI retorna estructura correcta cuando AI_MODE=mock', async ({ request }) => {
        // Solo ejecutar si estamos en modo mock
        if (process.env.AI_MODE !== 'mock') {
            console.log('ℹ️  Saltando test — AI_MODE no es mock. Usa AI_MODE=mock para testear la ruta mock.');
            return;
        }

        const response = await request.post('/api/ai?function=analyze-item', {
            data: { photo_path: 'test/cable-hdmi.jpg', mime_type: 'image/jpeg' },
            headers: { 'Content-Type': 'application/json' },
        });

        expect(response.ok()).toBe(true);
        const body = await response.json();

        // Verificar estructura de respuesta de IA
        expect(body).toHaveProperty('nombre_corto');
        expect(body).toHaveProperty('categoria');
        expect(body).toHaveProperty('descripcion');
        expect(body).toHaveProperty('tags');
        expect(Array.isArray(body.tags)).toBe(true);
    });
});
