# UO · Games and Puzzles

**English** · [Русский](README.ru.md)

Interactive puzzles and tavern dice games for Foundry VTT that the whole table
plays together: the GM lays a puzzle out, the players solve it, and everyone
sees every move at the same moment.

<table>
  <tr>
    <td width="50%"><img src="docs/sequence.png" alt="Sequence: pictures placed on a grid, a fixed hint and decoys in the choice"></td>
    <td width="50%"><img src="docs/lock.png" alt="Combination lock with rune dials"></td>
  </tr>
  <tr>
    <td><img src="docs/mirrors.png" alt="Hall of mirrors: a beam routed to the crystal"></td>
    <td><img src="docs/dice.png" alt="Dice with tavern bot opponents"></td>
  </tr>
</table>

A puzzle at the table usually turns into narration: the GM describes what is
visible, the players say what they do. Here the puzzle lands on the table as a
shared window: one player turns a dial, the others watch it turn, and the
answer is checked by the GM's client — never shipped to the players.
<p align="center"><img src="docs/panel.png" alt="The GM panel: puzzles and games in separate sections, a description with an example unfolded" width="420"></p>

The GM panel keeps the sixteen contraptions apart by kind — ten puzzles, three
devices, three games — and a click on a name unfolds a description with an
example before anything is set up.

## Installation

In Foundry's **Install Module** dialog, paste the manifest URL:

```
https://github.com/Nikifour/uo-games-and-puzzles/releases/latest/download/module.json
```

- Foundry VTT **v13–v14**, game system **dnd5e 5.0+** (the dice games read
  character sheets for coins and skill checks).
- Optional: [Monk's Active Tile Triggers](https://foundryvtt.com/packages/monks-active-tiles)
  to open a puzzle from a tile and unlock a door when it is solved;
  Dice So Nice for 3D dice. Everything else works without them.
- The interface is in **English and Russian**. It follows Foundry's language,
  or pick one in the module settings.
- A guide ships with the module as a compendium: *Games and Puzzles · How to use*.

## How it works

1. The GM opens the panel (the **Games and Puzzles** button in the Journal Notes scene controls,
   or `UOIgry.panel()`) and lays a puzzle out — right away, or from a preset
   prepared before the session.
2. A window opens for every connected player. Moves are sent to the GM's
   client, which applies them and broadcasts the result, so all screens stay
   in sync.
3. When the puzzle is solved, a chat message is posted, a hook fires and an
   optional macro runs — a tile can open the door behind it.

## Ten puzzles

| Puzzle | What the players do |
|---|---|
| **Combination Lock** | Turn dials of digits, runes, letters, star signs or your own symbols. Optional hint "how many dials are right", attempt limit shared or per player. |
| **Sequence** | Place pictures into the cells of a row, square or rectangle. Some are fixed as hints; the rest wait in the choice under the field, mixed with decoys. |
| **Mosaic** | A sliding puzzle cut from your own image, 2 × 2 to 5 × 5. Always solvable. |
| **Gates** | Doors with statements, some of them lies. Push exactly one. |
| **Constellation** | Draw lines between stars into the right figure. |
| **Map of Paths** | Worlds and portals, some one-way: pass through the required worlds and reach the goal. |
| **Hall of Mirrors** | Rotate mirrors to route a beam into the crystal. Difficulty is the number of turns to the solution — the hall is verified by search before it is laid out. |
| **Hall of Prisms** | The same with several coloured beams: red and green make yellow. |
| **Hall of Slabs** | One safe path crosses the hall; discovered traps stay marked, so the hall becomes the table's shared memory. |
| **Inscription** | A substitution cipher (a real cryptogram) or a shift wheel. |

<p align="center"><img src="docs/slabs.png" alt="Hall of slabs with the GM's view of the path" width="420"></p>

## Three devices

A puzzle is solved, a game is played, and at a device people **work together**:
one sees, the others act. The one who sees gets no hints — only what they
manage to put into words.

| Device | How it looks at the table |
|---|---|
| **Device and the Torn Manual** | One player works the levers, the others each hold a different scrap of the manual, sent privately — the order comes only from all of them together. |
| **Hall of Prisms (D)** | Only the navigator sees the beams, the mirrors and their numbers. Everyone else stands at a panel of labelled levers, and which lever turns which mirror is known to the navigator alone. Levers are split between panels, and a panel can belong to a named player. |
| **Combination Lock (D)** | The navigator sees the dials and presses "Check", while the others turn them. A lever moves a dial one step on; two levers per dial turn it both ways. |

All three can be put on **a clock**: minutes and seconds by the server time.
When it runs out the mechanism freezes, and "Reset" winds the clock again.

## Three tavern games

- **Dice** — six dice: score points and stop in time, or lose everything you
  gathered this turn.
- **Twenty-One** — dice from d4 to d20, each once per round; go over 21 and
  you lose.
- **Lucky Joe** — a thieves' game used to settle disputes.

Seat tavern **bot opponents** with a temper of their own (cautious innkeeper,
reckless sellsword, bookkeeper), take **stakes** straight from character
sheets, leave the table mid-game — or **cheat**: loaded dice up your sleeve,
a Sleight of Hand check against the onlookers' attention, the outcome whispered
to the GM alone.

## For the GM

- **Presets.** Build a puzzle before the session and lay it out with one click —
  openly or hidden, to reveal later. In the store they sit in folders — by scene
  or by place, nested — and are found by a search on the name. The store itself is
  a GM-only journal entry: it travels with the world.

<p align="center"><img src="docs/presets.png" alt="The preset store: folders, a trail and the presets of one folder" width="420"></p>
- **The answer never reaches players.** It is kept in the GM's client and is not
  written to the world, so it cannot be read through the browser console.
- **Levers.** Count it solved, reset, hide, take off the table, peek at the
  answer — all from the puzzle window.
- **Tiles and macros.** On success the hook `uo-igry.solved` fires with the
  table state; Monk's Active Tiles or your own macro can react to it.

```js
UOIgry.panel()                                        // GM panel
UOIgry.presets.put("plity", "Vault", { скрытно: true }) // lay out a preset hidden
UOIgry.tables                                         // what is on the table now
Hooks.on("uo-igry.solved", table => { /* open a door */ })
```

## Support

The module is free. News and write-ups on how the tools are made:
**[patreon.com/unshavedorange](https://www.patreon.com/unshavedorange)** · **[boosty.to/unshaved_orange](https://boosty.to/unshaved_orange)** (for Russia and the CIS).

Bugs and ideas — [Issues](https://github.com/Nikifour/uo-games-and-puzzles/issues).

<!-- поддержавшие -->

<!-- /поддержавшие -->

## License

Anyone may download and install the module and use it in their own games,
including paid games and streams. Redistributing the module, selling it or
bundling it into other packages is not allowed. All rights reserved by the
author. Full text: [LICENSE](LICENSE).
