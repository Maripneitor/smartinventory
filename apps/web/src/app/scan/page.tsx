"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { ChevronLeft, Camera, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ScanPage() {
    const router = useRouter();
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText: string) {
            // Ejemplo: http://localhost:3000/containers/ID
            // O solo el ID
            try {
                const url = new URL(decodedText);
                if (url.pathname.includes('/containers/')) {
                    scanner.clear();
                    router.push(url.pathname);
                } else {
                    alert("QR no reconocido como una caja de SmartInventory");
                }
            } catch {
                // Si no es URL, probamos si es un ID directo
                if (decodedText.length > 20) {
                    scanner.clear();
                    router.push(`/containers/${decodedText}`);
                }
            }
        }

        function onScanFailure(error: any) {
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear().catch(e => console.error("Error clearing scanner", e));
        };
    }, []);

    return (
        <div className="flex flex-col gap-6 min-h-[80vh]">
            <header className="flex items-center gap-4">
                <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Escanear QR</h1>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
                    <div id="reader" className="w-full aspect-square bg-black"></div>
                </div>

                <div className="flex flex-col items-center gap-4 text-center px-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 text-blue-500">
                        <Camera className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-bold text-lg">Apunta a la etiqueta</p>
                        <p className="text-zinc-500 text-sm">Escanea el código QR de una caja para ver su contenido al instante.</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-zinc-900/50 p-4 max-w-sm">
                    <Info className="h-5 w-5 text-zinc-400 shrink-0" />
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        Asegúrate de tener buena iluminación. Si el QR está dañado, puedes buscar la caja manualmente en la sección de Inventario.
                    </p>
                </div>
            </div>
        </div>
    );
}
