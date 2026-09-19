"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Flag from "@/components/Flag";
import PaymentModal from "@/components/PaymentModal";
import { US_STATES, REGIONS } from "@/lib/geo";
import {
  ShoppingCart,
    MessageCircle,Lock,
  Unlock,
  Filter,
  Star,
  User,
  Building2,
  Smartphone,
  RotateCcw,
  X,
  Zap,
  Globe,
  Server,
  Copy,
  CheckCircle,
  CheckCircle2,
  Wallet,
  Activity,
  Shield,
  MapPin,
} from "lucide-react";

interface Listing {
  id: number;
  ipMasked: string;
  ipFull: string;
  port: number;
  domain: string;
  country: string;
  countryCode: string;
  region: string;
  state: string;
  city: string;
  isp: string;
  zip: string;
  speedLabel: string;
  speedKbps: number;
  ping: number;
  proxyType: string;
  addedDays: number;
  price: string;
  status: string;
}

interface ListingDetails {
  listingId: number;
  location: {
    country: string | null;
    countryCode: string | null;
    region: string | null;
    state: string | null;
    city: string | null;
    zip: string | null;
    zone: string | null;
  };
  network: {
    org: string | null;
    isp: string | null;
    domain: string | null;
    reverseDns: string | null;
    hostname: string | null;
    ipType: string | null;
  };
  risk: {
    blacklisted: boolean | null;
    scamalytics: number | null;
    ipqs: number | null;
  };
  quality?: {
    proxyQuality: string | null;
  };
  traffic?: {
    includedGb: string | null;
    usedGb: string | null;
    protocol: string | null;
  };
}

interface Owned {
  id: number;
  ip: string;
  port: number;
  countryCode: string;
  city: string;
  isp: string;
  locked: boolean;
  statusText?: string | null;
  state?: string | null;
  autoRenew?: boolean;
  accessUsername?: string | null;
  accessHost?: string | null;
  accessPort?: number | null;
  publicAccessHost?: string | null;
  publicAccessPort?: number | null;
  createdAt?: string;
}

interface UserProfile {
  id: number;
  username?: string;
  email: string;
  name: string;
  role: string;
  balance: number;
}



/// 🇺🇸 ROBUST STATE FLAG MATRIX: Maps cities directly to state assets with an automatic native component fallback
function RenderStateFlag({ stateCode, city }: { stateCode?: string | null; city?: string | null }) {
  const cleanCity = (city || "").trim().toLowerCase();

  // Strict mapping from your available dashboard cities to State FlagCDN sub-entity endpoints
  const cityToStateFlag: Record<string, string> = {
    "miami": "us-fl",      // Florida
    "austin": "us-tx",     // Texas
    "denver": "us-co",     // Colorado
    "chicago": "us-il",    // Illinois
    "newark": "us-nj",     // New Jersey
    "bristow": "us-va",    // Virginia
    "santee": "us-ca",     // California (Santee, CA)
    "union": "us-nj"       // New Jersey (Union, NJ)
  };

  const targetAsset = cityToStateFlag[cleanCity];

  // 🛡️ FALLBACK SAFETY: If the city isn't in the mapping, instantly render your native workspace vector country component
  if (!targetAsset) {
    return <Flag code="US" />;
  }

  return (
    <img
      src={`https://flagcdn.com/${targetAsset}.png`}
      alt="State Flag"
      className="w-4 h-3 object-cover rounded-sm border border-slate-800/40 shadow-sm inline-block shrink-0 align-middle select-none"
      onError={(e) => {
        // Safe runtime element fallback in case the external CDN suffers a network timeout drop
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
      }}
    />
  );
}

const TABS = [
  { id: "proxy", label: "Proxy Market" },
  { id: "inventory", label: "My Proxies" },
  { id: "history", label: "History" },
  { id: "payments", label: "Payments" },
  { id: "tools", label: "IP Tools" },

  { id: "support", label: "Support" },
];

function shortenIspName(value: string): string {
  const isp = (value || "").trim();

  if (!isp) {
    return "-";
  }

  const replacements: Array<[RegExp, string]> = [
    [/\bCommunications?\b/gi, "Comm."],
    [/\bTelecommunications\b/gi, "Telco."],
    [/\bCommunication\b/gi, "Comm."],
    [/\bCable Communications\b/gi, "Cable"],
    [/\bCable Systems?\b/gi, "Cable"],
    [/\bInternet Services?\b/gi, "Internet"],
    [/\bNetwork Services?\b/gi, "Network"],
    [/\bWireless Communications?\b/gi, "Wireless"],
    [/\bTelecom(?:munications)?\b/gi, "Telco."],
    [/\bCorporation\b/gi, "Corp."],
    [/\bIncorporated\b/gi, "Inc."],
    [/\bCompany\b/gi, "Co."],
    [/\bServices\b/gi, "Svc."],
    [/\bTechnologies\b/gi, "Tech."],
    [/\bTechnology\b/gi, "Tech."],
    [/\bHoldings\b/gi, "Hldgs."],
    [/\bEnterprises\b/gi, "Ent."],
  ];

  let shortened = isp;

  for (const [pattern, replacement] of replacements) {
    shortened = shortened.replace(pattern, replacement);
  }

  shortened = shortened.replace(/\s{2,}/g, " ").trim();

  if (shortened.length > 24) {
    const words = shortened.split(" ");
    const compact = words
      .map((word) => word.length > 11 ? `${word.slice(0, 10)}.` : word)
      .join(" ");

    shortened = compact;
  }

  return shortened;
}
const REFUNDS_ENABLED = false;

function DashboardInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "proxy";

  const [user, setUser] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [owned, setOwned] = useState<Owned[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("usa");
  const [stateFilter, setStateFilter] = useState("");
  const [filters, setFilters] = useState({
    ip: "",
    domain: "",
    state: "",
    city: "",
    isp: "",
    zip: "",
    type: "any",
    added: "any",
  });
  const [sort, setSort] = useState("added");
  const [cart, setCart] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [refundProxy, setRefundProxy] = useState<Owned | null>(null);
  const [refundReason, setRefundReason] = useState("proxy_not_browsing");
  const [refundDescription, setRefundDescription] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundClock, setRefundClock] = useState(Date.now());
  const [detailTab, setDetailTab] = useState<"info" | "geo" | "blacklists">("info");
  const [buying, setBuying] = useState(false);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [toolInput, setToolInput] = useState("");
  const [toolResult, setToolResult] = useState("");

  const [supportCategory, setSupportCategory] = useState("General");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportNotice, setSupportNotice] = useState("");
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportHistoryLoading, setSupportHistoryLoading] = useState(false);
  const [selectedSupportTicketId, setSelectedSupportTicketId] = useState<number | null>(null);
  const [supportConversation, setSupportConversation] = useState<any[]>([]);
  const [supportConversationLoading, setSupportConversationLoading] = useState(false);
  const [supportReply, setSupportReply] = useState("");
  const [supportReplySubmitting, setSupportReplySubmitting] = useState(false);
  const [listingDetails, setListingDetails] = useState<ListingDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [revealedIp, setRevealedIp] = useState("");
  const [revealedIps, setRevealedIps] = useState<Record<number, string>>({});
  const [revealingIp, setRevealingIp] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        region,
        state: filters.state || stateFilter,
        ip: filters.ip,
        domain: filters.domain,
        city: filters.city,
        isp: filters.isp,
        zip: filters.zip,
        type: filters.type,
        sort,
        page: String(currentPage),
        pageSize: String(pageSize),
      });
      const [listRes, subRes] = await Promise.all([
        fetch(`/api/listings?${qs.toString()}`),
        fetch("/api/subscriptions"),
      ]);
      const data = await listRes.json();
      const subs = await subRes.json();
      setListings(data.listings || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setOwned(data.owned || []);
      if (data.user) setUser(data.user);
      if (subs?.transactions) setTransactions(subs.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [region, stateFilter, filters.ip, filters.domain, filters.city, filters.isp, filters.zip, filters.type, sort, currentPage, pageSize]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRefundClock(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

    useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [region, stateFilter, filters.ip, filters.domain, filters.city, filters.isp, filters.zip, filters.type, sort]);

  useEffect(() => {
  let cancelled = false;

  if (!selectedListing) {
    setListingDetails(null);
    setDetailsLoading(false);
    return () => {
      cancelled = true;
    };
  }

  // Immediately seed the panel from data already present in the listing row.
  // External enrichment continues in the background.
  setListingDetails({
    listingId: selectedListing.id,
    location: {
      country: selectedListing.country || null,
      countryCode: selectedListing.countryCode || null,
      region: selectedListing.region || null,
      state: selectedListing.state || null,
      city: selectedListing.city || null,
      zip: selectedListing.zip || null,
      zone: null,
    },
    network: {
      org: null,
      isp: selectedListing.isp || null,
      domain: selectedListing.domain || null,
      reverseDns: null,
      hostname: null,
      ipType: null,
    },
    risk: {
      blacklisted: null,
      scamalytics: null,
      ipqs: null,
    },
  });

      setRevealedIp("");
      setRevealingIp(false);
  setDetailsLoading(true);

  void fetch(`/api/listings/details?id=${selectedListing.id}`, {
    cache: "no-store",
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Details request failed: ${res.status}`);
      }

      const contentType = (res.headers.get("content-type") || "").toLowerCase();

      if (!contentType.includes("application/json")) {
        throw new Error(`Unexpected details response type: ${contentType || "missing"}`);
      }

      return res.json();
    })
    .then((data: ListingDetails) => {
      if (!cancelled) {
        setListingDetails(data);
      }
    })
    .catch((error) => {
      console.error("Listing details error:", error);
    })
    .finally(() => {
      if (!cancelled) {
        setDetailsLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, [selectedListing?.id]);

  const addToCart = (row: Listing) => {
    if (cart.find((c) => c.id === row.id)) return;
    setCart((prev) => [...prev, row]);
  };

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((c) => c.id !== id));
  const cartTotal = cart.reduce((s, c) => s + parseFloat(c.price), 0);

  const revealIp = async (listingId?: number) => {
    const targetId = listingId ?? selectedListing?.id;

    if (!targetId || revealingIp) return;
    if (revealedIps[targetId]) return;

    setRevealingIp(true);
    setNotice("");

    try {
      const res = await fetch("/api/listings/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Unable to reveal IP.");
      }

      const fullIp = String(data?.ip || "");

      setRevealedIps((prev) => ({
        ...prev,
        [targetId]: fullIp,
      }));

      if (selectedListing?.id === targetId) {
        setRevealedIp(fullIp);
      }

      setNotice("IP revealed. $0.05 charged.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to reveal IP.");
    } finally {
      setRevealingIp(false);
    }
  };

  const checkout = async (ids?: number[]) => {
    const target = ids || cart.map((c) => c.id);
    if (target.length === 0) return;
    setBuying(true);
    setNotice("");
    try {
      const res = await fetch("/api/listings/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || "Purchase failed");
      } else {
        setOwned(data.owned || []);
        if (typeof data.balance === "number") {
          setUser((u) => (u ? { ...u, balance: data.balance } : u));
        }
        setCart((prev) => prev.filter((c) => !target.includes(c.id)));
        setNotice(`Provisioned ${data.purchased?.length || target.length} NAVA SOCKS endpoint(s)`);
        setSelectedListing(null);
        setListingDetails(null);
        setDetailTab("info");
        load();
      }
    } catch {
      setNotice("Purchase failed");
    } finally {
      setBuying(false);
    }
  };

  const toggleLock = async (item: Owned) => {
    const res = await fetch("/api/listings/owned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, locked: !item.locked }),
    });
    const data = await res.json();
    if (data.owned) setOwned(data.owned);
  };

  const copyOwned = (item: Owned) => {
    const host = item.publicAccessHost || item.accessHost || item.ip;
    const port = item.publicAccessPort || item.accessPort || item.port;
    const endpoint = host + ":" + port;

    navigator.clipboard.writeText(endpoint);
    setCopied(endpoint);
    setTimeout(() => setCopied(""), 1600);
  };

  const submitRefundRequest = async () => {
    if (!refundProxy || refundSubmitting) return;

    const description = refundDescription.trim();

    if (description.length < 10) {
      setNotice("Please describe the proxy problem in at least 10 characters.");
      return;
    }

    setRefundSubmitting(true);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownedProxyId: refundProxy.id,
          reason: refundReason,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice(data.error || "Unable to create refund request.");
        return;
      }

      setRefundProxy(null);
      setRefundDescription("");
      setRefundReason("proxy_not_browsing");
      setNotice(
        data.ticket?.id
          ? `Refund request #${data.ticket.id} created.`
          : "Refund request created."
      );
    } catch {
      setNotice("Unable to create refund request.");
    } finally {
      setRefundSubmitting(false);
    }
  };

  const getRefundRemainingMs = (item: Owned) => {
    if (!item.createdAt) return 0;

    const purchasedAt = new Date(item.createdAt).getTime();
    if (!Number.isFinite(purchasedAt)) return 0;

    return Math.max(0, purchasedAt + 10 * 60 * 1000 - refundClock);
  };

  const createSupportTicket = async () => {
    const subject = supportSubject.trim();
    const message = supportMessage.trim();

    if (!subject || !message) {
      setSupportNotice("Subject and message are required.");
      return;
    }

    setSupportSubmitting(true);
    setSupportNotice("");

    try {
      const response = await fetch("/api/support/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: supportCategory,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSupportNotice(
          data?.error || "Unable to create support ticket."
        );
        return;
      }

      setSupportSubject("");
      setSupportMessage("");
      setSupportCategory("General");

      setSupportNotice(
        data?.ticket?.id
          ? `Ticket #${data.ticket.id} created successfully.`
          : "Ticket created successfully."
      );
    } catch (error) {
      console.error("Support ticket error:", error);
      setSupportNotice("Unable to create support ticket.");
    } finally {
      setSupportSubmitting(false);
    }
  };
       // ⚙️ Auto-fill proxy refund parameters when navigating from the History page
  useEffect(() => {
    const isRefund = searchParams.get("reason") === "refund";
    const badIp = searchParams.get("ip");
    const badPort = searchParams.get("port");

    if (isRefund && badIp) {
      setSupportCategory("Proxy");
      setSupportSubject("Refund Request: Bad Proxy IP " + badIp);
      setSupportMessage(
        "Hello Support Team,\n\nI am requesting a refund for this proxy instance because it appears to be dead/offline:\n\nProxy IP: " + badIp + "\nPort Allocation: " + (badPort || "N/A") + "\n\nPlease review this transaction's logs. Thank you."
      );
    }
  }, [searchParams]);

  const loadSupportTickets = async () => {
    setSupportHistoryLoading(true);
    setSupportNotice("");

    try {
      const response = await fetch("/api/support/create", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setSupportNotice(data?.error || "Unable to load support tickets.");
        return;
      }

      setSupportTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch (error) {
      console.error("Load support tickets error:", error);
      setSupportNotice("Unable to load support tickets.");
    } finally {
      setSupportHistoryLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({ ip: "", domain: "", state: "", city: "", isp: "", zip: "", type: "any", added: "any" });
    setStateFilter("");
  };

  const visibleListings = useMemo(() => {
    return listings.filter((row) => {
      if (filters.state && !row.state.toLowerCase().includes(filters.state.toLowerCase())) return false;
      if (filters.added === "7" && row.addedDays > 7) return false;
      if (filters.added === "30" && row.addedDays > 30) return false;
      return true;
    });
  }, [listings, filters.state, filters.added]);

  const regionMeta = REGIONS.find((r) => r.id === region);

  useEffect(() => {
    if (tab !== "support") {
      return;
    }

    void loadSupportTickets();
  }, [tab]);
  return (
    <div className="min-h-screen bg-[#080d19] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/3 w-[520px] h-[280px] bg-cyan-600/10 blur-3xl rounded-full" />
          <div className="absolute top-40 right-0 w-[380px] h-[280px] bg-blue-700/10 blur-3xl rounded-full" />
        </div>

        <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400 mb-1">NAVA SOCKS Control Plane</p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Proxy Market <span className="text-cyan-400">& Inventory</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Buy ISP / mobile endpoints by country, state and city. Flags, live ping and cart checkout.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-full px-3 py-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Grid online | {regionMeta?.count.toLocaleString()} {regionMeta?.label} peers
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Account balance", value: `$${(user?.balance || 0).toFixed(2)}`, icon: Wallet, tone: "text-emerald-400" },
              { label: "Owned proxies", value: String(owned.length), icon: Server, tone: "text-cyan-300" },
              { label: "Cart", value: cart.length ? `${cart.length}  $${cartTotal.toFixed(2)}` : "Empty", icon: ShoppingCart, tone: "text-amber-300" },
              { label: "Visible pool", value: String(visibleListings.length), icon: Globe, tone: "text-blue-300" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-[#0e1628]/90 border border-cyan-900/40 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">{card.label}</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${card.tone}`}>{card.value}</p>
              {card.label === "Cart" && cart.length > 0 && (
                <button
                  type="button"
                  disabled={buying}
                  onClick={() => checkout()}
                  className="mt-2 w-full rounded-lg bg-cyan-500 px-2 py-1.5 text-[10px] font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                >
                  {buying ? "..." : "BUY ALL"}
                </button>
              )}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-px">
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={t.id === "proxy" ? "/dashboard" : t.id === "history" ? "/dashboard/history" : `/dashboard?tab=${t.id}`}
                className={`px-4 py-3 text-base font-bold rounded-t-xl border-x border-t transition ${
                  tab === t.id
                    ? "bg-[#0e1628] text-cyan-300 border-cyan-700/50"
                    : "text-slate-200 border-transparent hover:text-white"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {notice && (
            <div className="text-xs font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2">
              {notice}
            </div>
          )}

          {tab === "proxy" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-9 min-w-0 w-full flex-1 space-y-4">
                <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-bold">Regions</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {REGIONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRegion(r.id);
                          setStateFilter("");
                        }}
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          region === r.id
                            ? "bg-cyan-500/15 border-cyan-400 text-cyan-200"
                            : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-cyan-800"
                        }`}
                      >
                        <p className="text-xs font-semibold">{r.label}</p>
                        <p className="text-[11px] font-mono text-slate-400">{r.count.toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {region === "usa" && (
                  <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <h2 className="text-sm font-bold">United States: state targeting</h2>
                      </div>
                      {stateFilter && (
                        <button onClick={() => setStateFilter("")} className="text-[11px] text-cyan-400">
                          Clear {stateFilter}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {US_STATES.map((st) => (
                        <button
                          key={st.code}
                          onClick={() => setStateFilter(stateFilter === st.code ? "" : st.code)}
                          className={`text-[11px] font-mono px-2 py-1 rounded-lg border ${
                            stateFilter === st.code
                              ? "bg-cyan-500 text-slate-950 border-cyan-400"
                              : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-cyan-700"
                          }`}
                        >
                          {st.code}
                          <span className="opacity-60"> {st.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-cyan-400" />
                    <input
                      value={filters.ip}
                      onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
                      placeholder="IP"
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-cyan-500"
                    />
                    <input
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                      placeholder="City"
                      className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500"
                    />
                    <input
                      value={filters.state}
                      onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                      placeholder="State"
                      className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-cyan-500"
                    />
                    <input
                      value={filters.isp}
                      onChange={(e) => setFilters({ ...filters, isp: e.target.value })}
                      placeholder="ISP"
                      className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500"
                    />
                     <input
                      value={filters.zip}
                      onChange={(e) => setFilters({ ...filters, zip: e.target.value })}
                      placeholder="ZIP"
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-cyan-500"
                    />                   <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none"
                    >
                      <option value="any">Any type</option>
                      <option value="ISP">ISP</option>
                      <option value="MOB">MOB</option>
                      <option value="ISP/MOB">ISP/MOB</option>
                    </select>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none"
                    >
                      <option value="added">Newest</option>
                      <option value="ping">Lowest ping</option>
                      <option value="speed">Fastest</option>
                      <option value="price">Price</option>
                    </select>
                    <button onClick={resetFilters} className="text-[11px] text-rose-400 inline-flex items-center gap-1 ml-auto">
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full table-auto text-[11px] whitespace-nowrap">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-2 py-2 text-left font-semibold">IP</th>
                          <th className="px-2 py-2 text-left font-semibold">DOMAIN</th>
                          <th className="px-2 py-2 text-left font-semibold">STATE</th>
                          <th className="px-2 py-2 text-left font-semibold">CITY</th>
                          <th className="px-2 py-2 text-left font-semibold">ISP</th>
                          <th className="px-2 py-2 text-center font-semibold">ZIP</th>
                          <th className="px-2 py-2 text-center font-semibold">SPEED</th>
                          <th className="px-2 py-2 text-center font-semibold">PING</th>
                          <th className="px-2 py-2 text-center font-semibold">TYPE</th>
                          <th className="px-2 py-2 text-center font-semibold">ADDED</th>
                          <th className="px-2 py-2 text-right font-semibold">PRICE</th>
                          <th className="px-2 py-2 text-center font-semibold"></th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading && (
                          <tr>
                            <td colSpan={12} className="px-2 py-8 text-center text-slate-500">
                              Loading NAVA SOCKS...
                            </td>
                          </tr>
                        )}

                        {!loading && visibleListings.length === 0 && (
                          <tr>
                            <td colSpan={12} className="px-2 py-8 text-center text-slate-500">
                              No endpoints match these filters.
                            </td>
                          </tr>
                        )}

                        {visibleListings.map((row) => {
                          const hot =
                            parseFloat(row.price) < 0.6 || row.city === "New York";

                          return (
                            <tr
                              key={row.id}
                              onClick={() => setSelectedListing(row)}
                              className="border-t border-slate-800/80 hover:bg-cyan-950/20 cursor-pointer"
                            >
                              <td className="px-2 py-2 whitespace-nowrap text-left">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="relative inline-flex group">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        revealIp(row.id);
                                      }}
                                      disabled={revealingIp || !!revealedIps[row.id]}
                                      className="font-mono text-cyan-200 hover:text-cyan-100 underline underline-offset-2 disabled:no-underline disabled:cursor-default"
                                    >
                                      <Flag code={row.countryCode} />{" "}{revealedIps[row.id] || row.ipMasked || "—"}
                                    </button>
                                    {!revealedIps[row.id] && !revealingIp && (
                                      <span className="pointer-events-none absolute left-1/2 bottom-full z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-cyan-200 shadow-lg group-hover:block">
                                        Reveal IP - $0.05
                                      </span>
                                    )}
                                  </span>
                                </span>
                              </td>

                              <td className="px-2 py-2 text-left text-slate-300 max-w-[150px]">
                                <span
                                  className="block truncate"
                                  title={row.domain || "-"}
                                >
                                  {row.domain || "-"}
                                </span>
                              </td>

                              <td className="px-2 py-2 whitespace-nowrap text-left text-slate-300">
                                {row.state || "-"}
                              </td>

                              <td
                                className={`px-2 py-2 whitespace-nowrap text-left font-medium ${
                                  hot ? "text-amber-300" : "text-slate-200"
                                }`}
                              >
                                {row.city || "-"}
                              </td>

                              <td className="px-2 py-2 text-left text-slate-300 max-w-[150px]">
                                <span
                                  className="block truncate"
                                  title={row.isp || "-"}
                                >
                                  {shortenIspName(row.isp)}
                                </span>
                              </td>

                              <td className="px-2 pr-4 py-2 whitespace-nowrap text-center font-mono text-slate-300">
                                {row.zip || "-"}
                              </td>

                              <td className="px-2 pr-4 py-2 whitespace-nowrap text-center text-slate-300">
                                <span className="inline-flex items-center justify-center gap-0.5">
                                  {row.speedKbps >= 3000 ? (
                                    <Building2 className="w-3 h-3 text-cyan-500" />
                                  ) : (
                                    <User className="w-3 h-3 text-slate-500" />
                                  )}
                                  {row.speedLabel}
                                </span>
                              </td>

                              <td className="px-2 pr-4 py-2 whitespace-nowrap text-center">
                                <span className="inline-flex items-center justify-center gap-0.5">
                                  {row.ping <= 100 && (
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  )}
                                  {row.ping} ms
                                </span>
                              </td>

                              <td className="px-2 pr-4 py-2 whitespace-nowrap text-center">
                                <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                  {row.proxyType.includes("MOB") ? (
                                    <Smartphone className="w-3 h-3 text-cyan-400" />
                                  ) : (
                                    <Server className="w-3 h-3 text-slate-500" />
                                  )}
                                  {row.proxyType}
                                </span>
                              </td>

                              <td className="px-3 py-2.5 whitespace-nowrap text-center text-slate-500">
                                {row.addedDays}d
                              </td>

                              <td className="px-3 py-2.5 whitespace-nowrap text-right font-mono font-bold text-emerald-400">
                                ${row.price}
                              </td>

                              <td className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(row);
                                  }}
                                  aria-label={`Add ${row.ipMasked} to cart`}
                                  className={`inline-flex items-center justify-center p-1.5 rounded-lg border ${
                                    cart.some((c) => c.id === row.id)
                                      ? "bg-cyan-500 text-slate-950 border-cyan-400"
                                      : "text-cyan-300 border-cyan-800 hover:bg-cyan-950"
                                  }`}
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage <= 1 || loading}
                      className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Prev
                    </button>

                    <span className="min-w-[72px] text-center text-[11px] font-mono text-slate-400">
                      {currentPage} / {Math.max(1, totalPages)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(Math.max(1, totalPages), page + 1))}
                      disabled={currentPage >= totalPages || loading}
                      className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <aside className="xl:col-span-3 min-w-0 w-full space-y-4 xl:sticky xl:top-24 h-fit">
                                 <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl overflow-hidden">
                   
                   {selectedListing && (
                     <>
                       <div className="px-4 py-3 border-b border-slate-800">
                         <div className="flex items-center gap-2">
                           <Activity className="w-4 h-4 text-cyan-400" />
                           <h3 className="text-sm font-bold">IP DETAILS</h3>{(() => { const ownedItem = owned.find((item) => item.ip === selectedListing.ipFull); return ownedItem ? (<div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-3 py-2"><div><p className="text-[10px] text-emerald-300 font-black tracking-wide">PURCHASED PROXY</p><p className="text-[10px] text-slate-400 font-mono mt-0.5">{ownedItem.locked ? "ACCESS: LOCKED" : "ACCESS: OPEN"}</p></div><button type="button" onClick={() => toggleLock(ownedItem)} className="text-[10px] font-mono text-cyan-300 hover:text-cyan-100">{ownedItem.locked ? "UNLOCK" : "LOCK"}</button></div>) : null; })()}
                         </div>

                         <div className="mt-3 flex flex-wrap gap-2">
                           {(["info", "geo", "blacklists"] as const).map((tabKey) => (
                             <button
                               key={tabKey}
                               onClick={() => setDetailTab(tabKey)}
                               className={`px-3 py-2 rounded-lg border text-xs font-black tracking-wide transition ${
                                 detailTab === tabKey
                                   ? tabKey === "info"
                                     ? "border-cyan-400 bg-cyan-400/15 text-cyan-200"
                                     : tabKey === "geo"
                                       ? "border-violet-400 bg-violet-400/15 text-violet-200"
                                       : "border-amber-400 bg-amber-400/15 text-amber-200"
                                   : tabKey === "info"
                                     ? "border-cyan-900/60 text-cyan-400 hover:bg-cyan-500/10"
                                     : tabKey === "geo"
                                       ? "border-violet-900/60 text-violet-400 hover:bg-violet-500/10"
                                       : "border-amber-900/60 text-amber-400 hover:bg-amber-500/10"
                               }`}
                             >
                               {tabKey === "info"
                                 ? "INFO"
                                 : tabKey === "geo"
                                   ? "GEO"
                                   : "BLACKLISTS"}
                             </button>
                           ))}
                         </div>
                       </div>

                       <div className="p-4 space-y-3 text-xs">

                         {detailTab === "info" && (
                           <>
                             <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                               <div className="flex items-start gap-3">
                                 <Flag code={selectedListing.countryCode} />
                                 <div className="min-w-0">
                                   <p className="text-sm font-bold text-slate-100">
                                     {selectedListing.country || "-"}
                                   </p>
                                   <p className="text-slate-400">
                                     {selectedListing.state || "-"}, {selectedListing.city || "-"}, {selectedListing.zip || "-"}
                                   </p>
                                 </div>
                               </div>
                             </div>

                             <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                               <div className="px-3 py-2 border-b border-slate-800">
                                 <p className="text-[11px] font-black tracking-wider text-cyan-400 uppercase">
                                   Proxy
                                 </p>
                               </div>

                               <div className="divide-y divide-slate-800/80">
                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Domain</span>
                                   <span className="text-right text-slate-200 break-all">
                                     {selectedListing.domain || "-"}
                                   </span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">ORG</span>
                                    <span className="text-right text-slate-200">{listingDetails?.network.org || selectedListing.isp || "-"}</span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">ISP</span>
                                   <span className="text-right text-slate-200">
                                     {selectedListing.isp || "-"}
                                   </span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Zone</span>
                                    <span className="text-right text-slate-200">{listingDetails?.location.zone || "Checking..."}</span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Proxy quality</span>
                                   <span className="text-right font-semibold text-emerald-300">{listingDetails?.quality?.proxyQuality || "Calculating..."}</span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Added</span>
                                   <span className="text-right text-slate-200">
                                     {selectedListing.addedDays} days
                                   </span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">IP Type</span>
                                    <span className="text-right text-slate-200">{listingDetails?.network.ipType || selectedListing.proxyType || "-"}</span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Type</span>
                                   <span className="text-right text-slate-200">
                                     {selectedListing.proxyType || "-"}
                                   </span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Ping</span>
                                   <span className="text-right font-mono text-slate-200">
                                     {selectedListing.ping} ms
                                   </span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Blacklisted</span>
                                    <span className="text-right text-slate-200">
                                      {detailsLoading
                                         ? "Loading..."
                                        : listingDetails?.risk.blacklisted == null
                                           ? "N/A"
                                          : listingDetails.risk.blacklisted
                                            ? "Yes"
                                            : "No"}
                                    </span>
                                 </div>
                               </div>
                             </div>

                             <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                               <div className="px-3 py-2 border-b border-slate-800">
                                 <p className="text-[11px] font-black tracking-wider text-cyan-400 uppercase">
                                   Network
                                 </p>
                               </div>

                               <div className="divide-y divide-slate-800/80">
                                 <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">IP</span>
                                   <div className="flex items-center gap-3">
                                     <span className="font-mono text-cyan-200">
                                       <div className="relative group">
                                         <button
                                           type="button"
                                           onClick={() => revealIp()}
                                           disabled={revealingIp || !!revealedIp || !!revealedIps[selectedListing.id]}
                                           className="font-mono text-cyan-200 hover:text-cyan-100 underline underline-offset-2 disabled:no-underline disabled:cursor-default"
                                         >
                                           {revealedIp || revealedIps[selectedListing.id] || selectedListing.ipMasked || "-"}
                                         </button>
                                         {!revealedIp && !revealedIps[selectedListing.id] && !revealingIp && (
                                           <span
                                             className="pointer-events-none absolute left-1/2 bottom-full z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-cyan-200 shadow-lg group-hover:block"
                                           >
                                             Reveal IP - $0.05
                                           </span>
                                         )}
                                       </div>
                                     </span>
                                     <button
                                       type="button"
                                       onClick={() => revealIp()}
                                       disabled={revealingIp || !!revealedIp || !!revealedIps[selectedListing.id]}
                                       className="whitespace-nowrap text-cyan-300 hover:text-cyan-200 underline underline-offset-2 font-semibold"
                                     >
                                       {revealedIp || revealedIps[selectedListing.id] ? "IP REVEALED" : revealingIp ? "REVEALING..." : "Reveal IP - $0.05"}
                                     </button>
                                   </div>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Speed</span>
                                   <span className="text-right text-slate-200">
                                     {selectedListing.speedLabel || "-"}
                                   </span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">DNS</span>
                                    <span className="text-right font-mono text-slate-200 break-all">{listingDetails?.network.reverseDns || (detailsLoading ? "Checking DNS..." : "No PTR record")}</span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">DNS ISP</span>
                                   <span className="text-right text-slate-200">{selectedListing.isp || "Unavailable"}</span>
  </div>

  <div className="flex justify-between gap-4 px-3 py-2.5">
    <span className="text-slate-500">Usage</span>
                                   <span className="text-right text-slate-200">{listingDetails?.traffic?.usedGb != null ? `${listingDetails.traffic.usedGb} GB` : "No usage data"}</span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">UDP</span>
                                   <span className="text-right text-slate-200">{listingDetails?.traffic?.protocol || "Not configured"}</span>
                                 </div>
                               </div>
                             </div>

                             <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                               <div className="px-3 py-2 border-b border-slate-800">
                                 <p className="text-[11px] font-black tracking-wider text-cyan-400 uppercase">
                                   Risk
                                 </p>
                               </div>

                               <div className="divide-y divide-slate-800/80">
                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Scamalytics</span>
                                   <span className="text-right text-slate-200">{detailsLoading ? "Loading..." : (listingDetails?.risk.scamalytics ?? "Not configured")}</span>
                                 </div>

                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">IPQS</span>
                                   <span className="text-right text-slate-200">{detailsLoading ? "Loading..." : (listingDetails?.risk.ipqs ?? "Not configured")}</span>
                                 </div>
                               </div>
                             </div>

                             <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                               <div className="px-3 py-2 border-b border-slate-800">
                                 <p className="text-[11px] font-black tracking-wider text-cyan-400 uppercase">
                                   Traffic
                                 </p>
                               </div>

                               <div className="divide-y divide-slate-800/80">
                                 <div className="flex justify-between gap-4 px-3 py-2.5">
                                   <span className="text-slate-500">Traffic included</span>
                                   <span className="text-right text-slate-200">{listingDetails?.traffic?.includedGb != null ? `${listingDetails.traffic.includedGb} GB` : "Not subscribed"}</span>
                                 </div>

                                 <label className="flex items-center justify-between gap-4 px-3 py-2.5 cursor-pointer">
                                   <span className="text-slate-500">Traffic auto refill</span>
                                   <span className="inline-flex items-center gap-2 text-slate-200">
                                     <span className="font-mono text-xs text-slate-300">$0.24/Gb</span>
                                     <input
                                       type="checkbox"
                                       className="h-4 w-4 accent-cyan-400"
                                     />
                                   </span>
                                 </label>

                                 <label className="flex items-center justify-between gap-4 px-3 py-2.5 cursor-pointer">
                                   <span className="text-slate-500">Auto renew daily</span>
                                   <input
                                     type="checkbox"
                                     className="h-4 w-4 accent-cyan-400"
                                   />
                                 </label>
                               </div>
                             </div>

                            {cart.length > 0 && (
                              <div className="mx-4 mb-3 rounded-lg border border-cyan-900/50 bg-slate-950/50 px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Combined cart total</span>
                                  <span className="font-mono text-sm font-bold text-emerald-400">${cartTotal.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                             <div className="px-4 py-3 border-t border-slate-800">
                               <div className="grid grid-cols-2 gap-2">
                                 <button
                                   type="button"
                                   onClick={() => addToCart(selectedListing)}
                                   className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-black transition ${
                                     cart.some((c) => c.id === selectedListing.id)
                                       ? "bg-cyan-500 text-slate-950 border-cyan-400"
                                       : "border-cyan-800 text-cyan-300 hover:bg-cyan-950"
                                   }`}
                                 >
                                   <ShoppingCart className="w-4 h-4" />
                                   {cart.some((c) => c.id === selectedListing.id) ? "IN CART" : "CART"}
                                 </button>

                                 <button
                                   type="button"
                                   disabled={buying}
                                   onClick={() => selectedListing && checkout([selectedListing.id])}
                                   className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-bold text-xs font-mono disabled:opacity-60"
                                 >
                                   {buying ? "Provisioning..." : `BUY IP $${selectedListing.price}`}
                                 </button>

                               </div>
                             </div>
                           </>
                         )}
                         {detailTab === "geo" && (
                           <>
                             <div className="flex justify-between gap-3">
                               <span className="text-slate-500">Country</span>
                               <span className="inline-flex items-center gap-2 text-slate-200">
                                 <Flag code={selectedListing.countryCode} />
                                 {selectedListing.country}
                               </span>
                             </div>

                             <div className="flex justify-between gap-3">
                               <span className="text-slate-500">Region</span>
                               <span className="text-slate-200">
                                 {selectedListing.region || "-"}
                               </span>
                             </div>

                             <div className="flex justify-between gap-3">
                               <span className="text-slate-500">State</span>
                               <span className="text-slate-200">
                                 {selectedListing.state || "-"}
                               </span>
                             </div>

                             <div className="flex justify-between gap-3">
                               <span className="text-slate-500">City</span>
                               <span className="text-slate-200">
                                 {selectedListing.city || "-"}
                               </span>
                             </div>

                             <div className="flex justify-between gap-3">
                               <span className="text-slate-500">ZIP</span>
                               <span className="font-mono text-slate-200">
                                 {selectedListing.zip || "-"}
                               </span>
                             </div>
                           </>
                         )}

                         {detailTab === "blacklists" && (
                           <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                             <p className="text-slate-300">
                               Blacklist information will remain connected to the existing IP-risk system.
                             </p>
                           </div>
                         )}

                       </div>
                     </>
                   )}
                {selectedListing && cart.length > 0 && (
                  <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-amber-300" />
                        <h3 className="text-sm font-bold">Your Cart</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {cart.length} {cart.length === 1 ? "proxy" : "proxies"}
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-2"
                        >
                          <Flag code={item.countryCode} />
                          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-cyan-200">
                            {item.ipMasked}
                          </span>
                          <span className="font-mono text-[11px] text-emerald-400">
                            ${item.price}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label="Remove proxy from cart"
                            title="Remove from cart"
                            className="shrink-0 text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Combined total</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">${cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        disabled={buying}
                        onClick={() => checkout()}
                        className="w-full rounded-xl bg-cyan-500 px-3 py-2.5 text-xs font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                      >
                        {buying ? "Provisioning..." : "BUY ALL"}
                      </button>
                    </div>
                  </div>
                )}
                 </div><div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                                                  <h3 className="text-sm font-bold">My proxies</h3>
          </div>
          
          {/* ✔ FIXED: Dynamic layout card scroll wrapper */}
          <div className="p-3 max-h-[340px] overflow-y-auto space-y-1 relative">
            {owned.length === 0 && <p className="text-xs text-slate-500 px-1 py-2">No purchased endpoints yet.</p>}
            {owned.map((item) => {
              const isDeadOrExpired = String(item.statusText || "").toLowerCase().includes("expired") || (typeof getRefundRemainingMs === 'function' && getRefundRemainingMs(item) <= -86400000);
              
              // ✔ FIXED STRIP ENGINE: Safely trims off any trailing ", US" or ", us" text from your city payload natively
              const cleanCityText = item.city ? item.city.replace(/,\s*us\$/i, '').trim() : "Unknown City";
              
              // Grab the true state code if it exists as a fallback layer
              const displayStateCode = (item.state && item.state.trim().length === 2 && item.state.toUpperCase() !== "US") ? item.state.trim().toUpperCase() : "US";

              return (
                <div key={item.id} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-950/80 border border-transparent hover:border-slate-800/40 transition gap-2">
                  <button onClick={() => copyOwned(item)} className="text-left min-w-0 flex-1">
                    <p className="font-mono text-[11px] text-cyan-200 truncate">
                      {(item.publicAccessHost || item.accessHost || item.ip)}:{(item.publicAccessPort || item.accessPort || item.port)}
                    </p>
                    <p className="text-[10px] text-slate-400 inline-flex items-center gap-1.5 mt-0.5">
                      <Flag code="US" />
                      {/* ✔ CLEAN CARD OUT: Renders the extracted city string along with the correct state attribute code */}
                      <span className="truncate">{cleanCityText}, <span className="font-mono font-bold text-slate-300">{displayStateCode}</span></span>
                    </p>
                  </button>
                  
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className={`flex flex-col items-center bg-slate-950/60 border border-slate-800/60 px-1.5 py-0.5 rounded select-none text-[8px] tracking-wider font-bold uppercase transition ${isDeadOrExpired ? "opacity-30 text-slate-600" : "text-slate-500"}`}>
                      <span>Auto</span>
                      <input 
                        type="checkbox"
                        disabled={isDeadOrExpired}
                        checked={!isDeadOrExpired && !!item.autoRenew}
                        onChange={(e) => {
                          e.stopPropagation();
                          const next = !item.autoRenew;
                          const key = `navasocks_autorenew_${item.id}`;
                          if (next) localStorage.setItem(key, "true"); else localStorage.removeItem(key);
                          if (typeof setOwned === 'function') {
                            setOwned((prev: any[]) => prev.map((x) => x.id === item.id ? { ...x, autoRenew: next } : x));
                          }
                        }}
                        className="h-3 w-3 accent-cyan-500 rounded bg-slate-900 border-slate-800 cursor-pointer mt-0.5 transition active:scale-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    {REFUNDS_ENABLED && (
                      <button
                        type="button"
                        onClick={() => setRefundProxy(item)}
                        disabled={getRefundRemainingMs(item) <= 0}
                        className="text-[10px] font-black uppercase tracking-wide text-amber-300 hover:text-amber-200"
                      >
                        {getRefundRemainingMs(item) > 0
                          ? `ASK REFUND · ${Math.ceil(getRefundRemainingMs(item) / 60000)}m`
                          : "REFUND EXPIRED"}
                      </button>
                    )}
                    <button onClick={() => toggleLock(item)} className="text-slate-500 hover:text-cyan-300">
                      {item.locked ? "" : ""}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✔ FIXED FOOTER BLOCK: All components are cleanly closed inside bounding card layout walls to eliminate overlaps */}
          <div className="px-4 pt-3 pb-4 border-t border-slate-800/60 bg-slate-950/20 rounded-b-2xl">
            {copied && (
              <p className="pb-2 text-[11px] text-emerald-400 font-mono inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Copied {copied}
              </p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans normal-case">
              Auth is login/password by default. Unlock an IP to allow whitelist-only access.
            </p>
          </div>
        </div>
      </aside>

            </div>
          )}

          {tab === "inventory" && (
            <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl p-5">
                            <h2 className="text-sm font-bold mb-4">Allocated NAVA SOCKS endpoints</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {owned.map((item) => {
                const cleanCityText = item.city ? item.city.replace(/,\s*us$/i, '').trim() : "Unknown City";
                const displayStateCode = (item.state && item.state.trim().length === 2 && item.state.toUpperCase() !== "US") ? item.state.trim().toUpperCase() : "US";
                
                return (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs text-slate-200">
                        <Flag code="US" /> 
                        <span>{cleanCityText}, <span className="font-mono font-bold text-slate-400">{displayStateCode}</span></span>
                      </span>
                      <button onClick={() => toggleLock(item)} className="text-slate-400 hover:text-cyan-300">
                        {item.locked ? "" : ""}
                      </button>
                    </div>
                    <p className="font-mono text-sm text-cyan-200">
                      {(item.publicAccessHost || item.accessHost || item.ip)}:{(item.publicAccessPort || item.accessPort || item.port)}
                    </p>
                    <p className="text-[11px] text-slate-500">{item.isp}</p>
                    <button
                      onClick={() => copyOwned(item)}
                      className="text-[11px] text-cyan-400 inline-flex items-center gap-1 hover:text-cyan-300 transition"
                    >
                      <Copy className="w-3 h-3" /> Copy NAVA endpoint
                    </button>
                  </div>
                );
              })}
            </div>

            </div>
          )}

          {tab === "history" && (
            <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800">
                <h2 className="text-sm font-bold">Payment & allocation history</h2>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Method</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-slate-800">
                      <td className="px-4 py-2.5 text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono text-cyan-300">{tx.id}</td>
                      <td className="px-4 py-2.5">{tx.paymentMethod}</td>
                      <td className="px-4 py-2.5 text-emerald-400 font-mono">${tx.amount}</td>
                      <td className="px-4 py-2.5 text-emerald-300">{tx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "payments" && (
            <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl p-6 space-y-4 max-w-xl">
              <h2 className="text-sm font-bold">Add balance</h2>
              <p className="text-sm text-slate-400">
                Current wallet: <span className="text-emerald-400 font-mono">${(user?.balance || 0).toFixed(2)}</span>
              </p>
              <p className="text-xs text-slate-500">
                Crypto (USDT / BTC / LTC) credits your NAVA SOCKS balance, then you buy individual IPs from the market.
              </p>
              <button
                onClick={() => setPayOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono"
              >
                Open checkout
              </button>
            </div>
          )}

                    {tab === "support" && (
            <div className="space-y-5">

              <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-800/50 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-cyan-400" />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-mono">
                      Support Center
                    </p>

                    <h2 className="text-lg font-bold mt-1">
                      How can we help?
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      Get help with your account, proxies, billing, or technical issues.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400 font-mono">
                    Support Tickets
                  </p>

                  <h3 className="text-sm font-bold mt-2">
                    Create a ticket
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 leading-5">
                    Contact support when you need help with your account,
                    proxies, payments, or another issue.
                  </p>

                  <div className="mt-5 space-y-3">

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                        Category
                      </label>

                      <select
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-cyan-500"
                      >
                        <option value="General">General</option>
                        <option value="Proxy">Proxy</option>
                        <option value="Billing">Billing</option>
                        <option value="Account">Account</option>
                        <option value="Technical">Technical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                        Subject
                      </label>

                      <input
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                        placeholder="What do you need help with?"
                        maxLength={160}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                        Message
                      </label>

                      <textarea
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Describe your issue..."
                        rows={6}
                        maxLength={5000}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-cyan-500 resize-y"
                      />
                    </div>

                    {supportNotice && (
                      <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-300">
                        {supportNotice}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={createSupportTicket}
                      disabled={supportSubmitting}
                      className="w-full px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {supportSubmitting
                        ? "CREATING TICKET..."
                        : "CREATE TICKET"}
                    </button>

                  </div>
                </div>

                <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400 font-mono">
                    Your Requests
                  </p>

                  <h3 className="text-sm font-bold mt-2">
                    Support history
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 leading-5">
                    Your submitted tickets and support conversations will
                    appear here.
                  </p>

                  <div className="mt-5 grid lg:grid-cols-[0.8fr_1.2fr] gap-4">

                    <div className="space-y-3 min-w-0">
                      {supportHistoryLoading ? (
                        <div className="text-xs text-slate-500 font-mono">
                          Loading tickets...
                        </div>
                      ) : supportTickets.length === 0 ? (
                        <div className="text-xs text-slate-600 font-mono">
                          No tickets yet
                        </div>
                      ) : (
                        supportTickets.map((ticket) => {
                          const ticketId = Number(ticket.id);
                          const selected = selectedSupportTicketId === ticketId;

                          return (
                            <button
                              key={ticket.id}
                              type="button"
                              className={[
                                "w-full text-left rounded-xl border p-4 transition",
                                selected
                                  ? "border-cyan-700 bg-cyan-950/20"
                                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700",
                              ].join(" ")}
                              onClick={async () => {
                                setSelectedSupportTicketId(ticketId);
                                setSupportConversationLoading(true);
                                setSupportConversation([]);

                                try {
                                  const response = await fetch(
                                    `/api/support/create?ticketId=${encodeURIComponent(ticketId)}`,
                                    { cache: "no-store" }
                                  );

                                  const data = await response.json();

                                  if (!response.ok) {
                                    throw new Error(
                                      data?.error || "Unable to load conversation."
                                    );
                                  }

                                  setSupportConversation(
                                    Array.isArray(data?.messages)
                                      ? data.messages
                                      : []
                                  );
                                } catch (error) {
                                  console.error(
                                    "Load support conversation error:",
                                    error
                                  );
                                  setSupportConversation([]);
                                } finally {
                                  setSupportConversationLoading(false);
                                }
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono">
                                    Ticket #{ticket.id}
                                  </p>

                                  <h4 className="text-sm font-bold text-slate-100 mt-1 truncate">
                                    {ticket.subject}
                                  </h4>

                                  <p className="text-[10px] text-slate-500 mt-1">
                                    {ticket.category}
                                    {ticket.createdAt
                                      ? ` - ${new Date(ticket.createdAt).toLocaleString()}`
                                      : ""}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-md border border-emerald-900/60 bg-emerald-950/20 text-xs font-black uppercase font-mono text-emerald-300 px-2.5 py-1.5">
                                  {String(ticket.status || "open").toUpperCase()}
                                </span>
                              </div>

                              <p className="text-xs text-slate-400 mt-3 whitespace-pre-wrap leading-5 line-clamp-3">
                                {ticket.message}
                              </p>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 min-w-0">
                      {selectedSupportTicketId === null ? (
                        <div className="min-h-[220px] flex items-center justify-center text-center">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-mono">
                              Select a ticket
                            </p>
                            <p className="text-xs text-slate-600 mt-2">
                              Choose a request on the left to view its conversation.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>

                          {(() => {
                            const selectedTicket = supportTickets.find(
                              (ticket) =>
                                Number(ticket.id) === selectedSupportTicketId
                            );

                            return (
                              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400 font-mono">
                                    Ticket #{selectedSupportTicketId}
                                  </p>

                                  <h4 className="text-sm font-bold text-slate-100 mt-1 truncate">
                                    {selectedTicket?.subject || "Support ticket"}
                                  </h4>

                                  <p className="text-[10px] text-slate-500 mt-1">
                                    {selectedTicket?.category || "General"}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-md border border-emerald-900/60 bg-emerald-950/20 text-xs font-black uppercase font-mono text-emerald-300 px-2.5 py-1.5">
                                  {String(
                                    selectedTicket?.status || "open"
                                  ).toUpperCase()}
                                </span>
                              </div>
                            );
                          })()}

                          <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
                            {supportConversationLoading ? (
                              <div className="text-xs text-slate-500 font-mono">
                                Loading conversation...
                              </div>
                            ) : supportConversation.length === 0 ? (
                              <div className="text-xs text-slate-600 font-mono">
                                No conversation messages yet
                              </div>
                            ) : (
                              supportConversation.map((message) => (
                                <div
                                  key={message.id}
                                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] uppercase tracking-wider font-bold font-mono text-slate-400">
                                      {message.senderType === "customer"
                                        ? "You"
                                        : "Support"}
                                    </p>

                                    {message.createdAt ? (
                                      <p className="text-[9px] text-slate-600">
                                        {new Date(
                                          message.createdAt
                                        ).toLocaleString()}
                                      </p>
                                    ) : null}
                                  </div>

                                  <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap leading-5">
                                    {message.message}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-800">
                            <textarea
                              value={supportReply}
                              onChange={(e) => setSupportReply(e.target.value)}
                              placeholder="Type your reply..."
                              rows={4}
                              maxLength={5000}
                              disabled={supportReplySubmitting}
                              className="w-full resize-none bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-600 disabled:opacity-50"
                            />

                            <div className="mt-2 flex items-center justify-between gap-3">
                              <span className="text-[10px] text-slate-600 font-mono">
                                {supportReply.length}/5000
                              </span>

                              <button
                                type="button"
                                disabled={
                                  supportReplySubmitting ||
                                  !supportReply.trim()
                                }
                                onClick={async () => {
                                  const message = supportReply.trim();

                                  if (
                                    !message ||
                                    selectedSupportTicketId === null
                                  ) {
                                    return;
                                  }

                                  setSupportReplySubmitting(true);

                                  try {
                                    const response = await fetch(
                                      "/api/support/create",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          ticketId: selectedSupportTicketId,
                                          message,
                                        }),
                                      }
                                    );

                                    const data = await response.json();

                                    if (!response.ok) {
                                      throw new Error(
                                        data?.error ||
                                          "Unable to send reply."
                                      );
                                    }

                                    setSupportReply("");
                                    setSupportConversation(
                                      Array.isArray(data?.messages)
                                        ? data.messages
                                        : []
                                    );

                                    if (data?.ticket) {
                                      setSupportTickets((current) =>
                                        current.map((ticket) =>
                                          Number(ticket.id) ===
                                          selectedSupportTicketId
                                            ? {
                                                ...ticket,
                                                status:
                                                  data.ticket.status,
                                                updatedAt:
                                                  data.ticket.updatedAt,
                                              }
                                            : ticket
                                        )
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Send support reply error:",
                                      error
                                    );
                                    window.alert(
                                      error instanceof Error
                                        ? error.message
                                        : "Unable to send reply."
                                    );
                                  } finally {
                                    setSupportReplySubmitting(false);
                                  }
                                }}
                                className="rounded-lg border border-cyan-800 bg-cyan-950/40 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {supportReplySubmitting
                                  ? "SENDING..."
                                  : "SEND REPLY"}
                              </button>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {tab === "tools" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold">IP risk check</h2>
                </div>
                <input
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  placeholder="Paste IP or wallet"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() =>
                    setToolResult(
                      toolInput
                        ? `${toolInput} - risk 12/100 - ISP/residential - not listed on spamhaus`
                        : "Enter an IP or address first"
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
                >
                  Scan
                </button>
                {toolResult && <p className="text-xs font-mono text-emerald-300 bg-slate-950 border border-slate-800 rounded-xl p-3">{toolResult}</p>}
              </div>
              <div className="bg-[#0e1628] border border-cyan-900/40 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold">Gateway endpoints</h2>
                </div>
                <p className="font-mono text-xs text-cyan-200">pr.navasocks.net:7000 - HTTP</p>
                <p className="font-mono text-xs text-cyan-200">pr.navasocks.net:1080 - SOCKS5</p>
                <p className="text-[11px] text-slate-500">Use purchased IP:port or rotating user/pass credentials from inventory.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <PaymentModal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        planName="NAVA SOCKS Balance"
        pricePerGb={1}
        initialGb={10}
        onSuccess={load}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080d19] text-slate-400 p-8">Loading NAVA SOCKS...</div>}>
      <DashboardInner />
    </Suspense>
  );
}
























