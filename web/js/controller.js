/*
 * Controller: the state machine around the game rules. No DOM - it is driven by update(dtMs) and
 * press(action), and it hands out a "view" for the Scene and a list of sound names for the audio.
 *
 *   title  --start-->  play  <--pause/resume-->  paused
 *   play   --crash-->  dying (the snake flashes)  -->  over  --start-->  play
 *                                                          \--esc-->  title
 *
 * Actions: 'up' 'down' 'left' 'right' 'start' 'space' 'pause' 'quit' 'tap' 'autopause' and
 * ('level', n). Keyboard, touch and the on-screen buttons all end up here.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var config = NS.config || (req ? require('./config.js') : null);
  var Game = NS.Game || (req ? require('./game.js') : null);
  var Store = NS.Store || (req ? require('./store.js') : null);

  var MAX_DT = 250; // a long frame (tab in the background, debugger) must not fast-forward the game
  var MAX_STEPS_PER_UPDATE = 6;
  var MAX_LEVEL = config.STEP_MS.length;

  var DIRECTION = { right: config.RIGHT, left: config.LEFT, up: config.UP, down: config.DOWN };

  /**
   * @param {object} [opts]
   * @param {function} [opts.rng]      random numbers for the apples
   * @param {object}   [opts.store]    see store.js (defaults to localStorage with an in-memory fallback)
   * @param {boolean}  [opts.corner]   close up the turns of the snake (default true)
   */
  function Controller(opts) {
    opts = opts || {};
    this.rng = opts.rng || Math.random;
    this.store = opts.store || Store.create();
    this.corner = opts.corner !== false;

    this.level = this.store.getLevel();
    this.mode = 'title';
    this.clock = 0;
    this.acc = 0;
    this.game = null;
    this.dyingLeft = 0;
    this.overAge = 0;
    this.newBest = false;
    this.cleared = false;
    this.sounds = [];
    this.bests = {};
    this.best = this._bestOf(this.level);
  }

  Controller.prototype._bestOf = function (level) {
    if (this.bests[level] === undefined) this.bests[level] = this.store.getBest(level);
    return this.bests[level];
  };

  Controller.prototype._sound = function (name) {
    this.sounds.push(name);
  };

  Controller.prototype.drainSounds = function () {
    var s = this.sounds;
    this.sounds = [];
    return s;
  };

  Controller.prototype.setLevel = function (level) {
    level = Math.max(1, Math.min(MAX_LEVEL, level | 0));
    if (level === this.level) return false;
    this.level = level;
    this.best = this._bestOf(level);
    this.store.setLevel(level);
    this._sound('menu');
    return true;
  };

  Controller.prototype.setCorner = function (on) {
    this.corner = !!on;
  };

  // ---------------------------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------------------------

  Controller.prototype.press = function (action, arg) {
    switch (this.mode) {
      case 'title':
        return this._pressTitle(action, arg);
      case 'play':
        return this._pressPlay(action);
      case 'paused':
        return this._pressPaused(action);
      case 'over':
        return this._pressOver(action);
      default:
        return false; // dying: nothing to decide
    }
  };

  Controller.prototype._pressTitle = function (action, arg) {
    switch (action) {
      case 'left':
        return this.setLevel(this.level - 1);
      case 'right':
        return this.setLevel(this.level + 1);
      case 'level':
        return this.setLevel(arg);
      case 'start':
      case 'space':
      case 'tap':
        this.startGame();
        return true;
    }
    return false;
  };

  Controller.prototype._pressPlay = function (action) {
    if (DIRECTION[action] !== undefined) return this.game.turn(DIRECTION[action]);
    if (action === 'pause' || action === 'space' || action === 'autopause') {
      this._pause(action !== 'autopause');
      return true;
    }
    return false;
  };

  Controller.prototype._pressPaused = function (action) {
    switch (action) {
      case 'pause':
      case 'space':
      case 'start':
      case 'tap':
        this.mode = 'play';
        this.acc = 0; // no catching up after the break
        this._sound('pause');
        return true;
      case 'quit':
        this.toTitle();
        return true;
    }
    return false;
  };

  Controller.prototype._pressOver = function (action) {
    switch (action) {
      case 'pause': // Esc
      case 'quit':
        this.toTitle();
        return true;
      case 'start':
      case 'space':
      case 'tap':
        if (this.overAge < config.OVER_LOCK_MS) return false; // do not restart by mistake
        this.startGame();
        return true;
    }
    return false;
  };

  Controller.prototype._pause = function (withSound) {
    this.mode = 'paused';
    if (withSound) this._sound('pause');
  };

  // ---------------------------------------------------------------------------------------------
  // Flow
  // ---------------------------------------------------------------------------------------------

  Controller.prototype.startGame = function () {
    this.game = new Game({ rng: this.rng, level: this.level });
    this.mode = 'play';
    this.acc = 0;
    this.newBest = false;
    this.cleared = false;
    this.best = this._bestOf(this.level);
    this._sound('start');
  };

  Controller.prototype.toTitle = function () {
    this.mode = 'title';
    this.game = null;
    this.best = this._bestOf(this.level);
    this.acc = 0;
  };

  Controller.prototype._collectEvents = function () {
    var ev = this.game.drainEvents();
    for (var i = 0; i < ev.length; i++) {
      switch (ev[i]) {
        case 'eat':
          this._sound('eat');
          break;
        case 'bonus':
          this._sound('bonus');
          break;
        case 'bonusSpawn':
          this._sound('bonusSpawn');
          break;
        case 'die':
          this._sound('die');
          break;
        case 'cleared':
          this._sound('win');
          break;
      }
    }
  };

  Controller.prototype._gameEnded = function () {
    var g = this.game;
    var level = this.level;
    var best = this._bestOf(level);
    this.cleared = g.phase === 'cleared';
    this.newBest = g.score > best;
    if (this.newBest) {
      this.bests[level] = g.score;
      this.store.setBest(level, g.score);
    }
    this.best = this.bests[level];
    this.mode = 'dying';
    this.dyingLeft = config.DYING_MS;
    this.acc = 0;
  };

  /** Advance the clock by dtMs milliseconds. */
  Controller.prototype.update = function (dtMs) {
    if (!(dtMs > 0)) return;
    if (dtMs > MAX_DT) dtMs = MAX_DT;
    this.clock += dtMs;

    if (this.mode === 'play') {
      this._advance(dtMs);
    } else if (this.mode === 'dying') {
      this.dyingLeft -= dtMs;
      if (this.dyingLeft <= 0) {
        this.mode = 'over';
        this.overAge = 0;
      }
    } else if (this.mode === 'over') {
      this.overAge += dtMs;
    }
  };

  Controller.prototype._advance = function (dtMs) {
    this.acc += dtMs;
    var guard = 0;
    for (;;) {
      var ms = this.game.stepMs();
      if (this.acc < ms) break;
      if (++guard > MAX_STEPS_PER_UPDATE) {
        this.acc = 0;
        break;
      }
      this.acc -= ms;
      this.game.step();
      this._collectEvents();
      if (this.game.isOver()) {
        this._gameEnded();
        break;
      }
    }
  };

  // ---------------------------------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------------------------------

  /** Everything the Scene needs to draw the current frame. */
  Controller.prototype.view = function () {
    return {
      mode: this.mode,
      time: this.clock,
      corner: this.corner,
      level: this.level,
      best: this.best,
      newBest: this.newBest,
      cleared: this.cleared,
      game: this.game
    };
  };

  /** Which hint belongs to the current state (the page translates it). */
  Controller.prototype.hintKey = function () {
    return this.mode === 'dying' ? 'play' : this.mode;
  };

  NS.Controller = Controller;
  if (typeof module === 'object' && module.exports) module.exports = Controller;
})();
