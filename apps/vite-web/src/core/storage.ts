import { createClient } from "@/lib/supabase/browser";

export const STORAGE_BUCKET = "item-photos";

/**
 * Comprime una imagen usando Canvas antes de subirla.
 */
async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Canvas toBlob failed"));
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

/**
 * Sube foto a Storage en ruta: <userId>/<itemId>/<timestamp>.<ext>
 * Retorna photo_path para guardar en la tabla items.
 */
export async function uploadItemPhoto(params: {
    file: File;
    userId: string;
    itemId: string;
    compress?: boolean;
}): Promise<{ photo_path: string }> {
    const { file, userId, itemId, compress = true } = params;

    let uploadData: File | Blob = file;
    if (compress && file.type.startsWith("image/")) {
        try {
            uploadData = await compressImage(file);
        } catch (e) {
            console.error("Compression failed, uploading original", e);
        }
    }

    const photo_path = `${userId}/${itemId}/${Date.now()}.jpg`;
    const supabase = createClient();

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(photo_path, uploadData, {
            contentType: "image/jpeg",
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

/** Obtiene múltiples URLs firmadas en una sola petición a la DB para evitar N+1 requests */
export async function createSignedPhotoUrls(paths: string[], expiresIn = 1800) {
    if (!paths.length) return [];

    const supabase = createClient();
    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrls(paths, expiresIn);

    if (error) throw error;
    return data; // Array de { error, path, signedUrl }
}
