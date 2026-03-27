import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = import.meta.env.SUPABASE_INTERNAL_URL ?? import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnon = import.meta.env.SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
        throw new Error("Missing Supabase env vars (URL/ANON KEY)");
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnon,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refrescar el token si es necesario
    const { data: { user } } = await supabase.auth.getUser()

    // Proteger rutas privadas: /login y /callback son públicas
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/callback')

    const isStaticFile = request.nextUrl.pathname.includes('.') ||
        request.nextUrl.pathname.startsWith('/_next')

    // Auth guard — bypass SOLO si VITE_DEV_AUTH_BYPASS=true está explícito en env
    if (import.meta.env.VITE_DEV_AUTH_BYPASS !== 'true') {
        if (!user && !isAuthPage && !isStaticFile) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
