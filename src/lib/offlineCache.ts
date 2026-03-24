const STORAGE_PREFIX = "vanity-stock-cache:v1:";

interface CacheEnvelope<T> {
  savedAt: string;
  data: T;
}

export function saveOfflineCache<T>(key: string, data: T): void {
  if (!canUseStorage()) {
    return;
  }

  const payload: CacheEnvelope<T> = {
    savedAt: new Date().toISOString(),
    data
  };
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(payload));
}

export function readOfflineCache<T>(key: string): CacheEnvelope<T> | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    localStorage.removeItem(STORAGE_PREFIX + key);
    return null;
  }
}

export function clearOfflineCache(): void {
  if (!canUseStorage()) {
    return;
  }

  const keysToDelete: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => localStorage.removeItem(key));
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}
