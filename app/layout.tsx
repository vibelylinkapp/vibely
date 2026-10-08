import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./landing-hero-plus.css";
import "./marketing.css";
import "./home-plus.css";
import "./nearby-plus.css";
import "./discover-plus.css";
import "./mobile-fixes.css";

/**
 * Fonts are self-hosted from app/fonts rather than fetched from Google.
 *
 * Two reasons:
 * 1. The Content-Security-Policy in next.config.mjs sets `font-src 'self'
 *    data:`, so fonts must be served same-origin (a CSS @import from
 *    fonts.googleapis.com was silently blocked in production).
 * 2. next/font/google downloads the fonts from Google during every build.
 *    When that request fails or Google returns an unexpected response, the
 *    whole build dies with "An error occurred in `next/font`. TypeError:
 *    Cannot read properties of null (reading '1')" - which happened on
 *    commit c10d7fe. Local files remove the network from the build.
 *
 * The files are the variable "wght" latin subsets from @fontsource-variable
 * (Plus Jakarta Sans 200-800, Sora 100-800, Fraunces 100-900), so every
 * weight the CSS uses is still available.
 */
const sans = localFont({
  src: "./fonts/plus-jakarta-sans-latin-wght-normal.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
});

const display = localFont({
  src: "./fonts/sora-latin-wght-normal.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

const serif = localFont({
  src: "./fonts/fraunces-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
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
