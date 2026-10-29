export class ConcurrencyLimiter {
  private active = 0;

  constructor(private readonly max: number) {}

  tryAcquire() {
    if (this.active >= this.max) {
      return false;
    }
    this.active += 1;
    return true;
  }

  release() {
    this.active = Math.max(0, this.active - 1);
  }

  get activeCount() {
    return this.active;
  }

  get capacity() {
    return this.max;
  }
}

type LimiterGlobal = {
  __motionlyLimiter?: ConcurrencyLimiter;
};

const globalForLimiter = globalThis as typeof globalThis & LimiterGlobal;

const configuredConcurrency = Number(process.env.RENDER_CONCURRENCY);
const maxConcurrentRenders =
  Number.isFinite(configuredConcurrency) && configuredConcurrency >= 1
    ? Math.floor(configuredConcurrency)
    : 2;

export const renderLimiter =
  globalForLimiter.__motionlyLimiter ??
  (globalForLimiter.__motionlyLimiter = new ConcurrencyLimiter(maxConcurrentRenders));
