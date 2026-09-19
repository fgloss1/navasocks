import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

// This injects vector flag graphics to overwrite broken plain-text rendering paths on Windows
polyfillCountryFlagEmojis();

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAVA SOCKS — Residential, ISP & Datacenter Proxies",
  description: "NAVA SOCKS global proxy grid. Buy ISP, residential and mobile endpoints by country, state and city.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Forces your browser layout engine to load vector flags smoothly */}
      <body className="font-['Twemoji_Country_Flags',sans-serif]">
        {children}
      </body>
    </html>
  );
}
