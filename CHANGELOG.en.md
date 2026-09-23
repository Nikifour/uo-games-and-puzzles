# What's new in Games and Puzzles

One section per version, newest first. The in-Foundry "What's new" notice,
the GitHub release notes and the Boosty post all come from here.

## 0.29.0 — 2026-09-23

- **A new "Devices" section.** A puzzle is solved, a game is played, and at a device people work together: one sees, the others act. There used to be exactly one such thing — the Device and the Torn Manual — and it sat among the puzzles. It is now a kind of its own, and there are three.
- **"Hall of Prisms (D)"** — the hall of prisms for several people. Only the navigator sees the beams, the mirrors and their numbers; everyone else stands at a panel of labelled levers, and which lever turns which mirror is known to the navigator alone. Levers are split between panels, and a panel can belong to a named player or to anyone. The navigator gets no built-in hints — only the ones the GM wrote.
- **"Combination Lock (D)"** — the same with the lock: the navigator sees the dials and presses "Check", while the others turn them. A lever moves a dial one step on; give two levers per dial to turn it both ways.
- **Time.** Devices share a timer — minutes and seconds, kept by the server clock. When it runs out the prisms freeze and the lock stops; "Reset" winds the clock again.
- **Every puzzle's settings now show a live view.** Fields on the left, on the right the puzzle window exactly as a player will see it, rebuilt on every edit. What you see is what gets laid out. Done for the lock, mosaic, inscription, slabs, gates, constellation, map of paths, both halls and the device.
- **The solution in the settings window.** A "Players' view / Solution" switch for the entries that can show the answer. The lock, for now.
- **The hall of prisms has grown threefold.** A **splitter** has appeared: it breaks an incoming beam into pure colours and lets each out through its own face, and it can rotate. Hence new kinds of hall: "Addition: 3 beams to white", "Splitting: 2 colours", "Splitting: white to 3 colours", and "Splitting and addition", where the broken beam is gathered back together.
- **Your own palette for the hall of prisms.** The GM defines their own colours and rules: "orange + green = blue", custom breakdowns for the splitter. A mix with no rule goes dark.
- **The hall of prisms can be built by hand.** The GM places the sources, mirrors, mixers, splitters and crystals, and the module computes the light as they go and says in how many turns the hall is solved. "Scramble" sets the rotations at random, as long as the hall is not solved already.
- **The halls are deeper:** mirrors — up to 15 turns and 12 spare mirrors (was 8 and 8), prisms — up to 16 turns and 12 spare (was 9 and 6). The depth search was rewritten: it walks the lit mirrors instead of trying everything, and the old ceiling of 16 mirrors is gone.
- **Combination lock: a set per dial.** The set used to be shared by the whole lock; now one dial can carry runes and another digits. The code is no longer typed as a string but picked dial by dial — moons and runes cannot be typed on a keyboard. The starting position is set too, and "Reset" returns to it. Buttons: "Random code", "Random start", "All random".
- **Inscription: letters revealed by the count.** The GM sets "letters per reveal" and the number of reveals. Players mark that many cipher letters and press "Reveal": the true values are shown, those letters are fixed for good, a reveal is spent and announced in chat.
- **The sequence goes up to 12 × 12** (six rows was the limit) and the decoys got a clearer label.
- **Devices are no longer created in the module settings.** The store is kept from the lay-out window: "New device" and "Edit selected", and an empty store opens the new-device window straight away.
- **Time in the GM's hands.** A table with a timer now has a time section of its own: "−30 s", "Pause" and "+30 s". The clock can be stopped and started again, half a minute added or taken away. The pause lives on the table rather than in a browser — it survives a closed window and a re-entry into the world, and while it holds, time never runs out. "Reset" still winds the full term again.
- **"Who is where…" — reseating at a live table.** A player dropped out, two of them swapped seats, someone stepped away: a GM button in the device window changes the navigator and the panel owners without replaying the lay-out. Pick someone who already sits somewhere and the two swap places, in any direction — panel with panel, navigator with panel. And when two people are at the device there is a **"Swap places"** button — that is usually how they ask for it. **A spare panel can be removed** and its levers handed to another panel: lever numbers run through and do not change, so the navigator still says "the fifth". The levers, the marks and the hint are untouched by reseating.
- **"Bring the window back" in the "On the table now" list.** A player closed their window with the cross; it used to be brought back by hiding the puzzle and showing it again, which closed the window for a moment for everyone who had not closed anything. Now one button brings it back for those who closed it and leaves the others alone.
- Fixed: **every window of the module scrolls**, not just the sequence — the list of players and bots grows on its own, and the buttons below it went off the screen.
- Fixed: **the cheat's Sleight of Hand** was read from the sheet under the wrong skill name, so the modifier at the table was always zero. An old mistake, unrelated to the Foundry update.
- Fixed: the sequence preparation window is no taller than the screen, its cells do not stretch, and the second size field is no wider than its row.

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
