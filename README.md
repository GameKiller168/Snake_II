# Snake_II
A simple remake of the popular Nokia 3310 game Snake II.

## Versions

| Version | What | Where |
| --- | --- | --- |
| **v1.0** (2021) | Java Swing, the original handwritten project | `Snake II/` and the PDF next to it - tag `v1.0`, never modified |
| **v2.0** | The same game in the browser, built on the v1.0 code | `web/` - branch `v2-browser` |

`git diff v1.0 -- "Snake II"` is empty: the 2021 sources are exactly as they were, and the history shows where everything came from.

## Play v2.0

No build step, no dependencies, no server code - plain HTML, CSS and JavaScript.

- Open `web/index.html` in a browser (double click works), or
- `cd web && python3 -m http.server 8080` and go to <http://localhost:8080> (`npm run serve` does the same).

To publish it, copy the `web/` folder to any static web host (`tests/` and `package.json` are not needed there).

### Controls

| | |
| --- | --- |
| Steer | arrow keys, WASD, numpad 8 / 4 / 6 / 2 - or swipe on the display / use the on-screen arrows |
| Start | Enter, Space, click or tap on the display |
| Level (title screen) | left / right or 1-9 |
| Pause | P, Space or Esc (the game also pauses when you leave the page) |
| Menu | Q from the pause or game over screen |
| Sound / look / language | M / C / L (or the buttons above the display) |

### Rules

The field wraps around: leave on one side, come back on the other. Hitting your own body ends the game. Nine speed levels; an apple is worth 4 points times the level. After every fifth apple a bonus bug shows up for a short time - the sooner you catch it, the more it is worth. The best score is kept per level in the browser (localStorage).

### URL options

`?corners=2021` draws the turns exactly like the 2021 version (see below), `?skin=neon` uses the pure green and black of the 2021 window instead of the LCD colours, `?seed=123` makes the apples reproducible.

## How v2.0 builds on the 2021 code

- The display is the original 84 x 48 LCD, every pixel a 10 x 12 rectangle with 1 pixel grid lines, the snake advances 4 LCD pixels per step, apples sit on the same lattice.
- The sprite tables (`BodyParts`, `Apple`, `Display`) and the paint logic of `Screen.paint` are ported pixel for pixel to `web/js/sprites.js` and `web/js/font.js`.
- That claim is tested: `web/tests/java-reference/GoldenDump.java` runs the **original** Java `Screen.paint` on 122 game states and stores the resulting LCD frames; the JavaScript port has to reproduce every one of them bit for bit (`cd web && npm test`).
- What the original did not have was added around it: wrap-around, collisions, levels, the bonus bug, a title screen, pause, game over, sound, best scores, touch controls.
- The 2021 engine has no corner pieces: at a turn the two straight stretches leave a gap and one of them pokes out of the bend. v2.0 closes the turns. The shape was derived from the photo of the real game on page 5 of the PDF and is switchable (`?corners=2021`), the straight parts, heads, apples and digits are never touched.

The goal of the next versions is a 1:1 recreation of the real Nokia 3310 game. Not everything in v2.0 is that yet: [`web/FIDELITY.md`](web/FIDELITY.md) lists every element with what it rests on (2021 code, a web claim, or my own estimate) and what would settle it. Mazes are not included.

## Tests

`cd web && node --test` (Node 20 or newer, nothing to install): golden frames, corner geometry, game rules (including invariants over random games), scenes, state machine, storage, layout.

## Magyarul

A `v1.0` a 2021-es Java-verzió (`Snake II/`, változatlanul). A `v2.0` ugyanez a játék böngészőben, a `web/` mappában: nyisd meg a `web/index.html`-t, vagy indíts egy statikus szervert (`cd web && python3 -m http.server 8080`). Nyilak / WASD / swipe az irányításhoz, Enter vagy Szóköz az indításhoz, P a szünethez. A kanyarok javítása kikapcsolható az `?corners=2021` paraméterrel. Hogy melyik elem mire épül (2021-es kód, webes állítás vagy becslés), azt a [`web/FIDELITY.md`](web/FIDELITY.md) tartalmazza.
