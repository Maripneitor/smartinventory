import * as React from "react";

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: string;
    storageKey?: string;
}

export function ThemeProvider({
    children,
    defaultTheme = "dark",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    React.useEffect(() => {
        const root = document.documentElement;
        const stored = localStorage.getItem(storageKey) || defaultTheme;
        root.classList.remove("light", "dark");
        root.classList.add(stored);
        root.style.colorScheme = stored;
    }, [defaultTheme, storageKey]);

    return <>{children}</>;
}
