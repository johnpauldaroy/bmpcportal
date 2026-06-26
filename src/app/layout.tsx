import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

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
  themeColor: "#136f63",
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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
