import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { resolve4, reverse } from "node:dns/promises";
import { db } from "@/db";
import { proxyListings, users, userSubscriptions, proxyPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { initDb } from "@/db/init";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

type JsonRecord = Record<string, unknown>;

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractRdapOrg(data: JsonRecord): string | null {
  const directName =
    stringValue(data.name) ||
    stringValue(data.organizationName) ||
    stringValue(data.orgName);

  if (directName) return directName;

  const entities = Array.isArray(data.entities) ? data.entities : [];

  for (const entity of entities) {
    if (!entity || typeof entity !== "object") continue;

    const item = entity as JsonRecord;

    const vcardArray = item.vcardArray;

    if (
      Array.isArray(vcardArray) &&
      Array.isArray(vcardArray[1])
    ) {
      for (const field of vcardArray[1]) {
        if (!Array.isArray(field) || field.length < 4) continue;

        const fieldName = String(field[0] || "").toLowerCase();

        if (
          fieldName === "fn" ||
          fieldName === "org"
        ) {
          const value = stringValue(field[3]);
          if (value) return value;
        }
      }
    }

    const entityName =
      stringValue(item.name) ||
      stringValue(item.fn) ||
      stringValue(item.organizationName);

    if (entityName) return entityName;
  }

  return null;
}

const FETCH_JSON_CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_JSON_CACHE_MAX = 256;

const fetchJsonCache = new Map<
  string,
  {
    expiresAt: number;
    promise: Promise<JsonRecord | null>;
  }
>();

function trimFetchJsonCache() {
  while (fetchJsonCache.size > FETCH_JSON_CACHE_MAX) {
    const firstKey = fetchJsonCache.keys().next().value as string | undefined;
    if (!firstKey) break;
    fetchJsonCache.delete(firstKey);
  }
}

async function fetchJson(
  url: string,
  timeoutMs = 2500
): Promise<JsonRecord | null> {
  const now = Date.now();
  const cached = fetchJsonCache.get(url);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = fetchJsonUncached(url, timeoutMs);

  fetchJsonCache.set(url, {
    expiresAt: now + FETCH_JSON_CACHE_TTL_MS,
    promise,
  });

  trimFetchJsonCache();

  try {
    return await promise;
  } catch {
    fetchJsonCache.delete(url);
    return null;
  }
}
async function fetchJsonUncached(
  url: string,
  timeoutMs = 2500
): Promise<JsonRecord | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "NavaSocks/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (!data || typeof data !== "object") {
      return null;
    }

    return data as JsonRecord;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const REVERSE_DNS_CACHE_TTL_MS = 10 * 60 * 1000;
const REVERSE_DNS_CACHE_MAX = 256;

const reverseDnsCache = new Map<
  string,
  {
    expiresAt: number;
    promise: Promise<string | null>;
  }
>();

function trimReverseDnsCache() {
  while (reverseDnsCache.size > REVERSE_DNS_CACHE_MAX) {
    const firstKey = reverseDnsCache.keys().next().value as string | undefined;
    if (!firstKey) break;
    reverseDnsCache.delete(firstKey);
  }
}

async function getReverseDns(ip: string): Promise<string | null> {
  const now = Date.now();
  const cached = reverseDnsCache.get(ip);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = getReverseDnsUncached(ip);

  reverseDnsCache.set(ip, {
    expiresAt: now + REVERSE_DNS_CACHE_TTL_MS,
    promise,
  });

  trimReverseDnsCache();

  try {
    return await promise;
  } catch {
    reverseDnsCache.delete(ip);
    return null;
  }
}

async function getReverseDnsViaDoh(ip: string): Promise<string | null> {
  try {
    if (!isIP(ip) || ip.includes(":")) return null;

    const octets = ip.split(".").reverse();

    if (octets.length !== 4) return null;

    const ptrName =
      `${octets.join(".")}.in-addr.arpa`;

    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(ptrName)}&type=PTR`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/dns-json",
        },
        signal: AbortSignal.timeout(2500),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (!data || !Array.isArray(data.Answer)) {
      return null;
    }

    const answer = data.Answer.find(
      (item: unknown) =>
        item &&
        typeof item === "object" &&
        (item as { type?: unknown }).type === 12 &&
        typeof (item as { data?: unknown }).data === "string"
    );

    if (!answer) return null;

    const value=(answer as {data:string}).data.trim();

    return value || null;
  } catch {
    return null;
  }
}
async function getReverseDnsUncached(ip: string): Promise<string | null> {
  const timeout = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 2500);
  });

  const lookup = reverse(ip)
    .then((names) => {
      if (!names.length) return null;
      return names[0] || null;
    })
    .catch(() => null);

  return Promise.race([lookup, timeout]);
}

async function getRdap(ip: string): Promise<JsonRecord | null> {
  return fetchJson(
    `https://rdap.arin.net/bootstrap/ip/${encodeURIComponent(ip)}`
  );
}

async function getIpinfo(ip: string): Promise<JsonRecord | null> {
  const token = process.env.IPINFO_TOKEN?.trim();

  if (!token) {
    return null;
  }

  return fetchJson(
    `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${encodeURIComponent(token)}`
  );
}

function getIpType(ipinfo: JsonRecord | null): string | null {
  if (!ipinfo) return null;

  const privacy = ipinfo.privacy;

  if (privacy && typeof privacy === "object") {
    const p = privacy as JsonRecord;

    if (p.residential === true) return "Residential";
    if (p.proxy === true) return "Proxy";
    if (p.hosting === true) return "Hosting";
    if (p.vpn === true) return "VPN";
    if (p.tor === true) return "Tor";
  }

  const company = ipinfo.company;

  if (company && typeof company === "object") {
    const c = company as JsonRecord;
    const type = stringValue(c.type);

    if (type) {
      if (type.toLowerCase().includes("isp")) return "ISP";
      if (type.toLowerCase().includes("hosting")) return "Hosting";
      if (type.toLowerCase().includes("business")) return "Business";
    }
  }

  return null;
}


function getListingTimezone(
  countryCode: string | null,
  state: string | null
): string | null {
  if (countryCode !== "US" || !state) return null;

  const pacific = new Set([
    "CA", "OR", "WA", "NV"
  ]);

  const mountain = new Set([
    "AZ", "CO", "ID", "MT", "NM", "UT", "WY"
  ]);

  const central = new Set([
    "AL", "AR", "IA", "IL", "KS", "LA", "MN", "MO",
    "MS", "ND", "NE", "OK", "SD", "TN", "TX", "WI"
  ]);

  const eastern = new Set([
    "CT", "DE", "FL", "GA", "IN", "KY", "MA", "MD",
    "ME", "MI", "NC", "NH", "NJ", "NY", "OH", "PA",
    "RI", "SC", "VA", "VT", "WV", "DC"
  ]);

  if (pacific.has(state)) return "America/Los_Angeles";
  if (mountain.has(state)) return "America/Denver";
  if (central.has(state)) return "America/Chicago";
  if (eastern.has(state)) return "America/New_York";

  return null;
}

function getProxyQuality(
  ping: number | null,
  speedKbps: number | null,
  proxyType: string | null
): string | null {
  if (ping == null && speedKbps == null) return null;

  const mbps =
    typeof speedKbps === "number" && Number.isFinite(speedKbps)
      ? speedKbps / 1000
      : 0;

  if ((ping ?? 9999) <= 50 && mbps >= 10) {
    return "Excellent";
  }

  if ((ping ?? 9999) <= 80 && mbps >= 5) {
    return "Good";
  }

  if ((ping ?? 9999) <= 150 && mbps >= 2) {
    return "Fair";
  }

  if (proxyType) {
    return "Available";
  }

  return "Limited";
}

const DNS_BLACKLISTS = [
  "zen.spamhaus.org",
  "bl.spamcop.net",
  "b.barracudacentral.org",
];

async function checkDnsBlacklist(ip: string): Promise<boolean | null> {
  if (!isIP(ip) || ip.includes(":")) {
    return null;
  }

  const reversed = ip.split(".").reverse().join(".");

  const results = await Promise.all(
    DNS_BLACKLISTS.map(async (list) => {
      const hostname = `${reversed}.${list}`;

      try {
        const answers = await Promise.race([
          resolve4(hostname),
          new Promise<string[]>((resolve) => {
            setTimeout(() => resolve([]), 2500);
          }),
        ]);

        return {
          hit: Array.isArray(answers) && answers.length > 0,
          completed: true,
        };
      } catch {
        return {
          hit: false,
          completed: false,
        };
      }
    })
  );

  if (results.some((item) => item.hit)) {
    return true;
  }

  if (results.some((item) => !item.completed)) {
    return null;
  }

  return false;
}
export async function GET(req: Request) {
  try {
    await initDb();

    const { searchParams } = new URL(req.url);
    const idText = searchParams.get("id") || "";
    const id = Number(idText);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid listing id." },
        { status: 400 }
      );
    }

    let sessionUser = await getSessionUser();


    if (!sessionUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const [listing] = await db
      .select({
        id: proxyListings.id,
        ipFull: proxyListings.ipFull,
        ipMasked: proxyListings.ipMasked,
        country: proxyListings.country,
        countryCode: proxyListings.countryCode,
        region: proxyListings.region,
        state: proxyListings.state,
        city: proxyListings.city,
        zip: proxyListings.zip,
        isp: proxyListings.isp,
        domain: proxyListings.domain,
        proxyType: proxyListings.proxyType,
        ping: proxyListings.ping,
        speedLabel: proxyListings.speedLabel,
        addedDays: proxyListings.addedDays,
        price: proxyListings.price,
      })
      .from(proxyListings)
      .where(eq(proxyListings.id, id))
      .limit(1);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    const [activeSubscription] = await db
      .select({
        allocatedGb: userSubscriptions.allocatedGb,
        usedGb: userSubscriptions.usedGb,
        protocol: proxyPlans.protocol,
      })
      .from(userSubscriptions)
      .leftJoin(proxyPlans, eq(userSubscriptions.planId, proxyPlans.id))
      .where(eq(userSubscriptions.userId, sessionUser.id))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    const ip = String(listing.ipFull || "").trim();

    if (!ip || !isIP(ip)) {
      return NextResponse.json(
        {
          error: "Listing does not contain a valid IP address.",
          details: {
            listingId: listing.id,
            available: false,
          },
        },
        { status: 422 }
      );
    }

    const [rdap, reverseDns, ipinfo] = await Promise.all([
      getRdap(ip),
      getReverseDns(ip),
      getIpinfo(ip),
    ]);

    const rdapOrg = rdap ? extractRdapOrg(rdap) : null;

    const ipinfoOrg =
      ipinfo && typeof ipinfo.org === "string"
        ? ipinfo.org
        : null;

    const ipinfoTimezone =
      ipinfo && typeof ipinfo.timezone === "string"
        ? ipinfo.timezone
        : null;

    const ipinfoHostname =
      ipinfo && typeof ipinfo.hostname === "string"
        ? ipinfo.hostname
        : null;

    const ipType = getIpType(ipinfo) || listing.proxyType || null;
    const listingTimezone = getListingTimezone(listing.countryCode, listing.state);
    const timezone = ipinfoTimezone || listingTimezone;
    const blacklisted = await checkDnsBlacklist(ip);
    const speedKbps = Number(String(listing.speedLabel || "").replace(/[^0-9.]/g, "")) * 1000;
    const proxyQuality = getProxyQuality(listing.ping ?? null, Number.isFinite(speedKbps) ? speedKbps : null, listing.proxyType || null);

    const org =
      ipinfoOrg ||
      rdapOrg ||
      listing.isp ||
      null;

    return NextResponse.json({
      success: true,

      listingId: listing.id,

      location: {
        country: listing.country || null,
        countryCode: listing.countryCode || null,
        region: listing.region || null,
        state: listing.state || null,
        city: listing.city || null,
        zip: listing.zip || null,
        zone: timezone,
      },

      network: {
        org,
        isp: listing.isp || null,
        domain: listing.domain || null,
        reverseDns,
        hostname: ipinfoHostname,
        ipType,
      },

      risk: {
        blacklisted,
        scamalytics: null,
        ipqs: null,
      },
      traffic: {
        includedGb: activeSubscription?.allocatedGb ?? null,
        usedGb: activeSubscription?.usedGb ?? null,
        protocol: activeSubscription?.protocol ?? null,
      },

      quality: {
        proxyQuality,
        addedDays: listing.addedDays ?? null,
        ping: listing.ping ?? null,
        speedLabel: listing.speedLabel || null,
        proxyType: listing.proxyType || null,
      },

      sources: {
        rdap: Boolean(rdap),
        reverseDns: Boolean(reverseDns),
        ipinfo: Boolean(ipinfo),
      },

      note:
        "Full IP is intentionally never returned by this endpoint. Reveal-IP remains a separate billing action.",
    });
  } catch (error) {
    console.error("IP enrichment error:", error);

    return NextResponse.json(
      { error: "Unable to enrich listing details." },
      { status: 500 }
    );
  }
}

