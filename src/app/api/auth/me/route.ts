import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return Response.json({ user: null });
    }
    return Response.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return Response.json({ user: null });
  }
}
