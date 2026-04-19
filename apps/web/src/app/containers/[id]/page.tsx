"use client";

import React, { useEffect, useState } from "react";
import { 
  ChevronLeft, 
  Plus, 
  LayoutGrid, 
  List as ListIcon, 
  Info, 
  Package as PackageIcon, 
  MapPin, 
  AlertTriangle,
  Edit2,
  Printer,
  ArrowRightLeft,
  Thermometer,
  Droplets,
  Weight,
  History,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NextLink from "next/link";
import { cn } from "@/lib/utils";
import { type Container } from "@/entities/container/schema";
import { type Item } from "@/entities/item/schema";
import { containersService } from "@/core/containers";
import { itemsService } from "@/core/items";
import { createSignedPhotoUrls } from "@/core/storage";
import { ContainerLabelPrinter } from "@/components/inventory/container-label-printer";
import { InventoryCard } from "@/components/inventory/inventory-card";
import { Spinner } from "@/components/ui/spinner";
import { TransferModal } from "@/components/inventory/transfer-modal";
import { QRCodeCanvas } from "qrcode.react";

type ContainerWithLocation = Container & { locations?: { name?: string } | null };

export default function ContainerDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [container, setContainer] = useState<ContainerWithLocation | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [cData, iData] = await Promise.all([
                    containersService.getById(id),
                    itemsService.getByContainer(id)
                ]);
                setContainer(cData);
                setItems(iData);

                const urls: Record<string, string> = {};
                const itemsConFoto = iData.filter(i => !!i.photo_path);
                const paths = itemsConFoto.map(i => i.photo_path as string);

                if (paths.length > 0) {
                    try {
                        const signedData = await createSignedPhotoUrls(paths);
                        itemsConFoto.forEach(item => {
                            const found = signedData.find((d: any) => d.path === item.photo_path);
                            if (found && !found.error && found.signedUrl) {
                                urls[item.id] = found.signedUrl;
                            }
                        });
                    } catch (e) {
                        console.error("Error signing URLs", e);
                    }
                }

                setSignedUrls(urls);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    if (loading) return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <Spinner size="lg" />
      </div>
    );
    
    if (!container) return (
      <div className="text-center py-20 text-on-surface-variant min-h-screen flex items-center justify-center font-body">
        Contenedor no encontrado.
      </div>
    );

    // Verificación de Privacidad
    const isOwner = container.owner_id === '4cef6da7-62a7-4855-80a6-27583e387a05'; // Mock dev user
    if (container.is_private && !isOwner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
                <div className="h-24 w-24 rounded-full bg-error/10 text-error flex items-center justify-center shadow-xl shadow-error/5">
                    <AlertTriangle className="h-12 w-12" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">Acceso Denegado</h2>
                    <p className="font-body text-on-surface-variant max-w-xs mx-auto">
                        Este contenedor es **privado**. Solo el propietario puede ver su contenido.
                    </p>
                </div>
                <NextLink href="/containers">
                    <button className="h-12 px-8 bg-surface-container-highest text-on-surface rounded-2xl font-body font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all">
                        Volver al Inventario
                    </button>
                </NextLink>
            </div>
        );
    }

    const maxCap = (container as any).max_capacity || 20;
    const isFull = items.length >= maxCap;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Navbar Superior */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <NextLink
                        href="/containers"
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/30 active:scale-95 transition-all shadow-sm"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </NextLink>
                    <div>
                        <div className="flex items-center gap-2 text-primary font-body text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                            Detalle del Contenedor
                        </div>
                        <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{container.label}</h2>
                        <p className="text-xs font-medium text-on-surface-variant/70 italic">Tipo: {((container as any).type || 'caja_carton').replace('_', ' ')}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Estado Óptimo
                    </span>
                    <button className="h-11 px-4 bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-2xl font-body font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all flex items-center gap-2 shadow-sm">
                        <Edit2 className="h-4 w-4" /> Editar
                    </button>
                    <ContainerLabelPrinter containerId={container.id} label={container.label} variant="primary" />
                    <button 
                      onClick={() => itemsService.exportToCSV()}
                      className="h-11 px-4 bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-2xl font-body font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all flex items-center gap-2 shadow-sm"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> CSV
                    </button>
                    <button 
                      onClick={() => setIsTransferModalOpen(true)}
                      className="h-11 px-6 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl font-body font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <ArrowRightLeft className="h-4 w-4" /> Transferir
                    </button>
                </div>
            </div>

            {/* Transfer Modal */}
            <TransferModal 
              isOpen={isTransferModalOpen}
              onClose={() => setIsTransferModalOpen(false)}
              sourceContainer={container}
              items={items}
              onTransfer={async (transferItems, destinationId) => {
                // Mock transfer for now, would connect to core/items service
                await new Promise(resolve => setTimeout(resolve, 1000));
              }}
            />

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Info Cards Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Environmental Stats */}
                    <div className="bg-surface-container-low rounded-[2.5rem] p-6 space-y-6 border border-white/50 cloud-shadow">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-primary" />
                            <h3 className="font-headline text-lg font-bold text-on-surface">Estado Ambiental</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/10 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Thermometer className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Temp. Interna</p>
                                    <p className="text-xl font-bold text-on-surface">22.4 °C</p>
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/10 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                                    <Droplets className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Humedad</p>
                                    <p className="text-xl font-bold text-on-surface">45%</p>
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/10 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                                    <Weight className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Peso Actual</p>
                                    <p className="text-xl font-bold text-on-surface">1.2 kg</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Card */}
                    <div className="bg-surface-container-lowest rounded-[2.5rem] p-6 border border-outline-variant/10 cloud-shadow flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 self-start">
                            <QrCode className="h-4 w-4 text-primary" />
                            <h3 className="font-headline text-lg font-bold text-on-surface">Acceso QR</h3>
                        </div>
                        <div className="bg-white p-4 rounded-3xl border border-outline-variant/10">
                            <QRCodeCanvas 
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/containers/${container.id}`}
                                size={140}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                    src: "/favicon.ico",
                                    x: undefined,
                                    y: undefined,
                                    height: 24,
                                    width: 24,
                                    excavate: true,
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-on-surface-variant/60 font-medium text-center max-w-[180px]">
                            Escanea esta etiqueta para acceder directamente al inventario de esta caja.
                        </p>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-surface-container-lowest rounded-[2.5rem] p-6 border border-outline-variant/10 cloud-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <h3 className="font-headline text-lg font-bold text-on-surface">Registro de Actividad</h3>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { action: "Objeto añadido", time: "hace 2 horas", user: "Mario E.", icon: Plus, color: "bg-green-100 text-green-600" },
                                { action: "QR Escaneado", time: "hace 5 horas", user: "App Móvil", icon: CheckCircle2, color: "bg-blue-100 text-blue-600" },
                                { action: "Ubicación cambiada", time: "hace 1 día", user: "Sistema", icon: MapPin, color: "bg-tertiary/10 text-tertiary" },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    {i < 2 && <div className="absolute left-[15px] top-8 w-px h-10 bg-outline-variant/20"></div>}
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", log.color)}>
                                        <log.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-on-surface">{log.action}</p>
                                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant/60 mt-1">
                                            <Clock className="h-3 w-3" /> {log.time} • Por {log.user}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Items Grid Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                                <PackageIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-headline text-xl font-bold text-on-surface">Inventario Interno</h3>
                                <p className="font-body text-xs text-on-surface-variant font-medium">{items.length} de {maxCap} espacios utilizados</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-2xl border border-outline-variant/10">
                            <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/5">
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button className="h-9 w-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                                <ListIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Alerta de Capacidad */}
                    {isFull && (
                        <div className="bg-error-container/30 border border-error/20 rounded-3xl p-6 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                            <div className="h-12 w-12 rounded-2xl bg-error/10 text-error flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-error uppercase tracking-widest leading-none mb-1">Capacidad Máxima</h4>
                                <p className="text-xs text-error/70 font-medium">Este contenedor ha alcanzado su límite de {maxCap} unidades.</p>
                            </div>
                        </div>
                    )}

                    {/* Items Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <NextLink href={`/items/new?container=${container.id}`} className="group h-full">
                            <div className="h-full bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-surface-container hover:border-primary/50 transition-all active:scale-95 group-hover:shadow-lg group-hover:shadow-primary/5">
                                <div className="h-14 w-14 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Plus className="h-7 w-7" />
                                </div>
                                <span className="font-body font-bold text-on-surface-variant text-[10px] uppercase tracking-widest group-hover:text-primary transition-colors">Agregar Item</span>
                            </div>
                        </NextLink>

                        <AnimatePresence mode="popLayout">
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                                >
                                    <InventoryCard
                                        item={item}
                                        signedUrl={signedUrls[item.id]}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {items.length === 0 && (
                        <div className="py-20 text-center bg-surface-container-low/30 rounded-[3rem] border-2 border-dashed border-outline-variant/20">
                            <PackageIcon className="h-16 w-16 text-on-surface-variant/20 mx-auto mb-4" />
                            <p className="font-headline text-lg font-bold text-on-surface">Caja sin contenido</p>
                            <p className="font-body text-sm text-on-surface-variant mt-1">Este contenedor está esperando su primer objeto.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
