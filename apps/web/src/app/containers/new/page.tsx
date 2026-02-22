import { ContainerForm } from "@/components/inventory/container-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewContainerPage() {
    return (
        <div className="flex flex-col gap-6 max-w-xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="font-display text-2xl font-bold">Nueva Caja</h1>
            </div>
            <ContainerForm />
        </div>
    );
}
