type Bucket = {
  hits: number[];
};

type RateGlobal = {
  __motionlyRateBuckets?: Map<string, Bucket>;
};

const globalForRate = globalThis as typeof globalThis & RateGlobal;

const buckets = () => {
  if (!globalForRate.__motionlyRateBuckets) {
    globalForRate.__motionlyRateBuckets = new Map();
  }
  return globalForRate.__motionlyRateBuckets;
};

export const checkRateLimit = (key: string, limit: number, windowMs: number) => {
  const map = buckets();
  const now = Date.now();
  const bucket = map.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((time) => now - time < windowMs);

  if (bucket.hits.length >= limit) {
    const retryAfterMs = windowMs - (now - bucket.hits[0]);
    map.set(key, bucket);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  bucket.hits.push(now);
  map.set(key, bucket);

  if (map.size > 5000) {
    for (const [entry, value] of map) {
      if (value.hits.length === 0 || now - value.hits[value.hits.length - 1] > windowMs) {
        map.delete(entry);
      }
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
};

export const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    "unknown"
  );
};
