"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentModal from "@/components/PaymentModal";
import { useSitePreferences } from "@/components/SitePreferences";

import {
  Zap,
  Shield,
  Globe,
  Server,
  Activity,
  CheckCircle,
  Copy,
  Terminal,
  ArrowRight,
  Bitcoin,
  CreditCard,
  Lock,
  ChevronRight,
  Sparkles,
  Check,
  RefreshCw,
} from "lucide-react";

export default function LandingPage() {
  const { dark, t: translate } = useSitePreferences();
  const t = translate as unknown as (key: string) => string;

  // Calculator state
  const [selectedPlanType, setSelectedPlanType] = useState<"residential" | "sticky" | "datacenter" | "mobile">("residential");
  const [gbAmount, setGbAmount] = useState<number>(25);

  // Live test state
  const [testCountry, setTestCountry] = useState("us");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    latency: number;
    ip: string;
    isp: string;
    country: string;
  } | null>({
    latency: 18,
    ip: "174.192.88.42",
    isp: "Verizon Fios Residential",
    country: "United States (Virginia)",
  });
  // Code snippet state
  const [codeLang, setCodeLang] = useState<"curl" | "python" | "node" | "go">("curl");
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState({
    id: "residential_dynamic",
    name: "Residential SOCKS5",
    pricePerGb: 3.5,
  });


  // Calculate pricing based on plan and volume
  const getPlanDetails = () => {
    switch (selectedPlanType) {
      case "residential":
        // volume discount: base $3.50, >50GB $3.00, >200GB $2.40
        let resRate = 3.5;
        if (gbAmount >= 100) resRate = 2.4;
        else if (gbAmount >= 50) resRate = 2.9;
        return {
          id: "residential_dynamic",
          name: "Residential SOCKS5",
          rate: resRate,
          total: (gbAmount * resRate).toFixed(2),
          pool: "75M+ Real Peer IPs",
          concurrency: "Unlimited Threads",
          features: [
            "75M+ genuine residential IPs in 195+ countries",
            "Residential SOCKS5 access with rotating sessions",
            "SOCKS5 protocol support",
            "City, State & ASN level targeting included",
            "99.8% average connection success rate",
            "Zero throttling, zero concurrent connection limits",
          ],
        };
      case "sticky":
        let stRate = 4.8;
        if (gbAmount >= 100) stRate = 3.8;
        else if (gbAmount >= 50) stRate = 4.2;
        return {
          id: "residential_sticky",
          name: "Residential Premium Sticky ISP",
          rate: stRate,
          total: (gbAmount * stRate).toFixed(2),
          pool: "35M+ Clean ISP IPs",
          concurrency: "Unlimited Threads",
          features: [
            "Fixed sticky sessions up to 60+ minutes per IP",
            "AT&T, Comcast, Verizon & Deutsche Telekom IP pools",
            "Near-zero fraud and CAPTCHA scores",
            "Perfect for sneaker checkout bots & account management",
            "Dedicated high-speed 1 Gbps unthrottled pipes",
          ],
        };
      case "datacenter":
        let dcRate = 0.8;
        if (gbAmount >= 100) dcRate = 0.55;
        else if (gbAmount >= 50) dcRate = 0.68;
        return {
          id: "datacenter_shared",
          name: "Datacenter High-Speed",
          rate: dcRate,
          total: (gbAmount * dcRate).toFixed(2),
          pool: "500K+ Server IPs",
          concurrency: "1,000 Connections",
          features: [
            "Ultra-low latency <15ms server-to-server speed",
            "10 Gbps redundant fiber uplinks",
            "Tier-3 datacenter infrastructure in 40+ countries",
            "99.99% network uptime SLA guarantee",
            "High-throughput large-scale web scraping",
          ],
        };
      case "mobile":
        let mbRate = 6.9;
        if (gbAmount >= 100) mbRate = 5.2;
        else if (gbAmount >= 50) mbRate = 5.9;
        return {
          id: "mobile_lte",
          name: "Mobile 4G/5G Ã¢â‚¬â€ Coming Soon Carrier",
          rate: mbRate,
          total: (gbAmount * mbRate).toFixed(2),
          pool: "15M+ Mobile SIMs",
          concurrency: "Unlimited Threads",
          features: [
            "Real 4G/5G mobile cellular device modems",
            "Verizon, T-Mobile, Vodafone, O2, Softbank",
            "Instant IP rotation link & webhook trigger",
            "0% fraud detection on social media platforms",
            "Carrier header fingerprint preservation",
          ],
        };
    }
  };

  const planInfo = getPlanDetails();

  const handleTestProxy = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/proxies/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proxyString: `pr.navasocks.net:7000:user-demo-country-${testCountry}:pass123`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          latency: data.latencyMs,
          ip: data.exitIp,
          isp: data.isp,
          country: `${data.country} (${data.city})`,
        });
      }
    } catch {
      // fallback
    } finally {
      setTesting(false);
    }
  };
  const codeSnippets: Record<string, string> = {
    curl: `curl -x http://navasocks.net \\\n  -L "https://ipinfo.io"`,
    python: `import requests\n\nproxies = {\n    "http": "http://navasocks.net",\n    "https": "http://navasocks.net"\n}\n\nresponse = requests.get("https://ipinfo.io", proxies=proxies, timeout=10)\nprint(response.json())`,
    node: `const axios = require('axios');\nconst { HttpsProxyAgent } = require('https-proxy-agent');\n\nconst proxyAgent = new HttpsProxyAgent(\n  'http://navasocks.net'\n);\n\naxios.get('https://ipinfo.io', { httpsAgent: proxyAgent })\n  .then(res => console.log(res.data));`,
    go: `package main\n\nimport (\n    "fmt"\n    "net/http"\n    "net/url"\n    "io/ioutil"\n)\n\nfunc main() {\n    proxyUrl, _ := url.Parse("http://navasocks.net")\n    client := &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(proxyUrl)}}\n    \n    resp, _ := client.Get("https://ipinfo.io")\n    body, _ := ioutil.ReadAll(resp.Body)\n    fmt.Println(string(body))\n}`,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[codeLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const openCheckout = (planId: string, name: string, price: number) => {
    setSelectedCheckoutPlan({ id: planId, name, pricePerGb: price });
    setCheckoutModalOpen(true);
  };

  return (
    <div className={`min-h-screen selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200 ${dark ? "bg-[#080d19] text-white" : "bg-slate-50 text-slate-950"}`}>
      <Navbar />

      {/* HERO SECTION */}
      <section className={`relative overflow-hidden pt-8 sm:pt-12 pb-14 sm:pb-20 border-b ${dark ? "border-cyan-950/40" : "border-slate-200"}`}>
        {/* Glow ambient background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-blue-500/5 dark:from-cyan-600/15 dark:via-blue-600/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -top-32 right-10 w-96 h-96 bg-purple-500/5 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-cyan-950/70 border border-slate-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("heroNetwork")}</span>
              </div>

              <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02] ${dark ? "text-white" : "text-black"}`}>
                {t("heroTitle1")}
                <span className="block mt-2 bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 dark:from-cyan-400 dark:via-teal-300 dark:to-blue-500 bg-clip-text text-transparent">
                  {t("heroTitle2")}
                </span>
              </h1>

              <p className={`text-base sm:text-lg max-w-2xl font-semibold leading-relaxed ${dark ? "text-slate-300" : "text-slate-800"}`}>
                <strong className={`font-black ${dark ? "text-white" : "text-black"}`}>{t("heroDescriptionLead")}</strong>{t("heroDescriptionRest")}
              </p>
              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 group font-mono"
                >
                  <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                  {t("loginDashboard")}
                </Link>
              </div>

              {/* Supported payment icons */}
              <div className={`pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold ${dark ? "text-slate-400" : "text-slate-800"}`}>
                <span className="font-mono text-slate-500 uppercase text-[11px]">{t("automatedGateways")}</span>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                  <Bitcoin className="w-4 h-4" /> USDT / BTC / LTC
                </span>
                <span className="text-slate-300 dark:text-slate-700">-</span>
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-300">
                  <CreditCard className="w-4 h-4" /> {t("cryptoOnly")}
                </span>
                <span className="text-slate-300 dark:text-slate-700">-</span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-3.5 h-3.5" /> {t("instantDelivery")}
                </span>
              </div>
            </div>

            {/* Right: Live Interactive Proxy Handshake Tester */}
            <div className="lg:col-span-5">
              <div className={`border rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md ${dark ? "bg-[#0e1628]/95 border-cyan-800/60" : "bg-white border-slate-300"}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-2xl" />

                <div className={`flex items-center justify-between pb-3.5 border-b mb-4 ${dark ? "border-slate-800/80" : "border-slate-200"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    <span className={`text-xs font-mono font-black ml-2 ${dark ? "text-slate-300" : "text-slate-800"}`}>
                      {t("liveGatewaySandbox")}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${dark ? "bg-cyan-950 border border-cyan-700/60 text-cyan-300" : "bg-slate-100 border border-slate-200 text-cyan-700"}`}>
                    SOCKS5
                  </span>
                </div>

                {/* Country target selector for tester */}
                <div className="space-y-3 mb-4">
                  <div className={`flex justify-between items-center text-xs font-bold ${dark ? "text-slate-400" : "text-slate-800"}`}>
                    <span>{t("targetGeolocation")}</span>
                    <select
                      value={testCountry}
                      onChange={(e) => setTestCountry(e.target.value)}
                      className={`rounded px-2.5 py-1 text-xs font-mono font-bold outline-none border ${dark ? "bg-slate-900 border-cyan-990/80 text-cyan-300" : "bg-slate-50 border-slate-300 text-slate-900"}`}
                    >
                      <option value="us">US United States</option>
                      <option value="de">DE Germany</option>
                      <option value="gb">GB United Kingdom</option>
                      <option value="jp">JP Japan</option>
                      <option value="fr">FR France</option>
                    </select>
                  </div>

                  <div className={`p-3 rounded-xl border font-mono text-xs break-all space-y-1 ${dark ? "bg-slate-950 border-slate-800/80 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"}`}>
                    <p className="text-slate-500 text-[10px] uppercase font-bold">{t("connectionString")}</p>
                    <p className={`${dark ? "text-cyan-300" : "text-cyan-700"} font-black`}>
                      pr.navasocks.net:7000:user-nx-country-{testCountry}:px_pass_88
                    </p>
                  </div>

                  <button
                    onClick={handleTestProxy}
                    disabled={testing}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs font-mono transition flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {t("establishingHandshake")}
                      </>
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5" />
                        {t("executeProxyPing")}
                      </>
                    )}
                  </button>
                </div>
                {/* Live ping output */}
                {testResult && (
                  <div className={`rounded-xl p-3 border border-emerald-500/30 font-mono text-xs space-y-2 ${dark ? "bg-slate-950/90" : "bg-white"}`}>
                    <div className={`flex items-center justify-between font-black border-b pb-1.5 ${dark ? "text-emerald-400 border-slate-900" : "text-emerald-700 border-slate-200"}`}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t("handshakeOk")}
                      </span>
                      <span className={`${dark ? "text-white" : "text-slate-900"}`}>{testResult.latency} ms {t("latencySuffix")}</span>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 text-[11px] font-bold pt-1 ${dark ? "text-slate-400" : "text-slate-700"}`}>
                      <div>
                        <span className="text-slate-600 block text-[10px]">{t("exitIPv4")}</span>
                        <span className={`${dark ? "text-cyan-300" : "text-cyan-700"} font-black`}>{testResult.ip}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px]">{t("carrierISP")}</span>
                        <span className={`truncate block font-semibold ${dark ? "text-slate-200" : "text-slate-950"}`}>{testResult.isp}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px]">{t("targetLocation")}</span>
                        <span className={`${dark ? "text-slate-200" : "text-slate-950"} font-semibold`}>{testResult.country}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px]">{t("anonymity")}</span>
                        <span className={`${dark ? "text-emerald-400" : "text-emerald-700"} font-black"}`}>{t("eliteTier1")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS STATS BAR */}
      <section className={`border-b py-8 ${dark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-cyan-600 dark:text-cyan-400 font-mono">75M+</p>
              <p className={`text-xs font-bold ${dark ? "text-slate-400" : "text-slate-800"}`}>{t("residentialPeerIPs")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-teal-600 dark:text-teal-400 font-mono">195+</p>
              <p className={`text-xs font-bold ${dark ? "text-slate-400" : "text-slate-800"}`}>{t("countriesTerritories")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">&lt; 25ms</p>
              <p className={`text-xs font-bold ${dark ? "text-slate-400" : "text-slate-800"}`}>{t("averageResponseLatency")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">99.98%</p>
              <p className={`text-xs font-bold ${dark ? "text-slate-400" : "text-slate-800"}`}>{t("networkUptimeSLA")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TABLE & INTERACTIVE BANDWIDTH CALCULATOR */}
      <section id="pricing" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className={`text-xs font-mono uppercase tracking-widest font-black px-3 py-1 rounded-full border ${dark ? "bg-cyan-950 border-cyan-800/60 text-cyan-400" : "bg-slate-200 border-slate-300 text-cyan-700"}`}>
              {t("transparentPayg")}
            </span>
            <h2 className={`text-3xl sm:text-4xl font-black mt-3 ${dark ? "text-white" : "text-slate-900"}`}>
              {t("scaleBandwidth")}
            </h2>
            <p className={`text-sm mt-2 font-semibold ${dark ? "text-slate-400" : "text-slate-800"}`}>
              {t("noHiddenFees")}
            </p>
          </div>

          {/* Plan Category Tabs */}
          <div className="flex justify-center mb-8">
            <div className={`flex w-full sm:w-auto overflow-x-auto whitespace-nowrap p-1 rounded-xl text-xs font-bold border ${dark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-200 border-slate-300 text-slate-800"}`}>
              <button
                onClick={() => setSelectedPlanType("residential")}
                className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg transition ${
                  selectedPlanType === "residential"
                    ? "bg-cyan-600 text-white font-black shadow-sm"
                    : "text-slate-700 hover:text-black dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {t("residentialDynamic")}
              </button>
              <button type="button" disabled title="Coming Soon" className="shrink-0 px-3 sm:px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">
                {t("stickyComingSoon")}
              </button>
              <button type="button" disabled title="Coming Soon" className="shrink-0 px-3 sm:px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">
                {t("datacenterComingSoon")}
              </button>
              <button type="button" disabled title="Coming Soon" className="shrink-0 px-3 sm:px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">
                {t("mobileComingSoon")}
              </button>
            </div>
          </div>
                    {/* Interactive Pricing Card & Calculator */}
          <div className={`w-full rounded-3xl border p-6 sm:p-10 shadow-2xl relative ${dark ? "bg-gradient-to-b from-[#0f172a] to-[#090e1a] border-cyan-700/40" : "bg-white border-slate-200"}`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full">

              {/* Left: Calculator slider and pricing breakdown */}
              <div className="col-span-1 md:col-span-7 w-full space-y-6">
                <div>
                  <h3 className={`text-2xl font-black ${dark ? "text-white" : "text-slate-900"}`}>
                    {planInfo.name}
                  </h3>

                  <p className={`text-xs mt-1 font-bold ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    {t("poolLabel")}{" "}
                    <span className={`${dark ? "text-cyan-300" : "text-cyan-600"} font-mono font-black`}>
                      {planInfo.pool}
                    </span>{" "}
                    - {t("concurrencyLabel")}{" "}
                    <span className={`${dark ? "text-emerald-400" : "text-emerald-600"} font-mono font-bold`}>
                      {planInfo.concurrency}
                    </span>
                  </p>
                </div>

                {/* Slider */}
                <div className={`space-y-3 p-4 rounded-2xl border ${dark ? "bg-slate-950/80 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>
                      {t("selectedBandwidth")}
                    </span>

                    <span className={`text-xl font-extrabold font-mono ${dark ? "text-cyan-400" : "text-cyan-600"}`}>
                      {gbAmount} GB
                    </span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={gbAmount}
                    onChange={(e) => setGbAmount(parseInt(e.target.value, 10))}
                    className={`w-full accent-cyan-400 cursor-pointer h-2 rounded-lg ${dark ? "bg-slate-800" : "bg-slate-300"}`}
                  />

                  <div className={`flex justify-between text-[11px] font-mono ${dark ? "text-slate-500" : "text-slate-600"}`}>
                    <span>5 GB</span>
                    <span>50 GB</span>
                    <span>100 GB</span>
                    <span>200 GB</span>
                  </div>
                </div>

                {/* Features checklist */}
                <div className="space-y-2">
                  <p className={`text-xs font-mono uppercase ${dark ? "text-slate-400" : "text-slate-600"}`}>
                    {t("includedEveryPlan")}
                  </p>

                  <div className={`grid grid-cols-1 gap-1.5 text-xs ${dark ? "text-slate-300" : "text-slate-700"}`}>
                    {planInfo.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Total Price Box & Checkout Button */}
              <div className="col-span-1 md:col-span-5 w-full min-w-full">
                <div
                  className={`w-full rounded-2xl p-6 border text-center space-y-5 ${
                    dark
                      ? "bg-slate-950/90 border-cyan-800/60"
                      : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400 tracking-wider block uppercase font-black">
                      {t("calculatedRate")}
                    </span>

                    <div className="flex items-baseline justify-center gap-1 mt-1">
                      <span
                        className={`text-4xl font-black font-mono ${
                          dark ? "text-white" : "text-black"
                        }`}
                      >
                        ${planInfo.rate.toFixed(2)}
                      </span>

                      <span
                        className={`text-xs font-black ${
                          dark ? "text-cyan-400" : "text-cyan-700"
                        }`}
                      >
                        / GB
                      </span>
                    </div>

                    {gbAmount >= 50 && (
                      <span
                        className={`inline-block mt-1 text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                          dark
                            ? "bg-emerald-950 border border-emerald-500/40 text-emerald-400"
                            : "bg-emerald-100 border border-emerald-300 text-emerald-800"
                        }`}
                      >
                        {t("volumeDiscount")}
                      </span>
                    )}
                  </div>

                  <div
                    className={`pt-3 border-t ${
                      dark ? "border-slate-900" : "border-slate-200"
                    }`}
                  >
                    <span className="text-xs text-slate-600 block mb-1 font-bold">
                      {t("totalOrderCost")}
                    </span>

                    <span
                      className={`text-3xl font-black font-mono ${
                        dark ? "text-cyan-300" : "text-cyan-600"
                      }`}
                    >
                      ${planInfo.total} USD
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      openCheckout(
                        planInfo.id,
                        planInfo.name,
                        planInfo.rate
                      )
                    }
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm font-mono shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    {t("orderNowPrefix")} {gbAmount} GB
                  </button>

                  <div
                    className={`text-[11px] font-bold ${
                      dark ? "text-slate-500" : "text-slate-400"
                    } space-y-1`}
                  >
                    <p>- {t("instantProvisioning")}</p>
                    <p>- {t("cryptoPayments")}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Close the existing max-width pricing wrapper */}
          </div>
</section>
      {/* GLOBAL NODE NETWORK SPECS */}
      <section id="nodes" className={`py-20 border-t border-b ${dark ? "bg-[#070b14] border-slate-900" : "bg-slate-100 border-slate-200"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className={`text-xs font-mono uppercase tracking-widest font-black ${dark ? "text-cyan-400" : "text-cyan-700"}`}>
                {t("residentialNetwork")}
              </span>
              <h2 className={`text-3xl font-black mt-1 ${dark ? "text-white" : "text-slate-900"}`}>
                {t("residentialLocations")}
              </h2>
            </div>
            <div className={`text-xs font-mono font-bold flex items-center gap-2 ${dark ? "text-slate-400" : "text-slate-700"}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              {t("availabilityByLocation")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { region: "US East (Ashburn)", ping: "14ms", pool: "24.8M IPs", code: "US", speed: "10 Gbps" },
              { region: "US West (San Jose)", ping: "18ms", pool: "19.5M IPs", code: "US", speed: "10 Gbps" },
              { region: "EU Central (Frankfurt)", ping: "22ms", pool: "31.2M IPs", code: "DE", speed: "10 Gbps" },
              { region: "UK (London)", ping: "19ms", pool: "16.2M IPs", code: "GB", speed: "10 Gbps" },
              { region: "Asia Pacific (Tokyo)", ping: "38ms", pool: "9.8M IPs", code: "JP", speed: "10 Gbps" },
              { region: "Singapore Ultra-Fast", ping: "32ms", pool: "8.4M IPs", code: "SG", speed: "10 Gbps" },
              { region: "France (Paris)", ping: "24ms", pool: "11.2M IPs", code: "FR", speed: "10 Gbps" },
              { region: "Australia (Sydney)", ping: "52ms", pool: "5.1M IPs", code: "AU", speed: "10 Gbps" },
            ].map((node, i) => (
              <div
                key={i}
                className={`border rounded-xl p-4 transition-all group ${dark ? "bg-[#0e1526] border-slate-800/80 hover:border-cyan-700/60" : "bg-white border-slate-200 hover:border-cyan-500/50"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-xs font-mono font-black ${dark ? "text-cyan-400" : "text-cyan-700"}`}>{node.code}</span>
                    <h4 className={`font-bold text-sm transition ${dark ? "text-slate-200 group-hover:text-white" : "text-slate-800 group-hover:text-black"}`}>
                      {node.region}
                    </h4>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${dark ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                    {node.ping}
                  </span>
                </div>
                <div className={`flex justify-between text-xs font-mono mt-3 pt-2.5 border-t ${dark ? "text-slate-400 border-slate-800/80" : "text-slate-600 border-slate-200"}`}>
                  <span>Pool: {node.pool}</span>
                  <span className={`${dark ? "text-cyan-300" : "text-cyan-700"} font-bold`}>{node.speed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* CODE SDK INTEGRATION PREVIEW */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className={`text-xs font-mono uppercase tracking-widest font-black ${dark ? "text-cyan-400" : "text-cyan-700"}`}>
              {t("integration")}
            </span>
            <h2 className={`text-3xl font-black mt-1 ${dark ? "text-white" : "text-slate-900"}`}>{t("plugPlay")}</h2>
            <p className={`text-xs mt-2 font-semibold ${dark ? "text-slate-400" : "text-slate-800"}`}>
              {t("compatibleOutOfBox")}
            </p>
          </div>

          <div className={`max-w-3xl mx-auto rounded-2xl border overflow-hidden shadow-2xl ${dark ? "bg-slate-950 border-cyan-800/50" : "bg-white border-slate-200"}`}>
            {/* Tab selector */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? "bg-[#0a0f1d] border-slate-800" : "bg-slate-100 border-slate-200"}`}>
              <div className="flex gap-2">
                {(["curl", "python", "node", "go"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`px-3 py-1 rounded text-xs font-mono uppercase font-semibold transition ${
                      codeLang === lang
                        ? "bg-cyan-500 text-slate-950"
                        : (dark ? "text-slate-300 hover:text-white hover:bg-slate-700" : "text-slate-700 hover:text-slate-950 hover:bg-slate-200")
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={copyCode}
                className={`flex items-center gap-1.5 text-xs font-mono transition ${dark ? "text-slate-400 hover:text-cyan-300" : "text-slate-700 hover:text-cyan-700"}`}
              >
                {copiedCode ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {t("copied")}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    {t("copyCode")}
                  </>
                )}
              </button>
            </div>

            <div className={`p-5 font-mono text-xs overflow-x-auto leading-relaxed ${dark ? "text-slate-200" : "text-slate-800"}`}>
              <pre>{codeSnippets[codeLang]}</pre>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Modals */}
      <PaymentModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        planId={selectedCheckoutPlan.id}
        planName={selectedCheckoutPlan.name}
        pricePerGb={selectedCheckoutPlan.pricePerGb}
        initialGb={gbAmount}
      />


    </div>
  );
}

