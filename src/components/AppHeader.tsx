"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface UserProfile {
  id: number;
  username?: string;
  email: string;
  name: string;
  role: string;
  balance: number;
}

const SESSION_TIMEOUT_SECONDS = 30 * 60;
const SESSION_WARNING_SECONDS = 2 * 60;

const NAV = [
  { href: "/dashboard", label: "PROXY" },
  { href: "/dashboard?tab=history", label: "HISTORY" },
  { href: "/dashboard?tab=payments", label: "PAYMENTS" },
  { href: "/dashboard?tab=support", label: "SUPPORT" },
  { href: "/dashboard?tab=news", label: "NEWS" },
  { href: "/dashboard?tab=terms", label: "TERMS" },
  { href: "/dashboard?tab=aml", label: "CRYPTO AML CHECK" },
  { href: "/dashboard?tab=risk", label: "IP RISK CHECK" },
];

export default function AppHeader({
  user,
  dark,
  onToggleDark,
  activeTab,
}: {
  user: UserProfile | null;
  dark?: boolean;
  onToggleDark?: () => void;
  activeTab?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [secondsLeft, setSecondsLeft] = useState(SESSION_TIMEOUT_SECONDS);
  const [sessionWarning, setSessionWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const loggingOutRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    lastActivityRef.current = Date.now();
    setSecondsLeft(SESSION_TIMEOUT_SECONDS);
    setSessionWarning(false);

    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const interval = window.setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - lastActivityRef.current) / 1000
      );

      const remaining = Math.max(
        SESSION_TIMEOUT_SECONDS - elapsed,
        0
      );

      setSecondsLeft(remaining);
      setSessionWarning(
        remaining > 0 && remaining <= SESSION_WARNING_SECONDS
      );

      if (remaining === 0 && !loggingOutRef.current) {
        loggingOutRef.current = true;

        fetch("/api/auth/logout", {
          method: "POST",
        })
          .catch(() => undefined)
          .finally(() => {
            router.push("/auth/login");
          });
      }
    }, 1000);

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, {
        passive: true,
      });
    });

    return () => {
      window.clearInterval(interval);

      events.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
    };
  }, [user, router]);

  const resetSessionTimer = () => {
    lastActivityRef.current = Date.now();
    setSecondsLeft(SESSION_TIMEOUT_SECONDS);
    setSessionWarning(false);
  };

  const sessionMinutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");

  const sessionSeconds = (secondsLeft % 60)
    .toString()
    .padStart(2, "0");

  useEffect(() => {
  }, [user]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const isProxy = pathname === "/dashboard" && (!activeTab || activeTab === "proxy");

  return (
    <header className={`${dark ? "bg-[#111827] text-slate-200 border-slate-800" : "bg-white text-slate-700 border-slate-200"} border-b sticky top-0 z-40`}>
      {sessionWarning && user && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 mt-1">
          <div className="rounded-md border border-amber-500/40 bg-slate-950 px-3 py-1.5 text-[11px] text-amber-300 shadow-lg whitespace-nowrap">
            Session expires in {sessionMinutes}:{sessionSeconds}. Click SESSION to stay logged in.
          </div>
        </div>
      )}
      <div className="max-w-[1440px] mx-auto px-3 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="font-black tracking-tight text-[20px] text-[#2563eb] shrink-0 leading-none">
            NSOCKS
          </Link>
          <nav className="hidden lg:flex items-center gap-4 text-[12px] font-semibold tracking-wide uppercase">
            {NAV.map((item) => {
              const tab = item.href.includes("tab=") ? item.href.split("tab=")[1] : "proxy";
              const active = (tab === "proxy" && isProxy) || activeTab === tab;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${active ? "text-[#2563eb] border-b-2 border-[#2563eb] pb-0.5" : dark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-[#2563eb]"} whitespace-nowrap`}
                >
                  {item.label}
                </Link>
              );
            })}
            {user?.role === "admin" && (
              <Link href="/admin" className="text-violet-600 hover:text-violet-500 whitespace-nowrap">
                ADMIN
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-[13px] shrink-0">
          {user ? (
            <>
              <span className="font-semibold text-[#2563eb]">${Number(user.balance).toFixed(2)}</span>
              <span className={`${dark ? "text-slate-200" : "text-slate-800"} font-medium`}>
                {user.username || user.name}
              </span>
              <button
                type="button"
                onClick={resetSessionTimer}
                className={`rounded-md border px-2 py-1 text-[11px] font-mono transition ${
                  sessionWarning
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                    : dark
                      ? "border-slate-700 text-slate-300 hover:text-white"
                      : "border-slate-200 text-slate-500 hover:text-slate-800"
                }`}
                title="Reset inactivity timer"
              >
                SESSION {sessionMinutes}:{sessionSeconds}
              </button>

              <button
                onClick={onToggleDark}
                className={`${dark ? "text-amber-300" : "text-slate-500"} hover:opacity-80`}
                title="Toggle theme"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="text-[#2563eb] font-semibold">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

