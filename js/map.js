/* =====================================================================
   SIGHTINGS MAP (map.html)
   Two layers on one Leaflet map:
   - SIGHTINGS from js/sightings.js, also shown in the list under the map
   - CREATURES BY COUNTRY from js/world-cryptids.js: one pin per country
     at its capital, listing that country's creatures from the bestiary
   - The filters are kept in the address bar, so a filtered map can be
     shared as a link (e.g. map.html?creature=Mothman&sort=danger), and
     map.html?country=Japan opens on Japan's pin.
   - Privacy: every sighting is blurred to about 5 km, and the map can't
     zoom in past town level.
   - If the map library can't load (e.g. offline), the list still works.
   ===================================================================== */

(function () {

    // ---------- settings ----------
    const BLUR_DEGREES = 0.05;         // locations snap to a grid about 5 km wide
    const BLUR_RADIUS_METRES = 5000;   // "somewhere in here" circle around an opened sighting
    const MAX_ZOOM = 11;               // town level, never street level
    const FOCUS_ZOOM = 9;              // zoom used by the "Show on map" buttons (close enough to see the blur circle)
    const SIDE_PADDING = 40;           // px kept free at the left and right when zooming to results
    const COUNTRY_ZOOM = 5;            // zoom used when the page opens on one country (?country=...)
    const PLACEHOLDER = "assets/cryptid-placeholder.svg";   // for creatures without a free picture

    const DANGER_LABELS = { 1: "Harmless", 2: "Unsettling", 3: "Threatening", 4: "Dangerous", 5: "Extreme" };
    const EVIDENCE_LABELS = {
        none: "Eyewitness only",
        photo: "Photo",
        video: "Video",
        tracks: "Tracks or marks",
        audio: "Audio recording"
    };
    const SOURCE_LABELS = { community: "Community report", historical: "Historical record" };
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // creatures from the bestiary, placed by country (generated from Wikipedia)
    const WORLD = typeof WORLD_CRYPTIDS !== "undefined" ? WORLD_CRYPTIDS : [];
    const COUNTRIES = typeof WORLD_COUNTRIES !== "undefined" ? WORLD_COUNTRIES : {};
    const worldById = new Map(WORLD.map(creature => [creature.id, creature]));
    const hasCountries = Object.keys(COUNTRIES).length > 0;

    const DEFAULT_FILTERS = {
        sightings: true, countries: hasCountries,   // which layers are shown
        sort: "latest", creature: "", area: "", danger: "1", when: "any", source: "", evidence: false
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- page elements ----------
    const form = document.getElementById("map-filters");
    const controls = {
        sightings: document.getElementById("layer-sightings"),
        countries: document.getElementById("layer-countries"),
        sort: document.getElementById("filter-sort"),
        creature: document.getElementById("filter-creature"),
        area: document.getElementById("filter-area"),
        danger: document.getElementById("filter-danger"),
        when: document.getElementById("filter-when"),
        source: document.getElementById("filter-source"),
        evidence: document.getElementById("filter-evidence")
    };
    const resetButton = document.getElementById("filter-reset");
    const count = document.getElementById("map-count");
    const list = document.getElementById("sightings-list");
    const empty = document.getElementById("sightings-empty");
    const mapElement = document.getElementById("sightings-map");
    const mapCard = document.querySelector(".map-card");

    // ---------- small helpers ----------

    // makes an element with text (textContent is safe for any text)
    function el(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    const blur = value => Math.round(value / BLUR_DEGREES) * BLUR_DEGREES;
    const dangerOf = sighting => Math.min(5, Math.max(1, Math.round(sighting.danger))) || 1;
    const evidenceOf = sighting => EVIDENCE_LABELS[sighting.evidence] ? sighting.evidence : "none";

    // "2026-10-31", "1909-01" or "1735" -> a number we can sort and compare
    function timeOf(date) {
        const [year, month = 1, day = 1] = String(date).split("-").map(Number);
        return Date.UTC(year, month - 1, day);
    }

    // "2026-10-31" -> "31 Oct 2026", "1909-01" -> "Jan 1909", "1735" -> "1735"
    function formatDate(date) {
        const [year, month, day] = String(date).split("-");
        if (day) return `${Number(day)} ${MONTHS[month - 1]} ${year}`;
        if (month) return `${MONTHS[month - 1]} ${year}`;
        return year;
    }

    // the bestiary page for a creature name: hand-written pages (js/cryptids.js) first,
    // then the Wikipedia ones (js/world-cryptids.js)
    function bestiaryEntry(name) {
        const wanted = name.toLowerCase();
        const sameName = c => c.name.toLowerCase() === wanted || c.aliases.some(a => a.toLowerCase() === wanted);
        return (typeof CRYPTIDS !== "undefined" && CRYPTIDS.find(sameName)) || WORLD.find(sameName) || null;
    }

    // first sentence of a summary, for the small country popups
    function firstSentence(text, max = 130) {
        const sentence = (String(text).match(/^.*?[.!?](?=\s|$)/) || [String(text)])[0].trim();
        return sentence.length > max ? sentence.slice(0, max - 1).trimEnd() + "…" : sentence;
    }

    function dangerBadge(sighting) {
        const level = dangerOf(sighting);
        const badge = el("span", `${level} · ${DANGER_LABELS[level]}`, "danger-badge");
        badge.dataset.danger = level;
        return badge;
    }

    function sourceLine(sighting) {
        const by = sighting.source === "historical" ? "Source" : "Reported by";
        return `Evidence: ${EVIDENCE_LABELS[evidenceOf(sighting)]} · ${by}: ${sighting.reportedBy}`;
    }

    function bestiaryLink(sighting) {
        const entry = bestiaryEntry(sighting.creature);
        if (!entry) return null;
        const link = el("a", "Read the bestiary entry →");
        link.href = "cryptid.html?id=" + encodeURIComponent(entry.id);
        return link;
    }

    // ---------- fill the Creature and Region menus from both layers ----------
    // (the number after a creature is how many sightings it has)
    function fillMenu(select, values, counts = new Map()) {
        [...new Set(values)].sort((a, b) => a.localeCompare(b)).forEach(value => {
            const n = counts.get(value);
            select.append(new Option(n ? `${value} (${n})` : value, value));
        });
    }
    const sightingsPerCreature = new Map();
    SIGHTINGS.forEach(s => sightingsPerCreature.set(s.creature, (sightingsPerCreature.get(s.creature) || 0) + 1));
    fillMenu(controls.creature, [...sightingsPerCreature.keys(), ...WORLD.map(c => c.name)], sightingsPerCreature);
    fillMenu(controls.area, [...SIGHTINGS.map(s => s.area), ...Object.values(COUNTRIES).map(c => c.area)]);

    // no world data yet (js/world-cryptids.js is empty): hide the country layer's switch and key
    if (!hasCountries) {
        controls.countries.checked = false;
        controls.countries.closest("label").hidden = true;
        document.querySelectorAll(".legend-item--countries").forEach(item => { item.hidden = true; });
    }

    // ---------- reading and saving the filters ----------
    function readFilters() {
        return {
            sightings: controls.sightings.checked,
            countries: controls.countries.checked,
            sort: controls.sort.value,
            creature: controls.creature.value,
            area: controls.area.value,
            danger: Number(controls.danger.value),
            when: controls.when.value,
            source: controls.source.value,
            evidence: controls.evidence.checked
        };
    }

    function setFilters(values) {
        Object.entries(values).forEach(([key, value]) => {
            const control = controls[key];
            if (!control) return;
            if (control.type === "checkbox") {
                control.checked = value === true || value === "1";
            } else if ([...control.options].some(option => option.value === String(value))) {
                control.value = String(value);
            }
        });
    }

    function filtersFromAddressBar() {
        const params = new URLSearchParams(location.search);
        const values = {};
        Object.keys(DEFAULT_FILTERS).forEach(key => {
            if (params.has(key)) values[key] = params.get(key);
        });
        return values;
    }

    function saveFiltersToAddressBar(filters) {
        // some browsers block this for pages opened as local files, so it's optional
        try {
            const url = new URL(location.href);
            Object.keys(DEFAULT_FILTERS).forEach(key => {
                // tick boxes are saved as 1 / 0, and only when they differ from the default
                const isBox = typeof DEFAULT_FILTERS[key] === "boolean";
                const value = isBox ? (filters[key] ? "1" : "0") : String(filters[key]);
                const usual = isBox ? (DEFAULT_FILTERS[key] ? "1" : "0") : String(DEFAULT_FILTERS[key]);
                if (value && value !== usual) url.searchParams.set(key, value);
                else url.searchParams.delete(key);
            });
            history.replaceState(null, "", url);
        } catch (error) { /* the filters still work */ }
    }

    // ---------- filtering and sorting ----------
    const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

    function matches(sighting, filters) {
        const year = Number(String(sighting.date).slice(0, 4));
        if (filters.creature && sighting.creature !== filters.creature) return false;
        if (filters.area && sighting.area !== filters.area) return false;
        if (dangerOf(sighting) < filters.danger) return false;
        if (filters.source && sighting.source !== filters.source) return false;
        if (filters.evidence && evidenceOf(sighting) === "none") return false;
        if (filters.when === "year" && timeOf(sighting.date) < Date.now() - YEAR_MS) return false;
        if (filters.when === "since2000" && year < 2000) return false;
        if (filters.when === "before2000" && year >= 2000) return false;
        return true;
    }

    const SORTERS = {
        latest: (a, b) => timeOf(b.date) - timeOf(a.date),
        oldest: (a, b) => timeOf(a.date) - timeOf(b.date),
        danger: (a, b) => dangerOf(b) - dangerOf(a) || timeOf(b.date) - timeOf(a.date)
    };

    // country pins only follow the Region and Creature filters
    // (danger, dates, reports and evidence are about sightings)
    function countryMatches(info, filters) {
        if (filters.area && info.area !== filters.area) return false;
        if (!filters.creature) return true;
        const wanted = filters.creature.toLowerCase();
        return info.creatures.some(id => {
            const creature = worldById.get(id);
            return creature && (creature.name.toLowerCase() === wanted || creature.aliases.some(a => a.toLowerCase() === wanted));
        });
    }

    // ---------- the map (skipped if Leaflet couldn't load) ----------
    let map = null;
    let markerLayer = null;
    let countryLayer = null;
    let areaCircle = null;
    const markers = new Map();          // sighting -> its marker
    const countryMarkers = new Map();   // country name -> its marker

    // open-book icon for the country pins
    const BOOK_ICON = '<span class="country-pin"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">' +
        '<path d="M2 5.5C5 4 8.5 4 11.2 5.6v13.6C8.5 17.6 5 17.6 2 19.1zM22 5.5C19 4 15.5 4 12.8 5.6v13.6' +
        'c2.7-1.6 6.2-1.6 9.2-.1z" fill="currentColor"/></svg></span>';

    // popup for a country pin: its 2-3 creatures with a picture, a tag and a link to the bestiary
    function makeCountryPopup(country, info) {
        const box = el("div", undefined, "popup country-popup");
        box.append(el("h3", country, "popup-title"), el("p", `Capital: ${info.capital} · ${info.area}`, "popup-meta"));
        const items = el("ul", undefined, "country-creatures");
        info.creatures.forEach(id => {
            const creature = worldById.get(id);
            if (!creature) return;
            const page = bestiaryEntry(creature.name) || creature;   // a hand-written page wins
            const picture = document.createElement("img");
            picture.src = creature.image ? creature.image.src : PLACEHOLDER;
            picture.alt = "";
            picture.width = 44;
            picture.height = 44;
            if (!creature.image) picture.className = "is-placeholder";
            const link = el("a", creature.name);
            link.href = "cryptid.html?id=" + encodeURIComponent(page.id);
            const text = el("div");
            text.append(link, " ",
                el("span", creature.kind === "cryptid" ? "Cryptid" : "Folklore", "kind-tag kind-tag--" + creature.kind),
                el("p", firstSentence(creature.summary), "popup-meta"));
            const item = el("li");
            item.append(picture, text);
            items.append(item);
        });
        box.append(items);
        return box;
    }

    function makePopup(sighting) {
        const box = el("div", undefined, "popup");
        const top = el("p", undefined, "popup-top");
        top.append(dangerBadge(sighting), " ", el("span", sighting.creature, "popup-creature"));
        box.append(
            top,
            el("h3", sighting.title, "popup-title"),
            el("p", `${formatDate(sighting.date)} · ${sighting.place}`, "popup-meta"),
            el("p", sighting.summary),
            el("p", sourceLine(sighting), "popup-meta")
        );
        const link = bestiaryLink(sighting);
        if (link) box.append(link);
        return box;
    }

    if (typeof L !== "undefined") {
        map = L.map(mapElement, {
            minZoom: 2,
            maxZoom: MAX_ZOOM,
            scrollWheelZoom: false,       // turned on after a click, so the page can still scroll past the map
            attributionControl: false,    // the credits are under the map instead (the frame would cover them)
            maxBounds: [[-85, -180], [85, 180]],
            maxBoundsViscosity: 1
        });

        // OpenTopoMap: free, no account key, and it also works when the page is opened as a
        // local file (OpenStreetMap's own servers block that). Credits are under the map.
        L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
            subdomains: "abc",
            noWrap: true
        }).addTo(map);

        // scroll-to-zoom only while the visitor is using the map
        map.on("click focus", () => map.scrollWheelZoom.enable());
        map.on("mouseout blur", () => map.scrollWheelZoom.disable());

        // extra button under + / −: zoom back out to everything that matches the filters
        const ShowAllControl = L.Control.extend({
            options: { position: "topleft" },
            onAdd() {
                const bar = L.DomUtil.create("div", "leaflet-bar");
                const button = L.DomUtil.create("a", "map-show-all", bar);
                button.href = "#";
                button.title = "Zoom to all results";
                button.setAttribute("role", "button");
                button.setAttribute("aria-label", "Zoom to all results");
                button.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
                    '<path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
                L.DomEvent.disableClickPropagation(bar);
                L.DomEvent.on(button, "click", event => {
                    L.DomEvent.preventDefault(event);
                    fitToResults();
                });
                return bar;
            }
        });
        new ShowAllControl().addTo(map);

        areaCircle = L.circle([0, 0], {
            radius: BLUR_RADIUS_METRES,
            color: "#2a1c1c",
            weight: 1,
            dashArray: "4 4",
            fillColor: "#b3122e",
            fillOpacity: 0.12,
            interactive: false
        });
        countryLayer = L.layerGroup().addTo(map);
        markerLayer = L.layerGroup().addTo(map);

        // one pin per country, at its capital, drawn underneath the sightings
        Object.entries(COUNTRIES).forEach(([country, info]) => {
            const names = info.creatures.map(id => (worldById.get(id) || {}).name).filter(Boolean);
            const marker = L.marker([info.lat, info.lng], {
                icon: L.divIcon({
                    className: "country-marker",
                    html: BOOK_ICON,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                    popupAnchor: [0, -12]
                }),
                title: `${country} (${info.capital}): ${names.join(", ")}`,
                zIndexOffset: -1000,
                riseOnHover: true
            });
            marker.bindPopup(() => makeCountryPopup(country, info), { maxWidth: 300, minWidth: 240 });
            countryMarkers.set(country, marker);
        });

        SIGHTINGS.forEach(sighting => {
            const level = dangerOf(sighting);
            const shape = sighting.source === "historical" ? "historical" : "community";
            const marker = L.marker([blur(sighting.lat), blur(sighting.lng)], {
                icon: L.divIcon({
                    className: "sighting-marker",
                    html: `<span class="sighting-pin sighting-pin--${shape}" data-danger="${level}">${level}</span>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                    popupAnchor: [0, -14]
                }),
                title: `${sighting.creature}: ${sighting.title} (danger ${level})`,
                zIndexOffset: level * 100,   // more dangerous sightings are drawn on top
                riseOnHover: true
            });
            marker.bindPopup(() => makePopup(sighting), { maxWidth: 280 });
            marker.on("popupopen", () => areaCircle.setLatLng(marker.getLatLng()).addTo(map));
            marker.on("popupclose", () => areaCircle.remove());
            markers.set(sighting, marker);
        });

        // keep opened popups out from under the frame artwork (its size changes with the page width)
        const keepPopupsClearOfFrame = () => {
            const padding = framePadding();
            [...markers.values(), ...countryMarkers.values()].forEach(marker => {
                marker.getPopup().options.autoPanPaddingTopLeft = padding.topLeft;
                marker.getPopup().options.autoPanPaddingBottomRight = padding.bottomRight;
            });
        };
        keepPopupsClearOfFrame();
        map.on("resize", keepPopupsClearOfFrame);

        map.setView([30, 0], 2);
    } else {
        mapElement.classList.add("map-canvas--offline");
        mapElement.textContent = "The map couldn't load (are you offline?). The list below still shows every sighting.";
    }

    let currentResults = [];     // sightings shown right now
    let currentCountries = [];   // country pins shown right now

    // how much of the map the Nessie frame covers at the top and bottom, measured live
    // because the artwork grows and shrinks with the page width
    function framePadding() {
        const mapBox = mapElement.getBoundingClientRect();
        const topArt = document.querySelector(".map-frame-top").getBoundingClientRect();
        const bottomArt = document.querySelector(".map-frame-bottom").getBoundingClientRect();
        return {
            topLeft: L.point(SIDE_PADDING, Math.max(0, topArt.bottom - mapBox.top) + 10),
            bottomRight: L.point(SIDE_PADDING, Math.max(0, mapBox.bottom - bottomArt.top) + 10)
        };
    }

    function fitToResults(animate = !reduceMotion) {
        if (!map) return;
        const points = [
            ...currentResults.map(s => markers.get(s).getLatLng()),
            ...currentCountries.map(c => countryMarkers.get(c).getLatLng())
        ];
        if (points.length === 0) return;
        const bounds = L.latLngBounds(points);
        const padding = framePadding();
        map.fitBounds(bounds, {
            paddingTopLeft: padding.topLeft,
            paddingBottomRight: padding.bottomRight,
            maxZoom: 6,
            animate
        });
    }

    function showOnMap(sighting) {
        const marker = markers.get(sighting);
        if (!map || !marker) return;
        mapCard.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        map.once("moveend", () => marker.openPopup());
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), FOCUS_ZOOM), { animate: !reduceMotion });
    }

    // ---------- the list ----------
    function makeListItem(sighting) {
        const item = el("li", undefined, "sighting");
        item.dataset.danger = dangerOf(sighting);

        const head = el("div", undefined, "sighting-head");
        const date = el("time", formatDate(sighting.date), "sighting-date");
        date.dateTime = sighting.date;
        head.append(dangerBadge(sighting), el("span", SOURCE_LABELS[sighting.source] || "", "source-tag"), date);

        const where = el("p", undefined, "sighting-meta");
        where.append(el("strong", sighting.creature), ` · ${sighting.place}`);

        const actions = el("div", undefined, "sighting-actions");
        if (map) {
            const button = el("button", "Show on map");
            button.type = "button";
            button.addEventListener("click", () => showOnMap(sighting));
            actions.append(button);
        }
        const link = bestiaryLink(sighting);
        if (link) actions.append(link);

        item.append(
            head,
            el("h3", sighting.title, "sighting-title"),
            where,
            el("p", sighting.summary, "sighting-summary"),
            el("p", sourceLine(sighting), "sighting-meta"),
            actions
        );
        return item;
    }

    // ---------- draw everything for the current filters ----------
    let shownKey = null;   // which pins are on the map, to know when to re-zoom

    function render(animate = !reduceMotion) {
        const filters = readFilters();
        currentResults = filters.sightings
            ? SIGHTINGS.filter(sighting => matches(sighting, filters)).sort(SORTERS[filters.sort] || SORTERS.latest)
            : [];
        currentCountries = filters.countries
            ? Object.keys(COUNTRIES).filter(country => countryMatches(COUNTRIES[country], filters))
            : [];

        list.replaceChildren(...currentResults.map(makeListItem));
        empty.hidden = currentResults.length > 0;
        empty.textContent = filters.sightings
            ? "No sightings match these filters. Try removing one."
            : "Sightings are switched off. Tick \"Sightings\" under Show on map to see them.";

        const parts = [];
        if (filters.sightings) {
            parts.push(currentResults.length === SIGHTINGS.length
                ? `all ${SIGHTINGS.length} sightings`
                : `${currentResults.length} of ${SIGHTINGS.length} sightings`);
        }
        if (filters.countries) {
            parts.push(`${currentCountries.length} ${currentCountries.length === 1 ? "country" : "countries"} with bestiary creatures`);
        }
        count.textContent = parts.length ? "Showing " + parts.join(" and ") : "Nothing shown. Tick a layer under Show on map.";

        if (map) {
            markerLayer.clearLayers();
            currentResults.forEach(sighting => markerLayer.addLayer(markers.get(sighting)));
            countryLayer.clearLayers();
            currentCountries.forEach(country => countryLayer.addLayer(countryMarkers.get(country)));

            // zoom to the results when WHICH pins are shown changes (not when only the order changes)
            const key = currentResults.map(s => SIGHTINGS.indexOf(s)).sort((a, b) => a - b).join(",") +
                "|" + currentCountries.join(",");
            if (key !== shownKey) {
                shownKey = key;
                fitToResults(animate);
            }
        }

        saveFiltersToAddressBar(filters);
    }

    // map.html?country=Japan: open on that country's pin
    function focusCountry(country) {
        const marker = countryMarkers.get(country);
        if (!map || !marker) return;
        if (!countryLayer.hasLayer(marker)) {   // make sure its pin is showing
            setFilters({ countries: true, area: "", creature: "" });
            render(false);
        }
        map.once("moveend", () => marker.openPopup());
        map.setView(marker.getLatLng(), COUNTRY_ZOOM, { animate: false });
    }

    form.addEventListener("change", () => render());
    resetButton.addEventListener("click", () => {
        setFilters(DEFAULT_FILTERS);
        render();
    });

    // start with any filters from the address bar (e.g. map.html?creature=Mothman)
    setFilters(filtersFromAddressBar());
    render(false);
    const startCountry = new URLSearchParams(location.search).get("country");
    if (startCountry) focusCountry(startCountry);
})();
