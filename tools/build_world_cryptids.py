#!/usr/bin/env python3
"""
WORLD BESTIARY BUILDER
======================
Builds the "world" part of the Cryptid Corner bestiary and map from Wikipedia:

    js/world-cryptids.js     WORLD_COUNTRIES + WORLD_CRYPTIDS (generated - don't edit by hand)
    assets/cryptids/*.webp   small pictures (only freely licensed ones)

For every country it picks up to MAX_PER_COUNTRY creatures, using two kinds of source:
  - cryptids   from Wikipedia's "List of cryptids" and "List of lake monsters"
  - folklore   from the "<Nationality> legendary creatures" categories and the
               "List of legendary creatures (A)...(Z)" pages
The country's best-known cryptid comes first (if it has one), then the best-known
creatures of any kind (fame = Wikipedia page views over the last 60 days).
Each country is pinned at its capital on the map.

HOW TO RUN
    pip install pillow
    python3 tools/build_world_cryptids.py            # re-uses saved answers in tools/.cache
    python3 tools/build_world_cryptids.py --refresh  # asks Wikipedia again for everything

Read the report it prints at the end (cultures it couldn't place, countries with no
creatures, what it skipped), adjust the settings below if needed, and run it again.
The second run is fast because answers are cached.

Wikipedia text is CC BY-SA 4.0 and every picture keeps its own free licence; the
bestiary pages credit both.
"""

import argparse
import hashlib
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import date
from html import unescape
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("This tool needs Pillow to make the pictures. Install it with:  pip install pillow")


# =====================================================================
# SETTINGS
# =====================================================================

MAX_PER_COUNTRY = 3        # creatures per country
SUMMARY_SENTENCES = 3      # sentences of the Wikipedia intro to keep
THUMB_WIDTH = 400          # picture width in pixels
WEBP_QUALITY = 80
REQUEST_GAP = 2.0          # seconds between requests; grows by itself if Wikipedia says "too many requests"

# Wikimedia asks automated tools to say who they are. Add an email or web address here
# if you like; it is left empty so nothing personal is sent by default.
CONTACT = ""
USER_AGENT = "student-bestiary-builder/1.0 (educational project; low request rate" + (f"; {CONTACT}" if CONTACT else "") + ")"

# Treat England, Scotland, Wales and Northern Ireland as separate countries with their own
# capitals (Wikipedia's folklore categories are split this way too).
SPLIT_UK = True
UK_NATIONS = {"England": "London", "Scotland": "Edinburgh", "Wales": "Cardiff", "Northern Ireland": "Belfast"}

# Article titles that are never included. Wendigo and Skinwalker come from living
# Indigenous spiritual traditions and were left out of the sightings map for the same reason.
EXCLUDE = {
    "Wendigo", "Skin-walker", "Skinwalker",
    "Jinn",                                                   # part of Islamic belief
    "Ded Moroz", "Koshchei", "Zahhak", "Lemminkäinen",        # legendary people/figures, not creatures
    "Ifrit",                                                  # a class of jinn
    "Naga fireball",                                          # a light phenomenon, not a creature
}

# Culture labels that are religions, books or whole continents rather than one country.
SKIP_CULTURES = {
    "heraldic", "heraldry", "medieval bestiaries", "bestiary", "bestiaries", "medieval", "european",
    "christian", "christianity", "biblical", "jewish", "hebrew", "islamic", "islam", "hindu",
    "hinduism", "buddhist", "buddhism", "jain", "jainism", "zoroastrian", "zoroastrianism",
    "gnostic", "manichaean", "alchemy", "alchemical", "classical", "worldwide", "various",
    "slavic", "turkic", "celtic", "germanic", "finno-ugric", "baltic", "african", "east african",
    "west african", "central african", "southern african", "bantu", "native american",
    "first nations", "polynesian", "melanesian", "melanesia", "micronesian", "caribbean",
    "central asian", "arctic", "romani", "latin american", "south american", "mesoamerican",
    "middle eastern", "near eastern", "himalayan", "asian", "oceanian", "vodou", "voodoo",
    "kabbalah", "occult", "christian demonology", "demonology", "cryptozoology", "urban legend",
}

# Labels that mean the entry belongs to a religion's beliefs: such entries are skipped.
RELIGIOUS_CULTURES = {
    "christian", "christianity", "biblical", "jewish", "hebrew", "islamic", "islam", "islamic belief",
    "hindu", "hinduism", "buddhist", "buddhism", "jain", "jainism", "zoroastrian", "zoroastrianism",
    "judeo-christian", "abrahamic", "yazidi", "sanamahism", "vodou", "voodoo", "kabbalah",
}

# Culture / nationality label (lower case) -> country. Used for the folklore lists and categories.
CULTURE_TO_COUNTRY = {
    # Europe
    "greek": "Greece", "ancient greek": "Greece", "byzantine": "Greece", "cypriot": "Cyprus",
    "roman": "Italy", "etruscan": "Italy", "italian": "Italy", "sicilian": "Italy", "sardinian": "Italy",
    "venetian": "Italy", "maltese": "Malta",
    "english": "England", "cornish": "England", "anglo-saxon": "England", "british": "England",
    "scottish": "Scotland", "scots": "Scotland", "scottish gaelic": "Scotland", "pictish": "Scotland",
    "orcadian": "Scotland", "shetland": "Scotland", "welsh": "Wales", "irish": "Ireland",
    "northern irish": "Northern Ireland", "manx": "Isle of Man",
    "french": "France", "breton": "France", "gaulish": "France", "occitan": "France", "corsican": "France",
    "basque": "Spain", "spanish": "Spain", "catalan": "Spain", "galician": "Spain", "asturian": "Spain",
    "cantabrian": "Spain", "canarian": "Spain", "portuguese": "Portugal",
    "german": "Germany", "austrian": "Austria", "swiss": "Switzerland", "dutch": "Netherlands",
    "frisian": "Netherlands", "flemish": "Belgium", "belgian": "Belgium", "walloon": "Belgium",
    "luxembourgish": "Luxembourg",
    "danish": "Denmark", "norwegian": "Norway", "norse": "Norway", "swedish": "Sweden",
    "finnish": "Finland", "icelandic": "Iceland", "faroese": "Faroe Islands", "sami": "Norway",
    "sámi": "Norway", "estonian": "Estonia", "latvian": "Latvia", "lithuanian": "Lithuania",
    "polish": "Poland", "czech": "Czech Republic", "bohemian": "Czech Republic", "slovak": "Slovakia",
    "hungarian": "Hungary", "magyar": "Hungary", "romanian": "Romania", "moldovan": "Moldova",
    "bulgarian": "Bulgaria", "serbian": "Serbia", "croatian": "Croatia", "slovene": "Slovenia",
    "slovenian": "Slovenia", "bosnian": "Bosnia and Herzegovina", "montenegrin": "Montenegro",
    "macedonian": "North Macedonia", "albanian": "Albania",
    "russian": "Russia", "ukrainian": "Ukraine", "belarusian": "Belarus",
    "georgian": "Georgia", "armenian": "Armenia", "azerbaijani": "Azerbaijan",
    "turkish": "Turkey", "ottoman": "Turkey", "anatolian": "Turkey",
    # peoples of Russia
    "yakut": "Russia", "yakuts": "Russia", "sakha": "Russia", "tatar": "Russia", "bashkir": "Russia",
    "chuvash": "Russia", "komi": "Russia", "mari": "Russia", "udmurt": "Russia", "evenk": "Russia",
    "evenki": "Russia", "chukchi": "Russia", "nenets": "Russia", "buryat": "Russia", "kalmyk": "Russia",
    "chechen": "Russia", "ossetian": "Russia", "circassian": "Russia", "siberian": "Russia",
    # Middle East and North Africa
    "persian": "Iran", "iranian": "Iran", "arabian": "Saudi Arabia", "arabic": "Saudi Arabia",
    "arab": "Saudi Arabia", "mesopotamian": "Iraq", "sumerian": "Iraq", "akkadian": "Iraq",
    "babylonian": "Iraq", "assyrian": "Iraq", "chaldean": "Iraq",
    "egyptian": "Egypt", "ancient egyptian": "Egypt", "ancient egypt": "Egypt", "coptic": "Egypt",
    "berber": "Morocco", "amazigh": "Morocco", "moroccan": "Morocco", "algerian": "Algeria",
    "tunisian": "Tunisia", "libyan": "Libya", "canaanite": "Lebanon", "phoenician": "Lebanon",
    "levantine": "Lebanon", "syrian": "Syria", "afghan": "Afghanistan",
    # Asia
    "japanese": "Japan", "ainu": "Japan", "okinawan": "Japan", "ryukyuan": "Japan",
    "chinese": "China", "tibetan": "China", "manchu": "China", "taiwanese": "Taiwan",
    "korean": "South Korea", "mongolian": "Mongolia", "mongol": "Mongolia",
    "vietnamese": "Vietnam", "thai": "Thailand", "siamese": "Thailand", "lao": "Laos",
    "laotian": "Laos", "khmer": "Cambodia", "cambodian": "Cambodia", "burmese": "Myanmar",
    "malay": "Malaysia", "malaysian": "Malaysia", "indonesian": "Indonesia", "javanese": "Indonesia",
    "balinese": "Indonesia", "sundanese": "Indonesia", "dayak": "Indonesia", "batak": "Indonesia",
    "minangkabau": "Indonesia", "philippine": "Philippines", "filipino": "Philippines",
    "tagalog": "Philippines", "visayan": "Philippines", "ilocano": "Philippines",
    "kapampangan": "Philippines", "bikolano": "Philippines", "singaporean": "Singapore",
    "indian": "India", "tamil": "India", "telugu": "India", "kannada": "India", "malayalam": "India",
    "assamese": "India", "meitei": "India", "manipuri": "India", "marathi": "India",
    "gujarati": "India", "punjabi": "India", "kashmiri": "India", "odia": "India", "rajasthani": "India",
    "bengali": "Bangladesh", "bangladeshi": "Bangladesh", "nepali": "Nepal", "nepalese": "Nepal",
    "newar": "Nepal", "sherpa": "Nepal", "bhutanese": "Bhutan", "sinhalese": "Sri Lanka",
    "sri lankan": "Sri Lanka", "pakistani": "Pakistan", "sindhi": "Pakistan", "balochi": "Pakistan",
    "pashtun": "Pakistan", "kazakh": "Kazakhstan", "kyrgyz": "Kyrgyzstan", "uzbek": "Uzbekistan",
    "turkmen": "Turkmenistan", "tajik": "Tajikistan",
    # Africa
    "zulu": "South Africa", "xhosa": "South Africa", "sotho": "Lesotho", "tswana": "Botswana",
    "venda": "South Africa", "khoikhoi": "South Africa", "khoisan": "South Africa",
    "south african": "South Africa", "yoruba": "Nigeria", "igbo": "Nigeria", "hausa": "Nigeria",
    "efik": "Nigeria", "edo": "Nigeria", "nigerian": "Nigeria", "akan": "Ghana", "ashanti": "Ghana",
    "ewe": "Ghana", "ghanaian": "Ghana", "dahomey": "Benin", "fon": "Benin",
    "malagasy": "Madagascar", "swahili": "Tanzania", "tanzanian": "Tanzania", "chaga": "Tanzania",
    "kenyan": "Kenya", "kikuyu": "Kenya", "luo": "Kenya", "maasai": "Kenya",
    "ethiopian": "Ethiopia", "amhara": "Ethiopia", "oromo": "Ethiopia", "somali": "Somalia",
    "lugbara": "Uganda", "baganda": "Uganda", "ugandan": "Uganda", "congolese": "Democratic Republic of the Congo",
    "kongo": "Democratic Republic of the Congo", "luba": "Democratic Republic of the Congo",
    "zambian": "Zambia", "bemba": "Zambia", "zimbabwean": "Zimbabwe", "shona": "Zimbabwe",
    "ndebele": "Zimbabwe", "malawian": "Malawi", "chewa": "Malawi", "mozambican": "Mozambique",
    "angolan": "Angola", "namibian": "Namibia", "herero": "Namibia", "cameroonian": "Cameroon",
    "senegalese": "Senegal", "wolof": "Senegal", "malian": "Mali", "bambara": "Mali", "dogon": "Mali",
    "sudanese": "Sudan", "nubian": "Sudan", "rwandan": "Rwanda", "ivorian": "Ivory Coast",
    # Americas
    "aztec": "Mexico", "mexica": "Mexico", "maya": "Mexico", "mayan": "Mexico", "olmec": "Mexico",
    "mexican": "Mexico", "nahua": "Mexico", "zapotec": "Mexico", "mixtec": "Mexico",
    "guatemalan": "Guatemala", "honduran": "Honduras", "salvadoran": "El Salvador",
    "nicaraguan": "Nicaragua", "costa rican": "Costa Rica", "panamanian": "Panama", "cuban": "Cuba",
    "haitian": "Haiti", "dominican": "Dominican Republic", "jamaican": "Jamaica",
    "puerto rican": "Puerto Rico", "taíno": "Puerto Rico", "taino": "Puerto Rico",
    "trinidadian": "Trinidad and Tobago", "colombian": "Colombia", "muisca": "Colombia",
    "venezuelan": "Venezuela", "ecuadorian": "Ecuador", "peruvian": "Peru", "inca": "Peru",
    "incan": "Peru", "quechua": "Peru", "aymara": "Bolivia", "bolivian": "Bolivia",
    "chilean": "Chile", "chilote": "Chile", "mapuche": "Chile", "argentine": "Argentina",
    "argentinian": "Argentina", "uruguayan": "Uruguay", "paraguayan": "Paraguay",
    "guarani": "Paraguay", "guaraní": "Paraguay", "brazilian": "Brazil", "tupi": "Brazil",
    "tupí": "Brazil", "guyanese": "Guyana", "surinamese": "Suriname",
    "inuit": "Canada", "mi'kmaq": "Canada", "ojibwe": "Canada", "anishinaabe": "Canada",
    "cree": "Canada", "haida": "Canada", "salish": "Canada", "kwakwaka'wakw": "Canada",
    "nuu-chah-nulth": "Canada", "canadian": "Canada", "québécois": "Canada", "acadian": "Canada",
    "yupik": "United States", "inupiat": "United States", "cherokee": "United States",
    "lakota": "United States", "sioux": "United States", "dakota": "United States",
    "hopi": "United States", "zuni": "United States", "pueblo": "United States",
    "apache": "United States", "comanche": "United States", "cheyenne": "United States",
    "crow": "United States", "iroquois": "United States", "haudenosaunee": "United States",
    "seneca": "United States", "mohawk": "United States", "abenaki": "United States",
    "tlingit": "United States", "shoshone": "United States", "paiute": "United States",
    "ute": "United States", "chumash": "United States", "choctaw": "United States",
    "muscogee": "United States", "seminole": "United States", "wampanoag": "United States",
    "lenape": "United States", "menominee": "United States", "potawatomi": "United States",
    "kalapuya": "United States", "nez perce": "United States", "yakama": "United States",
    "klamath": "United States", "miwok": "United States", "american": "United States",
    "appalachian": "United States", "ozark": "United States", "cajun": "United States",
    "hawaiian": "United States",
    # Oceania
    "aboriginal australian": "Australia", "australian aboriginal": "Australia",
    "australian": "Australia", "maori": "New Zealand", "māori": "New Zealand",
    "new zealand": "New Zealand", "samoan": "Samoa", "tongan": "Tonga", "fijian": "Fiji",
    "papuan": "Papua New Guinea", "papua new guinean": "Papua New Guinea",
    "solomon islands": "Solomon Islands", "ni-vanuatu": "Vanuatu", "marshallese": "Marshall Islands",
}

# Words in free-text locations (cryptid lists) -> country.
LOCATION_ALIASES = {
    "usa": "United States", "u.s.": "United States", "united states of america": "United States",
    "south jersey": "United States", "pine barrens": "United States", "lake champlain": "United States",
    "hawaii": "United States", "alaska": "United States",
    "uk": "United Kingdom", "great britain": "United Kingdom", "britain": "United Kingdom",
    "loch ness": "Scotland", "scotland": "Scotland", "england": "England", "cornwall": "England",
    "wales": "Wales", "northern ireland": "Northern Ireland",
    "tibet": "China", "himalayas": "Nepal", "canary islands": "Spain", "sumatra": "Indonesia",
    "flores island": "Indonesia", "java": "Indonesia", "borneo": "Indonesia", "gobi desert": "Mongolia",
    "sakha republic": "Russia", "siberia": "Russia", "patagonia": "Argentina",
    "patagonian region of argentina": "Argentina", "tasmania": "Australia", "queensland": "Australia",
    "new south wales": "Australia", "congo": "Democratic Republic of the Congo",
}
US_STATES = [
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware",
    "florida", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana",
    "maine", "maryland", "massachusetts", "michigan", "minnesota", "mississippi", "missouri", "montana",
    "nebraska", "nevada", "new hampshire", "new jersey", "new mexico", "new york", "north carolina",
    "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina",
    "south dakota", "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west virginia",
    "wisconsin", "wyoming",
]
CANADIAN_PROVINCES = [
    "ontario", "quebec", "british columbia", "alberta", "manitoba", "saskatchewan", "nova scotia",
    "new brunswick", "newfoundland", "labrador", "prince edward island", "yukon", "nunavut",
    "northwest territories",
]
# Short country names that also appear inside other place names - not matched in free text.
AMBIGUOUS_IN_LOCATIONS = {"jersey", "chad", "jordan", "georgia", "guinea", "niger"}

# A country's capital when Wikipedia lists more than one (country -> capital article title).
CAPITAL_OVERRIDES = {
    "South Africa": "Pretoria", "Bolivia": "La Paz", "Netherlands": "Amsterdam",
    "Malaysia": "Kuala Lumpur", "Sri Lanka": "Sri Jayawardenepura Kotte", "Benin": "Porto-Novo",
    "Ivory Coast": "Yamoussoukro", "Eswatini": "Mbabane", "Montenegro": "Podgorica",
}
CONTINENT_OVERRIDES = {"Russia": "Europe", "Turkey": "Asia", "Egypt": "Africa", "Kazakhstan": "Asia"}

# Short descriptions that mean the article is not about a creature (gods, people, films, places...).
NOT_A_CREATURE = re.compile(
    r"\b(gods?|goddess(es)?|deit(y|ies)|divinit(y|ies)|demigods?|worship(ped)?|king|queen|hero(ine)?|"
    r"princes?s?|saints?|prophet|emperor|warrior|chieftain|film|novel|album|song|video game|television|"
    r"tv series|episode|manga|anime|magazine|surname|given name|company|opera|ballet|painting|sculpture|"
    r"disambiguation|wizard|sorcer(er|ess)|magician|plasma|organism|polyphyletic|overview|holiday character)\b",
    re.I)
# Articles about a whole topic rather than one creature.
TOPIC_TITLE = re.compile(r"(\b(folklore|mythology|mythologies|religion|legends|beliefs|traditions)$)|"
                         r"\bconception of\b|^(cultural )?depictions of\b", re.I)
# Place words only count when the article is about the place itself ("Lake in Alaska"),
# not a creature living there ("Lake monster in Swedish folklore", "Mountain spirit from ...").
NOT_A_CREATURE_START = re.compile(
    r"^((village|town|city|municipality|district|mountain|island|lake|river|county|region|province|commune)"
    r"\s+(in|of|on|near|located)\b|(ship|aircraft|genus|species|family|book|play|poem|comic|website|podcast|band)\b)",
    re.I)
# For category members (which can be any topic), the short description must sound like a creature.
CREATURE_WORDS = re.compile(
    r"\b(creature|monster|beast|being|spirit|demon|ghost|serpent|dragon|giant|fairy|fairies|y[oō]kai|"
    r"humanoid|animal|bird|fish|snake|dog|hound|cat|horse|wolf|wolves|ape|entity|entities|mermaid|vampire|ogre|"
    r"troll|goblin|elf|elves|dwarf|ghoul|undead|cryptid|hybrid|chimera|bogeyman|shapeshifter|werewolf|"
    r"lizard|reptile|turtle|eel|worm|bat|bear|bull|boar|deer|goat|lion|tiger|whale|octopus|squid|crab|"
    r"monkey|frog|toad|kangaroo|panther|puma|cougar|lynx|otter|seal|shark|dinosaur|pterosaur|plesiosaur|"
    r"hominid|hominin|primate|mammal|insect|spider|feline|stegosaurid|sauropod)(s|es)?\b",
    re.I)


# =====================================================================
# DOWNLOADING (slow, polite, cached)
# =====================================================================

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "tools" / ".cache"
OUT_JS = ROOT / "js" / "world-cryptids.js"
IMG_DIR = ROOT / "assets" / "cryptids"
API = "https://en.wikipedia.org/w/api.php"

ARGS = None
_last_request = [0.0]
_gap = [REQUEST_GAP]
STATS = Counter()


def fetch(url, params=None, binary=False):
    """GET a URL (JSON by default) with caching, a pause between requests and retries."""
    if params:
        url = url + "?" + urllib.parse.urlencode(params)
    path = CACHE / (hashlib.sha1(url.encode()).hexdigest() + (".bin" if binary else ".json"))
    if path.exists() and not ARGS.refresh:
        STATS["cached"] += 1
        data = path.read_bytes()
        return data if binary else json.loads(data)

    for attempt in range(8):
        wait = _gap[0] - (time.time() - _last_request[0])
        if wait > 0:
            time.sleep(wait)
        _last_request[0] = time.time()
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read()
        except urllib.error.HTTPError as error:
            if error.code in (429, 500, 502, 503, 504) and attempt < 7:
                delay = int(error.headers.get("Retry-After") or 30)
                if error.code == 429:
                    _gap[0] = min(_gap[0] * 1.5, 12.0)   # go slower for the rest of the run
                print(f"      Wikipedia is busy (HTTP {error.code}); waiting {delay}s, "
                      f"then 1 request every {_gap[0]:.1f}s ...", flush=True)
                time.sleep(delay)
                continue
            raise
        except urllib.error.URLError:
            if attempt < 7:
                time.sleep(15)
                continue
            raise
        if not binary:
            answer = json.loads(data)
            if isinstance(answer, dict) and answer.get("error", {}).get("code") == "maxlag":
                time.sleep(10)   # Wikipedia's servers are lagging: wait and ask again
                continue
            if isinstance(answer, dict) and "error" in answer:
                raise RuntimeError(f"Wikipedia API error for {url}: {answer['error']}")
        STATS["downloaded"] += 1
        CACHE.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return data if binary else json.loads(data)
    raise RuntimeError(f"Gave up on {url}")


def api(**params):
    return fetch(API, {"format": "json", "formatversion": 2, "maxlag": 5, **params})


def chunks(items, size):
    items = list(items)
    for i in range(0, len(items), size):
        yield items[i:i + size]


def query_pages(titles, chunk_size=50, **props):
    """prop= query for many titles. Follows 'continue', merges the results and returns
    (pages by final title, {asked title: final title})."""
    pages, final = {}, {}
    for batch in chunks(titles, chunk_size):
        cont = {}
        while True:
            answer = api(action="query", titles="|".join(batch), redirects=1, **props, **cont)
            q = answer.get("query", {})
            renamed = {n["from"]: n["to"] for n in q.get("normalized", [])}
            redirected = {r["from"]: r["to"] for r in q.get("redirects", [])}
            for title in batch:
                t = renamed.get(title, title)
                final[title] = redirected.get(t, t)
            for page in q.get("pages", []):
                merged = pages.setdefault(page["title"], {})
                for key, value in page.items():
                    if isinstance(value, dict) and isinstance(merged.get(key), dict):
                        merged[key].update(value)
                    elif key not in merged:
                        merged[key] = value
            if "continue" not in answer:
                break
            cont = answer["continue"]
    return pages, final


# =====================================================================
# READING WIKIPEDIA PAGES
# =====================================================================

SKIP_NAMESPACES = ("File:", "Image:", "Category:", "Help:", "Wikipedia:", "Template:", "Special:",
                   "Portal:", "Talk:", "Module:", "Draft:", "MediaWiki:", "User:", "Wiktionary:")


def article_from_href(href):
    if not href.startswith("/wiki/"):
        return None
    target = urllib.parse.unquote(href[6:]).replace("_", " ")
    return None if target.startswith(SKIP_NAMESPACES) else target


class TableParser(HTMLParser):
    """Collects the tables of a rendered Wikipedia page. Each table remembers the headings it was
    under; each cell keeps its text and the article links inside it (footnotes are skipped)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables, self.headings = [], {"h2": "", "h3": ""}
        self._heading, self._heading_text = None, ""
        self.row = self.cell = None
        self.skip = self.depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("h2", "h3"):
            self._heading, self._heading_text = tag, ""
        elif tag == "table":
            self.depth += 1
            if self.depth == 1:
                self.tables.append({**self.headings, "rows": []})
        elif tag == "tr" and self.depth == 1:
            self.row = []
        elif tag in ("td", "th") and self.row is not None and self.depth == 1:
            self.cell = {"text": "", "links": []}
        elif tag in ("sup", "style", "script"):
            self.skip += 1
        elif tag == "a" and self.cell is not None and not self.skip:
            target = article_from_href(dict(attrs).get("href", ""))
            if target:
                self.cell["links"].append(target)

    def handle_endtag(self, tag):
        if tag == self._heading:
            self.headings[tag] = re.sub(r"\s+", " ", self._heading_text).strip()
            if tag == "h2":
                self.headings["h3"] = ""
            self._heading = None
        elif tag in ("sup", "style", "script") and self.skip:
            self.skip -= 1
        elif tag in ("td", "th") and self.cell is not None and self.row is not None and self.depth == 1:
            self.cell["text"] = re.sub(r"\s+", " ", self.cell["text"]).strip()
            self.row.append(self.cell)
            self.cell = None
        elif tag == "tr" and self.row is not None and self.depth == 1:
            if self.row and self.tables:
                self.tables[-1]["rows"].append(self.row)
            self.row = None
        elif tag == "table" and self.depth:
            self.depth -= 1

    def handle_data(self, data):
        if self._heading:
            self._heading_text += data
        if self.cell is not None and not self.skip:
            self.cell["text"] += data


def page_tables(title):
    parser = TableParser()
    parser.feed(api(action="parse", page=title, prop="text")["parse"]["text"])
    return parser.tables


def display_name(title):
    return re.sub(r"\s*\([^)]*\)$", "", title).strip()


def plain(wikitext):
    """[[Target|Label]] -> Label, [[Target]] -> Target, drops formatting."""
    text = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", wikitext)
    text = re.sub(r"'{2,}", "", text)
    return re.sub(r"\s+", " ", text).strip()


# =====================================================================
# 1. COUNTRIES, CAPITALS AND CONTINENTS
# =====================================================================

def load_countries():
    print("1. Countries and capitals")
    countries = {}   # visible name -> {"capital": article title, "area": continent}
    by_article = {}  # country article title (e.g. "Republic of Ireland") -> visible name ("Ireland")
    for table in page_tables("List of national capitals"):
        for row in table["rows"]:
            if len(row) < 2 or not row[0]["links"] or not row[1]["links"]:
                continue
            name = display_name(row[1]["text"]) or display_name(row[1]["links"][0])
            by_article.setdefault(display_name(row[1]["links"][0]), name)
            capital = row[0]["links"][0].split("#")[0]
            countries.setdefault(name, {"capital": capital, "area": None})
    for name, capital in CAPITAL_OVERRIDES.items():
        if name in countries:
            countries[name]["capital"] = capital

    continents = {"Africa", "Asia", "Europe", "North America", "Oceania", "South America", "Antarctica"}
    for table in page_tables("List of sovereign states and dependent territories by continent"):
        if table["h2"] not in continents:
            continue
        for row in table["rows"]:
            if row and row[0]["links"]:
                linked = display_name(row[0]["links"][0])
                name = by_article.get(linked, linked)
                if name in countries and not countries[name]["area"]:
                    countries[name]["area"] = table["h2"]
    for name, area in CONTINENT_OVERRIDES.items():
        if name in countries:
            countries[name]["area"] = area

    if SPLIT_UK:
        for nation, capital in UK_NATIONS.items():
            countries[nation] = {"capital": capital, "area": "Europe"}
        countries.pop("United Kingdom", None)

    pages, final = query_pages([c["capital"] for c in countries.values()], prop="coordinates")
    for name, info in list(countries.items()):
        page = pages.get(final.get(info["capital"], info["capital"]), {})
        coords = (page.get("coordinates") or [{}])[0]
        if "lat" not in coords or not info["area"]:
            STATS["countries without coordinates or continent"] += 1
            countries.pop(name)
            continue
        info.update(capital=display_name(page["title"]), lat=round(coords["lat"], 4), lng=round(coords["lon"], 4))
    print(f"   {len(countries)} countries and territories with a capital, coordinates and continent")
    return countries


def build_name_lookup(countries):
    lookup = {name.lower(): name for name in countries}
    for alias, country in LOCATION_ALIASES.items():
        lookup[alias] = resolve_country(country, countries) or country
    for state in US_STATES:
        lookup.setdefault(state, "United States")
    for province in CANADIAN_PROVINCES:
        lookup.setdefault(province, "Canada")
    for word in AMBIGUOUS_IN_LOCATIONS:
        if lookup.get(word) == word.title():
            del lookup[word]
    return lookup


def countries_in(text, lookup, countries):
    """All countries named in a free-text location like 'Loch Ness, Scotland'."""
    remaining, found = text.lower(), set()
    for key in sorted(lookup, key=len, reverse=True):
        pattern = r"(?<![\w])" + re.escape(key) + r"(?![\w])"
        if re.search(pattern, remaining):
            found.add(lookup[key])
            remaining = re.sub(pattern, " ", remaining)
    if SPLIT_UK and "United Kingdom" in found:
        found.discard("United Kingdom")
        if not found & set(UK_NATIONS):
            found.add("England")
    return {c for c in found if c in countries}


COUNTRY_NAME_FALLBACKS = {
    "Czech Republic": ["Czechia"], "Ivory Coast": ["Côte d'Ivoire"], "Ireland": ["Republic of Ireland"],
    "China": ["People's Republic of China"], "Taiwan": ["Republic of China"], "Myanmar": ["Burma"],
    "Eswatini": ["Swaziland"], "Timor-Leste": ["East Timor"], "Cape Verde": ["Cabo Verde"],
}


def resolve_country(name, countries):
    if not name:
        return None
    if name in countries:
        return name
    for other in COUNTRY_NAME_FALLBACKS.get(name, []):
        if other in countries:
            return other
    lower = {c.lower(): c for c in countries}
    return lower.get(name.lower())


def culture_countries(label, countries):
    """'Basque mythology' -> {'Spain'}; 'Armenian and Persian' -> {'Armenia', 'Iran'}.
    Returns (countries, cleaned labels that could not be placed, is it a religious label?)."""
    found, unplaced, religious = set(), [], False
    for part in re.split(r",|/|;|\band\b|\bor\b", label):
        key = re.sub(r"\b(mythology|folklore|legends?|people|peoples|religion|tradition|culture|tribe|nation|ethnic group)\b",
                     "", part.lower())
        key = re.sub(r"[()\[\]]", "", key).strip(" -.")
        if key in RELIGIOUS_CULTURES:
            religious = True
            continue
        if not key or key in SKIP_CULTURES:
            continue
        country = resolve_country(CULTURE_TO_COUNTRY.get(key) or key.title(), countries)
        if country:
            found.add(country)
        else:
            unplaced.append(key)
    return found, unplaced, religious


# =====================================================================
# 2. CANDIDATES
# =====================================================================

def same_name(label, target):
    """Is a list's link label the same creature as the article it links to?
    'Abada' -> 'Abada (unicorn)' yes; 'Kaw kaw' -> 'Maltese folklore' no."""
    if not label:
        return True
    def norm(text):
        text = unicodedata.normalize("NFKD", plain(text)).encode("ascii", "ignore").decode().lower()
        return re.sub(r"[^a-z0-9]", "", text)
    a, b = norm(label), norm(display_name(target))
    return not a or not b or a in b or b in a


def new_candidate(candidates, title, kind, countries, culture=None, ctype=None, aliases=(), curated=True,
                  direct_link=True, religious=False):
    """curated=False (cryptid lists, category members): the article's short description must also
    *sound* like a creature, because these sources sometimes link to a lake or a general topic."""
    if not countries:
        return
    c = candidates.setdefault(title, {"kind": kind, "countries": set(), "culture": culture, "type": ctype,
                                      "aliases": set(), "curated": False, "direct": False, "religious": False})
    c["curated"] = c["curated"] or curated
    c["direct"] = c["direct"] or direct_link        # at least one source links straight to it
    c["religious"] = c["religious"] or religious
    c["countries"] |= set(countries)
    c["aliases"] |= {a for a in aliases if a}
    if kind == "cryptid":             # a cryptid list beats a folklore list
        c["kind"], c["type"] = "cryptid", ctype or c["type"]
    c["culture"] = c["culture"] or culture


def cryptid_candidates(candidates, lookup, countries, review):
    print("2a. Cryptids (List of cryptids, List of lake monsters)")
    before = len(candidates)
    types = {"Aquatic or semi-aquatic": "Aquatic", "Terrestrial": "Terrestrial", "Hominid": "Hominid", "Flying": "Flying"}
    for table in page_tables("List of cryptids"):
        for row in table["rows"]:
            if len(row) != 5 or not row[0]["links"] or row[0]["text"] == "Name":
                continue
            title = row[0]["links"][0]
            if "#" in title:
                continue
            found = countries_in(row[3]["text"], lookup, countries)
            review.append(f"   {title:<34} {row[3]['text'][:45]:<46} -> {', '.join(sorted(found)) or '(no country)'}")
            aliases = [a.strip() for a in re.split(r",|;| or ", row[1]["text"]) if a.strip()]
            new_candidate(candidates, title, "cryptid", found, ctype=types.get(table["h3"], "Cryptid"),
                          aliases=aliases, curated=False)
    for table in page_tables("List of lake monsters"):
        for row in table["rows"]:
            if len(row) != 8 or not row[4]["links"] or row[0]["text"] == "Body of water":
                continue
            title = row[4]["links"][0]
            if "#" in title:
                continue
            found = countries_in(row[2]["text"], lookup, countries)
            new_candidate(candidates, title, "cryptid", found, ctype="Lake monster", curated=False)
    print(f"   {len(candidates) - before} cryptids placed in a country")


def folklore_category_candidates(candidates, countries, unplaced):
    print("2b. Folklore categories (<Nationality> legendary creatures)")
    before = len(candidates)
    regional = re.compile(r"(Asian|African|European|American|Oceanian|Middle Eastern|Caribbean|Latin|Arctic|"
                          r"Medieval|Ancient|Indigenous|Native|Nordic|Slavic|Celtic|Germanic|Balkan|Baltic|"
                          r"Polynesian|Melanesian|Micronesian|Mesoamerican|Andean|Pacific|Scandinavian|"
                          r"Arabian|Turkic|Siberian|Caucasian)")
    national, frontier = {}, [f"Category:{c} legendary creatures" for c in
                              ["African", "Asian", "European", "North American", "South American", "Oceanian"]]
    for _ in range(2):
        nxt = []
        for category in frontier:
            answer = api(action="query", list="categorymembers", cmtitle=category, cmtype="subcat", cmlimit=500)
            for member in answer.get("query", {}).get("categorymembers", []):
                name = member["title"][len("Category:"):]
                match = re.fullmatch(r"(.+?) legendary creatures", name)
                if not match:
                    continue
                if regional.search(match.group(1)):
                    nxt.append(member["title"])
                else:
                    national[member["title"]] = match.group(1)
        frontier = nxt

    for category, nationality in sorted(national.items()):
        found, missing, _ = culture_countries(nationality, countries)
        unplaced.update(missing)
        if not found:
            continue
        cont = {}
        while True:
            answer = api(action="query", list="categorymembers", cmtitle=category, cmtype="page",
                         cmnamespace=0, cmlimit=500, **cont)
            for member in answer.get("query", {}).get("categorymembers", []):
                new_candidate(candidates, member["title"], "folklore", found, culture=nationality,
                              ctype="Folklore creature", curated=False)
            if "continue" not in answer:
                break
            cont = answer["continue"]
    print(f"   {len(national)} national categories, {len(candidates) - before} new candidates")


def folklore_list_candidates(candidates, countries, unplaced):
    print("2c. Folklore lists (List of legendary creatures A-Z)")
    before = len(candidates)
    links = api(action="parse", page="Template:Legendary creatures", prop="links")["parse"]["links"]
    pages = sorted({l["title"] for l in links if l["title"].startswith("List of legendary creatures (")})
    # "# [[Target|Label]] ([[Culture link|Culture]]) – description"
    line_pattern = re.compile(
        r"^#\s*'*\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]*))?\]\]'*\s*"
        r"\(((?:\[\[[^\]]*\]\]|[^()\[\]])+)\)\s*[–—-]\s*(.*)$", re.M)
    gods = re.compile(r"\b(gods?|goddess(es)?|deit(y|ies))\b", re.I)
    for page in pages:
        wikitext = api(action="parse", page=page, prop="wikitext")["parse"]["wikitext"]
        for target, fragment, label, culture_markup, description in line_pattern.findall(wikitext):
            if fragment or gods.search(description):
                continue   # only a section of another article, or a god rather than a creature
            culture = plain(culture_markup)
            found, missing, religious = culture_countries(culture, countries)
            for unknown in missing:
                unplaced[unknown] += 1
            if found:
                new_candidate(candidates, target.strip(), "folklore", found, culture=culture, ctype="Folklore creature",
                              direct_link=same_name(label, target), religious=religious)
    print(f"   {len(pages)} list pages, {len(candidates) - before} new candidates")


# =====================================================================
# 3-5. CHECK, RANK AND PICK
# =====================================================================

def check_and_rank(candidates, skipped):
    print(f"3. Checking {len(candidates)} articles and counting page views (this is the slow part)")
    pages, final = query_pages(sorted(candidates), prop="description|pageprops|pageviews", pvipdays=60)
    merged = {}
    for title, c in candidates.items():
        page = pages.get(final.get(title, title))
        if not page or page.get("missing") or page.get("invalid"):
            skipped["no article"].append(title)
            continue
        name = page["title"]
        description = page.get("description", "")
        if name in EXCLUDE or title in EXCLUDE or name.startswith(("List of", "Lists of")):
            skipped["excluded or list page"].append(name)
            continue
        if TOPIC_TITLE.search(name):
            skipped["about a whole topic, not one creature"].append(name)
            continue
        if c["religious"]:
            skipped["part of a religion's beliefs"].append(name)
            continue
        if not c["direct"]:
            skipped["list links to a broader article"].append(f"{title}")
            continue
        if "disambiguation" in page.get("pageprops", {}):
            skipped["disambiguation page"].append(name)
            continue
        if description and (NOT_A_CREATURE.search(description) or NOT_A_CREATURE_START.search(description)):
            skipped["not a creature (short description)"].append(f"{name} - {description}")
            continue
        if not c["curated"] and not CREATURE_WORDS.search(description):
            skipped["category member that doesn't sound like a creature"].append(f"{name} - {description or 'no description'}")
            continue
        views = sum(v or 0 for v in (page.get("pageviews") or {}).values())
        m = merged.setdefault(name, {**c, "countries": set(), "aliases": set(), "views": views,
                                     "description": description})
        m["curated"] = m["curated"] or c["curated"]
        m["countries"] |= c["countries"]
        m["aliases"] |= c["aliases"]
        if c["kind"] == "cryptid":
            m["kind"], m["type"] = "cryptid", c["type"]
        m["culture"] = m["culture"] or c["culture"]
    print(f"   {len(merged)} creature articles left")
    return merged


def pick(merged, countries, buffer=2):
    """Per country: its best-known cryptid first (if it has one), then the best-known creatures
    of any kind. A creature listed for several countries counts proportionally less in each, so
    it doesn't crowd out a country's own creatures. Returns {country: [titles]} with a few spare
    titles per country in case some have no usable summary."""
    per_country = defaultdict(list)
    for title, m in merged.items():
        for country in m["countries"]:
            per_country[country].append(title)
    fame = {t: m["views"] / max(1, len(m["countries"])) for t, m in merged.items()}
    ranked = {}
    for country, titles in per_country.items():
        by_fame = sorted(titles, key=lambda t: (-fame[t], t))
        best_cryptid = [t for t in by_fame if merged[t]["kind"] == "cryptid"][:1]
        ranked[country] = (best_cryptid + [t for t in by_fame if t not in best_cryptid])[:MAX_PER_COUNTRY + buffer]
    return ranked


# =====================================================================
# 6-7. SUMMARIES AND PICTURES
# =====================================================================

# Characters outside the Latin alphabet (native spellings, pronunciation symbols).
NOT_LATIN = re.compile(r"[^\u0000-\u024F\u1E00-\u1EFF\u2000-\u206F]")


def tidy_brackets(match):
    """'(狐, きつね; IPA: [kʲitsɨne]; lit. 'fox')' -> "(lit. 'fox')"; drops the bracket if nothing is left."""
    parts = [part.strip() for part in re.split(r"[;,]", match.group(1))]
    keep = [part for part in parts if part and not NOT_LATIN.search(part)
            and "IPA" not in part and "/" not in part and not re.fullmatch(r"[\w\s]+:", part)]
    return f" ({'; '.join(keep)})" if keep else ""


def clean_summary(text):
    text = re.sub(r"\s*\(((?:[^()]|\([^()]*\))*)\)", tidy_brackets, text)   # native spellings, IPA
    text = re.sub(r"\(\s*[;,]?\s*\)", "", text)
    text = re.sub(r"\s+", " ", text).strip()                  # line breaks too, so sentence ends are found
    text = re.sub(r"\s+([,.;])", r"\1", text)
    if len(text) > 520:                                      # keep it short: cut at a sentence end
        cut = text.rfind(". ", 0, 520)
        if cut < 120:                                        # one very long first sentence: finish it
            later = text.find(". ", 520)
            cut = later if 0 < later < 800 else -1
        text = text[:cut + 1] if cut > 0 else text[:517].rsplit(" ", 1)[0] + "…"
    return text


def strip_html(value):
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", "", value or ""))).strip()


def fetch_details(titles):
    print(f"6. Summaries and pictures for {len(titles)} articles")
    extracts, final = query_pages(titles, chunk_size=20, prop="extracts", exintro=1, explaintext=1,
                                  exsentences=SUMMARY_SENTENCES, exlimit=20)
    images, _ = query_pages(titles, prop="pageimages|info", piprop="thumbnail|name",
                            pithumbsize=THUMB_WIDTH, pilicense="free", inprop="url")
    files = sorted({"File:" + p["pageimage"] for p in images.values() if p.get("pageimage")})
    info, _ = query_pages(files, prop="imageinfo", iiprop="url|extmetadata", iiextmetadatalanguage="en",
                          iiextmetadatafilter="Artist|LicenseShortName|LicenseUrl|NonFree|Credit")
    details = {}
    for title in titles:
        name = final.get(title, title)
        summary = clean_summary(extracts.get(name, {}).get("extract", ""))
        page = images.get(name, {})
        picture = None
        if page.get("thumbnail") and page.get("pageimage"):
            file_info = (info.get("File:" + page["pageimage"].replace("_", " "), {}).get("imageinfo") or [{}])[0]
            meta = file_info.get("extmetadata", {})
            licence = strip_html(meta.get("LicenseShortName", {}).get("value"))
            non_free = strip_html(meta.get("NonFree", {}).get("value")).lower() in ("true", "1", "yes")
            if licence and not non_free:
                picture = {
                    "thumb": page["thumbnail"]["source"],
                    "artist": strip_html(meta.get("Artist", {}).get("value") or meta.get("Credit", {}).get("value"))[:120] or "Unknown",
                    "license": licence,
                    "licenseUrl": strip_html(meta.get("LicenseUrl", {}).get("value")),
                    "source": file_info.get("descriptionurl", ""),
                }
        details[title] = {"summary": summary, "picture": picture,
                          "url": page.get("fullurl") or "https://en.wikipedia.org/wiki/" + urllib.parse.quote(name.replace(" ", "_"))}
    return details


def slug(name, taken):
    base = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-") or "creature"
    candidate, n = base, 2
    while candidate in taken:
        candidate, n = f"{base}-{n}", n + 1
    taken.add(candidate)
    return candidate


def save_picture(url, path):
    if path.exists() and not ARGS.refresh_images:
        return True
    try:
        data = fetch(url, binary=True)
        with Image.open(BytesIO(data)) as im:
            im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
            if im.width > THUMB_WIDTH:
                im = im.resize((THUMB_WIDTH, round(im.height * THUMB_WIDTH / im.width)), Image.LANCZOS)
            IMG_DIR.mkdir(parents=True, exist_ok=True)
            im.save(path, "WEBP", quality=WEBP_QUALITY, method=6)
        return True
    except Exception as error:   # a missing picture should never stop the build
        print(f"      could not save picture {url}: {error}")
        return False


# =====================================================================
# MAIN
# =====================================================================

def main():
    global ARGS
    parser = argparse.ArgumentParser(description="Build js/world-cryptids.js from Wikipedia.")
    parser.add_argument("--refresh", action="store_true", help="ignore the cache and ask Wikipedia again")
    parser.add_argument("--refresh-images", action="store_true", help="re-make every picture")
    ARGS = parser.parse_args()
    started = time.time()

    countries = load_countries()
    lookup = build_name_lookup(countries)
    candidates, review, unplaced = {}, [], Counter()
    cryptid_candidates(candidates, lookup, countries, review)
    folklore_category_candidates(candidates, countries, unplaced)
    folklore_list_candidates(candidates, countries, unplaced)

    skipped = defaultdict(list)
    merged = check_and_rank(candidates, skipped)
    ranked = pick(merged, countries)

    details = fetch_details(sorted({t for titles in ranked.values() for t in titles}))

    print("7. Choosing up to", MAX_PER_COUNTRY, "per country and saving pictures")
    chosen, taken, by_country = {}, set(), {}
    for country in sorted(ranked):
        picked = [t for t in ranked[country] if details.get(t, {}).get("summary")][:MAX_PER_COUNTRY]
        if picked:
            by_country[country] = picked
            for title in picked:
                chosen.setdefault(title, None)
    entries = []
    for title in sorted(chosen):
        m, d = merged[title], details[title]
        name = display_name(title)
        entry = {
            "id": slug(name, taken),
            "name": name,
            "aliases": sorted(a for a in m["aliases"] if a.lower() != name.lower())[:4],
            "kind": m["kind"],
            "type": m["type"] or ("Cryptid" if m["kind"] == "cryptid" else "Folklore creature"),
            "culture": m["culture"] or "",
            "countries": sorted(c for c in m["countries"] if c in by_country and title in by_country[c]),
            "summary": d["summary"],
            "image": None,
            "wikipedia": d["url"],
            "views": m["views"],
        }
        if d["picture"]:
            path = IMG_DIR / (entry["id"] + ".webp")
            if save_picture(d["picture"]["thumb"], path):
                entry["image"] = {"src": f"assets/cryptids/{entry['id']}.webp", "alt": f"Depiction of {name}",
                                  "artist": d["picture"]["artist"], "license": d["picture"]["license"],
                                  "licenseUrl": d["picture"]["licenseUrl"], "source": d["picture"]["source"]}
        chosen[title] = entry["id"]
        entries.append(entry)

    # remove pictures from earlier builds that are no longer used
    used = {e["id"] + ".webp" for e in entries if e["image"]}
    for old in IMG_DIR.glob("*.webp"):
        if old.name not in used:
            old.unlink()
            STATS["old pictures removed"] += 1

    world_countries = {
        country: {"capital": countries[country]["capital"], "lat": countries[country]["lat"],
                  "lng": countries[country]["lng"], "area": countries[country]["area"],
                  "creatures": [chosen[t] for t in titles]}
        for country, titles in sorted(by_country.items())
    }

    lines = [
        "/* =====================================================================",
        "   WORLD BESTIARY DATA - GENERATED, DON'T EDIT BY HAND",
        f"   Made by tools/build_world_cryptids.py on {date.today().isoformat()} from English Wikipedia.",
        "   Re-run that tool to update it (see the instructions at the top of the tool).",
        "",
        "   WORLD_COUNTRIES  country -> capital, coordinates, continent, creature ids",
        "   WORLD_CRYPTIDS   up to " + str(MAX_PER_COUNTRY) + " creatures per country: its best-known cryptid (if any),",
        "                    then the best-known creatures of any kind (Wikipedia page views)",
        "",
        "   Summaries are from Wikipedia (CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/).",
        "   Pictures are freely licensed; each one lists its artist, licence and source.",
        "   ===================================================================== */",
        "",
        "const WORLD_COUNTRIES = {",
        ",\n".join(f"  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}" for k, v in world_countries.items()),
        "};",
        "",
        "const WORLD_CRYPTIDS = [",
        ",\n".join("  " + json.dumps(e, ensure_ascii=False) for e in entries),
        "];",
        "",
    ]
    OUT_JS.write_text("\n".join(lines), encoding="utf-8")

    # ---------------- report ----------------
    print("\n================ REPORT ================")
    kinds = Counter(e["kind"] for e in entries)
    print(f"Countries with creatures: {len(world_countries)} of {len(countries)}")
    print(f"Creatures: {len(entries)}  (cryptids {kinds['cryptid']}, folklore {kinds['folklore']})")
    print(f"With a picture: {sum(1 for e in entries if e['image'])}")
    print(f"Countries with 1 / 2 / 3: " + " / ".join(
        str(sum(1 for v in world_countries.values() if len(v['creatures']) == n)) for n in (1, 2, 3)))
    print(f"\nWritten: {OUT_JS.relative_to(ROOT)} ({OUT_JS.stat().st_size // 1024} KB) and "
          f"{len(used)} pictures in {IMG_DIR.relative_to(ROOT)}/")
    print("\nPicked per country (check these look right):")
    names = {e["id"]: e["name"] + ("" if e["kind"] == "folklore" else " [cryptid]") for e in entries}
    for country, info in world_countries.items():
        print(f"   {country}: " + ", ".join(names[i] for i in info["creatures"]))
    print("\nCryptid list locations (check these look right):")
    print("\n".join(review))
    print("\nCulture labels that couldn't be placed in a country (add them to CULTURE_TO_COUNTRY):")
    print("   " + ", ".join(f"{label} ({n})" for label, n in unplaced.most_common(60)))
    print("\nSkipped:")
    for reason, items in skipped.items():
        print(f"   {reason}: {len(items)}  e.g. {'; '.join(items[:4])}")
    bad_targets = sorted({v for v in CULTURE_TO_COUNTRY.values() if not resolve_country(v, countries)})
    print("\nCULTURE_TO_COUNTRY countries not found in Wikipedia's capitals list (fix the spelling):\n   "
          + (", ".join(bad_targets) or "none"))
    missing = sorted(set(countries) - set(world_countries))
    print(f"\nCountries with no creatures yet ({len(missing)}):\n   " + ", ".join(missing))
    print(f"\nRequests: {STATS['downloaded']} downloaded, {STATS['cached']} from cache. "
          f"Took {int(time.time() - started)}s.")


if __name__ == "__main__":
    main()
