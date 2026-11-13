# Changelog

## v2.1.0 — 2026-11-13

- Added firmware-decoded eat, crash and full-field tone sequences, plus DTMF key tones generated with Web Audio.
- Added optional vibration for the firmware's eat, crash and game-over events.
- Added Options for game sound, key tones, vibration and language, with English, Hungarian, Romanian, German, Slovak, Polish, French and Spanish.
- Added browser-language detection, Nokia-style localized glyph extensions, and translations for menus, notes and instructions.
- Added local autosave for settings, high score and a resumable game state, including saved tick and crash-blink deadlines.
- Reconstructed the scroll thumb from available screen crops and added a curved selection checkmark traced from a soft screen capture; its exact pixels remain an estimate.
- Added tactile pressed states to the on-screen keys and corrected physical numpad orientation; WASD remains supported without adding on-screen hints.
- Added a small local-storage notice and CI coverage for the dependency-free browser app.

The firmware tone frequencies and timing are decoded data. Browser waveform, gain, accent glyphs, some DTMF mappings and parts of the UI artwork remain labeled estimates in `web/FIDELITY.md`.
