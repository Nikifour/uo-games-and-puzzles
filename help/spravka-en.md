# UO · Games and Puzzles

## What this is

A table where the GM lays out a puzzle and the players solve it. The window opens at once for everyone in the world: one person turns the dials, the rest watch, and they see it the same instant.

Sixteen things sit on the table now, of three kinds. **Ten puzzles** to be solved: the combination lock, the mosaic, the inscription, the sequence of pictures, the hall of slabs, the hall of mirrors, the hall of prisms, the gates with inscriptions, the constellation, the map of paths. **Three devices** where people work together — one sees, the others act: the device with a torn manual, the hall of prisms (D), the combination lock (D). And **three games** to sit down at: Dice, Twenty-One, Lucky Joe. The machinery underneath is shared, and whatever comes next sits down at the same table.

## The combination lock

Several dials with symbols. Players turn them with the arrows and press "Check". If it matches what was set, the lock opens and a message goes to chat.

Symbols to choose from: digits, runes, letters, signs of the heavens — or your own, whatever you type in. The length of the code sets the number of dials: the code "4271" means four dials.

## Laying one out

The "Games and Puzzles" button in the notes panel on the left, the jigsaw-piece icon. The window shows what is already on the table at the top, then two sections — "Puzzles" and "Games" — and the presets below them.

Clicking a name does not open the settings at once: it unfolds a description — an example screenshot and a few lines on what the players will be doing. The "Set up and lay out" button inside the description opens the settings dialog. That way you can see what a puzzle asks of the table before building it.

The dialog asks for a name, an inscription on the lock (players see it), the symbols, the code, the look, the attempt limit and the hint.

**Who turns the dials.** By default everyone: the lock is shared and anyone can step up. The "only those ticked below" switch hands it to the people named; the rest stay spectators.

**Attempt limits come in two kinds.** The ordinary one is a shared pool for the whole party: five attempts, spent however they like. With "limit per player" ticked, each person gets that many — and nobody burns anyone else's. When yours are spent you can still turn the dials to prompt a neighbour, but "Check" will no longer press.

A solved lock leaves the table by itself when you lay out the next puzzle, and it will not surface underneath it the next time you enter the world.

## What a player sees

The window with the dials, the attempt counter and the log of what was dialled: who tried what. If the hint "how many dials stand right" is on, a number appears beside every failed attempt.

Someone who cannot turn still sees the window — just without the arrows and without "Check". That way the table has spectators, not people shut out of the game.

## The GM's levers

At the bottom of the window, for the GM only:

- **Show the code** — glance at what was set without leaving the game;
- **Count it solved** — open the lock by the GM's will, when the players got there by talking rather than by turning;
- **Reset** — clear the attempts and the log, including when the mechanism has jammed;
- **Take it off the table** — remove the puzzle entirely.

The window's close button works differently on purpose: for the GM it **hides the puzzle from everyone** (it stays on the table and can be shown again), for a player it closes the window for them alone, and it will not pop back up by itself.

The "Games and Puzzles" panel shows everything on the table at the top: what is open, what is hidden, what has jammed. From there you hide, show again and remove. If trial runs have left abandoned locks on the table, that is where they are cleared.

## Where the answer lives

The answer is kept in the browser of the GM who laid the lock out, and it goes nowhere from there: not into the world's database, not to the players. Otherwise the solution could be read through F12, and the puzzle would stop being a puzzle.

There is one price: if a different GM sits down, or you clear your browser data, the lock stays but the answer-checking does not. The window says so; the lock can be opened with "Count it solved" or laid out again.

## Presets

A preset is a puzzle assembled before the session: the settings lie ready, and one press puts it on the table.

**How to remember one.** Every puzzle dialog has a "Remember as a preset" field at the bottom. Type a name and the settings go into the store. The puzzle is laid out as usual; and if it was refused (an empty code, no picture chosen) the preset is still remembered — that is how one builds it piece by piece.

**Where to find them.** The "Open the store" button in the "Puzzle presets" section of the GM's panel. The same store also opens on its own: Settings → Configure Settings → "UO · Games and Puzzles" → Puzzle presets.

**Folders.** By the third evening there are more presets than one remembers, so the store has folders — by scene, by place, by whatever suits: "Manor", and "Cellar" inside it. The "New folder" button creates a shelf where you currently stand; a folder can be created empty and filled later. Clicking a folder opens it, the trail at the top ("Store / Manor / Cellar") takes you back, and the number on the spine says how many presets are inside, nested ones included.

A preset is moved by the folder button in its row: pick a shelf from the list — or type the name of a new one, and it is created with the preset already in it. A folder can be renamed and removed: on removal its presets and nested folders move up one level instead of disappearing.

**Search.** The field at the top searches by name when there is no time for folders: any part of it, case and "ё" aside. It searches folder names too — "catacombs" finds everything kept in them. Each hit shows its path, so it is clear where it came from. An empty field brings the folders back.

**What to do with them.**

- **Lay out** — onto the table, as usual.
- **Hidden** — onto the table, but the players cannot see it. This is how an evening is prepared: before the session lay out the lock, the hall of slabs and the mechanism hidden, then reveal each in its moment with "Show". That button sits in the "On the table now" list.
- **"Bring the window back"** — for when a player closed their window with the cross. The cross closes the window for that player alone, and the puzzle stays on the table; the button brings the window back for those who closed it and leaves alone those who still have it open.
- **Edit** — open the dialog filled with the preset's settings. Save under the same name and the preset is rewritten; under a new one and a second preset appears beside it.
- **Forget** — remove it from the store. Puzzles already laid out stay on the table.

**Where the store lives.** In a journal entry named "UO · Заготовки загадок" that nobody but the GM has any rights to. So the store travels with the world — in a backup, to a second GM, onto another machine — and the players do not see it even in the journal list. That matters: a preset holds the answer.

Lock presets left over from earlier versions move into the store by themselves when you first enter the world.

The table games — Dice, Lucky Joe, Twenty-One — have no presets: they are not prepared but started, and the people who sit down are the ones in play right now.

## From macros and tiles

Type a macro name into the "Macro on solving" field and it runs when the lock is opened.

For those writing their own macros:

```js
UOIgry.panel()                    // the GM's panel
UOIgry.lock.create()              // dialog for a new lock
UOIgry.tables                     // what is on the table now
UOIgry.clear()                    // clear everything

UOIgry.presets.window()                          // the preset store
UOIgry.presets.list("zamok")                     // preset names of one kind
UOIgry.presets.put("zamok", "Cellar")            // lay one on the table
UOIgry.presets.put("plity", "Hall", { скрытно: true })   // lay it out unseen
UOIgry.presets.forget("zamok", "Cellar")         // forget it
```

Kinds for `presets`: `zamok`, `mozaika`, `shifr`, `porjadok`, `ustrojstvo`, `plity`, `vrata`, `sozvezdie`, `puti`, `zerkala`, `prizmy`.

Laying out unseen from a macro is what makes a scene open itself: a Monk's Active Tiles tile puts the puzzle out in advance and shows it when the party reaches the door.

When a puzzle is solved, the `uo-igry.решено` event fires — a Monk's Active Tiles tile or your own handler can hook onto it:

```js
Hooks.on("uo-igry.решено", стол => console.log(`${стол.название} is open`));
```

## The mosaic

The sliding puzzle, only made from your picture: a fresco, a map or a portrait is cut into cells, one is taken out, the rest are shuffled. Players slide pieces into the gap and put the image back together.

"Games and Puzzles" → "Mosaic". The picture is chosen with the standard file picker, so there is no need to type a path. The grid runs from 2 × 2 to 5 × 5; the classic fifteen puzzle is 4 × 4, though 3 × 3 is often enough at the table.

**This puzzle has no secret.** The answer is the picture itself, and it has been on the table all along. So another GM picks the mosaic up just fine, and nothing is lost when the browser changes.

**It is shuffled by moves, not by rearranging.** Half of all random arrangements of the fifteen puzzle cannot be solved at all, and players would be beating their heads against the impossible. The module makes a hundred random moves from the assembled picture — what comes out is guaranteed to come apart again.

**Which piece is missing** is a setting too. By default a random one is taken out. The bottom right corner is the customary place for the hole, and the classic method rests on it (top row, left column, work the rest into the corner). A random piece takes that recipe away, and a hole in the middle of a fresco looks broken rather than neatly incomplete. You can also demand the middle, or the familiar corner.

The mosaic counts as solved when every piece is in its place and the gap is where the piece was taken from. So it is assembled not "into the corner" but into the hole.

Settings: move limit (0 — no limit), who moves the pieces, whether players see the original. The GM always sees the original; the players do if allowed — clear the box when they are not meant to know what is being assembled. The GM gets "Count it solved", "Shuffle" and "Take it off the table".

## The gates with inscriptions

A trial, not a mechanism. Several leaves with statements carved on them — some lie, and only the GM knows which. Players mark the inscriptions "true" and "false", argue out loud, and in the end push one leaf.

**The marks are shared.** Everyone sees them, they change nothing mechanically and are never checked: they are a board for the argument, so that the talk about the third inscription does not start over every five minutes. Clicking a mark cycles it: true → false → unmarked.

Leaves and inscriptions are written in the dialog, one per line. The right leaf is marked with a "+" at the start of the line, a truthful inscription with the same "+", a false one with "−". Players never see the sign.

A miss spends an attempt and calls the **macro on a mistake** — what happens to whoever pushed the wrong leaf is for the GM to decide.

## The constellation

Named stars stand in a circle and players draw lines between them: click one star, click a second — a line falls; click again and it is erased. The "Check against the sky" button tests the whole figure.

**The answer here is knowledge about the world.** Which lines are right is not stated in the rules but in a hint from the chronicle: "the Palm holds three beams, and none of them touches another." The GM writes the stars and the correct lines as text, and they lay themselves out across the sky.

The hint after a failure can count how many lines are right and how many are spare — that turns guesswork into gradual convergence.

## The map of paths

Nodes are worlds, edges are portals. Some portals are one-way: "World &gt; World" leads only there, and that is exactly what makes the Abyss different from a road. No world is entered twice.

You must pass through every marked world and come out at the goal. Reach the goal without collecting the marked ones, or run into a world with no exits, and it is a **dead end**: the party returns to the start, the attempt counts, and the dead-end macro is called.

**The map has no secret** — a map is a map precisely so that it can be seen. The game is not guesswork but planning, and the dead end is visible in advance to whoever looked ahead. There is a "step back" for when they change their minds before disaster.

## The hall of mirrors

A beam enters from the edge, travels straight and turns on the mirrors "╱" and "╲". Clicking a mirror flips it. Reach the crystal and the hall is open. The cells the beam passes glow, so you can see where it goes astray.

**The hall is built from a solution**, not invented at random: first a broken line is laid from the source to the crystal, mirrors are placed at its bends, then they are turned every which way and spare ones are scattered aside from the path. Even so, every hall is verified by brute force before it is laid out: the promise "this can be solved" is worth exactly as much as the check that backs it.

**Turns to the solution** is the main difficulty knob. The beam's path bends exactly as many times as ordered, with a mirror at every bend; the starting arrangement is taken no closer to the answer than that many clicks. This is not an estimate by eye: every arrangement of the mirrors is a binary cube (one bit per mirror, a click flips a bit), and a breadth-first search from all solving arrangements gives the exact distance to the nearest one. Four is solid; six to eight is a long evening, but needs a larger field.

Spare mirrors throw you off the scent: they stand aside from the true path, but a beam already astray runs into them and goes somewhere else entirely. Zero spares — an honest, simple hall; eight — a hard one.

The brute force also rejects degenerate halls where the crystal lights up whatever the mirrors do. Players would find such a hall already solved, and the very first turn would break it.

If you set a turn limit lower than the number of moves needed, you are told so when it is laid out: that hall cannot be opened within that limit.

## The hall of prisms

The same as the hall of mirrors, but there are several beams and they are coloured. The mixer "◉" swallows the beams that enter it and sends out one — the colour of their sum. The crystal "◈" needs its own colour: while the wrong light falls on it, the hall stays shut.

Light adds like light, not like paint:

| | + red | + green | + blue |
|---|---|---|---|
| **red** | red | yellow | magenta |
| **green** | yellow | green | cyan |
| **blue** | magenta | cyan | blue |

All three give white. This is worth saying out loud: half the table remembers mixing paint at school and will expect red and green to give brown — not because they failed to work it out, but because they worked out a different physics.

The hall is built and checked the same way as the mirror one: two sources lead into the mixer, from it a broken line runs to the crystal, mirrors go at the bends, and then every arrangement is enumerated — and the ordered **turns to the solution** are honoured just as exactly. One difference: there are three stretches of path here — two in and one out — and the ordered turns are split between them, so fewer than three never happens.

## The hall of slabs

A single safe path runs through the hall, and nobody knows it. Step right and the slab holds; step wrong and it goes out from under your foot.

They go bottom to top, one slab per step: only the neighbours by a side are reachable. The far bank is the top row.

**Traps once found stay marked**, so the second time through they go with more confidence: the hall is less a puzzle than the table's shared memory. If it is meant to be cruel — clear the box, and the traps are forgotten.

By default a mistake throws you back **to the threshold**, but a gentler one-step rollback can be chosen. The trap limit closes the hall for good.

**The module deals no damage.** It announces that the slab gave way and calls the **trap macro** if one is set — and what happened to whoever stumbled is for the GM to decide: a dart, a pit, a howl, an alarm. The price of a mistake is the table's business, not the program's. The `uo-igry.ловушка` event fires separately, and a tile can hook onto it.

For the GM: "Show the path", "Re-lay the path" (the same room, a different way), "Count it solved", "Reset".

## The device and the torn manual

The only puzzle that cannot be laid out on a real table: there all the slips of paper lie in front of everyone.

One player stands at the mechanism and pulls the levers. The others see the panel but cannot press — instead **each holds their own fragment of the manual**, and nobody else's is visible. The order follows only from all the fragments together, so the game is played by voice: "mine says the ring comes after the cracked one", "and mine says you never start with the blue".

**The fragment is delivered by the server, by name.** It is never sent to anyone else's client, so there is nothing to peek at through F12 — the same way the GM tells a cheat about loaded dice. If the page was reloaded and the fragment vanished, the window asks for it again by itself, and the GM can resend to everyone with a button.

**The device store** lives right in the placing window: the "New device" and "Edit selected" buttons (with "Forget device" inside), and if there are no devices yet, the new-device window opens by itself. A device has a name, the list of levers, the correct order (lever numbers separated by spaces) and the fragments of the manual. The main rule when writing one: the order must follow **from all the fragments together and from no single one alone** — that is the whole point.

The fragments go round in turn: if there are more of them than hands, somebody gets two; if fewer, somebody is left an adviser without a slip.

By default a mistake **resets the levers** — one click and it starts over. This can be switched off, and then the mechanism waits to the end of the sequence. A miss limit jams the mechanism; the GM gets "Count it solved", "Reset", "Send the fragments again" and a look at the whole thing at once.

## Split control: (D)

In the entries marked **(D)** one person sees the field and the others touch
it. This is not a puzzle setting but a kind of its own: the same hall of
prisms or the same lock, but dealt out to two people or more.

**The navigator** sees everything — the beams, the mirrors, the dials — and
can turn nothing. The others get **a panel of labelled levers**: a lever moves
one mirror or one dial, and which one is known to the navigator alone, with
the order of the levers shuffled. That is the whole game: the navigator
explains in words, the others press.

**Panels are shared out between players.** A panel can belong to a named
player or to anyone; the GM writes the lever labels themselves, however suits
them — "top left", "the squeaky one".

**The numbers on the field are placed by the GM.** The navigator sees a number
only on the mirrors the GM marked: mark them all and it is easy, mark three
out of twelve and there will be a lot of explaining. The navigator gets no
built-in hints at all.

**Time.** Set in minutes and seconds, kept by the server clock, so it is the
same for everyone. When it runs out the mechanism freezes; "Reset" winds the
clock again.

The GM gets a time row of their own: **"−30 s", "Pause" and "+30 s"**.
The pause stops the count for everyone at once and lives on the table rather
than in somebody's browser: close the window, leave the world and come back —
the clock still stands, and time never runs out while it does. "+30 s" and "−30 s"
add and take away half a minute; it cannot go below zero — if time is up, let the
GM say so rather than one stray click.

In the **Lock (D)** a lever moves a dial one step on. Give **two levers per
dial** and it can be turned both ways. The code is checked by the navigator —
the only one who can see what the dials show.

**Who is where.** Roles change as the evening goes: a player drops out,
two of them swap seats, someone steps away from the table. The **"Who is
where…"** button in the GM's device window changes the seating at the live
table — no need to replay the lay-out, and everything the table has already
turned stays where it is.

Pick someone who already sits somewhere and the two **swap places**, in any
direction: panel with panel, navigator with panel. When two people are at the
device, the same window has a **"Swap places"** button: at the table the
request sounds like that, not like "make the one at the panel the navigator". A panel can also be left
to "anyone". Someone has to see the field, so there is no navigator-less
device.

**Removing a panel** is in the same window: its levers go to the panel you
choose. Lever numbers run through and do not change: the navigator says "the
fifth", and the fifth stays the fifth — it is just in someone else's hands now.

## The sequence of pictures

Put pictures into the cells of a field the way the GM intended: six frescoes by event, coats of arms on a shield, steps of a rite. The field is not just a row: any grid up to 12 × 12.

**Preparation.** Panel → "Sequence" opens the preparation window. Set the field size, take a picture from the set on the right (or "Own file…") and click a cell — or drag it. This is how you lay out the solution. Every picture on the field has a lock:

- **closed** — the picture is fixed: it lies in place from the start and the players see it, as a hint;
- **open** — the picture goes to the choice under the field and can be put into any cell.

**Decoys** are extra pictures in the choice that have no place on the field: click the "Decoys" area with a picture in hand. The players do not know how much of the choice is extra.

Empty cells of the solution are **blocked** by default: nothing can be put there, which gives the field its shape. Untick "Empty cells are blocked" and an empty cell stays open — the right answer is to leave it empty.

"Whole set as a row" lays the set out in a single row, like the old sequence. A name in "Remember as a preset" puts the puzzle into the store; "Edit" in the store opens it in the same window.

**Picture sets** — "Settings → Module settings → UO · Games and Puzzles → Picture sets" (or the button in the preparation window). They are the palette the puzzle is built from; a picture's caption is visible to players. Sets live in the world, not in a browser.

**At the table** players take a picture from the choice and put it into a cell — by clicking (take, then a cell) or dragging. A picture in an occupied cell swaps places with the newcomer; right-click a picture on the field to put it back. The magnifier on a picture opens it large. **"Pull the lever"** checks the field: it fits when every open cell holds the right picture and no decoy is on the field. Identical pictures are interchangeable.

Settings: attempt limit, the hint "how many pictures are in their places" (out of how many), who moves them, the macro on solving. The GM has "Show the answer" as a small grid, "Count it solved" (lays it out correctly), "Shuffle" (everything back to the choice, attempts reset) and "Take it off the table".

**The answer does not lie on the table.** The pictures are stored as one shuffled list, and only the GM knows what goes where and what is a decoy.

Old sequence presets with a set open and lay out as a row where everything is a choice.

## The inscription: two ciphers

The GM types a phrase, the module enciphers it, the players work it out. There are two kinds, and the difference between them matters.

**Substitution** is a real puzzle. Every letter is replaced by its own, in no order; brute force is out, there are more variants than stars. It is played differently: you look at short words, at repeated letters, at endings — and substitute one at a time. At the bottom of the window are the cipher letters that occur in the inscription and the alphabet: click a cipher letter, click what it means. Solved letters glow in the inscription, unsolved ones stay dim. Clicking a taken letter again erases the guess.

**The wheel** is a couple of minutes of ritual, not a puzzle. The letters are shifted around the ring of the alphabet, there are only thirty-odd settings, and every one can be flipped through with the arrows. Take it when you want not a challenge but the moment where the inscription is read aloud.

**The player declares the answer, not the module.** The "Read it" button is a claim: "we think this is what it says." While the module decided, the wheel was spun blind, without reading: press the arrow until victory is announced. The attempt limit bounds the number of claims, not the number of turns.

The cipher does not touch spaces and punctuation: the word lengths make it plain at once that this is speech, not litter.

There are two alphabets — Russian with 32 letters (Ё folds into Е) and Latin.

For the GM: **"Reveal a letter"** (for the substitution, when the table has come to a dead stop), "Show the answer", "Count it solved", "Reset", "Take it off the table".

## Lucky Joe: the rules

A thieves' game for settling arguments. They take turns: roll 2d6, keep one die, pass it on, six times each. The kept dice lie down in a row in plain sight.

**Windows of three dice standing in a row are counted, and the windows overlap.** The row 1-2-3-4-5-6 counts four times: 1-2-3, 2-3-4, 3-4-5, 4-5-6.

| Combination | Points |
|---|---|
| A run up or down | 300 |
| Three of a kind | 300 |
| Odd 1-3-5 or 5-3-1 | 500 |
| Even 2-4-6 or 6-4-2 | 500 |
| **Joe** — six of a kind | an outright win |

Odd and even are dearer on purpose: they are dead ends, they cannot be continued by the next window, whereas runs and matches chain together.

**Rounds.** The argument goes to the round where somebody comes out ahead; level, and they play the next one, up to the agreed number. Points do **not** carry between rounds. Three rounds settle it in 98 cases out of a hundred.

**The decider.** The rounds ran out with no winner — everyone rolls 2d6 for the sum. Snake eyes beat everything, even double sixes. Level — they roll again.

## Lucky Joe: the bond

If two people throw Joe in the same round, the argument is **not settled at all**. By the thieves' belief they are bound by fate: custom calls for a handshake, a kiss and keeping to each other. The stakes come back, and the rest is the GM's business.

Joe cannot be forced. The arithmetic shows that deliberately hunting for six of a kind adds two hundredths of a per cent to the odds: skilful play already leans on repeats, because three of a kind score. Joe happens, it is not earned — which is why thieves hold it to be the hand of fate.

## Dice: the rules

Six dice, two problems — score points and stop in time. The game is folk; in other houses the same rules go by "zonk", Farkle or Zilch, and in Kingdom Come by the tavern dice.

You roll, set aside what scores, and decide: roll the rest or bank what you have. Nothing worth setting aside — **bust**: everything banked this turn burns and the turn passes on. Set aside all six and you roll six again and carry on.

The count goes like this: a one is 100, a five is 50; three ones are 1000, other triples are their face value in hundreds (three sixes are 600); every die beyond the triple doubles it; a straight 1–6 is 1500, 1–5 is 500, 2–6 is 750. Three pairs do not count in the tavern version, but they can be switched on when sitting down.

Setting dice aside "for company" is not allowed: **every** die must count in the pick. If the pick is no good, the buttons will not press, and the window says what the selection is worth.

## Dice: sitting down at the table

"Games and Puzzles" → "Dice". In the dialog you tick who is sitting down and set the target for the game — what score you play to. There can be any number of players: the turn goes round in the order they were ticked. The same dialog holds the opening threshold (how much must be banked in a turn to open the account) and the price of three pairs, if you play with them.

Foundry rolls the dice, so everyone sees them and Dice So Nice rolls them across the screen. Click a die to set it aside, click again to take it back. Then two buttons: "Set aside and roll" or "Set aside and bank".

The **"Rules"** button beside the score opens a reminder: how the turns go and what scores what — with the very numbers this table plays by. If three pairs are on, their price is there; if an opening threshold is set, so is that. Someone who is merely watching sees it too.

The GM can play for anyone and pass the turn with "Pass the turn" — if a player has left or the game has stuck.

## Dice: rolls and chat

Dozens of rolls pile up over a game, and the shared chat is buried under them. So by default the dice **roll but are not written**: Dice So Nice shows the roll to everyone on screen, and the numbers are visible in the game window and the game log anyway.

This changes in "Settings → Module settings → UO · Games and Puzzles", the "Dice rolls in chat" setting: quiet, a whisper to the GM, or a message to all.

The quiet mode leans on Dice So Nice. Without it the dice simply appear in the window — there is nothing to show the roll with.

## Dice: bot opponents

Up to four bots can sit down — one human against three, or a table of nothing but machines. They never sit down by themselves, only when called.

**What sits at the table is a person, not a temper.** The pool of opponents lives in "Settings → Module settings → UO · Games and Puzzles → Opponents at the table → Edit the pool": a name and a temper, as many lines as you like. It is there rather than in the panel because the list is edited rarely and a game is started often. Players see the names, so write them the way this person is called in your world — Ambrose the Leech, headman Tobias, Halvar the smith. The pool is kept in the world: every world has its own set of faces, and the second GM of that world gets them along with it.

In the seating dialog the pool comes as a list with checkboxes. Below it is "More nameless": if you need a quick opponent with no name, they take one to match their temper. Several nameless ones are given tempers in turn — four identical innkeepers at one table look like a fault, not a game. Namesakes are told apart by a number.

## Dice: stakes

When sitting down you set the stake from each and the coin — gold, silver, copper, electrum or platinum. The pot is counted by the number of seats and is shown in the window beside the score. Zero — playing for the fun of it, and purses are not touched at all.

**It is taken from a sheet where there is something to take.** The "Take it from the sheets" box is ticked by default: where a sheet is found and there are coins enough, the stake goes at once. A bot has no sheet, a player may have no character, someone may be short — then the stake is on the GM, and chat says so by name. The module does not undertake to refuse anybody a game over an empty purse: that is a conversation at the table, not a matter for the program.

**The winner takes the whole pot** — onto their sheet, if there is one.

**Game abandoned halfway?** When a table with stakes is removed, the GM is asked whether to give the coins back to those they were taken from.

## Dice: who got up from the table

**A player can leave on their own.** The "Get up from the table" button in the game window, and not necessarily on their turn — nobody is held at the table. It asks for confirmation and reminds them that the stake stays in the pot.

**The GM can remove anyone** with "Remove from the table": out of coin, fell out with the innkeeper, the player went to bed. The reason is yours, the module's business is to clear the seat. The "Return their stake" box is for an honest exit: then the coins go back to the sheet and the pot shrinks.

**One left — the game is over**, and they take everything on the table.

The turn order and everything remembered by seat number — stakes, loaded dice — is recounted by itself: remove a seat in the middle and the neighbours shift up, and the marked dice stay with whoever was given them.

## Dice: loaded dice

Cheating. With the "Loaded dice" button in the game window the GM slips marked dice up the sleeve of anyone at the table — a player or a bot.

**A player** gets a "Swap the dice" button and decides for themselves when to use it: before the roll, not after. Loaded dice fall more often on ones and fives — that is, on what scores.

**A bot** with marked dice cheats on every roll: an innkeeper whose luck never turns is a ready-made scene.

**How they are caught.** Every swapped roll is met by a Sleight of Hand check against the passive attention of the onlookers: anyone whose passive Perception is not below the roll noticed. Passive on purpose: otherwise every roll would mean sending the whole table for a check, and the game would grind to a halt. The more often you cheat, the more surely you are caught.

**Only the GM knows the outcome.** A whisper goes to them: what the cheat threw and who noticed. The table is told nothing — this is the GM's scene, not a line in chat. The cheat does not know either whether they were caught.

The swap cannot be spied out in the console: it is not kept in the table's state but lives with the GM, and whoever has the dice up their sleeve learns of it by a private letter — the Foundry server delivers such a thing only to the addressee.

## Dice: the bot's temper

The bot has two independent knobs. **Greed** — when it stops: a cautious innkeeper banks early, a reckless sellsword pushes to the last die. **Skill** — how often it plays correctly at all; a flawless bot beats living people reliably, and that is dull, so it knows how to err.

There are four ready tempers: cautious innkeeper, reckless sellsword, bookkeeper, villager.

It is switched off in "Settings → Module settings → UO · Games and Puzzles": clearing the "Bot opponent allowed" box removes it from the seating dialog, and the code for its turn never runs. The pause between its rolls is set there too — an instant bot smears the game.

## Twenty-One: the rules

Six dice — d4, d6, d8, d10, d12 and d20 — and each is taken **once per round**. Roll it, add it to your total; go past 21 and the round is lost, with the total not counted at all. You may stop whenever you like: say "Stand" and the hand closes on what you have.

The round goes to whoever has more than the others without passing the limit. Equal totals tie, and the win goes to no one. If everyone busts, the round goes to no one.

The whole game is in the order of the dice. From zero a d20 can never bust and decides almost nothing; at fifteen the same die kills you in fourteen cases out of twenty. Small dice are worth saving: a four can top you up when a twenty no longer can.

## Twenty-One: how to sit down

The "Games and Puzzles" button → "Twenty-One". In the dialog you tick who sits down and set two things: the limit past which it is a bust (21 by default) and how many wins take the game (three by default).

Turns run as in blackjack: a player finishes their whole hand — taking dice one after another and saying "Stand" — and only then does the turn move on. Acting last is an advantage, since the other totals are visible, so **the right to act first moves to the next seat every round**.

The window shows each player's total, the dice they rolled with a mark of which die each was, and rounds taken as circles. A rolled die is not removed from the table but dimmed: you can see what has been spent.

The GM can act for anyone and pass the turn with the "Pass the turn" button — if a player has left or the game is stuck.

## Twenty-One: opponents and stakes

The opponents are the same as in Dice, and the pool is shared: the innkeeper at both tables is one and the same person. Temper works the same way — the cautious one stands early, the reckless one pushes to the last die — but it is computed for this game: the bot looks at the share of killing faces on every die, at the best open total among the others, and at whether the rest have finished. The one who trails has nothing to lose and will take what only desperation would take.

Stake, coin and pot work as in Dice: the pot is counted by the number of seats and goes to whoever takes the game as a whole, not a single round.

## Language

Russian in the source, English through the `lang/en.json` dictionary. Which one is used is decided by the **"Module language"** setting — each participant has their own: **"Same as Foundry"** (the default: Russian if Foundry is in Russian, English for any other language), **"Русский"** or **"English"**. So Foundry can run in English while the module speaks Russian, and the other way round. Changing it reloads the world.
