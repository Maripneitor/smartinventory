import React from 'react';
import { useInventoryFlow } from '@/controllers/useInventoryFlow';
import { useSearchController } from '@/controllers/useSearchController';
import { InventoryScannerView } from './InventoryScannerView';
import type { InventoryItem, Box, DraftItem } from '@/core/types/domain';

interface InventoryPageProps {
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
    assignItemToBox,
    isProcessing
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
    <div className="grid grid-cols-12 gap-8 p-8 max-w-7xl mx-auto min-h-screen bg-[#FDFDFF]">
      {/* BARRA LATERAL: Búsqueda y Selección de Cajas */}
      <aside className="col-span-4 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100/50">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Explorar Inventario</h2>
          <div className="relative group">
            <input 
              type="search" 
              placeholder="Buscar objetos..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-4 pl-12 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {isSearching && <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-3 animate-pulse">Buscando en la nube...</p>}
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100/50 flex-1 overflow-y-auto">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Tus Cajas</h2>
          <div className="space-y-2">
            {initialData.boxes.map(box => (
              <button 
                key={box.id}
                onClick={() => setSelectedBoxId(box.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center justify-between group ${
                  selectedBoxId === box.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                    selectedBoxId === box.id ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-blue-100'
                  }`}>
                    <svg className={`w-5 h-5 ${selectedBoxId === box.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-12 10-8-10m16 0v10l-8 4-8-4V7" />
                    </svg>
                  </div>
                  <span className="font-bold">{box.name}</span>
                </div>
                {selectedBoxId === box.id && (
                  <svg className="w-5 h-5 animate-in slide-in-from-right duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL: Contenido de la Caja y Escáner */}
      <main className="col-span-8 flex flex-col gap-6">
        {selectedBoxId ? (
          <>
            <header className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100/50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1 block">Espacio de Almacenaje</span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                  {initialData.boxes.find(b => b.id === selectedBoxId)?.name}
                </h2>
              </div>
              
              <div className="flex gap-3">
                <button 
                  className="px-6 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                  onClick={() => console.log('Edit box')}
                >
                  Configurar
                </button>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-6 flex-1">
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 px-4">Contenido ({currentBoxItems.length})</h3>
                <div className="space-y-3">
                  {currentBoxItems.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-50 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-[9px] font-black text-blue-500 rounded uppercase tracking-widest">
                              {item.category}
                            </span>
                            <span className="text-[9px] font-bold text-gray-300 tracking-widest">
                              ID: {item.id.slice(0, 8)}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900">{item.name}</h4>
                        </div>
                        <button className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {currentBoxItems.length === 0 && (
                    <div className="bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2rem] p-12 text-center">
                      <p className="text-gray-400 font-bold">Esta caja está vacía</p>
                      <p className="text-xs text-gray-300 uppercase tracking-widest mt-1">Usa la IA para guardar algo</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 px-4">Nuevo Item IA</h3>
                <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-100/50">
                  <InventoryScannerView />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm border-dashed">
            <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6 animate-bounce">
              <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Tu Almacén Inteligente</h3>
            <p className="text-gray-500 font-medium max-w-xs mx-auto mt-2">
              Selecciona una caja en la barra lateral para ver su contenido o escanear nuevos objetos con IA.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
