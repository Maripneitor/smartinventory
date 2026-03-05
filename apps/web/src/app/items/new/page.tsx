"use client";

import { ItemForm } from "@/components/inventory/item-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function NewItemPage() {
    return (
        <div className="flex flex-col gap-10 pb-40">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-white/5 active:scale-95 transition-all"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black tracking-tight text-white leading-tight">Nuevo Objeto</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Digitalización Asistida por IA</p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto w-full">
                <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner /></div>}>
                    <ItemForm />
                </Suspense>
            </div>
        </div>
    );
}
