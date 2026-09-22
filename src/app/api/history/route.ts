import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { ownedProxies, proxyListings, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let sessionUser = await getSessionUser();


    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const history = await db
      .select({
        id: ownedProxies.id,
        listingId: ownedProxies.listingId,
        purchasedAt: ownedProxies.createdAt,

        ip: ownedProxies.ip,
        port: ownedProxies.port,
        countryCode: ownedProxies.countryCode,
        state: proxyListings.state,
        city: ownedProxies.city,
        isp: ownedProxies.isp,

        locked: ownedProxies.locked,

        provider: ownedProxies.provider,
        transportHost: ownedProxies.transportHost,
        transportPort: ownedProxies.transportPort,

        accessUsername: ownedProxies.accessUsername,
        accessHost: ownedProxies.accessHost,
        accessPort: ownedProxies.accessPort,

        publicAccessHost: ownedProxies.publicAccessHost,
        publicAccessPort: ownedProxies.publicAccessPort,

        price: proxyListings.price,
        proxyType: proxyListings.proxyType,
      })
      .from(ownedProxies)
      .leftJoin(
        proxyListings,
        eq(ownedProxies.listingId, proxyListings.id),
      )
      .where(eq(ownedProxies.userId, sessionUser.id))
      .orderBy(desc(ownedProxies.createdAt));

    return NextResponse.json({
      history,
    });
  } catch (error) {
    console.error("GET /api/history error:", error);

    return NextResponse.json(
      { error: "Failed to load proxy history" },
      { status: 500 },
    );
  }
}
