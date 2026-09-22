import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, findUserByLogin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, newPassword } = body;
    const login = (username || email || "").toString().trim();

    if (!login) {
      return NextResponse.json({ error: "User is required" }, { status: 400 });
    }

    const user = await findUserByLogin(login);

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If that user exists, a reset token was issued.",
        mockToken: "RESET-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      const passwordHash = await hashPassword(newPassword);
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
      return NextResponse.json({
        success: true,
        message: "Password has been successfully reset. You can now log in.",
      });
    }

    const mockToken = "RESET-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    return NextResponse.json({
      success: true,
      message: "If that user exists, a reset token was issued.",
      mockToken,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Could not process password reset" }, { status: 500 });
  }
}
