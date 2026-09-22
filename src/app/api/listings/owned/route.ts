import { NextResponse } from "next/server";
import { db } from "@/db";
import { ownedProxies, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ owned: [], user: null });
    }
    const mine = await db.select().from(ownedProxies).where(eq(ownedProxies.userId, sessionUser.id));
    return NextResponse.json({ owned: mine, user: sessionUser });
  } catch (error) {
    console.error("GET owned error:", error);
    return NextResponse.json({ error: "Failed to load proxies" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { id, locked } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.update(ownedProxies).set({ locked: Boolean(locked) }).where(eq(ownedProxies.id, id));
    const mine = await db.select().from(ownedProxies).where(eq(ownedProxies.userId, sessionUser.id));
    return NextResponse.json({ success: true, owned: mine });
  } catch (error) {
    console.error("POST owned error:", error);
    return NextResponse.json({ error: "Failed to update proxy" }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({
    success: true,
    persisted: false,
  });
}
