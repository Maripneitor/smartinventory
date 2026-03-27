import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const isBypass = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
    const supabaseKey = isBypass
        ? import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
        : import.meta.env.VITE_SUPABASE_ANON_KEY!;

    return createBrowserClient(supabaseUrl, supabaseKey);
}

/**
 * Dev Helper: Retorna un objeto de usuario simulado si el bypass está activo,
 * de lo contrario retorna el usuario real de Supabase.
 */
export async function getDevUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') {
        return {
            id: 'dc04c303-003b-431d-902e-4a4c89b7640f', // mariomoguel05@gmail.com (real DB id)
            email: 'mariomoguel05@gmail.com',
            user_metadata: {},
            app_metadata: {},
        };
    }

    return user;
}

export default createClient;
