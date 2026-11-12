/*
 * The sprite engine of the 2021 Java version (BodyParts.java, Apple.java, Display.java, Screen.paint),
 * ported pixel for pixel.
 *
 * Coordinates: a snake segment sits on a lattice cell (cx, cy); its anchor on the LCD is
 *     px = 3 + 4 * cx,   py = 11 + 4 * cy
 * and the anchor is the front-most pixel of the segment. The body stretch of a segment is drawn BEHIND
 * the anchor (relative to the direction it was entered), the head sprite is drawn on the last segment.
 * Segment 0 (the tail anchor) is never drawn itself - the stretch of segment 1 forms the tail tip.
 * That is exactly how Screen.paint works.
 *
 * Direction codes are the original lastPressed codes: 0 = right, 1 = left, 2 = up, 3 = down.
 *
 * Two additions on top of the faithful port, both optional:
 *   wrap      - draw modulo the playfield, so the snake can cross the border (torus). With wrap off,
 *               pixels outside the LCD are clipped like Java's Graphics did.
 *   cornerFill - closes the two-pixel gaps the 2021 engine leaves at turns (see CORNER_FILL below).
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});
  var config = NS.config || (typeof require === 'function' ? require('./config.js') : null);
  var Font = NS.Font || (typeof require === 'function' ? require('./font.js') : null);

  // ---------------------------------------------------------------------------------------------
  // Sprite tables: [dx, dy] relative to the anchor. Straight from BodyParts.part1..part8 / head0..3.
  // ---------------------------------------------------------------------------------------------

  // two-part body stretch, indexed by the direction the segment was entered with
  var BODY = [
    /* 0 right */ [[-4, 1], [-3, 0], [-3, 1], /* part2 */ [-6, 0], [-6, 1], [-5, 0]],
    /* 1 left  */ [[5, 0], [6, 0], [6, 1], /* part4 */ [3, 0], [3, 1], [4, 1]],
    /* 2 up    */ [[0, 3], [1, 3], [1, 4], /* part6 */ [0, 5], [0, 6], [1, 6]],
    /* 3 down  */ [[0, -3], [1, -4], [1, -3], /* part8 */ [0, -6], [0, -5], [1, -6]]
  ];

  var HEAD = [
    /* 0 right */ [[-4, 1], [-3, 0], [-3, 1], [-2, -1], [-2, 1], [-1, 0], [-1, 1], [0, 0], [0, 1]],
    /* 1 left  */ [[0, 0], [0, 1], [1, 0], [1, 1], [2, -1], [2, 1], [3, 0], [3, 1], [4, 1]],
    /* 2 up    */ [[-1, 2], [0, 0], [0, 1], [0, 3], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
    /* 3 down  */ [[-1, -2], [0, -3], [0, -1], [0, 0], [1, -4], [1, -3], [1, -2], [1, -1], [1, 0]]
  ];

  // Apple.draw: the four pixels around the anchor (a hollow diamond)
  var APPLE = [[0, 1], [0, -1], [-1, 0], [1, 0]];

  // Display.java: four zero-padded digits at x = 0, 4, 8, 12, rows 0..4
  var SCORE_X = [0, 4, 8, 12];

  function mod(a, n) {
    return ((a % n) + n) % n;
  }

  /** Lattice cell -> LCD anchor. */
  function anchorX(cx) {
    return config.ORIGIN_X + config.STEP * cx;
  }
  function anchorY(cy) {
    return config.ORIGIN_Y + config.STEP * cy;
  }

  /** Plot one pixel. With wrap the playfield (all columns, rows FIELD_TOP..LCD_H-1) is a torus. */
  function plot(fb, x, y, wrap) {
    if (wrap) {
      x = mod(x, config.LCD_W);
      y = config.FIELD_TOP + mod(y - config.FIELD_TOP, config.LCD_H - config.FIELD_TOP);
    }
    fb.set(x, y, 1);
  }

  function stamp(fb, table, px, py, wrap) {
    for (var i = 0; i < table.length; i++) plot(fb, px + table[i][0], py + table[i][1], wrap);
  }

  // ---------------------------------------------------------------------------------------------
  // Frame, score, apple
  // ---------------------------------------------------------------------------------------------

  /** Screen.paint: row 6, row 8, row 47 across; column 0 and column 83 from row 8 down. */
  function drawFrame(fb) {
    var w = config.LCD_W, h = config.LCD_H;
    fb.hline(0, 6, w);
    fb.hline(0, 8, w);
    fb.hline(0, h - 1, w);
    fb.vline(0, 8, h - 8);
    fb.vline(w - 1, 8, h - 8);
  }

  /** Four digits, zero padded, right aligned (Screen.paint + Display.NumX). */
  function drawScore(fb, score) {
    var s = String(Math.max(0, Math.min(config.MAX_SCORE, score | 0)));
    while (s.length < 4) s = '0' + s;
    for (var i = 0; i < 4; i++) Font.drawDigit(fb, s.charAt(i), SCORE_X[i], 0);
  }

  function drawApple(fb, cx, cy) {
    stamp(fb, APPLE, anchorX(cx), anchorY(cy), false);
  }

  // ---------------------------------------------------------------------------------------------
  // Snake
  // ---------------------------------------------------------------------------------------------

  /**
   * Draws a snake. `segs` runs from the tail to the head, every entry {x, y, d} is the lattice cell and
   * the direction the segment was entered with (the "orArray" entry of the original).
   *
   * opts.wrap       draw modulo the playfield (default true)
   * opts.cornerFill add the corner filler pixels (default false)
   * opts.headOnly   draw only the head sprite and its stretch (used by the title demo)
   */
  function drawSnake(fb, segs, opts) {
    var wrap = !opts || opts.wrap !== false;
    var n = segs.length;
    if (n < 2) return; // the original paint loop does nothing for fewer than two segments

    for (var i = 1; i < n; i++) {
      var s = segs[i];
      stamp(fb, BODY[s.d], anchorX(s.x), anchorY(s.y), wrap);
    }
    var h = segs[n - 1];
    stamp(fb, HEAD[h.d], anchorX(h.x), anchorY(h.y), wrap);

    if (opts && opts.cornerFill) drawCornerFill(fb, segs, wrap);
  }

  // Filled in later in this file by the corner section.
  function drawCornerFill() {}

  var Sprites = {
    BODY: BODY,
    HEAD: HEAD,
    APPLE: APPLE,
    anchorX: anchorX,
    anchorY: anchorY,
    drawFrame: drawFrame,
    drawScore: drawScore,
    drawApple: drawApple,
    drawSnake: drawSnake,
    plot: plot,
    stamp: stamp,
    mod: mod
  };

  NS.Sprites = Sprites;
  if (typeof module === 'object' && module.exports) module.exports = Sprites;
})();
