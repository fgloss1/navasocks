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
    const { ipWhitelist, subscriptionId } = body;

    if (subscriptionId) {
      await db
        .update(userSubscriptions)
        .set({ ipWhitelist: (ipWhitelist || "").trim() })
        .where(eq(userSubscriptions.id, subscriptionId));
    } else {
      await db
        .update(userSubscriptions)
        .set({ ipWhitelist: (ipWhitelist || "").trim() })
        .where(eq(userSubscriptions.userId, sessionUser.id));
    }

    return NextResponse.json({ success: true, message: "IP Whitelist updated successfully" });
  } catch (error) {
    console.error("IP whitelist update error:", error);
    return NextResponse.json({ error: "Failed to update whitelist" }, { status: 500 });
  }
}
