import { useState } from 'react';
import { Box, InventoryItem } from '@/core/types/inventory';
import { QrCode, Package, MapPin, Edit, Trash2, Plus, Search, ChevronLeft } from 'lucide-react';
import QRCode from 'qrcode.react';

interface BoxDetailProps {
  box: Box;
  location: { name: string };
  items: InventoryItem[];
  onBack: () => void;
  onEditBox: () => void;
  onDeleteBox: () => void;
  onAddItem: () => void;
  onViewItem: (item: InventoryItem) => void;
}

export function BoxDetail({
  box,
  location,
  items,
  onBack,
  onEditBox,
  onDeleteBox,
  onAddItem,
  onViewItem
}: BoxDetailProps) {
  const [showQR, setShowQR] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Estadísticas de la caja
  const totalItems = items.length;
  const categories = [...new Set(items.map(i => i.category))];
  const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0);
  
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-gray-900 border border-black/10">
      {/* Header con gradiente */}
      <div className={`bg-gradient-to-r ${box.color || 'from-blue-600 to-indigo-600'} px-6 py-4 text-white`}>
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5 " /> Volver
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={onEditBox}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onDeleteBox}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <h2 className="text-2xl font-bold">{box.name}</h2>
          {box.description && (
            <p className="text-blue-100 mt-1">{box.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-white/80" />
              {location.name}
            </span>
            <span className="flex items-center gap-1 bg-white/20 rounded-md px-2 py-0.5">
              <Package className="w-4 h-4 text-white" />
              {totalItems} items
            </span>
          </div>
        </div>
      </div>
      
      {/* Modal QR */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-xl text-center max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">QR de {box.name}</h3>
              <button onClick={() => setShowQR(false)} className="text-gray-500 hover:text-gray-900 cursor-pointer text-xl">✕</button>
            </div>
            <div className="flex justify-center border p-2 rounded bg-white">
               <QRCode value={JSON.stringify({ id: box.id, name: box.name, type: 'box' })} size={200} />
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Escanea este código para ver el contenido de la caja
            </p>
          </div>
        </div>
      )}
      
      {/* Contenido */}
      <div className="p-6">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-3 text-center border">
            <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Items</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center border">
            <p className="text-2xl font-bold text-indigo-600">{categories.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Gamas</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center border">
            <p className="text-2xl font-bold text-green-600">${totalValue.toFixed(0)}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Valor</p>
          </div>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en esta caja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium outline-none"
          />
        </div>
        
        {/* Botón agregar item */}
        <button
          onClick={onAddItem}
          className="w-full mb-6 flex items-center justify-center gap-2 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Agregar Item a esta Caja
        </button>
        
        {/* Lista de items */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="font-medium text-gray-700">No hay items en esta caja</p>
              <p className="text-sm mt-1">Agrega tu primer item usando el botón arriba</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => onViewItem(item)}
                className="flex items-center gap-4 p-4 border rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors hover:shadow-sm"
              >
                {item.imageUrl ? (
                  <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-200">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 text-gray-400">
                    <Package className="w-7 h-7" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider rounded-md">{item.category}</span>
                    {item.quantity > 1 && <span className="text-xs font-semibold text-gray-500">Cant: {item.quantity}</span>}
                    {item.price && <span className="text-xs font-semibold text-green-600">${item.price}</span>}
                  </div>
                </div>
                
                <ChevronLeft className="w-5 h-5 text-gray-300 transform rotate-180" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
