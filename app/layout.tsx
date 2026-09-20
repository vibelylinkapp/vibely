import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora, Fraunces } from "next/font/google";
import "./globals.css";
import "./landing.css";
import "./marketing.css";
import "./home-plus.css";
import "./nearby-plus.css";
import "./discover-plus.css";

/**
 * Fonts are self-hosted by next/font rather than pulled from Google.
 *
 * This is not a preference. The Content-Security-Policy in next.config.mjs
 * sets `style-src 'self' 'unsafe-inline'` and `font-src 'self' data:`, so the
 * `@import url(https://fonts.googleapis.com/...)` that used to sit at the top
 * of globals.css was blocked in production — the stylesheet never loaded and
 * every custom face silently fell back to a system font. next/font downloads
 * the files at build time and serves them same-origin, which satisfies the
 * policy, removes a render-blocking round trip, and preloads without FOUT.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const display = Sora({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

const serif = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  axes: ["SOFT", "WONK"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vibely-inky.vercel.app"),
  title: "Vibely — Meet real people near you",
  description:
    "The easiest way to meet real people near you. Dating, friends, hangouts, and networking across Kenya and East Africa.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/favicon-32.png",
    apple: "/icons/apple-touch-icon-180.png",
  },
  openGraph: {
    title: "Vibely — Meet real people near you",
    description:
      "Dating, friends, hangouts, and networking. Find your people across Kenya and East Africa.",
    type: "website",
    locale: "en_KE",
    siteName: "Vibely",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibely — Meet real people near you",
    description:
      "Dating, friends, hangouts, and networking across Kenya and East Africa.",
  },
};

export const viewport: Viewport = {
  themeColor: "#140B26",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${serif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
