document.addEventListener("DOMContentLoaded", () => {
    const emblem = document.getElementById("info-emblem");
    const toggle = document.getElementById("info-current-toggle");
    const status = document.getElementById("info-current-status");
    const icon = toggle?.querySelector(".info-toggle-icon");
    const label = toggle?.querySelector("span:last-child");

    if (!(emblem instanceof SVGSVGElement) || !(toggle instanceof HTMLButtonElement) ||
        !(status instanceof HTMLElement) || !(icon instanceof HTMLElement) || !(label instanceof HTMLElement)) {
        console.error("Controllo della corrente non inizializzato: elementi della pagina mancanti.");
        return;
    }

    toggle.addEventListener("click", () => {
        const isFlowing = toggle.getAttribute("aria-pressed") !== "true";
        toggle.setAttribute("aria-pressed", String(isFlowing));
        emblem.classList.toggle("is-flowing", isFlowing);
        icon.textContent = isFlowing ? "Ⅱ" : "↗";
        label.textContent = isFlowing ? "Ferma la corrente" : "Segui la corrente";
        status.textContent = isFlowing ? "Corrente in movimento." : "La corrente è in attesa.";
    });
});
