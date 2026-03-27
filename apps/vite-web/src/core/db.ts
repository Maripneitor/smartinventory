import Dexie, { type Table } from "dexie";
import { type Item } from "@/entities/item/schema";
import { type Container } from "@/entities/container/schema";

export interface SyncAction {
    id?: number;
    action: "create" | "update" | "delete";
    type: "item" | "container";
    data: any;
    timestamp: number;
}

export interface OfflineImage {
    id: string; // usually the itemId
    blob: Blob;
    mime: string;
}

export class SmartInventoryDB extends Dexie {
    containers!: Table<Container>;
    items!: Table<Item>;
    locations!: Table<any>; // Using any for simplicity here or import Location
    sync_queue!: Table<SyncAction>;
    images!: Table<OfflineImage>;

    constructor() {
        super("SmartInventoryDB");
        this.version(1).stores({
            containers: "id, user_id, location_id",
            items: "id, user_id, container_id, category, item_type",
            locations: "id, user_id, parent_id",
            sync_queue: "++id, action, type, timestamp",
            images: "id"
        });
    }
}


export const db = new SmartInventoryDB();
