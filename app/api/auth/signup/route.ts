import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
  toPublicUser,
  type UserDoc,
} from "@/lib/auth";
import { getDb, USERS_COLLECTION } from "@/lib/db";
import { currentMonthKey } from "@/lib/usage";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`signup:${ip}`, 10, 15 * 60 * 1000);
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
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Accounts are unavailable until MONGODB_URI is configured." },
      { status: 503 },
    );
  }

  const users = db.collection<UserDoc>(USERS_COLLECTION);
  const existing = await users.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const _id = new ObjectId();
  const user: UserDoc = {
    _id,
    email,
    name: name || undefined,
    passwordHash: hashPassword(password),
    plan: "free",
    rendersUsedThisMonth: 0,
    monthKey: currentMonthKey(),
    createdAt: new Date(),
  };

  try {
    await users.insertOne(user);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    throw error;
  }

  const publicUser = toPublicUser(user as UserDoc & { _id: ObjectId });
  const response = NextResponse.json({ user: publicUser });
  setSessionCookie(response, createSessionToken(publicUser));
  return response;
}
