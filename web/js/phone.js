/*
 * The phone around the game: what happens between pressing a key and the next picture. A small state machine on a
 * virtual clock, with no DOM and no real time inside, so the tests can play whole evenings in a moment.
 *
 *   splash -> menu -> ( game | level | mazes | top score note | instructions )
 *   game   -> (crash: the snake blinks 8 times, 2.1 s after the crash) -> game over
 *   game over -> [new top score: fireworks, twice through six pictures] -> note -> menu
 *   C in a game pauses it: the menu then starts with "Continue"
 *   a maze chosen in the maze list ends a paused game
 *
 * Every time and number is tagged in FIDELITY.md with where it comes from. Short version of what is read from the
 * program of the phone [FW]: the step time, the crash rule (100 ms grace, then 8 blinks 250 ms apart, game over
 * at 2100 ms), the messages the keys send. Measured in footage [PHONE]: splash 2700 ms, the six steps of the
 * fireworks 230 ms each, game over note and top score note about 3.07 s, the "maze selected" note about 1.5 s.
 * The menus are circular lists whose two numbers (top line, cursor) live on between the screens [VIDEO B, D].
 * Everything else the footage did not show is marked [EST] in place.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var Config = NS.Config || (req ? require('./config.js') : null);
  var Framebuffer = NS.Framebuffer || (req ? require('./framebuffer.js') : null);
  var Rng = NS.Rng || (req ? require('./rng.js') : null);
  var Engine = NS.Engine || (req ? require('./engine.js') : null);
  var Scene = NS.Scene || (req ? require('./scene.js') : null);
  var Pictures = NS.Pictures || (req ? require('./pictures.js') : null);
  var Texts = NS.Texts || (req ? require('./texts.js') : null);
  var Screens = NS.Screens || (req ? require('./screens.js') : null);
  var Store = NS.Store || (req ? require('./store.js') : null);
  var I18n = NS.I18n || (req ? require('./i18n.js') : null);
  var Text = NS.Text || (req ? require('./text.js') : null);

  var RET = Engine.RET;

  var TIMING = {
    SPLASH_MS: 2700,         // [PHONE] start-up animation, measured in footage (VIDEO B)
    NOTE_MS: 3070,           // [PHONE] the game over note and the top score note: 92..96 frames at 30 fps (VIDEO B, +-50 ms)
    MAZE_NOTE_MS: 1500,      // [PHONE] the "maze selected" note: 45..46 frames at 30 fps (VIDEO D)
    FIREWORKS_MS: null       // filled in below: steps * step time
  };
  TIMING.FIREWORKS_MS = Screens.fireworksSteps() * Pictures.FIREWORKS.stepMs;

  // The keys of the phone this edition knows. Digits are the keypad, 'select' is the middle (soft) key below the
  // display, 'c' the clear key, 'scrollUp' / 'scrollDown' the two keys that scroll menus.
  // 'cw' / 'ccw' stand for the keys that send the game the messages "turn clockwise / counter-clockwise" (4 / 5)
  // [EST] which physical key sends them is not known
  var KEYPAD_MSG = { '1': 10, '2': 11, '3': 12, '4': 13, '5': 14, '6': 15, '7': 16, '8': 17, '9': 18 };
  var TURN_MSG = { cw: 4, ccw: 5 };

  function Phone(options) {
    options = options || {};
    this.store = options.store || Store.create(null);
    this.rng = options.rng || Rng.fromClock();
    this.fb = new Framebuffer(84, 48);
    this.time = 0;                       // ms on the virtual clock
    this.modeStart = 0;
    this.mode = 'splash';
    this.game = null;                    // the game in progress or paused
    this.paused = false;
    this.main = { s: 0, c: 0 };          // the numbers of the main menu: top line, cursor (they outlive every screen)
    this.optionsState = { s: 0, c: 0 };
    this.languageState = { s: 0, c: 0 };
    this.menu = null;                    // { kind: 'main' | 'mazes', items, state: { s, c } }
    this.levelShown = this.store.level;
    this.page = 0;
    this.note = null;                    // { lines, then, ms, icon }
    this.dueTick = Infinity;
    this.dueBlink = Infinity;
    this.blinksLeft = 0;
    this.resumeTickMs = null;
    this.resumeBlinkMs = null;
    this.resumeBlinksLeft = 0;
    this.lastGameOver = null;            // { score, top } of the last game, for tests and the page
    this.listeners = [];
    this.eventCursor = 0;
    this.onEvent = null;
    this.onChange = null;
    this.onLanguageChange = null;
    if (options.skipSplash) this.showMain();
  }

  // ----- the clock --------------------------------------------------------------------------------------------------

  /** Time of the next thing that happens on its own, Infinity if the phone waits for a key. */
  Phone.prototype.nextDue = function () {
    switch (this.mode) {
      case 'splash': return this.modeStart + TIMING.SPLASH_MS;
      case 'fireworks': return this.modeStart + TIMING.FIREWORKS_MS;
      case 'note': return this.modeStart + this.note.ms;
      case 'game': return Math.min(this.dueTick, this.dueBlink);
      default: return Infinity;
    }
  };

  /** Let ms milliseconds pass; everything that falls due in between happens in order. */
  Phone.prototype.advance = function (ms) {
    var target = this.time + ms;
    for (var guard = 0; guard < 100000; guard++) {
      var due = this.nextDue();
      if (!(due <= target)) break;
      this.time = Math.max(this.time, due);
      this.fire();
    }
    this.time = target;
  };

  Phone.prototype.fire = function () {
    switch (this.mode) {
      case 'splash': this.showMain(); break;
      case 'fireworks': this.showGameOverNote(); break;
      case 'note': this.endNote(); break;
      case 'game':
        if (this.dueBlink <= this.dueTick) this.onBlink();
        else this.onTick();
        break;
    }
    try { if (typeof this.onChange === 'function') this.onChange(); } catch (ignore) {}
  };

  Phone.prototype.setMode = function (mode) {
    this.mode = mode;
    this.modeStart = this.time;
  };

  // ----- menu ----------------------------------------------------------------------------------------------------------

  Phone.prototype.mainItems = function () {
    var items = [this.t('NEW_GAME'), this.t('LEVEL'), this.t('MAZES'), this.t('TOP_SCORE'), this.t('INSTRUCTIONS'), this.t('OPTIONS')];
    if (this.paused) items.unshift(this.t('CONTINUE'));
    return items;
  };

  Phone.prototype.t = function (key, params) {
    return I18n.text(key, this.store.language, params);
  };

  Phone.prototype.mazeNames = function () {
    return this.t('MAZE_NAMES');
  };

  Phone.prototype.optionItems = function () {
    return [
      this.t('GAME_SOUNDS'), this.t('KEY_TONES'), this.t('VIBRATION'), this.t('LANGUAGE')
    ];
  };

  Phone.prototype.optionValues = function () {
    return [
      this.t(this.store.gameSounds ? 'ON' : 'OFF'),
      this.t(this.store.keyTones ? 'ON' : 'OFF'),
      this.t(this.store.vibration ? 'ON' : 'OFF'),
      this.store.language ? this.store.language.toUpperCase() : this.t('SYSTEM')
    ];
  };

  Phone.prototype.languageItems = function () {
    return [this.t('SYSTEM')].concat(I18n.LANGUAGES.map(function (language) { return language.name; }));
  };

  Phone.prototype.showOptions = function (cursor) {
    this.setMode('menu');
    if (cursor !== undefined) this.optionsState.c = cursor;
    this.menu = { kind: 'options', items: this.optionItems(), values: this.optionValues(), state: this.optionsState };
    Screens.fit(this.optionsState, this.menu.items.length);
  };

  Phone.prototype.showLanguages = function () {
    var index = 0;
    if (this.store.language) {
      for (var i = 0; i < I18n.LANGUAGES.length; i++) {
        if (I18n.LANGUAGES[i].code === this.store.language) { index = i + 1; break; }
      }
    }
    this.languageState = { s: index, c: index };
    this.setMode('menu');
    this.menu = { kind: 'language', items: this.languageItems(), state: this.languageState };
  };

  /**
   * Show the main menu. The two numbers of the list (top line, cursor) are the ones it had when it was left;
   * `cursor` puts the cursor on another item first (the menu after a game over and after the top score note starts
   * on item 0 with the top line unchanged [VIDEO B, D]).
   */
  Phone.prototype.showMain = function (cursor) {
    this.setMode('menu');
    var items = this.mainItems();
    if (cursor !== undefined) this.main.c = cursor;
    Screens.fit(this.main, items.length);
    this.menu = { kind: 'main', items: items, state: this.main };
  };

  Phone.prototype.menuMove = function (delta) {
    var m = this.menu;
    Screens.moveCursor(m.state, m.items.length, delta);
  };

  /** Header text of the menu: "8-1-n", the mazes list is one level deeper: "8-1-3-n" ("8-1-4-n" with Continue). */
  Phone.prototype.header = function () {
    var m = this.menu;
    if (m.kind === 'mazes') return '8-1-' + (this.paused ? 4 : 3) + '-' + (m.state.c + 1);
    if (m.kind === 'options') return '8-1-' + (this.paused ? 7 : 6) + '-' + (m.state.c + 1);
    if (m.kind === 'language') return '8-1-' + (this.paused ? 7 : 6) + '-4-' + (m.state.c + 1);
    return '8-1-' + (m.state.c + 1);
  };

  Phone.prototype.menuSelect = function () {
    var m = this.menu;
    var c = m.state.c;
    if (m.kind === 'options') {
      if (c === 0) this.store.gameSounds = !this.store.gameSounds;
      else if (c === 1) this.store.keyTones = !this.store.keyTones;
      else if (c === 2) this.store.vibration = !this.store.vibration;
      else { this.showLanguages(); return; }
      this.showOptions(c);
      return;
    }
    if (m.kind === 'language') {
      this.store.language = c === 0 ? null : I18n.LANGUAGES[c - 1].code;
      this.showOptions(3);
      if (typeof this.onLanguageChange === 'function') this.onLanguageChange(I18n.resolve(this.store.language));
      return;
    }
    if (m.kind === 'mazes') {
      this.store.maze = c + 1;
      // a paused game does not survive a maze change: "Continue" is gone from the main menu, the numbers stay [VIDEO D]
      this.game = null;
      this.paused = false;
      this.showNote(Screens.noteLines(this.t('SELECTED'), { u: this.mazeNames()[c] }, Screens.ICON_TEXT_WIDTH),
        this.showMain.bind(this), { ms: TIMING.MAZE_NOTE_MS, icon: true });
      return;
    }
    var item = m.items[c];
    if (item === this.t('CONTINUE')) this.resume();
    else if (item === this.t('NEW_GAME')) this.startGame();
    else if (item === this.t('LEVEL')) { this.levelShown = this.store.level; this.setMode('level'); }
    else if (item === this.t('MAZES')) {
      // the list opens with the maze in use on the top line and under the cursor [VIDEO D]
      var cur = this.store.maze - 1;
      var mazeNames = this.mazeNames();
      this.menu = { kind: 'mazes', items: mazeNames, state: { s: cur, c: cur } };
      Screens.fit(this.menu.state, mazeNames.length);
    } else if (item === this.t('TOP_SCORE')) {
      this.showNote(Screens.noteLines(this.t('TOP_SCORE_NOTE'), { n: this.store.top }), this.showMain.bind(this, 0));
    } else if (item === this.t('INSTRUCTIONS')) { this.page = 0; this.setMode('instructions'); }
    else if (item === this.t('OPTIONS')) this.showOptions(0);
  };

  // ----- notes -------------------------------------------------------------------------------------------------------

  /**
   * Show a note; `then` runs when it ends (or when a key ends it, [EST]). opts = { ms, icon }: how long it stays
   * (default NOTE_MS) and whether it has the box-and-tick icon of the "maze selected" note.
   */
  Phone.prototype.showNote = function (lines, then, opts) {
    opts = opts || {};
    this.note = { lines: lines, then: then, ms: opts.ms || TIMING.NOTE_MS, icon: !!opts.icon };
    this.setMode('note');
  };

  Phone.prototype.endNote = function () {
    var then = this.note.then;
    this.note = null;
    then();
  };

  // ----- game ---------------------------------------------------------------------------------------------------------

  Phone.prototype.startGame = function () {
    this.paused = false;
    this.game = new Engine.Game({ level: this.store.level, maze: this.store.maze, rng: this.rng });
    this.eventCursor = 0;
    this.setMode('game');
    this.blinksLeft = 0;
    this.dueBlink = Infinity;
    this.resumeTickMs = null;
    this.resumeBlinkMs = null;
    this.resumeBlinksLeft = 0;
    this.dueTick = this.time + this.game.delay;
  };

  Phone.prototype.resume = function () {
    this.paused = false;
    this.setMode('game');
    this.blinksLeft = this.resumeBlinksLeft;
    this.dueBlink = this.resumeBlinkMs === null ? Infinity : this.time + this.resumeBlinkMs;
    this.dueTick = this.time + (this.resumeTickMs === null ? this.game.delay : this.resumeTickMs);
    this.resumeTickMs = null;
    this.resumeBlinkMs = null;
    this.resumeBlinksLeft = 0;
  };

  Phone.prototype.pause = function () {
    // [EST] nothing is known about pausing in the dying phase (the game is lost anyway): the key is ignored there
    if (this.game.crash === 2) return;
    this.paused = true;
    this.dueTick = Infinity;
    this.dueBlink = Infinity;
    this.showMain();      // "Continue" is put in front of the list; the numbers stay as they were [VIDEO D]
  };

  Phone.prototype.onTick = function () {
    var g = this.game;
    var ret = g.tick();
    for (var i = this.eventCursor; i < g.events.length; i++) {
      if (g.events[i] === 'vibra') this.emit('vibration');
      else this.emit(g.events[i]);
    }
    this.eventCursor = g.events.length;
    if (ret === RET.OVER) { this.gameOver(); return; }
    if (ret === RET.CRASH) {
      this.blinksLeft = Config.BLINK_TOGGLES;
      this.dueBlink = this.time + Config.BLINK_MS;
    }
    this.dueTick = this.time + g.delay;
  };

  Phone.prototype.onBlink = function () {
    this.game.blink();
    this.blinksLeft--;
    this.dueBlink = this.blinksLeft > 0 ? this.time + Config.BLINK_MS : Infinity;
  };

  Phone.prototype.gameOver = function () {
    var score = this.game.score;
    var isTop = score > this.store.top;
    var won = this.game.code === 0x22;
    this.lastGameOver = { score: score, top: isTop ? score : this.store.top, newTop: isTop, won: won };
    if (isTop) this.store.top = score;
    this.game = null;
    this.dueTick = Infinity;
    this.dueBlink = Infinity;
    if (isTop) this.setMode('fireworks');
    else this.showGameOverNote();
  };

  Phone.prototype.showGameOverNote = function () {
    var info = this.lastGameOver;
    var tpl = info.won ? this.t('YOU_WON') : (info.newTop ? this.t('GAME_OVER_TOP') : this.t('GAME_OVER_SCORE'));
    this.showNote(Screens.noteLines(tpl, { n: info.score }), this.showMain.bind(this, 0));
  };

  Phone.prototype.emit = function (name) {
    try { if (typeof this.onEvent === 'function') this.onEvent(name); } catch (ignore) {}
  };

  // ----- keys ---------------------------------------------------------------------------------------------------------

  /** True while the keys steer the snake (the page maps the arrow keys differently then). */
  Phone.prototype.inGame = function () {
    return this.mode === 'game';
  };

  /**
   * One key press. key: 'select', 'c', 'scrollUp', 'scrollDown', '0'..'9', 'cw', 'ccw'.
   */
  Phone.prototype.press = function (key) {
    switch (this.mode) {
      case 'splash':
        // [EST] the footage does not show whether a key ends the start-up animation: it is ignored
        break;
      case 'fireworks':
        // [EST] keys during the fireworks are ignored
        break;
      case 'note':
        // [EST] a key ends a note (the note after the fireworks in VIDEO A was gone after 2.45 s, 0.6 s early)
        this.endNote();
        break;
      case 'menu':
        this.pressMenu(key);
        break;
      case 'level':
        this.pressLevel(key);
        break;
      case 'instructions':
        this.pressInstructions(key);
        break;
      case 'game':
        this.pressGame(key);
        break;
    }
  };

  Phone.prototype.pressMenu = function (key) {
    if (key === 'scrollUp') this.menuMove(-1);
    else if (key === 'scrollDown') this.menuMove(1);
    else if (key === 'select') this.menuSelect();
    else if (key === 'c' && this.menu.kind === 'mazes') this.showMain();      // [EST] back, the main menu as it was
    else if (key === 'c' && this.menu.kind === 'language') this.showOptions(3);
    else if (key === 'c' && this.menu.kind === 'options') this.showMain();
  };

  Phone.prototype.pressLevel = function (key) {
    // [EST] the cursor stops at 1 and 9
    if (key === 'scrollUp') this.levelShown = Math.min(9, this.levelShown + 1);
    else if (key === 'scrollDown') this.levelShown = Math.max(1, this.levelShown - 1);
    else if (key === 'select') {
      this.store.level = this.levelShown;      // [EST] a paused game is not touched by a level change
      this.showMain();
    } else if (key === 'c') this.showMain();
  };

  Phone.prototype.pressInstructions = function (key) {
    if (key === 'select') this.page = (this.page + 1) % Screens.instructionPages(this.t('INSTRUCTION_TEXT')).length;
    else if (key === 'c') this.showMain();
  };

  Phone.prototype.pressGame = function (key) {
    if (key === 'c') { this.pause(); return; }
    var msg = KEYPAD_MSG[key] || TURN_MSG[key];
    if (msg !== undefined) this.game.key(msg);
  };

  Phone.prototype.snapshot = function () {
    var game = this.game ? this.game.snapshot() : null;
    return {
      version: 1, mode: this.mode, paused: !!this.paused, main: { s: this.main.s, c: this.main.c },
      store: { level: this.store.level, maze: this.store.maze, top: this.store.top,
        gameSounds: this.store.gameSounds, keyTones: this.store.keyTones, vibration: this.store.vibration, language: this.store.language },
      game: game,
      remainingTick: this.mode === 'game' && isFinite(this.dueTick) ? Math.max(0, this.dueTick - this.time) : null,
      remainingBlink: this.mode === 'game' && isFinite(this.dueBlink) ? Math.max(0, this.dueBlink - this.time) : null,
      blinksLeft: this.mode === 'game' ? this.blinksLeft : 0
    };
  };

  Phone.prototype.restore = function (s) {
    function int(v, lo, hi) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= lo && v <= hi; }
    if (!s || s.version !== 1 || !Object.prototype.hasOwnProperty.call(s, 'game') || !s.store || !int(s.store.level, 1, 9) || !int(s.store.maze, 1, 6) ||
        !int(s.store.top, 0, 0x7fffffff) || typeof s.paused !== 'boolean' || !s.main ||
        !int(s.main.s, 0, 6) || !int(s.main.c, 0, 6) || typeof s.mode !== 'string') return false;
    var hasGame = !!s.game;
    var tempRng = { state: 0, getState: function () { return this.state; }, setState: function (v) { this.state = v; return true; } };
    var restoredGame = null;
    if (hasGame) {
      if (!this.rng || typeof this.rng.setState !== 'function') return false;
      restoredGame = Engine.Game.restore(s.game, tempRng);
      if (!restoredGame) return false;
      if ((s.mode === 'game') && (!int(s.remainingTick, 0, 60000) ||
          (s.remainingBlink !== null && !int(s.remainingBlink, 0, 60000)))) return false;
      if (s.blinksLeft !== undefined && !int(s.blinksLeft, 0, Config.BLINK_TOGGLES)) return false;
    }
    if (s.store.gameSounds !== undefined && typeof s.store.gameSounds !== 'boolean') return false;
    if (s.store.keyTones !== undefined && typeof s.store.keyTones !== 'boolean') return false;
    if (s.store.vibration !== undefined && typeof s.store.vibration !== 'boolean') return false;
    if (s.store.language !== undefined && s.store.language !== null && typeof s.store.language !== 'string') return false;
    if (restoredGame) {
      restoredGame = Engine.Game.restore(s.game, this.rng);
      if (!restoredGame) return false;
    }
    // Apply only after the complete payload has passed validation, so a bad save leaves this phone unchanged.
    this.store.level = s.store.level; this.store.maze = s.store.maze; this.store.top = s.store.top;
    if (s.store.gameSounds !== undefined) this.store.gameSounds = s.store.gameSounds;
    if (s.store.keyTones !== undefined) this.store.keyTones = s.store.keyTones;
    if (s.store.vibration !== undefined) this.store.vibration = s.store.vibration;
    if (s.store.language !== undefined) this.store.language = s.store.language;
    this.time = 0; this.modeStart = 0; this.note = null; this.lastGameOver = null;
    this.game = restoredGame; this.paused = !!restoredGame; this.main.s = s.main.s;
    this.main.c = restoredGame && s.mode === 'game' ? 0 : s.main.c;
    this.resumeTickMs = restoredGame && s.mode === 'game' ? s.remainingTick : null;
    this.resumeBlinkMs = restoredGame && s.mode === 'game' ? s.remainingBlink : null;
    this.resumeBlinksLeft = restoredGame && s.mode === 'game' ?
      (s.blinksLeft === undefined ? (s.remainingBlink === null ? 0 : Math.max(0, Config.BLINK_TOGGLES - restoredGame.blinkCount)) : s.blinksLeft) : 0;
    if (restoredGame) {
      this.showMain(this.main.c);
      if (!s.paused && s.mode === 'game') this.paused = true;
    } else this.showMain();
    this.dueTick = Infinity; this.dueBlink = Infinity; this.blinksLeft = 0;
    return true;
  };

  // ----- picture --------------------------------------------------------------------------------------------------------

  /** The picture of the display now (the same Framebuffer every time). */
  Phone.prototype.draw = function () {
    Text.setFontPack(I18n.fontPack(this.store.language));
    var fb = this.fb;
    var t = this.time - this.modeStart;
    switch (this.mode) {
      case 'splash': Screens.drawSplash(fb, t); break;
      case 'fireworks': Screens.drawFireworks(fb, t); break;
      case 'note': Screens.drawNote(fb, this.note.lines, this.note.icon ? { t: t } : null); break;
      case 'level': Screens.drawLevel(fb, this.levelShown, this.t('LEVEL_LABEL'), this.t('OK')); break;
      case 'instructions': Screens.drawInstructions(fb, this.page, this.t('INSTRUCTION_TEXT'), this.t('NEXT'), I18n.resolve(this.store.language) !== 'en'); break;
      case 'game': Scene.drawGame(fb, this.game); break;
      case 'menu':
        Screens.drawMenu(fb, {
          items: this.menu.items, values: this.menu.values, s: this.menu.state.s, c: this.menu.state.c,
          header: this.header(), softKey: this.menu.kind === 'mazes' ? this.t('OK') : this.t('SELECT')
        });
        break;
    }
    return fb;
  };

  Phone.TIMING = TIMING;
  Phone.KEYPAD_MSG = KEYPAD_MSG;

  NS.Phone = Phone;
  if (typeof module === 'object' && module.exports) module.exports = Phone;
})();
