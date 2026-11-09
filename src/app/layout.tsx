import type { Metadata } from "next";
import { Inter, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toast";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-gf-sans",
});

const mono = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-gf-mono",
});

export const metadata: Metadata = {
  title: "Parking Rotation System",
  description: "Fair parking slot rotation and optimization system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mono.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="min-h-screen flex flex-col bg-zinc-100">
          <Header />
          <div className="h-full">{children}</div>
          <Footer />
        </div>
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
