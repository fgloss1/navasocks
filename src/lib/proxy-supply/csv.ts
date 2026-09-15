import type { ProxyInventoryItem } from "./types";

function pick(row: Record<string, string>, names: string[]): string {
  for (const name of names) {
    const key = Object.keys(row).find((k) => k.trim().toLowerCase() === name.toLowerCase());
    if (key && row[key]?.trim()) return row[key].trim();
  }
  return "";
}

function numberOrUndefined(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseProxyCsv(csv: string, provider = "unknown"): ProxyInventoryItem[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((x) => x.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(1)) {
    const values = line.split(",").map((x) => x.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push(row);
  }

  return rows
    .map((row): ProxyInventoryItem | null => {
      const ip = pick(row, ["ip", "proxy ip", "address", "host", "proxy host"]);
      const portValue = pick(row, ["port", "proxy port"]);
      const port = Number(portValue);

      if (!ip || !Number.isInteger(port) || port <= 0) return null;

      const protocolRaw = pick(row, ["protocol", "scheme", "type"]).toLowerCase();
      const protocol: ProxyInventoryItem["protocol"] =
        protocolRaw.includes("socks") ? "socks5"
        : protocolRaw.includes("https") ? "https"
        : "http";

      return {
        provider,
        ip,
        port,
        protocol,
        country: pick(row, ["country"]),
        countryCode: pick(row, ["country code", "country_code", "countrycode"]),
        region: pick(row, ["region"]),
        state: pick(row, ["state"]),
        city: pick(row, ["city"]),
        isp: pick(row, ["isp", "organization", "org"]),
        zip: pick(row, ["zip", "zipcode", "postal code"]),
        domain: pick(row, ["domain", "hostname", "reverse dns"]),
        proxyType: pick(row, ["proxy type", "proxy_type", "type"]),
        speedKbps: numberOrUndefined(pick(row, ["speed kbps", "speed_kbps"])),
        ping: numberOrUndefined(pick(row, ["ping", "latency"])),
        cost: numberOrUndefined(pick(row, ["cost", "price", "provider price"])),
      } satisfies ProxyInventoryItem;
    })
    .filter((item): item is ProxyInventoryItem => item !== null);
}