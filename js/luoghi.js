        let previousModalFocus = null;

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
                let count = 0;
                cards.forEach(card => {
                    card.hidden = Boolean(selected) && card.dataset.placeType !== selected;
                    if (!card.hidden) count++;
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
                const sortLabel = sortLength.selectedOptions[0].textContent;
                status.textContent = `${count} ${count === 1 ? "scheda territoriale" : "schede territoriali"} ${count === 1 ? "mostrata" : "mostrate"} · ${sortLabel}.`;
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
