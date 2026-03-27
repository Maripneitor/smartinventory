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
}

export interface Suggestion {
  type: 'location' | 'box';
  id: string;
  name: string;
  confidence: number;
  reason: string;
}
