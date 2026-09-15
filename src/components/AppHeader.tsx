"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

interface UserProfile {
  id: number;
  username?: string;
  email: string;
  name: string;
  role: string;
  balance: number;
}

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

  useEffect(() => {
  }, [user]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const isProxy = pathname === "/dashboard" && (!activeTab || activeTab === "proxy");

  return (
    <header className={`${dark ? "bg-[#111827] text-slate-200 border-slate-800" : "bg-white text-slate-700 border-slate-200"} border-b sticky top-0 z-40`}>
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
