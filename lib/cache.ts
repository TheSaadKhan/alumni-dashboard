/**
 * Client-side cache utility using sessionStorage for per-session caching
 * and localStorage for persistent caching across sessions.
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  expires: number;
}

// ─── SessionStorage (per-tab, fast) ─────────────────────────────────────────
export function sessionGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`alumni_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expires) {
      sessionStorage.removeItem(`alumni_${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function sessionSet<T>(key: string, data: T, ttlMs = DEFAULT_TTL): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, expires: Date.now() + ttlMs };
    sessionStorage.setItem(`alumni_${key}`, JSON.stringify(entry));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

export function sessionDel(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`alumni_${key}`);
}

// ─── LocalStorage (persistent, across sessions) ───────────────────────────────
export function localGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`alumni_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expires) {
      localStorage.removeItem(`alumni_${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function localSet<T>(key: string, data: T, ttlMs = 30 * 60 * 1000): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, expires: Date.now() + ttlMs };
    localStorage.setItem(`alumni_${key}`, JSON.stringify(entry));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

export function localDel(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`alumni_${key}`);
}

// ─── Cached Fetch Helper ──────────────────────────────────────────────────────
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttlMs = DEFAULT_TTL,
  storage: "session" | "local" = "session"
): Promise<T | null> {
  const cacheKey = `fetch_${url}`;
  const get = storage === "session" ? sessionGet : localGet;
  const set = storage === "session" ? sessionSet : localSet;

  // Try cache first
  const cached = get<T>(cacheKey);
  if (cached !== null) return cached;

  // Fetch fresh data
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const data: T = await res.json();
    set(cacheKey, data, ttlMs);
    return data;
  } catch {
    return null;
  }
}

// ─── Invalidate cache by prefix ───────────────────────────────────────────────
export function invalidatePrefix(prefix: string): void {
  if (typeof window === "undefined") return;
  const keysToDelete: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(`alumni_${prefix}`)) keysToDelete.push(key);
  }
  keysToDelete.forEach(k => sessionStorage.removeItem(k));
  
  const lsKeysToDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`alumni_${prefix}`)) lsKeysToDelete.push(key);
  }
  lsKeysToDelete.forEach(k => localStorage.removeItem(k));
}
