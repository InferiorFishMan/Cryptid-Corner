<h1>Cryptid Corner</h1>

Welcome to the Cryptid Corner. We love cryptids and booty :)


## Updating the world bestiary

The creatures from around the world in the bestiary and on the map come from Wikipedia.
They are made by a small tool, so don't edit `js/world-cryptids.js` or `assets/cryptids/` by hand.

1. Install Pillow once: `pip install pillow`
2. Run `python3 tools/build_world_cryptids.py` from the project folder.
3. Read the report it prints at the end. It lists the cultures it couldn't place in a
   country, the countries that still have no creatures, and what it skipped.
4. To change what it picks (how many per country, creatures to leave out, which country a
   culture belongs to), edit the settings at the top of the tool and run it again.

The first run takes a while because it asks Wikipedia slowly, as Wikipedia asks tools to do.
Later runs are quick because the answers are saved in `tools/.cache/` (not uploaded to GitHub).
Use `--refresh` to ask Wikipedia again for everything.

Wikipedia text is CC BY-SA 4.0 and every picture keeps its own free licence. The bestiary
pages credit both, so keep those credit lines if you change the page design.
