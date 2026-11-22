(function (root) {
    "use strict";

    // Registro delle fotografie delle specie, organizzato tramite lo slug della scheda.
    // I campi fotografici non disponibili vengono omessi invece di essere inventati.
    // Stati: verified, pending, unavailable.
    const SPECIES_PHOTOS = Object.freeze({
        "trota-fario": Object.freeze({
            file: "assets/specie/trota-fario.avif",
            alt: "Trota fario fotografata tra le pietre",
            author: "Apple2000",
            uploader: null,
            sourceLabel: "Wikimedia Commons",
            sourceUrl: "https://commons.wikimedia.org/wiki/File:Salmo_trutta_fario-1.jpg",
            license: "CC BY-SA 3.0",
            licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
            modifications: "Originale non modificato",
            location: "Giappone",
            status: "verified"
        }),
        "trota-iridea": Object.freeze({
            file: "assets/specie/trota-iridea.avif",
            alt: "Trota iridea",
            status: "pending"
        }),
        "cavedano-italiano": Object.freeze({
            file: "assets/specie/cavedano-italiano.avif",
            alt: "Cavedano italiano",
            author: "Hectonichus",
            uploader: null,
            sourceLabel: "Wikimedia Commons",
            sourceUrl: "https://it.wikipedia.org/wiki/File:Cyprinidae_-_Barbus_plebejus.JPG",
            license: "CC BY-SA 3.0",
            licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.it",
            modifications: "Originale non modificato",
            status: "pending"
        })
    });

    root.SPECIES_PHOTOS = SPECIES_PHOTOS;
})(typeof globalThis !== "undefined" ? globalThis : window);
