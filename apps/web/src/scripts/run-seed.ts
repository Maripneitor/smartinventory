import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const devUserId = '4cef6da7-62a7-4855-80a6-27583e387a05';

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL y llaves de acceso son requeridas en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
    console.log("🚀 Iniciando Seed de Datos Físicos (Node Mode)...");

    // 0. Asegurar que el usuario dev existe (Admin API)
    console.log("👤 Verificando usuario dev...");
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(devUserId);
    
    if (userError || !userData.user) {
        console.log("➕ Creando usuario dev en auth.users...");
        const { error: createError } = await supabase.auth.admin.createUser({
            id: devUserId,
            email: 'mariomoguel05@gmail.com',
            email_confirm: true,
            user_metadata: { name: 'Mario Dev' }
        });
        if (createError) {
            console.warn("⚠️ No se pudo crear/verificar el usuario dev. El seed podría fallar por FK.", createError.message);
        }
    } else {
        console.log("✅ Usuario dev verificado");
    }

    // 1. Limpiar datos previos
    const { error: delItemsError } = await supabase.from('items').delete().eq('user_id', devUserId);
    const { error: delContsError } = await supabase.from('containers').delete().eq('user_id', devUserId);
    const { error: delLocsError } = await supabase.from('locations').delete().eq('user_id', devUserId);

    if (delItemsError || delContsError || delLocsError) {
        console.warn("Aviso: Hubo errores limpiando datos (es normal si las tablas están vacías o hay restricciones)");
    }

    // 2. Crear Ubicaciones
    const { data: locs, error: locError } = await supabase.from('locations').insert([
        { name: 'Patio', user_id: devUserId },
        { name: 'Cuarto', user_id: devUserId },
        { name: 'Sala', user_id: devUserId },
        { name: 'Escritorio', user_id: devUserId }
    ]).select();

    if (locError) {
        console.error("Error creando ubicaciones:", locError);
        process.exit(1);
    }

    const patio = locs.find(l => l.name === 'Patio')?.id;
    const cuarto = locs.find(l => l.name === 'Cuarto')?.id;
    const sala = locs.find(l => l.name === 'Sala')?.id;
    const escritorio = locs.find(l => l.name === 'Escritorio')?.id;

    console.log("✅ Ubicaciones creadas");

    // 3. Definir Contenedores por Ubicación
    const containers = [
        { label: 'Caja Patio A', type: 'caja_carton', max_capacity: 20, location_id: patio },
        { label: 'Caja Patio B', type: 'caja_carton', max_capacity: 20, location_id: patio },
        { label: 'Bolsa Ropa Cuarto', type: 'bolsa', max_capacity: 5, location_id: cuarto },
        { label: 'Caja Zapatos Cuarto', type: 'caja_zapatos', max_capacity: 8, location_id: cuarto },
        { label: 'Cesto Sala Principal', type: 'cesto', max_capacity: 15, location_id: sala },
        { label: 'Caja Zapatos Office A', type: 'caja_zapatos', max_capacity: 8, location_id: escritorio },
        { label: 'Caja Zapatos Office B', type: 'caja_zapatos', max_capacity: 8, location_id: escritorio },
    ];

    // 4. Insertar contenedores
    for (const cont of containers) {
        const { error } = await supabase.from('containers').insert({
            ...cont,
            id: crypto.randomUUID(),
            user_id: devUserId,
            qr_payload: `CONT-${cont.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        });
        
        if (error) {
            console.error(`❌ Error insertando ${cont.label}:`, error);
        } else {
            console.log(`📦 Contenedor creado: ${cont.label}`);
        }
    }

    console.log("\n✨ Seed físico completado con éxito.");
    console.log("Nota: Reinicia la aplicación o refresca la página para ver los cambios.");
}

runSeed().catch(err => {
    console.error("Fatal Error en Seed:", err);
    process.exit(1);
});
