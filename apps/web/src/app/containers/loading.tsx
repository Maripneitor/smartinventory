import { Loader2, Box } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <header className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-zinc-900" />
                        <div className="h-8 w-32 rounded-lg bg-zinc-900" />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-zinc-900" />
                </div>
                <div className="h-12 w-full rounded-2xl bg-zinc-900" />
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-3xl bg-zinc-900/50 p-4 border border-white/5">
                        <div className="h-14 w-14 rounded-2xl bg-zinc-900" />
                        <div className="flex-1 flex flex-col gap-2">
                            <div className="h-4 w-24 rounded bg-zinc-900" />
                            <div className="h-3 w-32 rounded bg-zinc-900" />
                        </div>
                        <div className="h-8 w-8 rounded-full bg-zinc-900" />
                    </div>
                ))}
            </div>
        </div>
    );
}
