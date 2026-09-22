import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { apiKeys, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function resolveUser() {
  let sessionUser = await getSessionUser();
  return sessionUser;
}

export async function GET() {
  try {
    const sessionUser = await resolveUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, sessionUser.id))
      .orderBy(desc(apiKeys.createdAt));

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("GET apiKeys error:", error);
    return NextResponse.json({ error: "Failed to load API keys" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await resolveUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { keyName = "Default API Key" } = body;

    const newKey = `nsk_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;

    const [created] = await db
      .insert(apiKeys)
      .values({
        userId: sessionUser.id,
        keyName: keyName.trim() || "API Key",
        apiKey: newKey,
      })
      .returning();

    return NextResponse.json({ success: true, key: created });
  } catch (error) {
    console.error("POST apiKeys error:", error);
    return NextResponse.json({ error: "Failed to generate key" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");
    if (!keyId) {
      return NextResponse.json({ error: "Missing key id" }, { status: 400 });
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, parseInt(keyId, 10)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE apiKeys error:", error);
    return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
  }
}
