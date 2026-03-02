"use client";

import { useOfflineSync } from "@/hooks/use-offline-sync";

export function OfflineHandler() {
    // This hook will handle the sync logic automatically
    useOfflineSync();

    return null; // Non-visual component
}
