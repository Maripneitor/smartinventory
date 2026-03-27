"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadItemPhoto } from "@/core/storage";
import { itemsService, type ItemType, type ItemCondition } from "@/core/items";
import { analyzeItemWithAI, generateEmbeddings } from "@/core/ai";
import { getDevUser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DevicePicker } from "./device-picker";
import { Camera, Save, Sparkles, X, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";

export function ItemForm() {
    const { toast, dismiss } = useToast();
    const router = useRouter();

    const sp = useSearchParams();
    const containerId = sp.get("container") || "";
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [quantity] = useState(1);
    const [condition, setCondition] = useState<ItemCondition>("used");
    const [itemType, setItemType] = useState<ItemType>("accessory");
    const [belongsTo, setBelongsTo] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);

    // AI specific state
    const [aiHint, setAiHint] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResultCache, setAiResultCache] = useState<Record<string, any> | null>(null);
    const [photoPath, setPhotoPath] = useState<string | null>(null);
    const [suggestion, setSuggestion] = useState<{ containerId: string, label: string } | null>(null);
    const [targetContainerId, setTargetContainerId] = useState(containerId);

    // App State
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [itemId, setItemId] = useState<string>("");

    useEffect(() => {
        setItemId(crypto.randomUUID());
    }, []);

    const [isRetouched, setIsRetouched] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            setPhotoPath(null);
            setTimeout(() => onAISuggest(f), 500);
        }
    };

    const toggleRetouch = () => setIsRetouched(!isRetouched);

    async function onAISuggest(targetFile?: File) {
        const fileToProcess = targetFile || file;
        if (!fileToProcess) return setErrorMsg("Sube una foto primero para que la IA pueda verla.");

        setAiLoading(true);
        const toastId = toast("Analizando fotografía...", "loading");

        try {
            const user = await getDevUser();
            if (!user) throw new Error('No autenticado');

            let path = photoPath;
            if (!path) {
                const { photo_path } = await uploadItemPhoto({ file: fileToProcess, userId: user.id, itemId });
                path = photo_path;
                setPhotoPath(path);
            }

            const ai = await analyzeItemWithAI({ photo_path: path!, mime_type: fileToProcess.type });

            setName(ai.nombre_corto || "");
            setCategory(ai.categoria || "");
            setDescription(ai.descripcion || "");
            setTags(Array.isArray(ai.tags) ? ai.tags : []);
            setAiHint(ai.posible_dispositivo);
            setAiResultCache(ai);

            if (ai.categoria) {
                const sugg = await itemsService.getSuggestionByCategory(ai.categoria);
                if (sugg) {
                    setSuggestion({
                        containerId: sugg.container_id,
                        label: sugg.containers?.label || 'Caja existente'
                    });
                }
            }

            toast("¡Identificación completada!", "success");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Falló el análisis de IA.";
            console.error(e);
            toast(message, "error");
        } finally {
            dismiss(toastId);
            setAiLoading(false);
        }
    }


    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);

        if (!targetContainerId) return setErrorMsg("Falta el ID del contenedor.");
        if (!name.trim()) return setErrorMsg("Nombre obligatorio.");
        if (!file) return setErrorMsg("Foto obligatoria.");

        setLoading(true);
        const toastId = toast("Guardando objeto...", "loading");
        try {
            const user = await getDevUser();
            if (!user) throw new Error('No autenticado');

            let path = photoPath;
            if (!path) {
                const { photo_path } = await uploadItemPhoto({ file: file!, userId: user.id, itemId });
                path = photo_path;
            }

            await itemsService.create({
                id: itemId,
                container_id: targetContainerId,
                name: name.trim(),
                category: category.trim() || null,
                description: description.trim() || null,
                quantity,
                condition,
                item_type: itemType,
                belongs_to_item_id: itemType === "accessory" ? belongsTo : null,
                photo_path: path,
                photo_mime: file?.type,
                tags,
                ai_metadata: aiResultCache || {},
                file: file || undefined
            });


            try {
                const textToEmbed = `${name} ${category} ${description} ${tags.join(' ')}`;
                await generateEmbeddings({ item_id: itemId, text: textToEmbed });
            } catch (e) { }

            toast("Objeto guardado con éxito", "success");
            router.push(`/containers/${targetContainerId}`);
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error guardando item.";
            toast(message, "error");
        } finally {
            dismiss(toastId);
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-10">
            {/* Foto Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Evidencia Visual</h2>
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-white/5">PASO 1</span>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />

                <div className="relative aspect-video w-full overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-white/5 shadow-2xl group transition-all">
                    {file ? (
                        <div className="relative h-full w-full">
                            <img
                                src={URL.createObjectURL(file)}
                                className={cn(
                                    "h-full w-full object-cover transition-all duration-1000",
                                    aiLoading && "opacity-40 blur-xl",
                                    isRetouched && "brightness-110 contrast-125 saturate-150"
                                )}
                                alt="Preview"
                            />

                            {/* Overlay Blur during AI process */}
                            {aiLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-1000">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-blue-600/20 border border-blue-500/30 animate-pulse mb-4">
                                        <Spinner size="lg" className="text-blue-500" />
                                    </div>
                                    <p className="text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">Analizando Pixeles</p>
                                </div>
                            )}

                            <div className="absolute left-6 bottom-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={toggleRetouch}
                                    className={cn(
                                        "flex h-12 px-6 items-center gap-3 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-xl border transition-all active:scale-95",
                                        isRetouched
                                            ? "bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/40"
                                            : "bg-black/60 border-white/10 text-zinc-400 hover:bg-black/80"
                                    )}
                                >
                                    <Sparkles className={cn("h-4 w-4", isRetouched && "animate-pulse")} />
                                    {isRetouched ? "Filtro On" : "Retoque IA"}
                                </button>
                            </div>

                            {!aiLoading && (
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/60 border border-white/10 text-white backdrop-blur-xl transition-all hover:bg-red-500/80 active:scale-90"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-full w-full flex-col items-center justify-center gap-6 text-zinc-600 transition-all hover:bg-zinc-900/50 active:scale-[0.99]"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-zinc-900 border border-white/10 shadow-2xl transition-transform group-hover:scale-110 group-hover:border-blue-500/50">
                                    <Camera className="h-10 w-10 text-zinc-700 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-zinc-400 tracking-tight">Capturar Fotografía</p>
                                <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">Sube una imagen para autocompletar</p>
                            </div>
                        </button>
                    )}
                </div>

                {file && !name && !aiLoading && (
                    <Button
                        type="button"
                        onClick={() => onAISuggest()}
                        className="h-16 w-full gap-4 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-600 text-lg font-black tracking-tight shadow-2xl shadow-blue-500/40 animate-in fade-in slide-in-from-bottom-4"
                    >
                        <Sparkles className="h-6 w-6 fill-white" />
                        Autocompletar con IA
                    </Button>
                )}

                {suggestion && suggestion.containerId !== targetContainerId && (
                    <Card variant="glass" className="border-blue-500/30 bg-blue-500/5 p-6 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                                <Info className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Detección de Patrones</p>
                                <p className="text-sm text-zinc-300 font-medium">
                                    Objetos similares están en <span className="text-white font-black">{suggestion.label}</span>.
                                </p>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setTargetContainerId(suggestion.containerId)}
                                    className="mt-4 h-10 px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl"
                                >
                                    Trasladar a esa caja
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Form Section */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Atributos Digitales</h2>
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-white/5">PASO 2</span>
                </div>

                <Card variant="secondary" className="flex flex-col gap-8 p-10 rounded-[3rem]">
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Denominación del Objeto</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Cable HDMI 2.1 Ultra High Speed"
                            className="h-14 rounded-2xl bg-zinc-950 font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Clasificación / Categoría</label>
                            <Input
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Ej. Electrónica, Herrajes..."
                                className="h-14 rounded-2xl bg-zinc-950 font-bold"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Estado de Conservación</label>
                            <div className="relative">
                                <select
                                    value={condition}
                                    onChange={e => setCondition(e.target.value as ItemCondition)}
                                    className="h-14 w-full rounded-2xl border border-white/5 bg-zinc-950 px-5 text-white font-bold focus:border-blue-500 focus:outline-none appearance-none transition-all"
                                >
                                    <option value="used" className="bg-zinc-900">Usado (Bueno)</option>
                                    <option value="new" className="bg-zinc-900">Nuevo / Sellado</option>
                                    <option value="defective" className="bg-zinc-900">Defectuoso / Dañado</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                    <ChevronLeft className="h-4 w-4 rotate-[270deg]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Tipología</label>
                        <div className="grid grid-cols-3 gap-3 p-1.5 bg-zinc-950 rounded-2xl border border-white/5">
                            {(['accessory', 'device', 'other'] as ItemType[]).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setItemType(t)}
                                    className={cn(
                                        "py-3 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all",
                                        itemType === t
                                            ? "bg-zinc-800 text-white shadow-xl border border-white/10"
                                            : "text-zinc-600 hover:text-zinc-400"
                                    )}
                                >
                                    {t === 'accessory' ? 'Accesorio' : t === 'device' ? 'Equipo' : 'Otro'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {itemType === 'accessory' && (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Asociación (Parentesco)</label>
                            <DevicePicker value={belongsTo} onChange={setBelongsTo} hint={aiHint} />
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Descripción / Notas Técnicas</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Detalles sobre el objeto, marca, modelo, o cualquier nota relevante..."
                            className="w-full rounded-2xl border border-white/5 bg-zinc-950 px-6 py-4 text-white font-medium placeholder:text-zinc-800 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                        />
                    </div>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 mt-2">
                            {tags.map(tag => (
                                <span key={tag} className="px-4 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[10px] text-blue-400 font-black uppercase tracking-widest">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {errorMsg && (
                        <div className="flex items-center gap-4 rounded-2xl bg-red-500/10 p-5 text-xs font-bold text-red-500 border border-red-500/20 animate-in shake duration-500">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            {errorMsg}
                        </div>
                    )}
                </Card>
            </div>

            {/* Footer Fijo Premium */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-6 md:px-10 pb-10 pointer-events-none">
                <div className="max-w-xl mx-auto flex gap-4 pointer-events-auto">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 h-16 rounded-[1.5rem] bg-zinc-950/80 backdrop-blur-2xl border border-white/5 font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all shadow-2xl"
                        onClick={() => router.back()}
                    >
                        Descartar
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex-2 h-16 rounded-[1.5rem] text-lg font-black tracking-tight shadow-2xl shadow-blue-600/30"
                    >
                        {loading ? <Spinner size="sm" /> : (
                            <>
                                <Save className="h-5 w-5 mr-3" />
                                Indexar Objeto
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Background Blur Decor */}
            <div className="fixed bottom-0 left-0 right-0 h-40 bg-linear-to-t from-black to-transparent z-40 pointer-events-none" />
        </form>
    );
}

// Chevron component for the select
function ChevronLeft({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m15 18-6-6 6-6" />
        </svg>
    );
}
