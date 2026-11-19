function setupDiaryControls() {
    const date = document.getElementById("diary-date");
    const dateText = document.getElementById("diary-date-text");
    const dateControl = document.getElementById("diary-date-control");
    const dateHint = document.getElementById("diary-date-hint");
    const calendar = document.getElementById("diary-calendar");
    const calendarToggle = document.getElementById("diary-calendar-toggle");
    const calendarMonth = document.getElementById("diary-calendar-month");
    const calendarDays = document.getElementById("diary-calendar-days");
    const spot = document.getElementById("diary-spot");
    const spotControl = document.getElementById("diary-spot-control");
    const spotToggle = document.getElementById("diary-spot-toggle");
    const spotLabel = document.getElementById("diary-spot-label");
    const spotOptions = document.getElementById("diary-spot-options");
    const spotSearch = document.getElementById("diary-spot-search");
    const spotResults = document.getElementById("diary-spot-results");
    const spotError = document.getElementById("diary-spot-error");
    const species = document.getElementById("diary-species");
    const speciesOptions = document.getElementById("diary-species-options");
    const speciesResults = document.getElementById("diary-species-results");
    const photo = document.getElementById("diary-photo");
    const fileControl = document.getElementById("diary-file-control");
    const fileName = document.getElementById("diary-file-name");
    let displayedMonth = new Date();

    const isoDate = value => {
        const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
        if (!parts || parts[3] === "0000") return "";
        const day = Number(parts[1]);
        const month = Number(parts[2]);
        if (month < 1 || month > 12 || day < 1) return "";
        const last = new Date(0);
        last.setUTCFullYear(Number(parts[3]), month, 0);
        if (day > last.getUTCDate()) return "";
        return `${parts[3]}-${parts[2]}-${parts[1]}`;
    };
    const italianDate = value => {
        const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : "";
    };
    const closePopup = (popup, toggle, returnFocus = false) => {
        popup.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        if (returnFocus) toggle.focus();
    };
    const syncDateInput = () => {
        const value = dateText.value.trim();
        date.value = isoDate(value);
        dateText.setCustomValidity(value && !date.value ? "Inserisci una data valida nel formato gg/mm/aaaa." : "");
    };
    const setMonthFromDate = () => {
        const value = date.value;
        if (value) {
            const [year, month] = value.split("-").map(Number);
            displayedMonth = new Date(0);
            displayedMonth.setFullYear(year, month - 1, 1);
        } else {
            displayedMonth = new Date();
            displayedMonth.setDate(1);
        }
    };
    const renderCalendar = () => {
        const year = displayedMonth.getFullYear();
        const month = displayedMonth.getMonth();
        calendarMonth.textContent = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(displayedMonth);
        document.getElementById("diary-calendar-prev").disabled = year === 1 && month === 0;
        document.getElementById("diary-calendar-next").disabled = year === 9999 && month === 11;
        const first = new Date(0);
        first.setFullYear(year, month, 1);
        const offset = (first.getDay() + 6) % 7;
        const last = new Date(0);
        last.setFullYear(year, month + 1, 0);
        calendarDays.replaceChildren();
        for (let i = 0; i < offset; i++) {
            const blank = document.createElement("span");
            blank.setAttribute("aria-hidden", "true");
            calendarDays.append(blank);
        }
        for (let day = 1; day <= last.getDate(); day++) {
            const value = `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = String(day);
            button.setAttribute("aria-label", dateInItalian(value));
            if (value === date.value) button.setAttribute("aria-current", "date");
            button.addEventListener("click", () => {
                date.value = value;
                dateText.value = italianDate(value);
                dateText.setCustomValidity("");
                date.dispatchEvent(new Event("change", { bubbles: true }));
                closePopup(calendar, calendarToggle, true);
            });
            calendarDays.append(button);
        }
    };
    const changeMonth = delta => {
        displayedMonth.setMonth(displayedMonth.getMonth() + delta);
        renderCalendar();
    };
    const normalizeSearch = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const renderSpecies = (query = "") => {
        speciesResults.replaceChildren();
        const normalizedQuery = normalizeSearch(query);
        if (!normalizedQuery) {
            speciesOptions.hidden = true;
            species.setAttribute("aria-expanded", "false");
            return;
        }
        const allSpecies = [...SPECIES_DATA, ...SPECIES_UNVERIFIED];
        const matches = allSpecies.filter((item, index, list) =>
            normalizeSearch(item.name).includes(normalizedQuery) &&
            list.findIndex(candidate => candidate.name === item.name) === index
        );
        matches.slice(0, 10).forEach(item => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = item.name;
            button.setAttribute("role", "option");
            button.addEventListener("click", () => {
                species.value = item.name;
                species.dispatchEvent(new Event("input", { bubbles: true }));
                speciesOptions.hidden = true;
                species.setAttribute("aria-expanded", "false");
                species.focus();
            });
            speciesResults.append(button);
        });
        speciesOptions.hidden = matches.length === 0;
        species.setAttribute("aria-expanded", matches.length > 0 ? "true" : "false");
    };
    const renderSpots = (query = "") => {
        spotResults.replaceChildren();
        const normalizedQuery = normalizeSearch(query);
        const matches = [...spot.options].filter(option => !option.disabled && normalizeSearch(option.textContent).includes(normalizedQuery));
        matches.forEach(option => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = option.textContent;
            button.setAttribute("role", "option");
            button.setAttribute("aria-selected", option.selected ? "true" : "false");
            if (option.selected) button.setAttribute("aria-current", "true");
            button.addEventListener("click", () => {
                spot.value = option.value;
                spot.dispatchEvent(new Event("change", { bubbles: true }));
                closePopup(spotOptions, spotToggle, true);
            });
            spotResults.append(button);
        });
        if (!matches.length) {
            const empty = document.createElement("p");
            empty.className = "diary-spot-empty";
            empty.textContent = "Nessun luogo trovato.";
            spotResults.append(empty);
        }
        spotSearch.setAttribute("aria-expanded", "true");
    };
    const syncDate = () => {
        dateText.value = italianDate(date.value);
        dateText.setCustomValidity("");
    };
    const syncSpot = () => {
        const selected = spot.selectedOptions[0];
        spotLabel.textContent = selected ? selected.textContent : "Seleziona uno spot";
        spotError.hidden = true;
        spotToggle.removeAttribute("aria-invalid");
    };
    const syncFile = () => {
        fileName.textContent = photo.files[0]?.name || "Nessuna foto selezionata";
    };
    const syncControls = () => {
        syncDate();
        syncSpot();
        syncFile();
    };

    dateText.addEventListener("input", syncDateInput);
    date.addEventListener("change", syncDate);
    spot.addEventListener("change", syncSpot);
    photo.addEventListener("change", syncFile);
    spot.addEventListener("invalid", event => {
        event.preventDefault();
        spotError.hidden = false;
        spotToggle.setAttribute("aria-invalid", "true");
        spotToggle.focus();
    });
    calendarToggle.addEventListener("click", () => {
        if (!calendar.hidden) return closePopup(calendar, calendarToggle);
        closePopup(spotOptions, spotToggle);
        setMonthFromDate();
        renderCalendar();
        calendar.hidden = false;
        calendarToggle.setAttribute("aria-expanded", "true");
    });
    document.getElementById("diary-calendar-prev").addEventListener("click", () => changeMonth(-1));
    document.getElementById("diary-calendar-next").addEventListener("click", () => changeMonth(1));
    spotToggle.addEventListener("click", () => {
        if (!spotOptions.hidden) return closePopup(spotOptions, spotToggle);
        closePopup(calendar, calendarToggle);
        renderSpots();
        spotSearch.value = "";
        spotOptions.hidden = false;
        spotToggle.setAttribute("aria-expanded", "true");
        spotSearch.focus();
    });
    spotSearch.addEventListener("input", () => renderSpots(spotSearch.value));
    spotSearch.addEventListener("keydown", event => {
        const buttons = [...spotResults.querySelectorAll("button")];
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!buttons.length) return;
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const current = buttons.indexOf(document.activeElement);
            const next = current < 0 ? (direction > 0 ? 0 : buttons.length - 1) : (current + direction + buttons.length) % buttons.length;
            buttons[next].focus();
        } else if (event.key === "Enter") {
            event.preventDefault();
            buttons[0]?.click();
        }
    });
    species.addEventListener("input", () => renderSpecies(species.value));
    species.addEventListener("focus", () => renderSpecies(species.value));
    species.addEventListener("keydown", event => {
        const buttons = [...speciesResults.querySelectorAll("button")];
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!buttons.length) return;
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const current = buttons.indexOf(document.activeElement);
            const next = current < 0 ? (direction > 0 ? 0 : buttons.length - 1) : (current + direction + buttons.length) % buttons.length;
            buttons[next].focus();
        } else if (event.key === "Enter" && buttons.length) {
            event.preventDefault();
            buttons[0].click();
        } else if (event.key === "Escape") {
            speciesOptions.hidden = true;
            species.setAttribute("aria-expanded", "false");
        }
    });
    speciesResults.addEventListener("keydown", event => {
        const buttons = [...speciesResults.querySelectorAll("button")];
        const current = buttons.indexOf(document.activeElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!buttons.length) return;
            const direction = event.key === "ArrowDown" ? 1 : -1;
            buttons[(current + direction + buttons.length) % buttons.length].focus();
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            document.activeElement?.click();
        } else if (event.key === "Escape") {
            speciesOptions.hidden = true;
            species.setAttribute("aria-expanded", "false");
            species.focus();
        }
    });
    spotResults.addEventListener("keydown", event => {
        const buttons = [...spotResults.querySelectorAll("button")];
        const current = buttons.indexOf(document.activeElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!buttons.length) return;
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const next = (current + direction + buttons.length) % buttons.length;
            buttons[next].focus();
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            document.activeElement?.click();
        }
    });
    document.getElementById("diary-file-button").addEventListener("click", () => photo.click());
    document.addEventListener("click", event => {
        if (!dateControl.contains(event.target)) closePopup(calendar, calendarToggle);
        if (!spotControl.contains(event.target)) closePopup(spotOptions, spotToggle);
        if (!species.parentElement.contains(event.target)) {
            speciesOptions.hidden = true;
            species.setAttribute("aria-expanded", "false");
        }
    });
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        if (!calendar.hidden) {
            event.preventDefault();
            closePopup(calendar, calendarToggle, true);
        } else if (!spotOptions.hidden) {
            event.preventDefault();
            closePopup(spotOptions, spotToggle, true);
        } else if (!speciesOptions.hidden) {
            event.preventDefault();
            speciesOptions.hidden = true;
            species.setAttribute("aria-expanded", "false");
            species.focus();
        }
    });

    document.querySelector('label[for="diary-date"]').htmlFor = "diary-date-text";
    document.querySelector('label[for="diary-spot"]').htmlFor = "diary-spot-toggle";
    document.querySelector('label[for="diary-photo"]').htmlFor = "diary-file-button";
    date.required = false;
    dateText.required = true;
    [date, spot, photo].forEach(element => {
        element.classList.add("diary-native-control");
        element.tabIndex = -1;
        element.setAttribute("aria-hidden", "true");
    });
    dateControl.hidden = false;
    dateHint.hidden = false;
    spotControl.hidden = false;
    fileControl.hidden = false;
    syncControls();
    window.syncDiaryControls = syncControls;
}

function syncDiaryControls() {}
