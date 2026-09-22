export interface ProxyInventoryItem {
  provider: string;
  ip: string;
  port: number;
  protocol: "http" | "https" | "socks5";
  country?: string;
  countryCode?: string;
  region?: string;
  state?: string;
  city?: string;
  isp?: string;
  zip?: string;
  domain?: string;
  proxyType?: string;
  speedKbps?: number;
  ping?: number;
  cost?: number;
  metadata?: Record<string, string>;
}