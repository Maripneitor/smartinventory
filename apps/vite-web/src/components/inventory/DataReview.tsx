import { useState, useEffect } from 'react';
import { 
  CheckCircle, AlertCircle, RefreshCw, 
  MapPin, Package, Calendar, DollarSign,
  QrCode, ChevronRight,
  Home, Briefcase, Wrench, Shirt, BookOpen,
  CheckCircle2, XCircle, PlusCircle, Cpu, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { suggestionService } from '@/core/services/suggestionService';
import type { Box, Location, InventoryItem, Suggestion, Accessory } from '@/core/types/inventory';
import { QRCodeCanvas } from 'qrcode.react';

interface DataReviewProps {
  itemData: Partial<InventoryItem>;
  imageUrl: string | null;
  onConfirm: (item: InventoryItem) => void;
  onRetry: () => void;
  onCancel: () => void;
  locations: Location[];
  boxes: Box[];
}

export function DataReview({ 
  itemData, 
  imageUrl, 
  onConfirm, 
  onRetry, 
  onCancel,
  locations,
  boxes 
}: DataReviewProps) {
  const [editedItem, setEditedItem] = useState(itemData);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedBox, setSelectedBox] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showBoxPicker, setShowBoxPicker] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Obtener sugerencias al cargar
  useEffect(() => {
    const getSuggestions = async () => {
      const suggested = await suggestionService.suggestPlacement(editedItem);
      setSuggestions(suggested);
      
      // Auto-seleccionar la mejor sugerencia (buscando coincidencia con los ids de DB)
      // Como el SuggestionService mockea nombres de localizaciones, podemos cruzar con la DB.
      const bestLocation = suggested.find((s: Suggestion) => s.type === 'location');
      const bestBox = suggested.find((s: Suggestion) => s.type === 'box');
      
      const realLocationMatch = locations.find((l: Location) => l.name.toLowerCase() === bestLocation?.name?.toLowerCase());
      const realBoxMatch = boxes.find((b: Box) => b.name.toLowerCase() === bestBox?.name?.toLowerCase());

      if (realLocationMatch) setSelectedLocation(realLocationMatch.id);
      if (realBoxMatch) setSelectedBox(realBoxMatch.id);
    };
    
    getSuggestions();
  }, [editedItem, locations, boxes]);
  
  // Actualizar campos del item
  const updateField = (field: keyof InventoryItem, value: any) => {
    setEditedItem({ ...editedItem, [field]: value });
  };

  // ── Handlers de accesorios ────────────────────────────────────────────────
  const toggleAccessoryIncluded = (index: number) => {
    const updated = [...(editedItem.accessories || [])];
    updated[index] = { ...updated[index], isIncluded: !updated[index].isIncluded };
    updateField('accessories', updated);
  };

  const updateAccessory = (index: number, field: keyof Accessory, value: string | boolean) => {
    const updated = [...(editedItem.accessories || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField('accessories', updated);
  };

  const addEmptyAccessory = () => {
    const updated = [...(editedItem.accessories || []), { name: '', isIncluded: true, details: '' }];
    updateField('accessories', updated);
  };

  const removeAccessory = (index: number) => {
    const updated = (editedItem.accessories || []).filter((_: Accessory, i: number) => i !== index);
    updateField('accessories', updated);
  };
  
  // Validar antes de guardar
  const validateAndSave = () => {
    if (!editedItem.name?.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    if (!selectedLocation) {
      toast.error('Debes seleccionar una ubicación');
      return;
    }
    
    if (!selectedBox) {
      toast.error('Debes seleccionar una caja');
      return;
    }
    
    const finalItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: editedItem.name!,
      category: editedItem.category || 'Otros',
      description: editedItem.description || '',
      tags: editedItem.tags || [],
      imageUrl: imageUrl || undefined,
      boxId: selectedBox,
      locationId: selectedLocation,
      quantity: editedItem.quantity || 1,
      unit: editedItem.unit,
      purchaseDate: editedItem.purchaseDate,
      warrantyEnd: editedItem.warrantyEnd,
      price: editedItem.price,
      notes: editedItem.notes,
      attributes: editedItem.attributes || {},
      aiConfidence: editedItem.aiConfidence || 0.5,
      needsReview: typeof editedItem.aiConfidence === 'number' ? editedItem.aiConfidence < 0.7 : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setIsSaving(true);
    onConfirm(finalItem);
  };
  
  // Íconos para categorías
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Electrónica': <Briefcase className="w-5 h-5 text-gray-500" />,
      'Herramientas': <Wrench className="w-5 h-5 text-gray-500" />,
      'Ropa': <Shirt className="w-5 h-5 text-gray-500" />,
      'Documentos': <BookOpen className="w-5 h-5 text-gray-500" />,
      'Cocina': <Home className="w-5 h-5 text-gray-500" />
    };
    return icons[category] || <Package className="w-5 h-5 text-gray-500" />;
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header con progreso */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-bold">Revisar Datos</h2>
            <p className="text-sm text-blue-100 mt-1">
              Confianza del análisis: {Math.round((editedItem.aiConfidence || 0) * 100)}%
            </p>
          </div>
          {typeof editedItem.aiConfidence === 'number' && editedItem.aiConfidence < 0.7 && (
            <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Requiere revisión</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda - Imagen y Datos Básicos */}
          <div className="space-y-6 text-gray-900">
            {/* Imagen */}
            {imageUrl && (
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img src={imageUrl} alt="Item" className="w-full h-full object-contain" />
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg shadow-md hover:bg-white transition-colors cursor-pointer"
                >
                  <QrCode className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
            
            {/* QR Code Modal */}
            {showQR && editedItem.name && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white p-6 rounded-xl text-center">
                  <QRCodeCanvas value={JSON.stringify({ id: 'temp', name: editedItem.name })} size={200} />
                  <p className="mt-4 text-sm text-gray-600">QR para {editedItem.name}</p>
                  <button
                    onClick={() => setShowQR(false)}
                    className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
            
            {/* Datos básicos editables */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Item *
                </label>
                <input
                  type="text"
                  value={editedItem.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Ej: Cable HDMI Trenzado"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editedItem.category || 'Otros'}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option>Electrónica</option>
                    <option>Herramientas</option>
                    <option>Ropa</option>
                    <option>Documentos</option>
                    <option>Cocina</option>
                    <option>Deportes</option>
                    <option>Juguetes</option>
                    <option>Otros</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editedItem.quantity || 1}
                    onChange={(e) => updateField('quantity', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción Inteligente
                </label>
                <textarea
                  value={editedItem.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Descripción del objeto..."
                />
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2">
                  {(editedItem.tags || []).map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      const newTag = prompt('Agregar etiqueta:');
                      if (newTag) {
                        updateField('tags', [...(editedItem.tags || []), newTag]);
                      }
                    }}
                    className="px-2 py-1 border border-dashed border-gray-300 rounded-full text-sm text-gray-500 hover:border-blue-500 cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* ── Especificaciones Técnicas ── */}
              {(editedItem.technical_specs !== undefined || editedItem.category === 'Electrónica' || editedItem.category === 'Herramientas') && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Cpu className="w-4 h-4 text-indigo-500" />
                    Especificaciones Técnicas
                  </label>
                  <input
                    type="text"
                    value={editedItem.technical_specs || ''}
                    onChange={(e) => updateField('technical_specs', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                    placeholder="Ej. WiFi 6 Dual Band, 12V 2A, USB-C..."
                  />
                </div>
              )}

              {/* ── Estado del objeto ── */}
              {editedItem.condition !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del objeto
                  </label>
                  <select
                    value={editedItem.condition || ''}
                    onChange={(e) => updateField('condition', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="Buen estado">✅ Buen estado</option>
                    <option value="Desgastado">⚠️ Desgastado</option>
                    <option value="Requiere revisión">🔧 Requiere revisión</option>
                    <option value="Desconocido">❓ Desconocido</option>
                  </select>
                </div>
              )}

              {/* ── Accesorios y Componentes ── */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Accesorios y Componentes
                </label>

                <div className="space-y-2">
                  {(editedItem.accessories || []).length > 0 ? (
                    (editedItem.accessories || []).map((acc: Accessory, index: number) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 border rounded-xl transition-colors ${
                          acc.isIncluded
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        {/* Toggle incluido / no incluido */}
                        <button
                          type="button"
                          onClick={() => toggleAccessoryIncluded(index)}
                          className="mt-0.5 shrink-0 cursor-pointer"
                          title={acc.isIncluded ? 'Marcar como no incluido' : 'Marcar como incluido'}
                        >
                          {acc.isIncluded
                            ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                            : <XCircle className="w-5 h-5 text-red-400" />
                          }
                        </button>

                        <div className="flex-1 min-w-0">
                          <input
                            className="font-medium text-sm w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-gray-800"
                            value={acc.name}
                            placeholder="Nombre del accesorio..."
                            onChange={(e) => updateAccessory(index, 'name', e.target.value)}
                          />
                          <input
                            className="text-xs text-gray-500 mt-1 w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                            value={acc.details || ''}
                            placeholder="Detalles (ej. 12V 2A, 1 metro)..."
                            onChange={(e) => updateAccessory(index, 'details', e.target.value)}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAccessory(index)}
                          className="shrink-0 text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                          title="Eliminar accesorio"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic py-2">
                      La IA no detectó accesorios. Puedes agregarlos manualmente.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={addEmptyAccessory}
                    className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors cursor-pointer mt-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Agregar Accesorio
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Columna Derecha - Ubicación y Caja */}
          <div className="space-y-6 text-gray-900">
            {/* Sugerencias Inteligentes */}
            {suggestions.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Sugerencias Inteligentes
                </h3>
                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <span className="font-medium text-blue-900">{suggestion.name} ({suggestion.type})</span>
                        <p className="text-xs text-blue-700">{suggestion.reason} (Conf: {Math.round(suggestion.confidence * 100)}%)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Selección de Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Dónde quieres guardarlo? *
              </label>
              
              <button
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:border-blue-500 transition-colors bg-white cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span>
                    {locations.find(l => l.id === selectedLocation)?.name || 'Seleccionar ubicación'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              
              {showLocationPicker && (
                <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto bg-white">
                  {locations.map(location => (
                    <button
                      key={location.id}
                      onClick={() => {
                        setSelectedLocation(location.id);
                        setShowLocationPicker(false);
                      }}
                      className={`w-full flex items-center gap-2 p-3 hover:bg-gray-50 text-left cursor-pointer ${
                        selectedLocation === location.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      {getCategoryIcon(location.name)}
                      <div>
                        <p className="font-medium">{location.name}</p>
                        {location.description && (
                          <p className="text-xs text-gray-500">{location.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                  {locations.length === 0 && <div className="p-3 text-sm text-gray-500 text-center">No hay ubicaciones registradas</div>}
                </div>
              )}
            </div>
            
            {/* Selección de Caja */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caja o Contenedor *
              </label>
              
              <button
                onClick={() => setShowBoxPicker(!showBoxPicker)}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:border-blue-500 transition-colors bg-white cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <span>
                    {boxes.find(b => b.id === selectedBox)?.name || 'Seleccionar caja'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              
              {showBoxPicker && (
                <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto bg-white">
                  {boxes
                    .filter(box => box.locationId === selectedLocation || !selectedLocation)
                    .map(box => (
                      <button
                        key={box.id}
                        onClick={() => {
                          setSelectedBox(box.id);
                          setShowBoxPicker(false);
                        }}
                        className={`w-full flex items-center gap-2 p-3 hover:bg-gray-50 text-left cursor-pointer ${
                          selectedBox === box.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <Package className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{box.name}</p>
                          {box.description && (
                            <p className="text-xs text-gray-500">{box.description}</p>
                          )}
                          {box.qrCode && (
                            <p className="text-xs text-blue-500">✓ Tiene QR asignado</p>
                          )}
                        </div>
                      </button>
                    ))}
                    {boxes.filter(box => box.locationId === selectedLocation || !selectedLocation).length === 0 && <div className="p-3 text-sm text-gray-500 text-center">No hay cajas compatibles aquí</div>}
                </div>
              )}
            </div>
            
            {/* Datos opcionales */}
            <details className="border rounded-lg p-3 bg-white">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 outline-none">
                Datos adicionales (opcional)
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Precio de compra</label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={editedItem.price || ''}
                      onChange={(e) => updateField('price', parseFloat(e.target.value))}
                      className="flex-1 px-3 py-1 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fecha de compra</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={editedItem.purchaseDate ? new Date(editedItem.purchaseDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => updateField('purchaseDate', new Date(e.target.value))}
                      className="flex-1 px-3 py-1 border rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Notas</label>
                  <textarea
                    value={editedItem.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1 border rounded-lg"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            </details>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex gap-3 mt-8 pt-6 border-t flex-wrap">
          <button
            onClick={onRetry}
            className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar Análisis
          </button>
          
          <button
            onClick={onCancel}
            className="flex-1 min-w-[150px] px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            onClick={validateAndSave}
            disabled={isSaving}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer text-lg font-bold"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirmar y Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
