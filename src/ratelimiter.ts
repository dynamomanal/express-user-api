import { Request, Response, NextFunction } from "express";

type Bucket = {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
};

const clients = new Map<
  string,
  { minute: Bucket; burst: Bucket }
>();

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;

  const now = Date.now();
  if (ip !== undefined) {

  if (!clients.has(ip)) {
    clients.set(ip, {
      minute: {
        tokens: 10,
        lastRefill: now,
        capacity: 10,
        refillRate: 10 / 60000,
      },
      burst: {
        tokens: 5,
        lastRefill: now,
        capacity: 5,
        refillRate: 5 / 10000,
      },
    });
  }

  const client = clients.get(ip)!; // safe because ip exists

  for (const bucket of [client.minute, client.burst]) {
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + elapsed * bucket.refillRate);
    bucket.lastRefill = now;
  }

  if (client.minute.tokens < 1 || client.burst.tokens < 1) {
    return res.status(429).json({
      error: "Rate limit exceeded",
    });
  }

  client.minute.tokens--;
  client.burst.tokens--;

} else {
  throw new Error("IP address is undefined");
}




  next();
}
