import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runPaymentCycle } from "@/lib/crypto/payment-cycle";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRYPTO_WATCHER_SECRET;
  const provided = request.headers.get("x-crypto-watcher-secret");

  if (!expected || !provided) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  try {
    const result = await runPaymentCycle();

    return NextResponse.json(
      {
        success: true,
        result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Internal crypto payment cycle error:", error);

    return NextResponse.json(
      {
        error: "Payment cycle failed.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
