"use client";

import { useState } from "react";
import { Plus, X, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SpecificationsBuilderProps {
    value: Record<string, string>;
    onChange: (val: Record<string, string>) => void;
}

export function SpecificationsBuilder({ value, onChange }: SpecificationsBuilderProps) {
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");

    const addSpec = () => {
        if (!newKey.trim() || !newValue.trim()) return;
        onChange({ ...value, [newKey.trim()]: newValue.trim() });
        setNewKey("");
        setNewValue("");
    };

    const removeSpec = (key: string) => {
        const next = { ...value };
        delete next[key];
        onChange(next);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
                {Object.entries(value).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 bg-zinc-900 border border-white/5 pl-3 pr-1 py-1 rounded-xl">
                        <span className="text-[10px] font-black uppercase text-zinc-500">{k}:</span>
                        <span className="text-xs font-bold text-white">{v}</span>
                        <button 
                            type="button"
                            onClick={() => removeSpec(k)}
                            className="p-1 hover:text-red-500 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                    <Input 
                        placeholder="Propiedad (Ej. Marca)" 
                        value={newKey} 
                        onChange={e => setNewKey(e.target.value)}
                        className="h-10 text-xs rounded-xl"
                    />
                </div>
                <div className="sm:col-span-5">
                    <Input 
                        placeholder="Valor (Ej. Sony)" 
                        value={newValue} 
                        onChange={e => setNewValue(e.target.value)}
                        className="h-10 text-xs rounded-xl"
                    />
                </div>
                <div className="sm:col-span-2">
                    <button
                        type="button"
                        onClick={addSpec}
                        className="h-10 w-full flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <p className="text-[9px] text-zinc-600 font-medium px-1">Agrega especificaciones técnicas para que la búsqueda sea más precisa.</p>
        </div>
    );
}
