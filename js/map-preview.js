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
        waterways: ["waterways-casing", "waterways-line"],
        places: ["places-labels", "places-water-labels", "places-detail-labels"]
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
    let map;
    let selectedMarker;
    let searchIndex = [];
    let mapReady;
    let initialStyleLoaded = false;
    let styleChangePending = false;

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle("is-error", isError);
    }

    function disableMapControls() {
        [...layerInputs, ...styleInputs, searchInput, resetButton, locationButton].forEach(input => { input.disabled = true; });
        searchForm.querySelector('button[type="submit"]').disabled = true;
    }

    function setLayerVisibility(key, visibility) {
        layerIds[key].forEach(id => {
            if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
        });
    }

    function updateControlSummaries() {
        const selectedStyle = styleInputs.find(input => input.checked);
        const styleNames = { liberty: "Liberty", bright: "Bright", positron: "Positron", terrain: "Rilievi" };
        const enabledLayers = layerInputs.filter(input => input.checked).length;
        if (selectedStyle) {
            currentControlsLabel.textContent = `${styleNames[selectedStyle.value]} · ${enabledLayers} ${enabledLayers === 1 ? "attivo" : "attivi"}`;
        }
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

    function attachLayerEvents(key) {
        const interactiveLayers = {
            waterways: [["waterways-line", "Corso d’acqua", "Elemento lineare della cartografia CTR."]],
            waterbodies: [["waterbodies-fill", "Specchio d’acqua", "Elemento areale della cartografia CTR."]],
            roads: [["roads-fill", "Viabilità", "Area viaria CTR; non è un percorso né un'indicazione di accesso."]],
            communes: [["communes-boundaries", "Confine comunale", "Confine amministrativo ISTAT generalizzato 2026."]]
        }[key] || [];

        interactiveLayers.forEach(([layerId, title, sourceDescription]) => {
            map.on("click", layerId, event => {
                const feature = event.features && event.features[0];
                if (!feature) return;
                const properties = feature.properties || {};
                const content = document.createElement("div");
                const heading = document.createElement("strong");
                heading.textContent = properties.name || properties.label || title;
                content.append(heading);
                const detail = document.createElement("p");
                detail.textContent = `${sourceDescription} La cartografia non conferma accessibilità o pescabilità.`;
                content.append(detail);
                new maplibregl.Popup({ closeButton: true, maxWidth: "300px" })
                    .setLngLat(event.lngLat)
                    .setDOMContent(content)
                    .addTo(map);
            });
            map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
            map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
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
            addLayer(key, {
                id: "waterways-casing", type: "line", source, minzoom: 10,
                paint: { "line-color": "#f7fbf8", "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1, 13, 2.6] }
            });
            addLayer(key, {
                id: "waterways-line", type: "line", source, minzoom: 10,
                paint: {
                    "line-color": "#268ea2",
                    "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.45, 13, 1.8],
                    "line-opacity": 0.9
                }
            });
        } else if (key === "places") {
            addLayer(key, {
                id: "places-labels", type: "symbol", source, minzoom: 7,
                filter: ["all", ["==", ["get", "code"], "1001"], ["match", ["get", "label"], [
                    "CECINA", "POMARANCE", "VOLTERRA", "RIPARBELLA", "BIBBONA", "GUARDISTALLO",
                    "MONTECATINI", "MONTESCUDAIO", "CASTAGNETO", "CASTELNUOVO", "LARDERELLO",
                    "PONTEGINORI", "BOLGHERI", "CANNETO", "LUSTIGNANO", "SASSA"
                ], true, false]],
                layout: {
                    "text-field": ["get", "label"], "text-font": ["Noto Sans Regular"],
                    "text-size": ["interpolate", ["linear"], ["zoom"], 8, 9, 10.5, 12, 13, 14],
                    "text-max-width": 9, "text-padding": 2, "text-optional": true
                },
                paint: { "text-color": "#233b4d", "text-halo-color": "#f7fbf8", "text-halo-width": 1.5 }
            });
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
                filter: ["==", ["get", "code"], "1003"],
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
        attachLayerEvents(key);
    }

    function updateLoadedStatus() {
        const count = [...loadedCounts.values()].reduce((sum, value) => sum + value, 0);
        setStatus(`${loadedCounts.size} livelli caricati · ${count.toLocaleString("it-IT")} elementi cartografici`);
    }

    async function ensureLayer(key) {
        await mapReady;
        if (map.getSource(definitions[key].source)) {
            setLayerVisibility(key, "visible");
            return;
        }
        addLayerGroup(key, await fetchLayerData(key));
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

    try {
        map = new maplibregl.Map({
            container: mapElement,
            style: mapStyles.liberty,
            center: [10.83, 43.23],
            zoom: 8.5,
            minZoom: 7,
            maxZoom: 17,
            cooperativeGestures: true,
            attributionControl: { compact: false }
        });
    } catch (error) {
        console.error("Impossibile inizializzare la mappa:", error);
        setStatus("Mappa non disponibile in questo browser. Verifica il supporto WebGL e ricarica la pagina.", true);
        disableMapControls();
        return;
    }

    mapReady = new Promise(resolve => map.once("load", resolve));
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

    map.on("load", () => {
        map.fitBounds(bounds, { padding: 36, maxZoom: 9.5, duration: 0 });
        const initialKeys = layerInputs.filter(input => input.checked).map(input => input.dataset.mapLayer);
        Promise.allSettled(initialKeys.map(key => ensureLayer(key))).then(results => {
            const errors = results.filter(result => result.status === "rejected")
                .map(result => result.reason instanceof Error ? result.reason.message : String(result.reason));
            if (errors.length) {
                console.error("Impossibile caricare alcuni livelli cartografici:", errors);
                setStatus(`Errore nel caricamento dei dati: ${errors.join("; ")}`, true);
            }
        });
        loadSearchIndex().catch(error => {
            console.error("Impossibile preparare la ricerca locale:", error);
            setStatus(`Ricerca non disponibile: ${error.message}`, true);
        });
    });

    map.on("style.load", () => {
        if (!initialStyleLoaded) {
            initialStyleLoaded = true;
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
            const errors = results
                .filter(result => result.status === "rejected")
                .map(result => result.reason instanceof Error ? result.reason.message : String(result.reason));
            if (errors.length) {
                console.error("Impossibile ripristinare alcuni livelli cartografici:", errors);
                setStatus(`Errore nel ripristino dei livelli: ${errors.join("; ")}`, true);
                return;
            }
            updateLoadedStatus();
        });
    });

    map.on("error", event => {
        if (!event.error) return;
        console.error("Errore MapLibre:", event.error);
        setStatus("Errore nel caricamento della mappa di base o nel rendering. Controlla la connessione.", true);
    });

    layerInputs.forEach(input => {
        input.addEventListener("change", () => {
            updateControlSummaries();
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

    styleInputs.forEach(input => {
        input.addEventListener("change", () => {
            if (!input.checked || styleChangePending) return;
            updateControlSummaries();
            styleChangePending = true;
            styleInputs.forEach(styleInput => { styleInput.disabled = true; });
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
        searchInput.value = "";
        map.fitBounds(bounds, { padding: 36, maxZoom: 9.5, duration: 500 });
        setStatus(`${loadedCounts.size} livelli caricati · mappa centrata sulla Val di Cecina`);
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
                setStatus("Mappa centrata sulla tua posizione. La posizione non viene salvata.");
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
