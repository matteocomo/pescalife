const REVIEWED_AT = "2026-11-09";

const RETICOLO_URL = "https://www.regione.toscana.it/-/reticolo-idrografico-e-di-gestione";
const RETORE_URL = "https://www502.regione.toscana.it/ows2/com.rt.wms.RTmap/wms?map=owsretore&map_resolution=91&language=ita&";
const SIR_WFS_URL = "https://geo.sir.toscana.it/geoserver/geo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo%3Acf_idrometri&maxFeatures=300000&outputFormat=application%2Fjson&srsName=EPSG%3A4326";
const SIR_LICENSE_URL = "https://www.sir.toscana.it/licenze";
const SIR_ARCHIVE_URL = "https://www.sir.toscana.it/archivio/download.php";

function unverifiedPoint(id, name, type, limits) {
    return {
        id,
        name,
        type,
        latitude: null,
        longitude: null,
        source: type === "marine"
            ? null
            : "Regione Toscana, CTR/RETORE: da selezionare un punto con significato geografico preciso",
        sourceUrl: type === "marine" ? null : RETORE_URL,
        sourceCrs: null,
        transformationMethod: null,
        precisionOrLimits: limits,
        status: "DA VERIFICARE",
        verifiedAt: null,
        reviewedAt: REVIEWED_AT
    };
}

function proposedForecastPoint(id, name, coordinates, geonamesId, featureCode) {
    return {
        id,
        name,
        type: "forecast",
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        source: "Open-Meteo Geocoding API, dati GeoNames",
        sourceUrl: `https://www.geonames.org/${geonamesId}/`,
        sourceRecordId: String(geonamesId),
        geocodingUrl: "https://geocoding-api.open-meteo.com/v1/search",
        sourceCrs: "WGS84, coordinate geografiche EPSG:4326",
        transformationMethod: null,
        precisionOrLimits: `Punto di località GeoNames (${featureCode}), indicativo e non equivalente a una stazione meteo o a un punto costiero verificato. Da validare sul territorio.`,
        status: "PROPOSTO",
        verifiedAt: null,
        reviewedAt: REVIEWED_AT
    };
}

function riverSegment(id, name, limits) {
    return {
        id,
        name,
        type: "river_segment",
        geometry: null,
        latitude: null,
        longitude: null,
        source: "Regione Toscana, reticolo idrografico vigente D.C.R. 24/2025",
        sourceUrl: RETICOLO_URL,
        sourceCrs: null,
        transformationMethod: null,
        precisionOrLimits: limits,
        status: "VERIFICATO",
        verifiedAt: REVIEWED_AT
    };
}

export const ENVIRONMENT_LOCATIONS = Object.freeze([
    {
        id: "cecina",
        name: "Cecina",
        type: "localita_terrestre",
        forecastPoint: proposedForecastPoint(
            "forecast-cecina", "Cecina", { latitude: 43.30621, longitude: 10.51729 }, 3179235, "PPLA3"
        ),
        marinePoint: null,
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "marina-cecina",
        name: "Marina di Cecina",
        type: "costa",
        forecastPoint: proposedForecastPoint(
            "forecast-marina-cecina", "Cecina Mare", { latitude: 43.30082, longitude: 10.49726 }, 3173933, "PPL"
        ),
        marinePoint: unverifiedPoint("marine-marina-cecina", "Punto marino presso Marina di Cecina", "marine", "Nessun punto offshore approvato. Le prove API non convalidano la posizione."),
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "vada",
        name: "Vada",
        type: "costa",
        forecastPoint: proposedForecastPoint(
            "forecast-vada", "Vada", { latitude: 43.35264, longitude: 10.45564 }, 3164994, "PPL"
        ),
        marinePoint: unverifiedPoint("marine-vada", "Punto marino presso Vada", "marine", "La griglia restituita dalla prova API cadeva su terra; nessun punto offshore approvato."),
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "la-mazzanta",
        name: "La Mazzanta",
        type: "costa",
        forecastPoint: proposedForecastPoint(
            "forecast-la-mazzanta", "Mazzanta", { latitude: 43.32617, longitude: 10.46209 }, 8393987, "PPL"
        ),
        marinePoint: unverifiedPoint("marine-la-mazzanta", "Punto marino presso La Mazzanta", "marine", "Nessun punto offshore approvato; la prova API non dimostra l'accuratezza locale."),
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "rosignano-marittimo",
        name: "Rosignano Marittimo",
        type: "localita_terrestre",
        forecastPoint: proposedForecastPoint(
            "forecast-rosignano-marittimo", "Rosignano Marittimo",
            { latitude: 43.40686, longitude: 10.47231 }, 3168931, "PPLA3"
        ),
        marinePoint: null,
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "costa-rosignano",
        name: "Costa di Rosignano",
        type: "costa",
        forecastPoint: unverifiedPoint("forecast-costa-rosignano", "Costa di Rosignano", "forecast", "Costa estesa: occorre specificare il tratto; il candidato OSM del Quercetano non rappresenta l'intera costa."),
        marinePoint: unverifiedPoint("marine-costa-rosignano", "Punto marino presso la costa di Rosignano", "marine", "Nessun punto offshore approvato; il candidato Quercetano è solo PROPOSTO."),
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "bibbona",
        name: "Bibbona",
        type: "localita_terrestre",
        forecastPoint: proposedForecastPoint(
            "forecast-bibbona", "Bibbona", { latitude: 43.26822, longitude: 10.59510 }, 3182058, "PPLA3"
        ),
        marinePoint: null,
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "marina-bibbona",
        name: "Marina di Bibbona",
        type: "costa",
        forecastPoint: proposedForecastPoint(
            "forecast-marina-bibbona", "Marina di Bibbona",
            { latitude: 43.24266, longitude: 10.53295 }, 3176673, "PPL"
        ),
        marinePoint: unverifiedPoint("marine-marina-bibbona", "Punto marino presso Marina di Bibbona", "marine", "La griglia restituita dalla prova API cadeva su terra; nessun punto offshore approvato."),
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "castagneto-carducci",
        name: "Castagneto Carducci",
        type: "localita_terrestre",
        forecastPoint: proposedForecastPoint(
            "forecast-castagneto-carducci", "Castagneto Carducci",
            { latitude: 43.16073, longitude: 10.61092 }, 3179762, "PPLA3"
        ),
        marinePoint: null,
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "marina-castagneto",
        name: "Marina di Castagneto",
        type: "costa",
        forecastPoint: proposedForecastPoint(
            "forecast-marina-castagneto", "Marina di Castagneto Carducci",
            { latitude: 43.18087, longitude: 10.54255 }, 3173934, "PPL"
        ),
        marinePoint: unverifiedPoint("marine-marina-castagneto", "Punto marino presso Marina di Castagneto", "marine", "La griglia restituita dalla prova API cadeva su terra; nessun punto offshore approvato."),
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "foce-cecina",
        name: "Foce del Cecina",
        type: "foce",
        forecastPoint: unverifiedPoint("forecast-foce-cecina", "Foce del Cecina", "forecast", "La posizione esatta della foce non è stata validata."),
        marinePoint: unverifiedPoint("marine-foce-cecina", "Punto marino presso la foce del Cecina", "marine", "Nessun punto offshore approvato. Il punto ARPAT citato in ricognizione riguarda un divieto di balneazione, non la foce."),
        riverSegment: riverSegment("river-mouth-cecina", "Sbocco del Fiume Cecina", "La geometria del reticolo è una linea ideale e non identifica da sola la foce precisa."),
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "fiume-cecina",
        name: "Fiume Cecina",
        type: "acque_interne",
        forecastPoint: unverifiedPoint("forecast-fiume-cecina", "Punto rappresentativo del Fiume Cecina", "forecast", "Nessun tratto puntuale scelto. Le stazioni idrometriche restano record separati e non sono coordinate meteo."),
        marinePoint: null,
        riverSegment: riverSegment("river-cecina", "Fiume Cecina", "Reticolo lineare ideale; non rappresenta la larghezza o l'effettiva consistenza dell'alveo."),
        hydrometricStationIds: [
            "TOS03005415", "TOS03005417", "TOS03005435",
            "TOS01005386", "TOS01005395", "TOS01005401"
        ],
        status: "DA VERIFICARE"
    },
    {
        id: "berignone",
        name: "Berignone",
        type: "localita_terrestre",
        forecastPoint: unverifiedPoint("forecast-berignone", "Berignone", "forecast", "Area estesa: serve un luogo o accesso geografico nominato; nessun centroide automatico."),
        marinePoint: null,
        riverSegment: null,
        hydrometricStationIds: [],
        status: "DA VERIFICARE"
    },
    {
        id: "torrente-sterza",
        name: "Torrente Sterza",
        type: "torrente",
        forecastPoint: unverifiedPoint("forecast-torrente-sterza", "Punto rappresentativo del Torrente Sterza", "forecast", "Nessun tratto puntuale scelto; Case Grisella è una stazione separata."),
        marinePoint: null,
        riverSegment: riverSegment("river-sterza", "Torrente Sterza", "Reticolo lineare ideale; Case Grisella non rappresenta l'intero torrente."),
        hydrometricStationIds: ["TOS01005403"],
        status: "DA VERIFICARE"
    },
    {
        id: "torrente-pavone",
        name: "Torrente Pavone",
        type: "torrente",
        forecastPoint: unverifiedPoint("forecast-torrente-pavone", "Punto rappresentativo del Torrente Pavone", "forecast", "Nessun tratto puntuale scelto; S. Dalmazio è una stazione separata."),
        marinePoint: null,
        riverSegment: riverSegment("river-pavone", "Torrente Pavone", "Reticolo lineare ideale; S. Dalmazio non rappresenta l'intero torrente."),
        hydrometricStationIds: ["TOS01005377"],
        status: "DA VERIFICARE"
    }
]);

export const HYDROMETRIC_STATIONS = Object.freeze([
    {
        id: "TOS03005415",
        name: "Steccaia Q",
        type: "hydrometric_station",
        latitude: 43.33996843,
        longitude: 10.57354104,
        source: "SIR Toscana, WFS geo:cf_idrometri",
        sourceUrl: SIR_WFS_URL,
        sourceCrs: "EPSG:4326, richiesto nella risposta WFS",
        transformationMethod: null,
        precisionOrLimits: "Inventario SIR; accuratezza dichiarata variabile. Co-localizzata nel WFS con Steccaia ma codice distinto.",
        status: "VERIFICATO",
        verifiedAt: REVIEWED_AT,
        river: "Cecina",
        municipality: "Riparbella",
        province: "PI",
        liveSnapshot: { observedAt: "2026-11-09T19:00:00+01:00", levelM: 1.76, flowM3s: null, levelChangeM: { hour1: 0, hour3: -0.01, hour6: -0.01 }, validated: false },
        historicalArchive: { type: "idro_l", firstDate: "2014-09-07", lastDate: "2026-09-30", url: `${SIR_ARCHIVE_URL}?IDST=idro_l&IDS=TOS03005415`, status: "VERIFICATO" },
        license: "CC BY-SA 4.0",
        licenseUrl: SIR_LICENSE_URL
    },
    {
        id: "TOS03005417",
        name: "Steccaia",
        type: "hydrometric_station",
        latitude: 43.33996843,
        longitude: 10.57354104,
        source: "SIR Toscana, WFS geo:cf_idrometri",
        sourceUrl: SIR_WFS_URL,
        sourceCrs: "EPSG:4326, richiesto nella risposta WFS",
        transformationMethod: null,
        precisionOrLimits: "Inventario SIR; accuratezza dichiarata variabile. Co-localizzata nel WFS con Steccaia Q ma codice distinto.",
        status: "VERIFICATO",
        verifiedAt: REVIEWED_AT,
        river: "Cecina",
        municipality: "Riparbella",
        province: "PI",
        liveSnapshot: { observedAt: "2026-11-09T19:00:00+01:00", levelM: 1.75, flowM3s: 1.73, levelChangeM: { hour1: 0, hour3: -0.01, hour6: 0 }, validated: false },
        historicalArchive: { type: "idro_l", firstDate: "2024-01-01", lastDate: "2026-09-30", url: `${SIR_ARCHIVE_URL}?IDST=idro_l&IDS=TOS03005417`, status: "VERIFICATO" },
        license: "CC BY-SA 4.0",
        licenseUrl: SIR_LICENSE_URL
    },
    {
        id: "TOS03005435",
        name: "Cecina SP39",
        type: "hydrometric_station",
        latitude: 43.31487874,
        longitude: 10.51462651,
        source: "SIR Toscana, WFS geo:cf_idrometri",
        sourceUrl: SIR_WFS_URL,
        sourceCrs: "EPSG:4326, richiesto nella risposta WFS",
        transformationMethod: null,
        precisionOrLimits: "Inventario SIR; accuratezza dichiarata variabile. La stazione non coincide con la foce.",
        status: "VERIFICATO",
        verifiedAt: REVIEWED_AT,
        river: "Cecina",
        municipality: "Cecina",
        province: "LI",
        liveSnapshot: { observedAt: "2026-11-09T19:00:00+01:00", levelM: 0.10, flowM3s: null, levelChangeM: { hour1: 0.01, hour3: 0.02, hour6: 0.03 }, validated: false },
        historicalArchive: { type: "idro_l", firstDate: "2018-01-01", lastDate: "2026-09-30", url: `${SIR_ARCHIVE_URL}?IDST=idro_l&IDS=TOS03005435`, status: "VERIFICATO" },
        license: "CC BY-SA 4.0",
        licenseUrl: SIR_LICENSE_URL
    },
    {
        id: "TOS01005386",
        name: "Ponte SR439",
        type: "hydrometric_station",
        latitude: 43.33417223,
        longitude: 10.85806490,
        source: "SIR Toscana, WFS geo:cf_idrometri",
        sourceUrl: SIR_WFS_URL,
        sourceCrs: "EPSG:4326, richiesto nella risposta WFS",
        transformationMethod: null,
        precisionOrLimits: "Inventario SIR; riferimento interno al bacino, non rappresentativo dei tratti costieri.",
        status: "VERIFICATO",
        verifiedAt: REVIEWED_AT,
        river: "Cecina",
        municipality: "Pomarance",
        province: "PI",
        liveSnapshot: { observedAt: "2026-11-09T19:05:00+01:00", levelM: 2.31, flowM3s: null, levelChangeM: { hour1: 0, hour3: 0, hour6: -0.05 }, validated: false },
        historicalArchive: { type: "idro_l", firstDate: "2010-01-01", lastDate: "2026-09-30", url: `${SIR_ARCHIVE_URL}?IDST=idro_l&IDS=TOS01005386`, status: "VERIFICATO" },
        license: "CC BY-SA 4.0",
        licenseUrl: SIR_LICENSE_URL
    },
    {
        id: "TOS01005395",
        name: "Montegemoli",
        type: "hydrometric_station",
        latitude: 43.35467260,
        longitude: 10.78528350,
        source: "SIR Toscana, WFS geo:cf_idrometri",
        sourceUrl: SIR_WFS_URL,
        sourceCrs: "EPSG:4326, richiesto nella risposta WFS",
        transformationMethod: null,
        precisionOrLimits: "Inventario SIR; riferimento interno al bacino, non rappresentativo dei tratti costieri.",
        status: "VERIFICATO",
        verifiedAt: REVIEWED_AT,
        river: "Cecina",
        municipality: "Montecatini Val di Cecina",
        province: "PI",
        liveSnapshot: { observedAt: "2026-11-09T18:45:00+01:00", levelM: 0.97, flowM3s: 3.24, levelChangeM: { hour1: 0.06, hour3: 0, hour6: 0 }, validated: false },
        historicalArchive: { type: "idro_l", firstDate: "2008-01-01", lastDate: "2026-09-30", url: `${SIR_ARCHIVE_URL}?IDST=idro_l&IDS=TOS01005395`, status: "VERIFICATO" },
        license: "CC BY-SA 4.0",
        licenseUrl: SIR_LICENSE_URL
    },
    {
        id: "TOS01005401",
        name: "Ponte di Monterufoli",
        type: "hydrometric_station",
        latitude: 43.32333573,
        longitude: 10.66982210,
        source: "SIR Toscana, WFS geo:cf_idrometri",
        sourceUrl: SIR_WFS_URL,
        sourceCrs: "EPSG:4326, richiesto nella risposta WFS",
        transformationMethod: null,
        precisionOrLimits: "Inventario SIR; riferimento interno al bacino, non rappresentativo dei tratti costieri.",
        status: "VERIFICATO",
        verifiedAt: REVIEWED_AT,
        river: "Cecina",
        municipality: "Guardistallo",
        province: "PI",
        liveSnapshot: { observedAt: "2026-11-09T19:05:00+01:00", levelM: -0.18, flowM3s: 0.24, levelChangeM: { hour1: 0, hour3: 0, hour6: 0 }, validated: false },
        historicalArchive: { type: "idro_l", firstDate: "2004-01-01", lastDate: "2026-09-30", url: `${SIR_ARCHIVE_URL}?IDST=idro_l&IDS=TOS01005401`, status: "VERIFICATO" },
        license: "CC BY-SA 4.0",
        licenseUrl: SIR_LICENSE_URL
    },
    {
        id: "TOS01005403",
        name: "Case Grisella",
        type: "hydrometric_station",
        latitude: 43.31023848,
        longitude: 10.67375556,
        source: "SIR Toscana, WFS geo:cf_idrometri",
        sourceUrl: SIR_WFS_URL,
        sourceCrs: "EPSG:4326, richiesto nella risposta WFS",
        transformationMethod: null,
        precisionOrLimits: "Il WFS e il CSV SIR riportano Guardistallo. Nel CFR 'Cecina' identifica la zona, non il comune.",
        status: "VERIFICATO",
        verifiedAt: REVIEWED_AT,
        river: "Sterza",
        municipality: "Guardistallo",
        province: "PI",
        liveSnapshot: { observedAt: "2026-11-09T19:00:00+01:00", levelM: 0.64, flowM3s: null, levelChangeM: { hour1: 0, hour3: 0, hour6: 0.01 }, validated: false },
        historicalArchive: { type: "idro_l", firstDate: "2007-01-01", lastDate: "2026-09-30", url: `${SIR_ARCHIVE_URL}?IDST=idro_l&IDS=TOS01005403`, status: "VERIFICATO" },
        license: "CC BY-SA 4.0",
        licenseUrl: SIR_LICENSE_URL
    },
    {
        id: "TOS01005377",
        name: "S. Dalmazio",
        type: "hydrometric_station",
        latitude: 43.25349284,
        longitude: 10.94356851,
        source: "SIR Toscana, WFS geo:cf_idrometri",
        sourceUrl: SIR_WFS_URL,
        sourceCrs: "EPSG:4326, richiesto nella risposta WFS",
        transformationMethod: null,
        precisionOrLimits: "Inventario SIR; stazione sul Pavone, non rappresentativa automaticamente dei tratti inferiori.",
        status: "VERIFICATO",
        verifiedAt: REVIEWED_AT,
        river: "Pavone",
        municipality: "Pomarance",
        province: "PI",
        liveSnapshot: { observedAt: "2026-11-09T19:00:00+01:00", levelM: 0.43, flowM3s: 0.13, levelChangeM: { hour1: -0.05, hour3: -0.11, hour6: 0.28 }, validated: false },
        historicalArchive: { type: "idro_l", firstDate: "2007-01-01", lastDate: "2026-09-30", url: `${SIR_ARCHIVE_URL}?IDST=idro_l&IDS=TOS01005377`, status: "VERIFICATO" },
        license: "CC BY-SA 4.0",
        licenseUrl: SIR_LICENSE_URL
    }
]);