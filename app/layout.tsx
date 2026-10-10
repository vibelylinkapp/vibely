import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/env";
import { SITE } from "@/lib/site";
import { SEO_DESCRIPTION, SEO_KEYWORDS, SEO_TITLE, siteJsonLd } from "@/lib/seo";
import "./globals.css";
import "./landing-hero-plus.css";
import "./marketing.css";
import "./home-plus.css";
import "./nearby-plus.css";
import "./discover-plus.css";
import "./events-plus.css";
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
  metadataBase: new URL(SITE_URL),
  title: { default: SEO_TITLE, template: "%s | Vibely Kenya" },
  description: SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "social networking",
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/apple-touch-icon-180.png",
  },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    locale: "en_KE",
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
  other: { "geo.region": "KE", "geo.placename": "Nairobi" },
  formatDetection: { telephone: false },
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
      lang="en-KE"
      className={`${sans.variable} ${display.variable} ${serif.variable}`}
    >
      <body>
        <JsonLd data={siteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
