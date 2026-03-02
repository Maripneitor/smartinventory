"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadItemPhoto } from "@/core/storage";
import { itemsService, type ItemType, type ItemCondition } from "@/core/items";
import { analyzeItemWithAI, generateEmbeddings } from "@/core/ai";
import { createClient, getDevUser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DevicePicker } from "./device-picker";
import { Camera, Save, Loader2, Sparkles, X, Info, AlertCircle, CheckCircle2 } from "lucide-react";
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
            // Análisis proactivo
            setTimeout(() => onAISuggest(f), 500);
        }
    };

    const toggleRetouch = () => setIsRetouched(!isRetouched);

    const [aiStatus, setAiStatus] = useState<string>("");

    async function onAISuggest(targetFile?: File) {
        const fileToProcess = targetFile || file;
        if (!fileToProcess) return setErrorMsg("Sube una foto primero para que la IA pueda verla.");

        setAiLoading(true);
        const toastId = toast("Analizando fotografía...", "loading");

        try {
            const user = await getDevUser();
            if (!user) throw new Error('No autenticado');

            // 1) Asegurar upload
            let path = photoPath;
            if (!path) {
                const { photo_path } = await uploadItemPhoto({ file: fileToProcess, userId: user.id, itemId });
                path = photo_path;
                setPhotoPath(path);
            }

            // 2) Invocar IA
            const ai = await analyzeItemWithAI({ photo_path: path!, mime_type: fileToProcess.type });

            // 3) Aplicar resultados
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

        if (!containerId) return setErrorMsg("Falta el ID del contenedor.");
        if (!name.trim()) return setErrorMsg("Nombre obligatorio.");
        if (!file) return setErrorMsg("Foto obligatoria.");
        // Removida validación obligatoria de belongsTo para accesorios

        setLoading(true);
        const toastId = toast("Guardando objeto...", "loading");
        try {
            const user = await getDevUser();
            if (!user) throw new Error('No autenticado');

            // 1) Upload foto si no se hizo en el paso de IA
            let path = photoPath;
            if (!path) {
                const { photo_path } = await uploadItemPhoto({ file: file!, userId: user.id, itemId });
                path = photo_path;
            }

            // 2) Insert item
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
                file: file || undefined // for offline caching
            });


            // 3) Generar Embeddings
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
        <form onSubmit={onSubmit} className="flex flex-col gap-8 pb-32">
            {/* Paso 1: Foto */}
            <section className="flex flex-col gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Paso 1: Foto del Objeto</label>

                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />

                {/* Preview o Selector de Foto */}
                <div className="group relative aspect-video w-full overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 shadow-inner">
                    {file ? (
                        <div className="relative h-full w-full">
                            <img
                                src={URL.createObjectURL(file)}
                                className={cn(
                                    "h-full w-full object-cover transition-all duration-700",
                                    aiLoading && "opacity-40 blur-sm",
                                    isRetouched && "brightness-110 contrast-125 saturate-150 shadow-[0_0_40px_rgba(59,130,246,0.3)]"
                                )}
                                alt="Preview"
                            />
                            <div className="absolute left-4 bottom-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={toggleRetouch}
                                    className={cn(
                                        "flex h-10 px-4 items-center gap-2 rounded-xl text-xs font-bold uppercase backdrop-blur-md transition-all active:scale-95",
                                        isRetouched ? "bg-blue-600 text-white" : "bg-black/60 text-zinc-400"
                                    )}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Retoque IA
                                </button>
                            </div>
                            {aiLoading && (
                                <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 flex items-center justify-center p-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                    <p className="text-sm font-bold text-white animate-pulse uppercase tracking-widest">{aiStatus}</p>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setFile(null)}
                                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform active:scale-90"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-full w-full flex-col items-center justify-center gap-4 text-zinc-600 transition-all hover:bg-zinc-800/50 active:scale-[0.98]"
                        >
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-950 shadow-xl border border-white/5 transition-transform group-hover:scale-110">
                                <Camera className="h-10 w-10" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-zinc-400">Paso 1: Foto del Objeto</p>
                                <p className="text-sm text-zinc-600">Pulsa para capturar o subir</p>
                            </div>
                        </button>
                    )}
                </div>

                {file && !name && (
                    <div className="flex flex-col gap-4">
                        <Button
                            type="button"
                            disabled={aiLoading}
                            onClick={() => onAISuggest()}
                            className="h-16 w-full gap-3 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-lg font-bold shadow-xl shadow-blue-500/20"
                        >
                            {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="h-6 w-6 fill-white" />}
                            {aiLoading ? "Procesando..." : "Autocompletar con IA"}
                        </Button>
                    </div>
                )}
                {successMsg && (
                    <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold px-4">
                        <CheckCircle2 className="h-3 w-3" /> {successMsg}
                    </div>
                )}
                {suggestion && suggestion.containerId !== targetContainerId && (
                    <div className="mx-2 mt-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 transition-all animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Sugerencia Inteligente</p>
                                <p className="text-sm text-zinc-300 mt-1">
                                    Objetos similares están en la <span className="text-white font-bold">{suggestion.label}</span>.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setTargetContainerId(suggestion.containerId)}
                                    className="mt-3 text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-lg active:scale-95 transition-all shadow-md"
                                >
                                    Mover a esa caja
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Formulario */}
            <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-zinc-500">Nombre</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Cable HDMI 2.1" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase text-zinc-500">Categoría</label>
                        <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Electrónica..." />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase text-zinc-500">Estado</label>
                        <select
                            value={condition}
                            onChange={e => setCondition(e.target.value as ItemCondition)}
                            className="h-12 w-full rounded-xl border border-white/5 bg-zinc-900 px-4 text-white focus:border-blue-500 focus:outline-none appearance-none"
                        >
                            <option value="used">Usado</option>
                            <option value="new">Nuevo</option>
                            <option value="defective">Defectuoso</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-zinc-500">Tipo de Objeto</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['accessory', 'device', 'other'] as ItemType[]).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setItemType(t)}
                                className={cn(
                                    "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                    itemType === t ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-600 border border-white/5"
                                )}
                            >
                                {t === 'accessory' ? 'Accesorio' : t === 'device' ? 'Equipo' : 'Otro'}
                            </button>
                        ))}
                    </div>
                </div>

                {itemType === 'accessory' && (
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase text-zinc-500">¿A qué dispositivo pertenece? (Opcional)</label>
                        <DevicePicker value={belongsTo} onChange={setBelongsTo} hint={aiHint} />
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-zinc-500">Descripción</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Detalles adicionales..."
                        className="w-full rounded-xl border border-white/5 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none resize-none"
                    />
                </div>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-lg text-[10px] text-zinc-400 font-bold uppercase">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {errorMsg && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20">
                        <AlertCircle className="h-4 w-4" />
                        {errorMsg}
                    </div>
                )}
            </section>

            {/* Footer Fijo */}
            <footer className="fixed bottom-0 left-0 right-0 z-60 border-t border-white/10 bg-black/90 p-4 backdrop-blur-xl lg:static lg:bg-transparent lg:p-0">
                <div className="max-w-xl mx-auto flex gap-4">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 py-4"
                        onClick={() => router.back()}
                    >
                        Descartar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-2 py-4 text-lg">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                Guardar Item
                            </>
                        )}
                    </Button>
                </div>
            </footer>
        </form>
    );
}
