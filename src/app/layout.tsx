import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";

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
      <head>
        {/* 1. FORCE LOAD TAILWIND ENGINE FROM CLOUD */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    emerald: { 400: '#34d399', 500: '#10b981' },
                    cyan: { 400: '#22d3ee', 500: '#06b6d4' },
                  },
                  fontFamily: {
                    mono: ['Space Grotesk', 'monospace'],
                  }
                }
              }
            }
          `
        }} />
        
        {/* 2. FORCE LOAD CUSTOM STYLES */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              background-color: #050505;
              color: #fff;
              overflow: hidden;
            }
            .glass-panel {
              background: rgba(10, 10, 10, 0.7);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              border: 1px solid rgba(52, 211, 153, 0.2);
              box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
            }
            .text-shadow-glow {
              text-shadow: 0 0 20px rgba(52, 211, 153, 0.6);
            }
            /* Slider Styling */
            input[type=range] {
              -webkit-appearance: none;
              background: transparent;
            }
            input[type=range]::-webkit-slider-thumb {
              -webkit-appearance: none;
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: #10b981;
              margin-top: -6px;
              box-shadow: 0 0 10px #10b981;
            }
            input[type=range]::-webkit-slider-runnable-track {
              width: 100%;
              height: 4px;
              background: #334155;
              border-radius: 2px;
            }
          `
        }} />
      </head>
      <body className={spaceGrotesk.className}>
        {children}
      </body>
    </html>
  );
}
