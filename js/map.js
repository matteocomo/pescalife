(async () => {
    const mapElement = document.getElementById("water-map");
    if (!mapElement) return;

    const status = document.getElementById("map-status");
    const resetButton = document.getElementById("map-reset");
    const checkboxes = [...document.querySelectorAll("[data-map-layer]")];
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
        waterways: ["waterways-casing", "waterways-line"],
        places: ["places-labels", "places-water-labels", "places-detail-labels"]
    };
    const dataPromises = new Map();
    const loadedCounts = new Map();
    const bounds = [[10.462678, 42.958743], [11.199693, 43.497429]];
    let map;
    let mapReady;

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle("is-error", isError);
    }

    function disableMapControls() {
        checkboxes.forEach(input => { input.disabled = true; });
        resetButton.disabled = true;
    }

    function setLayerVisibility(key, visibility) {
        layerIds[key].forEach(id => {
            if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
        });
    }

    let maplibregl;
    try {
        maplibregl = await import("https://unpkg.com/maplibre-gl@6.17.0/dist/maplibre-gl.mjs");
    } catch (error) {
        console.error("Impossibile caricare MapLibre GL JS:", error);
        setStatus("La mappa non è disponibile perché non è stato possibile caricare MapLibre GL JS. Controlla la connessione e ricarica la pagina.", true);
        disableMapControls();
        return;
    }

    function fetchLayerData(key) {
        if (dataPromises.has(key)) return dataPromises.get(key);
        const definition = definitions[key];
        const promise = fetch(new URL(`data/maps/${definition.file}`, document.baseURI))
            .then(response => {
                if (!response.ok) throw new Error(`${definition.file}: HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
                    throw new Error(`${definition.file}: formato GeoJSON non valido`);
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
            waterbodies: ["roads-fill", "communes-boundaries", "waterways-casing", "waterways-line", "places-labels", "places-water-labels", "places-detail-labels"],
            roads: ["communes-boundaries", "waterways-casing", "waterways-line", "places-labels", "places-water-labels", "places-detail-labels"],
            communes: ["waterways-casing", "waterways-line", "places-labels", "places-water-labels", "places-detail-labels"],
            waterways: ["places-labels", "places-water-labels", "places-detail-labels"],
            places: []
        };
        return ordered[key].find(id => map.getLayer(id));
    }

    function addLayer(key, layer) {
        const before = nextLayerFor(key);
        if (before) map.addLayer(layer, before);
        else map.addLayer(layer);
    }

    function addLayerGroup(key, data) {
        const { source } = definitions[key];
        if (map.getSource(source)) return;
        map.addSource(source, { type: "geojson", data });

        if (key === "waterbodies") {
            addLayer(key, {
                id: "waterbodies-fill",
                type: "fill",
                source,
                paint: { "fill-color": "#75c5d2", "fill-opacity": 0.72 }
            });
            addLayer(key, {
                id: "waterbodies-outline",
                type: "line",
                source,
                paint: { "line-color": "#368fa0", "line-width": 0.8, "line-opacity": 0.8 }
            });
        } else if (key === "roads") {
            addLayer(key, {
                id: "roads-fill",
                type: "fill",
                source,
                paint: { "fill-color": "#89999b", "fill-opacity": 0.55 }
            });
        } else if (key === "communes") {
            addLayer(key, {
                id: "communes-boundaries",
                type: "line",
                source,
                paint: {
                    "line-color": "#446a79",
                    "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.6, 12, 1.3],
                    "line-opacity": 0.65,
                    "line-dasharray": [2, 1.5]
                }
            });
        } else if (key === "waterways") {
            addLayer(key, {
                id: "waterways-casing",
                type: "line",
                source,
                paint: {
                    "line-color": "#f7fbf8",
                    "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1, 13, 2.6]
                }
            });
            addLayer(key, {
                id: "waterways-line",
                type: "line",
                source,
                paint: {
                    "line-color": "#268ea2",
                    "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.45, 13, 1.8],
                    "line-opacity": 0.9
                }
            });
        } else if (key === "places") {
            addLayer(key, {
                id: "places-labels",
                type: "symbol",
                source,
                minzoom: 7,
                filter: [
                    "all",
                    ["==", ["get", "code"], "1001"],
                    ["match", ["get", "label"], [
                        "CECINA", "POMARANCE", "VOLTERRA", "RIPARBELLA", "BIBBONA",
                        "GUARDISTALLO", "MONTECATINI", "MONTESCUDAIO", "CASTAGNETO",
                        "CASTELNUOVO", "LARDERELLO", "PONTEGINORI", "BOLGHERI",
                        "CANNETO", "LUSTIGNANO", "SASSA"
                    ], true, false]
                ],
                layout: {
                    "text-field": ["get", "label"],
                    "text-font": ["Noto Sans Regular"],
                    "text-size": ["interpolate", ["linear"], ["zoom"], 8, 9, 10.5, 12, 13, 14],
                    "text-max-width": 9,
                    "text-padding": 2,
                    "text-optional": true,
                    "symbol-sort-key": [
                        "match", ["get", "code"],
                        "1001", 0, "1002", 1, "1010", 2, "1011", 2, 4
                    ]
                },
                paint: {
                    "text-color": "#233b4d",
                    "text-halo-color": "#f7fbf8",
                    "text-halo-width": 1.5
                }
            });
            addLayer(key, {
                id: "places-water-labels",
                type: "symbol",
                source,
                minzoom: 11.5,
                filter: ["match", ["get", "code"], ["1010", "1011"], true, false],
                layout: {
                    "text-field": ["get", "label"],
                    "text-font": ["Noto Sans Regular"],
                    "text-size": 11,
                    "text-max-width": 9,
                    "text-padding": 2,
                    "text-optional": true
                },
                paint: {
                    "text-color": "#176b7c",
                    "text-halo-color": "#f7fbf8",
                    "text-halo-width": 1.4
                }
            });
            addLayer(key, {
                id: "places-detail-labels",
                type: "symbol",
                source,
                minzoom: 13.5,
                filter: ["==", ["get", "code"], "1003"],
                layout: {
                    "text-field": ["get", "label"],
                    "text-font": ["Noto Sans Regular"],
                    "text-size": 9,
                    "text-max-width": 8,
                    "text-padding": 2,
                    "text-optional": true
                },
                paint: {
                    "text-color": "#405568",
                    "text-halo-color": "#f7fbf8",
                    "text-halo-width": 1.2
                }
            });
        }

        loadedCounts.set(key, data.features.length);
        const checkbox = checkboxes.find(input => input.dataset.mapLayer === key);
        const visibility = checkbox && !checkbox.checked ? "none" : "visible";
        setLayerVisibility(key, visibility);
        attachLayerEvents(key);
    }

    function attachLayerEvents(key) {
        const interactiveLayers = {
            waterways: [["waterways-line", "Corso d’acqua", "Elemento lineare della cartografia CTR."]],
            waterbodies: [["waterbodies-fill", "Specchio d’acqua", "Elemento areale della cartografia CTR."]],
            roads: [["roads-fill", "Viabilità", "Area viaria CTR; non è un percorso né un'indicazione di accesso."]],
            communes: [["communes-boundaries", "Confine comunale", "Confine amministrativo ISTAT generalizzato 2026."]]
        }[key] || [];

        interactiveLayers.forEach(([layerId, title, sourceDescription]) => {
            map.on("click", layerId, event => showFeaturePopup(event, title, sourceDescription));
            map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
            map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
        });
    }

    async function ensureLayer(key) {
        await mapReady;
        if (map.getSource(definitions[key].source)) {
            setLayerVisibility(key, "visible");
            return;
        }
        const data = await fetchLayerData(key);
        addLayerGroup(key, data);
        updateLoadedStatus();
    }

    function updateLoadedStatus() {
        const count = [...loadedCounts.values()].reduce((sum, value) => sum + value, 0);
        const loadedLayers = loadedCounts.size;
        setStatus(`${loadedLayers} livelli caricati · ${count.toLocaleString("it-IT")} elementi cartografici`);
    }

    function showFeaturePopup(event, title, sourceDescription) {
        const feature = event.features && event.features[0];
        if (!feature) return;
        const properties = feature.properties || {};
        const popupContent = document.createElement("div");
        const heading = document.createElement("strong");
        heading.className = "map-popup-title";
        heading.textContent = properties.name || properties.label || title;
        popupContent.append(heading);

        const detail = document.createElement("p");
        detail.textContent = sourceDescription;
        popupContent.append(detail);

        if (properties.section || properties.edition) {
            const provenance = document.createElement("p");
            provenance.textContent = `CTR 1:10.000${properties.edition ? ` · edizione ${properties.edition}` : ""}${properties.section ? ` · sezione ${properties.section}` : ""}`;
            popupContent.append(provenance);
        }

        const caution = document.createElement("p");
        caution.textContent = "La cartografia non conferma accessibilità o pescabilità.";
        popupContent.append(caution);

        new maplibregl.Popup({ closeButton: true, maxWidth: "300px" })
            .setLngLat(event.lngLat)
            .setDOMContent(popupContent)
            .addTo(map);
    }

    try {
        map = new maplibregl.Map({
            container: mapElement,
            style: {
                version: 8,
                glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
                sources: {},
                layers: [{ id: "background", type: "background", paint: { "background-color": "#edf4ef" } }]
            },
            center: [10.83, 43.23],
            zoom: 8.5,
            minZoom: 7,
            maxZoom: 17,
            cooperativeGestures: true,
            attributionControl: true
        });
    } catch (error) {
        console.error("Impossibile inizializzare la mappa:", error);
        setStatus("La mappa non può essere inizializzata in questo browser. Verifica il supporto WebGL e ricarica la pagina.", true);
        disableMapControls();
        return;
    }
    mapReady = new Promise(resolve => map.once("load", resolve));
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

    map.on("load", () => {
        map.fitBounds(bounds, { padding: 36, maxZoom: 9.5, duration: 0 });
        const initialKeys = checkboxes.filter(input => input.checked).map(input => input.dataset.mapLayer);
        Promise.allSettled(initialKeys.map(key => ensureLayer(key))).then(results => {
            const errors = results
                .filter(result => result.status === "rejected")
                .map(result => result.reason instanceof Error ? result.reason.message : String(result.reason));
            if (errors.length) {
                console.error("Impossibile caricare alcuni livelli cartografici:", errors);
                setStatus(`Errore nel caricamento dei dati: ${errors.join("; ")}`, true);
            }
        });
    });
    map.on("error", event => {
        if (!event.error) return;
        console.error("Errore MapLibre:", event.error);
        setStatus("Si è verificato un errore nel rendering della mappa. Ricarica la pagina o controlla la connessione.", true);
    });

    checkboxes.forEach(input => {
        input.addEventListener("change", () => {
            const key = input.dataset.mapLayer;
            if (!input.checked) {
                setLayerVisibility(key, "none");
                return;
            }
            ensureLayer(key).catch(error => {
                console.error(`Impossibile caricare il livello ${key}:`, error);
                input.checked = false;
                setStatus(`Impossibile caricare ${definitions[key].file}: ${error.message}`, true);
            });
        });
    });

    resetButton.addEventListener("click", () => {
        map.fitBounds(bounds, { padding: 36, maxZoom: 9.5, duration: 500 });
    });
})();
