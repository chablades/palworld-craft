import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
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
  description:
    "Calculate raw materials and crafting steps for Palworld recipes. Search items, explore crafting trees, and build batch shopping lists.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="palworld" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} font-sans`}>
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
