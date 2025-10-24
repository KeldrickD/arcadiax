type Bucket = { hits: number[] };
const store: Map<string, Bucket> = new Map();

export function rateLimitKey(ip: string | null | undefined, route: string, windowSec: number, max: number) {
  const k = `${route}:${ip || 'unknown'}`;
  const now = Date.now();
  const winMs = windowSec * 1000;
  const b = store.get(k) || { hits: [] };
  const keep = b.hits.filter(t => now - t < winMs);
  if (keep.length >= max) return false;
  keep.push(now); b.hits = keep; store.set(k, b);
  return true;
}


