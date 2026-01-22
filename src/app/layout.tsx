import type { Metadata } from "next";
import { Lexend, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import GaussianBackground from "@/components/GaussianBackground";
import Footer from "@/components/Footer";
import ConsoleInit from "@/components/ConsoleInit";

const lexend = Lexend({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GeoForecaster | Geopolitical Analysis Platform",
  description: "A geopolitical super-forecasting platform analyzing CIA World Factbook data for trend analysis and risk assessment.",
  keywords: ["geopolitics", "forecasting", "CIA World Factbook", "risk analysis", "global economics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lexend.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-50 text-slate-800 min-h-screen flex flex-col`}
      >
        <GaussianBackground />
        <ConsoleInit />
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}

