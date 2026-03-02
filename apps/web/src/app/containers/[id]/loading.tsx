import { ChevronLeft, Box, Package as PackageIcon, MapPin } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            {/* Navbar Placeholder */}
            <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-zinc-900" />
                <div className="flex items-center gap-2">
                    <div className="h-10 w-24 rounded-xl bg-zinc-900" />
                    <div className="h-10 w-32 rounded-xl bg-zinc-900" />
                </div>
            </div>

            {/* Header Placeholder */}
            <header className="flex flex-col gap-2 mt-4">
                <div className="h-4 w-32 rounded bg-zinc-900" />
                <div className="h-12 w-64 rounded-lg bg-zinc-900" />
                <div className="flex gap-4 mt-2">
                    <div className="h-4 w-20 rounded bg-zinc-900" />
                    <div className="h-4 w-32 rounded bg-zinc-900" />
                </div>
            </header>

            {/* Toolbar Placeholder */}
            <div className="flex items-center justify-between border-t border-white/5 pt-6 pb-2">
                <div className="h-10 w-32 rounded-xl bg-zinc-900" />
                <div className="h-10 w-40 rounded-2xl bg-zinc-900" />
            </div>

            {/* Items Grid Placeholder */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 mt-2">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-[2rem] bg-zinc-900/50 border border-white/5" />
                ))}
            </div>
        </div>
    );
}
