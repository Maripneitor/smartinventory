'use client';

import React, { useState } from 'react';
import { RobustScanner } from './inventory/RobustScanner';
import { DraftItem } from '@/core/types/domain';

interface ScannerModalProps {
  onScanSuccess: (draft: DraftItem) => void;
}

export function ScannerModal({ onScanSuccess }: ScannerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemAdded = () => {
    // RobustScanner internals save the item, but our new flow wants to manage it.
    // However, if we reuse RobustScanner, we might need to tweak it.
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
      >
        <span className="text-xl">📷</span> Escanear con IA
      </button>

      {isOpen && (
        <RobustScanner 
          onScanSuccess={(draft) => {
            onScanSuccess(draft);
            setIsOpen(false);
          }}
          onItemAdded={handleItemAdded} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
