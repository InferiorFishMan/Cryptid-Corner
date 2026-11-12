/* =====================================================================
   BESTIARY ENTRY (cryptid.html)
   Reads ?id=... from the address bar and fills every data-field="..."
   slot in cryptid.html from one of two places:
   - js/cryptids.js        hand-written entries, with every section
   - js/world-cryptids.js  short entries made from Wikipedia; they hide the
                           sections there is no information for yet
   To change the LAYOUT, edit cryptid.html. To change the CONTENT, edit
   js/cryptids.js (or re-run tools/build_world_cryptids.py).
   ===================================================================== */

(function () {
    const id = new URLSearchParams(location.search).get("id");
    const world = typeof WORLD_CRYPTIDS !== "undefined" ? WORLD_CRYPTIDS : [];
    const handWritten = CRYPTIDS.find(c => c.id === id);
    const fromWikipedia = handWritten ? null : world.find(c => c.id === id);

    if (!handWritten && !fromWikipedia) {
        document.getElementById("not-found").hidden = false;
        document.title = "Creature not found – Cryptid Corner";
        return;
    }

    const entry = document.getElementById("entry");
    const slot = field => entry.querySelector(`[data-field="${field}"]`);
    const showSection = (name, visible) => { entry.querySelector(`[data-section="${name}"]`).hidden = !visible; };
    const showFact = (name, visible) => { entry.querySelector(`[data-fact="${name}"]`).hidden = !visible; };

    // small helpers: make an element with text (textContent is safe for any text), or a link
    function el(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }
    function link(text, href) {
        const a = el("a", text);
        a.href = href;
        return a;
    }

    const PLACEHOLDER = "assets/cryptid-placeholder.svg";
    const STRENGTH_LABELS = {
        1: "Folklore only",
        2: "Weak",
        3: "Mixed",
        4: "Strong",
        5: "Physical evidence"
    };
    const CLAIM_LABELS = { folklore: "Folklore", sighting: "Sighting", evidence: "Evidence" };

    // ---------- the same for both kinds of entry ----------
    const creature = handWritten || fromWikipedia;
    document.title = `${creature.name} – Bestiary – Cryptid Corner`;
    slot("name").textContent = creature.name;
    slot("aliases").textContent = creature.aliases.join(", ");
    slot("aliases").parentElement.hidden = creature.aliases.length === 0;
    // the map shows its sightings and the countries it comes from
    slot("mapLink").href = "map.html?creature=" + encodeURIComponent(creature.name);

    if (handWritten) fillHandWritten(handWritten);
    else fillFromWikipedia(fromWikipedia);
    entry.hidden = false;

    // ---------- hand-written entry (js/cryptids.js): every section ----------
    function fillHandWritten(cryptid) {
        ["region", "culture", "firstReported", "description", "origin"].forEach(field => {
            slot(field).textContent = cryptid[field];
        });
        slot("type").textContent = "Cryptid";
        slot("image").src = cryptid.image;
        slot("image").alt = cryptid.imageAlt;

        // evidence strength: 5 boxes + a label
        const meter = el("span", undefined, "meter");
        meter.setAttribute("aria-hidden", "true");   // the text label says the same thing
        for (let i = 1; i <= 5; i++) {
            meter.append(el("span", undefined, i <= cryptid.evidenceStrength ? "filled" : ""));
        }
        slot("evidenceStrength").replaceChildren(
            meter,
            `${cryptid.evidenceStrength}/5 · ${STRENGTH_LABELS[cryptid.evidenceStrength]}`
        );

        // simple lists
        slot("sources").replaceChildren(
            ...(cryptid.sources.length
                ? cryptid.sources.map(source => el("li", source))
                : [el("li", "No sources added yet.", "muted")])
        );
        slot("explanations").replaceChildren(...cryptid.explanations.map(text => el("li", text)));

        // claims, each with its Folklore / Sighting / Evidence tag
        slot("claims").replaceChildren(...cryptid.claims.map(claim => {
            const item = el("li");
            item.dataset.type = claim.type;
            const tag = el("span", CLAIM_LABELS[claim.type], "claim-tag");
            tag.dataset.type = claim.type;
            item.append(tag, el("span", claim.year, "claim-year"), el("span", claim.text));
            return item;
        }));

        // discussion board
        slot("board").textContent = cryptid.board;

        // related gear, with clear affiliate labels
        slot("products").replaceChildren(...cryptid.products.map(product => {
            const item = el("li");
            const productLink = link(product.name, product.url);
            if (product.affiliate) productLink.rel = "sponsored noopener";
            const label = el("span",
                product.affiliate ? "Affiliate link" : "Cryptid Corner Store",
                "product-tag" + (product.affiliate ? " is-affiliate" : ""));
            item.append(productLink, label, el("span", product.note, "product-note"));
            return item;
        }));
    }

    // ---------- short entry from Wikipedia (js/world-cryptids.js) ----------
    function fillFromWikipedia(creature) {
        // each country links to its pin on the map
        const countries = [];
        creature.countries.forEach((country, i) => {
            if (i) countries.push(", ");
            countries.push(link(country, "map.html?country=" + encodeURIComponent(country)));
        });
        slot("region").replaceChildren(...countries);

        slot("type").textContent = creature.kind === "folklore"
            ? "Folklore creature"
            : (creature.type && creature.type !== "Cryptid" ? `Cryptid · ${creature.type}` : "Cryptid");
        slot("culture").textContent = creature.culture;
        showFact("culture", Boolean(creature.culture));
        showFact("firstReported", false);
        showFact("evidenceStrength", false);

        // description, credited to Wikipedia as its licence asks
        slot("description").textContent = creature.summary;
        slot("wikiCredit").replaceChildren(
            "Description from ", link("Wikipedia", creature.wikipedia),
            " (", link("CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"), ")."
        );
        slot("wikiCredit").hidden = false;
        slot("shortNote").hidden = false;

        // picture with its artist and licence, or a placeholder
        const image = slot("image");
        if (creature.image) {
            image.src = creature.image.src;
            image.alt = creature.image.alt;
            const licence = creature.image.licenseUrl
                ? link(creature.image.license, creature.image.licenseUrl)
                : creature.image.license;
            const parts = ["Picture: ", creature.image.artist, " · ", licence];
            if (creature.image.source) parts.push(" · ", link("source", creature.image.source));
            slot("imageCredit").replaceChildren(...parts);
            slot("imageCredit").hidden = false;
        } else {
            image.src = PLACEHOLDER;
            image.alt = "";
            image.classList.add("is-placeholder");
        }

        ["origin", "claims", "explanations", "discussion", "gear"].forEach(section => showSection(section, false));
    }
})();
