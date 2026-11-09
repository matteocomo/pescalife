import {
    ENVIRONMENT_CACHE_TTL,
    getEnvironmentCache,
    setEnvironmentCache
} from "./environment-cache.js";

export const OPEN_METEO_ATTRIBUTION = Object.freeze({
    label: "Weather data by Open-Meteo.com",
    url: "https://open-meteo.com/"
});

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";
const DEFAULT_TIMEOUT_MS = 15_000;

const FORECAST_VARIABLES = Object.freeze({
    current: [
        "temperature_2m", "apparent_temperature", "relative_humidity_2m",
        "precipitation", "weather_code", "cloud_cover", "pressure_msl",
        "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"
    ],
    hourly: [
        "temperature_2m", "precipitation", "precipitation_probability",
        "weather_code", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"
    ],
    daily: [
        "temperature_2m_max", "temperature_2m_min", "precipitation_sum",
        "precipitation_probability_max", "weather_code"
    ],
    sun: ["sunrise", "sunset", "daylight_duration"]
});

const MARINE_VARIABLES = Object.freeze([
    "wave_height", "wave_direction", "wave_period",
    "swell_wave_height", "swell_wave_direction", "swell_wave_period",
    "sea_surface_temperature"
]);

const inFlightRequests = new Map();

export class EnvironmentServiceError extends Error {
    constructor(code, message, cause = null) {
        super(message);
        this.name = "EnvironmentServiceError";
        this.code = code;
        this.cause = cause;
    }
}

function validateCoordinates(latitude, longitude) {
    if (typeof latitude !== "number" || !Number.isFinite(latitude) ||
        latitude < -90 || latitude > 90) {
        throw new EnvironmentServiceError("INVALID_COORDINATES", "La latitudine deve essere un numero tra -90 e 90.");
    }
    if (typeof longitude !== "number" || !Number.isFinite(longitude) ||
        longitude < -180 || longitude > 180) {
        throw new EnvironmentServiceError("INVALID_COORDINATES", "La longitudine deve essere un numero tra -180 e 180.");
    }

    return {
        latitude: Object.is(latitude, -0) ? 0 : latitude,
        longitude: Object.is(longitude, -0) ? 0 : longitude
    };
}

function validateTimeout(timeoutMs) {
    if (timeoutMs === undefined) return DEFAULT_TIMEOUT_MS;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        throw new EnvironmentServiceError("INVALID_TIMEOUT", "Il timeout deve essere un numero positivo.");
    }
    return timeoutMs;
}

function coordinateKey({ latitude, longitude }) {
    return `${latitude},${longitude}`;
}

function cacheKey(kind, coordinates) {
    return `${kind}:v1:${coordinateKey(coordinates)}`;
}

function abortError(message = "La richiesta ambientale è stata annullata.") {
    const error = new Error(message);
    error.name = "AbortError";
    error.code = "ABORTED";
    return error;
}

function subscribeToRequest(key, start, signal) {
    if (signal?.aborted) return Promise.reject(abortError());

    let request = inFlightRequests.get(key);
    if (!request) {
        const controller = new AbortController();
        request = { controller, subscribers: 0, settled: false, promise: null };
        request.promise = Promise.resolve()
            .then(() => start(controller.signal))
            .finally(() => {
                request.settled = true;
                if (inFlightRequests.get(key) === request) inFlightRequests.delete(key);
            });
        inFlightRequests.set(key, request);
    }

    request.subscribers += 1;
    return new Promise((resolve, reject) => {
        let completed = false;
        const finish = (callback, value) => {
            if (completed) return;
            completed = true;
            signal?.removeEventListener("abort", onAbort);
            request.subscribers -= 1;
            callback(value);
        };
        const onAbort = () => {
            finish(reject, abortError());
            if (!request.settled && request.subscribers === 0) request.controller.abort();
        };

        signal?.addEventListener("abort", onAbort, { once: true });
        request.promise.then(
            value => finish(resolve, value),
            error => finish(reject, error)
        );
    });
}

async function fetchJson(url, { signal, timeoutMs }) {
    const controller = new AbortController();
    let timedOut = false;
    const abortFromCaller = () => controller.abort();
    signal.addEventListener("abort", abortFromCaller, { once: true });
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new EnvironmentServiceError("HTTP_ERROR", `Open-Meteo ha risposto con HTTP ${response.status}.`);
        }

        let payload;
        try {
            payload = await response.json();
        } catch (error) {
            throw new EnvironmentServiceError("INVALID_RESPONSE", "Open-Meteo ha restituito una risposta JSON non valida.", error);
        }
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            throw new EnvironmentServiceError("INVALID_RESPONSE", "La risposta Open-Meteo non è un oggetto JSON valido.");
        }
        if (payload.error === true) {
            throw new EnvironmentServiceError("API_ERROR", payload.reason || "Open-Meteo ha segnalato un errore.");
        }

        return payload;
    } catch (error) {
        if (error instanceof EnvironmentServiceError) throw error;
        if (timedOut) {
            throw new EnvironmentServiceError("TIMEOUT", `La richiesta Open-Meteo ha superato il timeout di ${timeoutMs} ms.`, error);
        }
        if (controller.signal.aborted) throw abortError();
        throw new EnvironmentServiceError("NETWORK_ERROR", "Impossibile raggiungere Open-Meteo.", error);
    } finally {
        clearTimeout(timer);
        signal.removeEventListener("abort", abortFromCaller);
    }
}

function assertArrayGroup(group, variables, name) {
    if (!group || typeof group !== "object" || !Array.isArray(group.time)) {
        throw new EnvironmentServiceError("INVALID_RESPONSE", `La risposta Forecast non contiene il gruppo ${name} valido.`);
    }
    for (const variable of variables) {
        if (!Array.isArray(group[variable]) || group[variable].length !== group.time.length) {
            throw new EnvironmentServiceError("INVALID_RESPONSE", `La variabile Forecast ${variable} è assente o non valida.`);
        }
    }
}

function assertCurrentGroup(group) {
    if (!group || typeof group !== "object" || typeof group.time !== "string") {
        throw new EnvironmentServiceError("INVALID_RESPONSE", "La risposta Forecast non contiene il gruppo current valido.");
    }
    for (const variable of FORECAST_VARIABLES.current) {
        if (!(variable in group)) {
            throw new EnvironmentServiceError("INVALID_RESPONSE", `La variabile Forecast ${variable} è assente.`);
        }
    }
}

function validateForecastPayload(payload, includeSun) {
    assertCurrentGroup(payload.current);
    assertArrayGroup(payload.hourly, FORECAST_VARIABLES.hourly, "hourly");
    assertArrayGroup(payload.daily, includeSun
        ? [...FORECAST_VARIABLES.daily, ...FORECAST_VARIABLES.sun]
        : FORECAST_VARIABLES.daily, "daily");
    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude) ||
        typeof payload.timezone !== "string") {
        throw new EnvironmentServiceError("INVALID_RESPONSE", "La risposta Forecast non contiene coordinate del modello e fuso orario validi.");
    }
}

function validateMarinePayload(payload) {
    assertArrayGroup(payload.hourly, MARINE_VARIABLES, "hourly");
    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude) ||
        typeof payload.timezone !== "string") {
        throw new EnvironmentServiceError("INVALID_RESPONSE", "La risposta Marine non contiene coordinate del modello e fuso orario validi.");
    }
}

function selectValues(group, variables) {
    return Object.fromEntries(variables.map(variable => [variable, group[variable]]));
}

function selectUnits(group, variables) {
    if (!group || typeof group !== "object") return {};
    return Object.fromEntries(variables
        .filter(variable => Object.hasOwn(group, variable))
        .map(variable => [variable, group[variable]]));
}

function readForecastCache(coordinates, allowExpired) {
    const keys = {
        current: cacheKey("forecast-current", coordinates),
        hourly: cacheKey("forecast-hourly", coordinates),
        daily: cacheKey("forecast-daily", coordinates),
        sun: cacheKey("forecast-sun", coordinates)
    };
    const records = Object.fromEntries(Object.entries(keys).map(([name, key]) => [
        name,
        getEnvironmentCache(key, { allowExpired })
    ]));
    if (Object.values(records).some(record => record === null)) return null;
    return { records, keys };
}

function forecastFromCache(coordinates, cached, status, error = null) {
    const { records } = cached;
    const dataUpdatedAt = Math.min(...Object.values(records).map(record => record.updatedAt));
    return {
        status,
        model: "forecast",
        isCached: true,
        isStale: status === "stale",
        updatedAt: new Date(dataUpdatedAt).toISOString(),
        retrievedAt: new Date().toISOString(),
        requestedCoordinates: coordinates,
        modelCoordinates: records.current.value.modelCoordinates,
        timezone: records.current.value.timezone,
        elevation: records.current.value.elevation,
        data: {
            current: records.current.value.data,
            hourly: records.hourly.value.data,
            daily: records.daily.value.data,
            sun: records.sun.value.data
        },
        cache: Object.fromEntries(Object.entries(records).map(([name, record]) => [
            name,
            { updatedAt: new Date(record.updatedAt).toISOString(), stale: record.stale, storage: record.storage }
        ])),
        error: error ? { code: error.code || "REQUEST_FAILED", message: error.message } : null,
        notice: "Previsione meteorologica modellistica; non è una misurazione effettuata nel punto selezionato.",
        attribution: OPEN_METEO_ATTRIBUTION
    };
}

function forecastCacheValues(payload, cachedSun) {
    const dailyVariables = FORECAST_VARIABLES.daily;
    const sunVariables = FORECAST_VARIABLES.sun;
    const modelCoordinates = { latitude: payload.latitude, longitude: payload.longitude };

    return {
        current: {
            modelCoordinates,
            timezone: payload.timezone,
            elevation: Number.isFinite(payload.elevation) ? payload.elevation : null,
            data: {
                time: payload.current.time,
                values: selectValues(payload.current, FORECAST_VARIABLES.current),
                units: selectUnits(payload.current_units, FORECAST_VARIABLES.current)
            }
        },
        hourly: {
            data: {
                time: payload.hourly.time,
                values: selectValues(payload.hourly, FORECAST_VARIABLES.hourly),
                units: selectUnits(payload.hourly_units, FORECAST_VARIABLES.hourly)
            }
        },
        daily: {
            data: {
                time: payload.daily.time,
                values: selectValues(payload.daily, dailyVariables),
                units: selectUnits(payload.daily_units, dailyVariables)
            }
        },
        sun: cachedSun ? { data: cachedSun.value.data } : {
            data: {
                time: payload.daily.time,
                values: selectValues(payload.daily, sunVariables),
                units: selectUnits(payload.daily_units, sunVariables)
            }
        }
    };
}

function apiError(error) {
    if (error instanceof EnvironmentServiceError) return error;
    return new EnvironmentServiceError("REQUEST_FAILED", "La richiesta ambientale non è riuscita.", error);
}

export async function fetchForecast({ latitude, longitude, signal, timeoutMs } = {}) {
    const coordinates = validateCoordinates(latitude, longitude);
    const timeout = validateTimeout(timeoutMs);
    const cached = readForecastCache(coordinates, false);
    if (cached) return forecastFromCache(coordinates, cached, "cached");
    const sunKey = cacheKey("forecast-sun", coordinates);
    const cachedSun = getEnvironmentCache(sunKey);

    const key = cacheKey("forecast-request", coordinates);
    try {
        return await subscribeToRequest(key, async requestSignal => {
            const params = new URLSearchParams({
                latitude: String(coordinates.latitude),
                longitude: String(coordinates.longitude),
                current: FORECAST_VARIABLES.current.join(","),
                hourly: FORECAST_VARIABLES.hourly.join(","),
                daily: [...FORECAST_VARIABLES.daily, ...(cachedSun ? [] : FORECAST_VARIABLES.sun)].join(","),
                timezone: "Europe/Rome"
            });
            const payload = await fetchJson(`${FORECAST_URL}?${params}`, {
                signal: requestSignal,
                timeoutMs: timeout
            });
            validateForecastPayload(payload, !cachedSun);

            const updatedAt = Date.now();
            const values = forecastCacheValues(payload, cachedSun);
            const keys = readForecastCache(coordinates, true)?.keys ?? {
                current: cacheKey("forecast-current", coordinates),
                hourly: cacheKey("forecast-hourly", coordinates),
                daily: cacheKey("forecast-daily", coordinates),
                sun: cacheKey("forecast-sun", coordinates)
            };
            setEnvironmentCache(keys.current, values.current, { ttlMs: ENVIRONMENT_CACHE_TTL.current, updatedAt });
            setEnvironmentCache(keys.hourly, values.hourly, { ttlMs: ENVIRONMENT_CACHE_TTL.forecast, updatedAt });
            setEnvironmentCache(keys.daily, values.daily, { ttlMs: ENVIRONMENT_CACHE_TTL.forecast, updatedAt });
            if (!cachedSun) {
                setEnvironmentCache(keys.sun, values.sun, { ttlMs: ENVIRONMENT_CACHE_TTL.sunriseSunset, updatedAt });
            }

            return {
                status: "updated",
                model: "forecast",
                isCached: false,
                isStale: false,
                updatedAt: new Date(updatedAt).toISOString(),
                retrievedAt: new Date().toISOString(),
                requestedCoordinates: coordinates,
                modelCoordinates: { latitude: payload.latitude, longitude: payload.longitude },
                timezone: payload.timezone,
                elevation: Number.isFinite(payload.elevation) ? payload.elevation : null,
                data: {
                    current: values.current.data,
                    hourly: values.hourly.data,
                    daily: values.daily.data,
                    sun: values.sun.data
                },
                cache: null,
                error: null,
                notice: "Previsione meteorologica modellistica; non è una misurazione effettuata nel punto selezionato.",
                attribution: OPEN_METEO_ATTRIBUTION
            };
        }, signal);
    } catch (caughtError) {
        if (caughtError?.code === "ABORTED") throw caughtError;
        const error = apiError(caughtError);
        if (error.code === "ABORTED") throw error;

        const staleCache = readForecastCache(coordinates, true);
        if (staleCache) return forecastFromCache(coordinates, staleCache, "stale", error);
        throw new EnvironmentServiceError("UNAVAILABLE", "Dati Forecast non disponibili e nessuna cache utilizzabile.", error);
    }
}

function marineFromCache(coordinates, record, status, error = null) {
    return {
        status,
        model: "marine_forecast",
        isCached: true,
        isStale: status === "stale",
        updatedAt: new Date(record.updatedAt).toISOString(),
        retrievedAt: new Date().toISOString(),
        requestedCoordinates: coordinates,
        modelCoordinates: record.value.modelCoordinates,
        timezone: record.value.timezone,
        data: record.value.data,
        cache: { stale: record.stale, storage: record.storage },
        error: error ? { code: error.code || "REQUEST_FAILED", message: error.message } : null,
        notice: "Previsione modellistica marina; non è una misurazione effettuata nel punto selezionato.",
        attribution: OPEN_METEO_ATTRIBUTION
    };
}

export async function fetchMarine({ latitude, longitude, signal, timeoutMs } = {}) {
    const coordinates = validateCoordinates(latitude, longitude);
    const timeout = validateTimeout(timeoutMs);
    const dataKey = cacheKey("marine", coordinates);
    const cached = getEnvironmentCache(dataKey);
    if (cached) return marineFromCache(coordinates, cached, "cached");

    const requestKey = cacheKey("marine-request", coordinates);
    try {
        return await subscribeToRequest(requestKey, async requestSignal => {
            const params = new URLSearchParams({
                latitude: String(coordinates.latitude),
                longitude: String(coordinates.longitude),
                hourly: MARINE_VARIABLES.join(","),
                timezone: "Europe/Rome"
            });
            const payload = await fetchJson(`${MARINE_URL}?${params}`, {
                signal: requestSignal,
                timeoutMs: timeout
            });
            validateMarinePayload(payload);

            const updatedAt = Date.now();
            const value = {
                modelCoordinates: { latitude: payload.latitude, longitude: payload.longitude },
                timezone: payload.timezone,
                data: {
                    time: payload.hourly.time,
                    values: selectValues(payload.hourly, MARINE_VARIABLES),
                    units: selectUnits(payload.hourly_units, MARINE_VARIABLES)
                }
            };
            setEnvironmentCache(dataKey, value, { ttlMs: ENVIRONMENT_CACHE_TTL.marine, updatedAt });

            return {
                status: "updated",
                model: "marine_forecast",
                isCached: false,
                isStale: false,
                updatedAt: new Date(updatedAt).toISOString(),
                retrievedAt: new Date().toISOString(),
                requestedCoordinates: coordinates,
                modelCoordinates: value.modelCoordinates,
                timezone: payload.timezone,
                data: value.data,
                cache: null,
                error: null,
                notice: "Previsione modellistica marina; non è una misurazione effettuata nel punto selezionato.",
                attribution: OPEN_METEO_ATTRIBUTION
            };
        }, signal);
    } catch (caughtError) {
        if (caughtError?.code === "ABORTED") throw caughtError;
        const error = apiError(caughtError);
        if (error.code === "ABORTED") throw error;

        const staleCache = getEnvironmentCache(dataKey, { allowExpired: true });
        if (staleCache) return marineFromCache(coordinates, staleCache, "stale", error);
        throw new EnvironmentServiceError("UNAVAILABLE", "Dati Marine non disponibili e nessuna cache utilizzabile.", error);
    }
}