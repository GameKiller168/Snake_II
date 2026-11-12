/*
 * Snake II rules - no DOM, no timers, no drawing. The caller decides when a step happens.
 *
 * The model is the one of the 2021 Java version (Screen.tick), made complete:
 *   - the snake is a list of lattice cells, tail first; every cell remembers the direction it was entered
 *     with (the original orArray) because that decides how it is drawn
 *   - every step adds a new head; the tail is dropped when the snake is longer than `size`
 *   - eating an apple raises `size` by one, so the snake grows on the next step (Screen: size++)
 *   - the game starts with the "unroll": one cell, nine fast forced steps to the right (Screen: t = 5000)
 * What the original did not have is added: wrap-around at the border, self collision, the speed levels, a
 * score that depends on the level and the bonus bug that shows up after every fifth apple.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var config = NS.config || (typeof require === 'function' ? require('./config.js') : null);

  var COLS = config.FIELD_COLS;
  var ROWS = config.FIELD_ROWS;

  function mod(a, n) {
    return ((a % n) + n) % n;
  }

  /**
   * @param {object} [opts]
   * @param {function} [opts.rng] returns a number in [0, 1); defaults to Math.random
   * @param {number} [opts.level] 1..9
   */
  function Game(opts) {
    opts = opts || {};
    this.rng = opts.rng || Math.random;
    this.reset(opts.level != null ? opts.level : config.DEFAULT_LEVEL);
  }

  Game.prototype.reset = function (level) {
    if (level != null) this.level = Math.max(1, Math.min(config.STEP_MS.length, level | 0));
    this.score = 0;
    this.eaten = 0;
    this.size = config.START_SIZE;
    this.segs = [{ x: config.START_CX, y: config.START_CY, d: config.RIGHT }];
    this.dir = config.RIGHT;
    this.queue = [];
    this.apple = null;
    this.bonus = null;
    this.sinceBonus = 0;
    this.phase = 'intro'; // intro -> play -> dead | cleared
    this.introLeft = config.START_SIZE;
    this.steps = 0;
    this.events = [];
    this.grid = new Uint8Array(COLS * ROWS);
    this.grid[this._idx(config.START_CX, config.START_CY)] = 1;

    // the unroll will occupy the START_SIZE cells to the right of the start - keep the first apple off them
    var reserved = {};
    for (var i = 1; i <= config.START_SIZE; i++) {
      reserved[mod(config.START_CX + i, COLS) + ',' + config.START_CY] = true;
    }
    this._spawnApple(reserved);
  };

  Game.prototype._idx = function (x, y) {
    return y * COLS + x;
  };

  /** Milliseconds between two steps at the current level (the unroll is much faster). */
  Game.prototype.stepMs = function () {
    return this.phase === 'intro' ? config.INTRO_STEP_MS : config.STEP_MS[this.level - 1];
  };

  Game.prototype.head = function () {
    return this.segs[this.segs.length - 1];
  };

  Game.prototype.isOver = function () {
    return this.phase === 'dead' || this.phase === 'cleared';
  };

  /**
   * Queue a direction change. Returns false when it is ignored: the same direction, the opposite one
   * (a snake cannot reverse onto itself), a full queue, or a finished game.
   */
  Game.prototype.turn = function (d) {
    if (this.isOver()) return false;
    var ref = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (d === ref || d === config.OPPOSITE[ref]) return false;
    if (this.queue.length >= 3) return false;
    this.queue.push(d);
    return true;
  };

  /** Events since the last call: 'eat', 'bonus', 'bonusSpawn', 'bonusExpire', 'die', 'cleared'. */
  Game.prototype.drainEvents = function () {
    var e = this.events;
    this.events = [];
    return e;
  };

  /** True if the cell holds a bonus cell (the bug is two cells wide). */
  Game.prototype._onBonus = function (x, y) {
    var b = this.bonus;
    return !!b && y === b.y && (x === b.x || x === b.x + 1);
  };

  /** Advance one cell. Returns the phase afterwards. */
  Game.prototype.step = function () {
    if (this.isOver()) return this.phase;

    var intro = this.phase === 'intro';
    if (!intro && this.queue.length) this.dir = this.queue.shift();
    var d = intro ? config.RIGHT : this.dir;

    var head = this.head();
    var nx = mod(head.x + config.DX[d], COLS);
    var ny = mod(head.y + config.DY[d], ROWS);

    // the snake keeps its tail while it is still shorter than `size` (growing after an apple, the unroll)
    var dropsTail = this.segs.length + 1 > this.size;

    if (!intro) {
      var occupied = this.grid[this._idx(nx, ny)];
      if (dropsTail) {
        var tail = this.segs[0];
        if (tail.x === nx && tail.y === ny) occupied--; // the tail leaves this very step
      }
      if (occupied > 0) {
        this.phase = 'dead';
        this.events.push('die');
        return this.phase;
      }
    }

    this.segs.push({ x: nx, y: ny, d: d });
    this.grid[this._idx(nx, ny)]++;
    if (dropsTail) {
      var t = this.segs.shift();
      this.grid[this._idx(t.x, t.y)]--;
    }
    this.steps++;

    var bonusBefore = this.bonus; // a bug that spawns during this very step starts with its full time
    if (this.apple && this.apple.x === nx && this.apple.y === ny) {
      this._eatApple();
    } else if (this._onBonus(nx, ny)) {
      this._eatBonus();
    }
    if (bonusBefore && this.bonus === bonusBefore) {
      bonusBefore.ticks--;
      if (bonusBefore.ticks <= 0) {
        this.bonus = null;
        this.events.push('bonusExpire');
      }
    }

    if (intro && --this.introLeft <= 0 && this.phase === 'intro') this.phase = 'play';
    return this.phase;
  };

  Game.prototype._addScore = function (points) {
    this.score = Math.min(config.MAX_SCORE, this.score + points);
  };

  Game.prototype._eatApple = function () {
    this.size++;
    this.eaten++;
    this._addScore(config.POINTS_PER_APPLE * this.level);
    this.events.push('eat');
    this.apple = null;
    if (!this._spawnApple()) {
      this.phase = 'cleared';
      this.events.push('cleared');
      return;
    }
    this.sinceBonus++;
    if (this.sinceBonus >= config.BONUS_EVERY) {
      this.sinceBonus = 0;
      if (!this.bonus) this._spawnBonus();
    }
  };

  /** Points of the bonus bug if it is eaten now: the more time is left, the more it is worth. */
  Game.prototype.bonusValue = function () {
    if (!this.bonus) return 0;
    return this.level * (config.BONUS_BASE + Math.floor(this.bonus.ticks / 4));
  };

  Game.prototype._eatBonus = function () {
    this._addScore(this.bonusValue());
    this.bonus = null;
    this.events.push('bonus');
  };

  Game.prototype._freeCell = function (x, y, reserved) {
    if (this.grid[this._idx(x, y)] > 0) return false;
    if (reserved && reserved[x + ',' + y]) return false;
    return true;
  };

  /** Puts a new apple on a random free cell of the apple lattice. Returns false if the board is full. */
  Game.prototype._spawnApple = function (reserved) {
    var free = [];
    for (var y = 0; y < config.APPLE_ROWS; y++) {
      for (var x = 0; x < config.APPLE_COLS; x++) {
        if (!this._freeCell(x, y, reserved)) continue;
        if (this._onBonus(x, y)) continue;
        free.push(y * config.APPLE_COLS + x);
      }
    }
    if (!free.length) return false;
    var pick = free[Math.floor(this.rng() * free.length) % free.length];
    this.apple = { x: pick % config.APPLE_COLS, y: Math.floor(pick / config.APPLE_COLS) };
    return true;
  };

  /** Puts the bonus bug (two cells wide) on a random free spot. */
  Game.prototype._spawnBonus = function () {
    var free = [];
    for (var y = 0; y < config.APPLE_ROWS; y++) {
      for (var x = 0; x < config.APPLE_COLS - 1; x++) {
        if (!this._freeCell(x, y) || !this._freeCell(x + 1, y)) continue;
        if (this.apple && this.apple.y === y && (this.apple.x === x || this.apple.x === x + 1)) continue;
        free.push(y * config.APPLE_COLS + x);
      }
    }
    if (!free.length) return false;
    var pick = free[Math.floor(this.rng() * free.length) % free.length];
    this.bonus = { x: pick % config.APPLE_COLS, y: Math.floor(pick / config.APPLE_COLS), ticks: config.BONUS_TICKS };
    this.events.push('bonusSpawn');
    return true;
  };

  /**
   * Replace the whole situation (tests, scenarios, the title demo). `segs` must be a connected path with
   * the entering direction of every cell. Missing fields keep sensible defaults.
   */
  Game.prototype.load = function (s) {
    this.segs = s.segs.map(function (c) {
      return { x: c.x, y: c.y, d: c.d };
    });
    this.size = s.size != null ? s.size : this.segs.length;
    this.dir = s.dir != null ? s.dir : this.segs[this.segs.length - 1].d;
    this.queue = [];
    this.phase = s.phase || 'play';
    this.introLeft = 0;
    this.apple = s.apple ? { x: s.apple.x, y: s.apple.y } : null;
    this.bonus = s.bonus ? { x: s.bonus.x, y: s.bonus.y, ticks: s.bonus.ticks } : null;
    if (s.score != null) this.score = s.score;
    if (s.sinceBonus != null) this.sinceBonus = s.sinceBonus;
    this.grid = new Uint8Array(COLS * ROWS);
    for (var i = 0; i < this.segs.length; i++) this.grid[this._idx(this.segs[i].x, this.segs[i].y)]++;
    this.events = [];
  };

  NS.Game = Game;
  if (typeof module === 'object' && module.exports) module.exports = Game;
})();
