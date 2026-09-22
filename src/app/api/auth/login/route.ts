import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setSessionUser, findUserByLogin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, twoFactorCode } = body;


    const login = (username || body.email || "").toString().trim();
    if (!login || !password) {
      return NextResponse.json({ error: "User and pass are required" }, { status: 400 });
    }

    const user = await findUserByLogin(login);
    if (!user) {
      return NextResponse.json({ error: "Invalid user or pass" }, { status: 401 });
    }

    if (user.status === "banned" || user.status === "suspended") {
      return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid user or pass" }, { status: 401 });
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json({
          requires2FA: true,
          userId: user.id,
          message: "Please enter your 6-digit authenticator code",
        });
      }
      const cleanCode = twoFactorCode.toString().trim();
      if (cleanCode.length !== 6) {
        return NextResponse.json({ error: "Invalid 2FA code." }, { status: 400 });
      }
    }

    await setSessionUser(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        balance: parseFloat(user.balance),
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Authentication failed. Please try again." }, { status: 500 });
  }
}
