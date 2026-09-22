"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import {
  SITE_LANGUAGES,
  useSitePreferences,
} from "@/components/SitePreferences";

interface UserProfile {
  id: number;
  email: string;
  name: string;
  username?: string;
  role: string;
  balance: number;
  twoFactorEnabled: boolean;
}

const LANGUAGE_COUNTRY_CODES: Record<string, string> = {
  en: "GB",
  de: "DE",
  es: "ES",
  fr: "FR",
  ja: "JP",
  ko: "KR",
  it: "IT",
  pl: "PL",
  pt: "PT",
  ru: "RU",
  zh: "CN",
  "zh-cn": "CN",
  "zh-CN": "CN",
  "es-ar": "AR",
  "es-AR": "AR",
  tr: "TR",
};

function Flag({ code }: { code: string }) {
  const normalized = (code || "US").trim().toUpperCase();

  const emoji = normalized
    .split("")
    .filter((char) => char >= "A" && char <= "Z")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");

  return (
    <span
      aria-hidden="true"
      className="inline-flex w-5 shrink-0 items-center justify-center text-sm leading-none select-none align-middle"
    >
      {emoji}
    </span>
  );
}

function CountryFlag({ code }: { code: string }) {
  const aliases: Record<string, string> = {
    en: "US",
    de: "DE",
    es: "ES",
    fr: "FR",
    ja: "JP",
    ko: "KR",
    it: "IT",
    pl: "PL",
    pt: "PT",
    ru: "RU",
    zh: "CN",
    "zh-cn": "CN",
    "zh-CN": "CN",
    "es-ar": "AR",
    "es-AR": "AR",
    tr: "TR",
  };

  const key = code.trim();
  const upper = aliases[key] ?? aliases[key.toLowerCase()] ?? key.toUpperCase();
  const resolved = upper.slice(0, 2);

  let graphic: React.ReactNode;

  switch (resolved) {
    case "US":
      graphic = (
        <>
          <rect width="24" height="18" fill="#ffffff" />
          <rect y="0" width="24" height="1.3846" fill="#b22234" />
          <rect y="2.7692" width="24" height="1.3846" fill="#b22234" />
          <rect y="5.5384" width="24" height="1.3846" fill="#b22234" />
          <rect y="8.3076" width="24" height="1.3846" fill="#b22234" />
          <rect y="11.0768" width="24" height="1.3846" fill="#b22234" />
          <rect y="13.846" width="24" height="1.3846" fill="#b22234" />
          <rect y="16.6152" width="24" height="1.3846" fill="#b22234" />
          <rect width="10.4" height="9.692" fill="#3c3b6e" />
          <g fill="#ffffff">
            <circle cx="1.35" cy="1.25" r=".38" />
            <circle cx="3.1" cy="1.25" r=".38" />
            <circle cx="4.85" cy="1.25" r=".38" />
            <circle cx="6.6" cy="1.25" r=".38" />
            <circle cx="8.35" cy="1.25" r=".38" />
            <circle cx="2.22" cy="2.75" r=".38" />
            <circle cx="3.97" cy="2.75" r=".38" />
            <circle cx="5.72" cy="2.75" r=".38" />
            <circle cx="7.47" cy="2.75" r=".38" />
            <circle cx="9.22" cy="2.75" r=".38" />
            <circle cx="1.35" cy="4.25" r=".38" />
            <circle cx="3.1" cy="4.25" r=".38" />
            <circle cx="4.85" cy="4.25" r=".38" />
            <circle cx="6.6" cy="4.25" r=".38" />
            <circle cx="8.35" cy="4.25" r=".38" />
            <circle cx="2.22" cy="5.75" r=".38" />
            <circle cx="3.97" cy="5.75" r=".38" />
            <circle cx="5.72" cy="5.75" r=".38" />
            <circle cx="7.47" cy="5.75" r=".38" />
            <circle cx="9.22" cy="5.75" r=".38" />
            <circle cx="1.35" cy="7.25" r=".38" />
            <circle cx="3.1" cy="7.25" r=".38" />
            <circle cx="4.85" cy="7.25" r=".38" />
            <circle cx="6.6" cy="7.25" r=".38" />
            <circle cx="8.35" cy="7.25" r=".38" />
            <circle cx="2.22" cy="8.75" r=".38" />
            <circle cx="3.97" cy="8.75" r=".38" />
            <circle cx="5.72" cy="8.75" r=".38" />
            <circle cx="7.47" cy="8.75" r=".38" />
            <circle cx="9.22" cy="8.75" r=".38" />
          </g>
        </>
      );
      break;
    case "GB":
      graphic = (
        <>
          <rect width="24" height="18" fill="#1b3f8b" />
          <path d="M0 0L24 18M24 0L0 18" stroke="#fff" strokeWidth="5" />
          <path d="M0 0L24 18M24 0L0 18" stroke="#c8102e" strokeWidth="2.4" />
          <path d="M12 0V18M0 9H24" stroke="#fff" strokeWidth="6" />
          <path d="M12 0V18M0 9H24" stroke="#c8102e" strokeWidth="3" />
        </>
      );
      break;
    case "DE":
      graphic = (
        <>
          <rect width="24" height="6" fill="#000" />
          <rect y="6" width="24" height="6" fill="#d00" />
          <rect y="12" width="24" height="6" fill="#ffce00" />
        </>
      );
      break;
    case "ES":
      graphic = (
        <>
          <rect width="24" height="4.5" fill="#aa151b" />
          <rect y="4.5" width="24" height="9" fill="#f1bf00" />
          <rect y="13.5" width="24" height="4.5" fill="#aa151b" />
        </>
      );
      break;
    case "FR":
      graphic = (
        <>
          <rect width="8" height="18" fill="#0055a4" />
          <rect x="8" width="8" height="18" fill="#fff" />
          <rect x="16" width="8" height="18" fill="#ef4135" />
        </>
      );
      break;
    case "JP":
      graphic = (
        <>
          <rect width="24" height="18" fill="#fff" />
          <circle cx="12" cy="9" r="4.2" fill="#bc002d" />
        </>
      );
      break;
    case "KR":
      graphic = (
        <>
          <rect width="24" height="18" fill="#fff" />
          <path d="M9.5 9c0-2.2 1.7-3.8 3.9-3.8 2.1 0 3.6 1.4 3.6 3.1 0 2.1-1.7 3.7-3.8 3.7-1.8 0-3.7-1.4-3.7-3z" fill="#c60c30" />
          <path d="M14.5 9c0 2.2-1.7 3.8-3.9 3.8-2.1 0-3.6-1.4-3.6-3.1 0-2.1 1.7-3.7 3.8-3.7 1.8 0 3.7 1.4 3.7 3z" fill="#003478" />
          <g stroke="#111" strokeWidth="1.1">
            <path d="M3 3h4M3 5h4M3 7h4" />
            <path d="M17 12h4M17 14h4M17 16h4" />
          </g>
        </>
      );
      break;
    case "IT":
      graphic = (
        <>
          <rect width="8" height="18" fill="#009246" />
          <rect x="8" width="8" height="18" fill="#fff" />
          <rect x="16" width="8" height="18" fill="#ce2b37" />
        </>
      );
      break;
    case "PL":
      graphic = (
        <>
          <rect width="24" height="9" fill="#fff" />
          <rect y="9" width="24" height="9" fill="#dc143c" />
        </>
      );
      break;
    case "PT":
      graphic = (
        <>
          <rect width="9" height="18" fill="#046a38" />
          <rect x="9" width="15" height="18" fill="#da291c" />
          <circle cx="9" cy="9" r="3.2" fill="#f7d117" />
        </>
      );
      break;
    case "RU":
      graphic = (
        <>
          <rect width="24" height="6" fill="#fff" />
          <rect y="6" width="24" height="6" fill="#0039a6" />
          <rect y="12" width="24" height="6" fill="#d52b1e" />
        </>
      );
      break;
    case "CN":
      graphic = (
        <>
          <rect width="24" height="18" fill="#de2910" />
          <polygon points="5,2 5.9,4.5 8.6,4.5 6.4,6.1 7.3,8.7 5,7.1 2.7,8.7 3.6,6.1 1.4,4.5 4.1,4.5" fill="#ffde00" />
        </>
      );
      break;
    case "AR":
      graphic = (
        <>
          <rect width="24" height="6" fill="#74acdf" />
          <rect y="6" width="24" height="6" fill="#fff" />
          <rect y="12" width="24" height="6" fill="#74acdf" />
          <circle cx="12" cy="9" r="2" fill="#f6b40e" />
        </>
      );
      break;
    case "TR":
      graphic = (
        <>
          <rect width="24" height="18" fill="#e30a17" />
          <circle cx="9" cy="9" r="4.1" fill="#fff" />
          <circle cx="10.4" cy="9" r="3.2" fill="#e30a17" />
          <polygon points="14,5.7 14.9,8 17.4,8 15.4,9.5 16.3,11.9 14,10.5 11.8,11.9 12.6,9.5 10.6,8 13.1,8" fill="#fff" />
        </>
      );
      break;
    default:
      graphic = <rect width="24" height="18" fill="#334155" />;
  }

  return (
    <span aria-hidden="true" className="inline-flex h-[18px] w-[24px] shrink-0 items-center justify-center overflow-hidden rounded-[2px]">
      <svg viewBox="0 0 24 18" width="24" height="18" className="block h-[18px] w-[24px]" focusable="false">
        {graphic}
      </svg>
    </span>
  );
}
export default function Navbar() {
  const { dark, setDark, language, setLanguage, t } = useSitePreferences();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const isLanguageTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(
      target.closest("[data-language-trigger]") ||
      target.closest("[data-language-dropdown]")
    );

  useEffect(() => {
    if (!isLangOpen) return;
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (!isLanguageTarget(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
    };
  }, [isLangOpen]);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const isLightMode = !dark;

  const selectedLang = SITE_LANGUAGES.find((item) => item.code === language) ?? SITE_LANGUAGES[0];
  const displayUserName = user?.username?.trim() || user?.name?.trim() || user?.email?.split("@")[0] || "";
  const selectedCountryCode = LANGUAGE_COUNTRY_CODES[selectedLang.code] ?? selectedLang.code.toUpperCase();

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  };
    return (
<header
  data-site-navbar="true"
  style={{
    backgroundColor: dark ? "#080d19" : "#ffffff",
    borderColor: dark ? "#0f172a" : "#e2e8f0",
    color: dark ? "#ffffff" : "#0f172a",
  }}
  className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white px-4 py-3 font-sans antialiased text-slate-900 dark:border-slate-900 dark:bg-[#080d19] dark:text-white"
>      <div className="mx-auto max-w-[1400px]">
        <div className="flex h-12 items-center justify-between gap-4">
          
          {/* LEFT: Branding & Dynamic Live Status Badge */}
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <Link href="/" className="group flex shrink-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20 transition-transform group-hover:scale-105">
                <Zap className="h-5 w-5 fill-current text-slate-900 dark:text-white" strokeWidth={1.8} />
              </div>
              <div className="leading-none min-w-0 hidden sm:block">
                <div className="flex items-center gap-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  <span>NAVA</span>
                  <span className="text-cyan-600 dark:text-cyan-400">SOCKS</span>
                </div>
                <span className="mt-1 block truncate font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400/70 max-w-[120px]">
                  {t("enterpriseGrid")}
                </span>
              </div>
            </Link>

                        {/* Left Status Pill Fix */}
            <div className={`hidden md:flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-black transition-colors duration-200 animate-live-glow ${
              dark 
                ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-400" 
                : "border-emerald-300 bg-emerald-100 text-emerald-800"
            }`}>
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span className="whitespace-nowrap">{t("onlineIps")}</span>
            </div>
          </div>

          {/* CENTER: Navigation Links (hidden on 2XL screens to give translations maximum room) */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 px-2 xl:flex">
            <Link href="/#pricing" className="whitespace-nowrap text-sm font-medium text-slate-600 transition-colors hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400">
              {t("pricing")}
            </Link>
            <Link href="/#features" className="whitespace-nowrap text-sm font-medium text-slate-600 transition-colors hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400">
              {t("networkSpecs")}
            </Link>
            <Link href="/#nodes" className="whitespace-nowrap text-sm font-medium text-slate-600 transition-colors hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400">
              {t("globalNodes")}
            </Link>
          </nav>

                    {/* RIGHT: User Actions, Locale, Theme Toggles */}
                    {/* RIGHT: User Actions, Locale, Theme Toggles */}
          <div className="hidden shrink-0 items-center gap-3 md:flex lg:gap-4">
            <div className="flex items-center gap-2.5">
              {user ? (
                <div className="flex items-center gap-2 lg:gap-3">
                  <Link href="/dashboard" className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all ${pathname === "/dashboard" ? "border-cyan-400 bg-cyan-500 text-slate-950" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-cyan-800/60 dark:bg-slate-900/80 dark:text-cyan-300 dark:hover:bg-cyan-950/40"}`}>
                    <Zap className="h-3.5 w-3.5 shrink-0 animate-pulse" strokeWidth={1.8} />
                    <span className="whitespace-nowrap">{t("dashboard")}</span>
                  </Link>

                  <Link href="/dashboard?tab=payments" className="flex h-9 shrink-0 items-center rounded-lg border border-emerald-300 bg-emerald-400 px-3.5 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-300">
                    <span className="whitespace-nowrap">{t("topUp")}</span>
                  </Link>

                  {/* Balance Layout Column Width Fix */}
                  <div className="flex h-9 flex-col items-end justify-center text-right leading-tight min-w-[max-content] shrink-0">
                    <p className="whitespace-nowrap text-xs font-semibold text-slate-800 dark:text-slate-200">{displayUserName}</p>
                    <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{"$"}{user.balance.toFixed(2)}
                    </p>
                    </div>

                  <button type="button" onClick={handleLogout} title={t("signOut")} aria-label={t("signOut")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md p-0 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-rose-500">
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" className="whitespace-nowrap px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                    {t("login")}
                  </Link>
                  <Link href="/auth/signup" className="whitespace-nowrap rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500">
                    {t("signup")}
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-800">
              <div className="relative inline-flex">
                {/* Language Picker Width expanded to w-36 */}
                <button type="button" onClick={() => setIsLangOpen((open) => !open)} aria-label={t("selectLanguage")} data-language-trigger="true" aria-expanded={isLangOpen} className="flex h-9 w-36 items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:bg-[#111318] dark:text-white/85 dark:hover:border-white/30 dark:hover:text-white">
                  <CountryFlag code={selectedLang.code} />
                  <span className="min-w-0 flex-1 truncate text-left">{selectedLang.name}</span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isLangOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                </button>

                <div data-language-dropdown="true" aria-hidden={!isLangOpen} className={`absolute right-0 top-full mt-1 z-50 w-40 max-h-72 overflow-y-auto overflow-x-hidden origin-top-right transform-gpu overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111318]/90 p-1 shadow-2xl shadow-black/30 backdrop-blur-md transition-[opacity,transform] duration-200 ease-out ${isLangOpen ? "translate-y-0 scale-100 opacity-100 pointer-events-auto" : "-translate-y-2 scale-[0.98] opacity-0 pointer-events-none"}`}>
                  {SITE_LANGUAGES.map((item) => {
                    const active = item.code === language;
                    return (
                      <button key={item.code} type="button" onClick={() => { setLanguage(item.code); setIsLangOpen(false); }} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition ${active ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"}`}>
                        <CountryFlag code={item.code} />
                        <span className="whitespace-nowrap truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="button" onClick={() => setDark(!dark)} aria-label={isLightMode ? t("switchToDarkMode") : t("switchToLightMode")} title={isLightMode ? t("darkMode") : t("lightMode")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-transparent text-slate-600 dark:text-white/80 transition hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white">
                <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
                  <Moon className={`absolute inset-0 h-4 w-4 transition-all duration-300 ease-out ${isLightMode ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0"}`} strokeWidth={1.35} />
                  <Sun className={`absolute inset-0 h-4 w-4 transition-all duration-300 ease-out ${isLightMode ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"}`} strokeWidth={1.35} />
                </span>
              </button>
            </div>
          </div>

          {/* MOBILE TOGGLE BUTTON */}
          <div className="ml-auto flex md:hidden">
            <button
  type="button"
  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  aria-expanded={isMobileMenuOpen}
  aria-controls="mobile-navigation"
  aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div id="mobile-navigation" className="max-h-[calc(100dvh-5rem)] overflow-x-hidden overflow-y-auto overscroll-contain border-t border-slate-200 bg-white px-3 pb-5 pt-3 shadow-xl shadow-black/10 md:hidden dark:border-slate-900 dark:bg-[#080d19] dark:shadow-black/30 sm:px-4">
          <div className="space-y-1.5">
            <Link href="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 py-3 text-sm leading-5 text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-cyan-400">{t("pricing")}</Link>
            <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 py-3 text-sm leading-5 text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-cyan-400">{t("networkSpecs")}</Link>
            <Link href="/#nodes" onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 py-3 text-sm leading-5 text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-cyan-400">{t("globalNodes")}</Link>
          </div>
          <div className="mt-4 border-t border-slate-200 dark:border-slate-900 pt-4">
            {user ? (
              <div className="space-y-2.5">
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block w-full rounded-lg bg-cyan-500 py-2.5 text-center text-sm font-semibold text-slate-950">Open {t("dashboard")}</Link>
                <Link href="/dashboard?tab=payments" onClick={() => setIsMobileMenuOpen(false)} className="block w-full rounded-lg bg-emerald-400 py-2.5 text-center text-sm font-black text-slate-950">{t("topUp")}</Link>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-3 py-2 text-center">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{displayUserName}</p>
                  <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400">\${user.balance.toFixed(2)}</p>
                </div>
                <button type="button" onClick={() => { void handleLogout(); setIsMobileMenuOpen(false); }} className="block w-full py-2 text-sm text-rose-500">{t("signOut")}</button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full rounded-lg py-2.5 text-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">{t("login")}</Link>
                <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)} className="block w-full rounded-lg bg-cyan-500 py-2.5 text-center text-sm font-semibold text-slate-950">{t("createAccount")}</Link>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-slate-200 dark:border-slate-900 pt-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
  <button
    type="button"
    onClick={() => setIsLangOpen((open) => !open)}
    data-language-trigger="true"
    aria-expanded={isLangOpen}
    aria-label={t("selectLanguage")}
    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 transition hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
  >
    <span className="flex min-w-0 items-center gap-2">
      <CountryFlag code={selectedLang.code} />
      <span className="truncate">{selectedLang.name}</span>
    </span>
    <ChevronDown
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
        isLangOpen ? "rotate-180" : ""
      }`}
      strokeWidth={1.5}
    />
  </button>

  {isLangOpen && (
    <div
      data-language-dropdown="true"
      className="max-h-[45dvh] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-black/10 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30"
    >
      <div className="space-y-1">
        {SITE_LANGUAGES.map((item) => {
          const active = item.code === language;

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLanguage(item.code);
                setIsLangOpen(false);
              }}
              className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <CountryFlag code={item.code} />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  )}
</div>
            <button
              type="button"
              onClick={() => setDark(!dark)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-600 dark:border-slate-800 dark:text-white/80"
              aria-label={
                isLightMode
                  ? t("switchToDarkMode")
                  : t("switchToLightMode")
              }
            >
              <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
                <Moon
                  className={`absolute inset-0 h-4 w-4 transition-all duration-300 ease-out ${
                    isLightMode
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-75 opacity-0"
                  }`}
                  strokeWidth={1.35}
                />
                <Sun
                  className={`absolute inset-0 h-4 w-4 transition-all duration-300 ease-out ${
                    isLightMode
                      ? "rotate-90 scale-75 opacity-0"
                      : "rotate-0 scale-100 opacity-100"
                  }`}
                  strokeWidth={1.35}
                />
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

