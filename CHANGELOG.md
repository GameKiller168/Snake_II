# Changelog

## v2.3.2 — 2026-11-15

- The on-screen keypad is now fully multi-touch: any number of keys, up to all of them, can be held at once, each finger working independently. Dragging a finger over the keypad lets go of the key it leaves and presses the key it arrives on, also while other fingers stay down; a finger lifted outside the keypad no longer leaves a key stuck.

## v2.3.1 — 2026-11-14

- Fixed the large font of the notes in the Hungarian, Spanish, Portuguese, Romanian, Croatian, Slovenian, Serbian and other locale packs: capital letters with accents (such as the É of "NYERTÉL!") were drawn as a jumble, because the extracted tables of PPM C, D, E, I and J hold those glyphs in two halves. Such glyphs now come from the whole PPM B table, and a line that still needs a damaged glyph (some Greek, Ukrainian and Hebrew capitals) is drawn in the bold small font instead.

## v2.3.0 — 2026-11-14

- The game is now an installable PWA: a web app manifest (`standalone` / `fullscreen`, portrait, dark `#14161a` colours), PNG icons (192, 512, maskable and a 180 px Apple touch icon) and a service worker that caches every static file so the game also runs offline. Install from the browser's own menu (Chrome, Brave: Install app; Safari: Add to Home Screen); the page itself shows no install prompt or any other new element.
- iOS standalone mode: the Apple web-app meta tags, `viewport-fit=cover` and safe-area insets on all four sides keep the phone clear of the status bar and home indicator.

## v2.2.2 — 2026-11-14

- The start-up animation now plays every time the page loads, also when a saved game or menu is restored; the menu then comes up as it was left (with "Continue" when a game is paused), as before.

## v2.2.1 — 2026-11-14

- Removed the pixel fade-in and fading trail that v2.2.0 added to the display: the LCD draws every picture at once again, as in v2.1.2.

## v2.2.0 — 2026-11-14

- Redesigned the on-screen keypad after the Nokia 3310: sculpted, slightly slanted keys with a domed look and a pressed state, a silver Select key with its blue line, and control keys marked with a C and two scroll chevrons.
- The key labels follow the phone: digits, letters, the voicemail mark on 1, the star and plus on *, the space mark on 0 and the shift mark on #, placed and sized as on the original keys. The direction arrows on 2, 4, 6 and 8 are gone.
- The display now behaves like a passive-matrix panel of the era: pixels fade in over a few frames and clear more slowly, so moving things leave a short fading trail. The times are estimates, see `web/FIDELITY.md`.
- The display is framed in a dark bezel with the rounded outline of the phone's window; the page no longer shows a version label or a line of keyboard hints.
- The tests no longer depend on the language of the machine that runs them.

## v2.1.2 — 2026-11-13

- Localized the menu and maze names for all 36 languages listed in the supplied Nokia 3310 v6.39 PPM chart.
- Added exact bitmap tables for PPM A, E, I and O alongside B, C, D and J; locale selection now chooses its matching decoded pack where available.
- Added browser shaping for scripts that the recovered small-font tables cannot map reliably (Arabic, Hebrew, Chinese, Thai, Hindi and unsupported Vietnamese glyphs).

## v2.1.1 — font work

- Replaced the partial English-only glyph tables with the complete small, large and tiny bitmap fonts extracted from Nokia 3310 v6.39 PPM packs B, C, D and J.
- Uses PPM B as the shared Latin base and the matching B/C/D/J packs for localized glyphs in all eight app languages; Romanian comma-below letters use PPM D's original cedilla glyphs.
- Fixed small-font spacing and the missing bold lowercase `k`; large note glyphs and header digits now use their firmware bitmaps.
- Added a language-by-language glyph-coverage check and exported all 22 v6.39 PPM font chunks plus five FLS font sets; four special-layout PPMs are preserved as raw chunks where glyph mapping is not reliable.

## v2.1.0 — 2026-11-13

- Added firmware-decoded eat, crash and full-field tone sequences, plus DTMF key tones generated with Web Audio.
- Added optional vibration for the firmware's eat, crash and game-over events.
- Added Options for game sound, key tones, vibration and language, with English, Hungarian, Romanian, German, Slovak, Polish, French and Spanish.
- Added browser-language detection, Nokia-style localized glyph extensions, and translations for menus, notes and instructions.
- Added local autosave for settings, high score and a resumable game state, including saved tick and crash-blink deadlines.
- Reconstructed the scroll thumb from available screen crops and added a curved selection checkmark traced from a soft screen capture; its exact pixels remain an estimate.
- Added tactile pressed states to the on-screen keys and corrected physical numpad orientation; WASD remains supported without adding on-screen hints.
- Added a small local-storage notice and CI coverage for the dependency-free browser app.

The firmware tone frequencies and timing are decoded data. Browser waveform and gain, some DTMF mappings and parts of the UI artwork remain labeled estimates in `web/FIDELITY.md`; complex-script shaping in v2.1.2 uses the browser's available system fonts.
