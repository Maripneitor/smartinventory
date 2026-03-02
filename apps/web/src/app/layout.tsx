import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/shared/sidebar";
import { BottomNav } from "@/components/shared/bottom-nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "SmartInventory | Gestión Inteligente",
  description: "Organiza tus pertenencias con IA y QR. Búsqueda semántica para encontrarlo todo al instante.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SmartInventory",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ToastProvider } from "@/providers/toast-provider";
import { OfflineHandler } from "@/components/shared/offline-handler";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-black font-sans antialiased selection:bg-blue-500/30",
          inter.variable,
          outfit.variable
        )}
      >
        <ToastProvider>
          <OfflineHandler />
          <Sidebar />
          <main className="relative flex min-h-screen flex-col lg:pl-72 pb-24 lg:pb-0">
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
              {children}
            </div>
          </main>
          <BottomNav />
        </ToastProvider>



        {/* SW Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered: ', registration);
                  }, function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
