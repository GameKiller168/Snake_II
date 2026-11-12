# Fidelity ledger

Goal: v2.x is a 1:1 recreation of Snake II as it ran on the real Nokia 3310. This file says, element by element, what v2.0 rests on today. Nothing may stay "probably right": whatever is an estimate is marked as one here, and is replaced as soon as better evidence exists.

## Evidence levels (strongest first)

| Level | Meaning |
| --- | --- |
| FW | read out of a dump of the phone's own firmware |
| PHONE | measured on a clear photo or video of a real Nokia 3310 |
| VIDEO | some other recording of the game (emulator, unknown device); only until PHONE exists |
| JAVA / PDF | the 2021 Java code (v1.0) and the photo of the real game in the PDF next to it |
| WEB | a claim from a web page, not verified on a phone |
| EST | my own estimate, nothing behind it |

The stronger source wins. Where there is none, the feature stays as it is, marked EST, and nothing new is invented around it.

## State of v2.0

### Display

| Element | v2.0 | Level | Note |
| --- | --- | --- | --- |
| LCD 84 x 48, 10 x 12 cells, 1 px grid, frame lines on rows 6, 8, 47 and columns 0, 83 | as the 2021 window | JAVA | golden-tested against the original `Screen.paint`; the look of the real LCD (pixel shape, spacing, colours) is not measured |
| Sprites of snake, apple, score digits | pixel for pixel from the 2021 tables | JAVA | golden-tested; these are the 2021 drawings and were never compared with the phone |
| Turns (corners) | repaired, switchable with `?corners=2021` | PDF | the 2021 engine leaves gaps; the repaired shape comes from the photo on page 5 of the PDF |
| Letters of titles and messages (3 x 5 and 5 x 7 fonts) | own bitmaps | EST | the real fonts are in the firmware |
| Colours | LCD skin (default) | EST | the neon skin is the 2021 colour pair (JAVA) |

### Play field

| Element | v2.0 | Level | Note |
| --- | --- | --- | --- |
| Step of 4 LCD px, apple lattice origin (3, 11) | as 2021 | JAVA | |
| Field of 21 x 10 cells (columns 0..83, rows 8..47) | torus | EST | derived from the LCD geometry; the real extent is not verified |
| Apple spots | 20 x 9 | EST | the 2021 code used 19 x 8 (x 3..75, y 11..39); v2 adds one column and one row |
| Start: head at (7, 31), length 9 | as 2021 | JAVA | |
| Intro: 9 fast steps "unroll" the snake | own animation | EST | the 2021 code only has a tick threshold |

### Rules

| Element | v2.0 | Level | Note |
| --- | --- | --- | --- |
| Leaving one side re-enters on the other | yes | WEB | Windows Blog almanac, Wikipedia (links below) |
| Hitting yourself ends the game | yes | WEB | Wikipedia; the 2021 code had no collision |
| Nine levels | yes | WEB | StrategyWiki |
| Default level | 4 | EST | |
| Step time per level | 200, 175, 150, 130, 112, 96, 82, 70, 60 ms | EST | no source at all; to be measured per level on the phone |
| Points per apple | 4 x level | JAVA / EST | the 2021 code gives 4 per apple; the factor is mine (WEB: higher level, more points) |
| Maximum score | 9999 | EST | |
| Bonus bug after every 5th apple | yes | WEB | StrategyWiki |
| Bonus does not grow the snake | yes | WEB | StrategyWiki |
| Bonus lifetime 56 steps, value level x (5 + remaining / 4) | yes | EST | |
| Bonus bug look (2 frames, 8 x 5), timer bar (x 22, y 1, 56 x 3), blinking at the end | own drawing | EST | to be replaced from PHONE or FW |
| Extra value after a skipped bonus | not implemented | WEB | StrategyWiki claims it; unverified |
| Mazes | not implemented | WEB | a Nokia 3361 manual says "a clear field, or select from five different mazes"; the 3310 list is unverified |

### Flow and interface

| Element | v2.0 | Level | Note |
| --- | --- | --- | --- |
| Title screen: demo snake, level selector, best score, "PRESS START" | own design | EST | invented; the real menu (texts, order, soft keys, animation) has to replace it |
| Pause box, game over box, "NEW BEST!", "CLEARED!" | own design | EST | |
| Crash animation (blinking 1.1 s), restart lock 0.9 s | own design | EST | |
| Best score per level (localStorage) | own feature | EST | how the real game keeps its high score is not verified |
| Turn queue of 3, reversals ignored | own design | EST | |
| Keyboard and touch controls | own design | EST | the phone's key mapping is not verified |
| Sound | plain square beeps | EST | never taken from a recording |

## Reference material

Two YouTube videos were shared as references (one: gameplay at the default level, shows the bonus bugs; two: menu, intro animation and a little gameplay, the audio of the second one is not to be used). They have not been analysed yet because they could not be opened in the session that wrote this file. When they are, every fact taken from them is recorded here with the timestamp.

Footage wanted from the real 3310 (straight on, close, in focus, no zoom changes, 60 fps if possible):

- switching on to the Snake II menu: every screen and every menu item
- the intro animation from start to end
- 15 seconds of play on each of the levels 1 to 9 (the step time is measured from this)
- a bonus bug from its appearance until it is eaten or expires, with the score before and after
- the start picture of every maze
- crash, game over, new high score and pause
- sound as a separate recording next to the speaker: menu, eating, bonus appears / eaten / expires, crash, game over

Firmware dump (the surest source): the 3310 is a DCT3 phone with 2 MB of flash, laid out as MCU firmware `0x200000-0x340000`, PPM `0x340000-0x3D0000`, EEPROM `0x3D0000-0x400000` (Hackaday project 3472, log "Nokia firmware reverse engineering"). The old DCT3 flasher guides start with a flash read saved as a `.fls` file; only reading is needed, never writing to the phone. The dump and everything extracted from it belong to the Nokia firmware and stay out of the repository (`reference/` is git-ignored).

## Links

- Windows Blog, Nokia 3310 almanac: <https://blogs.windows.com/devices/almanac/nokia-3310/>
- Wikipedia, Snake II: <https://en.wikipedia.org/wiki/Snake_II>
- StrategyWiki, Snake II: <https://strategywiki.org/wiki/Snake%20II>
- Nokia 3361 manual, Snake II page: <https://www.manualslib.com/manual/112013/Nokia-3361.html?page=124>
- Hackaday project 3472, memory map of the 3310: <https://hackaday.io/project/3472/log/11603-nokia-firmware-reverse-engineering>
- DCT3 flash read, step by step: <https://panuworld.net/nuukiaworld/hardware/flash/flashing.htm>
