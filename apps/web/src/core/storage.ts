import { createClient } from "@/lib/supabase/browser";

export const STORAGE_BUCKET = "item-photos";

/**
 * Sube foto a Storage en ruta: <userId>/<itemId>/<timestamp>.<ext>
 * Retorna photo_path para guardar en la tabla items.
 */
export async function uploadItemPhoto(params: {
    file: File;
    userId: string;
    itemId: string;
}): Promise<{ photo_path: string }> {
    const { file, userId, itemId } = params;

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ext.length <= 5 ? ext : "jpg";
    const photo_path = `${userId}/${itemId}/${Date.now()}.${safeExt}`;

    const supabase = createClient();

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(photo_path, file, {
            contentType: file.type || "image/jpeg",
            upsert: false,
        });

    if (error) throw error;
    return { photo_path };
}

/** Para mostrar imágenes en UI (bucket privado) */
export async function createSignedPhotoUrl(photo_path: string, expiresIn = 1800) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(photo_path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
}
