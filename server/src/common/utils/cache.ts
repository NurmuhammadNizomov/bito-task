// In-process TTL cache. Replaces Redis: a single Node instance keeps cached
// values in memory with per-key expiry. Async signatures are preserved so call
// sites stay unchanged if a shared cache is reintroduced later.
interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export async function getCache<T>(key: string): Promise<T | null> {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function setCache(
  key: string,
  value: unknown,
  ttl = 300,
): Promise<void> {
  store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

export async function delCache(key: string): Promise<void> {
  store.delete(key);
}

export async function delByPrefix(prefix: string): Promise<void> {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
