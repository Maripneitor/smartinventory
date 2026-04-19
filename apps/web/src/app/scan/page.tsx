"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { 
    ChevronLeft, 
    Camera, 
    Loader2, 
    Info, 
    AlertCircle, 
    CheckCircle2, 
    RefreshCcw, 
    X, 
    ExternalLink,
    History,
    Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type Container } from "@/entities/container/schema";
import { type Item } from "@/entities/item/schema";
import { containersService } from "@/core/containers";
import { itemsService } from "@/core/items";
import { InventoryCard } from "@/components/inventory/inventory-card";
import { QuickReturnModal } from "@/components/inventory/QuickReturnModal";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ScanHistoryItem {
    id: string;
    label: string;
    itemsCount: number;
    timestamp: string;
}

export default function ScanPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "ready" | "error" | "success">("loading");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // X-Ray View state
    const [xrayData, setXrayData] = useState<{ container: Container; items: Item[]; signedUrls: Record<string, string> } | null>(null);
    const [fetchingXray, setFetchingXray] = useState(false);

    // History state
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

    // Return Flow state
    const [returnItem, setReturnItem] = useState<(Item & { containers?: Container }) | null>(null);
    const [showReturnModal, setShowReturnModal] = useState(false);

    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.warn("Audio feedback failed", e);
        }
    };

    const onScanSuccess = useCallback(async (decodedText: string) => {
        if (fetchingXray || showReturnModal) return;

        // Pro Feedback: Haptic & Audio
        if (typeof window !== "undefined") {
            if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
            playBeep();
        }

        try {
            setStatus("success");

            let targetId = decodedText;
            let isItem = false;

            try {
                const url = new URL(decodedText);
                if (url.pathname.includes('/containers/')) {
                    targetId = url.pathname.split('/').pop() || "";
                } else if (url.pathname.includes('/items/')) {
                    targetId = url.pathname.split('/').pop() || "";
                    isItem = true;
                }
            } catch { 
                if (decodedText.length === 36) {
                    // Possible UUID
                }
            }

            if (targetId.length >= 20) {
                setFetchingXray(true);
                try {
                    if (isItem || targetId.length === 36) {
                        const { data: item } = await containersService.createClient()
                            .from('items')
                            .select('*, containers(*, locations(*))')
                            .eq('id', targetId)
                            .single();
                        
                        if (item && item.borrowed_by) {
                            setReturnItem(item as (Item & { containers?: Container }));
                            setShowReturnModal(true);
                            await scannerRef.current?.stop();
                            setFetchingXray(false);
                            return;
                        }
                    }

                    const [container, items] = await Promise.all([
                        containersService.getById(targetId),
                        itemsService.getByContainer(targetId)
                    ]);

                    if (container) {
                        setXrayData({ container, items, signedUrls: {} });
                        setScanHistory(prev => [{
                            id: container.id,
                            label: container.label,
                            itemsCount: items.length,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }, ...prev].slice(0, 5));
                        await scannerRef.current?.stop();
                    } else {
                        setStatus("error");
                        setErrorMsg("Contenedor no encontrado");
                    }
                } catch (e) {
                    console.error("Scan fetch failed", e);
                    setStatus("error");
                    setErrorMsg("Error al obtener datos");
                } finally {
                    setFetchingXray(false);
                }
            } else {
                setStatus("ready");
                setErrorMsg("QR no reconocido");
                setTimeout(() => setErrorMsg(null), 3000);
            }
        } catch (e) {
            console.error(e);
            setStatus("ready");
        }
    }, [fetchingXray, showReturnModal]);

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
                        () => { }
                    );
                    setStatus("ready");
                } else {
                    throw new Error("No se detectaron cámaras.");
                }
            } catch (err: unknown) {
                let message = "Error al acceder a la cámara.";
                if (err instanceof Error) {
                    if (err.name === "NotAllowedError" || err.message.includes("Permission denied")) {
                        message = "Permiso de cámara denegado. Habilítalo en ajustes.";
                    } else {
                        message = err.message;
                    }
                }
                setStatus("error");
                setErrorMsg(message);
            }
        };

        if (!xrayData && !showReturnModal) {
            startScanner();
        }

        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(e => console.error("Error stopping", e));
            }
        };
    }, [onScanSuccess, xrayData, showReturnModal]);

    const resetScanner = () => {
        setXrayData(null);
        setReturnItem(null);
        setShowReturnModal(false);
        setStatus("loading");
    };

    const handleReturn = async () => {
        if (!returnItem) return;
        try {
            await itemsService.returnItem(returnItem.id, returnItem.container_id);
            toast.success("¡Objeto devuelto!");
            resetScanner();
        } catch (e) {
            toast.error("Error en devolución");
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 space-y-12 min-h-screen">
            {/* Modal de Devolución Rápida */}
            {returnItem && (
                <QuickReturnModal
                    isOpen={showReturnModal}
                    onClose={resetScanner}
                    item={{ ...returnItem, borrower_name: "Papá" }}
                    originalContainer={returnItem.containers}
                    onConfirm={handleReturn}
                    onAltAction={() => router.push(`/items/${returnItem.id}/move`)}
                />
            )}

            {/* Header Editorial */}
            <div className="flex flex-col gap-4">
                <Link 
                    href="/" 
                    className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-xs font-black uppercase tracking-widest"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Dashboard
                </Link>
                <div className="flex items-end justify-between">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-6xl font-headline font-bold text-on-surface tracking-tighter"
                        >
                            Escáner <span className="text-primary italic">IA</span>
                        </motion.h1>
                        <p className="text-on-surface-variant font-body text-lg mt-2">Visión artificial para tu inventario físico.</p>
                    </div>
                    <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-low text-primary cloud-shadow">
                        <Zap className="h-8 w-8" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Scanner Viewport */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="relative aspect-square md:aspect-video w-full overflow-hidden rounded-[3rem] bg-zinc-950 cloud-shadow border-4 border-surface-container-low">
                        <div id="reader" className="w-full h-full object-cover"></div>

                        {/* Scanner Overlay UI */}
                        <AnimatePresence>
                            {status === "ready" && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                                >
                                    <div className="w-64 h-64 border-2 border-primary/30 rounded-[2rem] relative">
                                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
                                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
                                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>
                                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-primary/20 animate-scan-line"></div>
                                    </div>
                                    <p className="absolute bottom-10 text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Buscando Identificador...</p>
                                </motion.div>
                            )}

                            {(status === "loading" || fetchingXray) && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-highest/80 backdrop-blur-xl z-10"
                                >
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-on-surface">
                                        {fetchingXray ? "Procesando Rayos X..." : "Calibrando Óptica..."}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-start gap-4 p-6 bg-surface-container-low rounded-3xl border border-primary/5">
                        <Info className="h-6 w-6 text-primary shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-on-surface leading-tight">Consejo de Iluminación</p>
                            <p className="text-xs text-on-surface-variant mt-1">Asegúrate de que el código QR esté bien iluminado y plano para una detección instantánea por parte de la IA.</p>
                        </div>
                    </div>
                </div>

                {/* History & Status Sidebar */}
                <div className="lg:col-span-5 space-y-8">
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-on-surface-variant" />
                            <h3 className="font-headline font-bold text-on-surface text-xl">Escaneos Recientes</h3>
                        </div>

                        <div className="space-y-3">
                            {scanHistory.length > 0 ? scanHistory.map((item, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={`${item.id}-${i}`}
                                    className="p-5 bg-surface-container-lowest rounded-2xl cloud-shadow border border-outline-variant/10 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer"
                                    onClick={() => router.push(`/containers/${item.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-bold text-xs">
                                            {item.label.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-on-surface text-sm">{item.label}</p>
                                            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">{item.itemsCount} Objetos · {item.timestamp}</p>
                                        </div>
                                    </div>
                                    <ChevronLeft className="h-4 w-4 text-on-surface-variant rotate-180 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </motion.div>
                            )) : (
                                <div className="py-12 border-2 border-dashed border-outline-variant/20 rounded-[2rem] flex flex-col items-center justify-center text-center px-8">
                                    <Camera className="h-10 w-10 text-on-surface-variant/20 mb-3" />
                                    <p className="text-sm font-bold text-on-surface-variant/40">Tu historial de escaneo aparecerá aquí.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* X-Ray View Overlay */}
            <AnimatePresence>
                {xrayData && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-0 bg-surface/90 backdrop-blur-3xl z-[100] flex flex-col p-6 md:p-12 overflow-y-auto"
                    >
                        <div className="max-w-5xl mx-auto w-full space-y-12">
                            <div className="flex items-center justify-between">
                                <button 
                                    onClick={resetScanner} 
                                    className="h-14 w-14 flex items-center justify-center rounded-2xl bg-surface-container-highest text-on-surface hover:bg-surface-container transition-colors shadow-sm"
                                >
                                    <X className="h-8 w-8" />
                                </button>
                                <Button 
                                    onClick={() => router.push(`/containers/${xrayData.container.id}`)}
                                    className="h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold shadow-xl shadow-primary/20"
                                >
                                    Ver Detalles Completos
                                </Button>
                            </div>

                            <header className="space-y-4">
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                    <Zap className="h-3 w-3" /> Rayos X IA
                                </div>
                                <h2 className="text-6xl font-headline font-bold text-on-surface tracking-tighter">{xrayData.container.label}</h2>
                                <p className="text-xl text-on-surface-variant font-body">Contiene {xrayData.items.length} objetos detectados en este contenedor.</p>
                            </header>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {xrayData.items.map(item => (
                                    <InventoryCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

