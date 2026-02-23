import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const isBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = isBypass
        ? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createBrowserClient(supabaseUrl, supabaseKey);
}

/**
 * Dev Helper: Retorna un objeto de usuario simulado si el bypass está activo,
 * de lo contrario retorna el usuario real de Supabase.
 */
export async function getDevUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
        return {
            id: '4cef6da7-62a7-4855-80a6-27583e387a05', // mariomoguel05@gmail.com
            email: 'mariomoguel05@gmail.com',
            user_metadata: {},
            app_metadata: {},
        };
    }

    return user;
}

export default createClient;
