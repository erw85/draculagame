# Dracula: The Castle

A gothic point-and-click puzzle game for phones, following Jonathan Harker's
journal from Bram Stoker's *Dracula* (1897). Act I covers Chapters I–IV: the
journey to Castle Dracula, imprisonment, and escape down the castle wall.

## Play it locally

The game is plain HTML, CSS and JavaScript modules, with no build step. Because
it uses ES modules, it must be served over HTTP rather than opened as a file:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> (or `http://<your-computer's-ip>:8000` on a
phone on the same Wi-Fi).

Any static host works for publishing, e.g. GitHub Pages (Settings → Pages →
deploy from branch, root folder).

## Chapters

| # | Chapter | Gameplay |
|---|---|---|
| I | Bistritz | Tutorial: get the Count's letter and the landlady's crucifix |
| II | The Borgo Pass | Keep the carriage lamp lit against the wolves; tap blue flames |
| III | The Count's House | Explore room and library; the shaving mirror (crucifix reflex test) |
| IV | A Prisoner | Shorthand letter puzzle; the Count crawls down the wall; dark corridor |
| V | The Three Women | Hold to creep, release to lie still while they watch |
| VI | The Chapel | Climb to the Count's room; find him in his box of earth |
| VII | The Precipice | The final climb down the cliff |

Failing a danger moment shows a death card; "Rise Again" restarts that chapter.
Progress saves automatically at the start of each chapter. Each chapter has
three hints.

## Code layout

```
index.html, css/style.css   page shell and UI styling
js/main.js                  boot + title-screen art
js/engine/game.js           loop, input, text boxes, inventory, journal pages, death/menu, saving
js/engine/sound.js          all audio, synthesised with the Web Audio API (no audio files)
js/engine/save.js           localStorage save (fails safely if storage is blocked)
js/art/draw.js              code-drawn art: sky, castle, wolves, bats, characters, rooms
js/art/bats.js              ambient bat flock (tap to scatter)
js/items.js                 inventory items and icons
js/scenes/*.js              one file per chapter; climb.js is the shared climbing minigame
docs/MVP_DESIGN.md          design document
```

Each scene file is mostly data: journal intro and outro, rooms with a `draw`
function and a list of tappable `hotspots`, plus hints. Challenges (minigames)
are small objects with `update`, `draw` and input handlers.

All novel quotations are from the Project Gutenberg edition of *Dracula*,
which is in the public domain.
