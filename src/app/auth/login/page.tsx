"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Lock, User, ArrowRight, RefreshCw, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, twoFactorCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      if (data.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }
      router.push(data.user?.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d19] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-16 relative">
        <div className="absolute w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-md w-full bg-[#0d1424]/90 border border-cyan-800/50 rounded-2xl p-7 shadow-2xl relative z-10">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">NAVA SOCKS Login</h1>
            <p className="text-xs text-slate-400 mt-1">User and pass to open the proxy market</p>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            {!requires2FA ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">User</label>
                  <div className="relative">
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-400 outline-none"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Pass</label>
                    <Link href="/auth/forgot-password" className="text-[11px] text-cyan-400">
                      Forgot pass?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-400 outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40">
                <p className="text-xs text-cyan-300 font-semibold inline-flex items-center gap-2">
                  <Shield className="w-4 h-4" /> 2FA required
                </p>
                <input
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  maxLength={6}
                  autoFocus
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-cyan-500 text-white text-center font-mono tracking-widest outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Login <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
