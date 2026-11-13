/*
 * The sprite library of the real Snake II (Nokia 3310), measured from footage of the phone.
 *
 * Lattice. The play field is 20 x 9 cells (the snake wraps around all four edges). A cell is a 4 x 4 pixel tile;
 * tile (x, y) covers the LCD columns 2 + 4x .. 5 + 4x and rows 10 + 4y .. 13 + 4y, so the field is 80 x 36
 * pixels at columns 2..81, rows 10..45. Columns 1 and 82 and rows 9 and 46 are never drawn by the snake.
 *
 * Every piece of the snake is one 4 x 4 tile image chosen by ROLE and DIRECTION - nothing is composed from
 * smaller strokes:
 *   - body, straight   : STRAIGHT[d], d = direction of travel
 *   - body, corner     : CORNER[pair], pair = the two sides the tile is open to (the side it was entered from
 *                        and the side it is left through), so a corner needs only 4 images, not 8
 *   - head (front tile): HEAD[d]; with the mouth open (HEAD_OPEN[d]) while food is in the very next cell
 *   - tail (first tile): TAIL[d], d = direction towards the next cell
 *   - a cell that swallowed food (apple or bonus bug) keeps a bulge until the tail reaches it: the straight
 *     tiles get four extra pixels, a corner one extra pixel (BULGE_*).
 * The tile behind the head is an ordinary body tile.
 *
 * Direction codes are the codes of the game: 0 = right, 1 = left, 2 = up, 3 = down.
 *
 * Evidence: every picture below was read from 482 tracked frames of a 481 s recording of a real phone
 * (default level); the model reproduces 470 of them pixel for pixel (the other 12 differ in one
 * marginal LCD pixel). See FIDELITY.md.
 */
(function () {
  'use strict';

  var NS = (globalThis.SnakeII = globalThis.SnakeII || {});

  var R = 0, L = 1, U = 2, D = 3;

  // '#' = pixel on. Rows top to bottom, four columns.
  var STRAIGHT = [
    /* R */ ['....', '##.#', '#.##', '....'],
    /* L */ ['....', '#.##', '##.#', '....'],
    /* U */ ['.##.', '..#.', '.#..', '.##.'],
    /* D */ ['.##.', '.#..', '..#.', '.##.']
  ];

  // Key = the two sides the tile is open to, as a bit mask: 1 = right, 2 = left, 4 = up, 8 = down.
  var CORNER = {};
  CORNER[2 | 4] = ['.##.', '#.#.', '##..', '....']; // left + up
  CORNER[1 | 4] = ['.##.', '.#.#', '..##', '....']; // right + up
  CORNER[1 | 8] = ['....', '..##', '.#.#', '.##.']; // right + down
  CORNER[2 | 8] = ['....', '##..', '#.#.', '.##.']; // left + down

  var HEAD = [
    /* R */ ['#...', '.##.', '###.', '....'],
    /* L */ ['...#', '.##.', '.###', '....'],
    /* U */ ['....', '.##.', '.##.', '#.#.'],
    /* D */ ['#.#.', '.##.', '.##.', '....']
  ];

  var HEAD_OPEN = [
    /* R */ ['#.#.', '.#..', '##..', '..#.'],
    /* L */ ['.#.#', '..#.', '..##', '.#..'],
    /* U */ ['....', '#..#', '.##.', '#.#.'],
    /* D */ ['#.#.', '.##.', '#..#', '....']
  ];

  var TAIL = [
    /* towards R */ ['....', '..##', '####', '....'],
    /* towards L */ ['....', '##..', '####', '....'],
    /* towards U */ ['.##.', '.##.', '..#.', '..#.'],
    /* towards D */ ['..#.', '..#.', '.##.', '.##.']
  ];

  // extra pixels [row, col] of a tile that holds swallowed food
  var BULGE_H = [[0, 1], [0, 2], [3, 1], [3, 2]];
  var BULGE_V = [[1, 0], [1, 3], [2, 0], [2, 3]];
  var BULGE_CORNER = {};
  BULGE_CORNER[2 | 4] = [[0, 0]];
  BULGE_CORNER[1 | 4] = [[0, 3]];
  BULGE_CORNER[1 | 8] = [[3, 3]];
  BULGE_CORNER[2 | 8] = [[3, 0]];

  // The apple only occupies the upper left 3 x 3 pixels of its cell (a small ring).
  var APPLE = ['.#..', '#.#.', '.#..', '....'];

  // The bonus creatures, 8 x 4 pixels = two cells wide. The program has six pictures and picks one at random
  // for every creature, numbered 0..5 here in the order of the program. The same picture is shown in the header.
  // Types 1, 2, 4 and 5 were read from footage of a real phone (VIDEO B, 8 creatures: types 1, 4, 2, 5, 4, 5, 1, 5).
  // Types 0 and 3 did not show up in any footage; their pictures come from the program of the phone. The oracle traces
  // (tests/oracle.test.js) contain all six types and check every one against the program's own picture.
  var CREATURE = [
    /* 0 [FW, not in footage] */ ['##...#..', '##..###.', '..######', '....#.#.'],
    /* 1 */ ['....##..', '#..##.#.', '#.#####.', '.#######'],
    /* 2 */ ['..####..', '########', '#.####.#', '#.#..#.#'],
    /* 3 [FW, not in footage] */ ['..##....', '.#.##.#.', '#######.', '..####..'],
    /* 4 */ ['.#.#.#..', '#.#####.', '########', '..#..#..'],
    /* 5 */ ['........', '#.......', '########', '.#.#.#.#']
  ];
  var CREATURE_SEEN = [false, true, true, false, true, true];

  var SIDE = [1, 2, 4, 8]; // by direction code: the side of the tile that faces that direction
  var OPP = [1, 0, 3, 2];

  /** Bit mask of the two sides a body tile is open to: the side it was entered from and the exit side. */
  function openSides(din, dout) {
    return SIDE[OPP[din]] | SIDE[dout];
  }

  function copy(rows) {
    return rows.slice();
  }

  /**
   * The 4 x 4 image of one snake cell.
   *   role  'head' | 'tail' | 'body'
   *   din   direction the cell was entered with (unused for the tail)
   *   dout  direction towards the next cell (unused for the head)
   *   fed   body cell that swallowed food
   *   open  head with an open mouth
   * Returns an array of four strings.
   */
  function tileFor(role, din, dout, fed, open) {
    if (role === 'head') return (open ? HEAD_OPEN : HEAD)[din];
    if (role === 'tail') return TAIL[dout];
    var sides = openSides(din, dout);
    var base, extra;
    if (din === dout) {
      base = STRAIGHT[din];
      extra = din === R || din === L ? BULGE_H : BULGE_V;
    } else {
      base = CORNER[sides];
      extra = BULGE_CORNER[sides];
    }
    if (!fed) return base;
    var rows = base.map(function (r) {
      return r.split('');
    });
    for (var i = 0; i < extra.length; i++) rows[extra[i][0]][extra[i][1]] = '#';
    return rows.map(function (r) {
      return r.join('');
    });
  }

  function mod(a, n) {
    return ((a % n) + n) % n;
  }

  /** Blit a picture (array of strings) with its upper left corner at LCD (x0, y0). */
  function blit(fb, rows, x0, y0) {
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var c = 0; c < row.length; c++) {
        if (row.charAt(c) === '#') fb.set(x0 + c, y0 + r, 1);
      }
    }
  }

  function drawCell(fb, rows, cx, cy, geom) {
    blit(fb, rows, geom.x0 + geom.tile * cx, geom.y0 + geom.tile * cy);
  }

  /**
   * Draw a snake. `segs` runs tail to head, every entry {x, y, d, fed}: the cell, the direction it was
   * entered with and whether it swallowed food. `open` = the head has food right in front of it.
   * geom = {x0, y0, tile} of the lattice (see config).
   */
  function drawSnake(fb, segs, geom, open) {
    var n = segs.length;
    for (var i = 0; i < n; i++) {
      var s = segs[i];
      var rows;
      if (i === n - 1) {
        rows = tileFor('head', s.d, null, false, open);
      } else if (i === 0) {
        rows = tileFor('tail', null, segs[1].d, false, false);
      } else {
        rows = tileFor('body', s.d, segs[i + 1].d, !!s.fed, false);
      }
      drawCell(fb, rows, s.x, s.y, geom);
    }
  }

  function drawApple(fb, cx, cy, geom) {
    drawCell(fb, APPLE, cx, cy, geom);
  }

  function drawCreature(fb, type, cx, cy, geom) {
    blit(fb, CREATURE[type], geom.x0 + geom.tile * cx, geom.y0 + geom.tile * cy);
  }

  var Tiles = {
    STRAIGHT: STRAIGHT,
    CORNER: CORNER,
    HEAD: HEAD,
    HEAD_OPEN: HEAD_OPEN,
    TAIL: TAIL,
    BULGE_H: BULGE_H,
    BULGE_V: BULGE_V,
    BULGE_CORNER: BULGE_CORNER,
    APPLE: APPLE,
    CREATURE: CREATURE,
    CREATURE_SEEN: CREATURE_SEEN,
    openSides: openSides,
    tileFor: tileFor,
    blit: blit,
    drawSnake: drawSnake,
    drawApple: drawApple,
    drawCreature: drawCreature,
    mod: mod,
    copy: copy
  };

  NS.Tiles = Tiles;
  if (typeof module === 'object' && module.exports) module.exports = Tiles;
})();
