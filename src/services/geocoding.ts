export interface GeocodeAddress {
  street?: string;
  streetNumber?: string | number;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

export interface GeoCoords {
  lat: number;
  lng: number;
}

interface CacheEntry {
  lat: number | null;
  lng: number | null;
  ts: number;
}

const CACHE_KEY = "client_geocode_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const NEGATIVE_TTL_MS = 1000 * 60 * 60 * 24;
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddressWithTimeout(
  addr: GeocodeAddress,
  timeoutMs: number,
): Promise<GeoCoords | null> {
  return Promise.race([
    geocodeAddress(addr),
    new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

export function buildGeoKey(a: GeocodeAddress): string {
  const num = a.streetNumber == null ? "" : String(a.streetNumber);
  return [a.street, num, a.neighborhood, a.city, a.state, a.cep]
    .map(s => (s ?? "").toString().trim().toLowerCase())
    .join("|");
}

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

function writeCache(data: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function getCachedCoords(addr: GeocodeAddress): GeoCoords | null {
  const key = buildGeoKey(addr);
  if (!key.replace(/\|/g, "").trim()) return null;
  const cache = readCache();
  const entry = cache[key];
  if (!entry) return null;
  const ttl = entry.lat == null ? NEGATIVE_TTL_MS : CACHE_TTL_MS;
  if (Date.now() - entry.ts > ttl) return null;
  if (entry.lat == null || entry.lng == null) return null;
  return { lat: entry.lat, lng: entry.lng };
}

function cacheResult(key: string, coords: GeoCoords | null) {
  const cache = readCache();
  cache[key] = {
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    ts: Date.now(),
  };
  writeCache(cache);
}

let queue: Promise<unknown> = Promise.resolve();
const MIN_INTERVAL_MS = 1100;
let lastCallAt = 0;

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = async () => {
    const wait = Math.max(0, lastCallAt + MIN_INTERVAL_MS - Date.now());
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastCallAt = Date.now();
    return fn();
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}

const inflight = new Map<string, Promise<GeoCoords | null>>();

export async function geocodeAddress(addr: GeocodeAddress): Promise<GeoCoords | null> {
  const key = buildGeoKey(addr);
  if (!key.replace(/\|/g, "").trim()) return null;

  const cached = readCache()[key];
  if (cached) {
    const ttl = cached.lat == null ? NEGATIVE_TTL_MS : CACHE_TTL_MS;
    if (Date.now() - cached.ts < ttl) {
      return cached.lat != null && cached.lng != null
        ? { lat: cached.lat, lng: cached.lng }
        : null;
    }
  }

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = throttle(async () => {
    const params = new URLSearchParams({
      format: "json",
      limit: "1",
      countrycodes: "br",
      addressdetails: "0",
    });
    const num = addr.streetNumber == null ? "" : String(addr.streetNumber);
    const street = [addr.street, num].filter(Boolean).join(", ");
    if (street) params.set("street", street);
    if (addr.city) params.set("city", addr.city);
    if (addr.state) params.set("state", addr.state);
    if (addr.cep) params.set("postalcode", addr.cep.replace(/\D/g, ""));

    try {
      const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        cacheResult(key, null);
        return null;
      }
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!Array.isArray(data) || data.length === 0) {
        cacheResult(key, null);
        return null;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        cacheResult(key, null);
        return null;
      }
      const coords = { lat, lng };
      cacheResult(key, coords);
      return coords;
    } catch {
      return null;
    }
  }).finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}
