import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

import { initDb } from "@/db/init";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    await initDb();
    return Response.json({ ok: true, status: "healthy", database: "connected" });
  } catch (error) {
    console.error("Healthcheck error:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
