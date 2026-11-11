const DATA_PATH = "data/maps/optimized/";

(async () => {
    const mapElement = document.getElementById("preview-map");
    if (!mapElement) return;

    const status = document.getElementById("map-status");
    const resetButton = document.getElementById("map-reset");
    const locationButton = document.getElementById("map-location");
    const searchInput = document.getElementById("map-search");
    const searchForm = document.getElementById("map-search-form");
    const searchResults = document.getElementById("map-search-results");
    const currentControlsLabel = document.getElementById("map-controls-current");
    const layerInputs = [...document.querySelectorAll("[data-map-layer]")];
    const styleInputs = [...document.querySelectorAll('input[name="map-style"]')];
    const guideDialog = document.getElementById("map-guide");
    const guideOpenButton = document.getElementById("map-guide-open");
    const guideCount = document.getElementById("map-guide-count");
    const guideStepText = document.getElementById("map-guide-step-text");
    const guideBackButton = document.getElementById("map-guide-back");
    const guideNextButton = document.getElementById("map-guide-next");
    const guideSteps = [
        "Cerca un comune o un luogo usando il campo di ricerca.",
        "Apri “Aspetto e informazioni” e attiva i livelli che vuoi esplorare.",
        "Avvicinati e tocca un corso d’acqua per leggerne il nome e la tipologia."
    ];
    const bounds = [[10.462678, 42.958743], [11.199693, 43.497429]];
    const definitions = {
        waterways: { file: "hydrography.geojson", source: "waterways-source" },
        waterbodies: { file: "water-bodies.geojson", source: "waterbodies-source" },
        roads: { file: "roads.geojson", source: "roads-source" },
        places: { file: "place-labels.geojson", source: "places-source" },
        communes: { file: "communes.geojson", source: "communes-source" }
    };
    const layerIds = {
        waterbodies: ["waterbodies-fill", "waterbodies-outline"],
        roads: ["roads-fill"],
        communes: ["communes-boundaries"],
        waterways: [
            "waterways-hitbox-rank1", "waterways-hitbox-rank2", "waterways-hitbox-rank3", "waterways-hitbox-minor",
            "waterways-rank1-casing", "waterways-rank1-line",
            "waterways-rank2-casing", "waterways-rank2-line", "waterways-rank3-casing",
            "waterways-rank3-line", "waterways-minor-casing", "waterways-minor-line",
            "waterways-rank1-labels", "waterways-rank2-labels", "waterways-rank3-labels",
            "waterways-highlight-casing", "waterways-highlight-line"
        ],
        places: ["places-water-labels", "places-detail-labels"]
    };
    const mapStyles = {
        liberty: "https://tiles.openfreemap.org/styles/liberty",
        bright: "https://tiles.openfreemap.org/styles/bright",
        positron: "https://tiles.openfreemap.org/styles/positron",
        terrain: {
            version: 8,
            glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
            sources: {
                "base-terrain": {
                    type: "raster",
                    tiles: [
                        "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
                        "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
                        "https://c.tile.opentopomap.org/{z}/{x}/{y}.png"
                    ],
                    tileSize: 256,
                    maxzoom: 17,
                    attribution: 'Kartendaten: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>, SRTM | Kartendarstellung: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                }
            },
            layers: [{ id: "base-terrain-layer", type: "raster", source: "base-terrain" }]
        }
    };
    const dataPromises = new Map();
    const loadedCounts = new Map();
    const registeredLayerEvents = new Set();
    const layerLegendLabels = {
        waterbodies: "Specchi d’acqua",
        places: "Nomi cartografici",
        communes: "Confini comunali",
        roads: "Aree viarie"
    };
    let map;
    let selectedMarker;
    let activePopup;
    let searchIndex = [];
    let hydrographyData;
    let mapReady;
    let initialStyleLoaded = false;
    let styleChangePending = false;
    let baseMapErrorShown = false;
    let statusIsError = false;
    let guideStep = 0;
    let guideShown = false;

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle("is-error", isError);
        statusIsError = isError;
    }

    function disableMapControls() {
        [...layerInputs, ...styleInputs, searchInput, resetButton, locationButton].forEach(input => { input.disabled = true; });
        searchForm.querySelector('button[type="submit"]').disabled = true;
    }

    function setLayerVisibility(key, visibility) {
        layerIds[key].forEach(id => {
            if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
        });
        if (key === "places") updatePlaceLayerVisibility();
        updateLegend();
    }

    function updateControlSummaries() {
        const selectedStyle = styleInputs.find(input => input.checked);
        const styleNames = { liberty: "Standard", bright: "Stradale", positron: "Chiara", terrain: "Rilievi" };
        const enabledLayers = layerInputs.filter(input => input.checked).length;
        if (selectedStyle) {
            currentControlsLabel.textContent = `${styleNames[selectedStyle.value]} · ${enabledLayers} ${enabledLayers === 1 ? "attiva" : "attive"}`;
        }
    }

    function titleCase(value) {
        const particles = new Set(["di", "del", "della", "dei", "delle", "da", "la", "il", "le", "lo"]);
        return String(value || "").trim().toLocaleLowerCase("it-IT").split(/(\s+)/).map((part, index) => {
            if (/^\s+$/.test(part) || !part) return part;
            if (index > 0 && particles.has(part)) return part;
            return part.charAt(0).toLocaleUpperCase("it-IT") + part.slice(1);
        }).join("");
    }

    function rankWaterway(name) {
        const normalized = String(name || "").trim().toLocaleUpperCase("it-IT");
        if (normalized.startsWith("FIUME")) return 1;
        if (normalized.startsWith("TORRENTE")) return 2;
        if (/^(?:IL RIO|BOTRO|FOSSO|RIO)\b/.test(normalized)) return 3;
        return normalized ? 4 : 5;
    }

    function updatePlaceLayerVisibility() {
        if (!map || !map.getLayer("places-detail-labels") || !map.getLayer("places-water-labels")) return;
        const placesEnabled = layerInputs.find(input => input.dataset.mapLayer === "places")?.checked;
        const isTerrain = styleInputs.find(input => input.checked)?.value === "terrain";
        map.setLayoutProperty("places-detail-labels", "visibility", placesEnabled && !isTerrain ? "visible" : "none");
        map.setLayoutProperty("places-water-labels", "visibility", placesEnabled ? "visible" : "none");
    }

    function addLegendItem(parent, label, swatchClass) {
        const item = document.createElement("span");
        item.className = "map-legend-item";
        const swatch = document.createElement("span");
        swatch.className = `map-legend-key ${swatchClass}`;
        swatch.setAttribute("aria-hidden", "true");
        const text = document.createElement("span");
        text.textContent = label;
        item.append(swatch, text);
        parent.append(item);
    }

    function updateLegend() {
        const legend = document.getElementById("map-legend");
        if (!legend) return;
        legend.replaceChildren();
        const zoom = map ? map.getZoom() : 0;
        layerInputs.filter(input => input.checked).forEach(input => {
            const key = input.dataset.mapLayer;
            if (key === "waterways") {
                [
                    [8, "Fiumi principali", "map-legend-river"],
                    [10, "Torrenti", "map-legend-stream"],
                    [12, "Botri e fossi", "map-legend-small-water"]
                ].filter(([minimumZoom]) => zoom >= minimumZoom)
                    .forEach(([, label, swatch]) => addLegendItem(legend, label, swatch));
                if (zoom >= 13) addLegendItem(legend, "Altri corsi d’acqua", "map-legend-small-water");
            } else if (key === "waterbodies") {
                addLegendItem(legend, layerLegendLabels[key], "map-legend-waterbody");
            } else if (key === "places") {
                const isTerrain = styleInputs.find(style => style.checked)?.value === "terrain";
                addLegendItem(legend, isTerrain ? "Nomi idrografici" : layerLegendLabels[key], "map-legend-place");
            } else if (key === "communes") {
                addLegendItem(legend, layerLegendLabels[key], "map-legend-boundary");
            } else if (key === "roads") {
                addLegendItem(legend, layerLegendLabels[key], "map-legend-road");
            }
        });
    }

    function updateMapGuidance() {
        updateLegend();
        if (statusIsError || styleChangePending) return;
        if (layerInputs.some(input => input.checked && !loadedCounts.has(input.dataset.mapLayer))) {
            setStatus("Carico i corsi d’acqua…");
            return;
        }
        const waterwaysEnabled = layerInputs.some(input => input.dataset.mapLayer === "waterways" && input.checked);
        if (waterwaysEnabled) {
            const zoom = map.getZoom();
            if (zoom < 8) {
                setStatus("Avvicinati per vedere i fiumi principali.");
                return;
            }
            if (zoom < 10) {
                setStatus("Avvicinati per vedere i torrenti.");
                return;
            }
            if (zoom < 12) {
                setStatus("Avvicinati per vedere botri e fossi.");
                return;
            }
            if (zoom < 13) {
                setStatus("Avvicinati per vedere gli altri corsi d’acqua.");
                return;
            }
        }
        const placesEnabled = layerInputs.some(input => input.dataset.mapLayer === "places" && input.checked);
        if (placesEnabled && map.getZoom() < 11.5) {
            setStatus("Avvicinati per leggere i nomi idrografici.");
            return;
        }
        if (placesEnabled && map.getZoom() < 13.5) {
            setStatus("Avvicinati per leggere i toponimi locali.");
            return;
        }
        setStatus("Mappa aggiornata. Tocca un corso d’acqua per saperne di più.");
    }

    let maplibregl;
    try {
        maplibregl = await import("https://unpkg.com/maplibre-gl@6.17.0/dist/maplibre-gl.mjs");
    } catch (error) {
        console.error("Impossibile caricare MapLibre GL JS:", error);
        setStatus("Mappa non disponibile: controlla la connessione e ricarica la pagina.", true);
        disableMapControls();
        return;
    }

    function fetchLayerData(key) {
        if (dataPromises.has(key)) return dataPromises.get(key);
        const definition = definitions[key];
        const promise = fetch(new URL(`${DATA_PATH}${definition.file}`, document.baseURI))
            .then(response => {
                if (!response.ok) throw new Error(`${definition.file}: HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
                    throw new Error(`${definition.file}: formato GeoJSON non valido`);
                }
                if (key === "places") {
                    const seen = new Set();
                    data.features = data.features.filter(feature => {
                        const properties = feature.properties || {};
                        const label = String(properties.label || "").trim();
                        const code = String(properties.code || "");
                        const dedupeKey = `${label.toLocaleLowerCase("it-IT")}\u0000${code}`;
                        if (seen.has(dedupeKey)) return false;
                        seen.add(dedupeKey);
                        if (label) properties.label = titleCase(label);
                        feature.properties = properties;
                        return true;
                    });
                } else if (key === "communes") {
                    data.features.forEach(feature => {
                        const properties = feature.properties || {};
                        if (properties.name) properties.name = titleCase(properties.name);
                        feature.properties = properties;
                    });
                } else if (key === "waterways") {
                    data.features.forEach(feature => {
                        const properties = feature.properties || {};
                        properties.rank = rankWaterway(properties.name);
                        properties.display_name = titleCase(properties.name);
                        feature.properties = properties;
                    });
                    hydrographyData = data;
                }
                return data;
            })
            .catch(error => {
                dataPromises.delete(key);
                throw error;
            });
        dataPromises.set(key, promise);
        return promise;
    }

    function nextLayerFor(key) {
        const ordered = {
            waterbodies: ["roads-fill", "communes-boundaries", "waterways-hitbox-rank1", "waterways-rank1-casing", "places-water-labels", "places-detail-labels"],
            roads: ["communes-boundaries", "waterways-hitbox-rank1", "waterways-rank1-casing", "places-water-labels", "places-detail-labels"],
            communes: ["waterways-hitbox-rank1", "waterways-rank1-casing", "places-water-labels", "places-detail-labels"],
            waterways: ["places-water-labels", "places-detail-labels"],
            places: []
        };
        return ordered[key].find(id => map.getLayer(id));
    }

    function addLayer(key, layer) {
        const before = nextLayerFor(key);
        if (before) map.addLayer(layer, before);
        else map.addLayer(layer);
    }

    function attachLayerEvents(key) {
        const interactiveLayers = key === "waterways"
            ? [
                ["waterways-hitbox-rank1", "waterways"],
                ["waterways-hitbox-rank2", "waterways"],
                ["waterways-hitbox-rank3", "waterways"],
                ["waterways-hitbox-minor", "waterways"]
            ]
            : {
                waterbodies: [["waterbodies-fill", "Specchio d’acqua", "Elemento areale della cartografia CTR."]],
                roads: [["roads-fill", "Viabilità", "Area viaria CTR; non è un percorso né un'indicazione di accesso."]],
                communes: [["communes-boundaries", "Confine comunale", "Confine amministrativo ISTAT generalizzato 2026."]]
            }[key] || [];

        interactiveLayers.forEach(([layerId, kind, sourceDescription]) => {
            if (registeredLayerEvents.has(layerId)) return;
            registeredLayerEvents.add(layerId);
            map.on("click", layerId, event => {
                const feature = event.features && event.features[0];
                if (!feature) return;
                const properties = feature.properties || {};
                if (kind === "waterways") {
                    showWaterwayPopup(feature, event.lngLat);
                    return;
                }
                if (activePopup) activePopup.remove();
                const content = document.createElement("div");
                const heading = document.createElement("strong");
                heading.textContent = titleCase(properties.name || properties.label || kind);
                content.append(heading);
                const detail = document.createElement("p");
                detail.textContent = `${sourceDescription} La cartografia non conferma accessibilità o pescabilità.`;
                content.append(detail);
                activePopup = new maplibregl.Popup({ closeButton: true, maxWidth: "300px" })
                    .setLngLat(event.lngLat)
                    .setDOMContent(content)
                    .addTo(map);
            });
            map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
            map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
        });
    }

    function clearWaterwayHighlight() {
        const source = map.getSource("waterways-highlight-source");
        if (source) source.setData({ type: "FeatureCollection", features: [] });
    }

    function showWaterwayPopup(feature, coordinates) {
        const properties = feature.properties || {};
        const name = String(properties.name || "").trim();
        const normalized = name.toLocaleUpperCase("it-IT");
        const type = normalized.startsWith("FIUME") ? "Fiume"
            : normalized.startsWith("TORRENTE") ? "Torrente"
                : normalized.startsWith("BOTRO") ? "Botro"
                    : normalized.startsWith("FOSSO") ? "Fosso"
                        : /^(?:IL RIO|RIO)\b/.test(normalized) ? "Rio"
                            : name ? "Corso d’acqua" : "Corso d’acqua senza nome";
        const displayName = name ? titleCase(name) : "Corso d’acqua senza nome";
        if (activePopup) activePopup.remove();
        const highlightSource = map.getSource("waterways-highlight-source");
        if (highlightSource && name && hydrographyData) {
            const matchingFeatures = hydrographyData.features.filter(item =>
                String(item.properties?.name || "").toLocaleUpperCase("it-IT") === normalized);
            highlightSource.setData({ type: "FeatureCollection", features: matchingFeatures });
        } else {
            clearWaterwayHighlight();
        }
        const content = document.createElement("div");
        const heading = document.createElement("strong");
        heading.textContent = displayName;
        const typeLine = document.createElement("div");
        typeLine.textContent = type;
        const note = document.createElement("small");
        note.textContent = "Dato cartografico CTR, non conferma accessi o pescabilità";
        content.append(heading, typeLine, note);
        activePopup = new maplibregl.Popup({ closeButton: true, maxWidth: "300px" })
            .setLngLat(coordinates)
            .setDOMContent(content)
            .addTo(map);
        activePopup.on("close", () => {
            activePopup = null;
            clearWaterwayHighlight();
        });
    }

    function addLayerGroup(key, data) {
        const { source } = definitions[key];
        if (map.getSource(source)) return;
        map.addSource(source, { type: "geojson", data });

        if (key === "waterbodies") {
            addLayer(key, { id: "waterbodies-fill", type: "fill", source, paint: { "fill-color": "#75c5d2", "fill-opacity": 0.72 } });
            addLayer(key, { id: "waterbodies-outline", type: "line", source, paint: { "line-color": "#368fa0", "line-width": 0.8, "line-opacity": 0.8 } });
        } else if (key === "roads") {
            addLayer(key, { id: "roads-fill", type: "fill", source, paint: { "fill-color": "#89999b", "fill-opacity": 0.55 } });
        } else if (key === "communes") {
            addLayer(key, {
                id: "communes-boundaries", type: "line", source,
                paint: {
                    "line-color": "#446a79",
                    "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.6, 12, 1.3],
                    "line-opacity": 0.65,
                    "line-dasharray": [2, 1.5]
                }
            });
        } else if (key === "waterways") {
            const groups = [
                { id: "rank1", rank: 1, minzoom: 8, labelMinzoom: 8, color: "#176f96", core: [2.2, 3.8], casing: [3.8, 6] },
                { id: "rank2", rank: 2, minzoom: 10, labelMinzoom: 10, color: "#268ea2", core: [1.8, 3], casing: [3.1, 4.5] },
                { id: "rank3", rank: 3, minzoom: 12, labelMinzoom: 12, color: "#459daf", core: [1.2, 1.8], casing: [2.3, 3.2] },
                { id: "minor", rank: [4, 5], minzoom: 13, color: "#83bdc8", core: [1, 1.4], casing: [2, 2.6], opacity: 0.5 }
            ];
            groups.forEach(group => {
                const filter = Array.isArray(group.rank)
                    ? ["any", ...group.rank.map(rank => ["==", ["get", "rank"], rank])]
                    : ["==", ["get", "rank"], group.rank];
                const hitboxId = `waterways-hitbox-${group.id}`;
                map.addLayer({
                    id: hitboxId, type: "line", source, minzoom: group.minzoom, filter,
                    paint: { "line-color": "#000000", "line-opacity": 0.01, "line-width": 14 }
                });
                map.addLayer({
                    id: `waterways-${group.id}-casing`, type: "line", source, minzoom: group.minzoom, filter,
                    paint: {
                        "line-color": "#f7fbf8",
                        "line-width": ["interpolate", ["linear"], ["zoom"], group.minzoom, group.casing[0], 15, group.casing[1]],
                        "line-opacity": group.opacity || 0.95
                    }
                });
                map.addLayer({
                    id: `waterways-${group.id}-line`, type: "line", source, minzoom: group.minzoom, filter,
                    paint: {
                        "line-color": group.color,
                        "line-width": ["interpolate", ["linear"], ["zoom"], group.minzoom, group.core[0], 15, group.core[1]],
                        "line-opacity": group.opacity || 0.9
                    }
                });
                if (group.labelMinzoom) {
                    map.addLayer({
                        id: `waterways-${group.id}-labels`, type: "symbol", source,
                        minzoom: group.labelMinzoom,
                        filter: ["all", filter, ["!=", ["get", "display_name"], ""]],
                        layout: {
                            "symbol-placement": "line",
                            "symbol-spacing": 400,
                            "text-field": ["get", "display_name"],
                            "text-font": ["Noto Sans Regular"],
                            "text-size": ["interpolate", ["linear"], ["zoom"], group.labelMinzoom, 10, 15, 13],
                            "text-max-width": 10,
                            "text-optional": true,
                            "text-keep-upright": true
                        },
                        paint: { "text-color": group.color, "text-halo-color": "#f7fbf8", "text-halo-width": 1.4 }
                    });
                }
            });
            map.addSource("waterways-highlight-source", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] }
            });
            map.addLayer({
                id: "waterways-highlight-casing", type: "line", source: "waterways-highlight-source",
                paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 5, 15, 9] }
            });
            map.addLayer({
                id: "waterways-highlight-line", type: "line", source: "waterways-highlight-source",
                paint: { "line-color": "#e87025", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2.5, 15, 5] }
            });
        } else if (key === "places") {
            addLayer(key, {
                id: "places-water-labels", type: "symbol", source, minzoom: 11.5,
                filter: ["match", ["get", "code"], ["1010", "1011"], true, false],
                layout: {
                    "text-field": ["get", "label"], "text-font": ["Noto Sans Regular"],
                    "text-size": 11, "text-max-width": 9, "text-padding": 2, "text-optional": true
                },
                paint: { "text-color": "#176b7c", "text-halo-color": "#f7fbf8", "text-halo-width": 1.4 }
            });
            addLayer(key, {
                id: "places-detail-labels", type: "symbol", source, minzoom: 13.5,
                filter: ["match", ["get", "code"], ["1002", "1003"], true, false],
                layout: {
                    "text-field": ["get", "label"], "text-font": ["Noto Sans Regular"],
                    "text-size": 9, "text-max-width": 8, "text-padding": 2, "text-optional": true
                },
                paint: { "text-color": "#405568", "text-halo-color": "#f7fbf8", "text-halo-width": 1.2 }
            });
        }

        loadedCounts.set(key, data.features.length);
        const input = layerInputs.find(item => item.dataset.mapLayer === key);
        setLayerVisibility(key, input && !input.checked ? "none" : "visible");
        if (key === "places") updatePlaceLayerVisibility();
        attachLayerEvents(key);
    }

    function updateLoadedStatus() {
        updateMapGuidance();
    }

    async function ensureLayer(key) {
        const dataPromise = fetchLayerData(key);
        await mapReady;
        if (map.getSource(definitions[key].source)) {
            setLayerVisibility(key, "visible");
            if (!loadedCounts.has(key)) loadedCounts.set(key, 0);
            return;
        }
        if (key === "waterways") setStatus("Carico i corsi d’acqua…");
        addLayerGroup(key, await dataPromise);
        updateLoadedStatus();
    }

    function featureCenter(feature) {
        const bounds = [Infinity, Infinity, -Infinity, -Infinity];
        let count = 0;
        (function visit(value) {
            if (Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number") {
                bounds[0] = Math.min(bounds[0], value[0]);
                bounds[1] = Math.min(bounds[1], value[1]);
                bounds[2] = Math.max(bounds[2], value[0]);
                bounds[3] = Math.max(bounds[3], value[1]);
                count++;
            } else if (Array.isArray(value)) {
                value.forEach(visit);
            }
        })(feature.geometry.coordinates);
        if (!count) return null;
        return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
    }

    function fitFeature(feature) {
        const featureBounds = [Infinity, Infinity, -Infinity, -Infinity];
        let count = 0;
        (function visit(value) {
            if (Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number") {
                featureBounds[0] = Math.min(featureBounds[0], value[0]);
                featureBounds[1] = Math.min(featureBounds[1], value[1]);
                featureBounds[2] = Math.max(featureBounds[2], value[0]);
                featureBounds[3] = Math.max(featureBounds[3], value[1]);
                count++;
            } else if (Array.isArray(value)) {
                value.forEach(visit);
            }
        })(feature.geometry.coordinates);
        if (!count) return;
        const mapBounds = [[featureBounds[0], featureBounds[1]], [featureBounds[2], featureBounds[3]]];
        if (featureBounds[0] === featureBounds[2] && featureBounds[1] === featureBounds[3]) {
            map.flyTo({ center: mapBounds[0], zoom: 13, duration: 700 });
        } else {
            map.fitBounds(mapBounds, { padding: 70, maxZoom: 13, duration: 700 });
        }
    }

    function selectSearchItem(item) {
        searchInput.value = item.label;
        searchResults.hidden = true;
        searchInput.setAttribute("aria-expanded", "false");
        if (selectedMarker) selectedMarker.remove();
        selectedMarker = new maplibregl.Marker({ color: "#d46a22" })
            .setLngLat(item.center)
            .setPopup(new maplibregl.Popup({ offset: 24 }).setText(`${item.label} · risultato cartografico, non spot verificato`))
            .addTo(map);
        if (item.feature) fitFeature(item.feature);
        else map.flyTo({ center: item.center, zoom: 13, duration: 700 });
        setStatus(`Risultato cercato: ${item.label}. Non è uno spot di pesca verificato.`);
    }

    function applyPlaceLink() {
        // Collegamento futuro dagli spot: ?luogo=<id>&lat=<lat>&lon=<lon>&nome=<nome>.
        const params = new URLSearchParams(window.location.search);
        const placeId = params.get("luogo");
        const latitudeValue = params.get("lat");
        const longitudeValue = params.get("lon");
        const latitude = Number(latitudeValue);
        const longitude = Number(longitudeValue);
        if (!params.has("luogo") && !params.has("lat") && !params.has("lon")) return;

        if (!placeId || !/^[a-z0-9_-]{1,80}$/i.test(placeId)
            || !latitudeValue?.trim() || !longitudeValue?.trim()
            || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
            || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
            setStatus("Collegamento al luogo non valido: mancano un identificativo o coordinate valide.", true);
            return;
        }

        const label = (params.get("nome") || "").trim().slice(0, 100) || placeId;
        const center = [longitude, latitude];
        searchInput.value = label;
        if (selectedMarker) selectedMarker.remove();
        selectedMarker = new maplibregl.Marker({ color: "#d46a22" })
            .setLngLat(center)
            .setPopup(new maplibregl.Popup({ offset: 24 }).setText(
                `${label} · posizione indicativa; accesso e pescabilità non verificati`
            ))
            .addTo(map)
            .togglePopup();
        map.flyTo({ center, zoom: 13, duration: 700 });
        map.once("moveend", () => {
            setStatus(`Mappa centrata su ${label}. La posizione non conferma accesso o pescabilità.`);
        });
    }

    function renderSearchResults(query) {
        searchResults.replaceChildren();
        const normalized = query.trim().toLocaleLowerCase("it-IT");
        if (normalized.length < 2) {
            searchResults.hidden = true;
            searchInput.setAttribute("aria-expanded", "false");
            return;
        }
        const matches = searchIndex.filter(item => item.label.toLocaleLowerCase("it-IT").includes(normalized)).slice(0, 8);
        if (!matches.length) {
            const empty = document.createElement("li");
            empty.textContent = "Nessun comune o toponimo trovato nei dati locali.";
            empty.className = "map-search-empty";
            searchResults.append(empty);
        } else {
            matches.forEach(item => {
                const li = document.createElement("li");
                const button = document.createElement("button");
                button.type = "button";
                button.setAttribute("role", "option");
                button.textContent = item.label;
                const detail = document.createElement("small");
                detail.textContent = item.kind;
                button.append(detail);
                button.addEventListener("click", () => selectSearchItem(item));
                li.append(button);
                searchResults.append(li);
            });
        }
        searchResults.hidden = false;
        searchInput.setAttribute("aria-expanded", "true");
    }

    async function loadSearchIndex() {
        const [places, communes] = await Promise.all([fetchLayerData("places"), fetchLayerData("communes")]);
        const index = new Map();
        communes.features.forEach(feature => {
            const label = feature.properties && feature.properties.name;
            if (!label || !feature.geometry) return;
            const center = featureCenter(feature);
            if (center) index.set(`comune:${label}`, { label, kind: "Comune", center, feature });
        });
        places.features.forEach(feature => {
            const properties = feature.properties || {};
            if (!["1001", "1010", "1011"].includes(properties.code) || !properties.label) return;
            if (!feature.geometry || feature.geometry.type !== "Point") return;
            const kind = properties.code === "1001" ? "Località" : "Nome idrografico";
            const key = `${kind}:${properties.label.toLocaleLowerCase("it-IT")}`;
            if (!index.has(key)) {
                index.set(key, { label: properties.label, kind, center: feature.geometry.coordinates, feature });
            }
        });
        searchIndex = [...index.values()].sort((a, b) => a.label.localeCompare(b.label, "it"));
    }

    function renderGuideStep() {
        guideCount.textContent = `Passo ${guideStep + 1} di ${guideSteps.length}`;
        guideStepText.textContent = guideSteps[guideStep];
        guideBackButton.hidden = guideStep === 0;
        guideNextButton.textContent = guideStep === guideSteps.length - 1 ? "Inizia a esplorare" : "Avanti";
    }

    function openGuide() {
        guideStep = 0;
        guideShown = true;
        renderGuideStep();
        if (!guideDialog.open) guideDialog.showModal();
        guideNextButton.focus();
    }

    function showGuideOnFirstVisit() {
        if (guideShown) return;
        try {
            if (localStorage.getItem("pescalife-map-guide-seen") === "true") return;
        } catch (error) {
            console.warn("Impossibile leggere lo stato della guida della mappa:", error);
        }
        openGuide();
    }

    function finishGuide() {
        if (guideDialog.open) guideDialog.close();
    }

    guideOpenButton.addEventListener("click", openGuide);
    document.getElementById("map-guide-skip").addEventListener("click", finishGuide);
    guideBackButton.addEventListener("click", () => {
        if (guideStep > 0) guideStep--;
        renderGuideStep();
    });
    guideNextButton.addEventListener("click", () => {
        if (guideStep === guideSteps.length - 1) {
            finishGuide();
            return;
        }
        guideStep++;
        renderGuideStep();
    });
    guideDialog.addEventListener("cancel", event => {
        event.preventDefault();
        finishGuide();
    });
    guideDialog.addEventListener("close", () => {
        try {
            localStorage.setItem("pescalife-map-guide-seen", "true");
        } catch (error) {
            console.warn("Impossibile salvare lo stato della guida della mappa:", error);
        }
    });
    const entryDialog = document.getElementById("entry-dialog");
    if (entryDialog.hidden) {
        showGuideOnFirstVisit();
    } else {
        document.getElementById("entry-accept").addEventListener("click", () => {
            window.setTimeout(showGuideOnFirstVisit, 0);
        }, { once: true });
    }

    try {
        map = new maplibregl.Map({
            container: mapElement,
            style: mapStyles.positron,
            center: [10.83, 43.23],
            zoom: 8.5,
            minZoom: 7,
            maxZoom: 17,
            cooperativeGestures: true,
            attributionControl: { compact: false },
            locale: {
                "AttributionControl.ToggleAttribution": "Mostra le attribuzioni",
                "NavigationControl.ZoomIn": "Ingrandisci",
                "NavigationControl.ZoomOut": "Riduci",
                "NavigationControl.ResetBearing": "Ripristina l’orientamento a nord",
                "CooperativeGesturesHandler.WindowsHelpText": "Usa Ctrl e la rotellina per ingrandire la mappa",
                "CooperativeGesturesHandler.MacHelpText": "Usa ⌘ e la rotellina per ingrandire la mappa",
                "CooperativeGesturesHandler.MobileHelpText": "Usa due dita per spostare la mappa"
            }
        });
    } catch (error) {
        console.error("Impossibile inizializzare la mappa:", error);
        setStatus("Mappa non disponibile in questo browser. Verifica il supporto WebGL e ricarica la pagina.", true);
        disableMapControls();
        return;
    }

    mapReady = new Promise(resolve => map.once("style.load", resolve));
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

    map.on("click", event => {
        const hitboxLayers = ["rank1", "rank2", "rank3", "minor"]
            .map(group => `waterways-hitbox-${group}`)
            .filter(id => map.getLayer(id));
        const clickedWaterway = hitboxLayers.length
            && map.queryRenderedFeatures(event.point, { layers: hitboxLayers }).length > 0;
        if (!clickedWaterway && activePopup) {
            activePopup.remove();
            activePopup = null;
            clearWaterwayHighlight();
        }
    });
    map.on("zoomend", updateMapGuidance);

    map.on("style.load", () => {
        if (!initialStyleLoaded) {
            initialStyleLoaded = true;
            map.fitBounds(bounds, { padding: 36, maxZoom: 9.5, duration: 0 });
            const initialKeys = layerInputs.filter(input => input.checked).map(input => input.dataset.mapLayer);
            Promise.allSettled(initialKeys.map(key => ensureLayer(key))).then(results => {
                const errors = results.filter(result => result.status === "rejected")
                    .map(result => result.reason instanceof Error ? result.reason.message : String(result.reason));
                if (errors.length) {
                    console.error("Impossibile caricare alcuni livelli cartografici:", errors);
                    setStatus(`Errore nel caricamento dei dati: ${errors.join("; ")}`, true);
                } else {
                    updateMapGuidance();
                }
                applyPlaceLink();
            });
            updateLegend();
            loadSearchIndex().catch(error => {
                console.error("Impossibile preparare la ricerca locale:", error);
                setStatus(`Ricerca non disponibile: ${error.message}`, true);
            });
            return;
        }
        const enabledLayers = layerInputs
            .filter(input => input.checked)
            .map(input => input.dataset.mapLayer);
        Promise.allSettled(enabledLayers.map(async key => {
            const data = await fetchLayerData(key);
            addLayerGroup(key, data);
        })).then(results => {
            styleChangePending = false;
            styleInputs.forEach(input => { input.disabled = false; });
            layerInputs.forEach(input => { input.disabled = false; });
            const errors = results
                .filter(result => result.status === "rejected")
                .map(result => result.reason instanceof Error ? result.reason.message : String(result.reason));
            if (errors.length) {
                console.error("Impossibile ripristinare alcuni livelli cartografici:", errors);
                setStatus(`Errore nel ripristino dei livelli: ${errors.join("; ")}`, true);
                return;
            }
            updateControlSummaries();
            updateLoadedStatus();
        });
    });

    map.on("error", event => {
        if (!event.error || baseMapErrorShown) return;
        baseMapErrorShown = true;
        console.error("Errore MapLibre:", event.error);
        setStatus("Errore nel caricamento della mappa di base o nel rendering. Controlla la connessione.", true);
    });

    layerInputs.forEach(input => {
        input.addEventListener("change", () => {
            updateControlSummaries();
            const key = input.dataset.mapLayer;
            if (!input.checked) {
                setLayerVisibility(key, "none");
                if (key === "waterways" && activePopup) {
                    activePopup.remove();
                    activePopup = null;
                    clearWaterwayHighlight();
                }
                updateMapGuidance();
                return;
            }
            ensureLayer(key).catch(error => {
                console.error(`Impossibile caricare il livello ${key}:`, error);
                input.checked = false;
                updateControlSummaries();
                updateLegend();
                setStatus(`Impossibile caricare ${definitions[key].file}: ${error.message}`, true);
            });
            updateMapGuidance();
        });
    });

    styleInputs.forEach(input => {
        input.addEventListener("change", () => {
            if (!input.checked || styleChangePending) return;
            updateControlSummaries();
            styleChangePending = true;
            styleInputs.forEach(styleInput => { styleInput.disabled = true; });
            layerInputs.forEach(layerInput => { layerInput.disabled = true; });
            if (activePopup) {
                activePopup.remove();
                activePopup = null;
            }
            setStatus(`Caricamento stile ${input.value}…`);
            map.setStyle(mapStyles[input.value]);
        });
    });
    updateControlSummaries();

    searchInput.addEventListener("input", () => renderSearchResults(searchInput.value));
    searchForm.addEventListener("submit", event => {
        event.preventDefault();
        const query = searchInput.value.trim().toLocaleLowerCase("it-IT");
        if (!query) {
            searchInput.focus();
            return;
        }
        const exactMatch = searchIndex.find(item => item.label.toLocaleLowerCase("it-IT") === query);
        const firstMatch = exactMatch || searchIndex.find(item => item.label.toLocaleLowerCase("it-IT").includes(query));
        if (firstMatch) selectSearchItem(firstMatch);
        else {
            renderSearchResults(searchInput.value);
            if (searchResults.hidden) setStatus("Nessun comune o toponimo trovato nei dati locali.", true);
        }
    });
    searchInput.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            searchResults.hidden = true;
            searchInput.setAttribute("aria-expanded", "false");
        }
    });
    document.addEventListener("click", event => {
        if (!searchForm.contains(event.target)) {
            searchResults.hidden = true;
            searchInput.setAttribute("aria-expanded", "false");
        }
    });

    resetButton.addEventListener("click", () => {
        if (selectedMarker) {
            selectedMarker.remove();
            selectedMarker = null;
        }
        if (activePopup) {
            activePopup.remove();
            activePopup = null;
            clearWaterwayHighlight();
        }
        searchInput.value = "";
        map.fitBounds(bounds, { padding: 36, maxZoom: 9.5, duration: 500 });
        updateMapGuidance();
    });

    locationButton.addEventListener("click", () => {
        if (!navigator.geolocation) {
            setStatus("Questo browser non supporta la geolocalizzazione.", true);
            return;
        }
        locationButton.disabled = true;
        setStatus("Richiesta della posizione…");
        navigator.geolocation.getCurrentPosition(
            position => {
                const center = [position.coords.longitude, position.coords.latitude];
                map.flyTo({ center, zoom: 13, duration: 700 });
                if (selectedMarker) selectedMarker.remove();
                selectedMarker = new maplibregl.Marker({ color: "#287a49" })
                    .setLngLat(center)
                    .setPopup(new maplibregl.Popup({ offset: 24 }).setText("La tua posizione, rilevata su richiesta"))
                    .addTo(map);
                setStatus("Mappa centrata sulla tua posizione, che potrebbe non essere precisa al 100%. La posizione non viene salvata.");
                locationButton.disabled = false;
            },
            error => {
                const message = error.code === error.PERMISSION_DENIED
                    ? "Posizione non condivisa: autorizza la geolocalizzazione se vuoi usare questa funzione."
                    : error.code === error.POSITION_UNAVAILABLE
                        ? "Posizione non disponibile in questo momento."
                        : "Richiesta della posizione scaduta. Riprova.";
                setStatus(message, true);
                locationButton.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    });
})();
