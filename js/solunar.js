const DAY_MS = 24 * 60 * 60 * 1000;
const J2000_UNIX_DAYS = 10_957.5;
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const TIME_ZONE = "Europe/Rome";
const LOCAL_PARTS = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
});
const CLOCK = new Intl.DateTimeFormat("it-IT", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
});

function localParts(date) {
    return Object.fromEntries(LOCAL_PARTS.formatToParts(date).map(part => [part.type, part.value]));
}

function localDateKey(date) {
    const parts = localParts(date);
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function localDayStart(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const target = Date.UTC(year, month - 1, day);
    let timestamp = target;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const parts = localParts(new Date(timestamp));
        const localAsUtc = Date.UTC(
            Number(parts.year), Number(parts.month) - 1, Number(parts.day),
            Number(parts.hour), Number(parts.minute), Number(parts.second)
        );
        timestamp = target - (localAsUtc - timestamp);
    }
    return timestamp;
}

function lunarCoordinates(date) {
    const days = date.getTime() / DAY_MS - J2000_UNIX_DAYS;
    const meanLongitude = (218.316 + 13.176396 * days) * RAD;
    const meanAnomaly = (134.963 + 13.064993 * days) * RAD;
    const argumentLatitude = (93.272 + 13.229350 * days) * RAD;
    const longitude = meanLongitude + 6.289 * RAD * Math.sin(meanAnomaly);
    const latitude = 5.128 * RAD * Math.sin(argumentLatitude);
    const rightAscension = Math.atan2(
        Math.sin(longitude) * Math.cos(latitude),
        Math.cos(longitude)
    );
    const declination = Math.asin(
        Math.sin(latitude) * Math.cos(23.4397 * RAD) +
        Math.cos(latitude) * Math.sin(23.4397 * RAD) * Math.sin(longitude)
    );
    return { days, longitude, rightAscension, declination };
}

function moonAltitude(timestamp, latitude, longitude) {
    const date = new Date(timestamp);
    const { days, rightAscension, declination } = lunarCoordinates(date);
    const siderealTime = (280.16 + 360.9856235 * days) * RAD + longitude * RAD;
    const hourAngle = siderealTime - rightAscension;
    const observerLatitude = latitude * RAD;
    return Math.asin(
        Math.sin(observerLatitude) * Math.sin(declination) +
        Math.cos(observerLatitude) * Math.cos(declination) * Math.cos(hourAngle)
    ) * DEG;
}

function phaseAt(timestamp) {
    const { days, longitude } = lunarCoordinates(new Date(timestamp));
    const meanAnomaly = (357.5291 + 0.98560028 * days) * RAD;
    const sunLongitude = (280.46646 + 0.98564736 * days) * RAD +
        1.9148 * RAD * Math.sin(meanAnomaly) +
        0.02 * RAD * Math.sin(2 * meanAnomaly);
    const angle = ((longitude - sunLongitude) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const illumination = (1 - Math.cos(angle)) / 2;
    const quarterWindow = Math.PI / 24;
    let name;
    if (angle < Math.PI / 2 - quarterWindow) name = "Luna crescente";
    else if (angle < Math.PI / 2 + quarterWindow) name = "Primo quarto";
    else if (angle < Math.PI - quarterWindow) name = "Gibbosa crescente";
    else if (angle < Math.PI + quarterWindow) name = "Luna piena";
    else if (angle < 3 * Math.PI / 2 - quarterWindow) name = "Gibbosa calante";
    else if (angle < 3 * Math.PI / 2 + quarterWindow) name = "Ultimo quarto";
    else if (angle < 2 * Math.PI - quarterWindow) name = "Luna calante";
    else name = "Luna nuova";
    if (illumination < 0.02) name = "Luna nuova";
    else if (illumination > 0.98) name = "Luna piena";
    return { name, illumination };
}

function crossingTime(start, end, rising, latitude, longitude) {
    let low = start;
    let high = end;
    for (let attempt = 0; attempt < 30; attempt += 1) {
        const middle = (low + high) / 2;
        const isAbove = moonAltitude(middle, latitude, longitude) >= -0.3;
        if (isAbove === rising) high = middle;
        else low = middle;
    }
    return (low + high) / 2;
}

function refineExtremum(start, end, maximum, latitude, longitude) {
    let left = start;
    let right = end;
    for (let attempt = 0; attempt < 32; attempt += 1) {
        const first = left + (right - left) / 3;
        const second = right - (right - left) / 3;
        const firstValue = moonAltitude(first, latitude, longitude);
        const secondValue = moonAltitude(second, latitude, longitude);
        if ((firstValue < secondValue) === maximum) left = first;
        else right = second;
    }
    const timestamp = (left + right) / 2;
    return { timestamp, altitude: moonAltitude(timestamp, latitude, longitude) };
}

function findLunarEvents(start, end, latitude, longitude) {
    const step = 10 * 60 * 1000;
    const samples = [];
    for (let timestamp = start; timestamp <= end; timestamp += step) {
        samples.push({ timestamp, altitude: moonAltitude(timestamp, latitude, longitude) });
    }
    if (samples.at(-1)?.timestamp !== end) {
        samples.push({ timestamp: end, altitude: moonAltitude(end, latitude, longitude) });
    }

    const rises = [];
    const sets = [];
    for (let index = 1; index < samples.length; index += 1) {
        const previous = samples[index - 1];
        const current = samples[index];
        if (previous.altitude < -0.3 && current.altitude >= -0.3) {
            rises.push(crossingTime(previous.timestamp, current.timestamp, true, latitude, longitude));
        } else if (previous.altitude >= -0.3 && current.altitude < -0.3) {
            sets.push(crossingTime(previous.timestamp, current.timestamp, false, latitude, longitude));
        }
    }

    const extrema = [];
    for (let index = 1; index < samples.length - 1; index += 1) {
        const previous = samples[index - 1];
        const current = samples[index];
        const next = samples[index + 1];
        if (current.altitude >= previous.altitude && current.altitude > next.altitude) {
            extrema.push(refineExtremum(previous.timestamp, next.timestamp, true, latitude, longitude));
        } else if (current.altitude <= previous.altitude && current.altitude < next.altitude) {
            extrema.push(refineExtremum(previous.timestamp, next.timestamp, false, latitude, longitude));
        }
    }

    return { rises, sets, extrema };
}

function clock(timestamp) {
    return CLOCK.format(new Date(timestamp));
}

function period(timestamp, dayStart, dayEnd) {
    const start = Math.max(dayStart, timestamp - 60 * 60 * 1000);
    const end = Math.min(dayEnd, timestamp + 60 * 60 * 1000);
    return `${clock(start)}–${clock(end)}`;
}

function eventsOnDate(events, dateKey) {
    return events.filter(timestamp => localDateKey(new Date(timestamp)) === dateKey);
}

export function calculateSolunarDay(dateKey, latitude, longitude) {
    if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        throw new TypeError("La data solunare deve avere il formato YYYY-MM-DD.");
    }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new TypeError("Le coordinate solunari non sono valide.");
    }

    const dayStart = localDayStart(dateKey);
    const nextDate = getSolunarDates(dateKey, 2)[1];
    const dayEnd = localDayStart(nextDate);
    const { rises, sets, extrema } = findLunarEvents(
        dayStart - 60 * 60 * 1000,
        dayEnd + 60 * 60 * 1000,
        latitude,
        longitude
    );
    const localRises = eventsOnDate(rises, dateKey);
    const localSets = eventsOnDate(sets, dateKey);
    const localExtrema = extrema.filter(event => localDateKey(new Date(event.timestamp)) === dateKey);
    const upperTransit = localExtrema.filter(event => event.altitude > 0)
        .sort((first, second) => second.altitude - first.altitude)[0];
    const lowerTransit = localExtrema.filter(event => event.altitude < 0)
        .sort((first, second) => first.altitude - second.altitude)[0];
    const phase = phaseAt(dayStart + (dayEnd - dayStart) / 2);

    return {
        date: dateKey,
        phase: phase.name,
        illumination: phase.illumination,
        moonrise: localRises.map(clock),
        moonset: localSets.map(clock),
        majorPeriods: [upperTransit, lowerTransit].filter(Boolean)
            .sort((first, second) => first.timestamp - second.timestamp)
            .map(event => period(event.timestamp, dayStart, dayEnd)),
        minorPeriods: [...localRises, ...localSets].sort((first, second) => first - second)
            .map(event => period(event, dayStart, dayEnd))
    };
}

export function getSolunarDates(startDate, dayCount = 5) {
    if (typeof startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
        !Number.isInteger(dayCount) || dayCount < 1 || dayCount > 14) {
        throw new TypeError("Intervallo solunare non valido.");
    }
    const [year, month, day] = startDate.split("-").map(Number);
    return Array.from({ length: dayCount }, (_, offset) => {
        const date = new Date(Date.UTC(year, month - 1, day + offset));
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    });
}

export function formatSolunarDate(dateKey) {
    const date = new Date(`${dateKey}T12:00:00Z`);
    return new Intl.DateTimeFormat("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC"
    }).format(date);
}

export function localSolunarDate(now = new Date()) {
    return localDateKey(now);
}
