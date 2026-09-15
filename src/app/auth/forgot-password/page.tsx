"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        if (data.mockToken) setResetToken(data.mockToken);
        setStep("reset");
      } else setError(data.error || "Failed");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, newPassword, resetToken }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Password updated. You can log in.");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 1200);
      } else setError(data.error || "Failed");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d19] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="max-w-md w-full bg-[#0d1424]/90 border border-cyan-800/50 rounded-2xl p-7">
          <h1 className="text-2xl font-bold mb-4">Reset NAVA SOCKS pass</h1>
          {error && <div className="mb-3 text-xs text-rose-400">{error}</div>}
          {message && <div className="mb-3 text-xs text-emerald-400">{message}</div>}
          {step === "request" ? (
            <form onSubmit={requestReset} className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">User</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-cyan-400"
              />
              <button disabled={loading} className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono">
                Send reset token
              </button>
            </form>
          ) : (
            <form onSubmit={confirmReset} className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">Token</label>
              <input
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs"
              />
              <label className="text-xs font-semibold text-slate-300 block">New pass</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
              <button disabled={loading} className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono">
                Save pass
              </button>
            </form>
          )}
          <p className="mt-5 text-xs text-slate-400">
            <Link href="/auth/login" className="text-cyan-400">
              Back to login
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
