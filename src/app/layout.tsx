import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { SessionProvider } from "@/lib/session";
import { Header } from "@/components/Header";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TEETOMIC — Last-minute tee times in Montreal",
  description:
    "Montreal's standby list for golf. Last-minute tee times up to 60% off. Reserve with a $10 booking fee that comes back as TeeCredit — pay your green fee at the course.",
};

export const viewport: Viewport = {
  themeColor: "#0B3D2E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans">
        <I18nProvider>
          <SessionProvider>
            <Header />
            <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4">{children}</main>
          </SessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
