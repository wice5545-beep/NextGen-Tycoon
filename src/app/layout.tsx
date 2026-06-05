import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "NextGen Tycoon",
  description: "AAA gaming-industry tycoon — 1970 → 2100. Web · PWA · Android.",
  manifest: "/manifest.webmanifest",
  applicationName: "NextGen Tycoon",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "NextGen Tycoon" },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
