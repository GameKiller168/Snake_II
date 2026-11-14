(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var Store = NS.Store || (req ? require('./store.js') : null);
  var Rng = NS.Rng || (req ? require('./rng.js') : null);
  var Control = NS.Control || (req ? require('./control.js') : null);
  var Text = NS.Text || (req ? require('./text.js') : null);
  var Screens = NS.Screens || (req ? require('./screens.js') : null);
  var INTRO_IN = 1200, INTRO_HOLD = 1400, INTRO_OUT = 1200;
  var INTRO_END = INTRO_IN + INTRO_HOLD + INTRO_OUT;
  var IDLE_LIMIT = 4096;           // steps without growing; a round that stands still this long is over

  function Runtime(parent) {
    this.parent = parent;
    this.elapsed = 0;
    this.child = null;
    this.controller = null;
    this.idle = 0;
    this.length = 0;
  }

  Runtime.prototype.nextRound = function () {
    var self = this, child = this.child;
    if (!child) {
      var Phone = NS.Phone || (req ? require('./phone.js') : null);
      var store = Store.create(null);
      store.language = this.parent.store.language;
      child = this.child = new Phone({ store: store, rng: Rng.fromClock(), skipSplash: true });
      child.onEvent = function (name) { self.parent.emit(name); };
      child.gameOver = function () {
        if (this.game.code !== 0x22) this.store.top = Math.max(this.store.top, this.game.score);
        Phone.prototype.gameOver.call(this);
      };
      child.showGameOverNote = function () {
        var info = this.lastGameOver;
        var score = function () {
          child.showNote(Screens.noteLines(child.t('GAME_OVER_SCORE'), { n: info.score }), function () { self.nextRound(); });
        };
        if (info.won) this.showNote(Screens.noteLines(this.t('YOU_WON'), {}), score);
        else score();
      };
      child.onTick = function () {
        if (this.game && this.game.crash !== 2) {
          var currentLength = this.game.snake.length;
          if (currentLength > self.length) { self.length = currentLength; self.idle = 0; }
          else self.idle++;
          if (self.idle >= IDLE_LIMIT) { this.gameOver(); return; }
          if (self.controller.step() < 0) { this.gameOver(); return; }
        }
        Phone.prototype.onTick.call(this);
      };
    }
    child.store.level = 9;
    child.store.maze = Control.MAZES[Math.floor(Math.random() * Control.MAZES.length)];
    child.store.top = 0;
    child.startGame();
    this.controller = Control.create(child.game);
    this.length = child.game.snake.length;
    this.idle = 0;
  };

  Runtime.prototype.advance = function (ms) {
    if (this.elapsed < INTRO_END) {
      var used = Math.min(ms, INTRO_END - this.elapsed);
      this.elapsed += used;
      ms -= used;
      if (this.elapsed === INTRO_END) this.nextRound();
    }
    if (this.child && ms > 0) this.child.advance(ms);
  };

  Runtime.prototype.draw = function (fb) {
    if (this.child) return this.child.draw();
    fb.clear();
    var y;
    if (this.elapsed < INTRO_IN) y = -18 + 33 * this.elapsed / INTRO_IN;
    else if (this.elapsed < INTRO_IN + INTRO_HOLD) y = 15;
    else y = 15 + 33 * (this.elapsed - INTRO_IN - INTRO_HOLD) / INTRO_OUT;
    y = Math.floor(y);
    var first = 'by', second = 'GameKiller168';
    Text.draw(fb, 'B', first, Math.floor((84 - Text.width('B', first)) / 2), y, false);
    Text.draw(fb, 'B', second, Math.floor((84 - Text.width('B', second)) / 2), y + 10, false);
    return fb;
  };

  NS.Runtime = Runtime;
  if (typeof module === 'object' && module.exports) module.exports = Runtime;
})();
