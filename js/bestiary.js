/* =====================================================================
   BESTIARY LIST (bestiary.html)
   Shows a card for every creature and filters them as you type:
   - the hand-written entries in js/cryptids.js (full pages)
   - the Wikipedia entries in js/world-cryptids.js (short pages, up to
     3 per country, made by tools/build_world_cryptids.py)
   bestiary.html?q=ohio&area=Europe&kind=folklore opens with those filters
   set, which is how the sidebar search box on every page works.
   ===================================================================== */

(function () {
    const grid = document.getElementById("bestiary-grid");
    const input = document.getElementById("bestiary-search");
    const areaSelect = document.getElementById("bestiary-area");
    const kindSelect = document.getElementById("bestiary-kind");
    const count = document.getElementById("bestiary-count");
    const empty = document.getElementById("bestiary-empty");
    const hint = document.getElementById("bestiary-hint");

    const PLACEHOLDER = "assets/cryptid-placeholder.svg";
    const KIND_LABELS = { cryptid: "Cryptid", folklore: "Folklore" };

    // words that don't help find a creature ("cryptids near me" -> nothing to match)
    const IGNORED_WORDS = ["cryptid", "cryptids", "creature", "creatures", "near", "me", "in", "the", "around", "a", "of"];

    const world = typeof WORLD_CRYPTIDS !== "undefined" ? WORLD_CRYPTIDS : [];
    const worldCountries = typeof WORLD_COUNTRIES !== "undefined" ? WORLD_COUNTRIES : {};

    // one list for both sources; a hand-written page wins when both have the same creature
    const handWrittenNames = new Set(CRYPTIDS.flatMap(c => [c.name, ...c.aliases]).map(n => n.toLowerCase()));
    const creatures = [
        ...CRYPTIDS.map(c => ({
            id: c.id,
            name: c.name,
            kind: "cryptid",
            image: c.image,
            hasImage: true,
            place: c.region,
            areas: [c.area],
            searchText: [c.name, ...c.aliases, c.region, c.area, c.culture].join(" ").toLowerCase()
        })),
        ...world
            .filter(w => !handWrittenNames.has(w.name.toLowerCase()))
            .map(w => ({
                id: w.id,
                name: w.name,
                kind: w.kind,
                image: w.image ? w.image.src : PLACEHOLDER,
                hasImage: Boolean(w.image),
                place: w.countries.join(", "),
                areas: [...new Set(w.countries.map(c => (worldCountries[c] || {}).area).filter(Boolean))],
                searchText: [w.name, ...w.aliases, ...w.countries, w.culture, w.type].join(" ").toLowerCase()
            }))
    ].sort((a, b) => a.name.localeCompare(b.name));

    // Region menu, with how many creatures each region has
    const perArea = new Map();
    creatures.forEach(c => c.areas.forEach(a => perArea.set(a, (perArea.get(a) || 0) + 1)));
    [...perArea.keys()].sort().forEach(area => areaSelect.append(new Option(`${area} (${perArea.get(area)})`, area)));

    function el(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    function makeCard(creature) {
        const card = el("a", undefined, "card bestiary-card");
        card.href = "cryptid.html?id=" + encodeURIComponent(creature.id);

        const img = document.createElement("img");
        img.src = creature.image;
        img.alt = "";              // the name below already describes the link
        img.loading = "lazy";      // only pictures near the screen are downloaded
        img.decoding = "async";
        if (!creature.hasImage) img.className = "is-placeholder";

        card.append(
            img,
            el("span", creature.name, "bestiary-name"),
            el("span", creature.place, "bestiary-region"),
            el("span", KIND_LABELS[creature.kind], "kind-tag kind-tag--" + creature.kind)
        );
        return card;
    }

    function render() {
        const query = input.value.trim();
        const area = areaSelect.value;
        const kind = kindSelect.value;
        const words = query.toLowerCase().split(/\s+/)
            .filter(word => word && !IGNORED_WORDS.includes(word));

        // a creature matches when it is in the region, of the kind, and contains every search word
        const matches = creatures.filter(c =>
            (!area || c.areas.includes(area)) &&
            (!kind || c.kind === kind) &&
            words.every(word => c.searchText.includes(word))
        );

        grid.replaceChildren(...matches.map(makeCard));
        empty.hidden = matches.length > 0;
        hint.hidden = !/near me/i.test(query);
        count.textContent = query || area || kind
            ? `${matches.length} of ${creatures.length} creatures match`
            : `${creatures.length} creatures in the bestiary`;

        // keep the address bar in sync so a search can be shared as a link
        // (some browsers block this when the page is opened as a local file, so it's optional)
        try {
            const url = new URL(location.href);
            [["q", query], ["area", area], ["kind", kind]].forEach(([key, value]) => {
                if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
            });
            history.replaceState(null, "", url);
        } catch (error) { /* not important, the search still works */ }
    }

    // start with whatever was in the address bar (bestiary.html?q=...)
    const params = new URLSearchParams(location.search);
    input.value = params.get("q") || "";
    [[areaSelect, params.get("area")], [kindSelect, params.get("kind")]].forEach(([select, value]) => {
        if (value && [...select.options].some(option => option.value === value)) select.value = value;
    });
    input.addEventListener("input", render);
    areaSelect.addEventListener("change", render);
    kindSelect.addEventListener("change", render);
    render();
})();
