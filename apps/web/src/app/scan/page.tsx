"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ChevronLeft, Camera, Loader2, Info, AlertCircle, CheckCircle2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ScanPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "ready" | "error" | "success">("loading");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const onScanSuccess = useCallback((decodedText: string) => {
        try {
            // Feedback visual de éxito
            setStatus("success");
            
            // Extraer ID si es URL u otro formato
            let targetId = decodedText;
            try {
                const url = new URL(decodedText);
                if (url.pathname.includes('/containers/')) {
                    targetId = url.pathname.split('/').pop() || "";
                }
            } catch { }

            if (targetId.length >= 20) {
                // Esperar un toque para que el usuario vea el éxito
                setTimeout(() => {
                    scannerRef.current?.stop().then(() => {
                         router.push(`/containers/${targetId}`);
                    });
                }, 500);
            } else {
                setStatus("ready");
                alert("QR no reconocido como una caja de SmartInventory");
            }
        } catch {
            setStatus("ready");
        }
    }, [router]);

    useEffect(() => {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        const startScanner = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    await scanner.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        onScanSuccess,
                        () => {} // onScanFailure vacío
                    );
                    setStatus("ready");
                } else {
                    throw new Error("No se detectaron cámaras.");
                }
            } catch (err: any) {
                console.error(err);
                setStatus("error");
                setErrorMsg(err.message || "Error al acceder a la cámara.");
            }
        };

        startScanner();

        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(e => console.error("Error stopping", e));
            }
        };
    }, [onScanSuccess]);

    const retry = () => window.location.reload();

    return (
        <div className="flex flex-col gap-6 min-h-[80vh]">
            <header className="flex items-center gap-4">
                <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 active:scale-95 transition-all">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-white tracking-tight">Escanear QR</h1>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                {/* Scanner Window */}
                <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 shadow-2xl">
                    <div id="reader" className="w-full aspect-square bg-black overflow-hidden object-cover"></div>
                    
                    {/* Overlay de Enfoque */}
                    {status === "ready" && (
                         <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                             <div className="w-64 h-64 border-2 border-blue-500/50 rounded-3xl relative">
                                 <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                                 <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                                 <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                                 <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
                                 <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/30 animate-scan-line"></div>
                             </div>
                         </div>
                    )}

                    {/* Estados del Scanner */}
                    {status === "loading" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Iniciando Cámara...</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600/20 backdrop-blur-xl animate-in fade-in duration-300">
                             <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 animate-bounce">
                                <CheckCircle2 className="h-10 w-10 text-white" />
                             </div>
                             <p className="mt-4 text-sm font-bold text-white uppercase tracking-widest">¡Caja Detectada!</p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-xl p-8 text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <p className="text-sm font-bold text-white mb-2">{errorMsg}</p>
                            <button 
                                onClick={retry}
                                className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase transition-all"
                            >
                                <RefreshCcw className="h-3 w-3" /> Reintentar
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4 text-center px-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
                        <Camera className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-bold text-lg text-white">Apunta a la etiqueta QR</p>
                        <p className="text-zinc-500 text-sm max-w-[280px]">Escanea el código de una caja para ver su contenido al instante.</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 rounded-3xl bg-zinc-900/50 border border-white/5 p-5 max-w-sm mx-4">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                        Si el QR está dañado o la cámara no enfoca, busca el identificador de la caja en la sección de <Link href="/containers" className="text-blue-500 underline">Inventario</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
