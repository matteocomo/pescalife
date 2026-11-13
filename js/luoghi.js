        let previousModalFocus = null;

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
