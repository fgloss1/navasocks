import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

polyfillCountryFlagEmojis();

import type { Metadata } from "next";
import { SitePreferencesProvider } from "@/components/SitePreferences";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "NAVA SOCKS — Residential, ISP & Datacenter Proxies",
  description: "NAVA SOCKS global proxy grid. Buy ISP, residential and mobile endpoints by country, state and city.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-Theme-Flash Inline Script Protection Block */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('navasocks-theme');
                  var isDark = savedTheme === 'dark';

                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.backgroundColor = '#080d19';
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.backgroundColor = '#f1f5f9';
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-['Twemoji_Country_Flags',sans-serif] min-h-screen antialiased">
        <SitePreferencesProvider>
          {children}
        </SitePreferencesProvider>
      </body>
    </html>
  );
}
