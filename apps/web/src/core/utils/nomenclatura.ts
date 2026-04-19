/**
 * core/utils/nomenclatura.ts
 * Utilidades para generación de IDs normativos.
 */

/**
 * Genera un número de serie basado en la normativa: [CAT]-[AÑO]-[ID_CORRELATIVO]-[HASH?]
 * @param category Categoría del objeto (ej. "ELEC", "HERR")
 * @param correlative Número correlativo (ej. 1, 2, 45)
 * @param useHash Si se debe incluir un hash de seguridad (prevención de colisiones offline)
 * @returns ID formateado (ej. "ELEC-26-0001" o "ELEC-26-0001-A2B4")
 */
export function generateSerialNumber(category: string, correlative: number, useHash: boolean = true): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const catCode = category.slice(0, 4).toUpperCase().padEnd(4, 'X');
    const idCode = correlative.toString().padStart(4, '0');
    
    let serial = `${catCode}-${year}-${idCode}`;
    
    if (useHash) {
        // Añadimos un hash corto de 4 caracteres para evitar colisiones entre usuarios offline
        const hash = Math.random().toString(36).substring(2, 6).toUpperCase();
        serial += `-${hash}`;
    }
    
    return serial;
}

/**
 * Helper para extraer el código de categoría de un string
 */
export function getCategoryCode(categoryName: string | null | undefined): string {
    if (!categoryName) return "GENR";
    
    // Limpiar y tomar las primeras 4 letras significativas
    return categoryName
        .trim()
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 4)
        .toUpperCase() || "GENR";
}
