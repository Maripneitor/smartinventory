import { create } from 'zustand';

interface ScannerState {
  isOpen: boolean;
  currentImage: string | null;
  analysisResult: any | null;
  isAnalyzing: boolean;
  
  openScanner: () => void;
  closeScanner: () => void;
  setImage: (image: string) => void;
  setAnalysis: (result: any) => void;
  setAnalyzing: (status: boolean) => void;
  reset: () => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  isOpen: false,
  currentImage: null,
  analysisResult: null,
  isAnalyzing: false,
  
  openScanner: () => set({ isOpen: true }),
  closeScanner: () => set({ isOpen: false }),
  setImage: (image) => set({ currentImage: image }),
  setAnalysis: (result) => set({ analysisResult: result }),
  setAnalyzing: (status) => set({ isAnalyzing: status }),
  reset: () => set({
    currentImage: null,
    analysisResult: null,
    isAnalyzing: false,
  }),
}));
