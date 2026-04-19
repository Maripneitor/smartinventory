"use client";

import { useState, useEffect } from "react";
import { createSignedPhotoUrl } from "@/core/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartImageProps {
    path: string | null;
    alt: string;
    className?: string;
    fallbackClassName?: string;
}

// Simple in-memory cache for signed URLs
const urlCache: Record<string, { url: string; expiry: number }> = {};

export function SmartImage({ path, alt, className, fallbackClassName }: SmartImageProps) {
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(!!path);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!path) {
            setLoading(false);
            return;
        }

        const now = Date.now();
        const cached = urlCache[path];

        if (cached && cached.expiry > now) {
            setSrc(cached.url);
            setLoading(false);
            return;
        }

        async function fetchUrl() {
            setLoading(true);
            try {
                const url = await createSignedPhotoUrl(path, 3600); // 1 hour
                urlCache[path] = {
                    url,
                    expiry: Date.now() + 3500 * 1000 // Cache for slightly less than 1 hour
                };
                setSrc(url);
                setError(false);
            } catch (err) {
                console.error("Failed to generate signed URL", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchUrl();
    }, [path]);

    if (!path || error) {
        return (
            <div className={cn("flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-400", fallbackClassName || className)}>
                <ImageOff className="h-6 w-6 opacity-20" />
            </div>
        );
    }

    if (loading) {
        return <Skeleton className={cn("w-full h-full", className)} />;
    }

    return (
        <img
            src={src || ""}
            alt={alt}
            className={cn("object-cover", className)}
            onError={() => setError(true)}
        />
    );
}
