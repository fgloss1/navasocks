"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Shield,
  Zap,
  Server,
  Key,
  User,
  LogOut,
  Sliders,
  DollarSign,
  Activity,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  balance: number;
  twoFactorEnabled: boolean;
}

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUser();
  }, [pathname]);
const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b101b]/90 backdrop-blur-md border-b border-cyan-900/30 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                  NAVA<span className="text-cyan-400"> SOCKS</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-500/80 -mt-1 block">
                  Enterprise Proxy Grid
                </span>
              </div>
            </Link>

            {/* Live Uptime Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono ml-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>75M+ IPs Online (99.98%)</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/#pricing" className="hover:text-cyan-400 transition-colors">
              Pricing & Plans
            </Link>
            <Link href="/#features" className="hover:text-cyan-400 transition-colors">
              Network Specs
            </Link>
            <Link href="/#nodes" className="hover:text-cyan-400 transition-colors">
              Global Nodes
            </Link>
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                    pathname === "/dashboard"
                      ? "bg-cyan-500 text-slate-950 border-cyan-400"
                      : "bg-slate-900/80 text-cyan-300 border-cyan-800/60 hover:bg-cyan-950/40"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Dashboard
                </Link>

                <div className="h-6 w-px bg-slate-800 mx-1" />

                <div className="flex items-center gap-2 pl-1 text-xs">
          <Link
            href="/dashboard?tab=payments"
            className="px-3.5 py-1.5 text-xs font-black rounded-lg bg-emerald-400 text-slate-950 border border-emerald-300 hover:bg-emerald-300 transition-all shadow-md shadow-emerald-500/20"
          >
            TOP UP
          </Link>
                  <div className="text-right">
                    <p className="font-semibold text-slate-200 leading-tight">{user.name}</p>
                    <p className="text-[11px] text-emerald-400 font-mono">${user.balance.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition"
                >
                  Log In
                </Link>

                <Link
                  href="/auth/signup"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 transition-all font-mono"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c121f] border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-cyan-400"
          >
            Pricing & Plans
          </Link>
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-cyan-400"
          >
            Network Specs
          </Link>
          <Link
            href="/#nodes"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-cyan-400"
          >
            Global Nodes
          </Link>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2 text-sm font-semibold rounded-lg bg-cyan-500 text-slate-950"
                >
                  Open Dashboard
                </Link>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-center py-2 text-sm text-rose-400"
                >
                  Sign Out ({user.email})
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2 text-sm text-slate-300 hover:text-white"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2 text-sm font-semibold rounded-lg bg-cyan-500 text-slate-950"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}



