import type { InventoryItem, Location, Box, Suggestion } from '@/core/types/inventory';

class SuggestionService {
  // Sugerir dónde guardar basado en el nombre del item
  async suggestPlacement(item: Partial<InventoryItem>): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const itemName = item.name?.toLowerCase() || '';
    const itemCategory = item.category?.toLowerCase() || '';
    
    // Reglas de ubicación basadas en categorías
    const categoryRules: Record<string, { location: string; box?: string; confidence: number }> = {
      'electrónica': { location: 'Oficina', box: 'Caja de Electrónicos', confidence: 0.9 },
      'herramientas': { location: 'Garaje', box: 'Caja de Herramientas', confidence: 0.95 },
      'ropa': { location: 'Dormitorio', box: 'Armario', confidence: 0.85 },
      'documentos': { location: 'Oficina', box: 'Archivo', confidence: 0.9 },
      'cocina': { location: 'Cocina', box: 'Utensilios de Cocina', confidence: 0.95 },
      'juguetes': { location: 'Sala de Juegos', box: 'Caja de Juguetes', confidence: 0.85 },
      'deportes': { location: 'Garaje', box: 'Equipo Deportivo', confidence: 0.8 },
    };
    
    // Aplicar reglas por categoría
    if (itemCategory && categoryRules[itemCategory]) {
      const rule = categoryRules[itemCategory];
      suggestions.push({
        type: 'location',
        id: rule.location,
        name: rule.location,
        confidence: rule.confidence,
        reason: `Basado en la categoría "${itemCategory}"`
      });
      
      if (rule.box) {
        suggestions.push({
          type: 'box',
          id: rule.box,
          name: rule.box,
          confidence: rule.confidence,
          reason: `Sugerido para ${itemCategory}`
        });
      }
    }
    
    // Reglas basadas en palabras clave del nombre
    const keywordRules = [
      { keywords: ['hdmi', 'cable', 'usb', 'adaptador'], location: 'Oficina', box: 'Cables y Accesorios', confidence: 0.85 },
      { keywords: ['cargador', 'power', 'batería'], location: 'Oficina', box: 'Cargadores', confidence: 0.9 },
      { keywords: ['martillo', 'destornillador', 'taladro'], location: 'Garaje', box: 'Caja de Herramientas', confidence: 0.95 },
      { keywords: ['libro', 'cuaderno', 'revista'], location: 'Oficina', box: 'Libros y Documentos', confidence: 0.9 },
      { keywords: ['camisa', 'pantalón', 'zapatos'], location: 'Dormitorio', box: 'Ropa', confidence: 0.85 },
    ];
    
    for (const rule of keywordRules) {
      const matches = rule.keywords.some(keyword => itemName.includes(keyword));
      if (matches) {
        suggestions.push({
          type: 'location',
          id: rule.location,
          name: rule.location,
          confidence: rule.confidence,
          reason: `Detectamos la palabra "${rule.keywords.find(k => itemName.includes(k))}" en el nombre`
        });
        
        suggestions.push({
          type: 'box',
          id: rule.box,
          name: rule.box,
          confidence: rule.confidence,
          reason: `Contenedor sugerido para este tipo de objeto`
        });
        break;
      }
    }
    
    // Sugerencia por defecto si no hay coincidencias
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'location',
        id: 'general',
        name: 'Ubicación General',
        confidence: 0.5,
        reason: 'No pudimos determinar una ubicación específica'
      });
    }
    
    // Ordenar por confianza
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  // Sugerir caja basada en items similares existentes
  async suggestBoxBySimilarItems(itemName: string): Promise<Suggestion[]> {
    return [];
  }
  
  // Analizar si un item debería estar en una caja específica
  analyzeBoxFit(item: InventoryItem, box: Box): { fits: boolean; reason: string; confidence: number } {
    const itemName = item.name.toLowerCase();
    const boxName = box.name.toLowerCase();
    
    // Verificar si el nombre del item tiene sentido con la caja
    if (boxName.includes('electrónico') && item.category === 'Electrónica') {
      return { fits: true, reason: 'Coincide con la categoría de la caja', confidence: 0.9 };
    }
    
    if (boxName.includes('cable') && itemName.includes('cable')) {
      return { fits: true, reason: 'Perfecto para almacenar cables', confidence: 0.95 };
    }
    
    if (boxName.includes('herramienta') && item.category === 'Herramientas') {
      return { fits: true, reason: 'Ubicación ideal para herramientas', confidence: 0.9 };
    }
    
    // Análisis de palabras clave
    const boxKeywords = boxName.split(' ');
    const matchCount = boxKeywords.filter(kw => itemName.includes(kw)).length;
    
    if (matchCount > 0) {
      const confidence = Math.min(0.7 + (matchCount * 0.1), 0.95);
      return { 
        fits: true, 
        reason: `Comparte ${matchCount} palabra(s) clave con "${box.name}"`, 
        confidence 
      };
    }
    
    return { fits: false, reason: 'No hay coincidencias claras', confidence: 0.3 };
  }
}

export const suggestionService = new SuggestionService();
