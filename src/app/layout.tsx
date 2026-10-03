import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HackPerimeter | Escape from Earth",
  description:
    "The first-ever Perimeter College hackathon. Friday, November 13, 2026 at Jim Cherry Auditorium in Clarkston, GA. Teams of 2–4, $1,000 cash-prize pool. Winners are survivors.",
  openGraph: {
    title: "HackPerimeter | Escape from Earth",
    description: "Winners are survivors. Twelve hours. One escape.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#121315",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: browser extensions add attributes to <html> before
    // React loads. It only covers this element's own attributes, not its children.
    <html
      lang="en"
      className={`${archivo.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Scroll-reveals need JS to ever set data-visible; without it, show everything. */}
        <noscript>
          <style>{`.reveal, .reveal-group > * { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
