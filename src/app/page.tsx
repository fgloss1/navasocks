"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentModal from "@/components/PaymentModal";

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
          name: "Mobile 4G/5G — Coming Soon Carrier",
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
    curl: `curl -x http://nsk_user_8912:px_sec_99a@pr.navasocks.net:7000 \\
  -L "https://ipinfo.io/json"`,
    python: `import requests

proxies = {
    "http": "http://nsk_user_8912:px_sec_99a@pr.navasocks.net:7000",
    "https": "http://nsk_user_8912:px_sec_99a@pr.navasocks.net:7000"
}

response = requests.get("https://ipinfo.io/json", proxies=proxies, timeout=10)
print(response.json())`,
    node: `const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const proxyAgent = new HttpsProxyAgent(
  'http://nsk_user_8912:px_sec_99a@pr.navasocks.net:7000'
);

axios.get('https://ipinfo.io/json', { httpsAgent: proxyAgent })
  .then(res => console.log(res.data));`,
    go: `package main

import (
    "fmt"
    "net/http"
    "net/url"
    "io/ioutil"
)

func main() {
    proxyUrl, _ := url.Parse("http://nsk_user_8912:px_sec_99a@pr.navasocks.net:7000")
    client := &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(proxyUrl)}}
    
    resp, _ := client.Get("https://ipinfo.io/json")
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
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
    <div className="min-h-screen bg-[#080d19] text-white selection:bg-cyan-500 selection:text-slate-950">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-cyan-950/40">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -top-32 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Residential SOCKS5 Proxy Network</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
                Unblockable Proxies.
                <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
                  Sub-Second Speed.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-light leading-relaxed">
                Harness <strong className="text-white font-semibold">Residential IP access</strong>, Reliable residential connectivity, and location-targeted residential IPs. Residential SOCKS5 access with location targeting and flexible sessions.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/auth/login"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 group font-mono"
                >
                  <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                  Login to Proxy Dashboard
                </Link>

              </div>

              {/* Supported payment icons */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
                <span className="font-mono text-slate-500 uppercase text-[11px]">Automated Gateways:</span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Bitcoin className="w-4 h-4" /> USDT / BTC / LTC
                </span>
                <span className="text-slate-700">-</span>
                <span className="flex items-center gap-1.5 text-blue-300">
                  <CreditCard className="w-4 h-4" /> Crypto Only
                </span>
                <span className="text-slate-700">-</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Shield className="w-3.5 h-3.5" /> Instant Delivery
                </span>
              </div>
            </div>

            {/* Right: Live Interactive Proxy Handshake Tester */}
            <div className="lg:col-span-5">
              <div className="bg-[#0e1628]/95 border border-cyan-800/60 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />

                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-xs font-mono font-bold text-slate-300 ml-2">
                      Live Gateway Sandbox
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300">
                    SOCKS5
                  </span>
                </div>

                {/* Country target selector for tester */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Target Geolocation:</span>
                    <select
                      value={testCountry}
                      onChange={(e) => setTestCountry(e.target.value)}
                      className="bg-slate-900 border border-cyan-900/80 text-cyan-300 rounded px-2.5 py-1 text-xs font-mono outline-none"
                    >
                      <option value="us">ðŸ‡ºðŸ‡¸ United States</option>
                      <option value="de">ðŸ‡©ðŸ‡ª Germany</option>
                      <option value="gb">ðŸ‡¬ðŸ‡§ United Kingdom</option>
                      <option value="jp">ðŸ‡¯ðŸ‡µ Japan</option>
                      <option value="fr">ðŸ‡«ðŸ‡· France</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 break-all space-y-1">
                    <p className="text-slate-500 text-[10px] uppercase">Connection String:</p>
                    <p className="text-cyan-300">
                      pr.navasocks.net:7000:user-nx-country-{testCountry}:px_pass_88
                    </p>
                  </div>

                  <button
                    onClick={handleTestProxy}
                    disabled={testing}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Establishing SSL Handshake...
                      </>
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5" />
                        Execute Live Proxy Ping
                      </>
                    )}
                  </button>
                </div>

                {/* Live ping output */}
                {testResult && (
                  <div className="bg-slate-950/90 rounded-xl p-3 border border-emerald-500/30 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 font-semibold border-b border-slate-900 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Handshake 200 OK
                      </span>
                      <span className="text-white">{testResult.latency} ms Latency</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>
                        <span className="text-slate-500 block">Exit IPv4:</span>
                        <span className="text-cyan-300 font-bold">{testResult.ip}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Carrier/ISP:</span>
                        <span className="text-slate-200 truncate block">{testResult.isp}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Target Location:</span>
                        <span className="text-slate-200">{testResult.country}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Anonymity:</span>
                        <span className="text-emerald-400 font-bold">Elite / Tier 1</span>
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
      <section className="bg-[#0b1120] border-b border-slate-800/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono">75M+</p>
              <p className="text-xs text-slate-400 font-medium">Residential Peer IPs</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-teal-400 font-mono">195+</p>
              <p className="text-xs text-slate-400 font-medium">Countries & Territories</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-mono">&lt; 25ms</p>
              <p className="text-xs text-slate-400 font-medium">Average Response Latency</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">99.98%</p>
              <p className="text-xs text-slate-400 font-medium">Network Uptime SLA</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TABLE & INTERACTIVE BANDWIDTH CALCULATOR */}
      <section id="pricing" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800/60">
              Transparent Pay-As-You-Go Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              Scale Your Bandwidth, Keep Your Balance
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              No hidden fees. Zero monthly commitments. Bandwidth never expires. Automatic volume discounts as your demand expands.
            </p>
          </div>

          {/* Plan Category Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setSelectedPlanType("residential")}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedPlanType === "residential"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Residential Dynamic
              </button>
              <button type="button" disabled title="Coming Soon" className={`px-4 py-2 rounded-lg transition ${
                  selectedPlanType === "sticky"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Residential Sticky ISP — Coming Soon
              </button>
              <button type="button" disabled title="Coming Soon" className={`px-4 py-2 rounded-lg transition ${
                  selectedPlanType === "datacenter"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Datacenter — Coming Soon
              </button>
              <button type="button" disabled title="Coming Soon" className={`px-4 py-2 rounded-lg transition ${
                  selectedPlanType === "mobile"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Mobile 4G/5G — Coming Soon
              </button>
            </div>
          </div>

          {/* Interactive Pricing Card & Calculator */}
          <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#0f172a] to-[#090e1a] rounded-3xl border border-cyan-700/40 p-6 sm:p-10 shadow-2xl relative">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left: Calculator slider and pricing breakdown */}
              <div className="md:col-span-7 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">{planInfo.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Pool: <span className="text-cyan-300 font-mono font-bold">{planInfo.pool}</span> - Concurrency: <span className="text-emerald-400 font-mono">{planInfo.concurrency}</span>
                  </p>
                </div>

                {/* Slider */}
                <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-300">Selected Bandwidth:</span>
                    <span className="text-xl font-extrabold text-cyan-400 font-mono">{gbAmount} GB</span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={gbAmount}
                    onChange={(e) => setGbAmount(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />

                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>5 GB</span>
                    <span>50 GB</span>
                    <span>100 GB</span>
                    <span>200 GB</span>
                  </div>
                </div>

                {/* Features checklist */}
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase text-slate-400">Included With Every Plan:</p>
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-300">
                    {planInfo.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Total Price Box & Checkout Button */}
              <div className="md:col-span-5 bg-slate-950/90 rounded-2xl p-6 border border-cyan-800/60 text-center space-y-5">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                    Calculated Rate
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-4xl font-extrabold text-white font-mono">${planInfo.rate.toFixed(2)}</span>
                    <span className="text-xs text-cyan-400 font-mono">/ GB</span>
                  </div>
                  {gbAmount >= 50 && (
                    <span className="inline-block mt-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-semibold">
                      Volume Discount Applied!
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-900">
                  <span className="text-xs text-slate-400 block mb-1">Total Order Cost:</span>
                  <span className="text-3xl font-black text-cyan-300 font-mono">${planInfo.total} USD</span>
                </div>

                <button
                  onClick={() => openCheckout(planInfo.id, planInfo.name, planInfo.rate)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm font-mono shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Order {gbAmount} GB Now
                </button>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>- Instant Automated Provisioning</p>
                  <p>- Crypto payments: USDT / BTC / LTC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL NODE NETWORK SPECS */}
      <section id="nodes" className="py-20 bg-[#070b14] border-t border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                Residential SOCKS5 Network
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                Residential SOCKS5 Locations
              </h2>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Residential availability varies by location
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
                className="bg-[#0e1526] border border-slate-800/80 hover:border-cyan-700/60 rounded-xl p-4 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400">{node.code}</span>
                    <h4 className="font-semibold text-slate-200 text-sm group-hover:text-white transition">
                      {node.region}
                    </h4>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                    {node.ping}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-mono mt-3 pt-2.5 border-t border-slate-800/80">
                  <span>Pool: {node.pool}</span>
                  <span className="text-cyan-300">{node.speed}</span>
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
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Residential SOCKS5 Integration
            </span>
            <h2 className="text-3xl font-black text-white mt-1">Plug & Play With 3 Lines of Code</h2>
            <p className="text-xs text-slate-400 mt-2">
              Compatible out-of-the-box with Puppeteer, Playwright, Selenium, Scrapy, and all custom bot scripts.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-slate-950 rounded-2xl border border-cyan-800/50 overflow-hidden shadow-2xl">
            {/* Tab selector */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0a0f1d] border-b border-slate-800">
              <div className="flex gap-2">
                {(["curl", "python", "node", "go"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`px-3 py-1 rounded text-xs font-mono uppercase font-semibold transition ${
                      codeLang === lang
                        ? "bg-cyan-500 text-slate-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 font-mono transition"
              >
                {copiedCode ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <div className="p-5 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed">
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
