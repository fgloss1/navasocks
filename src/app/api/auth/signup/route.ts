import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { hashPassword, setSessionUser } from "@/lib/auth";
import { initDb } from "@/db/init";

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "User and pass are required" }, { status: 400 });
    }

    const cleanUser = username.toString().trim();
    if (!/^[a-zA-Z0-9._-]{3,24}$/.test(cleanUser)) {
      return NextResponse.json({ error: "Username must be 3-24 letters, numbers, dots or dashes" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanEmail = (email || `${cleanUser.toLowerCase()}@nsocks.io`).toLowerCase().trim();

    const [existing] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, cleanUser), eq(users.email, cleanEmail), sql`lower(${users.username}) = ${cleanUser.toLowerCase()}`))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        username: cleanUser,
        email: cleanEmail,
        name: cleanUser,
        passwordHash,
        role: "user",
        twoFactorEnabled: false,
        balance: "0.00",
        status: "active",
      })
      .returning();

    await setSessionUser(newUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        balance: 0,
        twoFactorEnabled: false,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
