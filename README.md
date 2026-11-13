# Snake_II
A simple remake of the popular Nokia 3310 game Snake II.

## Versions

| Version | What | Where |
| --- | --- | --- |
| **v1.0** (2021) | Java Swing, the original handwritten project | `Snake II/` and the PDF next to it - tag `v1.0`, never modified |
| **v2.0** | The game of the real Nokia 3310 in the browser: its start-up animation, menus, nine levels, the six mazes and the rules of the phone | `web/` - branch `v2-browser` |

`git diff v1.0 -- "Snake II"` is empty: the 2021 sources are exactly as they were, and the history shows where everything came from.

## Play v2.0

No build step, no dependencies, no server code - plain HTML, CSS and JavaScript.

- Open `web/index.html` in a browser (double click works), or
- `cd web && python3 -m http.server 8080` and go to <http://localhost:8080> (`npm run serve` does the same).

To publish it, copy the `web/` folder to any static web host (`tests/` and `package.json` are not needed there).

### Keys

The page is a phone: the display, the four function keys and the keypad. On a touch screen use the keys on the page.

| | Keyboard | Phone key |
| --- | --- | --- |
| Steer the snake | arrow keys or W A S D | 2, 4, 6, 8 (1, 3, 7, 9 turn the snake by 90 degrees towards that corner) |
| Scroll a menu | up / down arrows or W / S | the two scroll keys |
| Select | Enter or Space | the middle key |
| Back, pause | Backspace, Escape or C | the C key (in the game it pauses: the menu then starts with "Continue") |

Menu: New game, Level, Mazes, Top score, Instructions. The lists are circular. Choose a level (1 to 9) and a maze ("No maze" or Maze 1 to 5) before you start; a maze chosen while a game is paused throws that game away, as on the phone.

### The game

The field wraps around: leave on one side, come back on the other (unless a maze wall is in the way). Hitting a wall or your own body ends the game - but the first time you get 0.1 s to turn away. An apple is worth the level number in points. After every fifth apple a bonus creature appears for 20 steps; the sooner you catch it, the more it is worth. Level, maze and top score are kept in the browser (`localStorage`). There is no sound.

## How v2.0 is built

v2.0 replaces the first browser version, which was a port of the 2021 code with a design of its own. The goal is a 1:1 recreation of the real game, so everything here is taken from the real thing:

- `web/js/engine.js`, `rng.js`, `config.js`: the game logic, written by hand from the rules of the program of the phone and tested against it. `tests/oracle.test.js` replays 84 recorded conversations with the real program (26 846 messages, all levels and all mazes) and requires the same return codes, timings, scores and the same 84 x 48 picture after every single message.
- `web/js/tiles.js`, `scene.js`, `font.js`: the pictures of the game (snake, apple, bonus creatures, score), read from filmed frames of real phones and checked against 183 measured frames and against the program's pictures.
- `web/js/phone.js`, `screens.js`, `text.js`, `pictures.js`, `texts.js`: the phone around the game - start-up animation, circular menus, level screen, maze list, notes, pause, fireworks for a new top score - on a virtual clock, with the times and positions measured in footage.
- `web/js/lcd.js`, `input.js`, `main.js`, `index.html`, `css/`: the page: the LCD painter (pixels 10 : 12 like the real display), keys, layout.

Not everything is known yet. [`web/FIDELITY.md`](web/FIDELITY.md) lists every element with what it rests on (the program of the phone, footage, or an estimate) and what footage would settle the estimates. The footage and the firmware that were used for the analysis are not part of this repository.

Snake II and the Nokia 3310 belong to their rights holders. This is an unofficial fan recreation, made to preserve how the game looked and behaved; it is not affiliated with or endorsed by them.

## Tests

`cd web && node --test` (developed with Node 22, nothing to install): 358 tests - the engine against the recorded program, the picture library against measured frames, the phone on its virtual clock (start-up, menus, mazes, pause, crash, game over, fireworks), the pictures, keys and storage.

## Magyarul

A `v1.0` a 2021-es Java-verzió (`Snake II/`, változatlanul). A `v2.0` a valódi Nokia 3310 Snake II-je böngészőben, a `web/` mappában: indítási animáció, körkörös menük, 9 szint, 6 pálya (labirintus), a telefon szabályai. Megnyitás: `web/index.html`, vagy statikus szerver (`cd web && python3 -m http.server 8080`). Nyilak / WASD a kígyóhoz, Enter vagy Szóköz a középső gomb, Backspace / Esc / C a C gomb (játék közben szünet). Hang egyelőre nincs. Hogy melyik elem mire épül (a telefon programja, videó vagy becslés), azt a [`web/FIDELITY.md`](web/FIDELITY.md) tartalmazza.
