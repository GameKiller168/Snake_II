# Fidelity ledger

Goal: the browser edition is a 1:1 recreation of Snake II as it runs on a real Nokia 3310 (English firmware v6.39). This file says, element by element, what each part rests on. Whatever is an estimate is marked as one, here and in the code (`[EST]`), and is replaced as soon as better evidence exists. Nothing is invented to fill a gap: where nothing is known, the thing is the simplest possible one and is marked EST, or it is missing and listed under "Not in v2".

## Evidence tags

| Tag | Meaning |
| --- | --- |
| FW | read from the program of a real 3310 (firmware v6.39, English). The game logic is in addition checked against the running program, message by message (see "Tests") |
| PHONE | a time, a count or a behaviour observed on a real phone in footage |
| VIDEO | a picture or a position read from filmed frames of real phones, with the error given where it is not exact |
| EST | an estimate: nothing measured, nothing read |

Where footage and program could be compared (step time of level 1, bonus counter and value, crash timing, the pictures of the snake) they agree.

## Where the facts come from

Four recordings of real phones, shared by Hunor, and the firmware of the 3310. All of it was used for analysis only and stays out of the repository (`reference/` is git-ignored).

| Clip | What it is | Used for |
| --- | --- | --- |
| A | "Playing Snake 2 At Full Speed" (91 Pixels), 1080 x 1920, 30 fps, 56 s, English, green LCD | game over and top score notes, the fireworks |
| B | "Snake II on Nokia 3310 - varjoisa", 1920 x 1080, 30 fps, 481 s, English, blue backlight, one long game at the default level | pictures of snake, apple and bonus creatures, header, menus, notes, timings |
| C | "Snake 2 Original ... ASMR - Handheld Gameplayer", real sound | nothing: v2 has no sound, and the LCD is too small in this clip to read pixels |
| D | "Snake II on Nokia 3310 (4K) - JAVA Mobile Games", Russian UI, close-up, 1920 x 1080, 308 s | menus, level screen, maze list, "maze selected" note; only what does not depend on the language |

Firmware: the English v6.39 flash dump of the 3310 (MCU and PPM). No firmware file, no program code and no table from it is in the repository. What it contributed is of three kinds: numbers and rules that were written down by hand and re-implemented (`config.js`, `engine.js`, `rng.js`), the English texts (`texts.js`), and small pixel pictures (start-up animation, fonts, fireworks, bonus creatures). **The pixel pictures are copies of Nokia's artwork at 84 x 48 resolution**; wherever footage exists they were compared with it, and the pictures of the game itself are in addition checked against the program's own picture (see "Tests"); what neither covers is marked "FW only" in the tables. That is the one place where Nokia's work lives in this repository.

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
| Steering | 2, 4, 6, 8 set a direction (never straight back); 1, 3, 7, 9 turn by 90 degrees towards that corner; 5 does nothing; all look at the direction of the step being made | FW | the program also knows "turn clockwise / counter-clockwise" messages; which physical key sends them is not known, v2 has no key for them |
| Mazes | six start layouts: "No maze" and "Maze 1" .. "Maze 5"; walls block, open edges wrap | FW | every maze occurs in at least 11 of the oracle conversations, and the picture with its walls is checked against the program's after every message; **not compared with footage yet** |
| Random numbers | `seed = (seed x 0x625F + 0x3623) mod 0xFFF1`, the program's own generator | FW | the phone seeds it from its clock, v2 from the browser's entropy: any seed is as original as another |
| Vibration | the engine records when the phone would vibrate (eating, crash); the page does not use it | FW | |

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
| Bold font | menu items, soft keys, labels | FW, VIDEO | the characters of the menu texts were checked in footage; other glyphs of the font are FW only |
| Thin font | the instruction pages | **FW only** | no footage shows an instruction page in English |
| Menu numbers in the header | digits 1 2 3 4 5 8 and "-" | VIDEO | digit 6 is **EST** (never filmed; shows when the cursor is on the 6th item of a list) |
| Large font of the notes | 11 rows (13 for "p"), one empty column after each glyph, space 3 wide, "R" 8 wide | VIDEO | measured: `! 1 2 4 7 8 : C E G O P R S T a d e m o p r u v` (+- 1 pixel); **weaker: `9` and `Y`** (read from sheared frames); **EST: `0 3 5 6 c s`** (drawn after the pattern of the measured glyphs, listed in `LARGE_EST` so that they can be replaced) |
| Note lines whose glyphs are missing | drawn in the bold font on the baseline of the large font | EST | `M z t l L N` were not on the footage, so "Maze n selected" and "No maze selected" are bold lines |
| "Maze n selected" icon | dotted box in the upper right corner, a tick drawn into it | place and time VIDEO (D, +- 2 pixels), the pixels **EST** | box appears with the note, the tick starts after 700 ms and takes 5 steps of 65 ms |
| Top score note icon | **not reproduced**: the footage shows an animated dotted picture in the upper right corner of this note (B), v2 shows none | - | |

## The phone around the game

Measured in footage unless it says otherwise.

| Element | v2 | Tag | Note |
| --- | --- | --- | --- |
| Main menu | New game, Level, Mazes, Top score, Instructions; "Continue" in front while a game is paused | VIDEO, FW | English texts from the program's text table |
| Lists | circular; a window of three lines; the state is two numbers, the item on the top line and the item with the cursor. Down: the cursor moves on, and when it would leave the window the window follows so that the cursor is on the bottom line; up: the window follows so that the cursor is on the top line; lists of up to three items do not scroll | VIDEO (B, D) | the model reproduces every move seen in B and D |
| The two numbers of the main menu | live on through the level screen, the instructions, the maze list and a pause | VIDEO (B, D) | |
| After a game over and after the top score note | the cursor is on the first item, the top line stays as it was | VIDEO (B, D) | based on few events |
| Header numbers | `8-1-n` for item n; the maze list `8-1-3-n`, `8-1-4-n` while a game is paused | VIDEO | |
| Menu layout | list rows 7..36, three lines of 10 rows, cursor bar columns 0..78 with the text cleared out of it, text 2 columns in, soft key centred on row 40, scroll bar on columns 81..83 | VIDEO | scroll bar thumb: fitted to the footage, +- 1 pixel |
| Soft keys | "Select" in the menu, "OK" in the maze list and on the level screen, "Next" in the instructions | VIDEO, FW | |
| Maze list | opens with the maze in use on the top line and under the cursor; Select stores it and shows "Maze n selected" for 1500 ms; the main menu then comes back on "Mazes" | VIDEO (D), PHONE | |
| Choosing a maze while a game is paused | throws the paused game away ("Continue" disappears, the cursor index stays) | VIDEO (D) | |
| Game over note | "Game over!" "Your score:" n, or "Game over!" "TOP SCORE:" n after the fireworks; 3070 ms | VIDEO, PHONE (+- 50 ms) | the rule "new top score = strictly more than the stored one" is **EST** |
| Top score note | "Top score:" n; 3070 ms | VIDEO, PHONE | |
| Level screen | "Level:" and nine bars, the chosen level and all below it filled | VIDEO (B, D) | the keys on it (up = higher, limits 1 and 9, C and Select) are **EST** |
| Keys while something is shown | ignored during the start-up animation and the fireworks, a key ends a note, C goes back from the maze list, level screen and instructions | EST | a note after the fireworks in A was gone 0.6 s early, which may have been a key |
| Pause | C in the game pauses (the menu with "Continue"); Continue resumes, the step time starts afresh | EST | nothing is known about the exact timing; a pause during the dying phase is ignored |
| Instruction pages | text from the program, 3 lines per page in the thin font, "Next" turns the page, after the last page it starts again | text FW, rest **EST** | layout (rows 7, 16, 25, column 1, width 82) and what happens at the end were not seen |
| Does a level change throw a paused game away? | no | **EST** | a maze change does (D), a level change was not filmed |

## Only in the browser edition

| Element | Note |
| --- | --- |
| Keyboard | arrow keys and W A S D are the keys 2, 4, 6, 8 in the game and scroll the menus outside; Enter and Space are the middle key, Backspace, Escape and C the clear key; in the game the digits 1..9 are the keypad. A choice of this page, not of the phone |
| On-screen keys | the keypad and the four function keys below the display, for touch screens |
| Page and display size | dark page, the display scales with the window |
| Memory of the phone | the chosen level and maze and the top score are kept in the browser (`localStorage`); if it is not available they live until the page is closed. How the phone keeps them is not verified; its initial values (level 1, "No maze", top score 0) are |
| Hidden tab | the game clock stops while the page is hidden and one frame never advances it by more than 250 ms |

## Not in v2

- Sound. Clip C has the real sounds but v2 does not use them; nothing was made up instead.
- The special bonus item (see "Game logic").
- The icon of the top score note.
- Anything of the other games of the phone, the clock, the menus outside Snake II.

## Tests

`cd web && node --test` runs 358 tests, nothing to install.

- `tests/oracle.test.js`: 84 conversations with the real program (26 846 messages over all nine levels and all six mazes, with deliberate crashes, turns in the grace time, bonus creatures of all six kinds eaten and expired, snakes that wrap around the end of the program's ring buffer) and 440 placement cases for the two random placement routines. After every message the engine must give the same return code, delays, event code and score, and the CRC-32 of the complete 84 x 48 picture of the game as `scene.js` draws it (frame, walls, snake, apple, creature, score, counter). The fixtures hold numbers only (`traces.json`, `placement.json`); they were recorded by running the program in an emulator with a bot playing. Nothing of the program is in them.
- `tests/tiles.test.js`: 183 frames measured in B (snake, apple, bonus creature, 38 of them with a bonus counter) against the picture library, bit for bit (`phone-states.json`).
- `tests/phone.test.js`, `tests/screens.test.js`, `tests/input.test.js`, `tests/store.test.js`: the phone on its virtual clock (start-up, circular lists, maze list and note, pause and continue, crash timeline 5280 / 5380 / 7480 ms at level 1 in the first maze, fireworks, notes), the pictures (large font coverage, estimates listed, icon timeline, scroll bar, fireworks), keys, storage.

## Open

What would settle the EST and FW-only items, in the order of what matters for the look of the game:

1. A close-up of the English notes "Maze n selected" and "No maze selected" (large glyphs `M z t l N`, the exact box and tick), and of the top score note with its animated icon.
2. Close-ups of "Your score:" and "Top score:" with the digits 0, 3, 5, 6 and 9, and of the glyphs `c s Y`.
3. The instruction pages in English, page by page, and what happens after the last one.
4. The level screen with every key (up, down, C, Select), and whether a level change discards a paused game.
5. Creatures 0 and 3 on a real phone (they match the program's picture but were never seen in footage), and the special bonus: whether it ever shows up.
6. A game that ends with a new top score from the first key press to the menu (which keys act, how long each part takes).
7. Pause and continue: whether the step time is kept or starts afresh.
8. Sound, recorded next to the speaker: menu, eating, bonus appears / eaten / expires, crash, game over.
9. The start layout of each maze on a real phone, to compare with the walls that come from the program.

Footage should be straight on, close, in focus, no zoom changes, 60 fps if possible.
