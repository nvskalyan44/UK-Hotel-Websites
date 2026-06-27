import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0e17",
  viewportFit: "cover", // safe-area insets for notch / home indicator
};

export const metadata: Metadata = {
  title: "Abhiruchi Admin",
  description: "Restaurant admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '"Inter", system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
