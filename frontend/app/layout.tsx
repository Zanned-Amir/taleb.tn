import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/lib/providers";
import { getLocale } from "next-intl/server";
import { Inter } from "next/font/google";
import { Header } from "./components/shared/header";
import { Footer } from "./components/shared/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taleb.tn",
  description: "السيت الوحيد لي تستحقو كطالب تونسي",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentLocale = await getLocale();
  const messages = (await import(`../messages/${currentLocale}.json`)).default;

  return (
    <html lang={currentLocale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders locale={currentLocale} messages={messages}>
          <Header hideAuthLinks={true} />
          {children}
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
