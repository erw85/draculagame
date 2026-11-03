# Dracula: The Castle (MVP Design)

A mobile-first gothic point-and-click puzzle game that follows Bram Stoker's
*Dracula* (1897, public domain). The MVP covers **Act 1, Chapters I–IV:
Jonathan Harker's Journal**: the journey to Castle Dracula, his imprisonment,
and his escape down the castle wall.

## Decisions so far

| Topic | Decision |
|---|---|
| Genre | Puzzle / point-and-click: tap hotspots, collect items, solve puzzles |
| Scope | Act 1 only (Chapters I–IV) |
| Protagonist | Follows the novel's narrators. Act 1 is all Jonathan's journal; Mina, Seward, Van Helsing and others come in later acts |
| Tech | HTML5 web game for phone browsers, portrait layout, no app store. Plain JavaScript modules, no build step |
| Art | Drawn in code (Canvas + SVG): silhouettes, moonlight, fog, animated bats and wolves |
| Story text | Short direct quotes from the novel, shown as journal pages |
| Danger | The player can fail in some scenes. Failing shows a "death card" and restarts at a checkpoint |
| Length | About 15–25 minutes, 7 chapters (the original scene 6 was split in two: chapel, then the precipice) |
| Extras | Generated sound and ambience (with mute); auto-save to the device |
| Out of scope | Collectible journal UI, offline install (PWA), later acts, other narrators |

## Core loop

1. **Journal page.** A short dated excerpt from Jonathan's journal opens each
   scene, e.g. *"3 May. Bistritz."*
2. **Explore.** A single-screen scene. Tap hotspots to look, take, or use.
   Hotspots shimmer faintly so they're findable on small screens.
3. **Puzzle.** Combine inventory items with hotspots to move forward.
4. **Danger moment.** Some scenes have a timed threat (wolves, the women, the
   Count). Failing leads to a death card, then a restart from the scene's
   start.
5. **Journal page.** A closing quote; the game auto-saves.

### Controls (one thumb)

- Tap a hotspot to examine it. The description is often a short novel quote.
- Tap an inventory item (bottom bar), then a hotspot, to use it there.
- Long-press a hotspot to get a hint (limited, so puzzles stay fair).
- The pause menu has mute, restart scene, and back to title.

## Scenes

Dates and quotes come from the novel's text. Puzzles are invented for the
game but stay close to events in the book.

### 1. The Golden Krone, Bistritz (tutorial). Chapter I, 3–4 May
- **Story:** Jonathan finds the Count's letter waiting at the inn. The
  landlady begs him not to go and hangs a crucifix around his neck.
- **Puzzle (teaches the controls):** find the Count's letter, pack the
  bag, accept the crucifix (it's needed later).
- **Danger:** none.

### 2. The Borgo Pass. Chapter I, 4–5 May
- **Story:** The calèche with a strange driver (the Count in disguise),
  blue flames in the dark, wolves circling under the moon.
- **Puzzle/action:** the driver stops at blue flames. Mark each flame's
  spot as it appears. Meanwhile wolves close in. Keep the carriage lamp
  bright by tapping it so they keep their distance, until the driver
  returns.
- **Danger:** if the lamp goes out, the wolves win (death card).
- **Quote:** *"Denn die Todten reiten schnell."* ("For the dead travel
  fast.")

### 3. Arrival & the Count's Hospitality. Chapter II, 5–7 May
- **Story:** *"Welcome to my house! Enter freely and of your own will!"*
  Supper, then the wolves howling: *"Listen to them—the children of the
  night. What music they make!"*
- **Puzzle:** explore Jonathan's room and the library. Find the Count's
  books and maps of England (the plot's hook).
- **Signature moment, the shaving mirror:** shaving at the window, the
  Count appears behind Jonathan with no reflection. Jonathan cuts himself.
  The Count lunges, and the player must **tap the crucifix in time**. The
  Count flings the mirror out of the window.
- **Danger:** miss the crucifix and it's a death card.

### 4. A Prisoner. Chapter II end – Chapter III, 8–15 May
- **Story:** *"doors, doors, doors everywhere, and all locked and bolted
  … The castle is a veritable prison, and I am a prisoner!"* Jonathan sees
  the Count crawl down the wall *"just as a lizard moves along a wall."*
- **Puzzle:** the Count makes Jonathan write letters dated in the future.
  Write a secret note to Mina in **shorthand** (a symbol-matching puzzle)
  so the Count can't read it. Also find a stiff door that leads to the
  forbidden wing.
- **Danger:** none. Paranoia builds instead (bats at the window, shadows
  moving).

### 5. The Three Women. Chapter III end, 16 May
- **Story:** Jonathan falls asleep in the forbidden wing and the three
  vampire women come for him. The Count drives them off: *"Back, I tell you
  all! This man belongs to me!"*
- **Action:** a stealth/resist sequence. Jonathan pretends to sleep. Hold
  a finger on the screen to keep his eyes shut and resist; release to look
  through the lashes (he has to look to know when to move). Get back to
  the safe room before the women reach him.
- **Danger:** a death card if they reach him.
- **Tone:** the novel's seduction scene is kept implied and PG-13: menace
  and atmosphere, nothing explicit.

### 6. The Chapel & Escape. Chapter IV, to 30 June
- **Story:** Jonathan climbs down the wall into the Count's room, goes
  down to the ruined chapel, and finds the Count in his box of earth,
  *"like a filthy leech."* The key isn't there. The Szgany arrive to nail
  down the boxes.
- **Puzzle:** the wall climb. Drag from handhold to handhold while bats
  dive and the wind gusts; time your moves. Then search the chapel and
  the boxes and take the gold. A shovel against the Count fails, as in
  the book.
- **Finale:** the doors are locked behind him, so the only way out is down
  the cliff. The last climb is a vertical escape with wolves howling
  below.
- **Ending:** the closing journal line, *"I shall not remain alone with
  them; I shall try to scale the castle wall farther than I have yet
  attempted."* Then a fade and a teaser card: *"Whitby. Mina Murray's
  Journal…"* (Act 2).

## Art & audio direction

- **Palette:** ink black, deep plum, moonlight silver-blue, blood red for
  accents only.
- **Style:** layered parallax silhouettes like a cut-paper shadow play,
  with drifting fog, flickering candles, and a moon in every exterior.
- **Creatures:** bats flutter across most scenes and scatter when tapped,
  just for fun. Wolves appear as silhouettes with glowing eyes; their
  howl is the game's main sound.
- **Typography:** a blackletter-style display font for titles (Google
  Fonts, e.g. *UnifrakturMaguntia* or *IM Fell*); a readable serif for
  journal text on aged paper.
- **Audio (Web Audio API, generated, no files):** wind, wolf howls, bat
  wings, creaking doors, a low drone, and a heartbeat in danger scenes.
  Starts muted until the first tap, as browsers require.

## Tech plan

- **Stack:** plain JavaScript ES modules with no build step (simpler to host
  than the TypeScript + Vite first planned). The game draws on a single
  `<canvas>` with a light HTML layer on top for text and the inventory.
- **Layout:** portrait, a 9:16 safe area that scales to fit; tap targets of
  at least 44px.
- **Content as data:** each scene is a data file listing hotspots,
  dialogue/quotes, items, puzzle rules, and checkpoint. New acts are mostly
  new data.
- **Save:** `localStorage` holds the current scene, inventory, flags, and
  settings. Wrapped in try/catch so a blocked storage doesn't break the
  game.
- **Hosting:** static files (GitHub Pages or similar).
- **Testing:** Playwright on a phone-sized viewport to play through each
  scene.

## Build order

1. Engine skeleton: scene loader, hotspots, inventory, journal pages,
   save/load, title screen.
2. Visual layer: night sky, moon, fog, bats, wolves.
3. Generated audio and the mute toggle.
4. Scenes 1–3 (tutorial, Borgo Pass, mirror) as the first playable slice.
5. Scenes 4–6, death cards and checkpoints, the ending teaser.
6. Polish: hints, timing tweaks, testing on real phones.

## Decided after review

- **Shorthand puzzle:** simplified, invented strokes. The key is only visible
  while you hold a button (the Count is watching), so you memorise it.
- **Hints:** limited to three per chapter.

## Open questions

- **Title:** working title *Dracula: The Castle*. Other ideas: *Jonathan
  Harker's Journal*, *Children of the Night*.
