import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🎉 Trivia de Fiesta | ¿Cuánto conocés al cumpleañero?",
  description: "Juego interactivo para fiestas y cumpleaños. Escaneá el QR, respondé en 10 segundos y ganá en el podio en tiempo real.",
  keywords: ["trivia", "cumpleaños", "fiesta", "juego", "ranking"],
  openGraph: {
    title: "🎉 Trivia de Fiesta",
    description: "Respondé las 10 preguntas sobre el cumpleañero y subite al podio.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white`}
      >
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
        <main className="relative z-10 flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
