import { create } from 'zustand';
import { type Item } from '@/entities/item/schema';
import { persist } from 'zustand/middleware';

interface LoanState {
    items: Item[];
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;
    clear: () => void;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
}

export const useLoanStore = create<LoanState>()(
    persist(
        (set) => ({
            items: [],
            addItem: (item) => set((state) => {
                if (state.items.find(i => i.id === item.id)) return state;
                return { items: [...state.items, item] };
            }),
            removeItem: (itemId) => set((state) => ({
                items: state.items.filter(i => i.id !== itemId)
            })),
            clear: () => set({ items: [] }),
            isOpen: false,
            setOpen: (open) => set({ isOpen: open }),
        }),
        {
            name: 'loan-storage',
        }
    )
);
