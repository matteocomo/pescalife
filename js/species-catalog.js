(() => {
    const filter = document.getElementById("species-filter");
    const habitatOptions = document.getElementById("species-habitat-options");
    const originOptions = document.getElementById("species-origin-options");
    const currentLabel = document.getElementById("species-filter-current");
    const status = document.getElementById("species-filter-status");
    const groups = [...document.querySelectorAll(".species-group")];
    if (!filter || !habitatOptions || !originOptions || !currentLabel || !status || !groups.length) return;

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

    function updateFilters() {
        const selectedHabitat = habitatOptions.querySelector('input[name="species-habitat"]:checked').value;
        const selectedOrigin = originOptions.querySelector('input[name="species-origin"]:checked').value;
        let visibleCount = 0;

        groups.forEach(group => {
            let groupCount = 0;
            group.querySelectorAll(".species-card").forEach(card => {
                const visible = (!selectedHabitat || group.dataset.habitat === selectedHabitat)
                    && (!selectedOrigin || card.dataset.origin === selectedOrigin);
                card.hidden = !visible;
                if (visible) {
                    visibleCount++;
                    groupCount++;
                }
            });
            group.hidden = groupCount === 0;
        });

        const habitatLabel = habitats.find(([value]) => value === selectedHabitat)[1];
        const originLabel = origins.find(([value]) => value === selectedOrigin)[1];
        currentLabel.textContent = selectedHabitat || selectedOrigin
            ? `${selectedHabitat ? habitatLabel : "Tutti gli ambienti"} · ${selectedOrigin ? originLabel : "Tutte le origini"}`
            : "Tutte";
        status.textContent = `${visibleCount} ${visibleCount === 1 ? "specie mostrata" : "specie mostrate"}.`;
    }

    addOptions(habitatOptions, "species-habitat", habitats);
    addOptions(originOptions, "species-origin", origins);
    filter.addEventListener("change", updateFilters);
    updateFilters();
})();
