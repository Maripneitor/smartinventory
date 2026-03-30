// Nunca más usaremos "any". Estos son nuestros modelos de verdad.
export interface Location {
  id: string;
  name: string;
  description?: string;
}

export interface Box {
  id: string;
  location_id: string;
  name: string;
  qr_code?: string;
}

export interface InventoryItem {
  id: string;
  container_id: string; // Relación con la caja
  name: string;
  category: string;
  confidence: number;
  description: string;
  tags: string[];
  created_at: string;
}

// Lo que nos devuelve la IA antes de guardarlo en la Base de Datos
export type DraftItem = Omit<InventoryItem, 'id' | 'created_at' | 'container_id'>;
