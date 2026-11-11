document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("norm-search-form");
    const input = document.getElementById("norm-query");
    const results = document.getElementById("norm-search-results");
    const searchDisclosure = document.querySelector(".norm-search-disclosure");
    const records = [...document.querySelectorAll("[data-search]")];
    const stopWords = new Set([
        "a", "al", "alla", "allo", "all", "che", "chi", "come", "con", "cosa", "da", "dal",
        "dalla", "dei", "del", "della", "di", "e", "gli", "i", "il", "in", "la", "le", "lo",
        "nel", "nella", "per", "posso", "qual", "quale", "quali", "quanto", "quante", "quanti",
        "sono", "un", "una", "uno", "vuoi", "sapere", "prima", "andare", "utilizzare",
        "pesca", "pescare", "pescatore", "pescatori", "pesce", "pesci", "2026"
    ]);
    const synonyms = {
        canne: "canna",
        ami: "amo",
        taglie: "taglia", misura: "taglia", misure: "taglia", minima: "taglia", minime: "taglia", dimensione: "taglia",
        costa: "mare", spiaggia: "mare", marino: "mare", fiume: "interno",
        fiumi: "interno", interne: "interno", interni: "interno",
        trote: "trota",
        permesso: "autorizzazione", autorizzazioni: "autorizzazione",
        licenze: "licenza",
        costi: "costo", prezzo: "costo",
        vietata: "divieto", vietato: "divieto", divieti: "divieto", vietati: "divieto",
        chiusura: "stagione", chiusa: "stagione", apertura: "stagione", periodo: "stagione",
        attrezzature: "attrezzi", attrezzatura: "attrezzi",
        esca: "esche", catture: "cattura", catturare: "cattura", prelievo: "cattura",
        branzino: "spigola", muggine: "cefalo", anguille: "anguilla",
        multe: "sanzioni", multa: "sanzioni", sanzione: "sanzioni"
    };

    const normalize = value => value.toLocaleLowerCase("it")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ").trim();
    const words = value => normalize(value).replace(/\bquanto costa\b/g, "costo").split(/\s+/)
        .filter(word => word && !stopWords.has(word))
        .map(word => synonyms[word] || word);

    const index = records.map(element => ({
        element,
        terms: new Set(words(`${element.dataset.search} ${element.dataset.title}`))
    }));
    const subjects = new Set([
        "trota", "salmonidi", "luccio", "carpa", "persico", "barbo", "cefalo", "rombo",
        "spigola", "cheppia", "alosa", "orata", "ombrina", "anguilla", "tonno", "spada",
        "lampuga", "alalunga", "cecina", "pavone", "possera", "sterza", "trossa", "bibbona",
        "castagneto", "rosignano", "vincenzo", "recfishing"
    ]);

    function search(query) {
        const terms = [...new Set(words(query))];
        results.replaceChildren();

        if (!terms.length) {
            const message = document.createElement("p");
            message.textContent = "Inserisci una specie, un luogo o una regola da cercare.";
            results.append(message);
            return;
        }

        const subjectTerms = terms.filter(term => subjects.has(term));
        const environmentTerms = terms.filter(term => term === "mare");
        const candidates = index.filter(record =>
            subjectTerms.every(term => record.terms.has(term)) &&
            environmentTerms.every(term => record.terms.has(term)) &&
            !(terms.includes("trota") && !terms.includes("persico") && record.element.id === "specie-persico-trota")
        ).map(record => ({
            ...record,
            score: terms.filter(term => record.terms.has(term)).length
        })).filter(record => record.score > 0)
            .sort((a, b) => b.score - a.score);
        const bestScore = candidates.length ? candidates[0].score : 0;
        const matches = bestScore > 1 ? candidates.filter(record => record.score === bestScore) : candidates;

        const message = document.createElement("p");
        message.className = "norm-results-count";
        if (!matches.length) {
            message.textContent = "Nessun risultato trovato. Prova con una specie, un luogo o un termine più semplice; consulta anche le fonti ufficiali.";
            results.append(message);
            return;
        }
        message.textContent = `${matches.length} ${matches.length === 1 ? "risultato trovato" : "risultati trovati"}.`;
        results.append(message);

        const list = document.createElement("ul");
        list.className = "norm-result-list";
        matches.forEach(({ element }) => {
            const item = document.createElement("li");
            const title = document.createElement("a");
            title.href = `#${element.id}`;
            title.textContent = element.dataset.title;
            const status = document.createElement("span");
            status.className = `norm-status ${element.dataset.status === "VERIFICATO" ? "verified" : element.dataset.status === "NON REPERITO" ? "missing" : "caution"}`;
            status.textContent = element.dataset.status;
            const answer = document.createElement("p");
            const cells = element.querySelectorAll("th, td");
            if (cells.length === 4) {
                answer.textContent = `Acque interne — ${cells[0].textContent}: taglia ${cells[1].textContent}, limite giornaliero ${cells[2].textContent}, divieto ${cells[3].textContent}. Un trattino indica un dato non riportato, non l'assenza di vincoli.`;
            } else {
                answer.textContent = element.querySelector(".search-answer").textContent.trim();
            }
            const source = document.getElementById(element.dataset.source).querySelector("a");
            const sourceLink = document.createElement("a");
            sourceLink.href = source.href;
            sourceLink.textContent = "Fonte ufficiale";
            sourceLink.target = "_blank";
            sourceLink.rel = "noopener noreferrer";
            item.append(title, document.createTextNode(" "), status, answer, sourceLink);
            list.append(item);
        });
        results.append(list);
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        search(input.value);
    });
    searchDisclosure.addEventListener("toggle", () => {
        if (searchDisclosure.open) input.focus({ preventScroll: true });
    });
    results.addEventListener("click", event => {
        if (event.target.closest('a[href^="#"]')) searchDisclosure.open = false;
    });
    document.querySelectorAll(".norm-suggestions button").forEach(button => {
        button.addEventListener("click", () => {
            input.value = button.dataset.query;
            search(input.value);
        });
    });
});
