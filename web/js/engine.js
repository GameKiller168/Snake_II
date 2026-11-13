/*
 * Snake II - the game logic of the Nokia 3310 version, written by hand from the rules of the original program.
 *
 * The program of the phone talks to the operating system with "messages" and answers each one with a return
 * code plus a few fields of a shared record. This file keeps that shape on purpose, so that it can be tested
 * message by message against the real program (see tests/oracle.test.js):
 *
 *   new Game({level, maze, rng})   message "start"   : builds the field, the snake (7 cells) and the first apple
 *   game.tick()                    message 1         : one step of the snake;      returns the return code
 *   game.blink()                   message 0 (timer) : one blink of the dying snake
 *   game.key(msg)                  messages 4, 5, 10..18, 20, 22 : steering keys
 *
 * After every message these fields hold what the program left in the shared record:
 *   game.delay   ms until the next tick message           (record +0x0c)
 *   game.timer0  ms until the next timer message, 0 = off (record +0x0e)
 *   game.code    "event code" of the record               (record +0x14)
 *   game.score   the score                                (record +0x10)
 *
 * Return codes of tick(): 0x21 plain step, 0x1b the snake ate, 0x16 step after a near-crash,
 * 0x1f crash (second blocked step: dying), 0x18 game over.
 *
 * Directions are numbered like the program does: 0 left, 1 up, 2 right, 3 down.
 * Evidence: [FW] = read from the program of a real Nokia 3310 and verified against it message by message;
 * the pictures themselves come from tiles.js (measured from footage).
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var Config = NS.Config || (typeof require === 'function' ? require('./config.js') : null);

  var W = Config.COLS, H = Config.ROWS;
  var LEFT = Config.LEFT, UP = Config.UP, RIGHT = Config.RIGHT, DOWN = Config.DOWN;
  var DX = Config.DX, DY = Config.DY;

  var RET = {
    KEY_USED: 0x01,
    KEY_PASS: 0x05,
    RECOVER: 0x16,
    OVER: 0x18,
    ATE: 0x1b,
    CRASH: 0x1f,
    BLINK: 0x20,
    STEP: 0x21
  };

  function mod(a, n) {
    return ((a % n) + n) % n;
  }

  function Cell(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * options: level 1..9, maze 1..6 (1 = no maze), rng = object with next() (see rng.js)
   */
  function Game(options) {
    this.level = options.level || Config.DEFAULT_LEVEL;
    this.mazeIndex = options.maze || 1;
    this.rng = options.rng;
    this.events = [];          // 'vibra' for every call of the phone's vibration motor
    this.start();
  }

  Game.prototype.start = function () {
    var maze = Config.MAZES[this.mazeIndex];
    this.occ = new Uint8Array(W * H);    // walls and snake: cells the snake may not enter
    for (var i = 0; i < maze.walls.length; i++) {
      var s = maze.walls[i];
      var x, y;
      if (s[1] === s[3]) {
        for (x = s[0]; x <= s[2]; x++) this.occ[s[1] * W + x] = 1;
      } else if (s[0] === s[2] && s[1] < s[3]) {
        for (y = s[1]; y <= s[3]; y++) this.occ[y * W + s[0]] = 1;
      }
    }

    this.normalDelay = Config.STEP_MS[this.level - 1];
    this.delay = this.normalDelay;
    this.timer0 = 0;
    this.code = 0;
    this.score = 0;
    this.over = false;

    this.curdir = RIGHT;       // direction of the step being made
    this.prevdir = RIGHT;      // direction of the step before
    this.pending = RIGHT;      // direction wished by the last key
    this.grow = 0;             // the head is on the apple: the tail stays put in the next step
    this.fed = 0;              // a meal is on its way through the neck: the next neck tile gets a bulge
    this.crash = 0;            // 0 free, 1 blocked once (100 ms grace), 2 dying
    this.blinkCount = 0;
    this.snakeHidden = false;  // the dying snake is blinking

    // bonus creature
    this.cells = [new Cell(-1, -1), new Cell(-1, -1), new Cell(-1, -1), new Cell(-1, -1)];
    this.active = 0;           // a creature is on the field
    this.progress = 0;         // apples counted towards the next creature (x4); the countdown while it is out
    this.creature = { shown: false, x: -1, y: -1, type: -1 };   // the sprite on the field
    this.counter = 0;          // the number in the header, 0 = hidden
    this.iconType = -1;        // the creature picture in the header (the last one spawned)

    this.apple = new Cell(-1, -1);
    this.headOpen = false;

    // the snake: 7 cells, head to the right. The program keeps its cells in a ring of 299 slots and counts
    // slot numbers for head and tail (they matter for exactly one thing: see blink()).
    this.ringTail = maze.startX;
    this.ringHead = maze.startX;
    this.snake = [{ x: maze.startX, y: maze.startY, d: RIGHT, fed: false }];
    this.occ[maze.startY * W + maze.startX] = 1;
    for (var n = 0; n < 7; n++) this.advanceHead();
    this.advanceTail();
    this.pending = this.curdir;
    this.grow = 0;

    this.placeApple();
    this.creature.shown = false;
  };

  Game.prototype.snapshot = function () {
    function cell(c) { return { x: c.x, y: c.y }; }
    return {
      level: this.level, maze: this.mazeIndex, snake: this.snake.map(function (s) {
        return { x: s.x, y: s.y, d: s.d, fed: !!s.fed };
      }), ringHead: this.ringHead, ringTail: this.ringTail, curdir: this.curdir, prevdir: this.prevdir,
      pending: this.pending, grow: this.grow, fed: this.fed, crash: this.crash, blinkCount: this.blinkCount,
      snakeHidden: this.snakeHidden, delay: this.delay, normalDelay: this.normalDelay, timer0: this.timer0,
      code: this.code, score: this.score, over: this.over, cells: this.cells.map(cell), active: this.active,
      progress: this.progress, creature: { shown: this.creature.shown, x: this.creature.x, y: this.creature.y, type: this.creature.type },
      counter: this.counter, iconType: this.iconType, apple: cell(this.apple), headOpen: this.headOpen,
      rng: this.rng && typeof this.rng.getState === 'function' ? this.rng.getState() : null
    };
  };

  Game.restore = function (s, rng) {
    function integer(v, lo, hi) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= lo && v <= hi; }
    function coord(c, allowEmpty) {
      return !!c && integer(c.x, allowEmpty ? -1 : 0, W - 1) && integer(c.y, allowEmpty ? -1 : 0, H - 1) &&
        (allowEmpty || (c.x >= 0 && c.y >= 0)) && (c.x === -1) === (c.y === -1);
    }
    if (!s || !integer(s.level, 1, 9) || !integer(s.maze, 1, 6) || !Array.isArray(s.snake) || s.snake.length < 1 || s.snake.length > W * H ||
        !Array.isArray(s.cells) || s.cells.length !== 4 || !coord(s.apple, true) ||
        !integer(s.ringHead, 0, 298) || !integer(s.ringTail, 0, 298) || !integer(s.curdir, 0, 3) || !integer(s.prevdir, 0, 3) ||
        !integer(s.pending, 0, 3) || !integer(s.grow, 0, 1) || !integer(s.fed, 0, 1) || !integer(s.crash, 0, 2) ||
        !integer(s.blinkCount, 0, 10) || !integer(s.delay, 1, 60000) || !integer(s.normalDelay, 1, 60000) ||
        !integer(s.timer0, 0, 60000) || !integer(s.code, 0, 255) || !integer(s.score, 0, 0x7fffffff) ||
        typeof s.over !== 'boolean' || typeof s.snakeHidden !== 'boolean' || typeof s.headOpen !== 'boolean' ||
        !integer(s.active, 0, 1) || !integer(s.progress, 0, 255) || !integer(s.counter, 0, 255) || !integer(s.iconType, -1, 5) ||
        !s.creature || typeof s.creature.shown !== 'boolean' || !coord(s.creature, true) || !integer(s.creature.type, -1, 5) ||
        !integer(s.rng, 0, 0xfff0) || !rng || typeof rng.setState !== 'function') return null;
    for (var i = 0; i < s.cells.length; i++) if (!coord(s.cells[i], true)) return null;
    for (i = 0; i < s.snake.length; i++) {
      var q = s.snake[i];
      if (!coord(q, false) || !integer(q.d, 0, 3) || typeof q.fed !== 'boolean') return null;
    }
    if (s.normalDelay !== Config.STEP_MS[s.level - 1] || s.delay > 60000) return null;
    var g = Object.create(Game.prototype);
    g.level = s.level; g.mazeIndex = s.maze; g.rng = rng;
    if (!rng.setState(s.rng)) return null;
    g.events = []; g.occ = new Uint8Array(W * H);
    var walls = Config.MAZES[s.maze].walls;
    for (i = 0; i < walls.length; i++) {
      var w = walls[i], x, y;
      if (w[1] === w[3]) for (x = w[0]; x <= w[2]; x++) g.occ[w[1] * W + x] = 1;
      else if (w[0] === w[2] && w[1] < w[3]) for (y = w[1]; y <= w[3]; y++) g.occ[y * W + w[0]] = 1;
    }
    g.snake = s.snake.map(function (v) { return { x: v.x, y: v.y, d: v.d, fed: v.fed }; });
    for (i = 0; i < g.snake.length; i++) {
      var idx = g.snake[i].y * W + g.snake[i].x;
      if (g.occ[idx]) return null;
      g.occ[idx] = 1;
    }
    g.ringHead=s.ringHead; g.ringTail=s.ringTail; g.curdir=s.curdir; g.prevdir=s.prevdir; g.pending=s.pending;
    g.grow=s.grow; g.fed=s.fed; g.crash=s.crash; g.blinkCount=s.blinkCount; g.snakeHidden=s.snakeHidden;
    g.delay=s.delay; g.normalDelay=s.normalDelay; g.timer0=s.timer0; g.code=s.code; g.score=s.score; g.over=s.over;
    g.cells=s.cells.map(function (v) { return new Cell(v.x, v.y); }); g.active=s.active; g.progress=s.progress;
    g.creature={ shown:s.creature.shown, x:s.creature.x, y:s.creature.y, type:s.creature.type };
    g.counter=s.counter; g.iconType=s.iconType; g.apple=new Cell(s.apple.x,s.apple.y); g.headOpen=s.headOpen;
    return g;
  };

  // ------------------------------------------------------------------------------------------------------
  // the snake
  // ------------------------------------------------------------------------------------------------------

  var RING = 299;

  Game.prototype.advanceTail = function () {
    var old = this.snake.shift();
    this.occ[old.y * W + old.x] = 0;
    this.ringTail = (this.ringTail + 1) % RING;
  };

  Game.prototype.advanceHead = function () {
    var d = this.curdir;
    var head = this.snake[this.snake.length - 1];
    var x = mod(head.x + DX[d], W), y = mod(head.y + DY[d], H);
    this.occ[y * W + x] = 1;
    head.fed = !!this.fed;              // the old head becomes the neck; it carries the bulge of a meal
    this.snake.push({ x: x, y: y, d: d, fed: false });
    this.ringHead = (this.ringHead + 1) % RING;

    // the head bites a creature: the sprite vanishes at once, the cells on the far side are cleared
    var hit = false;
    for (var i = 0; i < 4; i++) {
      if (this.cells[i].x === x && this.cells[i].y === y) hit = true;
    }
    if (hit) {
      this.creature.shown = false;
      var a, b;
      if (d === LEFT) { a = 0; b = 2; } else if (d === UP) { a = 0; b = 1; } else if (d === RIGHT) { a = 3; b = 1; } else { a = 3; b = 2; }
      this.cells[a] = new Cell(-1, -1);
      this.cells[b] = new Cell(-1, -1);
    }

    // mouth open when food is in the next cell (looked at BEFORE this step's food is handled)
    this.headOpen = this.foodAhead();
    this.prevdir = d;
    this.fed = 0;
  };

  Game.prototype.foodAhead = function () {
    var head = this.snake[this.snake.length - 1];
    var nx = mod(head.x + DX[this.curdir], W), ny = mod(head.y + DY[this.curdir], H);
    if (nx === this.apple.x && ny === this.apple.y) return true;
    for (var i = 0; i < 4; i++) {
      if (nx === this.cells[i].x && ny === this.cells[i].y) return true;
    }
    return false;
  };

  Game.prototype.isBlocked = function () {
    var head = this.snake[this.snake.length - 1];
    var nx = mod(head.x + DX[this.curdir], W), ny = mod(head.y + DY[this.curdir], H);
    var tail = this.snake[0];
    if (nx === tail.x && ny === tail.y) return this.grow;   // the tail moves away - unless the snake is growing
    return this.occ[ny * W + nx];
  };

  // ------------------------------------------------------------------------------------------------------
  // apple and bonus creature
  // ------------------------------------------------------------------------------------------------------

  Game.prototype.placeApple = function () {
    var c = this.cells;
    for (var t = 0; t < 100; t++) {
      var x = this.rng.next() % W;
      var y = this.rng.next() % H;
      if (this.occ[y * W + x]) continue;
      if (x === c[0].x || x === c[1].x || x === c[2].x || x === c[3].x) continue;
      if (y === c[0].y || y === c[1].y || y === c[2].y || y === c[3].y) continue;
      this.apple = new Cell(x, y);
      return;
    }
    // no luck in 100 tries: the first free cell, reading order
    for (var yy = 0; yy < H; yy++) {
      for (var xx = 0; xx < W; xx++) {
        if (!this.occ[yy * W + xx]) {
          this.apple = new Cell(xx, yy);
          return;
        }
      }
    }
    this.apple = new Cell(-1, -1);       // the field is full
  };

  /** Try to put a bonus creature on the field. Returns true if it is out. */
  Game.prototype.spawnCreature = function () {
    var c = this.cells, i;
    for (i = 0; i < 4; i++) c[i] = new Cell(-1, -1);
    this.rng.next();                     // the program rolls a 1-in-50 die for a special item first (item off here)
    var ok = false;
    for (var t = 0; t < 100; t++) {
      var x = this.rng.next() % (W - 1);
      var y = this.rng.next() % H;
      c[0] = new Cell(x, y);
      c[1] = new Cell(x + 1, y);
      c[2] = new Cell(x, y);
      c[3] = new Cell(x + 1, y);
      if (this.occ[y * W + x] || this.occ[y * W + x + 1]) continue;
      if (x === this.apple.x || y === this.apple.y || x + 1 === this.apple.x) continue;
      ok = true;
      break;
    }
    var type = this.rng.next() % 6;
    this.creature.type = type;
    this.iconType = type;
    if (!ok) {
      this.creature.shown = false;
      return false;
    }
    this.creature.shown = true;
    this.creature.x = c[0].x;
    this.creature.y = c[0].y;
    return true;
  };

  Game.prototype.hideCreature = function () {
    this.creature.shown = false;
  };

  Game.prototype.clearCells = function () {
    for (var i = 0; i < 4; i++) this.cells[i] = new Cell(-1, -1);
  };

  Game.prototype.setCounter = function (v) {
    this.counter = v > 0 ? v : 0;
  };

  // ------------------------------------------------------------------------------------------------------
  // messages
  // ------------------------------------------------------------------------------------------------------

  /** One step. Returns the return code of the program. */
  Game.prototype.tick = function () {
    if (this.crash === 2) {              // the dying time is over
      this.events.push('vibra');
      this.code = 0;
      this.over = true;
      return RET.OVER;
    }

    this.curdir = this.pending;

    if (this.isBlocked()) {
      if (this.crash === 0) {            // first time: wait 100 ms, the player may still turn
        this.crash = 1;
        this.delay = Config.CRASH_GRACE_MS;
        return RET.RECOVER;
      }
      this.events.push('vibra');
      this.events.push('crash');
      this.crash = 2;
      this.delay = Config.CRASH_END_MS;
      this.code = 0x20;
      return RET.CRASH;
    }

    var recovered = 0;
    if (this.crash !== 0) {
      this.crash = 0;
      this.delay = this.normalDelay;
      recovered = 1;
    }

    if (this.grow === 0) this.advanceTail();
    this.advanceHead();

    var head = this.snake[this.snake.length - 1];
    var c = this.cells;
    var eaten = 0;
    if (this.active) {
      if ((head.x === c[0].x && head.y === c[0].y) || (head.x === c[1].x && head.y === c[1].y) ||
          (head.x === c[2].x && head.y === c[2].y) || (head.x === c[3].x && head.y === c[3].y)) {
        eaten = 1;
      } else if (this.progress !== 0 && c[0].x >= 0 && c[0].y >= 0) {
        this.progress--;
        if (this.progress === 0) {       // the creature ran away
          this.clearCells();
          this.hideCreature();
          this.active = 0;
        }
        this.setCounter(this.progress);
      }
    }

    this.grow = head.x === this.apple.x && head.y === this.apple.y ? 1 : 0;

    if (!this.grow && !eaten) return recovered ? RET.RECOVER : RET.STEP;

    this.events.push('vibra');
    if (!eaten) {                        // the apple
      this.score += this.level;
      this.placeApple();
      if (this.apple.x < 0 || this.apple.y < 0) {
        this.score += 100;
        this.code = 0x22;
        this.events.push('won');
        this.over = true;
        this.fed = 1;
        this.crash = 0;
        return RET.OVER;
      }
      if (!this.active) this.progress = (this.progress + 4) & 0xff;
      if (this.progress >= Config.BONUS_STEPS && c[0].x < 0 && c[0].y < 0) {
        if (this.spawnCreature()) this.active = 1;
        else this.progress = 0;
        this.setCounter(this.progress);
      }
    } else {                             // the bonus creature
      this.score += 5 * this.level + 2 * this.progress + 5;
      this.clearCells();
      this.hideCreature();
      this.progress = 0;
      this.active = 0;
      this.setCounter(0);
    }
    this.fed = 1;
    this.code = 0x1f;
    this.events.push('eat');
    this.crash = 0;
    return recovered ? RET.RECOVER : RET.ATE;
  };

  /** The timer message: one blink of the dying snake (the OS sends it every 250 ms after a crash). */
  Game.prototype.blink = function () {
    if (this.blinkCount > 10) return RET.BLINK;
    // The program walks the slots from tail to head with a plain counting loop. While the snake sits across
    // the end of the ring (head slot number < tail slot number) the loop does not run: that snake does not blink.
    if (this.ringTail <= this.ringHead) this.snakeHidden = !this.snakeHidden;
    this.blinkCount++;
    this.timer0 = Config.BLINK_MS;
    if (this.blinkCount === 10) {
      this.timer0 = 0;
      this.delay = this.normalDelay;
      this.blinkCount = 0;
      return RET.RECOVER;
    }
    return RET.BLINK;
  };

  /**
   * Steering keys. msg 10..18 = keypad 1..9, msg 4 / 20 = turn clockwise, msg 5 / 22 = turn counter-clockwise.
   * 2, 4, 6, 8 set an absolute direction (never straight back); 1, 3, 7, 9 are diagonals that turn the snake
   * by 90 degrees towards the named corner, depending on whether it moves horizontally or vertically.
   * All of them look at the direction of the step being made, not at the wished one.
   */
  Game.prototype.key = function (msg) {
    var cur = this.curdir;
    var vertical = cur === UP || cur === DOWN;
    switch (msg) {
      case 13: if (cur !== RIGHT) this.pending = LEFT; break;                   // 4
      case 11: if (cur !== DOWN) this.pending = UP; break;                      // 2
      case 15: if (cur !== LEFT) this.pending = RIGHT; break;                   // 6
      case 17: if (cur !== UP) this.pending = DOWN; break;                      // 8
      case 10: this.pending = vertical ? LEFT : UP; break;                      // 1
      case 12: this.pending = vertical ? RIGHT : UP; break;                     // 3
      case 16: this.pending = vertical ? LEFT : DOWN; break;                    // 7
      case 18: this.pending = vertical ? RIGHT : DOWN; break;                   // 9
      case 4: case 20: this.pending = (cur + 1) % 4; break;                     // clockwise
      case 5: case 22: this.pending = (cur + 3) % 4; break;                     // counter-clockwise
      case 14: break;                                                           // 5: nothing
      default: return RET.KEY_PASS;
    }
    return RET.KEY_USED;
  };

  var Engine = {
    Game: Game,
    RET: RET,
    W: W,
    H: H
  };

  NS.Engine = Engine;
  if (typeof module === 'object' && module.exports) module.exports = Engine;
})();
