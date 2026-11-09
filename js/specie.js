        function renderSpecies(filter) {
            const species = SPECIES_DATA.filter(item => filter === "all" || item.environment.toLowerCase() === filter);
            byId("species-grid").innerHTML = species.map(item => `
                <article class="spot-card rounded-xl">
                    <div class="spot-symbol" aria-hidden="true">${escapeHtml(item.image)}</div>
                    <div class="card-content">
                        <h3>${escapeHtml(item.name)}</h3>
                        <p><strong>Ambiente:</strong> ${escapeHtml(item.environment)}</p>
                        <p><strong>Stagione:</strong> ${escapeHtml(item.idealSeason.replace(/^Stagione indicativa:\s*/, ""))} (indicativa)</p>
                        <p><strong>Esche indicative:</strong> ${item.baits.map(escapeHtml).join(", ")}</p>
                    </div>
                </article>`).join("");
        }

        document.addEventListener("DOMContentLoaded", () => {
            renderSpecies("all");
            document.querySelectorAll(".filter-actions button").forEach(button => button.addEventListener("click", () => {
                renderSpecies(button.dataset.filter);
                document.querySelectorAll(".filter-actions button").forEach(item => {
                    item.classList.toggle("btn-primary", item === button);
                    item.classList.toggle("btn-secondary", item !== button);
                });
            }));
        });
