# Changelog

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
