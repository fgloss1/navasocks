import { db } from "@/db";
import { proxyListings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { ProxyInventoryItem } from "./types";

export interface ImportProxyOptions {
  salePrice: number;
  region?: string;
  addedDays?: number;
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  isp?: string;
  zip?: string;
  domain?: string;
}

export interface ImportProxyResult {
  inserted: number;
  updated: number;
  skipped: number;
}

function maskIp(ip: string): string {
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      parts[3] = "**";
      return parts.join(".");
    }
  }

  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 4).join(":")}::`;
  }

  return ip;
}

function speedLabel(speedKbps?: number): string {
  if (!Number.isFinite(speedKbps) || !speedKbps || speedKbps <= 0) {
    return "N/A";
  }

  if (speedKbps >= 1000) {
    return `${(speedKbps / 1000).toFixed(2)}M`;
  }

  return `${Math.round(speedKbps)}k`;
}

function safePrice(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Invalid sale price.");
  }

  return value.toFixed(2);
}

export async function importProxyInventory(
  items: ProxyInventoryItem[],
  options: ImportProxyOptions,
): Promise<ImportProxyResult> {
  const salePrice = safePrice(options.salePrice);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  await db.transaction(async (tx) => {
    for (const item of items) {
      if (!item.ip || !Number.isInteger(item.port) || item.port <= 0) {
        skipped++;
        continue;
      }

      const existingRows = await tx
        .select()
        .from(proxyListings)
        .where(
          and(
            eq(proxyListings.ipFull, item.ip),
            eq(proxyListings.port, item.port),
          ),
        )
        .limit(1);

      const countryCode =
        item.countryCode?.trim() ||
        options.countryCode?.trim() ||
        "US";

      const country =
        item.country?.trim() ||
        options.country?.trim() ||
        "United States";

      const region =
        item.region?.trim() ||
        options.region?.trim() ||
        "usa";

      const state =
        item.state?.trim() ||
        options.state?.trim() ||
        "UNKNOWN";

      const city =
        item.city?.trim() ||
        options.city?.trim() ||
        "Unknown";

      const isp =
        item.isp?.trim() ||
        options.isp?.trim() ||
        "Unknown";

      const zip =
        item.zip?.trim() ||
        options.zip?.trim() ||
        "00000";

      const domain =
        item.domain?.trim() ||
        options.domain?.trim() ||
        item.ip;

      const proxyType =
        item.proxyType?.trim() ||
        (item.protocol === "socks5" ? "SOCKS5" : item.protocol.toUpperCase());

      const speedKbps =
        Number.isFinite(item.speedKbps) && (item.speedKbps ?? 0) > 0
          ? Math.round(item.speedKbps as number)
          : 0;

      const ping =
        Number.isFinite(item.ping) && (item.ping ?? 0) >= 0
          ? Math.round(item.ping as number)
          : 0;

      const payload = {
        ipMasked: maskIp(item.ip),
        ipFull: item.ip,
        port: item.port,
        domain,
        country,
        countryCode,
        region,
        state,
        city,
        isp,
        zip,
        speedLabel: speedLabel(speedKbps),
        speedKbps,
        ping,
        proxyType,
        addedDays: options.addedDays ?? 0,
        price: salePrice,
      };

      const existing = existingRows[0];

      if (!existing) {
        await tx.insert(proxyListings).values({
          ...payload,
          status: "available",
          ownerUserId: null,
        });

        inserted++;
        continue;
      }

      if (existing.status !== "available") {
        skipped++;
        continue;
      }

      await tx
        .update(proxyListings)
        .set(payload)
        .where(eq(proxyListings.id, existing.id));

      updated++;
    }
  });

  return { inserted, updated, skipped };
}