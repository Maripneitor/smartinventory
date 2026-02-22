"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { useState } from "react";

interface ContainerLabelProps {
    containerId: string;
    label: string;
}

export function ContainerLabelPrinter({ containerId, label }: ContainerLabelProps) {
    const [generating, setGenerating] = useState(false);

    async function generatePDF() {
        setGenerating(true);
        try {
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [100, 150], // Tamaño estilo Honeywell / Zebra común
            });

            // 1. Generar QR as data URL
            // El QR apunta a la URL base + el ID del container
            const qrUrl = `${window.location.origin}/containers/${containerId}`;
            const qrDataUrl = await QRCode.toDataURL(qrUrl, {
                margin: 1,
                width: 400,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
            });

            // 2. Diseño de la etiqueta
            // Borde
            doc.setDrawColor(200);
            doc.rect(5, 5, 90, 140);

            // Logo / Título App
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("SMART INVENTORY", 50, 15, { align: "center" });

            // Línea separadora
            doc.line(10, 20, 90, 20);

            // Nombre de la Caja
            doc.setFontSize(18);
            doc.setTextColor(0);
            const splitLabel = doc.splitTextToSize(label, 80);
            doc.text(splitLabel, 50, 35, { align: "center" });

            // QR Code
            doc.addImage(qrDataUrl, "PNG", 20, 50, 60, 60);

            // Metadata
            doc.setFont("courier", "normal");
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`ID: ${containerId}`, 50, 120, { align: "center" });

            // Footer
            doc.setFont("helvetica", "italic");
            doc.setFontSize(7);
            doc.text("Escanea para ver el contenido", 50, 135, { align: "center" });

            // 3. Descargar
            doc.save(`Etiqueta_${label.replace(/\s+/g, "_")}.pdf`);
        } catch (error) {
            console.error("PDF Generation error", error);
            alert("No se pudo generar el PDF");
        } finally {
            setGenerating(false);
        }
    }

    return (
        <Button
            variant="outline"
            onClick={generatePDF}
            disabled={generating}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border-white/5 text-zinc-400 p-0"
        >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
        </Button>
    );
}
