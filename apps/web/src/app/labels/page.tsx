"use client";

import { useEffect, useState, useMemo } from "react";
import { containersService } from "@/core/containers";
import { Container } from "@/entities/container/schema";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
    Download,
    Search,
    Loader2,
    Package,
    CheckSquare,
    Square,
    Printer,
    Filter,
    ArrowLeft,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function LabelsPage() {
    const [containers, setContainers] = useState<Container[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [generating, setGenerating] = useState(false);
    const { toast, dismiss } = useToast();

    useEffect(() => {
        const fetchContainers = async () => {
            try {
                const data = await containersService.getAll();
                setContainers(data || []);
            } catch (error) {
                console.error("Error fetching containers:", error);
                toast("Error al cargar contenedores", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchContainers();
    }, [toast]);

    const filteredContainers = useMemo(() => {
        return containers.filter(c =>
            c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.locations?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [containers, searchQuery]);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredContainers.length && filteredContainers.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredContainers.map(c => c.id)));
        }
    };

    const generatePDF = async () => {
        if (selectedIds.size === 0) {
            toast("Selecciona al menos un contenedor", "info");
            return;
        }

        const toastId = toast("Generando PDF de etiquetas...", "loading");
        setGenerating(true);

        try {
            const selectedContainers = containers.filter(c => selectedIds.has(c.id));
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            // Grid Config (Label size 50x50mm)
            const labelSize = 50;
            const marginX = 5;
            const marginY = 5;
            const gap = 1; // minor gap between labels
            const cols = 4;
            const rows = 5;
            const labelsPerPage = cols * rows;

            for (let i = 0; i < selectedContainers.length; i++) {
                const container = selectedContainers[i];
                const pageItemIndex = i % labelsPerPage;
                const col = pageItemIndex % cols;
                const row = Math.floor(pageItemIndex / cols);

                if (i > 0 && pageItemIndex === 0) {
                    doc.addPage();
                }

                const x = marginX + (col * (labelSize + gap));
                const y = marginY + (row * (labelSize + gap));

                // Optional: Soft border for cutting guides
                doc.setDrawColor(230);
                doc.setLineWidth(0.1);
                doc.rect(x, y, labelSize, labelSize);

                // Generate QR Code as DataURL
                const qrDataUrl = await QRCode.toDataURL(container.qr_payload, {
                    margin: 1,
                    width: 300,
                    errorCorrectionLevel: 'H',
                    color: {
                        dark: "#000000",
                        light: "#ffffff"
                    }
                });

                // Add QR to PDF
                const qrSize = 35;
                const qrX = x + (labelSize - qrSize) / 2;
                const qrY = y + 3;
                doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

                // Add Container Label Text
                doc.setTextColor(0);
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                const text = container.label.toUpperCase();
                const textWidth = doc.getTextWidth(text);
                const textX = x + (labelSize - textWidth) / 2;
                doc.text(text, textX, y + qrSize + 7);

                // Add Location or ID Subtext
                doc.setFontSize(7);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100);
                const subText = container.locations?.name || "SIN UBICACIÓN";
                const subTextWidth = doc.getTextWidth(subText);
                const subTextX = x + (labelSize - subTextWidth) / 2;
                doc.text(subText, subTextX, y + qrSize + 11);
            }

            doc.save(`smart-inventory-labels-${new Date().toISOString().split('T')[0]}.pdf`);
            dismiss(toastId);
            toast("PDF generado y descargado", "success");
        } catch (error) {
            console.error("Error generating PDF:", error);
            dismiss(toastId);
            toast("Mierda, algo salió mal al generar el PDF", "error");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Header section */}
            <header className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/containers"
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-tight bg-linear-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                            Centro de Impresión
                        </h1>
                        <p className="text-zinc-500 font-medium">Gestiona y genera etiquetas QR para tus contenedores</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o ubicación..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-modern pl-12"
                        />
                    </div>
                    <button
                        onClick={generatePDF}
                        disabled={selectedIds.size === 0 || generating}
                        className={cn(
                            "btn-primary flex items-center justify-center gap-2 min-w-[200px]",
                            (selectedIds.size === 0 || generating) && "opacity-50 cursor-not-allowed grayscale"
                        )}
                    >
                        {generating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Printer className="h-5 w-5" />
                        )}
                        <span>Generar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""} Etiquetas</span>
                    </button>
                </div>
            </header>

            {/* Content section */}
            <div className="glass-card overflow-hidden border-white/5 bg-zinc-900/30">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
                        <Package className="h-4 w-4" />
                        <span>{filteredContainers.length} Contenedores encontrados</span>
                    </div>
                    <button
                        onClick={toggleSelectAll}
                        className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                        {selectedIds.size === filteredContainers.length && filteredContainers.length > 0 ? (
                            <>
                                <Square className="h-4 w-4" />
                                Deseleccionar Todo
                            </>
                        ) : (
                            <>
                                <CheckSquare className="h-4 w-4" />
                                Seleccionar Todo
                            </>
                        )}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-zinc-500 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                                <th className="p-4 w-10"></th>
                                <th className="p-4">Contenedor</th>
                                <th className="p-4">Ubicación</th>
                                <th className="p-4 text-right">Preview QR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={`skeleton-${i}`}>
                                            <td className="p-4"><div className="h-5 w-5 skeleton rounded-md" /></td>
                                            <td className="p-4"><div className="h-5 w-32 skeleton" /></td>
                                            <td className="p-4"><div className="h-5 w-24 skeleton" /></td>
                                            <td className="p-4 text-right flex justify-end"><div className="h-10 w-10 skeleton rounded-lg" /></td>
                                        </tr>
                                    ))
                                ) : filteredContainers.length > 0 ? (
                                    filteredContainers.map((container, idx) => (
                                        <motion.tr
                                            key={container.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => toggleSelect(container.id)}
                                            className={cn(
                                                "group cursor-pointer hover:bg-white/[0.03] transition-colors",
                                                selectedIds.has(container.id) && "bg-blue-500/5 hover:bg-blue-500/10"
                                            )}
                                        >
                                            <td className="p-4">
                                                <div className={cn(
                                                    "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    selectedIds.has(container.id)
                                                        ? "bg-blue-500 border-blue-500"
                                                        : "border-white/10 group-hover:border-white/30"
                                                )}>
                                                    {selectedIds.has(container.id) && <Check className="h-4 w-4 text-white" />}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-white group-hover:translate-x-1 transition-transform">
                                                    {container.label}
                                                </div>
                                                <div className="text-[10px] font-mono text-zinc-600 mt-1 uppercase">
                                                    {container.id.slice(0, 8)}...
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-zinc-400 border border-white/5">
                                                    {container.locations?.name || "Sin Ubicación"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-white p-1 rounded-lg">
                                                        <QRCodeComponent value={container.qr_payload} size={32} />
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Package className="h-12 w-12 text-zinc-700" />
                                                <p className="text-zinc-500 font-medium">No se encontraron contenedores</p>
                                                {searchQuery && (
                                                    <button
                                                        onClick={() => setSearchQuery("")}
                                                        className="text-blue-500 font-bold hover:underline"
                                                    >
                                                        Limpiar búsqueda
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating Selection Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-40"
                    >
                        <div className="glass-blue px-6 py-4 rounded-full flex items-center gap-6 shadow-2xl shadow-blue-500/20 backdrop-blur-2xl">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">Selección</span>
                                <span className="text-sm font-bold text-white leading-tight">{selectedIds.size} Contenedores</span>
                            </div>
                            <div className="h-8 w-px bg-blue-500/20" />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
                                    title="Cancelar selección"
                                >
                                    <Square className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={generatePDF}
                                    className="btn-primary py-2 px-5 text-sm h-10 flex items-center gap-2"
                                >
                                    <FileDown className="h-4 w-4" />
                                    Descargar PDF
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Simple wrapper for QR preview using canvas
function QRCodeComponent({ value, size }: { value: string; size: number }) {
    const [src, setSrc] = useState<string>("");

    useEffect(() => {
        QRCode.toDataURL(value, { margin: 1, width: size * 2 }).then(setSrc);
    }, [value, size]);

    if (!src) return <div style={{ width: size, height: size }} />;
    return <img src={src} alt="QR Preview" width={size} height={size} className="block" />;
}
