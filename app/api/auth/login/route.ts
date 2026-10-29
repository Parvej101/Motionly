import { NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
  type UserDoc,
} from "@/lib/auth";
import { getDb, USERS_COLLECTION } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`login:${ip}`, 15, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Accounts are unavailable until MONGODB_URI is configured." },
      { status: 503 },
    );
  }

  const user = await db.collection<UserDoc>(USERS_COLLECTION).findOne({ email });
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const publicUser = toPublicUser(user);
  const response = NextResponse.json({ user: publicUser });
  setSessionCookie(response, createSessionToken(publicUser));
  return response;
}
