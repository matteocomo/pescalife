(() => {
    "use strict";

    const CONSULTED_AT = "2026-11-09";
    const SOURCES = Object.freeze({
        hydrography: {
            label: "Reticolo idrografico regionale",
            url: "https://www.regione.toscana.it/-/reticolo-idrografico-e-di-gestione"
        },
        spawning2018: {
            label: "Tabella regionale delle zone di frega, aprile 2018",
            url: "https://www.regione.toscana.it/documents/10180/13712152/TABELLA+ZdF+aprile+2018.pdf/b4bf78a7-5f99-4809-94ab-3541b6d425ef"
        },
        spawningList: {
            label: "Elenco regionale delle zone di frega",
            url: "https://www.regione.toscana.it/-/elenco-delle-zone-di-frega-nei-corsi-d-acqua-della-regione-toscana"
        },
        protectedZones: {
            label: "Elenco regionale delle zone di protezione",
            url: "https://www.regione.toscana.it/-/elenco-delle-zone-di-protezione-nei-corsi-d-acqua-e-laghi-regionali"
        },
        fishingZones: {
            label: "Elenco regionale delle zone a regolamento specifico",
            url: "https://www.regione.toscana.it/it/-/pesca-elenco-zone-a-regolamento-specifico"
        },
        berignone: {
            label: "Scheda regionale della Riserva Foresta di Berignone",
            url: "https://www.regione.toscana.it/documents/10180/14438685/Riserva_Naturale_Regionale_Foresta_Berignone_PI.pdf/85e79610-d549-47f7-998f-a02e8b0b3655"
        }
    });

    const WATER_BODIES = Object.freeze([
        {
            id: "fiume-cecina",
            name: "Fiume Cecina",
            category: "Fiume",
            municipalities: ["Cecina", "Castelnuovo Val di Cecina", "Pomarance"],
            description: "Le zone di frega censite riguardano soltanto i tratti delimitati qui sotto; non si estendono all'intero corso.",
            status: "DA VERIFICARE",
            classification: "D",
            coordinate: null,
            sourceIds: ["hydrography"],
            spawningZones: [
                {
                    id: "cecina-cecina-acquerta",
                    waterBodyId: "fiume-cecina",
                    name: "Dal confine provinciale alla confluenza con il Fosso Acquerta",
                    municipalities: ["Cecina"],
                    limitationType: "Divieto di pesca per zona di frega",
                    startDate: "05-15",
                    endDate: "06-30",
                    period: "Dal 15 maggio al 30 giugno.",
                    species: "Ciprinidi",
                    status: "VERIFICATO CON RISERVA",
                    classification: "B",
                    sourceIds: ["spawning2018", "spawningList"],
                    consultedAt: CONSULTED_AT
                },
                {
                    id: "cecina-pavone-possera",
                    waterBodyId: "fiume-cecina",
                    name: "Tra la Bocca del Torrente Pavone e la Bocca del Torrente Possera",
                    municipalities: ["Castelnuovo Val di Cecina", "Pomarance"],
                    limitationType: "Divieto di pesca per zona di frega",
                    startDate: "05-14",
                    endDate: "06-15",
                    startBoundary: "Dall'ora successiva al tramonto del 14 maggio.",
                    endBoundary: "Fino all'ora precedente all'alba del 15 giugno.",
                    period: "Dall'ora successiva al tramonto del 14 maggio all'ora precedente all'alba del 15 giugno.",
                    species: "Ciprinidi",
                    status: "VERIFICATO CON RISERVA",
                    classification: "B",
                    sourceIds: ["spawning2018", "spawningList"],
                    consultedAt: CONSULTED_AT
                }
            ]
        },
        {
            id: "torrente-pavone",
            name: "Torrente Pavone",
            category: "Torrente",
            municipalities: ["Castelnuovo Val di Cecina"],
            description: "La zona di frega censita riguarda soltanto il tratto delimitato qui sotto.",
            status: "DA VERIFICARE",
            classification: "D",
            coordinate: null,
            sourceIds: ["hydrography"],
            spawningZones: [
                {
                    id: "pavone-foce-monna",
                    waterBodyId: "torrente-pavone",
                    name: "Tra la foce nel Fiume Cecina e il podere Monna",
                    municipalities: ["Castelnuovo Val di Cecina"],
                    limitationType: "Divieto di pesca per zona di frega",
                    startDate: "01-01",
                    endDate: null,
                    startBoundary: "Dal 1 gennaio.",
                    endBoundary: "Fino all'ultima domenica di febbraio.",
                    period: "Dal 1 gennaio all'ultima domenica di febbraio.",
                    species: "Ciprinidi",
                    status: "VERIFICATO CON RISERVA",
                    classification: "B",
                    sourceIds: ["spawning2018", "spawningList"],
                    consultedAt: CONSULTED_AT
                }
            ]
        },
        {
            id: "torrente-sterza",
            name: "Torrente Sterza",
            category: "Torrente",
            municipalities: [],
            description: "Comune/i e tratti di interesse per la pesca da individuare.",
            status: "DA VERIFICARE",
            classification: "D",
            coordinate: null,
            sourceIds: ["hydrography"],
            spawningZones: []
        },
        {
            id: "torrente-acquerta",
            name: "Torrente Acquerta",
            category: "Torrente",
            municipalities: [],
            description: "Citato come limite della zona di frega sul Cecina; il divieto indicato si riferisce al tratto del Cecina, non all'intero Acquerta.",
            status: "DA VERIFICARE",
            classification: "D",
            coordinate: null,
            sourceIds: ["hydrography"],
            spawningZones: []
        },
        {
            id: "fosso-linaglia",
            name: "Fosso Linaglia",
            category: "Fosso",
            municipalities: [],
            description: "Tratto e comuni di interesse per la pesca da individuare.",
            status: "DA VERIFICARE",
            classification: "D",
            coordinate: null,
            sourceIds: ["hydrography"],
            spawningZones: []
        },
        {
            id: "torrente-fosci",
            name: "Torrente Fosci",
            category: "Corso d'acqua nell'area della riserva",
            municipalities: ["Volterra", "Pomarance"],
            description: "Registrato come elemento territoriale per approfondimenti; non è presentato come luogo di pesca verificato.",
            status: "DA VERIFICARE",
            classification: "D",
            coordinate: null,
            recordOnly: true,
            sourceIds: ["hydrography"],
            spawningZones: []
        },
        {
            id: "torrente-sellate",
            name: "Torrente Sellate",
            category: "Corso d'acqua nell'area della riserva",
            municipalities: ["Volterra", "Pomarance"],
            description: "Registrato come elemento territoriale per approfondimenti; non è presentato come luogo di pesca verificato.",
            status: "DA VERIFICARE",
            classification: "D",
            coordinate: null,
            recordOnly: true,
            sourceIds: ["hydrography"],
            spawningZones: []
        }
    ]);

    const PROTECTED_AREA = Object.freeze({
        id: "riserva-foresta-berignone",
        name: "Riserva naturale Foresta di Berignone",
        type: "Riserva naturale regionale",
        municipalities: ["Volterra", "Pomarance"],
        areaHectares: 2166,
        establishedBy: "D.C.P. Pisa n. 310 del 28 novembre 1997",
        regulation: "Regolamento approvato con D.C.P. n. 21 del 19 febbraio 2002; testo integrale non reperito.",
        waterBodyIds: ["fiume-cecina", "torrente-pavone", "torrente-fosci", "torrente-sellate"],
        natura2000: [
            "IT5170006 – Macchia di Tatti–Berignone",
            "IT5170007 – Fiume Cecina da Berignone a Ponteginori",
            "IT5170101 – Valle del Pavone e Rocca Sillana"
        ],
        status: "DA VERIFICARE",
        classification: "D",
        sourceId: "berignone"
    });

    const byId = id => document.getElementById(id);

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function addField(parent, label, value) {
        if (!value) return;
        const paragraph = element("p");
        const strong = element("strong", "", `${label}: `);
        paragraph.append(strong, document.createTextNode(value));
        parent.append(paragraph);
    }

    function formatRecurringDate(value) {
        if (!value) return null;
        const [month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(2024, month - 1, day));
        return new Intl.DateTimeFormat("it-IT", {
            day: "numeric",
            month: "long",
            timeZone: "UTC"
        }).format(date);
    }

    function addSourceLinks(parent, sourceIds) {
        const list = element("ul", "norm-source-list");
        for (const id of sourceIds) {
            const source = SOURCES[id];
            if (!source) continue;
            const item = element("li");
            const link = element("a", "", source.label);
            link.href = source.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            item.append(link);
            list.append(item);
        }
        parent.append(list);
    }

    function addSpawningZone(parent, zone) {
        const item = element("article", "water-zone norm-fact");
        const title = element("h4", "", zone.name);
        const status = element("span", "norm-status caution", `${zone.classification} – Pescabilità con limitazioni · ${zone.status}`);
        item.append(title, status);
        addField(item, "Limitazione", zone.limitationType);
        addField(item, "Comune", zone.municipalities.join(", "));
        addField(item, "Specie interessate", zone.species);
        addField(item, "Periodo originale del divieto", zone.period);
        addField(item, "Stato della verifica", zone.status);
        addField(item, "Data di consultazione delle fonti", zone.consultedAt);
        const detailsElement = element("details", "water-period-details");
        const summary = element("summary", "", "Dettagli del periodo");
        const normalizedDates = element("div", "water-zone-facts");
        addField(normalizedDates, "Data iniziale (ricorrente)", zone.startBoundary
            ? `${formatRecurringDate(zone.startDate)} — ${zone.startBoundary}`
            : formatRecurringDate(zone.startDate));
        addField(normalizedDates, "Data finale (ricorrente)", zone.endBoundary
            ? `${formatRecurringDate(zone.endDate)} — ${zone.endBoundary}`
            : formatRecurringDate(zone.endDate) || zone.endBoundary);
        detailsElement.append(summary, normalizedDates);
        item.append(detailsElement);
        const caveat = element(
            "p",
            "norm-important",
            "La zona è riportata nell'allegato regionale 2018. La pagina regionale consultata supporta il riferimento, ma non è disponibile una conferma formale aggiornata al 2026. Non sono state aggiunte deroghe per il siluro."
        );
        item.append(caveat);
        addSourceLinks(item, zone.sourceIds);
        parent.append(item);
    }

    function renderWaterBody(body) {
        const details = element("details", "water-body");
        const summary = element("summary", "water-body-summary");
        const title = element("span", "water-body-title", body.name);
        title.setAttribute("role", "heading");
        title.setAttribute("aria-level", "3");
        const status = element("span", "norm-status missing", `${body.classification} – ${body.status}`);
        summary.append(title, status);
        details.append(summary);

        const content = element("div", "water-body-content");
        addField(content, "Categoria", body.category);
        addField(content, "Comuni documentati nei dati disponibili", body.municipalities.join(", ") || "Da verificare");
        addField(content, "Coordinate", body.coordinate ? `${body.coordinate.latitude}, ${body.coordinate.longitude}` : "Non inserite: nessuna coordinata verificata");
        content.append(element("p", "", body.description));

        if (body.spawningZones.length) {
            const heading = element("h3", "", "Tratti con zona di frega documentata");
            const zoneList = element("div", "water-zone-list");
            content.append(heading);
            body.spawningZones.forEach(zone => addSpawningZone(zoneList, zone));
            content.append(zoneList);
        }

        addSourceLinks(content, body.sourceIds);
        details.append(content);
        return details;
    }

    function renderProtectedArea() {
        const area = PROTECTED_AREA;
        const article = element("article", "water-protected-area");
        const heading = element("h4", "", area.name);
        article.append(heading, element("span", "norm-status missing", `${area.classification} – ${area.status}`));
        addField(article, "Tipologia", area.type);
        addField(article, "Comuni", area.municipalities.join(", "));
        addField(article, "Superficie riportata", `${area.areaHectares.toLocaleString("it-IT")} ettari`);
        addField(article, "Istituzione", area.establishedBy);
        addField(article, "Regolamento", area.regulation);
        addField(article, "Corsi d'acqua citati", area.waterBodyIds
            .map(id => WATER_BODIES.find(body => body.id === id)?.name)
            .filter(Boolean)
            .join(", "));
        addField(article, "Siti Natura 2000", area.natura2000.join("; "));
        article.append(element(
            "p",
            "norm-important",
            "Non sono attribuiti divieti di pesca non documentati e i tratti interni alla riserva non sono dichiarati pescabili. Per IT5170007 sono segnalate misure ambientali su ripopolamenti ittici, continuità fluviale, vegetazione ripariale e parcheggi/accessi presso il Masso delle Fanciulle e il guado di Molino di Berignone; verifica rispetto alla D.G.R. Toscana n. 1009 del 21 luglio 2025 non conclusa."
        ));
        addSourceLinks(article, [area.sourceId]);
        return article;
    }

    function renderCatalog() {
        const container = byId("water-catalog-content");
        if (!container) return;

        const streams = element("div", "water-body-list");
        const primaryBodies = WATER_BODIES.filter(body => !body.recordOnly);
        primaryBodies.forEach(body => streams.append(renderWaterBody(body)));
        container.append(streams);

        const futureRecords = WATER_BODIES.filter(body => body.recordOnly);
        const futureSection = element("section", "water-future-records");
        futureSection.append(
            element("h3", "", "Corsi d'acqua della riserva registrati per approfondimenti"),
            element("p", "", "Fosci e Sellate sono riferimenti territoriali in stato D, non luoghi di pesca verificati.")
        );
        const futureList = element("div", "water-body-list");
        futureRecords.forEach(body => futureList.append(renderWaterBody(body)));
        futureSection.append(futureList);
        container.append(futureSection);

        const legalNote = element(
            "div",
            "norm-important",
            "Negli elenchi regionali consultati non sono state individuate zone di protezione o ZRS riferite agli elementi esaminati. La verifica di ordinanze, concessioni, diritti esclusivi e ulteriori limitazioni locali non è conclusa: l'assenza negli elenchi non autorizza la pesca."
        );
        addSourceLinks(legalNote, ["protectedZones", "fishingZones"]);
        container.append(legalNote);

        const protectedSection = element("section", "water-protected-section");
        protectedSection.append(element("h3", "", "Area protetta"));
        protectedSection.append(renderProtectedArea());
        container.append(protectedSection);
    }

    document.addEventListener("DOMContentLoaded", renderCatalog, { once: true });
})();
