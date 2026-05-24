import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PWARegister } from "@/app/pwa-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only needed for code view
});

export const metadata: Metadata = {
  title: "NovaCode AI",
  description: "A minimal AI-powered CodeMirror workspace for building, running, and improving code.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/novacode-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/novacode-icon.svg", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "NovaCode AI",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-hidden">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
