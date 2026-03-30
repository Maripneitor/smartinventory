export interface Location {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string; // Para ubicaciones anidadas
  createdAt: Date;
  updatedAt: Date;
}

export interface Box {
  id: string;
  name: string;
  description?: string;
  locationId: string;
  qrCode?: string;
  color?: string;
  icon?: string;
  items: InventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Accesorio detectado por la IA junto al objeto principal.
 * Permite registrar si el cargador, cable o base viene incluido o no.
 */
export interface Accessory {
  /** Nombre del accesorio, ej: "Adaptador de corriente", "Base magnética" */
  name: string;
  /** true si se ve en la foto / está en la caja; false si debería traerlo pero no está */
  isIncluded: boolean;
  /** Especificaciones del accesorio, ej: "12V 2A, Marca Apple", "Cable USB-C 1m" */
  details?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  boxId: string;
  locationId: string;
  quantity: number;
  unit?: string;
  purchaseDate?: Date;
  warrantyEnd?: Date;
  price?: number;
  notes?: string;
  attributes: Record<string, any>;
  aiConfidence: number;
  needsReview: boolean;
  createdAt: Date;
  updatedAt: Date;
  // ── Campos nuevos ──────────────────────────────────────────────────────────
  /** Lista de accesorios detectados por la IA (cables, bases, manuales, etc.) */
  accessories?: Accessory[];
  /** Especificaciones técnicas visibles en la imagen, ej: "WiFi 6, 12V 2A" */
  technical_specs?: string;
  /** Estado aparente del objeto detectado por la IA */
  condition?: string;
}

export interface Suggestion {
  type: 'location' | 'box';
  id: string;
  name: string;
  confidence: number;
  reason: string;
}
