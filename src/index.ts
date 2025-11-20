import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import { mockUsers, User } from "./mockData";
import { LRUCache } from "./lruCache";
import { AsyncQueue } from "./asyncQueue";
import { rateLimiter } from "./ratelimiter";

// ---------------------------------------------------------
// SETUP EXPRESS APP
// ---------------------------------------------------------

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------------------------------------------------------
// CREATE CACHE + QUEUE
// ---------------------------------------------------------

// 60 seconds TTL, 1000 max capacity
const cache = new LRUCache(40000, 1000);

// async queue for DB simulation
const queue = new AsyncQueue<User>(5);

// track concurrent fetches for same user (coalescing)
const inProgress = new Map<number, Promise<User | null>>();

// stats for avg response time
let totalRequests = 0;
let totalResponseTime = 0;

// background stale removal every 10 seconds
setInterval(() => cache.sweepStale(), 10_000);

// ---------------------------------------------------------
// SIMULATED DATABASE FETCH (200ms delay)
// ---------------------------------------------------------

function simulateDbFetch(id: number): Promise<User | null> {
  return queue.push(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200)); // DB latency
    return mockUsers[id] ?? null;
  });
}

// ---------------------------------------------------------
// GET /users/:id — includes cache, coalescing, async queue
// ---------------------------------------------------------

app.get("/users/:id", rateLimiter, async (req, res) => {
  const start = Date.now();
  totalRequests++;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  // 1) CHECK CACHE
  const cached = cache.get(id);
  if (cached) {
    const rt = Date.now() - start;
    totalResponseTime += rt;
    return res.json({ source: "cache", data: cached });
  }

  // 2) CHECK IF FETCH IN PROGRESS (coalescing)
  if (inProgress.has(id)) {
    try {
      const result = await inProgress.get(id)!;
      const rt = Date.now() - start;
      totalResponseTime += rt;

      if (!result) return res.status(404).json({ error: "User not found" });

      return res.json({ source: "coalesced", data: result });
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // 3) MAKE NEW FETCH + STORE PROMISE
  const fetchPromise = (async () => {
    try {
      const user = await simulateDbFetch(id);

      if (user) cache.set(id, user); // only set if not cached

      return user;
    } catch (err) {
      throw err;
    }
  })();

  inProgress.set(id, fetchPromise);

  try {
    const user = await fetchPromise;
    inProgress.delete(id);

    const rt = Date.now() - start;
    totalResponseTime += rt;

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ source: "db", data: user });
  } catch (err) {
    inProgress.delete(id);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------
// POST /users — create new user
// ---------------------------------------------------------

app.post("/users", rateLimiter, (req, res) => {
  const body = req.body as Partial<User>;

  if (!body.name || !body.email) {
    return res.status(400).json({ error: "name and email required" });
  }

  const newId =
    Math.max(...Object.keys(mockUsers).map((k) => parseInt(k))) + 1;

  const newUser: User = {
    id: newId,
    name: body.name,
    email: body.email,
  };

  mockUsers[newId] = newUser;

  cache.set(newId, newUser);

  res.status(201).json({ message: "User created", data: newUser });
});

// ---------------------------------------------------------
// DELETE /cache — clear entire cache
// ---------------------------------------------------------

app.delete("/cache", rateLimiter, (req, res) => {
  cache.deleteAll();
  res.json({ message: "Cache cleared" });
});

// ---------------------------------------------------------
// GET /cache-status — debugging & monitoring
// ---------------------------------------------------------

app.get("/cache-status", rateLimiter, (req, res) => {
  const avgResponseTime = totalRequests
    ? totalResponseTime / totalRequests
    : 0;

  res.json({
    size: cache.size,
    hits: cache.hits,
    misses: cache.misses,
    avgResponseTimeMs: avgResponseTime,
  });
});

// ---------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
