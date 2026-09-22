const PUBLIC_PORT_BASE = 20000;
const PUBLIC_PORT_MAX = 89999;

/**
 * Maps the unique owned_proxies row id to a deterministic 5-digit
 * NAVA public proxy port.
 */
export function getPublicAccessPort(ownedProxyId: number): number {
  if (!Number.isInteger(ownedProxyId) || ownedProxyId <= 0) {
    throw new Error("Invalid owned proxy id.");
  }

  const port = PUBLIC_PORT_BASE + ownedProxyId;

  if (port < PUBLIC_PORT_BASE + 1 || port > PUBLIC_PORT_MAX) {
    throw new Error(
      `No 5-digit public proxy port available for owned proxy ${ownedProxyId}.`,
    );
  }

  return port;
}

export function getPublicAccessHost(): string {
  const host = process.env.NAVA_PUBLIC_PROXY_HOST?.trim();

  if (!host) {
    throw new Error("NAVA_PUBLIC_PROXY_HOST is required.");
  }

  return host;
}
