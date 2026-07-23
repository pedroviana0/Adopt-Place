import { makeSeed, type DB } from "./seed";

const KEY = "adoptplace:db:v1";
const SESSION_KEY = "adoptplace:session:v1";

let cache: DB | null = null;

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function loadDB(): DB {
  if (cache) return cache;
  if (!hasWindow()) {
    cache = makeSeed();
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DB;
      return cache;
    }
  } catch {
    // ignore
  }
  cache = makeSeed();
  saveDB(cache);
  return cache;
}

export function saveDB(db: DB): void {
  cache = db;
  if (!hasWindow()) return;
  // Propaga QuotaExceededError para que a UI possa exibir mensagem amigável.
  window.localStorage.setItem(KEY, JSON.stringify(db));
}

export function mutate<T>(fn: (db: DB) => T): T {
  const db = loadDB();
  const out = fn(db);
  saveDB(db);
  emitChange();
  return out;
}

export function resetDB(): void {
  cache = makeSeed();
  if (hasWindow()) window.localStorage.setItem(KEY, JSON.stringify(cache));
  emitChange();
}

// Simple change subscription for react-query invalidation-like refresh
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
function emitChange() {
  for (const l of listeners) l();
}

export { SESSION_KEY };
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
