import { create } from 'zustand';

interface UIStore {
    isScannerOpen: boolean;
    setScannerOpen: (open: boolean) => void;
    lastScannedId: string | null;
    setLastScannedId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isScannerOpen: false,
    setScannerOpen: (open) => set({ isScannerOpen: open }),
    lastScannedId: null,
    setLastScannedId: (id) => set({ lastScannedId: id }),
}));
