/* =====================================================================
   BESTIARY LIST (bestiary.html)
   Shows a card for every cryptid in js/cryptids.js and filters them
   as you type. bestiary.html?q=ohio opens with "ohio" already searched,
   which is how the sidebar search box on every page works.
   ===================================================================== */

(function () {
    const grid  = document.getElementById("bestiary-grid");
    const input = document.getElementById("bestiary-search");
    const count = document.getElementById("bestiary-count");
    const empty = document.getElementById("bestiary-empty");
    const hint  = document.getElementById("bestiary-hint");

    // words that don't help find a cryptid ("cryptids near me" -> nothing to match)
    const IGNORED_WORDS = ["cryptid", "cryptids", "near", "me", "in", "the", "around", "a", "of"];

    // everything a search can match: name, other names, region and area
    function searchText(cryptid) {
        return [cryptid.name, ...cryptid.aliases, cryptid.region, cryptid.area, cryptid.culture]
            .join(" ")
            .toLowerCase();
    }

    function makeCard(cryptid) {
        const card = document.createElement("a");
        card.className = "card bestiary-card";
        card.href = "cryptid.html?id=" + encodeURIComponent(cryptid.id);

        const img = document.createElement("img");
        img.src = cryptid.image;
        img.alt = "";              // the name below already describes the link
        img.loading = "lazy";

        const name = document.createElement("span");
        name.className = "bestiary-name";
        name.textContent = cryptid.name;

        const region = document.createElement("span");
        region.className = "bestiary-region";
        region.textContent = cryptid.region;

        card.append(img, name, region);
        return card;
    }

    function render() {
        const query = input.value.trim();
        const words = query.toLowerCase().split(/\s+/)
            .filter(word => word && !IGNORED_WORDS.includes(word));

        // a cryptid matches when it contains every search word
        const matches = CRYPTIDS.filter(cryptid =>
            words.every(word => searchText(cryptid).includes(word))
        );

        grid.replaceChildren(...matches.map(makeCard));
        empty.hidden = matches.length > 0;
        hint.hidden = !/near me/i.test(query);
        count.textContent = query
            ? `${matches.length} of ${CRYPTIDS.length} cryptids match "${query}"`
            : `${CRYPTIDS.length} cryptids in the bestiary`;

        // keep the address bar in sync so a search can be shared as a link
        // (some browsers block this when the page is opened as a local file, so it's optional)
        try {
            const url = new URL(location.href);
            if (query) url.searchParams.set("q", query); else url.searchParams.delete("q");
            history.replaceState(null, "", url);
        } catch (error) { /* not important, the search still works */ }
    }

    // start with whatever was searched in the sidebar (bestiary.html?q=...)
    input.value = new URLSearchParams(location.search).get("q") || "";
    input.addEventListener("input", render);
    render();
})();
