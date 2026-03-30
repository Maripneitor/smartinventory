import React, { useState } from 'react';
import { Box, DraftItem, InventoryItem } from '@/core/types/domain';
import { useInventoryFlow } from '@/controllers/useInventoryFlow';
import { useSearchController } from '@/controllers/useSearchController';

// Componentes internos para mantener la elegancia de la vista principal
const SearchResults = ({ items }: { items: InventoryItem[] }) => (
  <div className="flex flex-col gap-3 mt-4">
    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Resultados</h3>
    {items.map(item => (
      <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition cursor-pointer">
        <p className="font-semibold text-gray-800">{item.name}</p>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{item.category}</span>
          <span className="text-xs text-gray-400">ID: {item.id.slice(0, 8)}</span>
        </div>
      </div>
    ))}
    {items.length === 0 && <p className="text-center py-4 text-gray-400 text-sm">No se encontraron objetos.</p>}
  </div>
);

const BoxSelector = ({ boxes, selectedId, onSelect }: { boxes: Box[], selectedId: string | null, onSelect: (id: string) => void }) => (
  <div className="flex flex-col gap-2 mt-4">
    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Seleccionar Caja</h3>
    {boxes.map(box => (
      <button 
        key={box.id} 
        onClick={() => onSelect(box.id)}
        className={`w-full p-4 text-left rounded-2xl border-2 transition-all group ${
          selectedId === box.id 
            ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
            : 'border-transparent bg-gray-50 hover:bg-gray-100/80 hover:border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            selectedId === box.id ? 'bg-blue-500 text-white' : 'bg-white text-gray-400 group-hover:text-gray-600 shadow-sm'
          }`}>
            📦
          </div>
          <div>
            <p className={`font-bold ${selectedId === box.id ? 'text-blue-700' : 'text-gray-700'}`}>{box.name}</p>
            <p className="text-xs text-gray-400">ID: {box.id.slice(0, 8)}</p>
          </div>
        </div>
      </button>
    ))}
  </div>
);

import { ScannerModal } from '@/components/ScannerModal'; 

export interface InventoryPageProps {
  initialData: {
    items: InventoryItem[];
    boxes: Box[];
  };
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ initialData }) => {
  // 1. Instanciamos nuestros controladores
  const { 
    currentBoxItems, 
    selectedBoxId, 
    setSelectedBoxId, 
    assignItemToBox 
  } = useInventoryFlow(initialData.items, initialData.boxes);

  const { query, setQuery, results, isSearching } = useSearchController();

  // 2. Evento cuando la IA termina de reconocer un objeto
  const handleAIResult = async (draftItem: DraftItem) => {
    if (!selectedBoxId) {
       alert("Por favor, selecciona una caja primero.");
       return;
    }
    await assignItemToBox(draftItem, selectedBoxId);
  };

  return (
    <div className="grid grid-cols-12 gap-8 p-8 max-w-7xl mx-auto min-h-screen bg-transparent text-gray-900">
      {/* BARRA LATERAL: Búsqueda y Selección de Cajas */}
      <aside className="col-span-12 lg:col-span-4 flex flex-col gap-2">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="relative group">
            <input 
              type="search" 
              placeholder="¿Qué estás buscando?..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-4 pl-12 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700 placeholder:text-gray-400"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40 group-focus-within:opacity-100 transition-opacity">🔍</span>
          </div>
          
          {isSearching && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-500 font-medium animate-pulse">
               <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
               Buscando en la nube...
            </div>
          )}
          
          {/* Renderizado de Resultados de Búsqueda o Lista de Cajas */}
          {query.length >= 2 ? (
             <SearchResults items={results} /> 
          ) : (
             <BoxSelector 
               boxes={initialData.boxes} 
               selectedId={selectedBoxId} 
               onSelect={setSelectedBoxId} 
             />
          )}
        </div>

        <div className="bg-linear-to-br from-indigo-600 to-blue-700 p-6 rounded-[2.5rem] text-white shadow-xl shadow-blue-200/40 mt-4">
          <h3 className="font-bold text-lg mb-1">Tip de Staff Engineer 🚀</h3>
          <p className="text-blue-100 text-sm leading-relaxed">
            La búsqueda semántica usa el motor de vectores de Supabase para encontrar objetos por concepto, no solo por nombre.
          </p>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL: Contenido de la Caja y Escáner */}
      <main className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        {selectedBoxId ? (
          <>
            <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
              <div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Contenido de Caja</h2>
                <p className="text-gray-400 font-medium">Gestiona los items asignados a este contenedor</p>
              </div>
              {/* Aquí integramos el escáner de IA */}
              <ScannerModal onScanSuccess={handleAIResult} />
            </header>

            {/* Listado de items (Súper rápido gracias a useMemo) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {currentBoxItems.map(item => (
                <div key={item.id} className="group p-6 bg-white border border-gray-100 rounded-3xl hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 active:scale-[0.98]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      📦
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:text-blue-600 transition-colors">{item.name}</h3>
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.description || 'Sin descripción disponible.'}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {item.tags.slice(0, 3).map(tag => (
                         <div key={tag} className="w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                           {tag.slice(0, 1).toUpperCase()}
                         </div>
                       ))}
                    </div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Confianza: {(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
              
              {currentBoxItems.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] text-center">
                  <div className="text-6xl mb-4 opacity-20">📭</div>
                  <p className="text-xl font-bold text-gray-400">La caja está vacía</p>
                  <p className="text-sm text-gray-300 max-w-xs mt-2">Usa el botón de escanear arriba para empezar a llenar tu inventario con IA.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-12 text-center animate-in fade-in duration-700">
            <div className="w-32 h-32 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-6xl mb-8 animate-bounce">
              👈
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-4">Selecciona un contenedor</h2>
            <p className="text-gray-400 max-w-sm leading-relaxed font-medium">
              Elige una caja de la barra lateral para ver su contenido o escanear nuevos objetos directamente en ella.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
