import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { ObjectId, type WithId } from "mongodb";
import { getDb, USERS_COLLECTION } from "./db";

export const SESSION_COOKIE = "motionly_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type UserPlan = "free" | "pro";

export type UserDoc = {
  _id?: ObjectId;
  email: string;
  name?: string;
  passwordHash?: string;
  plan: UserPlan;
  rendersUsedThisMonth: number;
  monthKey: string;
  createdAt: Date;
};

export type PublicUser = {
  id: string;
  email: string;
  name?: string;
  plan: UserPlan;
  rendersUsedThisMonth: number;
  monthKey: string;
};

type SessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

type AuthGlobal = {
  __motionlySecretWarned?: boolean;
};

const globalForAuth = globalThis as typeof globalThis & AuthGlobal;

const getSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }
  if (!globalForAuth.__motionlySecretWarned) {
    globalForAuth.__motionlySecretWarned = true;
    console.warn("[motionly] AUTH_SECRET is not set. Using a development-only secret.");
  }
  return "motionly-development-secret-change-me";
};

const base64url = (value: string | Buffer) =>
  Buffer.from(value).toString("base64url");

const sign = (payload: string) =>
  createHmac("sha256", getSecret()).update(payload).digest("base64url");

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    return false;
  }
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(candidate, expected);
};

export const createSessionToken = (user: Pick<PublicUser, "id" | "email">) => {
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
};

export const verifySessionToken = (token: string): SessionPayload | null => {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const expected = sign(encoded);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.sub || !payload?.email || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const toPublicUser = (user: WithId<UserDoc>): PublicUser => ({
  id: user._id.toHexString(),
  email: user.email,
  name: user.name,
  plan: user.plan,
  rendersUsedThisMonth: user.rendersUsedThisMonth,
  monthKey: user.monthKey,
});

export const getSessionUser = async (): Promise<PublicUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  let payload: SessionPayload | null = null;
  try {
    payload = verifySessionToken(token);
  } catch {
    return null;
  }
  if (!payload || !ObjectId.isValid(payload.sub)) {
    return null;
  }

  const db = await getDb();
  if (!db) {
    return null;
  }

  const user = await db.collection<UserDoc>(USERS_COLLECTION).findOne({
    _id: new ObjectId(payload.sub),
  });

  return user ? toPublicUser(user) : null;
};

export const setSessionCookie = (response: NextResponse, token: string) => {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
};

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};
