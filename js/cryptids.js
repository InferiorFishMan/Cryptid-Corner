/* =====================================================================
   BESTIARY DATA
   Every cryptid has exactly the same fields, so every bestiary page
   looks the same (bestiary.html lists them, cryptid.html shows one).

   TO ADD A CRYPTID:
     1. Copy one whole { ... } block, paste it at the end, add a comma.
     2. Change every value. Keep every field, even if it's an empty list [].
     3. Open cryptid.html?id=<your-id> to check it.

   FIELD GUIDE
     id               lowercase-with-dashes, used in the link: cryptid.html?id=mothman
     name, aliases    main name + other names people search for
     image, imageAlt  picture in /assets + a short description of it
     region           where it is reported (town / state / country)
     area             big area used for searching (e.g. "North America")
     culture          whose story this is. If it comes from a living culture's
                      traditions (e.g. the Wendigo, from Algonquian peoples),
                      name and credit that culture: treat it as heritage,
                      not just a monster.
     firstReported    year or period of the first known report
     description      what people say it looks like / does
     origin           where the legend comes from
     sources          books, articles, archives (only ones you have checked)
     claims           every claim gets a type:
                        "folklore" = story or legend
                        "sighting" = someone reported seeing it
                        "evidence" = photos, tracks, remains (or the lack of them)
     evidenceStrength 1 = folklore only ... 5 = solid physical evidence
     explanations     possible ordinary explanations (gives skeptics a role)
     board            name of its discussion board on the home page
     products         related gear. affiliate: true shows an "Affiliate link" label
   ===================================================================== */

const CRYPTIDS = [
  {
    id: "loveland-frog",
    name: "Loveland Frog",
    aliases: ["Loveland Frogman", "Loveland Lizard"],
    image: "assets/Fa77soNXgAAoTNH.pixel-4bit.png",
    imageAlt: "Pixel art of a frog-like humanoid standing upright",
    region: "Loveland, Ohio, USA (along the Little Miami River)",
    area: "North America",
    culture: "Local legend from southwest Ohio, USA",
    firstReported: "1955",
    description:
      "A frog-faced humanoid about 1 to 1.2 m (3 to 4 ft) tall with leathery skin, said to walk upright on two legs near the river at night.",
    origin:
      "A small-town legend that grew through local retellings, later cryptozoology books and the internet. Loveland now treats the frog as a friendly local mascot.",
    sources: [],
    claims: [
      {
        type: "folklore",
        year: "1955",
        text: "A travelling businessman reportedly saw three frog-faced figures by the roadside at night. The story was not recorded at the time and is known only from later retellings."
      },
      {
        type: "sighting",
        year: "March 1972",
        text: "A Loveland police officer reported a creature crouching by the road that jumped over a guardrail towards the river."
      },
      {
        type: "sighting",
        year: "1972",
        text: "A second officer reported seeing a similar creature weeks later. He later said it was most likely a large pet lizard."
      },
      {
        type: "evidence",
        year: "—",
        text: "No photos, tracks or remains have ever been documented."
      }
    ],
    evidenceStrength: 1,
    explanations: [
      "An escaped pet iguana or other large lizard (the second officer's own later explanation).",
      "Ordinary animals misjudged at night in car headlights.",
      "A story that grew bigger every time it was retold."
    ],
    board: "lovelandfrog",
    products: [
      { name: "Waterproof wading boots", note: "for riverbank searches", url: "#", affiliate: true },
      { name: "Red-light headlamp", note: "keeps your night vision", url: "#", affiliate: false }
    ]
  },

  {
    id: "mothman",
    name: "Mothman",
    aliases: ["The Bird Man", "Point Pleasant Monster"],
    image: "assets/Mothman-PNG-Image-Background.png",
    imageAlt: "Drawing of a dark winged humanoid with glowing red eyes",
    region: "Point Pleasant, West Virginia, USA",
    area: "North America",
    culture: "Modern Appalachian legend, West Virginia, USA",
    firstReported: "1966",
    description:
      "A man-sized grey or dark figure with huge wings and glowing red eyes, said to fly alongside cars at high speed.",
    origin:
      "The legend began with a wave of local reports in 1966 and was made famous by John Keel's 1975 book. Point Pleasant now holds a yearly Mothman Festival and has a Mothman statue.",
    sources: [
      "John A. Keel, The Mothman Prophecies (1975)",
      "Point Pleasant Register newspaper coverage, November 1966"
    ],
    claims: [
      {
        type: "sighting",
        year: "12 Nov 1966",
        text: "Gravediggers near Clendenin, West Virginia, reported a man-like figure gliding over the trees."
      },
      {
        type: "sighting",
        year: "15 Nov 1966",
        text: "Two young couples driving near a former WWII explosives site (the \"TNT area\") reported a winged creature with red eyes that chased their car."
      },
      {
        type: "folklore",
        year: "1967 onwards",
        text: "After the Silver Bridge collapsed in December 1967, killing 46 people, some linked the creature to the disaster. The idea of Mothman as a warning of tragedy comes from this."
      },
      {
        type: "evidence",
        year: "—",
        text: "No verified photos or physical remains. All evidence is eyewitness reports."
      }
    ],
    evidenceStrength: 2,
    explanations: [
      "A sandhill crane, which is tall and has red patches around its eyes (suggested by a West Virginia University biologist at the time).",
      "A large owl, whose eyes can shine red in headlights.",
      "More people looking, and reporting, after the newspaper stories came out."
    ],
    board: "mothman",
    products: [
      { name: "8×42 binoculars", note: "good in low light", url: "#", affiliate: true },
      { name: "Mothman enamel pin", note: "Cryptid Corner original", url: "#", affiliate: false }
    ]
  },

  {
    id: "jersey-devil",
    name: "Jersey Devil",
    aliases: ["Leeds Devil"],
    image: "assets/349352.png",
    imageAlt: "Drawing of a winged creature with hooves, horns and a forked tail",
    region: "Pine Barrens, New Jersey, USA",
    area: "North America",
    culture: "Colonial-era folklore of the New Jersey Pine Barrens, USA",
    firstReported: "1700s (legend), 1909 (wave of sightings)",
    description:
      "A creature with hooves, bat-like wings, a horse- or goat-like head and a forked tail, known for a blood-curdling scream.",
    origin:
      "The best-known version says a woman called \"Mother Leeds\" had her 13th child in 1735, and the baby turned into a devil and flew up the chimney. Historians connect the \"Leeds Devil\" name to 18th-century feuds in which rivals painted the almanac-publishing Leeds family as devilish.",
    sources: [
      "James F. McCloy & Ray Miller Jr., The Jersey Devil (1976)"
    ],
    claims: [
      {
        type: "folklore",
        year: "1735",
        text: "The Mother Leeds story, passed down in the Pine Barrens and told in many different versions."
      },
      {
        type: "sighting",
        year: "January 1909",
        text: "Over about a week, newspapers printed hundreds of reports of strange tracks and sightings across New Jersey and Pennsylvania. Some schools and businesses reportedly closed."
      },
      {
        type: "evidence",
        year: "1909",
        text: "The tracks were never verified, and hoaxes followed: a Philadelphia showman displayed a kangaroo with fake wings as the \"Jersey Devil\"."
      }
    ],
    evidenceStrength: 1,
    explanations: [
      "Screams from foxes, owls or other night animals in the forest.",
      "Newspapers in 1909 competing for the most exciting story.",
      "An old political insult that turned into a monster story."
    ],
    board: "jerseydevil",
    products: [
      { name: "Plaster footprint casting kit", note: "for strange tracks", url: "#", affiliate: true },
      { name: "Pine Barrens trail map", note: "stay on public trails", url: "#", affiliate: false }
    ]
  },

  {
    id: "flatwoods-monster",
    name: "Flatwoods Monster",
    aliases: ["Braxton County Monster", "Phantom of Flatwoods"],
    image: "assets/flatwoods_monster_by_crosslantis_dm3rvnn-fullview.png",
    imageAlt: "Drawing of a tall figure with a spade-shaped hood and glowing face",
    region: "Flatwoods, Braxton County, West Virginia, USA",
    area: "North America",
    culture: "1950s UFO-era legend, West Virginia, USA",
    firstReported: "12 September 1952",
    description:
      "A figure about 3 m (10 ft) tall with a glowing face, a spade-shaped hood and a skirt-like body, together with a foul-smelling mist that made witnesses sick.",
    origin:
      "Born during the 1950s UFO craze, the story spread through national newspapers within days. The legend is now a local point of pride, with a museum in nearby Sutton.",
    sources: [
      "Joe Nickell, \"The Flatwoods UFO Monster\", Skeptical Inquirer (2000)"
    ],
    claims: [
      {
        type: "sighting",
        year: "12 Sep 1952",
        text: "A group of boys saw a bright light come down on a hill. They went to look with a local mother, Kathleen May, and others, and reported a tall glowing figure and a sickening mist."
      },
      {
        type: "evidence",
        year: "1952",
        text: "Visitors afterwards described flattened grass and a strange smell, but nothing was ever verified."
      },
      {
        type: "folklore",
        year: "1952 onwards",
        text: "The creature became a classic of UFO culture and is still shown on local signs, statues and merchandise."
      }
    ],
    evidenceStrength: 2,
    explanations: [
      "The bright light was a meteor that people in several states saw that same evening.",
      "The \"monster\" was a barn owl on a branch: its face and hooded shape can look huge in torchlight (investigator Joe Nickell's explanation).",
      "Fear and the smell of the grass made the scene feel bigger than it was."
    ],
    board: "flatwoodsmonster",
    products: [
      { name: "Motion-triggered trail camera", note: "watch a spot overnight", url: "#", affiliate: true },
      { name: "Flatwoods Monster sticker", note: "Cryptid Corner original", url: "#", affiliate: false }
    ]
  }
];
