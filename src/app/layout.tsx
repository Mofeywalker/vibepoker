import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SocketProvider } from "@/context/SocketContext";
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
  title: "VibePOKER – Planning Poker für Teams",
  description: "Schätze Story Points gemeinsam im Team mit Echtzeit-Planning-Poker. Keine Anmeldung erforderlich.",
  keywords: ["Planning Poker", "Scrum", "Agile", "Story Points", "Team Estimation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-main min-h-screen`}
      >
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
