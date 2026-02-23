/**
 * env.ts — Validación de variables de entorno al arrancar.
 * Importar este módulo en layout.tsx para que falle rápido si falta algo.
 *
 * Si falta una variable crítica, Next lanza un error claro en consola
 * en lugar de el críptico "Your project's URL and Key are required..."
 */

function requireEnv(name: string): string {
    const val = process.env[name];
    if (!val) {
        throw new Error(
            `[SmartInventory] Falta variable de entorno requerida: ${name}\n` +
            `  → Cópiala de .env.example y agrégala a tu .env.local`
        );
    }
    return val;
}

export function validateEnv() {
    requireEnv('NEXT_PUBLIC_SUPABASE_URL');
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    requireEnv('NEXT_PUBLIC_BASE_URL');
}

// Exportar valores ya validados para uso en el frontend
export const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
    aiMode: (process.env.AI_MODE ?? 'real') as 'real' | 'mock',
    devAuthBypass: process.env.DEV_AUTH_BYPASS === 'true',
};
