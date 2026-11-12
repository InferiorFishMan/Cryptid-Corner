/* =====================================================================
   SIGHTINGS DATA (map.html)
   Every sighting has the same fields, so the map, the filters and the
   list all work the same way for every report.

   TO ADD A SIGHTING: copy one { ... } block, paste it into the list,
   change the values and keep every field.

   FIELD GUIDE
     creature    the cryptid's name, spelled the same way every time.
                 If it matches a name in js/cryptids.js, the map links
                 to that bestiary entry automatically.
     title       short headline for the report
     date        "YYYY-MM-DD", or "YYYY-MM", or just "YYYY" if that's all we know
     place       the nearest town, park or lake. NEVER a street or home address.
     area        big region used by the Region filter (e.g. "Europe")
     lat, lng    rough location, at most 2 decimals (look it up on any online map).
                 The page also blurs every location to about 5 km and never zooms
                 in to street level, so nobody's home or private land is shown.
     danger      1 = Harmless, 2 = Unsettling, 3 = Threatening, 4 = Dangerous, 5 = Extreme
     evidence    "none" (eyewitness only), "photo", "video", "tracks" (or marks), "audio"
     source      "historical" = a documented case from books or newspapers
                 "community"  = posted by a Cryptid Corner member
     reportedBy  member's username, or where a historical case was recorded
     summary     one or two sentences about what happened

   NOTE: the "community" reports below are made-up examples for the
   prototype. The "historical" ones are based on well-known cases.
   ===================================================================== */

const SIGHTINGS = [

  /* ---------------- HISTORICAL RECORDS ---------------- */

  {
    creature: "Black Shuck",
    title: "The black dog in the church",
    date: "1577-08-04",
    place: "Bungay, Suffolk, England, UK",
    area: "Europe",
    lat: 52.46, lng: 1.44,
    danger: 5,
    evidence: "tracks",
    source: "historical",
    reportedBy: "Abraham Fleming's pamphlet, 1577",
    summary: "During a violent storm, a huge black dog was said to burst into St Mary's church and kill two people. A church door in nearby Blythburgh still has scorch marks people call the devil's fingerprints."
  },
  {
    creature: "Jersey Devil",
    title: "Where the legend was born",
    date: "1735",
    place: "Leeds Point, New Jersey, USA",
    area: "North America",
    lat: 39.51, lng: -74.43,
    danger: 2,
    evidence: "none",
    source: "historical",
    reportedBy: "Pine Barrens folklore",
    summary: "The legend says \"Mother Leeds\" had her 13th child here, and it turned into a winged devil and flew up the chimney."
  },
  {
    creature: "Jersey Devil",
    title: "The week of hoofprints",
    date: "1909-01",
    place: "Burlington County, New Jersey, USA",
    area: "North America",
    lat: 40.07, lng: -74.86,
    danger: 3,
    evidence: "tracks",
    source: "historical",
    reportedBy: "New Jersey newspapers, 1909",
    summary: "Over about a week, hundreds of people reported strange hoofprints in the snow and a flying creature. Some schools and mills reportedly closed."
  },
  {
    creature: "Snallygaster",
    title: "A winged beast over Middletown",
    date: "1909-02",
    place: "Middletown Valley, Maryland, USA",
    area: "North America",
    lat: 39.44, lng: -77.55,
    danger: 3,
    evidence: "none",
    source: "historical",
    reportedBy: "Middletown Valley Register, 1909",
    summary: "The local paper printed reports of a huge winged creature with one eye. The name comes from German settlers' \"Schneller Geist\" (quick ghost)."
  },
  {
    creature: "Trunko",
    title: "The white beast that fought two whales",
    date: "1922-11-01",
    place: "Margate, KwaZulu-Natal, South Africa",
    area: "Africa",
    lat: -30.86, lng: 30.37,
    danger: 1,
    evidence: "none",
    source: "historical",
    reportedBy: "Historical record",
    summary: "Witnesses said two whales fought a huge white, furry sea creature with a trunk. Its body later washed up on the beach, but no scientist examined it."
  },
  {
    creature: "Mongolian Death Worm",
    title: "The worm that kills instantly",
    date: "1926",
    place: "Gobi Desert, Mongolia",
    area: "Asia",
    lat: 43.5, lng: 104.0,
    danger: 5,
    evidence: "none",
    source: "historical",
    reportedBy: "Roy Chapman Andrews, 1926",
    summary: "An American explorer wrote that Mongolian officials described a red, sausage-shaped worm that could kill instantly. Locals call it olgoi-khorkhoi."
  },
  {
    creature: "Jackalope",
    title: "The first jackalope",
    date: "1932",
    place: "Douglas, Wyoming, USA",
    area: "North America",
    lat: 42.76, lng: -105.38,
    danger: 1,
    evidence: "none",
    source: "historical",
    reportedBy: "Historical record",
    summary: "Two brothers who were taxidermists put deer antlers on a jackrabbit and sold it, starting the jackalope craze."
  },
  {
    creature: "Loch Ness Monster",
    title: "The sighting that started it all",
    date: "1933-04",
    place: "North shore of Loch Ness, Scotland, UK",
    area: "Europe",
    lat: 57.37, lng: -4.42,
    danger: 1,
    evidence: "none",
    source: "historical",
    reportedBy: "Inverness Courier, 1933",
    summary: "A couple driving along the new lochside road reported a large animal rolling and plunging in the water. The newspaper story started the modern Nessie craze."
  },
  {
    creature: "Caddy",
    title: "A sea serpent gets its name",
    date: "1933",
    place: "Cadboro Bay, Victoria, British Columbia, Canada",
    area: "North America",
    lat: 48.46, lng: -123.29,
    danger: 1,
    evidence: "none",
    source: "historical",
    reportedBy: "Victoria Daily Times, 1933",
    summary: "Sailors reported a long serpent with a horse-like head. A local newspaper named it \"Cadborosaurus\" after the bay."
  },
  {
    creature: "Loch Ness Monster",
    title: "The Surgeon's Photograph",
    date: "1934-04",
    place: "Loch Ness, Scotland, UK",
    area: "Europe",
    lat: 57.25, lng: -4.55,
    danger: 1,
    evidence: "photo",
    source: "historical",
    reportedBy: "Daily Mail, 1934",
    summary: "The most famous Nessie photo, showing a long neck rising from the water. In 1994 it was revealed to be a hoax made with a toy submarine."
  },
  {
    creature: "Tatzelwurm",
    title: "A cat-faced lizard in the Alps",
    date: "1934",
    place: "Near Meiringen, Switzerland",
    area: "Europe",
    lat: 46.73, lng: 8.19,
    danger: 2,
    evidence: "photo",
    source: "historical",
    reportedBy: "Historical record",
    summary: "A photographer published a picture of a stubby, lizard-like creature with a cat's face. Many believe the photo was staged."
  },
  {
    creature: "Yeti",
    title: "The famous footprint photo",
    date: "1951-11",
    place: "Menlung Glacier, Nepal–China border",
    area: "Asia",
    lat: 28.0, lng: 86.4,
    danger: 2,
    evidence: "photo",
    source: "historical",
    reportedBy: "Eric Shipton's expedition, 1951",
    summary: "Mountaineers photographed a huge footprint in the snow with an ice axe for scale. It is still one of the best-known pieces of Yeti evidence."
  },
  {
    creature: "Flatwoods Monster",
    title: "The glowing giant on the hill",
    date: "1952-09-12",
    place: "Flatwoods, Braxton County, West Virginia, USA",
    area: "North America",
    lat: 38.72, lng: -80.65,
    danger: 3,
    evidence: "none",
    source: "historical",
    reportedBy: "Historical record",
    summary: "A group of locals followed a bright light to a hilltop and reported a 3 m tall glowing figure and a mist that made them sick."
  },
  {
    creature: "Hopkinsville Goblin",
    title: "A night under siege",
    date: "1955-08-21",
    place: "Kelly, near Hopkinsville, Kentucky, USA",
    area: "North America",
    lat: 36.96, lng: -87.47,
    danger: 3,
    evidence: "none",
    source: "historical",
    reportedBy: "Historical record",
    summary: "A farm family said small, glowing, big-eared creatures surrounded their house all night. They fired guns at them; police found bullet holes but no creatures."
  },
  {
    creature: "Mothman",
    title: "Something gliding over the graves",
    date: "1966-11-12",
    place: "Near Clendenin, West Virginia, USA",
    area: "North America",
    lat: 38.49, lng: -81.35,
    danger: 1,
    evidence: "none",
    source: "historical",
    reportedBy: "Historical record",
    summary: "Gravediggers reported a man-like figure gliding low over the trees."
  },
  {
    creature: "Mothman",
    title: "Red eyes chased our car",
    date: "1966-11-15",
    place: "The \"TNT area\" north of Point Pleasant, West Virginia, USA",
    area: "North America",
    lat: 38.91, lng: -82.10,
    danger: 3,
    evidence: "none",
    source: "historical",
    reportedBy: "Point Pleasant Register, 1966",
    summary: "Two young couples said a winged figure with glowing red eyes chased their car at high speed."
  },
  {
    creature: "Bigfoot",
    title: "The Patterson–Gimlin film",
    date: "1967-10-20",
    place: "Bluff Creek, Six Rivers National Forest, California, USA",
    area: "North America",
    lat: 41.44, lng: -123.70,
    danger: 1,
    evidence: "video",
    source: "historical",
    reportedBy: "Roger Patterson & Bob Gimlin, 1967",
    summary: "About a minute of film showing a large, hairy figure walking away across a creek bed. Still debated: a real animal or a person in a costume?"
  },
  {
    creature: "Ogopogo",
    title: "A dark shape on film",
    date: "1968-08",
    place: "Okanagan Lake, British Columbia, Canada",
    area: "North America",
    lat: 49.88, lng: -119.50,
    danger: 1,
    evidence: "video",
    source: "historical",
    reportedBy: "Historical record",
    summary: "A man filmed a long, dark shape moving through the lake. Skeptics say it could be a boat wake or a large fish."
  },
  {
    creature: "Loveland Frog",
    title: "The frog by the guardrail",
    date: "1972-03-03",
    place: "Little Miami River, Loveland, Ohio, USA",
    area: "North America",
    lat: 39.27, lng: -84.27,
    danger: 1,
    evidence: "none",
    source: "historical",
    reportedBy: "Loveland police report, 1972",
    summary: "A police officer saw a creature about 1 m tall crouching by the road. It jumped over the guardrail towards the river."
  },
  {
    creature: "Enfield Horror",
    title: "Three legs and pink eyes",
    date: "1973-04-25",
    place: "Enfield, Illinois, USA",
    area: "North America",
    lat: 38.10, lng: -88.34,
    danger: 4,
    evidence: "none",
    source: "historical",
    reportedBy: "Historical record",
    summary: "A resident said a grey, three-legged creature with pink eyes scratched at his door and hopped away when he fired at it."
  },
  {
    creature: "Dover Demon",
    title: "The figure on the stone wall",
    date: "1977-04-21",
    place: "Dover, Massachusetts, USA",
    area: "North America",
    lat: 42.25, lng: -71.28,
    danger: 1,
    evidence: "none",
    source: "historical",
    reportedBy: "Historical record",
    summary: "A teenager driving at night saw a thin creature with a huge head and glowing orange eyes on a stone wall. Two more people reported it over the next day."
  },
  {
    creature: "Beast of Bray Road",
    title: "A wolf that walked upright",
    date: "1989",
    place: "Bray Road, near Elkhorn, Wisconsin, USA",
    area: "North America",
    lat: 42.68, lng: -88.53,
    danger: 3,
    evidence: "none",
    source: "historical",
    reportedBy: "Historical record",
    summary: "Several people around Elkhorn described a wolf-like creature that walked on two legs. Local newspaper stories in 1991 made it famous."
  },
  {
    creature: "Chupacabra",
    title: "The goat-sucker appears",
    date: "1995-08",
    place: "Canóvanas, Puerto Rico",
    area: "North America",
    lat: 18.38, lng: -65.90,
    danger: 4,
    evidence: "none",
    source: "historical",
    reportedBy: "Historical record",
    summary: "After farm animals were found dead with puncture wounds, a resident described a spiny, big-eyed creature on two legs. Chupacabra means \"goat-sucker\"."
  },
  {
    creature: "Skunk Ape",
    title: "The Myakka photographs",
    date: "2000-12",
    place: "Sarasota County, Florida, USA",
    area: "North America",
    lat: 27.24, lng: -82.31,
    danger: 2,
    evidence: "photo",
    source: "historical",
    reportedBy: "Anonymous letter to the Sarasota Sheriff, 2000",
    summary: "Two photos of a large ape-like animal were mailed to police. The sender said it had been taking apples from her porch."
  },
  {
    creature: "Fresno Nightcrawler",
    title: "Walking trousers on camera",
    date: "2007",
    place: "Fresno, California, USA",
    area: "North America",
    lat: 36.75, lng: -119.77,
    danger: 1,
    evidence: "video",
    source: "historical",
    reportedBy: "Home security camera, 2007",
    summary: "A security camera filmed small white figures that look like pairs of trousers walking across a front yard."
  },

  /* ---------------- COMMUNITY REPORTS (examples) ---------------- */

  {
    creature: "Mothman",
    title: "Red eyes on the old chimney",
    date: "2026-10-31",
    place: "Near Point Pleasant, West Virginia, USA",
    area: "North America",
    lat: 38.85, lng: -82.13,
    danger: 2,
    evidence: "photo",
    source: "community",
    reportedBy: "MothWatcher_WV",
    summary: "Blurry photo of two red lights on top of a chimney. Could be aircraft warning lights... but they blinked at me."
  },
  {
    creature: "Fresno Nightcrawler",
    title: "Doorbell camera: walking pants",
    date: "2026-10-20",
    place: "Fresno, California, USA",
    area: "North America",
    lat: 36.80, lng: -119.72,
    danger: 1,
    evidence: "video",
    source: "community",
    reportedBy: "FresnoNightOwl",
    summary: "My doorbell camera caught two white leg-things strolling across the lawn at 3 a.m. No body. No explanation."
  },
  {
    creature: "Jersey Devil",
    title: "Hoofprints and a scream",
    date: "2026-10-02",
    place: "Wharton State Forest, New Jersey, USA",
    area: "North America",
    lat: 39.72, lng: -74.67,
    danger: 3,
    evidence: "tracks",
    source: "community",
    reportedBy: "PineyRanger",
    summary: "A line of two-legged hoofprints in the sand road, then a scream that didn't sound like any fox I know."
  },
  {
    creature: "Loveland Frog",
    title: "Something hopped across the bike trail",
    date: "2026-09-14",
    place: "Little Miami Scenic Trail, Loveland, Ohio, USA",
    area: "North America",
    lat: 39.29, lng: -84.25,
    danger: 1,
    evidence: "none",
    source: "community",
    reportedBy: "frogfan1972",
    summary: "At dusk, a knee-high thing hopped across the trail on two legs and splashed into the river. My dog refused to move."
  },
  {
    creature: "Flatwoods Monster",
    title: "Hooded shape on the hilltop",
    date: "2026-09-12",
    place: "Flatwoods, West Virginia, USA",
    area: "North America",
    lat: 38.73, lng: -80.60,
    danger: 3,
    evidence: "photo",
    source: "community",
    reportedBy: "BraxtonBeliever",
    summary: "A tall, hooded shape with a glowing face on the hill. When I got closer it was gone, and the grass smelled like metal."
  },
  {
    creature: "Mongolian Death Worm",
    title: "Red worm in the dunes",
    date: "2026-09-05",
    place: "Southern Gobi, Mongolia",
    area: "Asia",
    lat: 43.6, lng: 103.0,
    danger: 5,
    evidence: "none",
    source: "community",
    reportedBy: "GobiGeo",
    summary: "A fat red worm-thing rose out of the sand near our camp. Our guide refused to go near it and made us move camp."
  },
  {
    creature: "Hopkinsville Goblin",
    title: "Glowing little figures at the tree line",
    date: "2026-08-21",
    place: "Kelly, Kentucky, USA",
    area: "North America",
    lat: 36.99, lng: -87.43,
    danger: 2,
    evidence: "none",
    source: "community",
    reportedBy: "KellyFarmKid",
    summary: "Small figures with big ears and glowing eyes at the edge of the woods. Might have been kids in costumes. Might not."
  },
  {
    creature: "Loch Ness Monster",
    title: "Three humps off Dores Beach",
    date: "2026-08-21",
    place: "Dores, Loch Ness, Scotland, UK",
    area: "Europe",
    lat: 57.38, lng: -4.33,
    danger: 1,
    evidence: "video",
    source: "community",
    reportedBy: "NessieOrNot",
    summary: "Three dark humps about 200 m out, gone after 30 seconds. My video is shaky. Could have been a boat wake."
  },
  {
    creature: "Caddy",
    title: "A camel-like head next to our boat",
    date: "2026-08-08",
    place: "Off Victoria, British Columbia, Canada",
    area: "North America",
    lat: 48.42, lng: -123.22,
    danger: 1,
    evidence: "photo",
    source: "community",
    reportedBy: "CaddySpotter",
    summary: "A long neck with a camel-like head popped up next to our sailboat, looked at us, and dived."
  },
  {
    creature: "Ogopogo",
    title: "Long shape swimming against the waves",
    date: "2026-07-19",
    place: "Okanagan Lake near Kelowna, British Columbia, Canada",
    area: "North America",
    lat: 49.85, lng: -119.55,
    danger: 2,
    evidence: "video",
    source: "community",
    reportedBy: "Kelowna_Kayaker",
    summary: "About 10 m long, moving against the waves while I was kayaking. I paddled to shore VERY fast."
  },
  {
    creature: "Bigfoot",
    title: "Wood knocks answered ours",
    date: "2026-07-03",
    place: "Gifford Pinchot National Forest, Washington, USA",
    area: "North America",
    lat: 46.2, lng: -121.9,
    danger: 2,
    evidence: "tracks",
    source: "community",
    reportedBy: "SquatchSquad",
    summary: "We knocked on a tree three times and something knocked back from the ridge. Next morning: a 40 cm footprint by the creek."
  },
  {
    creature: "Tatzelwurm",
    title: "Cat-faced lizard under a rock",
    date: "2026-06-28",
    place: "Bernese Oberland, Switzerland",
    area: "Europe",
    lat: 46.65, lng: 8.30,
    danger: 3,
    evidence: "photo",
    source: "community",
    reportedBy: "AlpineAnna",
    summary: "Short, thick lizard body and a face like a cat. It hissed at me. Legend says its breath is poisonous, so I kept my distance."
  },
  {
    creature: "Dover Demon",
    title: "Pale thing on the stone wall",
    date: "2026-06-09",
    place: "Dover, Massachusetts, USA",
    area: "North America",
    lat: 42.22, lng: -71.32,
    danger: 1,
    evidence: "photo",
    source: "community",
    reportedBy: "DoverDad",
    summary: "Thin, pale, big-headed figure on a wall, lit up by my headlights. My photo shows... mostly the wall."
  },
  {
    creature: "Bigfoot",
    title: "Huge shape crossed the highway",
    date: "2026-05-22",
    place: "Near Willow Creek, California, USA",
    area: "North America",
    lat: 40.94, lng: -123.63,
    danger: 2,
    evidence: "none",
    source: "community",
    reportedBy: "RedwoodRoadie",
    summary: "Two legs, about 2.5 m tall, crossed the road in three steps. I didn't stop to take a photo, sorry."
  },
  {
    creature: "Chupacabra",
    title: "Something got the goats",
    date: "2026-05-17",
    place: "Near Cuero, Texas, USA",
    area: "North America",
    lat: 29.09, lng: -97.29,
    danger: 4,
    evidence: "photo",
    source: "community",
    reportedBy: "goatsuckerHunter",
    summary: "Hairless, grey, dog-like animal by the goat pen. Two goats injured. The vet says it was probably a coyote with mange."
  },
  {
    creature: "Yeti",
    title: "Giant prints above base camp",
    date: "2026-05-02",
    place: "Khumbu region, Nepal",
    area: "Asia",
    lat: 27.95, lng: 86.80,
    danger: 3,
    evidence: "photo",
    source: "community",
    reportedBy: "SherpaTrekker",
    summary: "A line of huge prints in fresh snow above camp, much wider than a bear's. Our guide wouldn't talk about it."
  },
  {
    creature: "Enfield Horror",
    title: "Scratching at the back door",
    date: "2026-04-25",
    place: "Enfield, Illinois, USA",
    area: "North America",
    lat: 38.12, lng: -88.30,
    danger: 4,
    evidence: "tracks",
    source: "community",
    reportedBy: "EnfieldNeighbor",
    summary: "Something scratched at our back door all night. In the morning there were strange prints with six toes."
  },
  {
    creature: "Skunk Ape",
    title: "Rotten-egg smell and a big shape",
    date: "2026-04-11",
    place: "Big Cypress National Preserve, Florida, USA",
    area: "North America",
    lat: 25.95, lng: -81.10,
    danger: 3,
    evidence: "none",
    source: "community",
    reportedBy: "SwampSarah",
    summary: "An awful smell, then something heavy moved through the palmettos and grunted. I didn't wait to see more."
  },
  {
    creature: "Beast of Bray Road",
    title: "An upright \"wolf\" chased my car",
    date: "2026-03-28",
    place: "Near Elkhorn, Wisconsin, USA",
    area: "North America",
    lat: 42.66, lng: -88.58,
    danger: 4,
    evidence: "none",
    source: "community",
    reportedBy: "BrayRoadRunner",
    summary: "It ran on two legs next to my car for a few seconds at 50 km/h. Pointed ears, long snout. Never driving there at night again."
  },
  {
    creature: "Jackalope",
    title: "A rabbit with antlers?!",
    date: "2026-03-15",
    place: "Near Douglas, Wyoming, USA",
    area: "North America",
    lat: 42.80, lng: -105.45,
    danger: 1,
    evidence: "photo",
    source: "community",
    reportedBy: "WyoHunter",
    summary: "Zoomed photo shows horn-like lumps on a jackrabbit's head. The ranger says it's probably a rabbit virus, not a jackalope. Disappointed."
  },
  {
    creature: "Ningen",
    title: "Huge white shape by the ice",
    date: "2026-02-10",
    place: "Southern Ocean, off East Antarctica",
    area: "Antarctica",
    lat: -65.5, lng: 110.5,
    danger: 2,
    evidence: "photo",
    source: "community",
    reportedBy: "IcebreakerIvan",
    summary: "Something pale and very long floated next to the ship at night. It looked like it had arms. The crew are calling it a ningen."
  },
  {
    creature: "Snallygaster",
    title: "Shriek and wingbeats over the barn",
    date: "2026-02-02",
    place: "Near Middletown, Maryland, USA",
    area: "North America",
    lat: 39.47, lng: -77.50,
    danger: 3,
    evidence: "audio",
    source: "community",
    reportedBy: "FrederickFarmer",
    summary: "A whistling shriek and huge wingbeats over the barn at night. I recorded it. My neighbour says it's a barn owl."
  },
  {
    creature: "Ahool",
    title: "A bat as wide as a car",
    date: "2026-01-22",
    place: "Mount Salak, West Java, Indonesia",
    area: "Asia",
    lat: -6.72, lng: 106.73,
    danger: 2,
    evidence: "none",
    source: "community",
    reportedBy: "BatWatcherJava",
    summary: "A giant bat-like animal flew over the waterfall, calling \"a-hool!\". Its wings looked as wide as a car."
  },
  {
    creature: "Black Shuck",
    title: "Huge black dog in the fog",
    date: "2026-01-14",
    place: "Near Blythburgh, Suffolk, England, UK",
    area: "Europe",
    lat: 52.32, lng: 1.59,
    danger: 4,
    evidence: "none",
    source: "community",
    reportedBy: "ShuckWatcher",
    summary: "A calf-sized black dog with glowing eyes on the path by the church, then it vanished into the fog. Locals say seeing it is bad luck."
  },
  {
    creature: "Mothman",
    title: "Winged shadow over the river",
    date: "2025-12-02",
    place: "Point Pleasant, West Virginia, USA",
    area: "North America",
    lat: 38.80, lng: -82.18,
    danger: 2,
    evidence: "none",
    source: "community",
    reportedBy: "NightShiftNurse",
    summary: "A huge winged shape glided over the Ohio River under the streetlights. Probably a heron. Probably."
  },
  {
    creature: "Chupacabra",
    title: "Spiky silhouette by the chicken coop",
    date: "2025-11-20",
    place: "Near Canóvanas, Puerto Rico",
    area: "North America",
    lat: 18.33, lng: -65.86,
    danger: 3,
    evidence: "none",
    source: "community",
    reportedBy: "BoricuaNights",
    summary: "A spiky silhouette jumped the fence by the chicken coop. The chickens wouldn't come out for a whole day."
  },
  {
    creature: "Melon Heads",
    title: "Big-headed figures in the woods",
    date: "2025-10-31",
    place: "Trumbull, Connecticut, USA",
    area: "North America",
    lat: 41.24, lng: -73.21,
    danger: 2,
    evidence: "none",
    source: "community",
    reportedBy: "CTGhostDriver",
    summary: "Little figures with oversized heads ran across the road into the woods. It was Halloween night, so... make of that what you will."
  }
];
