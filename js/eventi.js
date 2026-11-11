// Add verified, publishable events here; imageUrl requires imageAuthorized: true.
// Each event: { date: "YYYY-MM-DD", title, type, location, organizer, status, detailUrl?, imageUrl?, imageAlt?, imageAuthorized? }.
const PUBLISHED_EVENTS = [];

// Activate only after the proposal privacy notice and recipient have been verified.
const EVENT_PRIVACY_READY = false;

function setupEventControls() {
    const form = document.getElementById("event-proposal-form");
    const popups = [];
    const syncControls = [];
    const close = (control, focus = false) => {
        control.popup.hidden = true;
        control.toggle.setAttribute("aria-expanded", "false");
        if (focus) control.toggle.focus();
    };
    const open = control => {
        popups.forEach(other => close(other));
        control.popup.hidden = false;
        control.toggle.setAttribute("aria-expanded", "true");
    };

    document.querySelectorAll("#events-type, #events-location, #event-type").forEach(select => {
        const label = document.querySelector(`label[for="${select.id}"]`);
        const wrapper = document.createElement("div");
        wrapper.className = "diary-control";
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "diary-spot-toggle";
        toggle.id = `${select.id}-toggle`;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", `${select.id}-options`);
        const text = document.createElement("span");
        label.id = `${select.id}-label`;
        text.id = `${select.id}-value`;
        toggle.setAttribute("aria-labelledby", `${label.id} ${text.id}`);
        const arrow = document.createElement("span");
        arrow.textContent = "⌄";
        arrow.setAttribute("aria-hidden", "true");
        toggle.append(text, arrow);
        const popup = document.createElement("div");
        popup.id = `${select.id}-options`;
        popup.className = "diary-popup diary-spot-options";
        popup.hidden = true;
        const error = document.createElement("span");
        error.className = "diary-control-error";
        error.textContent = "Seleziona una tipologia di evento.";
        error.hidden = true;
        error.id = `${select.id}-error`;
        select.before(wrapper);
        wrapper.append(select, toggle, popup, error);
        select.classList.add("event-native-control");
        select.tabIndex = -1;
        select.setAttribute("aria-hidden", "true");
        label.htmlFor = toggle.id;
        const control = { wrapper, toggle, popup };
        popups.push(control);
        const sync = () => {
            text.textContent = select.selectedOptions[0]?.textContent || "";
            error.hidden = true;
            toggle.removeAttribute("aria-invalid");
            toggle.removeAttribute("aria-describedby");
        };
        syncControls.push(sync);
        select.addEventListener("change", sync);
        select.addEventListener("invalid", event => {
            event.preventDefault();
            error.hidden = false;
            toggle.setAttribute("aria-invalid", "true");
            toggle.setAttribute("aria-describedby", error.id);
            toggle.focus();
        });
        toggle.addEventListener("click", () => {
            if (!popup.hidden) return close(control);
            popup.replaceChildren();
            [...select.options].filter(option => !option.disabled).forEach(option => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = option.textContent;
                if (option.selected) button.setAttribute("aria-current", "true");
                button.addEventListener("click", () => {
                    select.value = option.value;
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                    close(control, true);
                });
                popup.append(button);
            });
            open(control);
            popup.querySelector("button")?.focus();
        });
        sync();
    });

    const date = document.getElementById("event-date");
    const label = document.querySelector('label[for="event-date"]');
    const wrapper = document.createElement("div");
    wrapper.className = "diary-control";
    wrapper.innerHTML = `<div class="diary-date-control">
        <input type="text" id="event-date-text" inputmode="numeric" placeholder="gg/mm/aaaa" maxlength="10" required aria-describedby="event-date-hint">
        <button type="button" class="diary-picker-toggle" aria-label="Apri calendario" aria-expanded="false" aria-controls="event-calendar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"></rect><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" stroke-width="2.4"></path></svg>
        </button>
        <div class="diary-calendar diary-popup" id="event-calendar" hidden>
            <div class="diary-calendar-heading"><button type="button" class="event-calendar-prev" aria-label="Mese precedente">‹</button><strong aria-live="polite"></strong><button type="button" class="event-calendar-next" aria-label="Mese successivo">›</button></div>
            <div class="diary-calendar-weekdays" aria-hidden="true"><span>L</span><span>M</span><span>M</span><span>G</span><span>V</span><span>S</span><span>D</span></div>
            <div class="diary-calendar-days" aria-label="Giorni del mese"></div>
        </div>
    </div><span class="diary-control-hint" id="event-date-hint">Scrivi la data nel formato gg/mm/aaaa oppure usa il calendario.</span>`;
    date.before(wrapper);
    wrapper.prepend(date);
    const text = wrapper.querySelector("#event-date-text");
    const toggle = wrapper.querySelector(".diary-picker-toggle");
    const popup = wrapper.querySelector("#event-calendar");
    const heading = popup.querySelector("strong");
    const days = popup.querySelector(".diary-calendar-days");
    const prev = popup.querySelector(".event-calendar-prev");
    const next = popup.querySelector(".event-calendar-next");
    const control = { wrapper, toggle, popup };
    popups.push(control);
    let displayedMonth = new Date();
    date.classList.add("event-native-control");
    date.tabIndex = -1;
    date.setAttribute("aria-hidden", "true");
    date.required = false;
    label.htmlFor = text.id;
    const syncDate = () => {
        const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.value);
        text.value = parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : "";
        text.setCustomValidity("");
    };
    syncControls.push(syncDate);
    date.addEventListener("change", syncDate);
    text.addEventListener("input", () => {
        const value = text.value.trim();
        const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
        let valid = false;
        if (parts && parts[3] !== "0000") {
            const last = new Date(0);
            last.setUTCFullYear(Number(parts[3]), Number(parts[2]), 0);
            valid = Number(parts[2]) >= 1 && Number(parts[2]) <= 12 &&
                Number(parts[1]) >= 1 && Number(parts[1]) <= last.getUTCDate();
        }
        date.value = valid ? `${parts[3]}-${parts[2]}-${parts[1]}` : "";
        text.setCustomValidity(value && !valid ? "Inserisci una data valida nel formato gg/mm/aaaa." : "");
    });
    const renderCalendar = () => {
        const year = displayedMonth.getFullYear();
        const month = displayedMonth.getMonth();
        heading.textContent = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(displayedMonth);
        prev.disabled = year === 1 && month === 0;
        next.disabled = year === 9999 && month === 11;
        const first = new Date(0);
        first.setFullYear(year, month, 1);
        const last = new Date(0);
        last.setFullYear(year, month + 1, 0);
        days.replaceChildren();
        for (let i = 0; i < (first.getDay() + 6) % 7; i++) {
            const blank = document.createElement("span");
            blank.setAttribute("aria-hidden", "true");
            days.append(blank);
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
                date.dispatchEvent(new Event("change", { bubbles: true }));
                close(control, true);
            });
            days.append(button);
        }
    };
    toggle.addEventListener("click", () => {
        if (!popup.hidden) return close(control);
        displayedMonth = new Date();
        displayedMonth.setDate(1);
        if (date.value) {
            const [year, month] = date.value.split("-").map(Number);
            displayedMonth.setFullYear(year, month - 1, 1);
        }
        renderCalendar();
        open(control);
    });
    prev.addEventListener("click", () => { displayedMonth.setMonth(displayedMonth.getMonth() - 1); renderCalendar(); });
    next.addEventListener("click", () => { displayedMonth.setMonth(displayedMonth.getMonth() + 1); renderCalendar(); });
    document.addEventListener("click", event => popups.forEach(item => {
        if (!item.wrapper.contains(event.target)) close(item);
    }));
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        const current = popups.find(item => !item.popup.hidden);
        if (current) { event.preventDefault(); close(current, true); }
    });
    form.addEventListener("reset", () => setTimeout(() => syncControls.forEach(sync => sync()), 0));
    syncDate();
}

document.addEventListener("DOMContentLoaded", () => {
    const typeFilter = document.getElementById("events-type");
    const locationFilter = document.getElementById("events-location");
    const template = document.getElementById("event-card-template");
    const allowedTypes = [...typeFilter.options].map(option => option.value).filter(Boolean);
    const allowedStatuses = ["Iscrizioni aperte", "Iscrizioni chiuse", "Completo", "Annullato"];

    function safeUrl(value) {
        if (!value) return null;
        try {
            const url = new URL(value, document.baseURI);
            return ["http:", "https:"].includes(url.protocol) || (location.protocol === "file:" && url.protocol === "file:") ? url.href : null;
        } catch (error) {
            console.error("Indirizzo evento non valido:", error);
            return null;
        }
    }

    function validEvent(event) {
        if (!event || typeof event !== "object" || typeof event.date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(event.date)) return false;
        const date = new Date(`${event.date}T12:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === event.date &&
            ["title", "type", "location", "organizer", "status"].every(key => typeof event[key] === "string" && event[key].trim()) &&
            allowedTypes.includes(event.type) && allowedStatuses.includes(event.status);
    }

    const events = PUBLISHED_EVENTS.filter(event => {
        if (validEvent(event)) return true;
        console.error("Evento non valido: controllare i dati pubblicati.", event);
        return false;
    });

    [...new Set(events.map(event => event.location))].sort((a, b) => a.localeCompare(b, "it")).forEach(locationName => {
        const option = document.createElement("option");
        option.value = locationName;
        option.textContent = locationName;
        locationFilter.append(option);
    });
    setupEventControls();

    function renderCard(event) {
        const card = template.content.cloneNode(true);
        const date = card.querySelector(".event-card-date");
        date.dateTime = event.date;
        date.textContent = dateInItalian(event.date);
        card.querySelector(".event-card-title").textContent = event.title;
        card.querySelector(".event-card-type").textContent = event.type;
        card.querySelector(".event-card-location").textContent = event.location;
        card.querySelector(".event-card-organizer").textContent = event.organizer;
        card.querySelector(".event-card-status").textContent = event.status;
        if (event.imageUrl && event.imageAuthorized === true) {
            const imageUrl = safeUrl(event.imageUrl);
            if (imageUrl) {
                const image = card.querySelector(".event-card-image");
                image.src = imageUrl;
                image.alt = event.imageAlt || "";
                image.hidden = false;
            } else console.error("Immagine evento non valida:", event.title);
        }
        if (event.detailUrl) {
            const detailUrl = safeUrl(event.detailUrl);
            if (detailUrl) {
                const link = card.querySelector(".event-card-link");
                link.href = detailUrl;
                link.hidden = false;
            } else console.error("Collegamento evento non valido:", event.title);
        }
        return card;
    }

    function renderEvents() {
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const filtered = events.filter(event => (!typeFilter.value || event.type === typeFilter.value) &&
            (!locationFilter.value || event.location === locationFilter.value));
        for (const [prefix, past] of [["upcoming", false], ["past", true]]) {
            const list = document.getElementById(`${prefix}-events`);
            const empty = document.getElementById(`${prefix}-empty`);
            const allInPeriod = events.filter(event => (event.date < todayKey) === past);
            const matching = filtered.filter(event => (event.date < todayKey) === past)
                .sort((a, b) => past ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
            list.replaceChildren(...matching.map(renderCard));
            empty.hidden = matching.length > 0;
            empty.textContent = allInPeriod.length && !matching.length
                ? "Nessun evento corrisponde ai filtri selezionati."
                : past ? "L’archivio è ancora vuoto: qui troverai gli eventi conclusi quando saranno disponibili."
                    : "Al momento non sono presenti appuntamenti pubblicati. Torna a trovarci per scoprire le prossime iniziative.";
        }
    }

    typeFilter.addEventListener("change", renderEvents);
    locationFilter.addEventListener("change", renderEvents);
    renderEvents();

    const form = document.getElementById("event-proposal-form");
    const fields = document.getElementById("event-proposal-fields");
    const submit = document.getElementById("event-submit");
    const status = document.getElementById("event-form-status");
    const accessKey = form.elements.namedItem("access_key");
    const botcheck = form.elements.namedItem("botcheck");
    let sending = false;

    function setStatus(message, kind = "") {
        status.textContent = message;
        status.className = `event-form-status${kind ? ` is-${kind}` : ""}`;
    }

    form.querySelectorAll('input[required][type="text"]:not(#event-date-text)').forEach(input => {
        const validate = () => input.setCustomValidity(input.value && !input.value.trim() ? "Inserisci un valore valido." : "");
        input.addEventListener("input", validate);
    });
    form.querySelectorAll('input[type="url"]').forEach(input => {
        const validate = () => {
            let valid = !input.value;
            if (input.value) {
                try { valid = ["http:", "https:"].includes(new URL(input.value).protocol); }
                catch { valid = false; }
            }
            input.setCustomValidity(valid ? "" : "Inserisci un indirizzo HTTP o HTTPS valido.");
        };
        input.addEventListener("input", validate);
    });

    submit.disabled = false;
    setStatus(!WEB3FORMS_ACCESS_KEY.trim() || !EVENT_PRIVACY_READY
        ? "L’invio della proposta non è ancora attivo: configurazione e informativa privacy sono da completare."
        : "");
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (sending || !form.reportValidity()) return;
        if (botcheck.checked) {
            setStatus("Impossibile inviare la proposta. Controlla il modulo e riprova.", "error");
            return;
        }
        if (!WEB3FORMS_ACCESS_KEY.trim() || !EVENT_PRIVACY_READY) {
            setStatus("Invio non disponibile: la configurazione e l’informativa privacy per le proposte sono ancora da completare.", "error");
            return;
        }
        accessKey.value = WEB3FORMS_ACCESS_KEY.trim();
        const data = Object.fromEntries(new FormData(form).entries());
        data.botcheck = "";
        sending = true;
        submit.disabled = true;
        fields.disabled = true;
        setStatus("Invio in corso…");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                referrerPolicy: "no-referrer",
                signal: controller.signal,
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok || result.success !== true) throw new Error(`Web3Forms: invio non riuscito (HTTP ${response.status}).`);
            form.reset();
            setStatus("Proposta inviata. Grazie! La pubblicazione non è automatica.", "success");
        } catch (error) {
            console.error("Invio della proposta evento non riuscito:", error);
            setStatus(error.name === "AbortError"
                ? "L’invio ha richiesto troppo tempo: verifica se la proposta è arrivata prima di riprovare. I dati sono rimasti nel modulo."
                : "Invio non riuscito. Riprova più tardi; i dati sono rimasti nel modulo.", "error");
        } finally {
            clearTimeout(timeout);
            fields.disabled = false;
            submit.disabled = false;
            sending = false;
        }
    });
});
