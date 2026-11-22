const fs = require("fs");
let html = fs.readFileSync("/home/matteo/PescaLife/luoghi.html", "utf8");
const test = `<script>
window.addEventListener("error", event => (window.__errs = window.__errs || []).push(event.message));
window.addEventListener("load", () => {
    const result = {};
    const input = document.getElementById("luoghi-query");
    const status = document.getElementById("luoghi-filter-status");
    const byId = id => document.getElementById(id);
    const set = value => {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const visible = () => document.querySelectorAll("#luoghi-catalog .species-card:not([hidden])").length;
    const byName = name => [...document.querySelectorAll("#luoghi-catalog .species-card")]
        .find(card => (card.querySelector("h3").dataset.originalText || card.querySelector("h3").textContent) === name);
    const marks = name => {
        const card = byName(name);
        return card ? [...card.querySelectorAll("h3 mark")].map(mark => mark.textContent) : null;
    };

    result.initialVisible = visible();
    set("possera");
    result.posseraVisible = visible();
    result.posseraMarks = marks("Torrente Possera");
    set("cecina");
    result.cecinaVisible = visible();
    result.cecinaMarks = marks("Fiume Cecina");
    set("priorità A");
    result.priorityVisible = visible();
    set("luogo inesistente xyz");
    result.emptyVisible = !byId("luoghi-search-empty").hidden;
    result.emptyStatus = status.textContent;
    set("");
    result.restoredMarks = marks("Torrente Possera");
    result.markCount = document.querySelectorAll("#luoghi-catalog h3 mark").length;

    const typeRadio = document.querySelector('#luoghi-filter-options input[value="Fiume"]');
    typeRadio.checked = true;
    typeRadio.dispatchEvent(new Event("change", { bubbles: true }));
    result.typeFiltered = visible();
    result.filterLabel = byId("luoghi-filter-current").textContent;
    set("cecina");
    result.typeSearchVisible = visible();
    result.typeSearchMarks = marks("Fiume Cecina");

    byId("luoghi-search-reset").click();
    result.resetVisible = visible();
    result.resetQuery = input.value;
    result.resetLabel = byId("luoghi-filter-current").textContent;

    const sort = byId("luoghi-sort-length");
    sort.value = "desc";
    sort.dispatchEvent(new Event("change", { bubbles: true }));
    result.sortStatus = status.textContent;

    result.formHidden = byId("luoghi-search").hidden;
    result.clearHidden = byId("luoghi-search-clear").hidden;
    result.errors = window.__errs || [];
    document.title = "TEST:" + JSON.stringify(result);
});
</script></body>`;
html = html.replace("</body>", test);
fs.writeFileSync("/home/matteo/PescaLife/.luoghi-search-test.html", html);
console.log("test file created");
