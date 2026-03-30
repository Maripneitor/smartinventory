import React from 'react';
import { useScannerController } from '@/controllers/useScannerController';
import { CameraCapture } from '@/components/CameraCapture'; // Tu componente de cámara
import { Spinner } from '@/components/ui/spinner';

export const InventoryScannerView: React.FC = () => {
  // Instanciamos el controlador
  const { isAnalyzing, analysisResult, error, processImage, resetScanner } = useScannerController();

  const handleImageCaptured = (base64String: string) => {
    // La vista le avisa al controlador lo que hizo el usuario
    processImage(base64String);
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold">Escanear Nuevo Objeto</h2>

      {/* Si hay error, lo mostramos */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Estado de Carga */}
      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center p-10">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">La IA de SmartInventory está analizando...</p>
        </div>
      ) : !analysisResult ? (
        /* Captura de Imagen */
        <CameraCapture onCapture={handleImageCaptured} />
      ) : (
        /* Resultados (Idealmente extraer a un componente ResultCardView) */
        <div className="border border-gray-100 rounded-2xl p-6 shadow-sm bg-white animate-in zoom-in duration-300">
          <div className="mb-4">
             <span className="text-[10px] uppercase tracking-widest text-blue-600 font-black">Objeto Detectado</span>
             <h3 className="text-2xl font-black text-gray-900 tracking-tight">{analysisResult.name}</h3>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Categoría</span>
              <span className="font-bold text-gray-800">{analysisResult.category}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Confianza</span>
              <span className="font-bold text-blue-600">{(analysisResult.confidence * 100).toFixed(0)}%</span>
            </div>
            {analysisResult.description && (
              <p className="text-sm text-gray-600 leading-relaxed pt-2">
                {analysisResult.description}
              </p>
            )}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button 
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              onClick={() => console.log('Guardar en BD...')}
            >
              Confirmar
            </button>
            <button 
              className="px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all"
              onClick={resetScanner}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
