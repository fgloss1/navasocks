import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("nsocks_session");
    if (!sessionCookie?.value) {
      return null;
    }

    const userId = parseInt(sessionCookie.value, 10);
    if (isNaN(userId)) return null;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.status === "banned" || user.status === "suspended") return null;

    return {
      id: user.id,
      username: user.username || user.name,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      balance: parseFloat(user.balance),
      status: user.status,
      createdAt: user.createdAt,
    };
  } catch (err) {
    console.error("getSessionUser error:", err);
    return null;
  }
}

export async function findUserByLogin(login: string) {
  const value = login.trim();
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, value), eq(users.email, value.toLowerCase()), sql`lower(${users.username}) = ${value.toLowerCase()}`))
    .limit(1);
  return user || null;
}

export async function setSessionUser(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set("nsocks_session", userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete("nsocks_session");
}
