"use client";

import { GlobalSearch } from "@/components/search/GlobalSearch";
import { User, Bell } from "lucide-react";

export function Header() {
    return (
        <header className="flex items-center justify-between gap-6 mb-8">
            <div className="flex-1">
                <GlobalSearch />
            </div>
            
            <div className="flex items-center gap-3">
                <button className="h-12 w-12 flex items-center justify-center rounded-2xl bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container transition-all">
                    <Bell className="h-5 w-5" />
                </button>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                    <User className="h-6 w-6" />
                </div>
            </div>
        </header>
    );
}
