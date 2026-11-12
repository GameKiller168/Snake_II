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
 *   wrap       - draw modulo the playfield, so the snake can cross the border (torus). With wrap off,
 *                pixels outside the LCD are clipped like Java's Graphics did.
 *   cornerFill - the 2021 engine has no corner pieces: at a turn the two straight stretches do not meet
 *                (a 2-3 pixel gap) and the outgoing stretch pokes out of the outer wall of the bend.
 *                With cornerFill the turn is closed up. The rules were derived from the real Snake II
 *                photo in the project PDF (page 5), where all four photographed corners share one
 *                shape: the 2x2 junction block at the corner is a checker, both lane-corner pixels are
 *                off, the other diagonal is on. See the "corners" section below. Straight parts, heads,
 *                apples and digits are never touched.
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
  function plot(fb, x, y, wrap, on) {
    if (wrap) {
      x = mod(x, config.LCD_W);
      y = config.FIELD_TOP + mod(y - config.FIELD_TOP, config.LCD_H - config.FIELD_TOP);
    }
    fb.set(x, y, on === 0 ? 0 : 1);
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
  // Corners (cornerFill)
  //
  // A turn is described by the corner cell C (entered with direction a) and the next cell N (entered
  // with direction b, perpendicular to a). A is the anchor of C. All offsets below are relative to A.
  //
  //   1. trim: the stretch of N reaches 2 pixels "behind" A along b. Whatever of it lies outside the
  //      strip of the incoming stretch is a stub sticking out of the outer wall of the bend: dropped.
  //   2. fill: the incoming stretch ends 3 pixels before A, the outgoing strip starts at A. The gap is
  //      closed with the pixels the straight stretch of a would have drawn one cell further.
  //   3. junction: the 2x2 block at A is the place where the two lanes of the body cross. Real Snake II
  //      draws it as a checker: the corner pixel of the inner lane and of the outer lane are off, the
  //      other two pixels (the outer lane just before and just after its corner) are on.
  //
  // The tables are built once for the eight turn types.
  // ---------------------------------------------------------------------------------------------

  var DIRV = [[1, 0], [-1, 0], [0, -1], [0, 1]]; // right, left, up, down
  function dot(o, v) {
    return o[0] * v[0] + o[1] * v[1];
  }
  function perpendicular(a, b) {
    return dot(DIRV[a], DIRV[b]) === 0;
  }

  var CORNER = [[], [], [], []];
  (function buildCornerTables() {
    var STEP = config.STEP;
    for (var a = 0; a < 4; a++) {
      for (var b = 0; b < 4; b++) {
        if (!perpendicular(a, b)) continue;
        var da = DIRV[a], db = DIRV[b], i, off;

        // 1. trim: strip of the incoming stretch measured along b
        var tMin = Infinity;
        for (i = 0; i < BODY[a].length; i++) tMin = Math.min(tMin, dot(BODY[a][i], db));
        var kept = [];
        var sMin = Infinity;
        for (i = 0; i < BODY[b].length; i++) {
          off = [BODY[b][i][0] + STEP * db[0], BODY[b][i][1] + STEP * db[1]]; // relative to A
          sMin = Math.min(sMin, dot(off, da));
          if (dot(off, db) >= tMin) kept.push(off);
        }

        // 2. fill: the straight stretch of a one cell further, only the part before the outgoing strip
        var fill = [];
        for (i = 0; i < BODY[a].length; i++) {
          off = [BODY[a][i][0] + STEP * da[0], BODY[a][i][1] + STEP * da[1]];
          if (dot(off, da) < sMin) fill.push(off);
        }

        // 3. junction checker
        var block = [[0, 0], [1, 0], [0, 1], [1, 1]];
        var aLo = Infinity, bLo = Infinity;
        for (i = 0; i < 4; i++) {
          aLo = Math.min(aLo, dot(block[i], da));
          bLo = Math.min(bLo, dot(block[i], db));
        }
        var on = [], offp = [];
        for (i = 0; i < 4; i++) {
          var backA = dot(block[i], da) === aLo, backB = dot(block[i], db) === bLo;
          (backA === backB ? on : offp).push(block[i]);
        }

        CORNER[a][b] = { n: kept, fill: fill, on: on, off: offp };
      }
    }
  })();

  // ---------------------------------------------------------------------------------------------
  // Snake
  // ---------------------------------------------------------------------------------------------

  /**
   * Draws a snake. `segs` runs from the tail to the head, every entry {x, y, d} is the lattice cell and
   * the direction the segment was entered with (the "orArray" entry of the original).
   *
   * opts.wrap       draw modulo the playfield (default true)
   * opts.cornerFill close up the turns (default false, see the header comment)
   */
  function drawSnake(fb, segs, opts) {
    var wrap = !opts || opts.wrap !== false;
    var fix = !!(opts && opts.cornerFill);
    var n = segs.length;
    if (n < 2) return; // the original paint loop does nothing for fewer than two segments

    var corners = [];
    var i, j, s, px, py;
    for (i = 1; i < n; i++) {
      s = segs[i];
      px = anchorX(s.x);
      py = anchorY(s.y);
      if (fix && segs[i - 1].d !== s.d && perpendicular(segs[i - 1].d, s.d)) {
        var a = segs[i - 1].d, b = s.d, tab = CORNER[a][b];
        // corner anchor derived from N's own anchor, so a turn across the wrap seam stays consistent
        var ax = px - config.STEP * DIRV[b][0], ay = py - config.STEP * DIRV[b][1];
        for (j = 0; j < tab.n.length; j++) plot(fb, ax + tab.n[j][0], ay + tab.n[j][1], wrap);
        if (i >= 2) corners.push([tab, ax, ay]); // the tail anchor (segment 0) is never drawn: no junction there
      } else {
        stamp(fb, BODY[s.d], px, py, wrap);
      }
    }

    for (i = 0; i < corners.length; i++) {
      var c = corners[i];
      for (j = 0; j < c[0].fill.length; j++) plot(fb, c[1] + c[0].fill[j][0], c[2] + c[0].fill[j][1], wrap);
    }
    for (i = 0; i < corners.length; i++) {
      var k = corners[i];
      for (j = 0; j < k[0].on.length; j++) plot(fb, k[1] + k[0].on[j][0], k[2] + k[0].on[j][1], wrap, 1);
      for (j = 0; j < k[0].off.length; j++) plot(fb, k[1] + k[0].off[j][0], k[2] + k[0].off[j][1], wrap, 0);
    }

    var h = segs[n - 1];
    stamp(fb, HEAD[h.d], anchorX(h.x), anchorY(h.y), wrap); // the head is drawn last and always stays intact
  }

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
    CORNER: CORNER,
    plot: plot,
    stamp: stamp,
    mod: mod
  };

  NS.Sprites = Sprites;
  if (typeof module === 'object' && module.exports) module.exports = Sprites;
})();
