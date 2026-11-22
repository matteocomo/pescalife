(function () {
    "use strict";

    function appendLink(parent, label, url) {
        if (!label || !url) return;
        const link = document.createElement("a");
        link.href = url;
        link.textContent = label;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        parent.append(link);
    }

    function appendText(parent, text) {
        if (text) parent.append(document.createTextNode(text));
    }

    function addSeparator(parent) {
        if (parent.childNodes.length) {
            parent.append(document.createTextNode(" · "));
        }
    }

    document.querySelectorAll("[data-species-photo]").forEach(figure => {
        const slug = figure.dataset.speciesPhoto;
        const photo = window.SPECIES_PHOTOS?.[slug];
        const existingCaption = figure.querySelector("figcaption");
        if (existingCaption) existingCaption.remove();

        if (!photo || photo.status === "unavailable") {
            if (photo?.status === "unavailable") figure.remove();
            return;
        }

        if (photo.status !== "verified") return;

        if (!photo.author || !photo.sourceUrl || !photo.license || !photo.licenseUrl) return;

        const caption = document.createElement("figcaption");

        if (photo.title) {
            appendText(caption, `Titolo: ${photo.title}`);
        }

        addSeparator(caption);
        appendText(caption, "Foto: ");
        appendLink(caption, photo.author, photo.sourceUrl);

        if (photo.sourceLabel) {
            addSeparator(caption);
            appendText(caption, `Fonte: ${photo.sourceLabel}`);
        }

        addSeparator(caption);
        appendText(caption, "Licenza: ");
        appendLink(caption, photo.license, photo.licenseUrl);

        if (photo.modifications) {
            addSeparator(caption);
            appendText(caption, `Modifiche: ${photo.modifications}`);
        }

        if (photo.location) {
            addSeparator(caption);
            appendText(caption, `Luogo dello scatto: ${photo.location}`);
        }

        if (photo.consultedAt) {
            addSeparator(caption);
            appendText(caption, `Consultata: ${photo.consultedAt}`);
        }

        figure.append(caption);
    });
})();
