

Advanced Express.js User API (TypeScript)
High-Performance Caching • Intelligent Rate Limiting • Async Processing • Frontend Tester

This project is a **high-performance backend system** built with **Express.js + TypeScript**, designed to handle heavy traffic efficiently through:

* LRU caching**
* Concurrent request coalescing**
* Background stale cleanup**
* Custom rate limiting (with burst handling)**
* Asynchronous queue for non-blocking DB simulation**
* Simple HTML frontend to test all endpoints**

This architecture models **real-world scalable systems**, similar to what companies like Netflix, Meta, and Amazon use in microservices.



 Why This System Matters (Benefits)

This backend demonstrates **exactly the kind of optimizations used in high-traffic production environments.**
Here’s how each part benefits performance and reliability:



 LRU Cache (with TTL) — Massive Performance Boost

Benefit: Faster responses, reduced server load, reduced database load.

* Stores frequently accessed user data.
* Returns cached responses instantly (0–2 ms).
* Automatically expires entries after **60 seconds**.
* Removes least recently used entries when full (LRU eviction).

Real-world impact:
Twitter, Instagram, and YouTube use LRU caches to handle billions of reads per day while reducing database pressure by 90%.



2. Advanced Rate Limiting — Protects the Server**

Benefit: Prevents spam, abuse, DDoS-like traffic, or accidental overload.

This system uses **dual token buckets**:

* 10 requests per minute**
* Burst capacity: 5 requests per 10 seconds**
Real-world impact:**
Rate limiting is critical for protecting APIs against abuse, especially public-facing ones.


3. Concurrent Request Coalescing — Elegant Load Reduction**

Benefit: Prevents duplicated work under heavy load.

If multiple users request the same user ID at the same time:

* Only **one** simulated DB call runs
* All others **wait for the same promise**
* They return `"source": "coalesced"`

Real-world impact:
This is how CDNs (Cloudflare, Akamai) avoid “thundering herd” problems.



4. Asynchronous Processing with Queue — No Blocking**

Benefit: Handles high concurrency without slowing down.

The async queue simulates database operations (200ms delay) using controlled concurrency (5 at a time).

Real-world impact:**
This models job queues used in microservices (BullMQ, RabbitMQ, SQS).




5. Stale Entry Cleanup (Background Worker)**

**Benefit:** Prevents memory leaks by removing expired cache entries every 10 seconds.

Real-world impact:**
Long-running servers in production MUST clean stale memory to avoid crashes.


6. Simple HTML Frontend — Makes Testing Easy**

Benefit: Users can test all API endpoints visually, no Postman needed.

Buttons provided for:

* GET /users/:id
* POST /users
* DELETE /cache
* GET /cache-status
* GET /health

Shows full JSON response in a clean UI.

 Perfect for testing & demonstrating system behavior.



Project Architecture

```
express-user-api/
│
├── src/
│   ├── index.ts           # Main API + routes + logic
│   ├── mockData.ts        # Mock users database
│   ├── lruCache.ts        # LRU cache (TTL + eviction)
│   ├── asyncQueue.ts      # Async DB queue
│   ├── rateLimiter.ts     # Burst-aware rate limiter
│
├── index.html             # Simple frontend tester
├── package.json
├── tsconfig.json
└── README.md
```

---

Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Run in development mode

```bash
npm run dev
```

### 3. Run in production mode

```bash
npm run build
npm start
```

Server runs on:

```
http://localhost:3000
```



Testing the API

You can use **Postman**, **Thunder Client**, or the included **index.html** file.

Open the HTML tester:

```
index.html
```

It supports:

| Endpoint          | What It Does                                |
| ----------------- | ------------------------------------------- |
| GET /users/:id    | Cache + coalescing + async queue            |
| POST /users       | Creates a new user                          |
| DELETE /cache     | Clears entire cache                         |
| GET /cache-status | Shows hits, misses, size, avg response time |
| GET /health       | Server status                               |

All response bodies are shown in a live JSON box.

---

**Endpoints Overview**

GET /users/:id

* Returns user from:

  * Cache
  * or coalesced request
  * or simulated DB
* First call: ~200ms
* Next calls: ~0ms (cache hit)

---

POST /users**

Creates a new user and caches it immediately.

---

DELETE /cache**

Clears all cached entries + resets stats.

---

GET /cache-status**

Shows:

```json
{
  "size": 3,
  "hits": 4,
  "misses": 2,
  "avgResponseTimeMs": 145.25
}
```

---

GET /health**

Simple health check.

---

Why This Project is Valuable to Learn / Submit**

This backend demonstrates **professional-level engineering concepts** such as:

* caching strategies
* eviction policies
* concurrency control
* asynchronous task management
* rate limiting
* performance monitoring
* real-world API design patterns

It shows you understand:

* scalability
* optimization
* backend architecture
* data flow
* memory management
* latency reduction

This is exactly the kind of system used in:

* high-traffic websites
* microservice platforms
* enterprise-level backend engineering
