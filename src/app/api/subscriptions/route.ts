import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { users, proxyPlans, userSubscriptions, transactions, bandwidthLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let sessionUser = await getSessionUser();

    // Fallback to demo user if not logged in

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user subscriptions
    const subs = await db
      .select({
        id: userSubscriptions.id,
        planId: userSubscriptions.planId,
        allocatedGb: userSubscriptions.allocatedGb,
        usedGb: userSubscriptions.usedGb,
        status: userSubscriptions.status,
        proxyUsername: userSubscriptions.proxyUsername,
        
        ipWhitelist: userSubscriptions.ipWhitelist,
        expiresAt: userSubscriptions.expiresAt,
        createdAt: userSubscriptions.createdAt,
        planName: proxyPlans.name,
        planType: proxyPlans.type,
        poolSize: proxyPlans.poolSize,
        protocol: proxyPlans.protocol,
      })
      .from(userSubscriptions)
      .leftJoin(proxyPlans, eq(userSubscriptions.planId, proxyPlans.id))
      .where(eq(userSubscriptions.userId, sessionUser.id));

    // Fetch all available plans
    const allPlans = await db.select().from(proxyPlans).where(eq(proxyPlans.isActive, true));

    // Fetch recent transactions
    const txs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, sessionUser.id))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    // Fetch recent bandwidth logs for charts
    const logs = await db
      .select()
      .from(bandwidthLogs)
      .where(eq(bandwidthLogs.userId, sessionUser.id))
      .orderBy(desc(bandwidthLogs.timestamp))
      .limit(30);

    return NextResponse.json({
      user: sessionUser,
      subscriptions: subs,
      plans: allPlans,
      transactions: txs,
      bandwidthLogs: logs,
    });
  } catch (error) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}

