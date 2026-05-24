import type { Metadata } from "next";
import "./globals.css";

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
      className="h-full antialiased"
    >
      <body className="min-h-full overflow-hidden">
        {children}
      </body>
    </html>
  );
}
