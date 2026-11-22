(() => {
    function getCardSlug(card) {
        const link = card.querySelector(".species-card-body a[href]");
        if (!link) return null;
        return link.getAttribute("href").split("/").pop().replace(/\.html$/, "");
    }

    document.querySelectorAll(".species-card > .luogo-photo").forEach(placeholder => {
        const card = placeholder.closest(".species-card");
        const link = card.querySelector(".species-card-body a[href]");
        const name = card.querySelector(".species-card-body h3");
        if (!link || !name) return;

        const slug = getCardSlug(card);
        const photo = window.SPECIES_PHOTOS?.[slug];
        const fileName = photo?.file || `assets/specie/${link.getAttribute("href").split("/").pop().replace(/\.html$/, ".avif")}`;
        const image = new Image();
        image.alt = photo?.alt || name.textContent;
        image.onload = () => {
            placeholder.removeAttribute("role");
            placeholder.removeAttribute("aria-label");
            placeholder.querySelector("span").hidden = true;
            placeholder.append(image);
        };
        image.onerror = () => {
            image.remove();
        };
        image.src = fileName.startsWith("assets/") ? fileName : `assets/specie/${fileName}`;
    });

    const filter = document.getElementById("species-filter");
    const habitatOptions = document.getElementById("species-habitat-options");
    const originOptions = document.getElementById("species-origin-options");
    const currentLabel = document.getElementById("species-filter-current");
    const status = document.getElementById("species-filter-status");
    const groups = [...document.querySelectorAll(".species-group")];
    if (!filter || !habitatOptions || !originOptions || !currentLabel || !status || !groups.length) return;

    const searchForm = document.getElementById("species-search");
    const searchInput = document.getElementById("species-query");
    const searchClear = document.getElementById("species-search-clear");
    const searchReset = document.getElementById("species-search-reset");
    const searchEmpty = document.getElementById("species-search-empty");

    const habitats = [
        ["", "Tutti gli ambienti"],
        ["pianura", "Pianura e fondovalle"],
        ["montane", "Montane e torrentizie"],
        ["salmastre", "Acque salmastre"]
    ];
    const origins = [
        ["", "Tutte le origini"],
        ["autoctona", "Autoctone"],
        ["alloctona", "Alloctone"],
        ["da-verificare", "Presenza da verificare"],
        ["da-definire", "Identificazione da definire"],
        ["non-indicata", "Origine non indicata"]
    ];
    const synonyms = {
        branzino: "spigola",
        muggine: "cefalo",
        black: "persico",
        bass: "trota",
        trote: "trota",
        carpe: "carpa",
        barbi: "barbo",
        lucci: "luccio",
        anguille: "anguilla",
        alborelle: "alborella",
        tinche: "tinca",
        cavedani: "cavedano"
    };

    const normalize = value => String(value ?? "")
        .toLocaleLowerCase("it")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const getTerms = value => [...new Set(normalize(value).split(" ").filter(Boolean)
        .map(term => synonyms[term] || term))];

    // Ogni scheda viene indicizzata su nome comune, nome scientifico, descrizione
    // e titolo del gruppo, così la ricerca libera resta combinabile con i filtri.
    const searchableCards = groups.flatMap(group => [...group.querySelectorAll(".species-card")].map(card => {
        const title = card.querySelector(".species-card-body h3");
        return {
            card,
            group,
            title,
            haystack: normalize([
                title?.textContent,
                group.querySelector("h3")?.textContent,
                ...[...card.querySelectorAll(".species-card-body p")].map(paragraph => paragraph.textContent)
            ].filter(Boolean).join(" "))
        };
    }));

    function addOptions(fieldset, name, choices) {
        choices.forEach(([value, text], index) => {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "radio";
            input.name = name;
            input.value = value;
            input.checked = index === 0;
            const description = document.createElement("span");
            description.textContent = text;
            label.append(input, description);
            fieldset.append(label);
        });
    }

    function highlightTitle(title, terms) {
        if (!title) return;
        const text = title.dataset.originalText || title.textContent;
        title.dataset.originalText = text;
        const ranges = [];

        if (terms.length) {
            // Mappa i caratteri normalizzati (senza accenti) sulle posizioni originali,
            // così l'evidenziazione resta corretta anche con maiuscole e diacritici.
            const letters = [];
            const positions = [];
            let offset = 0;
            Array.from(text).forEach(char => {
                const normalized = char.toLocaleLowerCase("it").normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
                for (const letter of normalized) {
                    letters.push(letter);
                    positions.push(offset);
                }
                offset += char.length;
            });
            const haystack = letters.join("");

            terms.forEach(term => {
                const needle = normalize(term).replace(/ /g, "");
                if (!needle) return;
                let start = haystack.indexOf(needle);
                while (start !== -1) {
                    ranges.push([positions[start], positions[start + needle.length - 1] + 1]);
                    start = haystack.indexOf(needle, start + needle.length);
                }
            });
        }

        if (!ranges.length) {
            if (title.querySelector("mark")) title.replaceChildren(text);
            return;
        }

        ranges.sort((a, b) => a[0] - b[0]);
        const merged = [];
        ranges.forEach(range => {
            const last = merged[merged.length - 1];
            if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
            else merged.push([...range]);
        });

        const fragment = document.createDocumentFragment();
        let cursor = 0;
        merged.forEach(([start, end]) => {
            if (start > cursor) fragment.append(text.slice(cursor, start));
            const mark = document.createElement("mark");
            mark.textContent = text.slice(start, end);
            fragment.append(mark);
            cursor = end;
        });
        if (cursor < text.length) fragment.append(text.slice(cursor));
        title.replaceChildren(fragment);
    }

    function updateFilters() {
        const selectedHabitat = habitatOptions.querySelector('input[name="species-habitat"]:checked').value;
        const selectedOrigin = originOptions.querySelector('input[name="species-origin"]:checked').value;
        const query = searchInput ? searchInput.value.trim() : "";
        const terms = getTerms(query);
        const highlightTerms = [...new Set(normalize(query).split(" ").filter(Boolean))];
        const filtersActive = Boolean(selectedHabitat || selectedOrigin);
        let visibleCount = 0;

        searchableCards.forEach(({ card, group, haystack, title }) => {
            const matchesQuery = terms.every(term => haystack.includes(term));
            const visible = matchesQuery
                && (!selectedHabitat || group.dataset.habitat === selectedHabitat)
                && (!selectedOrigin || card.dataset.origin === selectedOrigin);
            card.hidden = !visible;
            highlightTitle(title, visible ? highlightTerms : []);
            if (visible) visibleCount++;
        });
        groups.forEach(group => {
            group.hidden = !group.querySelector(".species-card:not([hidden])");
        });

        const habitatLabel = habitats.find(([value]) => value === selectedHabitat)[1];
        const originLabel = origins.find(([value]) => value === selectedOrigin)[1];
        currentLabel.textContent = filtersActive
            ? `${selectedHabitat ? habitatLabel : "Tutti gli ambienti"} · ${selectedOrigin ? originLabel : "Tutte le origini"}`
            : "Tutte";

        if (!visibleCount) {
            status.textContent = query
                ? `Nessuna specie trovata per “${query}”.`
                : "Nessuna specie corrisponde ai filtri selezionati.";
        } else if (query) {
            status.textContent = `${visibleCount} ${visibleCount === 1 ? "specie trovata" : "specie trovate"} per “${query}”${filtersActive ? " con i filtri attivi" : ""}.`;
        } else {
            status.textContent = `${visibleCount} ${visibleCount === 1 ? "specie mostrata" : "specie mostrate"}.`;
        }

        if (searchClear) searchClear.hidden = !query;
        if (searchEmpty) searchEmpty.hidden = visibleCount > 0;
    }

    function clearSearch() {
        if (!searchInput) return;
        searchInput.value = "";
        updateFilters();
        searchInput.focus();
    }

    addOptions(habitatOptions, "species-habitat", habitats);
    addOptions(originOptions, "species-origin", origins);
    filter.addEventListener("change", updateFilters);

    if (searchInput) {
        searchInput.addEventListener("input", updateFilters);
        searchInput.addEventListener("search", updateFilters);
        searchInput.addEventListener("keydown", event => {
            if (event.key === "Escape" && searchInput.value) {
                event.preventDefault();
                clearSearch();
            }
        });
    }
    searchForm?.addEventListener("submit", event => {
        event.preventDefault();
        updateFilters();
    });
    searchClear?.addEventListener("click", clearSearch);
    searchReset?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        habitatOptions.querySelector('input[name="species-habitat"]').checked = true;
        originOptions.querySelector('input[name="species-origin"]').checked = true;
        updateFilters();
        searchInput?.focus();
    });

    updateFilters();
})();
