import { NextResponse } from "next/server";
import { db } from "@/db";
import { proxyListings, ownedProxies, users } from "@/db/schema";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const region = searchParams.get("region") || "usa";
    const state = searchParams.get("state") || "";
    const ip = searchParams.get("ip") || "";
    const domain = searchParams.get("domain") || "";
    const city = searchParams.get("city") || "";
    const isp = searchParams.get("isp") || "";
    const zip = searchParams.get("zip") || "";
    const type = searchParams.get("type") || "";
    const sort = searchParams.get("sort") || "added";

    const requestedPage = Number(searchParams.get("page") || "1");
    const requestedPageSize = Number(searchParams.get("pageSize") || "25");

    const page = Number.isFinite(requestedPage)
      ? Math.max(1, Math.floor(requestedPage))
      : 1;

    const pageSize = Number.isFinite(requestedPageSize)
      ? Math.min(150, Math.max(1, Math.floor(requestedPageSize)))
      : 25;

    const filters = [eq(proxyListings.status, "available")];

    if (region && region !== "all") {
      filters.push(eq(proxyListings.region, region));
    }

    if (state) {
      filters.push(eq(proxyListings.state, state.toUpperCase()));
    }

    if (ip) {
      filters.push(ilike(proxyListings.ipMasked, `%${ip}%`));
    }

    if (domain) {
      filters.push(ilike(proxyListings.domain, `%${domain}%`));
    }

    if (city) {
      filters.push(ilike(proxyListings.city, `%${city}%`));
    }

    if (isp) {
      filters.push(ilike(proxyListings.isp, `%${isp}%`));
    }

    if (zip) {
      filters.push(ilike(proxyListings.zip, `%${zip}%`));
    }

    if (type && type !== "any") {
      filters.push(ilike(proxyListings.proxyType, `%${type}%`));
    }

    let order;

    if (sort === "ping") {
      order = proxyListings.ping;
    } else if (sort === "price") {
      order = proxyListings.price;
    } else if (sort === "speed") {
      order = desc(proxyListings.speedKbps);
    } else {
      order = proxyListings.addedDays;
    }

    // These two operations are independent and can run together.
    const [countRows, initialSessionUser] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(proxyListings)
        .where(and(...filters)),

      getSessionUser(),
    ]);

    const totalCount = Number(countRows[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;

    let sessionUser = initialSessionUser;


    // These operations are independent once pagination is known.
    const [rows, mine, regionCounts] = await Promise.all([
      db
        .select({
          id: proxyListings.id,
          ipMasked: proxyListings.ipMasked,
          port: proxyListings.port,
          domain: proxyListings.domain,
          country: proxyListings.country,
          countryCode: proxyListings.countryCode,
          region: proxyListings.region,
          state: proxyListings.state,
          city: proxyListings.city,
          isp: proxyListings.isp,
          zip: proxyListings.zip,
          speedLabel: proxyListings.speedLabel,
          speedKbps: proxyListings.speedKbps,
          ping: proxyListings.ping,
          proxyType: proxyListings.proxyType,
          addedDays: proxyListings.addedDays,
          price: proxyListings.price,
          status: proxyListings.status,
          ownerUserId: proxyListings.ownerUserId,
        })
        .from(proxyListings)
        .where(and(...filters))
        .orderBy(order)
        .limit(pageSize)
        .offset(offset),

      sessionUser
        ? db
            .select()
            .from(ownedProxies)
            .where(eq(ownedProxies.userId, sessionUser.id))
        : Promise.resolve([]),

      db
        .select({
          region: proxyListings.region,
          count: sql<number>`count(*)`,
        })
        .from(proxyListings)
        .where(eq(proxyListings.status, "available"))
        .groupBy(proxyListings.region),
    ]);

    return NextResponse.json({
      listings: rows,
      owned: mine,
      user: sessionUser,
      regionCounts,
      pagination: {
        page: safePage,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET listings error:", error);

    return NextResponse.json(
      { error: "Failed to load listings" },
      { status: 500 },
    );
  }
}
