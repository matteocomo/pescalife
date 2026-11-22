        let previousModalFocus = null;

        function normalizeSearch(value) {
            return String(value ?? "")
                .toLocaleLowerCase("it")
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, " ")
                .trim();
        }

        function searchTerms(value) {
            return [...new Set(normalizeSearch(value).split(" ").filter(Boolean))];
        }

        function highlightSearchMatches(title, terms) {
            if (!title) return;
            const text = title.dataset.originalText || title.textContent;
            title.dataset.originalText = text;
            const ranges = [];

            if (terms.length) {
                // Mappa i caratteri normalizzati (senza accenti) sulle posizioni originali.
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
                    const needle = normalizeSearch(term).replace(/ /g, "");
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

        function setupPlaceFilter() {
            const filter = byId("luoghi-filter");
            const options = byId("luoghi-filter-options");
            const catalog = byId("luoghi-catalog");
            const cards = [...catalog.querySelectorAll(".species-card")];
            const sortLength = byId("luoghi-sort-length");
            const sortControl = byId("luoghi-sort-control");
            const sortToggle = byId("luoghi-sort-toggle");
            const sortLabel = byId("luoghi-sort-label");
            const sortPopup = byId("luoghi-sort-popup");
            const types = [...new Set(cards.map(card => card.dataset.placeType).filter(Boolean))];
            const current = byId("luoghi-filter-current");
            const status = byId("luoghi-filter-status");
            const originalOrder = new Map(cards.map((card, index) => [card, index]));
            const searchForm = byId("luoghi-search");
            const searchInput = byId("luoghi-query");
            const searchClear = byId("luoghi-search-clear");
            const searchReset = byId("luoghi-search-reset");
            const searchEmpty = byId("luoghi-search-empty");

            const searchableCards = cards.map(card => {
                const title = card.querySelector(".species-card-body h3");
                const parts = [title?.textContent, card.querySelector(".badge")?.textContent];
                card.querySelectorAll(".species-card-body p:not(.species-photo-credit)").forEach(paragraph => parts.push(paragraph.textContent));
                return { card, title, haystack: normalizeSearch(parts.filter(Boolean).join(" ")) };
            });

            function getCardLength(card) {
                const match = card.textContent.match(/Lunghezza CTR:\s*([\d.,]+)\s*km/i);
                return match ? Number(match[1].replace(",", ".")) : null;
            }

            for (const type of ["Tutti", ...types]) {
                const label = document.createElement("label");
                const input = document.createElement("input");
                input.type = "radio";
                input.name = "luoghi-type";
                input.value = type === "Tutti" ? "" : type;
                input.checked = type === "Tutti";
                const text = document.createElement("span");
                text.textContent = type;
                label.append(input, text);
                options.append(label);
            }

            function updateFilter() {
                const selected = options.querySelector('input[name="luoghi-type"]:checked').value;
                const query = searchInput ? searchInput.value.trim() : "";
                const terms = searchTerms(query);
                let count = 0;

                searchableCards.forEach(({ card, title, haystack }) => {
                    const visible = (!selected || card.dataset.placeType === selected)
                        && terms.every(term => haystack.includes(term));
                    card.hidden = !visible;
                    highlightSearchMatches(title, visible ? terms : []);
                    if (visible) count++;
                });

                const sorted = [...cards].sort((a, b) => {
                    if (sortLength.value === "original") {
                        return originalOrder.get(a) - originalOrder.get(b);
                    }
                    const lengthA = getCardLength(a);
                    const lengthB = getCardLength(b);
                    if (lengthA === null && lengthB === null) return originalOrder.get(a) - originalOrder.get(b);
                    if (lengthA === null) return 1;
                    if (lengthB === null) return -1;
                    return sortLength.value === "desc" ? lengthB - lengthA : lengthA - lengthB;
                });
                sorted.forEach(card => catalog.append(card));

                current.textContent = selected || "Tutti";
                const sortText = sortLength.selectedOptions[0].textContent;
                if (!count) {
                    status.textContent = query
                        ? `Nessun luogo trovato per “${query}”.`
                        : "Nessuna scheda corrisponde ai filtri selezionati.";
                } else if (query) {
                    status.textContent = `${count} ${count === 1 ? "scheda territoriale trovata" : "schede territoriali trovate"} per “${query}”${selected ? ` con il filtro “${selected}”` : ""} · ${sortText}.`;
                } else {
                    status.textContent = `${count} ${count === 1 ? "scheda territoriale mostrata" : "schede territoriali mostrate"} · ${sortText}.`;
                }

                if (searchClear) searchClear.hidden = !query;
                if (searchEmpty) searchEmpty.hidden = count > 0;
            }

            function clearSearch() {
                if (!searchInput) return;
                searchInput.value = "";
                updateFilter();
                searchInput.focus();
            }

            options.addEventListener("change", updateFilter);
            sortLength.addEventListener("change", updateFilter);

            sortToggle.addEventListener("click", () => {
                const isOpen = !sortPopup.hidden;
                sortPopup.hidden = isOpen;
                sortToggle.setAttribute("aria-expanded", String(!isOpen));
            });

            sortPopup.addEventListener("click", event => {
                const button = event.target.closest("[data-sort-value]");
                if (!button) return;
                sortLength.value = button.dataset.sortValue;
                sortLabel.textContent = button.textContent;
                sortPopup.querySelectorAll("[role='option']").forEach(option => {
                    option.removeAttribute("aria-current");
                });
                button.setAttribute("aria-current", "true");
                sortPopup.hidden = true;
                sortToggle.setAttribute("aria-expanded", "false");
                sortLength.dispatchEvent(new Event("change", { bubbles: true }));
                sortToggle.focus();
            });

            document.addEventListener("click", event => {
                if (!sortControl.contains(event.target)) {
                    sortPopup.hidden = true;
                    sortToggle.setAttribute("aria-expanded", "false");
                }
            });

            document.addEventListener("keydown", event => {
                if (event.key === "Escape" && !sortPopup.hidden) {
                    sortPopup.hidden = true;
                    sortToggle.setAttribute("aria-expanded", "false");
                    sortToggle.focus();
                }
            });

            if (searchInput) {
                searchInput.addEventListener("input", updateFilter);
                searchInput.addEventListener("search", updateFilter);
                searchInput.addEventListener("keydown", event => {
                    if (event.key === "Escape" && searchInput.value) {
                        event.preventDefault();
                        clearSearch();
                    }
                });
            }
            searchForm?.addEventListener("submit", event => {
                event.preventDefault();
                updateFilter();
            });
            searchClear?.addEventListener("click", clearSearch);
            searchReset?.addEventListener("click", () => {
                if (searchInput) searchInput.value = "";
                options.querySelector('input[name="luoghi-type"]').checked = true;
                updateFilter();
                searchInput?.focus();
            });

            if (searchForm) searchForm.hidden = false;
            filter.hidden = false;
            updateFilter();
        }

        function renderSpots() {
            const spots = visibleSpots();
            byId("spot-grid").innerHTML = spots.length ? spots.map(spot => `
                <article class="spot-card rounded-xl shadow-lg" data-spot-id="${escapeHtml(spot.id)}" tabindex="0" role="button" aria-label="Apri dettagli: ${escapeHtml(spot.name)}">
                    <div class="spot-symbol" aria-hidden="true">${escapeHtml(spot.image)}</div>
                    <div class="card-content">
                        <h3>${escapeHtml(spot.name)} ${!spot.verified ? '<span class="badge badge-warning">DA VERIFICARE</span>' : ""}</h3>
                        <p>${escapeHtml(spot.description)}</p>
                        <div class="tech-tags">${spot.techniques.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>
                        <p class="text-sm mt-2"><strong>Accesso:</strong> ${escapeHtml(spot.access)}</p>
                    </div>
                </article>`).join("") : "";
        }

        function openSpotModal(spotId) {
            const spot = visibleSpots().find(item => item.id === spotId);
            if (!spot) return;
            previousModalFocus = document.activeElement;
            byId("modal-title").textContent = `Dettagli: ${spot.name}`;
            byId("modal-content").innerHTML = `
                <div class="spot-symbol" aria-hidden="true">${escapeHtml(spot.image)}</div>
                <p><strong>Descrizione:</strong> ${escapeHtml(spot.description)}</p>
                <p class="mt-2"><strong>Tecniche indicative:</strong> ${spot.techniques.map(escapeHtml).join(", ")}</p>
                <p><strong>Esche indicative:</strong> ${spot.recommendedBaits.map(escapeHtml).join(", ")}</p>
                <p><strong>Orari:</strong> ${escapeHtml(spot.bestTime)}</p>
                <p><strong>Accesso:</strong> ${escapeHtml(spot.access)}${spot.verified ? "" : ' <span class="badge badge-warning">DA VERIFICARE</span>'}</p>
                <div class="rules-block"><strong>Regole e verifiche</strong><p>${escapeHtml(spot.rulesNote)}</p><p><strong>Controlla sempre le regole ufficiali aggiornate.</strong></p>${spot.officialLink ? `<p><a href="${escapeHtml(spot.officialLink)}" target="_blank" rel="noopener noreferrer">Fonte ufficiale</a></p>` : ""}</div>`;
            byId("share-spot-btn").hidden = false;
            byId("share-spot-btn").onclick = () => shareSpot(spot);
            const modal = byId("spot-modal");
            modal.classList.add("open");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("dialog-open");
            byId("close-spot-modal").focus();
        }

        function closeSpotModal() {
            const modal = byId("spot-modal");
            modal.classList.remove("open");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("dialog-open");
            byId("share-spot-btn").hidden = true;
            if (previousModalFocus && typeof previousModalFocus.focus === "function") previousModalFocus.focus();
        }

        async function shareSpot(spot) {
            const text = `Spot PescaLife: ${spot.name}\n${spot.description}\nRegole: ${spot.rulesNote}`;
            if (navigator.clipboard && window.isSecureContext) {
                try {
                    await navigator.clipboard.writeText(text);
                    showMessage("Dettagli copiati negli appunti.");
                    return;
                } catch (error) {
                    console.error("Copia negli appunti non riuscita:", error);
                }
            }
            window.prompt("Copia manualmente le informazioni sullo spot:", text);
        }

        document.addEventListener("DOMContentLoaded", () => {
            renderSpots();
            setupPlaceFilter();
            byId("spot-grid").addEventListener("click", event => {
                const card = event.target.closest("[data-spot-id]");
                if (card) openSpotModal(card.dataset.spotId);
            });
            byId("spot-grid").addEventListener("keydown", event => {
                if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-spot-id]")) {
                    event.preventDefault();
                    openSpotModal(event.target.dataset.spotId);
                }
            });
            byId("close-spot-modal").addEventListener("click", closeSpotModal);
            byId("spot-modal").addEventListener("click", event => {
                if (event.target === byId("spot-modal")) closeSpotModal();
            });
            document.addEventListener("keydown", event => {
                if (event.key === "Escape" && byId("spot-modal").classList.contains("open")) closeSpotModal();
            });
        });
