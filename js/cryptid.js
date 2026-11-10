/* =====================================================================
   BESTIARY ENTRY (cryptid.html)
   Reads ?id=... from the address bar, finds that cryptid in
   js/cryptids.js and fills every data-field="..." slot in cryptid.html.
   To change the LAYOUT, edit cryptid.html. To change the CONTENT,
   edit js/cryptids.js. This file just connects the two.
   ===================================================================== */

(function () {
    const id = new URLSearchParams(location.search).get("id");
    const cryptid = CRYPTIDS.find(c => c.id === id);

    if (!cryptid) {
        document.getElementById("not-found").hidden = false;
        document.title = "Cryptid not found – Cryptid Corner";
        return;
    }

    const entry = document.getElementById("entry");
    const slot = field => entry.querySelector(`[data-field="${field}"]`);

    // small helper: makes an element with text (textContent is safe for any text)
    function el(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    const STRENGTH_LABELS = {
        1: "Folklore only",
        2: "Weak",
        3: "Mixed",
        4: "Strong",
        5: "Physical evidence"
    };

    const CLAIM_LABELS = { folklore: "Folklore", sighting: "Sighting", evidence: "Evidence" };

    // ---------- plain text fields ----------
    document.title = `${cryptid.name} – Bestiary – Cryptid Corner`;
    ["name", "region", "culture", "firstReported", "description", "origin"].forEach(field => {
        slot(field).textContent = cryptid[field];
    });

    // ---------- aliases (hide the line if there are none) ----------
    slot("aliases").textContent = cryptid.aliases.join(", ");
    slot("aliases").parentElement.hidden = cryptid.aliases.length === 0;

    // ---------- image ----------
    slot("image").src = cryptid.image;
    slot("image").alt = cryptid.imageAlt;

    // ---------- evidence strength: 5 boxes + a label ----------
    const meter = el("span", undefined, "meter");
    meter.setAttribute("aria-hidden", "true");   // the text label says the same thing
    for (let i = 1; i <= 5; i++) {
        meter.append(el("span", undefined, i <= cryptid.evidenceStrength ? "filled" : ""));
    }
    slot("evidenceStrength").replaceChildren(
        meter,
        `${cryptid.evidenceStrength}/5 · ${STRENGTH_LABELS[cryptid.evidenceStrength]}`
    );

    // ---------- simple lists ----------
    slot("sources").replaceChildren(
        ...(cryptid.sources.length
            ? cryptid.sources.map(source => el("li", source))
            : [el("li", "No sources added yet.", "muted")])
    );
    slot("explanations").replaceChildren(...cryptid.explanations.map(text => el("li", text)));

    // ---------- claims, each with its Folklore / Sighting / Evidence tag ----------
    slot("claims").replaceChildren(...cryptid.claims.map(claim => {
        const item = el("li");
        item.dataset.type = claim.type;
        const tag = el("span", CLAIM_LABELS[claim.type], "claim-tag");
        tag.dataset.type = claim.type;
        item.append(tag, el("span", claim.year, "claim-year"), el("span", claim.text));
        return item;
    }));

    // ---------- discussion board ----------
    slot("board").textContent = cryptid.board;

    // ---------- related gear, with clear affiliate labels ----------
    slot("products").replaceChildren(...cryptid.products.map(product => {
        const item = el("li");
        const link = el("a", product.name);
        link.href = product.url;
        if (product.affiliate) link.rel = "sponsored noopener";
        const label = el("span",
            product.affiliate ? "Affiliate link" : "Cryptid Corner Store",
            "product-tag" + (product.affiliate ? " is-affiliate" : ""));
        item.append(link, label, el("span", product.note, "product-note"));
        return item;
    }));

    entry.hidden = false;
})();
