import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./landing-hero-plus.css";
import "./home-plus.css";

export const metadata: Metadata = {
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
  },
};

export const viewport: Viewport = {
  themeColor: "#7A2FF2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
