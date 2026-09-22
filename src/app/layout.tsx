import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

polyfillCountryFlagEmojis();

import type { Metadata } from "next";
import Script from "next/script";
import { SitePreferencesProvider } from "@/components/SitePreferences";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAVA SOCKS — Residential, ISP & Datacenter Proxies",
  description:
    "NAVA SOCKS global proxy grid. Buy ISP, residential and mobile endpoints by country, state and city.",
};

const THEME_BOOTSTRAP = `
(() => {
  try {
    const root = document.documentElement;

    const darkValues = new Set([
      "dark",
      "true",
      "1",
    ]);

    const lightValues = new Set([
      "light",
      "false",
      "0",
    ]);

    let dark;

    const preferredKey = "navasocks-theme";
    const discoveredKeys = Object.keys(localStorage).filter(
      (key) =>
        /theme|appearance|preference|dark/i.test(key) &&
        key !== preferredKey
    );

    const themeKeys = [
      ...(localStorage.getItem(preferredKey)
        ? [preferredKey]
        : []),
      ...discoveredKeys,
    ];

    for (const key of themeKeys) {
      const rawValue = localStorage.getItem(key);

      let value = rawValue;

      try {
        const parsedValue = rawValue
          ? JSON.parse(rawValue)
          : null;

        value =
          parsedValue?.theme ??
          parsedValue?.appearance ??
          parsedValue?.dark ??
          parsedValue;
      } catch {
        value = rawValue;
      }

      const normalizedValue = String(value).toLowerCase();

      if (darkValues.has(normalizedValue)) {
        dark = true;
        break;
      }

      if (lightValues.has(normalizedValue)) {
        dark = false;
        break;
      }
    }

    if (dark === undefined) {
      dark =
        window.matchMedia?.(
          "(prefers-color-scheme: dark)"
        )?.matches ?? true;
    }

    const backgroundColor = dark
      ? "#080d19"
      : "#f1f5f9";

    root.dataset.theme = dark
      ? "dark"
      : "light";

    root.classList.toggle("dark", dark);

    root.style.backgroundColor =
      backgroundColor;

    root.style.colorScheme = dark
      ? "dark"
      : "light";

    root.style.setProperty(
      "--page-bg",
      backgroundColor
    );
  } catch {
    // Keep the dark first-paint fallback.
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
  <head>
    <style
      dangerouslySetInnerHTML={{
        __html: `
          :root {
            --page-bg: #080d19;
          }

          html,
          body {
            min-height: 100%;
            background-color: var(--page-bg) !important;
          }

          html[data-theme="light"] {
            --page-bg: #f1f5f9;
          }
        `,
      }}
    />

    <Script
      id="theme-bootstrap"
      strategy="beforeInteractive"
    >
      {THEME_BOOTSTRAP}
    </Script>
  </head>

  <body
    style={{
      backgroundColor: "var(--page-bg)",
    }}
    className="min-h-screen antialiased"
  >
    <SitePreferencesProvider>
      {children}
    </SitePreferencesProvider>
  </body>
</html>
  );
}