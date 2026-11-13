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
    this.menu = null;                    // { kind: 'main' | 'mazes', items, state: { s, c } }
    this.levelShown = this.store.level;
    this.page = 0;
    this.note = null;                    // { lines, then, ms, icon }
    this.dueTick = Infinity;
    this.dueBlink = Infinity;
    this.blinksLeft = 0;
    this.lastGameOver = null;            // { score, top } of the last game, for tests and the page
    this.listeners = [];
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
  };

  Phone.prototype.setMode = function (mode) {
    this.mode = mode;
    this.modeStart = this.time;
  };

  // ----- menu ----------------------------------------------------------------------------------------------------------

  Phone.prototype.mainItems = function () {
    var items = [Texts.NEW_GAME, Texts.LEVEL, Texts.MAZES, Texts.TOP_SCORE, Texts.INSTRUCTIONS];
    if (this.paused) items.unshift(Texts.CONTINUE);
    return items;
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
    return '8-1-' + (m.state.c + 1);
  };

  Phone.prototype.menuSelect = function () {
    var m = this.menu;
    var c = m.state.c;
    if (m.kind === 'mazes') {
      this.store.maze = c + 1;
      // a paused game does not survive a maze change: "Continue" is gone from the main menu, the numbers stay [VIDEO D]
      this.game = null;
      this.paused = false;
      this.showNote(Screens.noteLines(Texts.SELECTED, { u: Texts.MAZE_NAMES[c] }, Screens.ICON_TEXT_WIDTH),
        this.showMain.bind(this), { ms: TIMING.MAZE_NOTE_MS, icon: true });
      return;
    }
    var item = m.items[c];
    if (item === Texts.CONTINUE) this.resume();
    else if (item === Texts.NEW_GAME) this.startGame();
    else if (item === Texts.LEVEL) { this.levelShown = this.store.level; this.setMode('level'); }
    else if (item === Texts.MAZES) {
      // the list opens with the maze in use on the top line and under the cursor [VIDEO D]
      var cur = this.store.maze - 1;
      this.menu = { kind: 'mazes', items: Texts.MAZE_NAMES, state: { s: cur, c: cur } };
      Screens.fit(this.menu.state, Texts.MAZE_NAMES.length);
    } else if (item === Texts.TOP_SCORE) {
      this.showNote(Screens.noteLines(Texts.TOP_SCORE_NOTE, { n: this.store.top }), this.showMain.bind(this, 0));
    } else if (item === Texts.INSTRUCTIONS) { this.page = 0; this.setMode('instructions'); }
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
    this.setMode('game');
    this.blinksLeft = 0;
    this.dueBlink = Infinity;
    this.dueTick = this.time + this.game.delay;
  };

  Phone.prototype.resume = function () {
    this.paused = false;
    this.setMode('game');
    this.blinksLeft = 0;
    this.dueBlink = Infinity;
    this.dueTick = this.time + this.game.delay;      // [EST] the step time starts afresh
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
    this.lastGameOver = { score: score, top: isTop ? score : this.store.top, newTop: isTop };
    if (isTop) this.store.top = score;
    this.game = null;
    this.dueTick = Infinity;
    this.dueBlink = Infinity;
    if (isTop) this.setMode('fireworks');
    else this.showGameOverNote();
  };

  Phone.prototype.showGameOverNote = function () {
    var info = this.lastGameOver;
    var tpl = info.newTop ? Texts.GAME_OVER_TOP : Texts.GAME_OVER_SCORE;
    this.showNote(Screens.noteLines(tpl, { n: info.score }), this.showMain.bind(this, 0));
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
    if (key === 'select') this.page = (this.page + 1) % Screens.instructionPages().length;
    else if (key === 'c') this.showMain();
  };

  Phone.prototype.pressGame = function (key) {
    if (key === 'c') { this.pause(); return; }
    var msg = KEYPAD_MSG[key] || TURN_MSG[key];
    if (msg !== undefined) this.game.key(msg);
  };

  // ----- picture --------------------------------------------------------------------------------------------------------

  /** The picture of the display now (the same Framebuffer every time). */
  Phone.prototype.draw = function () {
    var fb = this.fb;
    var t = this.time - this.modeStart;
    switch (this.mode) {
      case 'splash': Screens.drawSplash(fb, t); break;
      case 'fireworks': Screens.drawFireworks(fb, t); break;
      case 'note': Screens.drawNote(fb, this.note.lines, this.note.icon ? { t: t } : null); break;
      case 'level': Screens.drawLevel(fb, this.levelShown); break;
      case 'instructions': Screens.drawInstructions(fb, this.page); break;
      case 'game': Scene.drawGame(fb, this.game); break;
      case 'menu':
        Screens.drawMenu(fb, {
          items: this.menu.items, s: this.menu.state.s, c: this.menu.state.c,
          header: this.header(), softKey: this.menu.kind === 'mazes' ? Texts.OK : Texts.SELECT
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
