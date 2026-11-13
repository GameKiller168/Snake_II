# v2.1.2 fidelity ledger

Goal: the browser edition recreates Snake II as it runs on a real Nokia 3310 (firmware v6.39). This file says, element by element, what each part rests on. Whatever is an estimate is marked as one, here and in the code (`[EST]`), and is replaced as soon as better evidence exists. The v2.1 browser-only features are not part of the original phone; their approximations are identified below.

## Evidence tags

| Tag | Meaning |
| --- | --- |
| FW | read from the program of a real 3310 (firmware v6.39, English). The game logic is in addition checked against the running program, message by message (see "Tests") |
| PHONE | a time, a count or a behaviour observed on a real phone in footage |
| VIDEO | a picture or a position read from filmed frames of real phones, with the error given where it is not exact |
| EST | an estimate: nothing measured, nothing read |

Where footage and program could be compared (step time of level 1, bonus counter and value, crash timing, the pictures of the snake) they agree.

## Where the facts come from

Four recordings of real phones, shared by Hunor, and the firmware of the 3310. The recordings and full firmware images stay out of the repository (`reference/` is git-ignored); the browser includes extracted bitmap glyphs from PPM packs A, B, C, D, E, I, J and O in `js/fontpacks.js`. What was read from the recordings is also stored as numbers, for example the 183 LCD states of `tests/fixtures/phone-states.json`.

| Clip | What it is | Used for |
| --- | --- | --- |
| A | "Playing Snake 2 At Full Speed" (91 Pixels), 1080 x 1920, 30 fps, 56 s, English, green LCD | game over and top score notes, the fireworks |
| B | "Snake II on Nokia 3310 - varjoisa", 1920 x 1080, 30 fps, 481 s, English, blue backlight, one long game at the default level | pictures of snake, apple and bonus creatures, header, menus, notes, timings |
| C | "Snake 2 Original ... ASMR - Handheld Gameplayer", real sound | sound context; v2.1 tones are decoded from firmware, and the LCD is too small to read pixels |
| D | "Snake II on Nokia 3310 (4K) - JAVA Mobile Games", Russian UI, close-up, 1920 x 1080, 308 s | menus, level screen, maze list, "maze selected" note; only what does not depend on the language |

Firmware: the English v6.39 flash dump and the v6.39 PPM language packs of the 3310 (MCU and PPM). No full firmware image or program code is in the repository. What it contributed is of four kinds: numbers and rules that were written down by hand and re-implemented (`config.js`, `engine.js`, `rng.js`), the English texts (`texts.js`), bitmap fonts from PPM A/B/C/D/E/I/J/O (`fontpacks.js`), and small pixel pictures (start-up animation, fireworks, bonus creatures). **The pixel pictures are copies of Nokia's artwork at 84 x 48 resolution**; wherever footage exists they were compared with it, and the pictures of the game itself are in addition checked against the program's own picture (see "Tests"); what neither covers is marked "FW only" in the tables.

## Game logic

`engine.js` is written by hand from the rules of the program, in the shape of the program's own message interface (`start`, step, timer, keys), so that it can be tested against it.

| Element | v2 | Tag | Note |
| --- | --- | --- | --- |
| Step time per level 1..9 | 660, 480, 380, 300, 230, 180, 140, 110, 90 ms | FW, PHONE | level 1 measured in B: 0.657 .. 0.662 s |
| Default level | 1 | PHONE | B is a game at the default level and runs at the level 1 step time |
| Field | 20 x 9 cells of 4 x 4 pixels, the snake wraps around all four edges | FW, VIDEO | |
| Snake at the start | 7 cells, heading right, start cell depends on the maze | FW, VIDEO | |
| Apple | one at a time, worth `level` points | FW, VIDEO | B: 1 point at level 1 |
| Bonus creature | after every 5th apple, stays 20 steps (counter 20 .. 0, one per step), value `5 x level + 2 x counter + 5` | FW, VIDEO | B (level 1): 2 x counter + 10 in all seven captures |
| Creature pictures | six, one picked at random for each creature, the same picture in the header | FW | see "Pictures" for which were seen in footage |
| Special bonus item | not in v2. The program rolls a 1-in-50 die for a special item first and has a picture for it; it is switched off by a flag of the operating system and never appeared in any footage. The roll still uses up a random number, as in the program | FW | to be asked about, see "Open" |
| Crash | first blocked step: 100 ms in which a turn saves the snake; second blocked step: the snake blinks 8 times, 250 ms apart; game over 2100 ms after the crash | FW, PHONE | |
| Full field | the last apple gives the level points plus 100; event code `0x22` ends the game with "YOU WON!" | FW | the page plays the firmware's win sequence |
| Steering | 2, 4, 6, 8 set a direction (never straight back); 1, 3, 7, 9 turn by 90 degrees towards that corner; 5 does nothing; all look at the direction of the step being made | FW | the program also knows "turn clockwise / counter-clockwise" messages; which physical key sends them is not known, v2 has no key for them |
| Mazes | six start layouts: "No maze" and "Maze 1" .. "Maze 5"; walls block, open edges wrap | FW | every maze occurs in at least 11 of the oracle conversations, and the picture with its walls is checked against the program's after every message; **not compared with footage yet** |
| Random numbers | `seed = (seed x 0x625F + 0x3623) mod 0xFFF1`, the program's own generator | FW | the phone seeds it from its clock, v2 from the browser's entropy: any seed is as original as another |
| Vibration | 494 ms on eating, the crash and game over; the browser calls `navigator.vibrate(494)` when supported | FW | the firmware motor is modelled as one vibration; browser support is device-dependent |

## Sound

The game's sound scripts and the DTMF table were decoded from the English v6.39 firmware and are listed in `js/tones.js`. The Web Audio implementation schedules the decoded frequencies and durations without audio files. The firmware's buzzer waveform and loudness are not represented by Web Audio precisely; oscillator shape, gain, short attack/release envelope and key-to-DTMF mappings for non-numeric phone controls are **EST**.

| Event | Firmware sequence | Browser event | Evidence |
| --- | --- | --- | --- |
| Eat apple or bonus creature | 2637 Hz for 1 timer tick (7.96875 ms) | `eat` | FW |
| Crash | 440 Hz, 2 ticks; 2 ticks silent; repeat three times | `crash` | FW |
| Full field | 523 Hz for 15 ticks; 3 silent ticks; 784 Hz for 56 ticks | `won` | FW |
| Key held | standard two-frequency DTMF while down, stops on release | `keyDown` / `keyUp` | FW for the keypad frequencies; mapping of menu controls is EST |
| Menu, bonus appearance/expiry, game over note | no Snake II tone script | silent | FW |

## Pictures

| Element | v2 | Tag | Note |
| --- | --- | --- | --- |
| LCD | 84 x 48, pixels 10 : 12 | VIDEO | measured 10.008 x 11.967 |
| LCD look | one grey-green, a thin lighter line between rows of dark pixels (about 40 % as bright as the background), hardly any gap between columns | VIDEO, EST | gap strength measured; **colours are EST** (they depend on camera and light: teal-green in one clip, khaki in another) |
| Frame of the game | lines on rows 6 and 8, columns 0 and 83, row 47; layers in the order of the program | FW, VIDEO | checked against the program's picture in the oracle traces; row 47 is completed to a full line in the stored frames of `phone-states.json` (it was not read reliably), the footage test compares the field only |
| Snake pieces | straight x 4 directions, corners x 4, heads x 4 (+ open mouth when food is in the next cell), tails x 4, bulge of a cell that swallowed food | VIDEO, FW | read from 482 tracked frames of B; the model reproduces 470 of them pixel for pixel, the other 12 differ in one marginal LCD pixel; the oracle traces check them against the program's picture |
| Apple | 3 x 3 ring in the upper left of its 4 x 4 cell | VIDEO | measured over 51 apples |
| Bonus creatures | 8 x 4 pixels, six pictures | VIDEO and FW for 1, 2, 4, 5; **FW, no footage for 0 and 3** | B shows creatures 1, 4, 2, 5, 4, 5, 1, 5; 0 and 3 did not appear in any footage. All six occur in the oracle traces (field and header icon) and match the program's picture there, so 0 and 3 are checked against the program, only never seen on a real phone |
| Score and counter digits | 3 x 5 in boxes 4 wide, score at columns 0..15, counter at 75..82, creature icon at columns 66..73 | VIDEO | the "1" is 2 pixels wide |
| Start-up animation | 2700 ms: base picture, four rectangles in turn at 250 ms steps, then the base picture again | FW, VIDEO, PHONE | compared with footage frame by frame |
| Fireworks | six pictures, 230 ms each, shown twice (2760 ms), after a game with a new top score | FW, PHONE | pictures identified in A by correlation; step time measured there |
| Small fonts | menu items, soft keys, labels and instruction pages | FW, VIDEO | complete small-bold and small-plain tables from PPM A, B, C, D, E, I, J and O; shared basic Latin uses B, while supported locale packs supply their glyphs |
| Localized small-font glyphs | full characters from the selected PPM language pack | FW | supported European scripts use recovered PPM bitmaps; Arabic, Hebrew, Chinese, Thai, Hindi and missing Vietnamese glyphs use browser text shaping at the 84 x 48 display size because the supplied special-layout PPM tables do not map reliably to Unicode |
| Menu numbers in the header | digits and their spacing | FW, VIDEO | digits come from PPM B's `tinyplain` font; the hyphen remains a two-pixel line |
| Large font of the notes | glyphs and advances from the PPM `largebold` fonts | FW, VIDEO | basic Latin comes from PPM B and localized glyphs from the active decoded locale pack; a line uses small bold only when its large glyph is absent |
| "Maze n selected" icon | dotted box in the upper right corner, curved tick drawn into it | box, place and timing VIDEO (D, +- 2 pixels); tick silhouette traced from a soft screenshot and still **EST** | box appears with the note, the tick starts after 700 ms and takes 5 steps of 65 ms |
| Top score note icon | **not reproduced**: the footage shows an animated dotted picture in the upper right corner of this note (B), v2 shows none | - | |

## The phone around the game

Measured in footage unless it says otherwise.

| Element | v2 | Tag | Note |
| --- | --- | --- | --- |
| Main menu | New game, Level, Mazes, Top score, Instructions, Options; "Continue" in front while a game is paused | VIDEO, FW for original items; **EST** for Options | Options was not found in the original Snake II menu |
| Options | Game sound, Key tone, Vibration and Language; each setting can be changed and is stored | EST | browser-only submenu |
| Languages | All 36 unique languages listed for PPM A-J and O in the supplied v6.39 chart; default follows browser language | EST | menu translations are app text; locale selection chooses the matching recovered PPM where available, and browser shaping covers special scripts that the PPM decoder cannot reliably map |
| Lists | circular; a window of three lines; the state is two numbers, the item on the top line and the item with the cursor. Down: the cursor moves on, and when it would leave the window the window follows so that the cursor is on the bottom line; up: the window follows so that the cursor is on the top line; lists of up to three items do not scroll | VIDEO (B, D) | the model reproduces every move seen in B and D |
| The two numbers of the main menu | live on through the level screen, the instructions, the maze list and a pause | VIDEO (B, D) | |
| After a game over and after the top score note | the cursor is on the first item, the top line stays as it was | VIDEO (B, D) | based on few events |
| Header numbers | `8-1-n` for item n; the maze list `8-1-3-n`, `8-1-4-n` while a game is paused | VIDEO | |
| Menu layout | list rows 7..36, three lines of 10 rows, cursor bar columns 0..78 with the text cleared out of it, text 2 columns in, soft key centred on row 40, scroll bar on columns 81..83 | VIDEO | scrollbar thumb height scales with the visible window and tracks the window's top line; reconstructed from screenshot crops, about +- 1 pixel |
| Soft keys | "Select" in the menu, "OK" in the maze list and on the level screen, "Next" in the instructions | VIDEO, FW | |
| Maze list | opens with the maze in use on the top line and under the cursor; Select stores it and shows "Maze n selected" for 1500 ms; the main menu then comes back on "Mazes" | VIDEO (D), PHONE | |
| Choosing a maze while a game is paused | throws the paused game away ("Continue" disappears, the cursor index stays) | VIDEO (D) | |
| Game over note | "Game over!" "Your score:" n, or "Game over!" "TOP SCORE:" n after the fireworks; 3070 ms | VIDEO, PHONE (+- 50 ms) | the rule "new top score = strictly more than the stored one" is **EST** |
| Top score note | "Top score:" n; 3070 ms | VIDEO, PHONE | |
| Level screen | "Level:" and nine bars, the chosen level and all below it filled | VIDEO (B, D) | the keys on it (up = higher, limits 1 and 9, C and Select) are **EST** |
| Keys while something is shown | ignored during the start-up animation and the fireworks, a key ends a note, C goes back from the maze list, level screen and instructions | EST | a note after the fireworks in A was gone 0.6 s early, which may have been a key |
| Pause | C in the game pauses (the menu with "Continue"); manual Continue starts a fresh step; an autosaved running game restores its remaining tick/blink delays | EST | no phone footage settles the pause timing; a pause during the dying phase is ignored |
| Instruction pages | text from the program, 3 lines per page in the thin font, "Next" turns the page, after the last page it starts again | text FW, rest **EST** | layout (rows 7, 16, 25, column 1, width 82) and what happens at the end were not seen |
| Does a level change throw a paused game away? | no | **EST** | a maze change does (D), a level change was not filmed |

## Only in the browser edition

| Element | Note |
| --- | --- |
| Keyboard | arrow keys and W A S D steer; physical numpad positions map 8 up, 2 down, 4 left, 6 right, 5 select; digit row keeps phone digits. A choice of this page, not of the phone |
| On-screen keys | the keypad and the four function keys below the display, for touch screens |
| Physical key appearance | recessed deck, raised keys and a depressed state while held | CSS presentation, browser-only |
| Page and display size | dark page, the display scales with the window |
| Memory of the phone | settings, high score and a JSON-safe game snapshot are kept in `localStorage`; a running game restores with Continue selected and the saved tick deadlines | browser-only | writes after each key press and timed game event; blocked/full storage falls back to the current session |
| Storage notice | an in-flow English notice explains that local storage keeps the game and top score on this device | browser-only | it can be dismissed and remembers the acknowledgement if storage works |
| Hidden tab | the game clock stops while the page is hidden and one frame never advances it by more than 250 ms |

## Not in v2.1.2

- The special bonus item (see "Game logic").
- The icon of the top score note.
- Anything of the other games of the phone, the clock, the menus outside Snake II.

## Tests

`cd web && npm test` runs the existing test suite, nothing to install. There is no build step: GitHub Pages copies the static `web/` files.

- `tests/oracle.test.js`: 84 conversations with the real program (26 846 messages over all nine levels and all six mazes, with deliberate crashes, turns in the grace time, bonus creatures of all six kinds eaten and expired, snakes that wrap around the end of the program's ring buffer) and 440 placement cases for the two random placement routines. After every message the engine must give the same return code, delays, event code and score, and the CRC-32 of the complete 84 x 48 picture of the game as `scene.js` draws it (frame, walls, snake, apple, creature, score, counter). The fixtures hold numbers only (`traces.json`, `placement.json`); they were recorded by running the program in an emulator with a bot playing. Nothing of the program is in them.
- `tests/tiles.test.js`: 183 frames measured in B (snake, apple, bonus creature, 38 of them with a bonus counter) against the picture library, bit for bit (`phone-states.json`).
- `tests/phone.test.js`, `tests/screens.test.js`, `tests/input.test.js`, `tests/store.test.js`, `tests/save.test.js`, `tests/i18n.test.js`, `tests/audio.test.js`, `tests/v21.test.js`: phone timing, menus, localized text and glyphs, input mapping, save/restore timers, tone scheduling, full-field win and storage behavior.

## Open

What would settle the remaining EST and FW-only items, in the order of what matters for the look of the game:

1. A sharp, straight-on English capture of the "Maze n selected" note (to settle the tick pixels) and the top score note with its animated icon.
2. Close-ups of "Your score:" and "Top score:" with the digits 0, 3, 5, 6 and 9, and of the glyphs `c s Y`.
3. The instruction pages in English, page by page, and what happens after the last one.
4. The level screen with every key (up, down, C, Select), and whether a level change discards a paused game.
5. Creatures 0 and 3 on a real phone (they match the program's picture but were never seen in footage), and the special bonus: whether it ever shows up.
6. A game that ends with a new top score from the first key press to the menu (which keys act, how long each part takes).
7. Pause and continue: whether the step time is kept or starts afresh.
8. A recording next to the speaker, synchronized to events, to compare the decoded eat/crash/win scripts and verify the absence or presence of other tones.
9. The start layout of each maze on a real phone, to compare with the walls that come from the program.

Footage should be straight on, close, in focus, no zoom changes, 60 fps if possible.
