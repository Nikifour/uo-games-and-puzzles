# What's new in Games and Puzzles

One section per version, newest first. The in-Foundry "What's new" notice,
the GitHub release notes and the Boosty post all come from here.

## 0.28.0 — 2026-09-18

- **The GM panel is rebuilt.** It used to be a row of fourteen buttons in no particular order; now the entries are split into "Puzzles" and "Games" and laid out as tiles.
- **A click unfolds a description** instead of opening the settings: an example screenshot and a few lines on what the players will be doing. The settings dialog is opened by the "Set up and lay out" button inside the description.
- **Folders in the preset store.** Presets can be sorted into folders — by scene or by place, nested: "Manor" with "Cellar" inside. A folder can be created empty and filled later; a preset is moved at any time with the folder button in its row.
- **Search by name** in the store: any part of it, case and "ё" aside, folder names included. Each hit shows its path, so it is clear where it came from.
- Removing a folder loses nothing: its presets and nested folders move up one level.
- The GM panel now shows a summary and an "Open the store" button instead of the long list of presets.

## 0.27.0 — 2026-09-17

- **The sequence is rebuilt.** The field is now a grid of any shape — a row, a square or a rectangle up to 6 × 12. The GM builds the puzzle in a preparation window right on the field: take a picture from a set or your own file and put it into a cell.
- **Fixed pictures and the choice.** A lock fixes a picture in place, visible to players from the start as a hint; the rest go to the choice under the field and can be put into any cell.
- **Decoys:** extra pictures in the choice with no place on the field, to mislead the players.
- **Blocked cells:** empty cells of the solution shape the field. This can be turned off — then the right answer is to leave the cell empty.
- Pictures are placed by clicking or dragging; right-click puts a picture back. The check is "Pull the lever", and the hint says "in their places: 3 of 4".
- Fixed: the old sequence cards stretched across the whole window — the "Map of paths" styling overrode them.
- Old sequence presets open and lay out as a row where everything is a choice.
- **The module is renamed "UO · Games and Puzzles",** and the repository moved to [github.com/Nikifour/uo-games-and-puzzles](https://github.com/Nikifour/uo-games-and-puzzles). Old links redirect; existing installs update as usual.
- **The English translation is complete:** attempt and move counters, the dice log, chat messages, look, coin and temper names, dialog hints, module setting names and hints — some of these used to stay in Russian.
- Fixed: a stray bracket in the GM's Sleight of Hand whisper; the "this is you" line and the order reveal in the Device; the list of true inscriptions in the Gates.
- README in English and Russian, new screenshots.

## 0.26.0 — 2026-09-15

- **A "What's new" notice** when the world starts: after an update the GM sees what changed, and when a new version is out on GitHub, its changelog and where to update. Checking for new versions can be turned off in the module settings.
- **Module language in its settings:** "Same as Foundry", "Русский" or "English". Foundry can run in English while the module speaks Russian, and the other way round.
- **With any Foundry language other than Russian the module now speaks English,** not Russian.

## 0.25.2 — 2026-09-12

- The guide's introduction lists all fourteen pieces: eleven puzzles and three games.

## 0.25.1 — 2026-09-12

- License: anyone may download and play with it; redistributing or selling the module is not allowed.

## 0.25.0 — 2026-09-12

- First release on GitHub. Installs from the manifest URL and updates itself from then on.
