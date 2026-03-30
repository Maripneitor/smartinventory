import { useState, useEffect } from 'react';
import { RobustScanner } from '@/components/inventory/RobustScanner';
import { DataReview } from '@/components/inventory/DataReview';
import { BoxDetail } from '@/components/inventory/BoxDetail';
import type { InventoryItem, Location, Box } from '@/core/types/inventory';
import { Camera, MapPin, Package, Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { containersService } from '@/core/containers';
import { itemsService } from '@/core/items';

export function InventoryPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<{ item: Partial<InventoryItem>; image: string | null } | null>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  
  const [locations, setLocations] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLocationId, setNewLocationId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  async function load() {
    try {
      setLoading(true);
      const [containersData, itemsData] = await Promise.all([
        containersService.getAll(),
        itemsService.getAll()
      ]);
      setBoxes(containersData || []);
      setItems(itemsData || []);

      const { locationsService } = await import('@/core/locations');
      const locData = await locationsService.getAll();
      setLocations(locData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreateBox(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim() || !newLocationId) return;
    try {
      await containersService.create({
        id: crypto.randomUUID(),
        label: newLabel,
        location_id: newLocationId,
        qr_payload: 'SMART_' + Date.now().toString(36).toUpperCase()
      });
      setNewLabel('');
      setNewLocationId('');
      setShowForm(false);
      load();
    } catch(e) { console.error(e); }
  }

  // Manejar escaneo completado (asume que RobustScanner devuelve datos que seteamos en nuestro tipo parcial)
  const handleScanComplete = (item: Partial<InventoryItem>, image: string) => {
    setScannedData({ item, image });
    setShowScanner(false);
  };
  
  // Confirmar guardado del item
  const handleConfirmItem = async (item: InventoryItem) => {
    try {
      const { itemsService } = await import('@/core/items');
      await itemsService.create({
         name: item.name,
         description: item.description,
         container_id: item.boxId,
         category: item.category,
         quantity: item.quantity || 1,
         item_type: 'device',
         condition: 'used',
      });
      setScannedData(null);
      load(); // Reload items
    } catch (error) {
      console.error("Error guardando item", error);
    }
  };
  
  // Obtener items de una caja específica
  const getBoxItems = (boxId: string) => {
    // Mapeamos los items de DB al tipo estricto esperado por la vista BoxDetail
    return items.filter(item => item.box_id === boxId).map(i => ({
         id: i.id,
         name: i.name,
         category: i.category || 'Otros',
         description: i.description || '',
         tags: [],
         boxId: i.box_id,
         locationId: '',
         quantity: 1,
         attributes: {},
         aiConfidence: 1,
         needsReview: false,
         createdAt: new Date(),
         updatedAt: new Date()
    }));
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col gap-8 pb-40 max-w-4xl mx-auto">
      {/* Header con acciones rápidas */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Mi Inventario</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Gestión de Cajas y Objetos</p>
        </div>
        {!selectedBox && !scannedData && (
          <div className="flex gap-2">
             <Button
               onClick={() => setShowForm(!showForm)}
               variant="secondary"
               className="h-12 w-12 p-0 rounded-2xl cursor-pointer"
             >
               <Plus className={showForm ? "rotate-45 transition-transform" : "transition-transform"} />
             </Button>
             <Button
               onClick={() => setShowScanner(true)}
               className="h-12 px-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
             >
               <Camera className="w-5 h-5" />
               Escanear Objeto
             </Button>
          </div>
        )}
      </div>
      
      {/* Create Box Form */}
      {showForm && !selectedBox && !scannedData && (
        <Card variant="secondary" className="border-blue-500/10 mb-2">
          <form onSubmit={handleCreateBox} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Nombre de la Caja</label>
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Ej. Cables, Herramientas..."
                  className="w-full h-14 bg-zinc-950/50 rounded-2xl border border-white/5 px-4 text-white font-bold focus:border-blue-500 focus:outline-none transition-all placeholder:text-zinc-600"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Ubicación</label>
                <select
                  value={newLocationId}
                  onChange={e => setNewLocationId(e.target.value)}
                  className="w-full rounded-2xl bg-zinc-950/50 border border-white/5 px-4 h-14 text-white font-bold focus:border-blue-500 focus:outline-none transition-all appearance-none"
                >
                  <option value="" disabled>Seleccione una ubicación</option>
                  {locations.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={!newLabel.trim() || !newLocationId} className="h-14 rounded-2xl cursor-pointer w-full md:w-auto md:px-12 md:self-end">
              Guardar Contenedor
            </Button>
          </form>
        </Card>
      )}

      {/* Barra de Búsqueda Global */}
      {!selectedBox && !scannedData && !showScanner && (
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar caja o contenedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 h-14 bg-zinc-950/50 rounded-2xl border border-white/5 text-white font-bold focus:border-blue-500 focus:outline-none transition-all placeholder:text-zinc-600"
          />
        </div>
      )}

      {/* Vista principal - Grid de cajas (agrupadas por location si search está vacío) */}
      {!selectedBox && !scannedData && !showScanner && (
        <div className="flex flex-col gap-10">
          {locations.map(location => {
             const locationBoxes = boxes.filter(box => box.location_id === location.id && box.label.toLowerCase().includes(searchQuery.toLowerCase()));
             if (locationBoxes.length === 0 && searchQuery) return null;
             
             return (
              <div key={location.id} className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  {location.name}
                </h2>
                {locationBoxes.length === 0 ? (
                  <p className="text-zinc-700 text-sm italic">Sin cajas</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locationBoxes.map(box => (
                      <Card
                        interactive
                        key={box.id}
                        onClick={() => setSelectedBox({ id: box.id, name: box.label, locationId: box.location_id, items: [] } as any)}
                        className="p-5 rounded-3xl cursor-pointer hover:border-blue-500/30 flex flex-col gap-4 border border-white/5"
                      >
                        <div className="flex items-center justify-between">
                           <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-zinc-900 border border-white/5 shadow-inner text-zinc-500 group-hover:text-blue-500 transition-colors">
                              <Package className="w-6 h-6" />
                           </div>
                           <span className="text-xs font-bold text-zinc-600 bg-zinc-950 px-2 py-1 rounded-md border border-white/5">
                             {getBoxItems(box.id).length} ítems
                           </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg truncate leading-tight">{box.label}</h3>
                          {box.description && (
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{box.description}</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {/* Vista de detalle de caja */}
      {selectedBox && !scannedData && !showScanner && (
        <BoxDetail
          box={{ ...selectedBox, locationId: selectedBox.locationId } as any}
          location={locations.find(l => l.id === selectedBox.locationId) || { name: 'Desconocido' }}
          items={getBoxItems(selectedBox.id)}
          onBack={() => setSelectedBox(null)}
          onEditBox={() => {/* Editar caja */}}
          onDeleteBox={async () => {
             if (confirm("¿Estás seguro de eliminar esta caja y su contenido?")) {
                await containersService.delete(selectedBox.id);
                setSelectedBox(null);
                load();
             }
          }}
          onAddItem={() => setShowScanner(true)}
          onViewItem={(item) => {/* Ver detalle */}}
        />
      )}
      
      {/* Scanner Modal overlayed if needed, or inline */}
      {showScanner && (
        <div className="bg-zinc-950 border border-white/5 p-4 rounded-3xl shadow-2xl relative">
          <RobustScanner
            onAnalysisComplete={(item, image) => handleScanComplete(item, image!)}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}
      
      {/* Review Modal */}
      {scannedData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden">
          <DataReview
            itemData={scannedData.item}
            imageUrl={scannedData.image}
            onConfirm={handleConfirmItem}
            onRetry={() => {
              setScannedData(null);
              setShowScanner(true);
            }}
            onCancel={() => setScannedData(null)}
            locations={locations.map(l => ({ id: l.id, name: l.name } as Location))}
            boxes={boxes.map(b => ({ id: b.id, name: b.label, locationId: b.location_id } as Box))}
          />
        </div>
      )}
    </div>
  );
}
