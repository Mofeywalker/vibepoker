import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "VibePOKER – Planning Poker für Teams",
  description: "Schätze Story Points gemeinsam im Team mit Echtzeit-Planning-Poker. Keine Anmeldung erforderlich.",
  keywords: ["Planning Poker", "Scrum", "Agile", "Story Points", "Team Estimation"],
  other: {
    "text-scale": "scale",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-main min-h-dvh`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            themes={["light", "dark", "colorful"]}
            defaultTheme="system"
            enableSystem
          >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
