"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ChevronLeft, Camera, Loader2, Info, AlertCircle, CheckCircle2, RefreshCcw, X, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { containersService, Container } from "@/core/containers";
import { itemsService, Item } from "@/core/items";
import { createSignedPhotoUrl } from "@/core/storage";
import { InventoryCard } from "@/components/inventory/inventory-card";

export default function ScanPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "ready" | "error" | "success">("loading");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // X-Ray View state
    const [xrayData, setXrayData] = useState<{ container: Container; items: Item[]; signedUrls: Record<string, string> } | null>(null);
    const [fetchingXray, setFetchingXray] = useState(false);

    const onScanSuccess = useCallback(async (decodedText: string) => {
        if (fetchingXray) return;
        
        try {
            setStatus("success");
            
            let targetId = decodedText;
            try {
                const url = new URL(decodedText);
                if (url.pathname.includes('/containers/')) {
                    targetId = url.pathname.split('/').pop() || "";
                }
            } catch { }

            if (targetId.length >= 20) {
                setFetchingXray(true);
                try {
                    const [container, items] = await Promise.all([
                        containersService.getById(targetId),
                        itemsService.getByContainer(targetId)
                    ]);

                    const urls: Record<string, string> = {};
                    await Promise.all(items.map(async (item) => {
                        if (item.photo_path) {
                            try {
                                urls[item.id] = await createSignedPhotoUrl(item.photo_path);
                            } catch (e) {
                                console.error("Error signing URL", e);
                            }
                        }
                    }));

                    setXrayData({ container, items, signedUrls: urls });
                    // Detener el scanner para ahorrar recursos mientras ve los rayos X
                    await scannerRef.current?.stop();
                } catch (e) {
                    console.error("X-ray fetch failed", e);
                    router.push(`/containers/${targetId}`);
                } finally {
                    setFetchingXray(false);
                }
            } else {
                setStatus("ready");
                setErrorMsg("QR no reconocido como una caja de SmartInventory");
                setTimeout(() => setErrorMsg(null), 3000);
            }
        } catch (e) {
            console.error(e);
            setStatus("ready");
        }
    }, [router, fetchingXray]);

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
                        () => {} 
                    );
                    setStatus("ready");
                } else {
                    throw new Error("No se detectaron cámaras.");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error al acceder a la cámara.";
                console.error(err);
                setStatus("error");
                setErrorMsg(message);
            }
        };

        if (!xrayData) {
            startScanner();
        }

        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(e => console.error("Error stopping", e));
            }
        };
    }, [onScanSuccess, xrayData]);

    const resetScanner = async () => {
        setXrayData(null);
        setStatus("loading");
        // El useEffect se encargará de reiniciar el scanner al cambiar xrayData a null
    };

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
                    {(status === "loading" || fetchingXray) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md z-10">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                {fetchingXray ? "Obteniendo Rayos X..." : "Iniciando Cámara..."}
                            </p>
                        </div>
                    )}

                    {status === "success" && !xrayData && !fetchingXray && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600/20 backdrop-blur-xl animate-in fade-in duration-300 z-10">
                             <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 animate-bounce">
                                <CheckCircle2 className="h-10 w-10 text-white" />
                             </div>
                             <p className="mt-4 text-sm font-bold text-white uppercase tracking-widest">¡Caja Detectada!</p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-xl p-8 text-center z-10">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <p className="text-sm font-bold text-white mb-2">{errorMsg}</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase transition-all"
                            >
                                <RefreshCcw className="h-3 w-3" /> Reintentar
                            </button>
                        </div>
                    )}
                </div>

                {!xrayData && (
                    <div className="flex flex-col items-center gap-4 text-center px-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
                            <Camera className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-white">Apunta a la etiqueta QR</p>
                            <p className="text-zinc-500 text-sm max-w-[280px]">Escanea el código de una caja para ver su contenido al instante.</p>
                        </div>
                    </div>
                )}

                {/* X-Ray View Overlay */}
                {xrayData && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500">
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between sticky top-0 bg-transparent z-10 py-2">
                                <button onClick={resetScanner} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                                    <X className="h-6 w-6" />
                                </button>
                                <Link 
                                    href={`/containers/${xrayData.container.id}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white uppercase tracking-tighter shadow-lg shadow-blue-500/20"
                                >
                                    Abrir Caja <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                            </div>

                            <header className="flex flex-col gap-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">Vista de Rayos X</p>
                                <h2 className="text-4xl font-extrabold text-white tracking-tight">{xrayData.container.label}</h2>
                                <p className="text-xs text-zinc-500 font-medium">Contiene {xrayData.items.length} objetos</p>
                            </header>

                            <div className="grid grid-cols-2 gap-4">
                                {xrayData.items.map(item => (
                                    <InventoryCard 
                                        key={item.id} 
                                        item={item} 
                                        signedUrl={xrayData.signedUrls[item.id]} 
                                    />
                                ))}
                                {xrayData.items.length === 0 && (
                                    <div className="col-span-full py-10 bg-white/5 rounded-3xl border border-white/5 text-center px-6">
                                        <p className="text-zinc-500 text-sm italic">Esta caja está vacía.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-6 bg-transparent border-t border-white/5">
                             <button 
                                onClick={resetScanner}
                                className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg active:scale-95 transition-all shadow-xl shadow-white/5"
                             >
                                Escanear otra caja
                             </button>
                        </div>
                    </div>
                )}

                {!xrayData && (
                    <div className="flex items-start gap-3 rounded-3xl bg-zinc-900/50 border border-white/5 p-5 max-w-sm mx-4">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                            Si el QR está dañado o la cámara no enfoca, busca el identificador de la caja en la sección de <Link href="/containers" className="text-blue-500 underline">Inventario</Link>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

