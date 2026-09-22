import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  ownedProxies,
  proxyListings,
  supportTickets,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
export async function POST(req: Request) {
  return NextResponse.json(
    {
      error: "Refund requests are currently disabled."
    },
    {
      status: 410
    }
  );
}