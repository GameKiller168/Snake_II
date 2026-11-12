/*
 * Scene: turns the state of the game (a "view") into the 84 x 48 bit matrix of the LCD.
 *
 * Pure drawing, no DOM and no timers, so it runs in Node and can be tested bit by bit. The view
 *   {
 *     mode:    'title' | 'play' | 'paused' | 'dying' | 'over'
 *     time:    a clock in ms (blinking, animation)
 *     corner:  close up the turns of the snake (Sprites cornerFill)
 *     level, best, newBest, cleared
 *     game:    a Game (score, segs, apple, bonus)      - not needed on the title screen
 *   }
 * is assembled by the controller.
 *
 * Draw order on the playfield: the snake first (the corner repair may erase pixels of the snake itself),
 * then everything else is OR-ed on top, so the frame, the score and the apple are never punched.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var req = typeof require === 'function';
  var config = NS.config || (req ? require('./config.js') : null);
  var Font = NS.Font || (req ? require('./font.js') : null);
  var Sprites = NS.Sprites || (req ? require('./sprites.js') : null);

  var W = config.LCD_W;
  var BLINK_MS = 500; // "PRESS START", "NEW BEST!"
  var DEATH_BLINK_MS = 140; // the snake flashes after a crash
  var BUG_FLIP_MS = 220; // legs of the bonus bug
  var DEMO_STEP_MS = 95; // speed of the snake on the title screen
  var DEMO_ROW = 3;
  var SMALL = 'font3x5';
  var BIG = 'font5x7';

  // Texts on the LCD. Capitals only: that is what the bitmap fonts have.
  var TEXTS = {
    title: 'SNAKE II',
    level: 'LEVEL',
    best: 'BEST',
    score: 'SCORE',
    start: 'PRESS START',
    paused: 'PAUSED',
    over: 'GAME OVER',
    cleared: 'CLEARED!',
    newBest: 'NEW BEST!'
  };

  function textsOf(view) {
    return view.texts || TEXTS;
  }

  // The bonus bug is two cells wide (8 pixels). Two frames, the legs move.
  var BUG = [
    ['X..XX..X', '.XXXXXX.', '..XXXX..', '.XXXXXX.', 'X..XX..X'],
    ['.X.XX.X.', 'X.XXXX.X', '..XXXX..', 'X.XXXX.X', '.X.XX.X.']
  ];

  function blinkOn(time, period) {
    return Math.floor(time / period) % 2 === 0;
  }

  function centerText(fb, text, y, font) {
    return Font.drawCentered(fb, text, y, font);
  }

  // ---------------------------------------------------------------------------------------------
  // Playfield parts
  // ---------------------------------------------------------------------------------------------

  function drawBug(fb, bonus, time) {
    var frame = BUG[Math.floor(time / BUG_FLIP_MS) % 2];
    var left = Sprites.anchorX(bonus.x) - 2;
    var top = Sprites.anchorY(bonus.y) - 2;
    for (var r = 0; r < frame.length; r++) {
      for (var c = 0; c < frame[r].length; c++) {
        if (frame[r].charAt(c) === 'X') fb.set(left + c, top + r, 1);
      }
    }
  }

  /** Time left of the bonus bug: a gauge in the header, 1 pixel per remaining step. */
  function drawBonusBar(fb, ticks, time) {
    var x = config.BONUS_BAR_X, y = config.BONUS_BAR_Y, w = config.BONUS_BAR_W, h = config.BONUS_BAR_H;
    var low = ticks <= config.BONUS_TICKS / 4;
    // outline of the full gauge
    fb.hline(x - 1, y - 1, w + 2);
    fb.hline(x - 1, y + h, w + 2);
    fb.vline(x - 1, y, h);
    fb.vline(x + w, y, h);
    if (low && !blinkOn(time, 200)) return; // the last quarter flashes
    var fill = Math.max(1, Math.round((ticks * w) / config.BONUS_TICKS));
    fb.fillRect(x, y, fill, h);
  }

  function drawField(fb, view) {
    var g = view.game;
    var showSnake = view.mode !== 'dying' || blinkOn(view.time, DEATH_BLINK_MS);
    if (showSnake) Sprites.drawSnake(fb, g.segs, { wrap: true, cornerFill: !!view.corner });
    if (g.apple) Sprites.drawApple(fb, g.apple.x, g.apple.y);
    if (g.bonus) {
      drawBug(fb, g.bonus, view.time);
      drawBonusBar(fb, g.bonus.ticks, view.time);
    }
    Sprites.drawScore(fb, g.score);
    Sprites.drawFrame(fb);
  }

  // ---------------------------------------------------------------------------------------------
  // Boxes (pause, game over)
  // ---------------------------------------------------------------------------------------------

  /** A framed, cleared rectangle centred on the playfield; returns its bounds. */
  function drawBox(fb, w, h) {
    var x = Math.round((W - w) / 2);
    var y = Math.round((config.FIELD_TOP + 1 + config.LCD_H - 1 - h) / 2);
    fb.clearRect(x, y, w, h);
    fb.hline(x, y, w);
    fb.hline(x, y + h - 1, w);
    fb.vline(x, y, h);
    fb.vline(x + w - 1, y, h);
    // a one pixel "shadow" gives the box some depth, like the dialogs of the old phones
    fb.hline(x + 2, y + h, w);
    fb.vline(x + w, y + 2, h - 1);
    return { x: x, y: y, w: w, h: h };
  }

  function drawPaused(fb, view) {
    var T = textsOf(view);
    var w = Font.measure(T.paused, BIG) + 10;
    var box = drawBox(fb, w, 17);
    Font.drawCentered(fb, T.paused, box.y + 5, BIG);
  }

  function drawOver(fb, view) {
    var T = textsOf(view);
    var title = view.cleared ? T.cleared : T.over;
    var score = T.score + ' ' + pad4(view.game.score);
    var line3 = view.newBest ? T.newBest : T.best + ' ' + pad4(view.best);
    var w = Math.max(Font.measure(title, BIG), Font.measure(score, SMALL), Font.measure(line3, SMALL)) + 10;
    var box = drawBox(fb, w, 34);
    Font.drawCentered(fb, title, box.y + 5, BIG);
    Font.drawCentered(fb, score, box.y + 16, SMALL);
    if (!view.newBest || blinkOn(view.time, BLINK_MS)) Font.drawCentered(fb, line3, box.y + 24, SMALL);
  }

  function pad4(n) {
    var s = String(Math.max(0, Math.min(config.MAX_SCORE, n | 0)));
    while (s.length < 4) s = '0' + s;
    return s;
  }

  // ---------------------------------------------------------------------------------------------
  // Title screen
  // ---------------------------------------------------------------------------------------------

  /** A snake crawling along one row, wrapping around the edge: the "attract mode". */
  function demoSegs(time) {
    var head = Math.floor(time / DEMO_STEP_MS) % config.FIELD_COLS;
    var segs = [];
    for (var k = config.START_SIZE - 1; k >= 0; k--) {
      segs.push({ x: Sprites.mod(head - k, config.FIELD_COLS), y: DEMO_ROW, d: config.RIGHT });
    }
    return segs;
  }

  function drawTitle(fb, view) {
    var T = textsOf(view);
    Sprites.drawSnake(fb, demoSegs(view.time), { wrap: true, cornerFill: !!view.corner });

    centerText(fb, T.title, 11, BIG);

    var lv = T.level + ' ' + view.level;
    var y = 28;
    var x = centerText(fb, lv, y, SMALL);
    var w = Font.measure(lv, SMALL);
    if (view.level > 1) Font.drawText(fb, '<', x - 6, y, SMALL);
    if (view.level < config.STEP_MS.length) Font.drawText(fb, '>', x + w + 3, y, SMALL);

    centerText(fb, T.best + ' ' + pad4(view.best), 35, SMALL);

    if (blinkOn(view.time, BLINK_MS)) centerText(fb, T.start, 41, SMALL);

    Sprites.drawFrame(fb);
  }

  // ---------------------------------------------------------------------------------------------

  function render(fb, view) {
    fb.clear();
    switch (view.mode) {
      case 'title':
        drawTitle(fb, view);
        break;
      case 'paused':
        drawField(fb, view);
        drawPaused(fb, view);
        break;
      case 'over':
        drawField(fb, view);
        drawOver(fb, view);
        break;
      default: // play, dying
        drawField(fb, view);
    }
    return fb;
  }

  var Scene = {
    render: render,
    TEXTS: TEXTS,
    demoSegs: demoSegs,
    BUG: BUG,
    BLINK_MS: BLINK_MS,
    DEATH_BLINK_MS: DEATH_BLINK_MS
  };

  NS.Scene = Scene;
  if (typeof module === 'object' && module.exports) module.exports = Scene;
})();
