'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../js/config.js');
const Framebuffer = require('../js/framebuffer.js');
const Font = require('../js/font.js');
const Sprites = require('../js/sprites.js');
const Scene = require('../js/scene.js');
const Game = require('../js/game.js');

const R = config.RIGHT;

function render(view) {
  const fb = new Framebuffer(config.LCD_W, config.LCD_H);
  Scene.render(fb, view);
  return fb;
}

/** A game with a straight snake on row `y` (head at x) and the given extras. */
function makeGame(extra) {
  const g = new Game({ rng: () => 0.5, level: 4 });
  const segs = [];
  for (let i = 8; i >= 0; i--) segs.push({ x: 14 - i, y: 4, d: R });
  g.load(Object.assign({ segs, size: 9, apple: { x: 15, y: 2 }, score: 124 }, extra));
  return g;
}

function frameIntact(fb) {
  const w = config.LCD_W, h = config.LCD_H;
  for (let x = 0; x < w; x++) {
    for (const y of [6, 8, h - 1]) assert.equal(fb.get(x, y), 1, `frame row ${y}, x ${x}`);
  }
  for (let y = 8; y < h; y++) {
    assert.equal(fb.get(0, y), 1, `left edge, y ${y}`);
    assert.equal(fb.get(w - 1, y), 1, `right edge, y ${y}`);
  }
}

/** Rows of a region as a string, for comparing parts of two frames. */
function region(fb, x0, y0, x1, y1) {
  let s = '';
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) s += fb.get(x, y) ? '#' : '.';
    s += '\n';
  }
  return s;
}

function count(fb, x0, y0, x1, y1) {
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) n += fb.get(x, y);
  return n;
}

function bounds(a, b) {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      if (a.get(x, y) !== b.get(x, y)) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
  }
  return { x0, y0, x1, y1 };
}

// ---------------------------------------------------------------------------------------------

test('every screen keeps the frame intact', () => {
  const g = makeGame({ bonus: { x: 3, y: 6, ticks: 40 } });
  const views = [
    { mode: 'title', time: 0, level: 4, best: 56 },
    { mode: 'title', time: 700, level: 1, best: 0 },
    { mode: 'title', time: 1300, level: 9, best: 9999 },
    { mode: 'play', time: 0, game: g },
    { mode: 'paused', time: 0, game: g },
    { mode: 'dying', time: 0, game: g },
    { mode: 'dying', time: Scene.DEATH_BLINK_MS, game: g },
    { mode: 'over', time: 0, game: g, best: 300 },
    { mode: 'over', time: 600, game: g, best: 124, newBest: true },
    { mode: 'over', time: 0, game: g, best: 300, cleared: true }
  ];
  for (const corner of [false, true]) {
    for (const v of views) frameIntact(render(Object.assign({ corner }, v)));
  }
});

test('the header shows the score in the original digits', () => {
  for (const score of [0, 4, 36, 124, 9999]) {
    const g = makeGame({ score });
    const fb = render({ mode: 'play', time: 0, game: g });
    const ref = new Framebuffer(config.LCD_W, config.LCD_H);
    Sprites.drawScore(ref, score);
    assert.equal(region(fb, 0, 0, 14, 4), region(ref, 0, 0, 14, 4), `score ${score}`);
  }
});

test('pause and game over leave the header and the frame alone', () => {
  const g = makeGame();
  const play = render({ mode: 'play', time: 0, game: g });
  for (const v of [
    { mode: 'paused', time: 0, game: g },
    { mode: 'over', time: 0, game: g, best: 300 },
    { mode: 'over', time: 0, game: g, best: 300, cleared: true }
  ]) {
    const fb = render(v);
    assert.equal(region(fb, 0, 0, 83, 8), region(play, 0, 0, 83, 8), `${v.mode}: header`);
    const b = bounds(fb, play);
    assert.ok(b.x0 >= 1 && b.x1 <= 82 && b.y0 >= 9 && b.y1 <= 46, `${v.mode}: box inside the field ${JSON.stringify(b)}`);
    assert.ok(Math.abs((b.x0 + b.x1) / 2 - 42) <= 2, `${v.mode}: centred ${JSON.stringify(b)}`);
  }
});

test('the box texts fit with a margin', () => {
  const T = Scene.TEXTS;
  assert.ok(Font.measure(T.title, 'font5x7') <= 60);
  assert.ok(Font.measure(T.over, 'font5x7') + 10 <= 80);
  assert.ok(Font.measure(T.cleared, 'font5x7') + 10 <= 80);
  assert.ok(Font.measure(T.paused, 'font5x7') + 10 <= 80);
  assert.ok(Font.measure(T.newBest, 'font3x5') + 10 <= 80);
  assert.ok(Font.measure(T.start, 'font3x5') <= 60);
  assert.ok(Font.measure(T.level + ' 9', 'font3x5') + 14 <= 80);
});

test('the snake flashes while dying and nothing else does', () => {
  const g = makeGame({ bonus: { x: 3, y: 6, ticks: 40 } });
  const shown = render({ mode: 'dying', time: 0, game: g, corner: true });
  const hidden = render({ mode: 'dying', time: Scene.DEATH_BLINK_MS, game: g, corner: true });
  const lone = makeGame({ bonus: { x: 3, y: 6, ticks: 40 } });
  lone.load({ segs: [{ x: 14, y: 4, d: R }], size: 1, apple: { x: 15, y: 2 }, bonus: { x: 3, y: 6, ticks: 40 }, score: 124 });
  const empty = render({ mode: 'play', time: Scene.DEATH_BLINK_MS, game: lone, corner: true });
  assert.ok(shown.px.reduce((a, b) => a + b, 0) > hidden.px.reduce((a, b) => a + b, 0));
  assert.ok(hidden.equals(empty), 'hidden = the same field without the snake');
});

test('the bonus bar shrinks one pixel per step and flashes in the last quarter', () => {
  const x = config.BONUS_BAR_X, y = config.BONUS_BAR_Y, w = config.BONUS_BAR_W, h = config.BONUS_BAR_H;
  for (const ticks of [config.BONUS_TICKS, 40, 20]) {
    const g = makeGame({ bonus: { x: 3, y: 6, ticks } });
    const fb = render({ mode: 'play', time: 0, game: g });
    const fill = Math.round((ticks * w) / config.BONUS_TICKS);
    for (let row = y; row < y + h; row++) {
      for (let i = 0; i < w + 2; i++) assert.equal(fb.get(x + i, row), i < fill ? 1 : 0, `ticks ${ticks}, row ${row}, pixel ${i}`);
    }
    assert.equal(fb.get(x + 3, y - 1), 0, 'nothing above the bar');
    assert.equal(fb.get(x + 3, y + h), 0, 'nothing below the bar');
  }
  const g = makeGame({ bonus: { x: 3, y: 6, ticks: 10 } });
  const on = render({ mode: 'play', time: 0, game: g });
  const off = render({ mode: 'play', time: 200, game: g });
  assert.ok(count(on, x, y, x + w - 1, y) > 0);
  assert.equal(count(off, x, y, x + w - 1, y), 0);
});

test('without a bonus the gauge area stays empty', () => {
  const g = makeGame();
  const fb = render({ mode: 'play', time: 0, game: g });
  assert.equal(count(fb, 17, 0, 82, 5), 0);
});

test('the bonus bug sits on the two cells of the bonus and moves its legs', () => {
  const g = makeGame({ bonus: { x: 3, y: 6, ticks: 40 } });
  const a = render({ mode: 'play', time: 0, game: g });
  const b = render({ mode: 'play', time: 230, game: g });
  const left = Sprites.anchorX(3) - 2, top = Sprites.anchorY(6) - 2;
  for (const [fb, frame] of [[a, Scene.BUG[0]], [b, Scene.BUG[1]]]) {
    for (let r = 0; r < frame.length; r++) {
      for (let c = 0; c < frame[r].length; c++) {
        assert.equal(fb.get(left + c, top + r), frame[r][c] === 'X' ? 1 : 0, `bug pixel ${c},${r}`);
      }
    }
  }
  assert.notEqual(region(a, left, top, left + 7, top + 4), region(b, left, top, left + 7, top + 4));
});

test('the apple is the original diamond on its lattice point', () => {
  const g = makeGame({ apple: { x: 15, y: 2 } });
  const fb = render({ mode: 'play', time: 0, game: g });
  const px = Sprites.anchorX(15), py = Sprites.anchorY(2);
  assert.equal(fb.get(px, py - 1) + fb.get(px, py + 1) + fb.get(px - 1, py) + fb.get(px + 1, py), 4);
  assert.equal(fb.get(px, py), 0, 'hollow in the middle');
});

test('the title: the demo snake crawls across the seam, the text is centred', () => {
  const step = 95;
  for (let i = 0; i < config.FIELD_COLS; i++) {
    const fb = render({ mode: 'title', time: i * step + 1, level: 4, best: 0 });
    assert.ok(count(fb, 1, 20, 82, 26) > 25, `snake visible at position ${i}`);
    frameIntact(fb);
  }
  const a = render({ mode: 'title', time: 3, level: 4, best: 0 });
  const b = render({ mode: 'title', time: 3 + step * config.FIELD_COLS, level: 4, best: 0 });
  assert.equal(region(a, 0, 20, 83, 26), region(b, 0, 20, 83, 26), 'the demo is periodic');

  // "SNAKE II" is centred
  let l = 99, r = -1;
  for (let y = 11; y <= 17; y++) {
    for (let x = 1; x < 83; x++) if (a.get(x, y)) { l = Math.min(l, x); r = Math.max(r, x); }
  }
  assert.ok(Math.abs(l - 1 - (82 - r)) <= 1, `title margins ${l - 1} / ${82 - r}`);
});

test('the level arrows appear only where there is somewhere to go', () => {
  const leftmost = (level) => {
    const fb = render({ mode: 'title', time: 0, level, best: 0 });
    for (let x = 1; x < 83; x++) for (let y = 28; y <= 32; y++) if (fb.get(x, y)) return x;
    return -1;
  };
  const rightmost = (level) => {
    const fb = render({ mode: 'title', time: 0, level, best: 0 });
    for (let x = 82; x > 0; x--) for (let y = 28; y <= 32; y++) if (fb.get(x, y)) return x;
    return -1;
  };
  assert.equal(leftmost(4), leftmost(1) - 6, 'level 4 has a left arrow, level 1 does not');
  assert.equal(rightmost(4), rightmost(9) + 6, 'level 4 has a right arrow, level 9 does not');
});

test('PRESS START blinks', () => {
  const on = render({ mode: 'title', time: 0, level: 4, best: 0 });
  const off = render({ mode: 'title', time: Scene.BLINK_MS, level: 4, best: 0 });
  assert.ok(count(on, 1, 41, 82, 45) > 0);
  assert.equal(count(off, 1, 41, 82, 45), 0);
});

test('NEW BEST! blinks, BEST does not', () => {
  const g = makeGame();
  const a = render({ mode: 'over', time: 0, game: g, best: 124, newBest: true });
  const b = render({ mode: 'over', time: Scene.BLINK_MS, game: g, best: 124, newBest: true });
  assert.notEqual(region(a, 12, 33, 72, 42), region(b, 12, 33, 72, 42));
  const c = render({ mode: 'over', time: 0, game: g, best: 300, newBest: false });
  const d = render({ mode: 'over', time: Scene.BLINK_MS, game: g, best: 300, newBest: false });
  assert.ok(c.equals(d));
});

test('the same view always renders the same frame', () => {
  const g = makeGame({ bonus: { x: 3, y: 6, ticks: 40 } });
  const v = { mode: 'play', time: 321, game: g, corner: true };
  assert.ok(render(v).equals(render(v)));
});
