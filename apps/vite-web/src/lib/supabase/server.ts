import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const supabaseUrl = import.meta.env.SUPABASE_INTERNAL_URL ?? import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnon = import.meta.env.SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
        throw new Error("Missing Supabase env vars (URL/ANON KEY)");
    }

    return createServerClient(
        supabaseUrl,
        supabaseAnon,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // El middleware se encargará si falla en un Server Component
                    }
                },
            },
        }
    )
}
