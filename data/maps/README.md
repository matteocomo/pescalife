# Dati cartografici PescaLife

Questi file alimentano la mappa delle acque interne in `mappa-nuova.html`, raggiungibile da `luoghi.html`. Sono dati cartografici di riferimento, non un inventario di luoghi pescabili, accessi, parcheggi o postazioni.

## Layer

| File | Contenuto | Fonte e versione | Limiti principali |
|---|---|---|---|
| `hydrography.geojson` | Idrografia lineare | Regione Toscana, CTR 1:10.000, edizioni selezionate con volo/edizione 2010 | Non è il reticolo vigente D.C.R. 24/2025; alcune geometrie non hanno un nome leggibile. |
| `water-bodies.geojson` | Idrografia areale e specchi d'acqua | Regione Toscana, CTR 1:10.000, edizioni selezionate con volo/edizione 2010 | La presenza di un poligono non prova che si tratti di un bacino accessibile o pescabile. |
| `roads.geojson` | Aree viarie CTR | Regione Toscana, CTR 1:10.000, edizioni selezionate con volo/edizione 2010 | Sono poligoni, non un grafo stradale; non calcolano percorsi né attestano accessi. |
| `place-labels.geojson` | Toponimi e nomi di elementi idrografici | Regione Toscana, CTR 1:10.000, edizioni selezionate con volo/edizione 2010 | Etichette puntuali; non tutte le denominazioni composte sono rappresentate come un'unica stringa. |
| `communes.geojson` | Confini amministrativi di 18 comuni | ISTAT, limiti generalizzati al 1° gennaio 2026 | Non rappresenta il bacino idrografico; la generalizzazione non è adatta a delimitazioni catastali. |

I dati CTR derivano da 42 sezioni pertinenti all'area di lavoro, trasformate da EPSG:6707 a WGS84 (EPSG:4326) e ritagliate alla selezione dei 18 comuni con un buffer. Le geometrie sono state selezionate dai layer CTR `LIG`, `LMF`, `AIG`, `ASA`, `AVI` e `TTP`; i toponimi altimetrici e le etichette stradali non utili alla lettura sono stati esclusi dal layer dei nomi. I confini comunali sono una selezione amministrativa distinta dal perimetro del bacino.

I conteggi, le dimensioni, la data di acquisizione e gli hash SHA-256 dei file distribuiti sono registrati in [`dataset-registry.csv`](./dataset-registry.csv).

## Fonti e licenze

- Regione Toscana, [Cartografia Tecnica Regionale](https://www.regione.toscana.it/cartografia-tecnica-regionale) e [Geoscopio](https://www.regione.toscana.it/-/geoscopio-wms). Le fonti esaminate riportano indicazioni non concordi: la pagina/risposta di download indica **CC BY 3.0 Italia**, mentre i PDF presenti negli archivi indicano **CC BY 4.0**. La licenza applicabile a queste edizioni deve essere confermata dalla Regione prima della distribuzione o della pubblicazione dei layer.
- ISTAT, [Confini delle unità amministrative](https://www.istat.it/it/archivio/222527), limiti al 1° gennaio 2026. Il pacchetto generalizzato acquisito non include una licenza specifica; verificare le condizioni di riuso ISTAT prima della pubblicazione.
- MapLibre GL JS 6.17.0 è caricato come modulo dalla CDN di unpkg. I glifi tipografici delle etichette sono richiesti a [OpenFreeMap](https://openfreemap.org/). I dati tematici sono locali; le mappe di base sono caricate dai servizi esterni indicati sotto.

### Mappa `mappa-nuova.html`

La mappa offre tre stili vettoriali di [OpenFreeMap](https://openfreemap.org/quick_start/) (Liberty, Bright e Positron) e una mappa topografica di [OpenTopoMap](https://www.opentopomap.org/about#verwendung). Le attribuzioni fornite dai servizi sono mostrate sulla mappa. Per la pubblicazione, rispettare le condizioni d'uso e i limiti dei rispettivi servizi e verificare la compatibilità della licenza CC BY-SA di OpenTopoMap con il prodotto finale. La modalità satellitare non è inclusa finché non viene individuato un servizio e una licenza adatti.

La ricerca usa i GeoJSON locali e non invia il testo cercato a un geocoder. Se l'utente sceglie la geolocalizzazione, la posizione è richiesta dal browser su sua iniziativa e non viene salvata da PescaLife; il caricamento delle tessere sull'area risultante comporta comunque richieste ai servizi cartografici esterni.

Il reticolo ufficiale regionale approvato con D.C.R. 24/2025 non è incluso in questi layer: la trasformazione da EPSG:3003 non è stata validata per l'uso web. Non usare la CTR come sostituto della rete aggiornata.

## Avvertenze d'uso

- Le geometrie CTR descrivono la cartografia dell'edizione indicata e possono non riflettere le condizioni attuali.
- La presenza di un corso d'acqua o di uno specchio d'acqua non prova accessibilità, diritto di accesso, pescabilità o presenza di specie.
- I confini ISTAT sono amministrativi; non vanno interpretati come confini idrografici.
- Non usare questi dati per indicare coordinate precise di accessi o postazioni.
- Prima di pubblicare i layer, chiarire le licenze CTR e ISTAT con gli enti titolari.
