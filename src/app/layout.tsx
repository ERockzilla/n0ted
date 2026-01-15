import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import MathBackground from "@/components/MathBackground";

const spaceGrotesk = Space_Grotesk({
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
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-50 text-slate-800 min-h-screen`}
      >
        <MathBackground />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
