import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GAME_VERSION_LABEL } from "@/lib/meta";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Palcraft | Palworld Recipe Calculator",
  description: `Calculate raw materials and crafting steps for Palworld recipes (${GAME_VERSION_LABEL}). Search items, explore crafting trees, and build batch shopping lists.`,
  applicationName: "Palcraft",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Palcraft",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b6ea8" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a5f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="palworld" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} flex min-h-screen flex-col font-sans`}>
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
            {children}
          </main>
          <SiteFooter />
          <ServiceWorkerRegister />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
