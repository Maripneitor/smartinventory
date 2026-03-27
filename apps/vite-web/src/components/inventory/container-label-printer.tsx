"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { generateAverySheet, AVERY_5160, AVERY_5163, type AveryTemplate } from "@/core/labels";
import { cn } from "@/lib/utils";

interface ContainerLabelProps {
    containerId: string;
    label: string;
}

export function ContainerLabelPrinter({ containerId, label }: ContainerLabelProps) {
    const [generating, setGenerating] = useState(false);
    const [open, setOpen] = useState(false);

    async function generateZebraPDF() {
        setGenerating(true);
        setOpen(false);
        try {
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [100, 150],
            });

            const qrUrl = `${window.location.origin}/containers/${containerId}`;
            const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 400 });

            doc.setDrawColor(200);
            doc.rect(5, 5, 90, 140);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("SMART INVENTORY", 50, 15, { align: "center" });
            doc.line(10, 20, 90, 20);
            doc.setFontSize(18);
            const splitLabel = doc.splitTextToSize(label, 80);
            doc.text(splitLabel, 50, 35, { align: "center" });
            doc.addImage(qrDataUrl, "PNG", 20, 50, 60, 60);
            doc.text(`ID: ${containerId}`, 50, 120, { align: "center" });
            doc.save(`Etiqueta_${label.replace(/\s+/g, "_")}.pdf`);
        } catch (error) {
            console.error(error);
        } finally {
            setGenerating(false);
        }
    }

    async function printAvery(template: AveryTemplate) {
        setGenerating(true);
        setOpen(false);
        try {
            await generateAverySheet({
                template,
                items: [{ id: containerId, label }]
            });
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div className="relative">
            <Button
                variant="outline"
                disabled={generating}
                onClick={() => setOpen(!open)}
                className="flex h-10 gap-2 items-center justify-center rounded-xl bg-zinc-900 border-white/5 text-zinc-400 px-3 transition-all active:scale-95"
            >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                <span className="text-xs font-bold uppercase hidden md:inline">Imprimir</span>
                <ChevronDown className={cn("h-3 w-3 opacity-50 transition-transform", open && "rotate-180")} />
            </Button>

            {open && (
                <>
                    <div className="fixed inset-0 z-70" onClick={() => setOpen(false)} />
                    <div className="glass-card absolute right-0 top-12 z-80 w-64 overflow-hidden rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Formatos de Etiqueta</p>
                        <div className="mt-1 space-y-1">
                            <button
                                onClick={generateZebraPDF}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5"
                            >
                                Zebra / Honeywell (101x152)
                                <span className="text-[10px] opacity-40 uppercase">Individual</span>
                            </button>
                            <button
                                onClick={() => printAvery(AVERY_5160)}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5"
                            >
                                Avery 5160
                                <span className="text-[10px] opacity-40 uppercase">Hoja Carta</span>
                            </button>
                            <button
                                onClick={() => printAvery(AVERY_5163)}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5"
                            >
                                Avery 5163
                                <span className="text-[10px] opacity-40 uppercase">Hoja Carta</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
