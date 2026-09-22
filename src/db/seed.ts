import { db } from "./index";
import { users, proxyPlans, userSubscriptions, transactions, proxyNodes, apiKeys, bandwidthLogs, proxyListings, ownedProxies } from "./schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

type ListingSeed = {
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
};

function listings(): ListingSeed[] {
  const us: ListingSeed[] = [
    { ipMasked: "104.52.**", ipFull: "104.52.18.91", port: 3128, domain: "*.sbcglobal.net", country: "United States", countryCode: "US", region: "usa", state: "TX", city: "Austin", isp: "AT&T Internet", zip: "78748", speedLabel: "4.57M", speedKbps: 4570, ping: 356, proxyType: "ISP/MOB", addedDays: 10, price: "0.80" },
    { ipMasked: "108.21.**", ipFull: "108.21.44.12", port: 8080, domain: "*.verizon.net", country: "United States", countryCode: "US", region: "usa", state: "NY", city: "Brooklyn", isp: "Verizon Fios", zip: "11210", speedLabel: "3.00M", speedKbps: 3000, ping: 95, proxyType: "ISP", addedDays: 193, price: "0.80" },
    { ipMasked: "173.68.**", ipFull: "173.68.201.44", port: 4145, domain: "*.verizon.net", country: "United States", countryCode: "US", region: "usa", state: "NY", city: "Queens", isp: "Verizon Fios", zip: "11428", speedLabel: "794k", speedKbps: 794, ping: 71, proxyType: "ISP", addedDays: 192, price: "0.80" },
    { ipMasked: "67.252.**", ipFull: "67.252.18.77", port: 8000, domain: "*.spectrum.com", country: "United States", countryCode: "US", region: "usa", state: "NY", city: "Buffalo", isp: "Spectrum", zip: "14213", speedLabel: "508k", speedKbps: 508, ping: 73, proxyType: "ISP", addedDays: 99, price: "0.80" },
    { ipMasked: "67.133.**", ipFull: "67.133.90.21", port: 3129, domain: "*.power-net.net", country: "United States", countryCode: "US", region: "usa", state: "MI", city: "Blanchard", isp: "CenturyLink", zip: "49310", speedLabel: "447k", speedKbps: 447, ping: 37, proxyType: "ISP", addedDays: 6, price: "0.80" },
    { ipMasked: "173.20.**", ipFull: "173.20.55.108", port: 8081, domain: "*.mchsi.com", country: "United States", countryCode: "US", region: "usa", state: "AL", city: "Gulf Shores", isp: "Xtream", zip: "36542", speedLabel: "1.20M", speedKbps: 1200, ping: 627, proxyType: "ISP", addedDays: 56, price: "0.80" },
    { ipMasked: "67.86.**", ipFull: "67.86.12.44", port: 1080, domain: "*.spectrum.com", country: "United States", countryCode: "US", region: "usa", state: "NY", city: "New York", isp: "Spectrum", zip: "10031", speedLabel: "1.69M", speedKbps: 1690, ping: 92, proxyType: "ISP", addedDays: 3, price: "0.50" },
    { ipMasked: "184.12.**", ipFull: "184.12.77.19", port: 3128, domain: "*.frontiernet.net", country: "United States", countryCode: "US", region: "usa", state: "SC", city: "Santee", isp: "Frontier Communications", zip: "29142", speedLabel: "208k", speedKbps: 208, ping: 318, proxyType: "ISP", addedDays: 6, price: "0.80" },
    { ipMasked: "35.148.**", ipFull: "35.148.201.66", port: 8001, domain: "*.spectrum.com", country: "United States", countryCode: "US", region: "usa", state: "SC", city: "Union", isp: "Spectrum", zip: "29379", speedLabel: "375k", speedKbps: 375, ping: 329, proxyType: "ISP", addedDays: 3, price: "0.80" },
    { ipMasked: "174.84.**", ipFull: "174.84.33.90", port: 4145, domain: "*.spectrum.com", country: "United States", countryCode: "US", region: "usa", state: "MI", city: "Howard City", isp: "Spectrum", zip: "49329", speedLabel: "3.31M", speedKbps: 3310, ping: 65, proxyType: "ISP", addedDays: 255, price: "0.80" },
    { ipMasked: "38.246.**", ipFull: "38.246.18.22", port: 8080, domain: "38.246.**", country: "United States", countryCode: "US", region: "usa", state: "AR", city: "Batesville", isp: "Hillbilly Wireless", zip: "72501", speedLabel: "674k", speedKbps: 674, ping: 103, proxyType: "ISP", addedDays: 119, price: "0.80" },
    { ipMasked: "47.5.**", ipFull: "47.5.88.14", port: 3128, domain: "*.spectrum.com", country: "United States", countryCode: "US", region: "usa", state: "MT", city: "Billings", isp: "Spectrum", zip: "59105", speedLabel: "622k", speedKbps: 622, ping: 132, proxyType: "ISP", addedDays: 9, price: "0.80" },
    { ipMasked: "64.227.**", ipFull: "64.227.41.77", port: 8000, domain: "64.227.**", country: "United States", countryCode: "US", region: "usa", state: "OK", city: "Bristow", isp: "ecoLINK", zip: "74010", speedLabel: "1.78M", speedKbps: 1780, ping: 79, proxyType: "ISP", addedDays: 311, price: "0.80" },
    { ipMasked: "96.10.**", ipFull: "96.10.55.201", port: 8080, domain: "*.com", country: "United States", countryCode: "US", region: "usa", state: "NC", city: "Durham", isp: "Spectrum Business", zip: "27703", speedLabel: "3.91M", speedKbps: 3910, ping: 425, proxyType: "ISP", addedDays: 344, price: "0.80" },
    { ipMasked: "76.14.**", ipFull: "76.14.22.118", port: 3129, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "CA", city: "San Jose", isp: "Comcast", zip: "95112", speedLabel: "8.20M", speedKbps: 8200, ping: 28, proxyType: "ISP", addedDays: 14, price: "0.80" },
    { ipMasked: "98.33.**", ipFull: "98.33.77.42", port: 4145, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "IL", city: "Chicago", isp: "Comcast", zip: "60614", speedLabel: "6.10M", speedKbps: 6100, ping: 41, proxyType: "ISP", addedDays: 22, price: "0.80" },
    { ipMasked: "71.199.**", ipFull: "71.199.18.90", port: 8080, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "FL", city: "Miami", isp: "Comcast", zip: "33101", speedLabel: "5.44M", speedKbps: 5440, ping: 54, proxyType: "ISP/MOB", addedDays: 8, price: "0.80" },
    { ipMasked: "24.91.**", ipFull: "24.91.66.13", port: 1080, domain: "*.rcn.com", country: "United States", countryCode: "US", region: "usa", state: "MA", city: "Boston", isp: "RCN", zip: "02118", speedLabel: "2.88M", speedKbps: 2880, ping: 48, proxyType: "ISP", addedDays: 41, price: "0.80" },
    { ipMasked: "173.167.**", ipFull: "173.167.44.81", port: 8000, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "PA", city: "Philadelphia", isp: "Comcast", zip: "19103", speedLabel: "4.02M", speedKbps: 4020, ping: 61, proxyType: "ISP", addedDays: 77, price: "0.80" },
    { ipMasked: "68.45.**", ipFull: "68.45.19.200", port: 3128, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "NJ", city: "Newark", isp: "Comcast", zip: "07102", speedLabel: "3.75M", speedKbps: 3750, ping: 39, proxyType: "ISP", addedDays: 18, price: "0.80" },
    { ipMasked: "75.72.**", ipFull: "75.72.101.55", port: 8081, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "MN", city: "Minneapolis", isp: "Comcast", zip: "55401", speedLabel: "2.41M", speedKbps: 2410, ping: 88, proxyType: "ISP", addedDays: 63, price: "0.80" },
    { ipMasked: "70.61.**", ipFull: "70.61.88.14", port: 4145, domain: "*.rr.com", country: "United States", countryCode: "US", region: "usa", state: "OH", city: "Columbus", isp: "Spectrum", zip: "43215", speedLabel: "1.95M", speedKbps: 1950, ping: 74, proxyType: "ISP", addedDays: 29, price: "0.80" },
    { ipMasked: "76.25.**", ipFull: "76.25.44.90", port: 8000, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "CO", city: "Denver", isp: "Comcast", zip: "80202", speedLabel: "7.10M", speedKbps: 7100, ping: 33, proxyType: "ISP", addedDays: 5, price: "0.80" },
    { ipMasked: "73.239.**", ipFull: "73.239.12.77", port: 3128, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "WA", city: "Seattle", isp: "Comcast", zip: "98101", speedLabel: "9.40M", speedKbps: 9400, ping: 22, proxyType: "ISP", addedDays: 11, price: "0.80" },
    { ipMasked: "98.204.**", ipFull: "98.204.66.18", port: 8080, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "MD", city: "Baltimore", isp: "Comcast", zip: "21201", speedLabel: "3.18M", speedKbps: 3180, ping: 57, proxyType: "ISP", addedDays: 90, price: "0.80" },
    { ipMasked: "174.109.**", ipFull: "174.109.33.41", port: 1080, domain: "*.rr.com", country: "United States", countryCode: "US", region: "usa", state: "NC", city: "Raleigh", isp: "Spectrum", zip: "27601", speedLabel: "2.66M", speedKbps: 2660, ping: 69, proxyType: "ISP", addedDays: 44, price: "0.80" },
    { ipMasked: "76.103.**", ipFull: "76.103.88.22", port: 8001, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "CA", city: "Los Angeles", isp: "Comcast", zip: "90012", speedLabel: "12.4M", speedKbps: 12400, ping: 19, proxyType: "ISP/MOB", addedDays: 2, price: "0.90" },
    { ipMasked: "71.56.**", ipFull: "71.56.201.9", port: 3128, domain: "*.comcast.net", country: "United States", countryCode: "US", region: "usa", state: "GA", city: "Atlanta", isp: "Comcast", zip: "30303", speedLabel: "4.88M", speedKbps: 4880, ping: 46, proxyType: "ISP", addedDays: 16, price: "0.80" },
    { ipMasked: "24.123.**", ipFull: "24.123.44.71", port: 4145, domain: "*.rr.com", country: "United States", countryCode: "US", region: "usa", state: "IN", city: "Indianapolis", isp: "Spectrum", zip: "46204", speedLabel: "1.12M", speedKbps: 1120, ping: 101, proxyType: "ISP", addedDays: 120, price: "0.80" },
    { ipMasked: "50.37.**", ipFull: "50.37.18.55", port: 8080, domain: "*.frontier.com", country: "United States", countryCode: "US", region: "usa", state: "OR", city: "Portland", isp: "Frontier", zip: "97201", speedLabel: "3.50M", speedKbps: 3500, ping: 36, proxyType: "ISP", addedDays: 27, price: "0.80" },
  ];

  const america: ListingSeed[] = [
    { ipMasked: "99.224.**", ipFull: "99.224.18.44", port: 3128, domain: "*.bell.ca", country: "Canada", countryCode: "CA", region: "america", state: "ON", city: "Toronto", isp: "Bell Canada", zip: "M5V", speedLabel: "5.10M", speedKbps: 5100, ping: 42, proxyType: "ISP", addedDays: 21, price: "0.85" },
    { ipMasked: "184.145.**", ipFull: "184.145.66.12", port: 8080, domain: "*.rogers.com", country: "Canada", countryCode: "CA", region: "america", state: "QC", city: "Montreal", isp: "Rogers", zip: "H2X", speedLabel: "3.22M", speedKbps: 3220, ping: 55, proxyType: "ISP", addedDays: 48, price: "0.85" },
    { ipMasked: "187.32.**", ipFull: "187.32.90.18", port: 4145, domain: "*.virtua.com.br", country: "Brazil", countryCode: "BR", region: "america", state: "SP", city: "Sao Paulo", isp: "Claro", zip: "01310", speedLabel: "2.04M", speedKbps: 2040, ping: 118, proxyType: "ISP/MOB", addedDays: 9, price: "0.70" },
    { ipMasked: "189.11.**", ipFull: "189.11.44.77", port: 8000, domain: "*.oi.com.br", country: "Brazil", countryCode: "BR", region: "america", state: "RJ", city: "Rio de Janeiro", isp: "Oi", zip: "20040", speedLabel: "1.44M", speedKbps: 1440, ping: 141, proxyType: "ISP", addedDays: 33, price: "0.70" },
    { ipMasked: "187.141.**", ipFull: "187.141.22.9", port: 3128, domain: "*.prod-infinitum.com.mx", country: "Mexico", countryCode: "MX", region: "america", state: "CDMX", city: "Mexico City", isp: "Telmex", zip: "06600", speedLabel: "2.80M", speedKbps: 2800, ping: 89, proxyType: "ISP", addedDays: 17, price: "0.75" },
    { ipMasked: "181.43.**", ipFull: "181.43.88.14", port: 8080, domain: "*.vtr.net", country: "Chile", countryCode: "CL", region: "america", state: "RM", city: "Santiago", isp: "VTR", zip: "8320000", speedLabel: "1.90M", speedKbps: 1900, ping: 133, proxyType: "ISP", addedDays: 61, price: "0.70" },
  ];

  const europe: ListingSeed[] = [
    { ipMasked: "79.194.**", ipFull: "79.194.18.55", port: 3128, domain: "*.t-ipconnect.de", country: "Germany", countryCode: "DE", region: "europe", state: "HE", city: "Frankfurt", isp: "Deutsche Telekom", zip: "60311", speedLabel: "8.80M", speedKbps: 8800, ping: 18, proxyType: "ISP", addedDays: 12, price: "0.90" },
    { ipMasked: "88.153.**", ipFull: "88.153.44.21", port: 8080, domain: "*.versanet.de", country: "Germany", countryCode: "DE", region: "europe", state: "BY", city: "Munich", isp: "Vodafone DE", zip: "80331", speedLabel: "6.40M", speedKbps: 6400, ping: 24, proxyType: "ISP", addedDays: 40, price: "0.90" },
    { ipMasked: "82.32.**", ipFull: "82.32.77.10", port: 4145, domain: "*.btcentralplus.com", country: "United Kingdom", countryCode: "GB", region: "europe", state: "ENG", city: "London", isp: "BT", zip: "EC2A", speedLabel: "7.20M", speedKbps: 7200, ping: 21, proxyType: "ISP", addedDays: 7, price: "0.90" },
    { ipMasked: "86.150.**", ipFull: "86.150.12.88", port: 8000, domain: "*.virginm.net", country: "United Kingdom", countryCode: "GB", region: "europe", state: "ENG", city: "Manchester", isp: "Virgin Media", zip: "M1", speedLabel: "4.55M", speedKbps: 4550, ping: 29, proxyType: "ISP/MOB", addedDays: 19, price: "0.90" },
    { ipMasked: "90.63.**", ipFull: "90.63.44.17", port: 3128, domain: "*.proxad.net", country: "France", countryCode: "FR", region: "europe", state: "IDF", city: "Paris", isp: "Free SAS", zip: "75001", speedLabel: "9.10M", speedKbps: 9100, ping: 16, proxyType: "ISP", addedDays: 4, price: "0.90" },
    { ipMasked: "77.248.**", ipFull: "77.248.90.33", port: 8080, domain: "*.ziggo.nl", country: "Netherlands", countryCode: "NL", region: "europe", state: "NH", city: "Amsterdam", isp: "Ziggo", zip: "1012", speedLabel: "11.2M", speedKbps: 11200, ping: 14, proxyType: "ISP", addedDays: 25, price: "0.95" },
    { ipMasked: "88.12.**", ipFull: "88.12.55.41", port: 4145, domain: "*.rima-tde.net", country: "Spain", countryCode: "ES", region: "europe", state: "MD", city: "Madrid", isp: "Telefonica", zip: "28013", speedLabel: "3.70M", speedKbps: 3700, ping: 38, proxyType: "ISP", addedDays: 52, price: "0.80" },
    { ipMasked: "79.41.**", ipFull: "79.41.18.66", port: 8000, domain: "*.tiscali.it", country: "Italy", countryCode: "IT", region: "europe", state: "LM", city: "Rome", isp: "TIM", zip: "00184", speedLabel: "2.95M", speedKbps: 2950, ping: 44, proxyType: "ISP", addedDays: 31, price: "0.80" },
    { ipMasked: "83.6.**", ipFull: "83.6.77.12", port: 3128, domain: "*.tpnet.pl", country: "Poland", countryCode: "PL", region: "europe", state: "MZ", city: "Warsaw", isp: "Orange Polska", zip: "00-001", speedLabel: "4.10M", speedKbps: 4100, ping: 35, proxyType: "ISP", addedDays: 15, price: "0.75" },
  ];

  const oceania: ListingSeed[] = [
    { ipMasked: "101.178.**", ipFull: "101.178.22.44", port: 3128, domain: "*.bigpond.net.au", country: "Australia", countryCode: "AU", region: "oceania", state: "NSW", city: "Sydney", isp: "Telstra", zip: "2000", speedLabel: "6.80M", speedKbps: 6800, ping: 52, proxyType: "ISP", addedDays: 13, price: "0.95" },
    { ipMasked: "110.174.**", ipFull: "110.174.88.19", port: 8080, domain: "*.optusnet.com.au", country: "Australia", countryCode: "AU", region: "oceania", state: "VIC", city: "Melbourne", isp: "Optus", zip: "3000", speedLabel: "5.30M", speedKbps: 5300, ping: 61, proxyType: "ISP", addedDays: 28, price: "0.95" },
    { ipMasked: "49.224.**", ipFull: "49.224.12.77", port: 4145, domain: "*.xtra.co.nz", country: "New Zealand", countryCode: "NZ", region: "oceania", state: "AUK", city: "Auckland", isp: "Spark NZ", zip: "1010", speedLabel: "4.20M", speedKbps: 4200, ping: 78, proxyType: "ISP", addedDays: 36, price: "0.95" },
  ];

  const asia: ListingSeed[] = [
    { ipMasked: "126.66.**", ipFull: "126.66.18.90", port: 3128, domain: "*.ocn.ne.jp", country: "Japan", countryCode: "JP", region: "asia", state: "TK", city: "Tokyo", isp: "NTT", zip: "100-0001", speedLabel: "10.5M", speedKbps: 10500, ping: 31, proxyType: "ISP", addedDays: 6, price: "1.10" },
    { ipMasked: "175.223.**", ipFull: "175.223.44.12", port: 8080, domain: "*.kt.com", country: "South Korea", countryCode: "KR", region: "asia", state: "SE", city: "Seoul", isp: "KT", zip: "04524", speedLabel: "14.2M", speedKbps: 14200, ping: 26, proxyType: "ISP", addedDays: 11, price: "1.10" },
    { ipMasked: "119.74.**", ipFull: "119.74.88.33", port: 4145, domain: "*.singnet.com.sg", country: "Singapore", countryCode: "SG", region: "asia", state: "SG", city: "Singapore", isp: "Singtel", zip: "018956", speedLabel: "12.8M", speedKbps: 12800, ping: 22, proxyType: "ISP", addedDays: 9, price: "1.20" },
    { ipMasked: "117.192.**", ipFull: "117.192.55.18", port: 8000, domain: "*.airtelbroadband.in", country: "India", countryCode: "IN", region: "asia", state: "MH", city: "Mumbai", isp: "Airtel", zip: "400001", speedLabel: "3.40M", speedKbps: 3400, ping: 67, proxyType: "ISP/MOB", addedDays: 20, price: "0.65" },
    { ipMasked: "14.136.**", ipFull: "14.136.22.71", port: 3128, domain: "*.hkcsl.com", country: "Hong Kong", countryCode: "HK", region: "asia", state: "HK", city: "Hong Kong", isp: "HKT", zip: "999077", speedLabel: "9.60M", speedKbps: 9600, ping: 28, proxyType: "ISP", addedDays: 18, price: "1.00" },
  ];

  const africa: ListingSeed[] = [
    { ipMasked: "105.186.**", ipFull: "105.186.44.12", port: 3128, domain: "*.telkomsa.net", country: "South Africa", countryCode: "ZA", region: "africa", state: "GP", city: "Johannesburg", isp: "Telkom", zip: "2001", speedLabel: "2.10M", speedKbps: 2100, ping: 94, proxyType: "ISP", addedDays: 24, price: "0.70" },
    { ipMasked: "41.58.**", ipFull: "41.58.18.77", port: 8080, domain: "*.mtn.com.ng", country: "Nigeria", countryCode: "NG", region: "africa", state: "LA", city: "Lagos", isp: "MTN", zip: "100001", speedLabel: "1.05M", speedKbps: 1050, ping: 128, proxyType: "ISP/MOB", addedDays: 14, price: "0.60" },
    { ipMasked: "156.208.**", ipFull: "156.208.33.19", port: 4145, domain: "*.tedata.net", country: "Egypt", countryCode: "EG", region: "africa", state: "C", city: "Cairo", isp: "TE Data", zip: "11511", speedLabel: "1.60M", speedKbps: 1600, ping: 112, proxyType: "ISP", addedDays: 39, price: "0.60" },
  ];

  return [...us, ...america, ...europe, ...oceania, ...asia, ...africa];
}

export async function seedDatabase() {
  try {
    const existingPlans = await db.select({ count: sql<number>`count(*)` }).from(proxyPlans);
    const plansExist = Number(existingPlans[0]?.count) > 0;

    if (!plansExist) {
      const plansData = [
        {
          id: "residential_dynamic",
          name: "Residential Dynamic (Rotating)",
          type: "residential",
          pricePerGb: "3.50",
          poolSize: "75M+ Real Peer IPs",
          protocol: "HTTP / HTTPS / SOCKS5",
          concurrency: "Unlimited Threads",
          features: JSON.stringify(["75M+ ethically-sourced residential IPs", "Country, City, State, & ASN targeting"]),
          isActive: true,
          description: "Global rotating residential proxies.",
        },
        {
          id: "residential_sticky",
          name: "Residential Premium Sticky ISP",
          type: "residential",
          pricePerGb: "4.80",
          poolSize: "35M+ Clean ISP IPs",
          protocol: "HTTP / HTTPS / SOCKS5",
          concurrency: "Unlimited Threads",
          features: JSON.stringify(["Extended sticky sessions up to 60+ minutes"]),
          isActive: true,
          description: "Static and sticky residential proxies.",
        },
        {
          id: "datacenter_shared",
          name: "Datacenter High-Speed",
          type: "datacenter",
          pricePerGb: "0.80",
          poolSize: "500K+ Server IPs",
          protocol: "HTTP / HTTPS / SOCKS5",
          concurrency: "1,000 Concurrent Connections",
          features: JSON.stringify(["Blazing fast <15ms response latency"]),
          isActive: true,
          description: "Enterprise datacenter proxy network.",
        },
        {
          id: "mobile_lte",
          name: "Mobile 4G/5G LTE Carrier",
          type: "mobile",
          pricePerGb: "6.90",
          poolSize: "15M+ Cellular IPs",
          protocol: "HTTP / HTTPS / SOCKS5",
          concurrency: "Unlimited Threads",
          features: JSON.stringify(["Authentic mobile modem SIM card endpoints"]),
          isActive: true,
          description: "Undetectable real mobile device IPs.",
        },
        {
          id: "datacenter_dedicated",
          name: "Datacenter Dedicated (Private)",
          type: "datacenter",
          pricePerGb: "1.40",
          poolSize: "Exclusive 1:1 Assigned",
          protocol: "HTTP / HTTPS / SOCKS5",
          concurrency: "Unlimited Threads",
          features: JSON.stringify(["Exclusively assigned to your account only"]),
          isActive: true,
          description: "100% private dedicated datacenter IPs.",
        },
      ];

      for (const plan of plansData) {
        await db.insert(proxyPlans).values(plan).onConflictDoNothing();
      }
    }

    const userPassword = await bcrypt.hash("Password123!", 10);
    const adminPassword = await bcrypt.hash("AdminPassword123!", 10);

    await db.execute(sql`
      UPDATE users SET username = 'Xander000', name = 'Xander000', balance = 42.58
      WHERE email = 'user@nsocks.io' AND (username IS NULL OR username = '' OR username <> 'Xander000');
    `);
    await db.execute(sql`
      UPDATE users SET username = 'admin' WHERE email = 'admin@nsocks.io' AND (username IS NULL OR username = '');
    `);

    const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    if (Number(existingUsers[0]?.count) === 0) {
      const [normalUser] = await db
        .insert(users)
        .values({
          username: "Xander000",
          email: "user@nsocks.io",
          name: "Xander000",
          passwordHash: userPassword,
          role: "user",
          twoFactorEnabled: false,
          balance: "42.58",
          status: "active",
        })
        .returning();

      await db.insert(users).values({
        username: "admin",
        email: "admin@nsocks.io",
        name: "System Admin",
        passwordHash: adminPassword,
        role: "admin",
        twoFactorEnabled: true,
        twoFactorSecret: "JBSWY3DPEHPK3PXP",
        balance: "850.00",
        status: "active",
      });

      const oneMonthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.insert(userSubscriptions).values([
        {
          id: "sub_res_dyn_8812",
          userId: normalUser.id,
          planId: "residential_dynamic",
          allocatedGb: "25.00",
          usedGb: "9.35",
          status: "active",
          proxyUsername: "nsk_res_94812",
          proxyPassword: "px_sec_a8f93e21",
          ipWhitelist: "192.168.1.1, 73.189.44.12",
          expiresAt: oneMonthFromNow,
        },
        {
          id: "sub_dc_shr_5521",
          userId: normalUser.id,
          planId: "datacenter_shared",
          allocatedGb: "50.00",
          usedGb: "18.20",
          status: "active",
          proxyUsername: "nsk_dc_39201",
          proxyPassword: "px_sec_99b04d18",
          ipWhitelist: "73.189.44.12",
          expiresAt: oneMonthFromNow,
        },
      ]);

      await db.insert(apiKeys).values([
        {
          userId: normalUser.id,
          keyName: "Production Scraper Key",
          apiKey: "nsk_live_89a3f2b1c4e90871d34e819b",
          lastUsedAt: new Date(Date.now() - 1000 * 60 * 15),
        },
      ]);

      await db.insert(transactions).values([
        {
          id: "tx_np_89410924",
          userId: normalUser.id,
          amount: "8.00",
          currency: "USDT",
          paymentMethod: "crypto_nowpayments",
          paymentAddress: "0x71c82f913d8a6e87b28c01b1e94812f8374d921b",
          txHash: "0x9ef03a891cb09472d8a3910cbe7781b491204cf8290192841a0e9821894a82f3",
          status: "completed",
          planId: "residential_dynamic",
          gbPurchased: "0.00",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        },
      ]);

      const sampleHosts = ["api.ipify.org", "google.com", "nike.com", "amazon.com"];
      const countries = ["US", "DE", "GB", "JP"];
      const logs = [];
      for (let i = 12; i >= 0; i--) {
        logs.push({
          userId: normalUser.id,
          subscriptionId: "sub_res_dyn_8812",
          megabytesUsed: (Math.random() * 450 + 50).toFixed(2),
          protocol: i % 2 === 0 ? "HTTPS" : "SOCKS5",
          targetHost: sampleHosts[i % sampleHosts.length],
          countryCode: countries[i % countries.length],
          timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
        });
      }
      await db.insert(bandwidthLogs).values(logs);
    }

    const existingNodes = await db.select({ count: sql<number>`count(*)` }).from(proxyNodes);
    if (Number(existingNodes[0]?.count) === 0) {
      await db.insert(proxyNodes).values([
        { nodeId: "us-east-res-01", name: "US East (Virginia) Pool", type: "residential", ipAddress: "198.51.100.24", country: "United States", city: "Ashburn", countryCode: "US", status: "online", latencyMs: 14, currentConnections: 18420, bandwidthMbps: "840.50", totalRequests: 2489000 },
        { nodeId: "eu-central-dc-01", name: "EU Central (Frankfurt) Hub", type: "datacenter", ipAddress: "203.0.113.45", country: "Germany", city: "Frankfurt", countryCode: "DE", status: "online", latencyMs: 22, currentConnections: 29800, bandwidthMbps: "1850.00", totalRequests: 4120000 },
        { nodeId: "ap-east-res-01", name: "Asia Pacific (Tokyo) Gateway", type: "residential", ipAddress: "198.51.100.198", country: "Japan", city: "Tokyo", countryCode: "JP", status: "online", latencyMs: 38, currentConnections: 8940, bandwidthMbps: "420.80", totalRequests: 980000 },
      ]);
    }

    const existingListings = await db.select({ count: sql<number>`count(*)` }).from(proxyListings);
    if (Number(existingListings[0]?.count) === 0) {
      await db.insert(proxyListings).values(listings());
    }


    return { success: true };
  } catch (err) {
    console.error("Error seeding database:", err);
    throw err;
  }
}
