import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summer Stash",
  description: "Controla tu dinero del verano en Estados Unidos.",
  icons: {
    icon: "/summer-stash-logo.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
