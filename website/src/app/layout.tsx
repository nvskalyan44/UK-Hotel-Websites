import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/admin.css";

export const metadata: Metadata = {
  title: {
    default: "Abhiruchi — Authentic South Indian Restaurant, Sheffield",
    template: "%s | Abhiruchi Sheffield",
  },
  description: "Authentic Hyderabadi and Andhra cuisine served on Ecclesall Road, Sheffield. Order delivery or collection online. Est. 2000.",
  keywords: ["South Indian restaurant Sheffield", "Indian food Sheffield", "Hyderabadi cuisine", "Andhra food", "biryani Sheffield", "dosa Sheffield", "curry Sheffield delivery"],
  openGraph: {
    siteName: "Abhiruchi",
    title: "Abhiruchi — Authentic South Indian Restaurant, Sheffield",
    description: "Authentic Hyderabadi and Andhra cuisine on Ecclesall Road, Sheffield. Order online for delivery or collection.",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abhiruchi — Authentic South Indian, Sheffield",
    description: "Authentic Hyderabadi and Andhra cuisine on Ecclesall Road, Sheffield. Order online.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,500;1,9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
