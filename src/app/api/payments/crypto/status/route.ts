import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { cryptoPaymentIntents } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const paymentIntentId = String(
      searchParams.get("paymentIntentId") || ""
    ).trim();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required." },
        { status: 400 }
      );
    }

    const [intent] = await db
      .select({
        id: cryptoPaymentIntents.id,
        currency: cryptoPaymentIntents.currency,
        network: cryptoPaymentIntents.network,
        requestedUsdAmount: cryptoPaymentIntents.requestedUsdAmount,
        receivedCryptoAmount: cryptoPaymentIntents.receivedCryptoAmount,
        receivedUsdAmount: cryptoPaymentIntents.receivedUsdAmount,
        confirmations: cryptoPaymentIntents.confirmations,
        requiredConfirmations: cryptoPaymentIntents.requiredConfirmations,
        status: cryptoPaymentIntents.status,
        creditedAt: cryptoPaymentIntents.creditedAt,
        expiresAt: cryptoPaymentIntents.expiresAt,
      })
      .from(cryptoPaymentIntents)
      .where(
        and(
          eq(cryptoPaymentIntents.id, paymentIntentId),
          eq(cryptoPaymentIntents.userId, sessionUser.id)
        )
      )
      .limit(1);

    if (!intent) {
      return NextResponse.json(
        { error: "Payment intent not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        paymentIntentId: intent.id,
        currency: intent.currency,
        network: intent.network,
        requestedUsdAmount: intent.requestedUsdAmount,
        receivedCryptoAmount: intent.receivedCryptoAmount,
        receivedUsdAmount: intent.receivedUsdAmount,
        confirmations: intent.confirmations,
        requiredConfirmations: intent.requiredConfirmations,
        status: intent.status,
        creditedAt: intent.creditedAt,
        expiresAt: intent.expiresAt,
      },
    });
  } catch (error) {
    console.error("Crypto payment status error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve payment status." },
      { status: 500 }
    );
  }
}