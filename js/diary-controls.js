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
    const spotError = document.getElementById("diary-spot-error");
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
    const renderSpots = () => {
        spotOptions.replaceChildren();
        [...spot.options].filter(option => !option.disabled).forEach(option => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = option.textContent;
            if (option.selected) button.setAttribute("aria-current", "true");
            button.addEventListener("click", () => {
                spot.value = option.value;
                spot.dispatchEvent(new Event("change", { bubbles: true }));
                closePopup(spotOptions, spotToggle, true);
            });
            spotOptions.append(button);
        });
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
        spotOptions.hidden = false;
        spotToggle.setAttribute("aria-expanded", "true");
        spotOptions.querySelector("button")?.focus();
    });
    document.getElementById("diary-file-button").addEventListener("click", () => photo.click());
    document.addEventListener("click", event => {
        if (!dateControl.contains(event.target)) closePopup(calendar, calendarToggle);
        if (!spotControl.contains(event.target)) closePopup(spotOptions, spotToggle);
    });
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        if (!calendar.hidden) {
            event.preventDefault();
            closePopup(calendar, calendarToggle, true);
        } else if (!spotOptions.hidden) {
            event.preventDefault();
            closePopup(spotOptions, spotToggle, true);
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
