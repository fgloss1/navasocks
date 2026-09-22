"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Flag from "@/components/Flag";
import { useSitePreferences } from "@/components/SitePreferences";
import {
  Server,
  Activity,
  Globe,
  Shield,
  X,
  Filter,
  RotateCcw as ResetIcon,
  RefreshCw,
} from "lucide-react";


const DARK_THEME_OVERRIDE = `
  html[data-theme="dark"] #history-page {
    background-color: #07101d !important;
    color: #f1f5f9 !important;
  }

  html[data-theme="dark"] #history-page [class*="bg-white"],
  html[data-theme="dark"] #history-page [class*="bg-slate-50"],
  html[data-theme="dark"] #history-page [class*="bg-slate-100"] {
    background-color: #0e1628 !important;
  }

  html[data-theme="dark"] #history-page [class*="border-slate-200"],
  html[data-theme="dark"] #history-page [class*="border-slate-300"] {
    border-color: #1e293b !important;
  }

  html[data-theme="dark"] #history-page [class*="text-black"],
  html[data-theme="dark"] #history-page [class*="text-slate-900"],
  html[data-theme="dark"] #history-page [class*="text-slate-800"],
  html[data-theme="dark"] #history-page [class*="text-slate-700"],
  html[data-theme="dark"] #history-page [class*="text-slate-600"] {
    color: #cbd5e1 !important;
  }
`;

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
  return code.split("").map((c) => 
    String.fromCodePoint(127397 + c.charCodeAt(0))
  ).join("");
}
function LocalHistorySidebar({ 
  item, 
  onClose 
}: { 
  item: HistoryItem | null; 
  onClose: () => void 
}) {
  const { dark } = useSitePreferences();
  const [activeSubTab, setActiveSubTab] =
    useState<"info" | "geo" | "blacks">("info");
  const [refundClock, setRefundClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRefundClock(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);
if (!item) {
    return (
      <div className={`border rounded-2xl p-8 text-center text-xs font-mono h-full flex flex-col justify-center items-center min-h-[450px] ${
        dark ? "bg-[#0e1628] border-cyan-900/40 text-slate-500" : "bg-white border-slate-300 text-slate-600"
      }`}>
        <Server className="w-8 h-8 mb-3 animate-pulse text-slate-400 dark:text-slate-700" />
        <p className={`font-black uppercase ${dark ? "text-slate-400" : "text-slate-900"}`}>PROXY INSPECTOR</p>
        <p className={`text-[10px] mt-2 normal-case font-sans ${dark ? "text-slate-600" : "text-slate-700 font-medium"}`}>
          Select a proxy row to inspect its endpoint, location, network and access details.
        </p>
      </div>
    );
  }

  const host = item.publicAccessHost || item.accessHost || item.ip;
  const port = item.publicAccessPort || item.accessPort || item.port;
  const username = item.accessUsername || "d390";
  const password = "d390";
  const fullAccessString = `${username}:${password}@${host}:${port}`;

  const purchasedAt = new Date(item.purchasedAt).getTime();
  const refundRemainingMs = Number.isFinite(purchasedAt)
    ? Math.max(0, purchasedAt + 10 * 60 * 1000 - refundClock)
    : 0;

  const refundOpen = refundRemainingMs > 0;
  return (
    <div className={`border rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 ${
      dark ? "bg-[#0e1628] border-cyan-900/40" : "bg-white border-slate-300"
    }`}>
      <div className={`grid grid-cols-3 text-center text-[11px] font-black tracking-wider border-b ${
        dark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        <button type="button" onClick={() => setActiveSubTab("info")} className={`py-3 transition border-b-2 uppercase ${activeSubTab === "info" ? "text-cyan-600 dark:text-cyan-400 border-cyan-500 dark:border-cyan-400 bg-slate-100 dark:bg-cyan-950/10" : "text-slate-500 dark:text-slate-400 border-transparent"}`}>INFO</button>
        <button type="button" onClick={() => setActiveSubTab("geo")} className={`py-3 transition border-b-2 uppercase ${activeSubTab === "geo" ? "text-cyan-600 dark:text-cyan-400 border-cyan-500 dark:border-cyan-400 bg-slate-100 dark:bg-cyan-950/10" : "text-slate-500 dark:text-slate-400 border-transparent"}`}>GEO</button>
        <button type="button" onClick={() => setActiveSubTab("blacks")} className={`py-3 transition border-b-2 uppercase ${activeSubTab === "blacks" ? "text-cyan-600 dark:text-cyan-400 border-cyan-500 dark:border-cyan-400 bg-slate-100 dark:bg-cyan-950/10" : "text-slate-500 dark:text-slate-400 border-transparent"}`}>BLACKS</button>
      </div>

      <div className="p-3 sm:p-4 space-y-4 text-xs">
        {activeSubTab === "info" && (
          <div className="space-y-3.5">
            <div className={`rounded-xl border p-3 space-y-1.5 ${dark ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-[10px] font-mono font-black uppercase tracking-wider ${dark ? "text-cyan-400" : "text-cyan-700"}`}>SOCKS5 PROXY</p>
              <div className={`flex items-start gap-2 border p-2 rounded text-[11px] font-mono select-all break-all leading-normal ${dark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-800 font-bold"}`}>
                <span>{fullAccessString}</span>
              </div>
            </div>

            <div className={`rounded-xl border p-3 space-y-2.5 divide-y ${dark ? "border-slate-800 bg-slate-950/20 divide-slate-800/40" : "border-slate-200 bg-slate-50/50 divide-slate-200"}`}>
              <div className="flex items-center gap-2 pt-0">
                <span className="w-4 h-3.5 inline-block overflow-hidden rounded-sm"><Flag code={item.ct || item.countryCode || "US"} /></span>
                <span className={`font-mono font-black uppercase ${dark ? "text-slate-200" : "text-slate-900"}`}>{item.ct || item.countryCode || "US"}</span>
                <span className={`text-xs font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>, {item.ip}</span>
              </div>

              <div className={`grid grid-cols-2 pt-2 gap-y-2 font-bold ${dark ? "text-slate-300" : "text-slate-700"}`}>
                <span className="text-slate-400 dark:text-slate-500 font-medium">ID, City, ZIP</span>
                <span className="text-right truncate">{item.id}, {item.city || "Unknown"}, {item.state || "83706"}</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Domain</span>
                <span className="text-right font-mono truncate text-slate-600 dark:text-slate-400">{item.ip.replace(/\./g, "-")}.cpe.sparklight.net</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">ORG</span>
                <span className="text-right truncate">{item.isp || "Sparklight"}</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">ISP</span>
                <span className="text-right truncate">{item.isp || "Sparklight"}</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Zone</span>
                <span className="text-right font-mono text-slate-600 dark:text-slate-400">America/Boise</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Proxy quality</span>
                <span className="text-right text-emerald-600 dark:text-emerald-400 font-black inline-flex items-center justify-end gap-1">5/5 (best!) <span className="text-amber-400">*</span></span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Added</span>
                <span className="text-right">12 days</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">IP Type</span>
                <span className="text-right text-slate-600 dark:text-slate-400">Stable (0 ip changes)</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Type (?)</span>
                <span className="text-right text-cyan-600 dark:text-cyan-400 font-black uppercase">{item.proxyType || "ISP"}</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Ping</span>
                <span className="text-right font-mono">411ms</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Blacklisted</span>
                <span className="text-right font-bold text-slate-500 dark:text-slate-400">No</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Speed</span>
                <span className="text-right font-mono">318k</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">DNS</span>
                <span className="text-right font-mono inline-flex items-center justify-end gap-1"><span className="w-4 h-3 inline-block overflow-hidden rounded-sm"><Flag code={item.ct || item.countryCode || "US"} /></span> <span className="ml-1">172.217.107.152</span></span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">DNS ISP</span>
                <span className="text-right text-slate-600 dark:text-slate-400">Google</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">UDP</span>
                <span className="text-right text-emerald-600 dark:text-emerald-400 font-black">Yes</span>
              </div>
              <div className="grid grid-cols-2 pt-2 gap-y-2 font-bold">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Scamalytics: ~6.00</span>
                <span className="text-right"><a href="#" onClick={(e) => e.preventDefault()} className={`underline ${dark ? "text-cyan-400" : "text-cyan-600"}`}>check \$0.1</a></span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">IPQS: ~45.20</span>
                <span className="text-right"><a href="#" onClick={(e) => e.preventDefault()} className={`underline ${dark ? "text-cyan-400" : "text-cyan-600"}`}>check \$0.25</a></span>
              </div>

              <div className="grid grid-cols-1 pt-2 gap-y-2 font-bold text-slate-700 dark:text-slate-300">
                <div className="flex justify-between items-center"><span className="text-slate-400 dark:text-slate-500">Traffic available</span><span className="font-mono font-black text-slate-900 dark:text-slate-200">{item.trafficText || "3.3 Gb"}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500">Traffic auto refill \$0.24/Gb</span>
                  <div className="flex items-center gap-1.5"><span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${dark ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40" : "text-emerald-700 bg-emerald-50 border border-emerald-200"}`}>On</span><input type="checkbox" defaultChecked className="accent-cyan-500 h-3.5 w-3.5 cursor-pointer" /></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500">Auto renew daily</span>
                  <div className="flex items-center gap-1.5"><span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${dark ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40" : "text-emerald-700 bg-emerald-50 border border-emerald-200"}`}>On</span><input type="checkbox" defaultChecked className="accent-cyan-500 h-3.5 w-3.5 cursor-pointer" /></div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-2.5 space-y-1 ${dark ? "border-slate-800 bg-slate-950/20" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-slate-500"><span>NOTE NOTE</span></div>
              <button type="button" className={`text-[11px] font-mono font-black ${dark ? "text-cyan-400/80" : "text-cyan-600"}`}>[+] add note</button>
            </div>

            <div className="pt-2">
              {refundOpen ? (
                <Link
                  href={`/dashboard?tab=support&reason=refund&ip=${encodeURIComponent(item.ip)}&port=${port}`}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-500 shadow-md"
                >
                  {`ASK REFUND  -  ${Math.ceil(refundRemainingMs / 60000)}m`}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex items-center justify-center rounded-xl bg-slate-200 px-4 py-2.5 text-xs font-black text-slate-500 cursor-not-allowed dark:bg-slate-900 dark:text-slate-500"
                >
                  REFUND EXPIRED
                </button>
              )}
            </div>
          </div>
        )}
        {activeSubTab === "geo" && (
          <div className={`rounded-xl border p-3 space-y-2 text-[11px] font-bold ${
            dark ? "border-slate-800 bg-slate-950/40 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-800"
          }`}>
            <div className="flex justify-between"><span className="text-slate-500 font-medium">Continent</span><span>North America</span></div>
            <div className="flex justify-between"><span className="text-slate-500 font-medium">Country Code</span><span className="font-mono">{item.ct || item.countryCode || "US"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 font-medium">Region Name</span><span>Idaho</span></div>
            <div className="flex justify-between"><span className="text-slate-500 font-medium">City / Township</span><span>{item.city || "Boise"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 font-medium">Postal ZIP Code</span><span className="font-mono">83706</span></div>
          </div>
        )}

        {activeSubTab === "blacks" && (
          <div className={`rounded-xl border p-4 text-center text-[11px] space-y-1 ${
            dark ? "border-slate-800 bg-slate-950/40 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"
          }`}>
            <p className={`font-black uppercase tracking-wider text-[10px] ${dark ? "text-slate-400" : "text-slate-900"}`}>Security Blacklist Status</p>
            <p className="pt-2 leading-relaxed font-bold">This endpoint has zero spam hits and is currently unlisted on CleanTalk or Spamhaus engines.</p>
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
  const { dark } = useSitePreferences();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [filters, setFilters] = useState({
    ip: "", location: "", isp: "", type: "any", online: "any", status: "any"
  });

  const getStatusColorClass = (status?: string | null) => {
    const s = (status || "").toLowerCase().trim();
    if (s.includes("left")) return "text-emerald-700 dark:text-emerald-400 font-black";
    if (s.includes("refunded")) return "text-teal-700 dark:text-teal-500 font-black";
    return "text-slate-600 dark:text-slate-400 font-mono font-bold";
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
            return { ...item, autoRenew: savedState === "true" || !!item.autoRenew };
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
        prevItems.map((item) => item.id === itemId ? { ...item, autoRenew: nextStatus } : item)
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

  useEffect(() => { setCurrentPage(1); }, [filters, pageSize]);
  return (
  <>

    <style
      dangerouslySetInnerHTML={{
        __html: DARK_THEME_OVERRIDE,
      }}
    />

    <div
      id="history-page"
      className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200 ${
        dark
          ? "bg-[#07101d] text-slate-100"
          : "bg-slate-100 text-slate-900"
      }`}
    >
      <Navbar />
      <main className="flex-1 w-full max-w-[1900px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
        <div>
          <p className={`text-[11px] font-mono uppercase tracking-[0.2em] font-black ${dark ? "text-cyan-400" : "text-cyan-700"}`}>NAVA SOCKS Control Plane</p>
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${dark ? "text-white" : "text-black"}`}>Proxy <span className={dark ? "text-cyan-400" : "text-cyan-600"}>History</span></h1>
          <p className={`text-sm mt-1 font-bold ${dark ? "text-slate-400" : "text-slate-700"}`}>Purchased proxies and customer-facing endpoint history.</p>
        </div>

        <div className={`flex gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap border-b pb-px ${dark ? "border-slate-800" : "border-slate-200"}`}>
          {NAV.map((i) => (
            <Link key={i.id} href={i.href} className={`shrink-0 px-3 sm:px-4 py-2.5 text-xs font-black rounded-t-xl border-x border-t transition ${i.id === "history" ? (dark ? "bg-[#0e1628] text-cyan-300 border-cyan-700/50" : "bg-white text-cyan-700 border-slate-200") : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-white"}`}>{i.label}</Link>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
          <div className={`xl:col-span-9 border rounded-2xl overflow-hidden min-w-0 w-full shadow-xl ${dark ? "bg-[#0e1628] border-cyan-900/40" : "bg-white border-slate-300"}`}>
            <div className={`px-3 sm:px-4 py-3 border-b grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 ${dark ? "border-slate-800 bg-slate-950/20" : "border-slate-200 bg-slate-50"}`}>
              <Filter className={dark ? "w-4 h-4 text-cyan-400" : "w-4 h-4 text-cyan-600"} />
              <input value={filters.ip} onChange={(e) => setFilters({ ...filters, ip: e.target.value })} placeholder="IP" className={`w-full sm:w-28 border rounded-lg px-2 py-1.5 text-xs font-mono font-bold outline-none focus:border-cyan-500 ${dark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-black"}`} />
              <input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="Location" className={`w-full sm:w-36 border rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-cyan-500 ${dark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-black"}`} />
              <input value={filters.isp} onChange={(e) => setFilters({ ...filters, isp: e.target.value })} placeholder="ISP" className={`w-full sm:w-36 border rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-cyan-500 ${dark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-black"}`} />
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={`w-full sm:w-auto border rounded-lg px-2 py-1.5 text-xs font-bold outline-none ${dark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-300 text-slate-800"}`}>
                <option value="any">Any type</option><option value="ISP">ISP</option><option value="MOB">MOB</option>
              </select>
              <button type="button" onClick={resetFilters} className="col-span-2 sm:ml-auto text-[11px] text-rose-600 dark:text-rose-400 inline-flex items-center justify-center sm:justify-start gap-1 font-bold"><ResetIcon className="w-3 h-3" /> Reset</button>
            </div>

            <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-3 ${dark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-slate-50/50"}`}>
              <div>
                <h2 className={`text-xs font-black tracking-wider ${dark ? "text-slate-300" : "text-slate-800"}`}>PURCHASED PROXIES</h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">{filteredItems.length} of {items.length} listed</p>
              </div>
              {copied && (
                <div className={`flex max-w-[200px] sm:max-w-[320px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-mono font-bold ${dark ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}><span className="truncate">Copied: {copied}</span></div>
              )}
            </div>

            <div className="w-full overflow-x-auto overscroll-x-contain px-1">
              <table className="min-w-[980px] w-full border-collapse text-left text-[10px] sm:text-[11px] table-fixed whitespace-nowrap">
                <thead className={`text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wide border-b ${dark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                  <tr>
                    <th className="p-3 w-[18%]">IP</th><th className="p-3 w-[15%]">Location</th><th className="p-3 w-[22%]">IP:PORT / COPY</th><th className="p-3 w-[7%]">Type</th>
                    <th className="p-2 w-[7%] text-center">
                      <p className="mb-1 text-[9px] uppercase font-black">Online</p>
                      <select value={filters.online} onChange={(e) => setFilters({...filters, online: e.target.value})} className={`border rounded px-1 py-0.5 text-[10px] outline-none w-full text-center cursor-pointer font-bold ${dark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-300 text-slate-800"}`}><option value="any">Status</option><option value="online">Online</option><option value="offline">Offline</option></select>
                    </th>
                    <th className="p-2 w-[8%] text-center">
                      <p className="mb-1 text-[9px] uppercase font-black">Status</p>
                      <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className={`border rounded px-1 py-0.5 text-[10px] outline-none w-full text-center cursor-pointer font-bold ${dark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-300 text-slate-800"}`}><option value="any">State</option><option value="active">Active</option><option value="expired">Expired</option><option value="refunded">Refunded</option></select>
                    </th>
                    <th className="p-3 w-[11%] text-center">TRAFFIC/PROXY</th><th className="p-3 w-[6%]">BOUGHT</th><th className="p-3 w-[6%] text-right">Price</th><th className="p-3 w-[10%] text-center">AUTORENEW</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={10} className="px-5 py-10 text-center font-mono font-bold text-slate-500">Loading proxy history datasets...</td></tr>}
                  {!loading && error && <tr><td colSpan={10} className="px-5 py-10 text-center font-mono font-bold text-red-500">{error}</td></tr>}
                  {!loading && !error && filteredItems.length === 0 && <tr><td colSpan={10} className="px-5 py-16 text-center font-mono font-bold text-xs text-slate-500">No matching proxy logs found.</td></tr>}

                  {!loading && !error && filteredItems.length > 0 && paginatedItems.map((item) => {
                    const host = item.publicAccessHost || item.accessHost || item.ip;
                    const port = item.publicAccessPort || item.accessPort || item.port;
                    const endpoint = `${host}:${port}`;
                    const isSelected = selectedItem?.id === item.id;
                    const statusDisplay = item.statusText || (item.locked ? "12h left" : "Expired");
                    const trafficDisplay = item.trafficText || "3.3 Gb";

                    return (
                      <tr key={item.id} onClick={() => setSelectedItem(item)} className={`border-t cursor-pointer transition-all duration-150 ${dark ? "border-slate-800/60" : "border-slate-200"} ${isSelected ? (dark ? "bg-cyan-950/30 border-cyan-800/60" : "bg-cyan-50/70 border-cyan-200") : (dark ? "hover:bg-cyan-950/10" : "hover:bg-slate-50")}`}>
                        <td className={`px-3 py-3 font-mono font-black truncate ${dark ? "text-cyan-200" : "text-cyan-700"}`}>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-3 inline-block overflow-hidden rounded-sm shrink-0 select-none"><Flag code={item.ct || item.countryCode || "US"} /></span>
                            <span>{item.ip}</span>
                          </div>
                        </td>
                        <td className={`px-3 py-3 font-bold truncate ${dark ? "text-slate-300" : "text-slate-700"}`}>
                          <span className={dark ? "text-slate-200" : "text-slate-900"}>{item.state || ""}</span>
                          <span className="text-slate-400 ml-1.5"> -  {item.city || "Unknown"}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className={`inline-flex items-center gap-2 rounded border px-2 py-0.5 max-w-full overflow-hidden ${dark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                            <span className={`font-mono text-[11px] select-all truncate ${dark ? "text-emerald-300" : "text-emerald-700 font-black"}`}>{endpoint}</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); void copyEndpoint(item); }} className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black transition ${dark ? "bg-cyan-950 border-cyan-800/60 text-cyan-300 hover:bg-cyan-500/20" : "bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"}`}>COPY</button>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-[10px] font-bold truncate">
                          <span className={`px-1.5 py-0.5 rounded border uppercase ${dark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"}`}>{item.proxyType || (item.provider ? "ISP" : "-")}</span>
                        </td>
                        <td className={`px-3 py-3 text-center font-black text-xs ${item.onlineText?.toLowerCase() === "no" ? "text-rose-500" : (dark ? "text-emerald-400" : "text-emerald-700")}`}>{item.onlineText || "Yes"}</td>
                        <td className={`px-3 py-3 text-center text-xs ${getStatusColorClass(statusDisplay)}`}>{statusDisplay}</td>
                        <td className={`px-3 py-3 text-center text-xs select-none font-black ${dark ? "text-slate-300" : "text-slate-800"}`}>
                          <div className="inline-flex items-center gap-1.5 justify-center w-full">
                            <span className={dark ? "text-cyan-400/80" : "text-cyan-600"} title="Traffic auto-refill active"><RefreshCw className="w-3 h-3" /></span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{trafficDisplay}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-400 text-[10px] font-bold truncate">{item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString() : "-"}</td>
                        <td className={`px-3 py-3 text-right font-mono font-black border-none ${dark ? "text-emerald-400" : "text-emerald-700"}`}>{item.price ? `$${Number(item.price).toFixed(2)}` : "\$0.80"}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-1 justify-center w-full">
                            <input type="checkbox" checked={!!item.autoRenew} onChange={(e) => { e.stopPropagation(); void handleToggleAutoRenew(item.id, !!item.autoRenew); }} className="h-3.5 w-3.5 accent-cyan-500 rounded cursor-pointer transition-all active:scale-90 bg-white border-slate-300 dark:bg-slate-950 dark:border-slate-800" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!loading && !error && filteredItems.length > 0 && (
              <div className={`flex items-center justify-between border-t px-4 py-3 text-xs font-bold ${dark ? "border-slate-800/60 bg-slate-950/10 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                <div className="flex items-center gap-2">
                  <span>proxies per page</span>
                  <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); }} className={`border font-black rounded px-2 py-0.5 outline-none cursor-pointer ${dark ? "bg-slate-950 border-slate-800 text-cyan-400" : "bg-white border-slate-300 text-cyan-700"}`}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1 || loading} className={`rounded-md border px-2.5 py-1 text-[11px] disabled:opacity-40 transition font-bold ${dark ? "border-slate-700 bg-slate-950 text-slate-300" : "border-slate-300 bg-white text-slate-700"}`}>Prev</button>
                  <span className="font-mono">{currentPage} / {Math.max(1, totalPages)}</span>
                  <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || loading} className={`rounded-md border px-2.5 py-1 text-[11px] disabled:opacity-40 transition font-bold ${dark ? "border-slate-700 bg-slate-950 text-slate-300" : "border-slate-300 bg-white text-slate-700"}`}>Next</button>
                </div>
              </div>
            )}
          </div>

          <aside className={`${selectedItem ? "order-first" : "order-last"} xl:order-none xl:col-span-3 min-w-0 w-full xl:sticky xl:top-8 h-fit`}>
            <LocalHistorySidebar item={selectedItem} onClose={() => setSelectedItem(null)} />
          </aside>
        </div>
      </main>
        </div>
  </>
  );
}
