import { db } from "./db";
import { containersService } from "./containers";
import { itemsService } from "./items";
import { uploadItemPhoto } from "@/core/storage";


export async function processSyncQueue(toast?: any) {
    const queue = await db.sync_queue.toArray();
    if (queue.length === 0) return;

    if (toast) toast(`Sincronizando ${queue.length} cambios pendientes...`, "loading");

    for (const action of queue) {
        try {
            if (action.type === "container") {
                await containersService.create(action.data);
            } else if (action.type === "item") {
                const itemData = action.data;

                // 1) Check if there's an offline image to upload
                const offlineImg = await db.images.get(itemData.id);
                let photoPath = itemData.photo_path;

                if (offlineImg && !photoPath) {
                    const { photo_path } = await uploadItemPhoto({
                        file: new File([offlineImg.blob], `offline_${itemData.id}`, { type: offlineImg.mime }),
                        userId: itemData.user_id,
                        itemId: itemData.id
                    });
                    photoPath = photo_path;
                    itemData.photo_path = photoPath;
                }

                await itemsService.create(itemData);

                // Cleanup image if successful
                if (offlineImg) await db.images.delete(itemData.id);
            }

            // Remove from queue if successful
            await db.sync_queue.delete(action.id!);
        } catch (e) {
            console.error("Failed to sync item", action, e);
            // Keep in queue for next try
        }
    }

    if (toast) toast("Inventario sincronizado con éxito", "success");
}
