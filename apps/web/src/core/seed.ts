import { createClient } from '@/lib/supabase/browser';
import { db } from './db';

/**
 * Script de inicialización (Seed) para SmartInventory.
 * Poblado con la estructura física solicitada: Patio, Sala y Escritorio.
 */
export async function seedInitialData() {
    const supabase = createClient();
    
    // 1. Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // En desarrollo con bypass, usamos el ID simulado
        const devUserId = '4cef6da7-62a7-4855-80a6-27583e387a05';
        return await runSeed(devUserId);
    }
    
    return await runSeed(user.id);
}

async function runSeed(userId: string) {
    const supabase = createClient();

    console.log("Iniciando Seed de Datos Físicos...");

    // 2. Limpiar datos previos
    await supabase.from('items').delete().eq('user_id', userId);
    await supabase.from('containers').delete().eq('user_id', userId);
    await supabase.from('locations').delete().eq('user_id', userId);

    // 3. Crear Ubicaciones
    const { data: locs, error: locError } = await supabase.from('locations').insert([
        { name: 'Patio', user_id: userId },
        { name: 'Cuarto', user_id: userId },
        { name: 'Sala', user_id: userId },
        { name: 'Escritorio', user_id: userId }
    ]).select();

    if (locError) throw locError;

    const patio = locs.find(l => l.name === 'Patio')?.id;
    const cuarto = locs.find(l => l.name === 'Cuarto')?.id;
    const sala = locs.find(l => l.name === 'Sala')?.id;
    const escritorio = locs.find(l => l.name === 'Escritorio')?.id;

    // 4. Definir Contenedores por Ubicación
    const containers = [
        // Patio: 2 Cajas de Cartón
        { label: 'Caja Patio A', type: 'caja_carton', max_capacity: 20, location_id: patio },
        { label: 'Caja Patio B', type: 'caja_carton', max_capacity: 20, location_id: patio },
        
        // Cuarto: 1 Bolsa, 1 Caja Zapatos
        { label: 'Bolsa Ropa Cuarto', type: 'bolsa', max_capacity: 5, location_id: cuarto },
        { label: 'Caja Zapatos Cuarto', type: 'caja_zapatos', max_capacity: 8, location_id: cuarto },

        // Sala: 1 Cesto
        { label: 'Cesto Sala Principal', type: 'cesto', max_capacity: 15, location_id: sala },

        // Escritorio: 2 Cajas de Zapatos
        { label: 'Caja Zapatos Office A', type: 'caja_zapatos', max_capacity: 8, location_id: escritorio },
        { label: 'Caja Zapatos Office B', type: 'caja_zapatos', max_capacity: 8, location_id: escritorio },
    ];

    // 5. Insertar contenedores
    for (const cont of containers) {
        const { error } = await supabase.from('containers').insert({
            ...cont,
            id: crypto.randomUUID(),
            user_id: userId,
            qr_payload: `CONT-${cont.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        });
        
        if (error) console.error(`Error insertando ${cont.label}:`, error);
    }

    // 6. Limpiar DB local (Dexie) para forzar resincronización
    await db.containers.clear();
    await db.items.clear();
    await db.locations.clear();

    console.log("Seed físico completado con éxito.");
    return { success: true };
}
