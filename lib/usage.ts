import { ObjectId } from "mongodb";
import { getDb, USERS_COLLECTION } from "./db";
import type { PublicUser, UserDoc, UserPlan } from "./auth";

export const FREE_RENDER_LIMIT = 3;
export const PRO_RENDER_LIMIT = 100;

export const currentMonthKey = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

type GuestUsageGlobal = {
  __motionlyGuestUsage?: Map<string, { monthKey: string; count: number }>;
};

const globalForUsage = globalThis as typeof globalThis & GuestUsageGlobal;

const guestUsage = () => {
  if (!globalForUsage.__motionlyGuestUsage) {
    globalForUsage.__motionlyGuestUsage = new Map();
  }
  return globalForUsage.__motionlyGuestUsage;
};

const _consumeGuest = (ip: string) => {
  const key = currentMonthKey();
  const map = guestUsage();
  const existing = map.get(ip);
  const count = existing?.monthKey === key ? existing.count : 0;

  if (count >= FREE_RENDER_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  map.set(ip, { monthKey: key, count: count + 1 });
  if (map.size > 5000) {
    for (const [entry, value] of map) {
      if (value.monthKey !== key) {
        map.delete(entry);
      }
    }
  }
  return { allowed: true, remaining: FREE_RENDER_LIMIT - count - 1 };
};

export type ConsumeResult = {
  allowed: boolean;
  watermark: boolean;
  plan: UserPlan;
  remaining: number;
  reason?: string;
};

export const consumeRender = async (input: {
  user: PublicUser | null;
  ip: string;
}): Promise<ConsumeResult> => {
  const monthKey = currentMonthKey();

  if (!input.user) {
    // Guest render limit temporarily turned off
    return {
      allowed: true,
      watermark: false,
      plan: "free",
      remaining: 9999,
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      allowed: false,
      watermark: true,
      plan: input.user.plan,
      remaining: 0,
      reason: "Rendering database is not configured. Add MONGODB_URI to enable accounts.",
    };
  }

  const _id = new ObjectId(input.user.id);
  const users = db.collection<UserDoc>(USERS_COLLECTION);

  await users.updateOne(
    { _id, monthKey: { $ne: monthKey } },
    { $set: { monthKey, rendersUsedThisMonth: 0 } },
  );

  const user = await users.findOne({ _id });
  if (!user) {
    return {
      allowed: false,
      watermark: true,
      plan: "free",
      remaining: 0,
      reason: "Account not found.",
    };
  }

  const limit = user.plan === "pro" ? PRO_RENDER_LIMIT : FREE_RENDER_LIMIT;
  const updated = await users.findOneAndUpdate(
    { _id, monthKey, rendersUsedThisMonth: { $lt: limit } },
    { $inc: { rendersUsedThisMonth: 1 } },
    { returnDocument: "after" },
  );

  if (!updated) {
    return {
      allowed: false,
      watermark: user.plan !== "pro",
      plan: user.plan,
      remaining: 0,
      reason:
        user.plan === "pro"
          ? "Monthly render limit reached."
          : "Free plan limit reached. Upgrade to Pro for more renders.",
    };
  }

  const remaining = Math.max(0, limit - updated.rendersUsedThisMonth);
  return {
    allowed: true,
    watermark: updated.plan !== "pro",
    plan: updated.plan,
    remaining,
  };
};
