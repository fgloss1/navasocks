"use client";

import { useState } from "react";
import {
  X,
  Layers,
  Database,
  Cpu,
  Shield,
  Zap,
  Server,
  ArrowRight,
  GitBranch,
  Lock,
  Globe,
  Radio,
} from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  const [activeTab, setActiveTab] = useState<"stack" | "schema" | "flow" | "security">("stack");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b101c] border border-cyan-700/50 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-600/30 border border-cyan-500 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              System Architecture & Tech Stack Recommendation
            </h2>
            <p className="text-xs text-cyan-400/80 font-mono">
              Engineered for High-Concurrency Proxy Multiplexing & Automated Settlements
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 border-b border-slate-800 pb-3 mb-5 overflow-x-auto">
          {[
            { id: "stack", label: "Recommended Tech Stack", icon: Cpu },
            { id: "schema", label: "PostgreSQL Database Schema", icon: Database },
            { id: "flow", label: "Real-Time Proxy & Bandwidth Flow", icon: Radio },
            { id: "security", label: "Security & Payment Architecture", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: TECH STACK */}
        {activeTab === "stack" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
                  <Zap className="w-4 h-4" />
                  Frontend & Edge API Layer
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">Next.js 15 (App Router) + React 19 + Tailwind CSS</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Server Components for instant initial page rendering with zero hydration latency</li>
                  <li>Client Components for dynamic proxy generators, live bandwidth graphs, and crypto timers</li>
                  <li>Edge Middleware for geo-routing, IP header inspection, and session token checks</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                  <Server className="w-4 h-4" />
                  Proxy Gateway & Multiplexing Core
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">HAProxy + Envoy + Go/Rust Proxy Balancer</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Dual-protocol listeners for SOCKS5 (port 1080) and HTTP CONNECT (port 7000/8080)</li>
                  <li>EPoll-based non-blocking multiplexing handling 100,000+ simultaneous connections per node</li>
                  <li>Dynamic ASN and City upstream routing via sub-millisecond route tables</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold font-mono">
                  <Database className="w-4 h-4" />
                  Primary Storage & ORM
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">PostgreSQL 16 + Drizzle ORM</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>ACID transactional consistency for balance deductions and GB allocations</li>
                  <li>Drizzle ORM for zero-overhead, type-safe queries without bulky engine binaries</li>
                  <li>TimescaleDB / Hypertable partitioning for high-throughput bandwidth audit logs</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold font-mono">
                  <Radio className="w-4 h-4" />
                  Real-Time & Rate-Limiting Cache
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">Redis Cluster + SSE / WebSockets</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Token Bucket algorithm in Redis for sub-millisecond proxy bandwidth metering</li>
                  <li>Redis Pub/Sub to push live bandwidth ticks to Next.js user dashboard via SSE</li>
                  <li>Ephemeral sticky session cache holding upstream peer bindings (5m to 60m)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEMA */}
        {activeTab === "schema" && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto space-y-3">
              <div>
                <span className="text-cyan-400 font-bold">1. users</span>: (id, email, password_hash, name, role [user|admin], two_factor_enabled, balance, status, created_at)
              </div>
              <div>
                <span className="text-cyan-400 font-bold">2. proxy_plans</span>: (id, name, type [residential|datacenter|mobile], price_per_gb, pool_size, protocol, features)
              </div>
              <div>
                <span className="text-cyan-400 font-bold">3. user_subscriptions</span>: (id, user_id, plan_id, allocated_gb, used_gb, status, proxy_username, proxy_password, ip_whitelist, expires_at)
              </div>
              <div>
                <span className="text-cyan-400 font-bold">4. transactions</span>: (id, user_id, amount, currency, payment_method [crypto_usdt|crypto_btc|crypto_ltc], payment_address, tx_hash, status)
              </div>
              <div>
                <span className="text-cyan-400 font-bold">5. proxy_nodes</span>: (id, node_id, name, type, ip_address, country, city, country_code, status, latency_ms, current_connections, bandwidth_mbps)
              </div>
              <div>
                <span className="text-cyan-400 font-bold">6. api_keys</span>: (id, user_id, key_name, api_key, last_used_at, created_at)
              </div>
              <div>
                <span className="text-cyan-400 font-bold">7. bandwidth_logs</span>: (id, user_id, subscription_id, megabytes_used, protocol, target_host, country_code, timestamp)
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              * Fully implemented in PostgreSQL using Drizzle ORM schemas in <code className="text-cyan-300">src/db/schema.ts</code>.
            </p>
          </div>
        )}

        {/* TAB 3: REAL-TIME FLOW */}
        {activeTab === "flow" && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-cyan-400 font-mono font-bold text-sm">Proxy Connection & Metering Lifecycle</h4>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">1</span>
                  <span><strong>Client Request:</strong> Client sends HTTP CONNECT or SOCKS5 handshake to <code className="text-cyan-300">pr.nsocks.net:7000</code> with credentials <code className="text-cyan-300">user-nsk_94812-country-us:pass-sec</code>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">2</span>
                  <span><strong>Edge Auth & Balance Check:</strong> Envoy/Go Gateway queries Redis cluster in &lt;1ms to verify user bandwidth balance (&gt; 0 GB remaining) and IP whitelist.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">3</span>
                  <span><strong>Upstream Peer Routing:</strong> Dynamic selector maps request to lowest-latency residential peer matching <code className="text-cyan-300">country=US</code>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">4</span>
                  <span><strong>Byte Accounting:</strong> Data streaming is metered in Redis sliding window; every 10 MB or on connection close, an async worker writes delta to PostgreSQL <code className="text-cyan-300">user_subscriptions</code> and pushes real-time usage event to the dashboard.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY */}
        {activeTab === "security" && (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white flex items-center gap-1.5 text-cyan-400">
                  <Lock className="w-3.5 h-3.5" />
                  Dual-Factor Authentication (2FA)
                </h5>
                <p className="text-[11px] text-slate-400">
                  RFC 6238 compliant TOTP (Time-Based One-Time Password) compatible with Google Authenticator, Authy, and 1Password with encrypted backup keys.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white flex items-center gap-1.5 text-amber-400">
                  <Zap className="w-3.5 h-3.5" />
                  Automated Crypto Webhook Engine
                </h5>
                <p className="text-[11px] text-slate-400">
                  NOWPayments and Coinbase Commerce webhooks verified with HMAC SHA-512 signatures, idempotent event processing, and on-chain block confirmation confirmations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white flex items-center gap-1.5 text-blue-400">
                  <Shield className="w-3.5 h-3.5" />
                  Crypto payment processing & confirmation tracking
                </h5>
                <p className="text-[11px] text-slate-400">
                  Card data never touches the application backend; client-side tokenization with 3D-Secure 2.0 and automated SCA compliance.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white flex items-center gap-1.5 text-purple-400">
                  <Globe className="w-3.5 h-3.5" />
                  DDoS & Network Isolation
                </h5>
                <p className="text-[11px] text-slate-400">
                  BGP Anycast edge routing protects gateway proxies against volumetric attacks, with automated IP blackholing and SSL termination.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition font-mono"
          >
            Close Architecture Spec
          </button>
        </div>
      </div>
    </div>
  );
}

