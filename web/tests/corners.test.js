'use strict';

/*
 * cornerFill: the optional repair of the turns the 2021 engine never solved.
 *
 * Ground truth is the photo of the real game on page 5 of the project PDF (a snake looping a
 * rectangle): all four photographed corners (down->right, right->up, up->left, left->down) show the
 * same 2x2 junction block at the turn - a checker, both lane-corner pixels off, the other diagonal on.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const config = require('../js/config.js');
const Framebuffer = require('../js/framebuffer.js');
require('../js/font.js');
const Sprites = require('../js/sprites.js');

const golden = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'golden.json'), 'utf8'));

const R = 0, L = 1, U = 2, D = 3;
const DX = config.DX, DY = config.DY;

function segsOf(sc) {
  return sc.segments.map((s) => ({ x: s[0], y: s[1], d: s[2] }));
}

function snakeOnly(segs, opts) {
  const fb = new Framebuffer(84, 48);
  Sprites.drawSnake(fb, segs, opts);
  return fb;
}

/** Path from (cx, cy): the first cell is the start, every move adds a cell entered with that direction. */
function build(cx, cy, moves) {
  const segs = [{ x: cx, y: cy, d: moves[0] }];
  for (const m of moves) {
    cx += DX[m];
    cy += DY[m];
    segs.push({ x: cx, y: cy, d: m });
  }
  return segs;
}

const rep = (d, n) => new Array(n).fill(d);

/** An L: `n1` cells entered with a, then `n2` cells entered with b, placed near the middle, never touching the border. */
function lShape(a, b, n1 = 5, n2 = 4) {
  const moves = [...rep(a, n1), ...rep(b, n2)];
  let best = null;
  for (let cx = 1; cx <= 19; cx++) {
    for (let cy = 1; cy <= 8; cy++) {
      const segs = build(cx, cy, moves);
      if (!segs.every((s) => s.x >= 1 && s.x <= 19 && s.y >= 1 && s.y <= 8)) continue;
      const d = (cx - 10) ** 2 + (cy - 4) ** 2;
      if (!best || d < best.d) best = { d, segs };
    }
  }
  return best.segs;
}

function components(fb) {
  const seen = new Uint8Array(fb.w * fb.h);
  let count = 0;
  for (let y = 0; y < fb.h; y++) {
    for (let x = 0; x < fb.w; x++) {
      if (!fb.get(x, y) || seen[y * fb.w + x]) continue;
      count++;
      const stack = [[x, y]];
      seen[y * fb.w + x] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= fb.w || ny >= fb.h) continue;
            if (fb.get(nx, ny) && !seen[ny * fb.w + nx]) {
              seen[ny * fb.w + nx] = 1;
              stack.push([nx, ny]);
            }
          }
        }
      }
    }
  }
  return count;
}

function turnsOf(segs) {
  const out = [];
  for (let i = 1; i < segs.length; i++) {
    if (segs[i - 1].d !== segs[i].d && DX[segs[i - 1].d] * DX[segs[i].d] + DY[segs[i - 1].d] * DY[segs[i].d] === 0) {
      out.push(i - 1);
    }
  }
  return out;
}

// --- 1. nothing changes where there is no turn ------------------------------------------------------

test('cornerFill leaves every frame without a turn exactly as the original draws it', () => {
  let checked = 0;
  for (const sc of golden.scenarios) {
    const segs = segsOf(sc);
    if (turnsOf(segs).length) continue;
    const plain = snakeOnly(segs, { wrap: false });
    const fixed = snakeOnly(segs, { wrap: false, cornerFill: true });
    assert.ok(plain.equals(fixed), `${sc.name} changed although it has no turn`);
    checked++;
  }
  assert.ok(checked >= 30, 'expected plenty of turn-free scenarios');
});

// --- 2. changes stay inside the 5x5 box around each corner anchor -------------------------------------

test('cornerFill only touches pixels within 2 of a corner anchor', () => {
  let withTurns = 0;
  for (const sc of golden.scenarios) {
    const segs = segsOf(sc);
    const turns = turnsOf(segs);
    if (!turns.length) continue;
    withTurns++;
    const plain = snakeOnly(segs, { wrap: false });
    const fixed = snakeOnly(segs, { wrap: false, cornerFill: true });
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 84; x++) {
        if (plain.get(x, y) === fixed.get(x, y)) continue;
        const inside = turns.some((i) => {
          const ax = Sprites.anchorX(segs[i].x), ay = Sprites.anchorY(segs[i].y);
          return Math.abs(x - ax) <= 2 && Math.abs(y - ay) <= 2;
        });
        assert.ok(inside, `${sc.name}: pixel (${x},${y}) changed away from every corner`);
      }
    }
  }
  assert.ok(withTurns >= 40, 'expected plenty of scenarios with turns');
});

// --- 3. the snake is one piece ---------------------------------------------------------------------------

test('the original engine leaves the snake in pieces at turns, cornerFill makes it one piece', () => {
  let splitPlain = 0, splitFixed = 0, n = 0;
  for (const sc of golden.scenarios) {
    const segs = segsOf(sc);
    if (segs.length < 2) continue;
    n++;
    if (components(snakeOnly(segs, { wrap: false })) > 1) splitPlain++;
    const c = components(snakeOnly(segs, { wrap: false, cornerFill: true }));
    if (c > 1) splitFixed++;
    assert.equal(c, 1, `${sc.name}: snake with cornerFill is not one 8-connected piece`);
  }
  assert.ok(n >= 70);
  assert.ok(splitPlain >= 60, 'the 2021 engine is expected to split most snakes with turns (documents the defect)');
  assert.equal(splitFixed, 0);
});

// --- 4. the junction block matches the four corners of the real photo ----------------------------------

// 2x2 block at the corner anchor, rows y = 0 / 1, columns x = 0 / 1, 1 = pixel on.
const JUNCTION = {
  // photographed on page 5 of the PDF:
  [`${D}>${R}`]: [[1, 0], [0, 1]], //  down  -> right  (bottom-left corner of the loop)
  [`${R}>${U}`]: [[0, 1], [1, 0]], //  right -> up     (bottom-right)
  [`${U}>${L}`]: [[1, 0], [0, 1]], //  up    -> left   (top-right)
  [`${L}>${D}`]: [[0, 1], [1, 0]], //  left  -> down   (top-left)
  // not in the photo, same rule (outer and inner lane corner off):
  [`${R}>${D}`]: [[1, 0], [0, 1]],
  [`${D}>${L}`]: [[0, 1], [1, 0]],
  [`${L}>${U}`]: [[1, 0], [0, 1]],
  [`${U}>${R}`]: [[0, 1], [1, 0]]
};

test('every turn type draws the checker junction', () => {
  for (const [key, want] of Object.entries(JUNCTION)) {
    const [a, b] = key.split('>').map(Number);
    const segs = lShape(a, b);
    const corner = segs[5];
    const ax = Sprites.anchorX(corner.x), ay = Sprites.anchorY(corner.y);
    const fb = snakeOnly(segs, { wrap: false, cornerFill: true });
    const got = [[fb.get(ax, ay), fb.get(ax + 1, ay)], [fb.get(ax, ay + 1), fb.get(ax + 1, ay + 1)]];
    assert.deepEqual(got, want, `turn ${key}`);
  }
});

test('the stub the original leaves on the outer side of a bend is gone', () => {
  // right -> down: the original draws three pixels above the band at the corner column
  const segs = lShape(R, D);
  const ax = Sprites.anchorX(segs[5].x), ay = Sprites.anchorY(segs[5].y);
  const stub = [[ax, ay - 2], [ax + 1, ay - 2], [ax, ay - 1]];
  const plain = snakeOnly(segs, { wrap: false });
  const fixed = snakeOnly(segs, { wrap: false, cornerFill: true });
  for (const [x, y] of stub) {
    assert.equal(plain.get(x, y), 1, `original draws the stub pixel (${x},${y})`);
    assert.equal(fixed.get(x, y), 0, `cornerFill removes the stub pixel (${x},${y})`);
  }
});

test('the gap between the two stretches of a turn is closed', () => {
  for (const [key] of Object.entries(JUNCTION)) {
    const [a, b] = key.split('>').map(Number);
    const segs = lShape(a, b);
    assert.ok(components(snakeOnly(segs, { wrap: false })) > 1, `${key}: the original has a gap`);
    assert.equal(components(snakeOnly(segs, { wrap: false, cornerFill: true })), 1, `${key}: closed`);
  }
});

// --- 5. the same shape looks the same everywhere, also across the wrap seam ---------------------------

function pixelSet(fb) {
  const set = new Set();
  for (let y = 0; y < fb.h; y++) for (let x = 0; x < fb.w; x++) if (fb.get(x, y)) set.add(x + ',' + y);
  return set;
}

function shifted(segs, kx, ky) {
  return segs.map((s) => ({
    x: ((s.x + kx) % config.FIELD_COLS + config.FIELD_COLS) % config.FIELD_COLS,
    y: ((s.y + ky) % config.FIELD_ROWS + config.FIELD_ROWS) % config.FIELD_ROWS,
    d: s.d
  }));
}

test('a snake looks the same wherever it sits, including across the wrap seam', () => {
  const shapes = [
    build(8, 3, [...rep(R, 4), ...rep(D, 3), ...rep(L, 2), ...rep(U, 1)]),
    build(9, 5, [R, D, R, D, R, D, R, D]),
    build(9, 5, [L, U, L, U, L, U]),
    build(10, 5, [...rep(U, 3), ...rep(R, 3), ...rep(D, 5), ...rep(L, 2)])
  ];
  const fieldH = config.LCD_H - config.FIELD_TOP;
  for (const shape of shapes) {
    const base = pixelSet(snakeOnly(shape, { wrap: true, cornerFill: true }));
    for (const [kx, ky] of [[1, 0], [0, 1], [7, 4], [11, 5], [13, 6], [20, 9], [10, 0], [0, 5]]) {
      const moved = pixelSet(snakeOnly(shifted(shape, kx, ky), { wrap: true, cornerFill: true }));
      const expected = new Set();
      for (const p of base) {
        const [x, y] = p.split(',').map(Number);
        const nx = (x + 4 * kx) % config.LCD_W;
        const ny = config.FIELD_TOP + ((y - config.FIELD_TOP + 4 * ky) % fieldH + fieldH) % fieldH;
        expected.add(nx + ',' + ny);
      }
      assert.deepEqual([...moved].sort(), [...expected].sort(), `shift (${kx},${ky}) changed the picture`);
    }
  }
});

test('without cornerFill the wrap mode is also translation invariant (the original sprites)', () => {
  const shape = build(8, 3, [...rep(R, 4), ...rep(D, 3), ...rep(L, 2)]);
  const base = pixelSet(snakeOnly(shape, { wrap: true }));
  const moved = pixelSet(snakeOnly(shifted(shape, 20, 9), { wrap: true }));
  assert.equal(moved.size, base.size);
});

// --- 6. cornerFill off is the default and identical to the golden frames ---------------------------------

test('cornerFill defaults to off', () => {
  const segs = lShape(R, D);
  assert.ok(snakeOnly(segs, { wrap: false }).equals(snakeOnly(segs, { wrap: false, cornerFill: false })));
});
