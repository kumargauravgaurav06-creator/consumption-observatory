import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";  // <--- THIS IS THE MISSING WIRE. IT TURNS THE LIGHTS ON.

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "PULSE.IO | Global Intelligence",
  description: "Temporal Analytics Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} antialiased bg-black text-white overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
