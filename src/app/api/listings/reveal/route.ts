import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { proxyListings, transactions, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

const REVEAL_PRICE = 0.05;

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid listing id." },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const [listing] = await tx
        .select({
          id: proxyListings.id,
          ipFull: proxyListings.ipFull,
          status: proxyListings.status,
        })
        .from(proxyListings)
        .where(eq(proxyListings.id, id))
        .limit(1);

      if (!listing) {
        throw new Error("LISTING_NOT_FOUND");
      }

      if (listing.status !== "available") {
        throw new Error("LISTING_UNAVAILABLE");
      }

      const ip = String(listing.ipFull || "").trim();

      if (!ip) {
        throw new Error("IP_UNAVAILABLE");
      }

      const [balanceRow] = await tx
        .update(users)
        .set({
          balance: sql`${users.balance} - ${REVEAL_PRICE}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, sessionUser.id),
            sql`${users.balance} >= ${REVEAL_PRICE}`
          )
        )
        .returning({ balance: users.balance });

      if (!balanceRow) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      await tx.insert(transactions).values({
        id: `tx_reveal_${randomUUID()}`,
        userId: sessionUser.id,
        amount: REVEAL_PRICE.toFixed(2),
        currency: "USD",
        paymentMethod: "balance",
        status: "completed",
        planId: "ip_reveal",
        gbPurchased: "0.00",
      });

      return {
        ip,
        balance: parseFloat(balanceRow.balance),
      };
    });

    return NextResponse.json(
      {
        success: true,
        ip: result.ip,
        balance: result.balance,
        charged: REVEAL_PRICE,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "LISTING_NOT_FOUND") {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    if (message === "LISTING_UNAVAILABLE") {
      return NextResponse.json(
        { error: "This proxy is no longer available for reveal." },
        { status: 409 }
      );
    }

    if (message === "IP_UNAVAILABLE") {
      return NextResponse.json(
        { error: "This listing does not contain a valid IP address." },
        { status: 422 }
      );
    }

    if (message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        {
          error:
            "Insufficient balance. You need at least $0.05 to reveal this IP.",
        },
        { status: 400 }
      );
    }

    console.error("Reveal IP error:", error);

    return NextResponse.json(
      { error: "Unable to reveal IP. No charge was committed." },
      { status: 500 }
    );
  }
}
