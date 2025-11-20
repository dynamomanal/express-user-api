import { User } from "./mockData";

/**
 * Shape of each cache entry:
 * - value: the actual User object
 * - expiresAt: timestamp when this entry becomes stale
 */
type CacheEntry = {
  value: User;
  expiresAt: number;
};
/**
 * LRUCache
 * A lightweight in-memory Least-Recently-Used cache with TTL support.
 */
export class LRUCache {
  private map = new Map<number, CacheEntry>(); // internal ordered map

  hits = 0;        // number of times data was found in cache
  misses = 0;      // number of times data was NOT found in cache

  /**
   * @param ttlMs - Time-to-live for each item (default 60 seconds)
   * @param capacity - Max number of entries cache can store
   */
// According to the data i will atke the acpcity to 10 anf ttms time to live for ecah itens as 40 seconds 
  constructor(public ttlMs = 40000, public capacity = 10) {}

  /**
   * Getter — returns how many items the cache currently holds.
   * Accessed like a property: cache.size
   */
  get size() {
    return this.map.size;
  }

  /**
   * Retrieves a cached User by ID.
   * Implements TTL checking and LRU ordering.
   */
  get(id: number): User | null {
    const entry = this.map.get(id);

    // MISS: Not in cache
    if (!entry) {
      this.misses++;
      return null;
    }

    // MISS: Entry exists but expired
    if (Date.now() > entry.expiresAt) {
      this.map.delete(id);
      this.misses++;
      return null;
    }
    // HIT: Fresh entry — move to most-recent position (LRU behavior)
    this.map.delete(id);
    this.map.set(id, entry);

    this.hits++;
    return entry.value;
  }
  /**
   * Stores a User in the cache.
   * Does NOT overwrite if the key already exists (per assignment requirements).
   */
  set(id: number , value: User) {
    // Do not overwrite existing user in cache
    if (this.map.has(id)) return;

    // Evict LRU entry if capacity exceeded
// Evict LRU entry if capacity exceeded
if (this.map.size >= this.capacity) {
  const oldestKey = this.map.keys().next().value; // number | undefined

  if (oldestKey !== undefined) {
    // Safe to delete — TypeScript now knows it's a number
    this.map.delete(oldestKey);
  } else {
    // This should never happen, but protects against undefined
    throw new Error("Unexpected undefined key when evicting LRU");
  }
}

    // Insert with TTL
    this.map.set(id, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Clears the entire cache and resets statistics.
   */
  deleteAll() {
    this.map.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Removes stale entries.
   * Should be called periodically (e.g., setInterval every 10s).
   */
  sweepStale() {
    const now = Date.now();

    for (const [id, entry] of this.map.entries()) {
      if (entry.expiresAt < now) {
        this.map.delete(id);
      }
    }
  }
}
