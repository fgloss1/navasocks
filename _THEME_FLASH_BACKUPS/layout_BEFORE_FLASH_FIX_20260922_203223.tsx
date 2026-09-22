import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

polyfillCountryFlagEmojis();

import type { Metadata } from "next";
import { SitePreferencesProvider } from "@/components/SitePreferences";
import "./globals.css";

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
                  if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
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
