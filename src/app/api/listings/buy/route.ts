import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { proxyListings, ownedProxies, users, transactions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import {
  createProxyUsername,
  createProxyPassword,
  encryptProxyPassword,
} from "@/lib/proxy-access";
import {
  getPublicAccessHost,
  getPublicAccessPort,
} from "@/lib/public-proxy";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const rawIds: unknown[] = Array.isArray(body.ids)
      ? body.ids
      : body.id != null
        ? [body.id]
        : [];

    const ids: number[] = Array.from(
      new Set<number>(rawIds.map((value: unknown) => Number(value)))
    );

    if (ids.length === 0 || ids.some((id: number) => !Number.isInteger(id) || id <= 0)) {
      return NextResponse.json({ error: "Invalid proxy selection." }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const purchased = [];
      let total = 0;

      for (const id of ids) {
        const [listing] = await tx
          .select()
          .from(proxyListings)
          .where(and(eq(proxyListings.id, id), eq(proxyListings.status, "available")))
          .limit(1);

        if (!listing) {
          throw new Error(`PROXY_UNAVAILABLE:${id}`);
        }

        const price = parseFloat(listing.price);

        if (!Number.isFinite(price) || price < 0) {
          throw new Error(`INVALID_PROXY_PRICE:${id}`);
        }

        const [balanceRow] = await tx
          .update(users)
          .set({
            balance: sql`${users.balance} - ${price}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(users.id, sessionUser.id),
              sql`${users.balance} >= ${price}`
            )
          )
          .returning({ balance: users.balance });

        if (!balanceRow) {
          throw new Error(`INSUFFICIENT_BALANCE:${price}`);
        }

        const [sold] = await tx
          .update(proxyListings)
          .set({
            status: "sold",
            ownerUserId: sessionUser.id,
          })
          .where(
            and(
              eq(proxyListings.id, listing.id),
              eq(proxyListings.status, "available")
            )
          )
          .returning({ id: proxyListings.id });

        if (!sold) {
          throw new Error(`PROXY_SALE_CONFLICT:${listing.id}`);
        }

        const accessUsername = createProxyUsername();
        const accessPassword = createProxyPassword();
        const accessPasswordEncrypted =
          encryptProxyPassword(accessPassword);

        const publicAccessHost =
          getPublicAccessHost();

        const [owned] = await tx
          .insert(ownedProxies)
          .values({
            userId: sessionUser.id,
            listingId: listing.id,
            ip: listing.ipFull,
            port: listing.port,
            countryCode: listing.countryCode,
            city: listing.city,
            isp: listing.isp,
            locked: true,
            provider: listing.provider,
            transportHost: listing.transportHost,
            transportPort: listing.transportPort,
            providerCredentialRef:
              listing.providerCredentialRef,
            accessUsername,
            accessPasswordEncrypted,
            accessHost: publicAccessHost,
            publicAccessHost,
          })
          .returning();

        if (!owned) {
          throw new Error(
            "PROXY_PROVISIONING_FAILED",
          );
        }

        const publicAccessPort =
          getPublicAccessPort(owned.id);

        const [provisionedOwned] = await tx
          .update(ownedProxies)
          .set({
            publicAccessPort,
            accessPort: publicAccessPort,
          })
          .where(eq(ownedProxies.id, owned.id))
          .returning();

        if (!provisionedOwned) {
          throw new Error(
            "PROXY_PROVISIONING_FAILED",
          );
        }

        await tx.insert(transactions).values({
          id: `tx_buy_${randomUUID()}`,
          userId: sessionUser.id,
          amount: listing.price,
          currency: "USD",
          paymentMethod: "balance",
          status: "completed",
          planId: "isp_listing",
          gbPurchased: "0.00",
        });

        purchased.push(owned);
        total += price;
      }

      const [updatedUser] = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, sessionUser.id))
        .limit(1);

      const mine = await tx
        .select()
        .from(ownedProxies)
        .where(eq(ownedProxies.userId, sessionUser.id));

      return {
        purchased,
        owned: mine,
        balance: updatedUser ? parseFloat(updatedUser.balance) : 0,
        spent: total,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("PROXY_UNAVAILABLE:")) {
      return NextResponse.json(
        { error: "One or more selected proxies are no longer available." },
        { status: 409 }
      );
    }

    if (message.startsWith("INSUFFICIENT_BALANCE:")) {
      const price = Number(message.split(":")[1] || 0);
      return NextResponse.json(
        { error: `Insufficient balance for this purchase. Required at least $${price.toFixed(2)}.` },
        { status: 400 }
      );
    }

    if (message.startsWith("INVALID_PROXY_PRICE:")) {
      return NextResponse.json(
        { error: "A selected proxy has an invalid price." },
        { status: 500 }
      );
    }

    if (message.startsWith("PROXY_SALE_CONFLICT:")) {
      return NextResponse.json(
        { error: "A selected proxy was purchased by another customer. No purchase was completed." },
        { status: 409 }
      );
    }

    console.error("Buy listing error:", error);
    return NextResponse.json(
      { error: "Purchase failed. No changes were committed." },
      { status: 500 }
    );
  }
}
