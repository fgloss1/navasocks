import Link from "next/link";
import { Zap, Shield, Globe, Terminal, Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#070b13] border-t border-slate-900 text-slate-400 py-12 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                NAVA<span className="text-cyan-400"> SOCKS</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Global residential, datacenter, and 4G/5G mobile proxy network designed for high-concurrency data scraping, ad verification, and unblockable automation.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              All 195+ Geolocation Clusters Operational
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 mb-3">Proxy Products</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#pricing" className="hover:text-cyan-400 transition-colors">
                  Rotating Residential (75M+ IPs)
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-cyan-400 transition-colors">
                  Static ISP Residential Proxies
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-cyan-400 transition-colors">
                  Datacenter Dedicated (10 Gbps)
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-cyan-400 transition-colors">
                  4G/5G Mobile Cellular Modems
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer & API */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 mb-3">Developers</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  Proxy Generator Tool
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  cURL & Python SDKs
                </Link>
              </li>

              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  API Key Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Payments & Protocols */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 mb-3">Accepted Gateways</h4>
            <p className="text-xs text-slate-400 mb-3">
              Automated crypto payments with USDT, BTC, and LTC.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">USDT</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">BTC</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">LTC</span>
              
              
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>- {new Date().getFullYear()} NAVA SOCKS. Global residential, ISP and datacenter proxy infrastructure.</p>
          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-slate-400">
              User Portal
            </Link>
            <Link href="/admin" className="hover:text-slate-400">
              Admin Console
            </Link>
            <Link href="/#pricing" className="hover:text-slate-400">
              Bandwidth Calculator
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


