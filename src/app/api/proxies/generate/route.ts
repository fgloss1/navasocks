import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { userSubscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    let sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      subscriptionId,
      proxyType = "residential",
      protocol = "HTTP", // 'HTTP' | 'SOCKS5'
      country = "all", // 'all' | 'us' | 'gb' | 'de' | 'jp' | etc.
      city = "",
      state = "",
      sessionType = "rotating", // 'rotating' | 'sticky'
      sessionDuration = 30, // in minutes
      format = "ip:port:user:pass", // 'ip:port:user:pass' | 'user:pass@ip:port' | 'socks5://...' | 'curl'
      count = 5,
    } = body;

    // Get user's subscription or fallback to default
    let sub = null;
    if (subscriptionId) {
      [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, subscriptionId)).limit(1);
    }
    if (!sub) {
      const [firstSub] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, sessionUser.id))
        .limit(1);
      sub = firstSub;
    }

    const baseUser = sub?.proxyUsername || `user_${sessionUser.id}`;
    const basePass = sub?.proxyPassword;

    if (!basePass) {
      return NextResponse.json(
        {
          error:
            "An active proxy subscription is required before generating proxy credentials.",
        },
        { status: 403 }
      );
    }

    // Ports based on proxyType and protocol
    const gatewayHost = proxyType === "datacenter" ? "dc.navasocks.net" : proxyType === "mobile" ? "mobile.navasocks.net" : "pr.navasocks.net";
    const port = protocol === "SOCKS5" ? 1080 : 7000;

    const proxyList: string[] = [];
    const proxyObjects = [];

    const clampedCount = Math.min(Math.max(1, parseInt(count, 10) || 5), 100);

    for (let i = 0; i < clampedCount; i++) {
      let usernameParts = [baseUser];

      if (country && country !== "all") {
        usernameParts.push(`country-${country.toLowerCase()}`);
      }

      if (state && state.trim()) {
        usernameParts.push(`state-${state.toLowerCase().trim()}`);
      }

      if (city && city.trim()) {
        usernameParts.push(`city-${city.toLowerCase().trim().replace(/\s+/g, "_")}`);
      }

      if (sessionType === "sticky") {
        const sessionId = Math.random().toString(36).substring(2, 8);
        usernameParts.push(`sess-${sessionId}`);
        usernameParts.push(`dur-${sessionDuration}m`);
      } else {
        usernameParts.push(`rotating-${Math.random().toString(36).substring(2, 6)}`);
      }

      const formattedUser = usernameParts.join("-");
      const formattedPass = basePass;

      let entry = "";
      if (format === "user:pass@ip:port") {
        entry = `${formattedUser}:${formattedPass}@${gatewayHost}:${port}`;
      } else if (format === "socks5://user:pass@ip:port") {
        entry = `socks5://${formattedUser}:${formattedPass}@${gatewayHost}:${port}`;
      } else if (format === "http://user:pass@ip:port") {
        entry = `http://${formattedUser}:${formattedPass}@${gatewayHost}:${port}`;
      } else if (format === "curl") {
        const proto = protocol === "SOCKS5" ? "socks5" : "http";
        entry = `curl -x ${proto}://${formattedUser}:${formattedPass}@${gatewayHost}:${port} https://ipinfo.io/json`;
      } else {
        // default ip:port:user:pass
        entry = `${gatewayHost}:${port}:${formattedUser}:${formattedPass}`;
      }

      proxyList.push(entry);
      proxyObjects.push({
        host: gatewayHost,
        port,
        username: formattedUser,
        password: formattedPass,
        protocol,
        country: country.toUpperCase(),
        sessionType,
      });
    }

    return NextResponse.json({
      success: true,
      count: proxyList.length,
      proxies: proxyList,
      details: proxyObjects,
      gatewayHost,
      port,
      protocol,
    });
  } catch (error) {
    console.error("Proxy generate error:", error);
    return NextResponse.json({ error: "Failed to generate proxies" }, { status: 500 });
  }
}

