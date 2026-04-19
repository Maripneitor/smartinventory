import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/shared/sidebar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { Header } from "@/components/shared/header";

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

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { OfflineSync } from "@/components/offline-sync";

import { LoanCart } from "@/components/inventory/LoanCart";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans antialiased selection:bg-blue-500/30",
          inter.variable,
          outfit.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-right" expand={false} richColors />
          <OfflineSync />
          <Sidebar />
          <main className="relative flex min-h-screen flex-col lg:pl-72 pb-24 lg:pb-0">
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
              <Header />
              {children}
            </div>
            <LoanCart />
          </main>
          <BottomNav />
        </ThemeProvider>



        {/* SW Management: Unregister on localhost to avoid HMR interference, register on production */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost') {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                  });
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
