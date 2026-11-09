const CACHE_PREFIX = "pescalife_environment_v1:";

export const ENVIRONMENT_CACHE_TTL = Object.freeze({
    current: 30 * 60 * 1000,
    forecast: 60 * 60 * 1000,
    marine: 60 * 60 * 1000,
    sunriseSunset: 24 * 60 * 60 * 1000
});

const memoryCache = new Map();

function getStorage() {
    try {
        return globalThis.localStorage ?? null;
    } catch (error) {
        console.warn("Cache ambientale: localStorage non disponibile; uso la memoria.", error);
        return null;
    }
}

function storageKey(key) {
    if (typeof key !== "string" || key.trim() === "") {
        throw new TypeError("La chiave della cache ambientale deve essere una stringa non vuota.");
    }

    return `${CACHE_PREFIX}${key}`;
}

function readStorageEntry(storage, key) {
    try {
        const serialized = storage.getItem(key);
        if (serialized === null) return null;

        const entry = JSON.parse(serialized);
        if (!entry || typeof entry !== "object" || !("value" in entry) ||
            !Number.isFinite(entry.updatedAt) || !Number.isFinite(entry.expiresAt)) {
            throw new TypeError("Record di cache ambientale non valido.");
        }

        return entry;
    } catch (error) {
        console.warn("Cache ambientale: impossibile leggere un record da localStorage.", error);
        try {
            storage.removeItem(key);
        } catch (removeError) {
            console.warn("Cache ambientale: impossibile rimuovere un record non valido.", removeError);
        }
        return null;
    }
}

function toCacheResult(entry, storage, now) {
    const stale = entry.expiresAt <= now;
    return {
        value: entry.value,
        updatedAt: entry.updatedAt,
        expiresAt: entry.expiresAt,
        ageMs: Math.max(0, now - entry.updatedAt),
        stale,
        storage
    };
}

export function getEnvironmentCache(key, { allowExpired = false, now = Date.now() } = {}) {
    const prefixedKey = storageKey(key);
    const storage = getStorage();
    let entry = storage ? readStorageEntry(storage, prefixedKey) : null;
    let source = "localStorage";

    if (!entry) {
        entry = memoryCache.get(prefixedKey) ?? null;
        source = "memory";
    }

    if (!entry) return null;

    const result = toCacheResult(entry, source, now);
    return result.stale && !allowExpired ? null : result;
}

export function setEnvironmentCache(key, value, { ttlMs, updatedAt = Date.now() } = {}) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
        throw new TypeError("La durata della cache ambientale deve essere un numero positivo.");
    }
    if (!Number.isFinite(updatedAt)) {
        throw new TypeError("La data di aggiornamento della cache ambientale non è valida.");
    }

    const prefixedKey = storageKey(key);
    const entry = { value, updatedAt, expiresAt: updatedAt + ttlMs };
    memoryCache.set(prefixedKey, entry);

    const storage = getStorage();
    if (storage) {
        try {
            storage.setItem(prefixedKey, JSON.stringify(entry));
        } catch (error) {
            console.warn("Cache ambientale: salvataggio localStorage non riuscito; uso la memoria.", error);
        }
    }

    return toCacheResult(entry, storage ? "localStorage" : "memory", Date.now());
}

export function removeEnvironmentCache(key) {
    const prefixedKey = storageKey(key);
    memoryCache.delete(prefixedKey);

    const storage = getStorage();
    if (!storage) return;

    try {
        storage.removeItem(prefixedKey);
    } catch (error) {
        console.warn("Cache ambientale: impossibile rimuovere il record da localStorage.", error);
    }
}

export function clearEnvironmentCache() {
    for (const key of memoryCache.keys()) {
        if (key.startsWith(CACHE_PREFIX)) memoryCache.delete(key);
    }

    const storage = getStorage();
    if (!storage) return;

    try {
        const keys = [];
        for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index);
            if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
        }
        keys.forEach(key => storage.removeItem(key));
    } catch (error) {
        console.warn("Cache ambientale: impossibile svuotare tutti i record da localStorage.", error);
    }
}