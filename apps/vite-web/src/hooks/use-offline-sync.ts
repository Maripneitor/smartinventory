import { useEffect, useState } from "react";
import { useToast } from "@/providers/toast-provider";
import { processSyncQueue } from "@/core/sync";

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleOnline = () => {
            setIsOnline(true);
            processSyncQueue(toast);
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast("Operando sin conexión. Los cambios se guardarán localmente.", "warning");
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
