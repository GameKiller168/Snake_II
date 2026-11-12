/*
 * Texts of the page around the LCD (Hungarian and English). The texts on the LCD itself are in
 * English: the bitmap fonts only have capitals without accents, like the original display.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  var TEXTS = {
    hu: {
      'doc.title': 'Snake II',
      'aria.lcd': 'Snake II kijelző',
      'aria.tools': 'Beállítások',
      'aria.pad': 'Érintős irányítás',
      'tool.sound.on': 'Hang: be',
      'tool.sound.off': 'Hang: ki',
      'tool.skin.neon': 'Kinézet: neon',
      'tool.skin.lcd': 'Kinézet: LCD',
      'tool.lang': 'EN',
      'tool.lang.title': 'Switch to English',
      'btn.up': 'Fel',
      'btn.down': 'Le',
      'btn.left': 'Balra',
      'btn.right': 'Jobbra',
      'btn.menu': 'Menü',
      'btn.title': 'Indítás',
      'btn.play': 'Szünet',
      'btn.paused': 'Tovább',
      'btn.over': 'Újra',
      'hint.title.kbd': '←/→ vagy 1–9: szint · Enter, Szóköz vagy kattintás: indítás',
      'hint.play.kbd': 'Nyilak / WASD: irányítás · P vagy Szóköz: szünet · M: hang',
      'hint.paused.kbd': 'P, Szóköz vagy Enter: tovább · Q: menü',
      'hint.over.kbd': 'Enter vagy Szóköz: újra · Esc: menü',
      'hint.title.touch': '◀ ▶ a szinthez · koppints vagy START: indítás',
      'hint.play.touch': 'Húzd az ujjad a kijelzőn, vagy használd a nyilakat',
      'hint.paused.touch': 'Koppints vagy TOVÁBB: folytatás · MENÜ: főmenü',
      'hint.over.touch': 'Koppints vagy ÚJRA: új játék · MENÜ: főmenü',
      'live.paused': 'Szünet',
      'live.resumed': 'Tovább',
      'live.over': 'Vége a játéknak. Pontszám: {score}.',
      'live.overBest': 'Vége a játéknak. Új csúcs: {score} pont!',
      'live.cleared': 'Betelt a pálya! Pontszám: {score}.',
      'live.start': 'Játék indul, szint {level}',
      'noscript': 'A Snake II-höz JavaScript kell.'
    },
    en: {
      'doc.title': 'Snake II',
      'aria.lcd': 'Snake II display',
      'aria.tools': 'Settings',
      'aria.pad': 'Touch controls',
      'tool.sound.on': 'Sound: on',
      'tool.sound.off': 'Sound: off',
      'tool.skin.neon': 'Look: neon',
      'tool.skin.lcd': 'Look: LCD',
      'tool.lang': 'HU',
      'tool.lang.title': 'Váltás magyarra',
      'btn.up': 'Up',
      'btn.down': 'Down',
      'btn.left': 'Left',
      'btn.right': 'Right',
      'btn.menu': 'Menu',
      'btn.title': 'Start',
      'btn.play': 'Pause',
      'btn.paused': 'Resume',
      'btn.over': 'Again',
      'hint.title.kbd': '←/→ or 1–9: level · Enter, Space or click: start',
      'hint.play.kbd': 'Arrows / WASD: steer · P or Space: pause · M: sound',
      'hint.paused.kbd': 'P, Space or Enter: resume · Q: menu',
      'hint.over.kbd': 'Enter or Space: again · Esc: menu',
      'hint.title.touch': '◀ ▶ for the level · tap or START: play',
      'hint.play.touch': 'Swipe on the display, or use the arrows',
      'hint.paused.touch': 'Tap or RESUME: continue · MENU: main menu',
      'hint.over.touch': 'Tap or AGAIN: new game · MENU: main menu',
      'live.paused': 'Paused',
      'live.resumed': 'Resumed',
      'live.over': 'Game over. Score: {score}.',
      'live.overBest': 'Game over. New best: {score} points!',
      'live.cleared': 'Board cleared! Score: {score}.',
      'live.start': 'Game started, level {level}',
      'noscript': 'Snake II needs JavaScript.'
    }
  };

  var LANGS = ['hu', 'en'];

  function t(lang, key, vars) {
    var table = TEXTS[lang] || TEXTS.en;
    var s = table[key];
    if (s === undefined) s = TEXTS.en[key];
    if (s === undefined) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] !== undefined ? String(vars[name]) : m;
      });
    }
    return s;
  }

  /** First guess from the browser language: Hungarian for hu*, English for everything else. */
  function detect(navLang) {
    return /^hu\b/i.test(navLang || '') ? 'hu' : 'en';
  }

  var I18n = { t: t, detect: detect, LANGS: LANGS, TEXTS: TEXTS };
  NS.I18n = I18n;
  if (typeof module === 'object' && module.exports) module.exports = I18n;
})();
