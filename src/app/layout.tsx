import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap"
});

// Self-hosted Material Symbols (Rounded) variable font — no network/CDN dependency.
const materialSymbols = localFont({
  src: "./fonts/material-symbols-rounded.woff2",
  variable: "--font-material-symbols",
  display: "block",
  weight: "100 700"
});

export const metadata: Metadata = {
  title: {
    default: "BMPC Portal",
    template: "%s | BMPC Portal"
  },
  description: "Member and admin portal for Barbaza Multi-Purpose Cooperative.",
  applicationName: "BMPC Portal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BMPC Portal"
  }
};

export const viewport: Viewport = {
  themeColor: "#3673FC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${materialSymbols.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
