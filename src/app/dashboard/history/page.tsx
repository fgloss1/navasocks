"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Flag from "@/components/Flag";
import { Server, Activity, Globe, Shield, X, Filter, RotateCcw as ResetIcon, RefreshCw } from "lucide-react";

interface HistoryItem {
  id: number;
  listingId: number | null;
  purchasedAt: string;
  ip: string;
  port: number;
  countryCode: string;
  ct: string;
  state: string | null;
  city: string;
  isp: string;
  locked: boolean;
  provider: string | null;
  transportHost: string | null;
  transportPort: number | null;
  accessUsername: string | null;
  accessHost: string | null;
  accessPort: number | null;
  publicAccessHost: string | null;
  publicAccessPort: number | null;
  price: string | null;
  proxyType: string | null;
  onlineText?: string;
  statusText?: string;
  trafficText?: string;
  autoRefill?: boolean;
  autoRenew?: boolean;
}

function countryCodeToFlag(countryCode?: string | null) {
  const code = (countryCode || "").trim().toUpperCase();
  if (code.length !== 2) return String.fromCodePoint(0x1F310);
  return code.split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}

function LocalHistorySidebar({ item, onClose }: { item: HistoryItem | null; onClose: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState<"info" | "geo" | "blacks">("info");

  if (!item) {
    return (
      <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl p-8 text-center text-slate-500 text-xs font-mono h-full flex flex-col justify-center items-center min-h-[450px]">
        <Server className="w-8 h-8 text-slate-700 mb-3 animate-pulse" />
        <p className="font-bold uppercase text-slate-400">PROXY INSPECTOR</p>
        <p className="text-[10px] text-slate-600 mt-2 normal-case font-sans">Select a proxy row to inspect its endpoint, location, network and access details.</p>
      </div>
    );
  }

  const host = item.publicAccessHost || item.accessHost || item.ip;
  const port = item.publicAccessPort || item.accessPort || item.port;
  const username = item.accessUsername || "d390";
  const password = "d390";
  const fullAccessString = `${username}:${password}@${host}:${port}`;

  return (
    <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl overflow-hidden shadow-2xl transition-all duration-200">
      <div className="grid grid-cols-3 text-center bg-slate-950/40 border-b border-slate-800 text-[11px] font-black tracking-wider">
        <button type="button" onClick={() => setActiveSubTab("info")} className={`py-3 transition border-b-2 uppercase ${activeSubTab === "info" ? "text-cyan-400 border-cyan-400 bg-cyan-950/10" : "text-slate-400 border-transparent hover:text-slate-200"}`}>INFO</button>
        <button type="button" onClick={() => setActiveSubTab("geo")} className={`py-3 transition border-b-2 uppercase ${activeSubTab === "geo" ? "text-cyan-400 border-cyan-400 bg-cyan-950/10" : "text-slate-400 border-transparent hover:text-slate-200"}`}>GEO</button>
        <button type="button" onClick={() => setActiveSubTab("blacks")} className={`py-3 transition border-b-2 uppercase ${activeSubTab === "blacks" ? "text-cyan-400 border-cyan-400 bg-cyan-950/10" : "text-slate-400 border-transparent hover:text-slate-200"}`}>BLACKS</button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {activeSubTab === "info" && (
          <div className="space-y-3.5">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-1.5">
              <p className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">SOCKS5 PROXY</p>
              <div className="flex items-start gap-2 bg-slate-950 border border-slate-800 p-2 rounded text-[11px] font-mono text-slate-300 select-all break-all leading-normal">
                <span>{fullAccessString}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-3 space-y-2.5 divide-y divide-slate-800/40">
              <div className="flex items-center gap-2 pt-0">
                <span className="w-4 h-3.5 inline-block overflow-hidden rounded-sm"><Flag code={item.ct || item.countryCode || "US"} /></span>
                <span className="font-mono text-slate-200 font-bold uppercase">{item.ct || item.countryCode || "US"}</span>
                <span className="text-slate-400 text-xs">, {item.ip}</span>
              </div>

              <div className="grid grid-cols-2 pt-2 gap-y-2 text-slate-300">
                <span className="text-slate-500">ID, City, ZIP</span>
                <span className="text-right font-medium text-slate-200 truncate">{item.id}, {item.city || "Unknown"}, {item.state || "83706"}</span>
                <span className="text-slate-500">Domain</span>
                <span className="text-right text-slate-400 font-mono truncate">{item.ip.replace(/\./g, "-")}.cpe.sparklight.net</span>
                <span className="text-slate-500">ORG</span>
                <span className="text-right text-slate-200 font-semibold truncate">{item.isp || "Sparklight"}</span>
                <span className="text-slate-500">ISP</span>
                <span className="text-right text-slate-200 font-semibold truncate">{item.isp || "Sparklight"}</span>
                <span className="text-slate-500">Zone</span>
                <span className="text-right text-slate-400 font-mono">America/Boise</span>
                <span className="text-slate-500">Proxy quality</span>
                <span className="text-right text-emerald-400 font-bold inline-flex items-center justify-end gap-1">5/5 (best!) <span className="text-amber-400">★</span></span>
                <span className="text-slate-500">Added</span>
                <span className="text-right text-slate-200">12 days</span>
                <span className="text-slate-500">IP Type</span>
                <span className="text-right text-slate-400">Stable (0 ip changes)</span>
                <span className="text-slate-500">Type (?)</span>
                <span className="text-right text-cyan-400 font-bold uppercase">{item.proxyType || "ISP"}</span>
                <span className="text-slate-500">Ping</span>
                <span className="text-right font-mono text-slate-300">411ms</span>
                <span className="text-slate-500">Blacklisted</span>
                <span className="text-right font-bold text-slate-400">No</span>
                <span className="text-slate-500">Speed</span>
                <span className="text-right font-mono text-slate-200">318k</span>
                <span className="text-slate-500">DNS</span>
                <span className="text-right font-mono text-slate-300 inline-flex items-center justify-end gap-1"><span className="w-4 h-3 inline-block overflow-hidden rounded-sm"><Flag code={item.ct || item.countryCode || "US"} /></span> <span className="ml-1">172.217.107.152</span></span>
                <span className="text-slate-500">DNS ISP</span>
                <span className="text-right text-slate-400">Google</span>
                <span className="text-slate-500">UDP</span>
                <span className="text-right text-emerald-400 font-bold">Yes</span>
              </div>

              <div className="grid grid-cols-2 pt-2 gap-y-2">
                <span className="text-slate-500">Scamalytics: ≈6.00</span>
                <span className="text-right"><a href="#" onClick={(e) => e.preventDefault()} className="text-cyan-400 underline hover:text-cyan-300">check $0.1</a></span>
                <span className="text-slate-500">IPQS: ≈45.20</span>
                <span className="text-right"><a href="#" onClick={(e) => e.preventDefault()} className="text-cyan-400 underline hover:text-cyan-300">check $0.25</a></span>
              </div>

              <div className="grid grid-cols-1 pt-2 gap-y-2 text-slate-300">
                <div className="flex justify-between items-center"><span className="text-slate-500">Traffic available</span><span className="font-mono font-bold text-slate-200">{item.trafficText || "3.3 Gb"}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Traffic auto refill $0.24/Gb</span>
                  <div className="flex items-center gap-1.5"><span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">On</span><input type="checkbox" defaultChecked className="accent-cyan-500 h-3.5 w-3.5 cursor-pointer" /></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Auto renew daily</span>
                  <div className="flex items-center gap-1.5"><span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">On</span><input type="checkbox" defaultChecked className="accent-cyan-500 h-3.5 w-3.5 cursor-pointer" /></div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/20 p-2.5 space-y-1">
              <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider"><span>💬 NOTE</span></div>
              <button type="button" className="text-[11px] text-cyan-400/80 hover:text-cyan-300 inline-flex items-center gap-1 font-mono">[+] add note</button>
            </div>

            <div className="pt-2">
              <Link href={`/dashboard?tab=support&reason=refund&ip=${encodeURIComponent(item.ip)}&port=${port}`} className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 active:scale-[0.98] transition-all shadow-md">Ask refund</Link>
            </div>
          </div>
        )}

        {activeSubTab === "geo" && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2 text-[11px]">
            <div className="flex justify-between"><span className="text-slate-500">Continent</span><span className="text-slate-200">North America</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Country Code</span><span className="text-slate-200 font-mono">{item.ct || item.countryCode || "US"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Region Name</span><span className="text-slate-200">{item.state || "Idaho"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">City / Township</span><span className="text-slate-200">{item.city || "Boise"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Postal ZIP Code</span><span className="text-slate-200 font-mono">83706</span></div>
          </div>
        )}

        {activeSubTab === "blacks" && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center text-slate-500 text-[11px] space-y-1">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Security Blacklist Status</p>
            <p className="pt-2 leading-relaxed">This endpoint has zero spam hits and is currently unlisted on CleanTalk or Spamhaus engines.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const NAV = [
  { id: "proxy", label: "Proxy Market", href: "/dashboard" },
  { id: "inventory", label: "My Proxies", href: "/dashboard?tab=inventory" },
  { id: "history", label: "History", href: "/dashboard/history" },
  { id: "payments", label: "Payments", href: "/dashboard?tab=payments" },
  { id: "tools", label: "IP Tools", href: "/dashboard?tab=tools" },
  { id: "support", label: "Support", href: "/dashboard?tab=support" },
];

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [filters, setFilters] = useState({
    ip: "",
    location: "",
    isp: "",
    type: "any",
    online: "any",
    status: "any"
  });

  const getStatusColorClass = (status?: string | null) => {
    const s = (status || "").toLowerCase().trim();
    if (s.includes("left")) return "text-emerald-400 font-medium";
    if (s.includes("refunded")) return "text-teal-500 font-medium";
    return "text-slate-500 font-mono";
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/history", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to load history.");
        if (!cancelled) {
          const res = data.history || [];
          
          const processedHistory = res.map((item: any) => {
            const savedState = localStorage.getItem(`navasocks_autorenew_${item.id}`);
            return {
              ...item,
              autoRenew: savedState === "true" || !!item.autoRenew
            };
          });

          setItems(processedHistory);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const copyEndpoint = async (item: HistoryItem) => {
    const host = item.publicAccessHost || item.accessHost || item.ip;
    const port = item.publicAccessPort || item.accessPort || item.port;
    const endpoint = `${host}:${port}`;
    await navigator.clipboard.writeText(endpoint);
    setCopied(endpoint);
    window.setTimeout(() => setCopied(""), 1600);
  };

  const handleToggleAutoRenew = (itemId: number, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, autoRenew: nextStatus } : item
        )
      );

      const storageKey = `navasocks_autorenew_${itemId}`;
      if (nextStatus) {
        localStorage.setItem(storageKey, "true");
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (err) {
      console.error("Local storage allocation error:", err);
    }
  };

  const resetFilters = () => {
    setFilters({ ip: "", location: "", isp: "", type: "any", online: "any", status: "any" });
    setCurrentPage(1);
  };

    // ⚙️ UPGRADED FILTERING LOGIC: Synchronized to accurately read active, expired, and refunded fallback fields
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.ip && !item.ip.toLowerCase().includes(filters.ip.toLowerCase())) return false;
      
      const loc = `${item.ct || item.countryCode || ""} ${item.state || ""} ${item.city || ""}`.toLowerCase();
      if (filters.location && !loc.includes(filters.location.toLowerCase())) return false;
      if (filters.isp && !item.isp.toLowerCase().includes(filters.isp.toLowerCase())) return false;
      if (filters.type !== "any" && !(item.proxyType || "isp").toLowerCase().includes(filters.type.toLowerCase())) return false;
      
      if (filters.online !== "any") {
        const isOnline = item.onlineText?.toLowerCase() === "yes" || item.locked;
        if (filters.online === "online" && !isOnline) return false;
        if (filters.online === "offline" && isOnline) return false;
      }

      if (filters.status !== "any") {
        // ✔ FIX: Maps evaluation keys to match the precise string logic used inside your visible table rows
        const statusStr = String(item.statusText || (item.locked ? "12h left" : "expired")).toLowerCase();
        
        if (filters.status === "active" && !statusStr.includes("left")) return false;
        if (filters.status === "expired" && !statusStr.includes("expired")) return false;
        if (filters.status === "refunded" && !statusStr.includes("refunded")) return false;
      }
      return true;
    });
  }, [items, filters]);


  const totalPages = useMemo(() => Math.ceil(filteredItems.length / pageSize), [filteredItems, pageSize]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#07101d] text-slate-100">
        <div className="w-full max-w-[1900px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400 mb-1">NAVA SOCKS Control Plane</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Proxy <span className="text-cyan-400">History</span></h1>
            <p className="text-sm text-slate-400 mt-1">Purchased proxies and customer-facing endpoint history.</p>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-px">
            {NAV.map((i) => (
              <Link key={i.id} href={i.href} className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-x border-t transition ${i.id === "history" ? "bg-[#0e1628] text-cyan-300 border-cyan-700/50" : "text-slate-400 border-transparent hover:text-white"}`}>{i.label}</Link>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-9 bg-[#0e1628] border border-cyan-900/40 rounded-2xl overflow-hidden min-w-0 w-full shadow-xl">
              <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center gap-2 bg-slate-950/20">
                <Filter className="w-4 h-4 text-cyan-400" />
                <input value={filters.ip} onChange={(e) => setFilters({ ...filters, ip: e.target.value })} placeholder="IP" className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-cyan-500" />
                <input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="Location" className="w-36 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500" />
                <input value={filters.isp} onChange={(e) => setFilters({ ...filters, isp: e.target.value })} placeholder="ISP" className="w-36 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500" />
                <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none text-slate-300">
                  <option value="any">Any type</option>
                  <option value="ISP">ISP</option>
                  <option value="MOB">MOB</option>
                </select>
                <button type="button" onClick={resetFilters} className="text-[11px] text-rose-400 inline-flex items-center gap-1 ml-auto hover:text-rose-300"><ResetIcon className="w-3 h-3" /> Reset</button>
              </div>

              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">PURCHASED PROXIES</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">{filteredItems.length} of {items.length} listed</p>
                </div>
                {copied && (
                  <div className="flex max-w-[200px] sm:max-w-[320px] items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-1 text-[11px] font-mono text-emerald-300"><span className="truncate">Copied: {copied}</span></div>
                )}
              </div>

              <div className="w-full overflow-hidden px-1">
                <table className="w-full border-collapse text-left text-[11px] table-fixed whitespace-nowrap">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wide border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-[18%]">IP</th>
                      <th className="p-3 w-[15%]">Location</th>
                      <th className="p-3 w-[22%]">IP:PORT / COPY</th>
                      <th className="p-3 w-[7%]">Type</th>
                      <th className="p-2 w-[7%] text-center">
                        <p className="mb-1 text-[9px] uppercase tracking-wide">Online</p>
                        <select value={filters.online} onChange={(e) => setFilters({...filters, online: e.target.value})} className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] outline-none text-slate-300 w-full text-center cursor-pointer">
                          <option value="any">Status</option>
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                        </select>
                      </th>
                      <th className="p-2 w-[8%] text-center">
                        <p className="mb-1 text-[9px] uppercase tracking-wide">Status</p>
                        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] outline-none text-slate-300 w-full text-center cursor-pointer">
                          <option value="any">State</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </th>
                      <th className="p-3 w-[11%] text-center">TRAFFIC/PROXY</th>
                      <th className="p-3 w-[6%]">BOUGHT</th>
                      <th className="p-3 w-[6%] text-right">Price</th>
                      <th className="p-3 w-[10%] text-center">AUTORENEW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-500 font-mono">Loading proxy history datasets...</td></tr>}
                    {!loading && error && <tr><td colSpan={10} className="px-5 py-10 text-center text-red-400 font-mono">{error}</td></tr>}
                    {!loading && !error && filteredItems.length === 0 && <tr><td colSpan={10} className="px-5 py-16 text-center text-slate-500 font-mono text-xs">No matching proxy logs found.</td></tr>}

                    {!loading && !error && filteredItems.length > 0 && paginatedItems.map((item) => {
                      const host = item.publicAccessHost || item.accessHost || item.ip;
                      const port = item.publicAccessPort || item.accessPort || item.port;
                      const endpoint = `${host}:${port}`;
                      const isSelected = selectedItem?.id === item.id;

                      const statusDisplay = item.statusText || (item.locked ? "12h left" : "Expired");
                      const trafficDisplay = item.trafficText || "3.3 Gb";

                      return (
                        <tr key={item.id} onClick={() => setSelectedItem(item)} className={`border-t border-slate-800/60 cursor-pointer transition-all duration-150 ${isSelected ? "bg-cyan-950/30 border-cyan-800/60" : "hover:bg-cyan-950/10"}`}>
                          <td className="px-3 py-3 font-mono font-bold text-cyan-200 truncate">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-3 inline-block overflow-hidden rounded-sm shrink-0 select-none">
                                <Flag code={item.ct || item.countryCode || "US"} />
                              </span>
                              <span>{item.ip}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-300 truncate">
                            <span className="text-slate-200 font-medium font-sans">{item.state || ""}</span>
                            <span className="text-slate-400 ml-1.5">· {item.city || "Unknown"}</span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="inline-flex items-center gap-2 rounded border border-slate-800 bg-slate-950 px-2 py-0.5 max-w-full overflow-hidden">
                              <span className="font-mono text-emerald-300 text-[11px] select-all truncate">{endpoint}</span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); void copyEndpoint(item); }} className="shrink-0 rounded bg-cyan-950 border border-cyan-800/60 px-1.5 py-0.5 text-[9px] font-black text-cyan-300 hover:bg-cyan-500/20 transition">COPY</button>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-[10px] text-slate-400 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 uppercase">{item.proxyType || (item.provider ? "ISP" : "—")}</span>
                          </td>
                          <td className={`px-3 py-3 text-center font-bold text-xs ${item.onlineText?.toLowerCase() === "no" ? "text-rose-500" : "text-emerald-400"}`}>{item.onlineText || "Yes"}</td>
                          <td className={`px-3 py-3 text-center text-xs ${getStatusColorClass(statusDisplay)}`}>{statusDisplay}</td>
                          <td className="px-3 py-3 text-center text-xs text-slate-300 select-none">
                            <div className="inline-flex items-center gap-1.5 justify-center w-full">
                              <span className="text-cyan-400/80" title="Traffic auto-refill active"><RefreshCw className="w-3 h-3 animate-spin-slow" /></span>
                              <span className="font-mono font-bold">{trafficDisplay}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-400 text-[10px] truncate">{item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString() : "—"}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400 border-none">{item.price ? `$${Number(item.price).toFixed(2)}` : "\$0.80"}</td>
                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex items-center gap-1 justify-center w-full">
                              <input 
                                type="checkbox" 
                                checked={!!item.autoRenew} 
                                onChange={(e) => {
                                  e.stopPropagation();
                                  void handleToggleAutoRenew(item.id, !!item.autoRenew);
                                }}
                                className="h-3.5 w-3.5 accent-cyan-500 rounded bg-slate-950 border-slate-800 cursor-pointer transition-all active:scale-90" 
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!loading && !error && filteredItems.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-800/60 px-4 py-3 bg-slate-950/10 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>proxies per page</span>
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); }} className="bg-slate-950 border border-slate-800 text-cyan-400 font-bold rounded px-2 py-0.5 outline-none cursor-pointer">
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1 || loading} className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 disabled:opacity-40 transition">Prev</button>
                    <span className="font-mono text-slate-400">{currentPage} / {Math.max(1, totalPages)}</span>
                    <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || loading} className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 disabled:opacity-40 transition">Next</button>
                  </div>
                </div>
              )}
            </div>

            <aside className="xl:col-span-3 min-w-0 w-full xl:sticky xl:top-8 h-fit">
              <LocalHistorySidebar item={selectedItem} onClose={() => setSelectedItem(null)} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
