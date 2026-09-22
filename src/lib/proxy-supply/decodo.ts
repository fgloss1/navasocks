import { isIP } from "node:net";
import { parseProxyCsv } from "./csv";
import type { ProxyInventoryItem } from "./types";

export interface DecodoInventoryResult {
  accepted: ProxyInventoryItem[];
  rejected: number;
}

export function parseDecodoDedicatedCsv(csv: string): DecodoInventoryResult {
  const parsed = parseProxyCsv(csv, "decodo");

  const accepted: ProxyInventoryItem[] = [];
  let rejected = 0;

  for (const item of parsed) {
    /*
     * NAVA SOCKS sells individual proxy IPs.
     *
     * Reject gateway/domain endpoints such as:
     * gate.decodo.com
     * us.decodo.com
     *
     * Those are provider entry points, not individual sellable IPs.
     */
    if (isIP(item.ip) === 0) {
      rejected++;
      continue;
    }

    accepted.push({
      ...item,
      provider: "decodo",
      protocol: item.protocol === "socks5"
        ? "socks5"
        : item.protocol,
      proxyType: item.proxyType || "ISP",
    });
  }

  return {
    accepted,
    rejected,
  };
}