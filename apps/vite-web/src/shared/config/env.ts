/**
 * env.ts — Validación de variables de entorno al arrancar.
 * Importar este módulo en layout.tsx para que falle rápido si falta algo.
 *
 * Si falta una variable crítica, Next lanza un error claro en consola
 * en lugar de el críptico "Your project's URL and Key are required..."
 */

function requireEnv(name: string): string {
    const val = import.meta.env[name];
    if (!val) {
        throw new Error(
            `[SmartInventory] Falta variable de entorno requerida: ${name}\n` +
            `  → Cópiala de .env.example y agrégala a tu .env.local`
        );
    }
    return val;
}

export function validateEnv() {
    requireEnv('VITE_SUPABASE_URL');
    requireEnv('VITE_SUPABASE_ANON_KEY');
    requireEnv('VITE_BASE_URL');
}

// Exportar valores ya validados para uso en el frontend
export const env = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL!,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
    baseUrl: import.meta.env.VITE_BASE_URL!,
    aiMode: (import.meta.env.AI_MODE ?? 'real') as 'real' | 'mock',
    devAuthBypass: import.meta.env.DEV_AUTH_BYPASS === 'true',
};
