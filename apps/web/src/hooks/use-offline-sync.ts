import { useEffect, useState } from "react";
import { toast } from "sonner";
import { processSyncQueue } from "@/core/sync";

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleOnline = () => {
            setIsOnline(true);
            processSyncQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.info("Operando sin conexión. Los cambios se guardarán localmente.");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial check
        setIsOnline(navigator.onLine);
        if (navigator.onLine) {
            processSyncQueue();
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [toast]);

    return { isOnline };
}
