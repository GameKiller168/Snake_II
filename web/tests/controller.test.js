'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../js/config.js');
const Game = require('../js/game.js');
const Store = require('../js/store.js');
const Controller = require('../js/controller.js');

const { RIGHT: R, LEFT: L, UP: U, DOWN: D } = config;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function make(opts) {
  return new Controller(Object.assign({ rng: mulberry32(1), store: Store.create(null) }, opts));
}

/** Advance in whole milliseconds, so the arithmetic is exact. */
function run(c, ms) {
  for (let i = 0; i < ms; i++) c.update(1);
}

/** A loop of eight cells with a ninth segment of room: moving up from the head hits the tail. */
const DEATH_SEGS = [
  { x: 4, y: 4, d: R }, { x: 5, y: 4, d: R }, { x: 6, y: 4, d: R }, { x: 6, y: 5, d: D },
  { x: 6, y: 6, d: D }, { x: 5, y: 6, d: L }, { x: 4, y: 6, d: L }, { x: 4, y: 5, d: U }
];

function crash(c, score) {
  c.game.load({ segs: DEATH_SEGS, size: 9, apple: { x: 15, y: 2 }, score });
  run(c, 140); // one step at level 4 = 130 ms
}

// ---------------------------------------------------------------------------------------------

test('starts on the title screen with the stored level', () => {
  const store = Store.create(null);
  store.setLevel(6);
  const c = make({ store });
  assert.equal(c.mode, 'title');
  assert.equal(c.level, 6);
  assert.equal(c.view().mode, 'title');
});

test('left / right / digits choose the level, clamp, persist and click', () => {
  const store = Store.create(null);
  const c = make({ store });
  assert.equal(c.level, 4);
  c.press('left'); c.press('left');
  assert.equal(c.level, 2);
  assert.deepEqual(c.drainSounds(), ['menu', 'menu']);
  c.press('left'); c.press('left'); c.press('left');
  assert.equal(c.level, 1);
  assert.deepEqual(c.drainSounds(), ['menu'], 'no click when nothing changes');
  for (let i = 0; i < 12; i++) c.press('right');
  assert.equal(c.level, 9);
  c.press('level', 5);
  assert.equal(c.level, 5);
  c.press('level', 0);
  assert.equal(c.level, 1);
  c.press('level', 99);
  assert.equal(c.level, 9);
  assert.equal(store.getLevel(), 9);
  c.press('up'); c.press('down');
  assert.equal(c.level, 9, 'up / down do nothing on the title');
});

test('each level has its own best score on the title', () => {
  const store = Store.create(null);
  store.setBest(3, 77);
  store.setBest(4, 12);
  const c = make({ store });
  assert.equal(c.view().best, 12);
  c.press('left');
  assert.equal(c.view().best, 77);
});

test('start, space and tap begin a game on the chosen level', () => {
  for (const a of ['start', 'space', 'tap']) {
    const c = make();
    c.press('level', 7);
    c.drainSounds();
    c.press(a);
    assert.equal(c.mode, 'play', a);
    assert.equal(c.game.level, 7);
    assert.deepEqual(c.drainSounds(), ['start']);
  }
});

test('timing: a fast unroll first, then one step per level interval', () => {
  const c = make();
  c.press('start');
  run(c, config.START_SIZE * config.INTRO_STEP_MS);
  assert.equal(c.game.steps, config.START_SIZE);
  assert.equal(c.game.phase, 'play');
  run(c, 5 * config.STEP_MS[3] - 1);
  assert.equal(c.game.steps, config.START_SIZE + 4);
  run(c, 1);
  assert.equal(c.game.steps, config.START_SIZE + 5);
});

test('a faster level steps more often', () => {
  const slow = make(); slow.press('level', 1); slow.press('start');
  const fast = make(); fast.press('level', 9); fast.press('start');
  run(slow, 2000); run(fast, 2000);
  assert.ok(fast.game.steps > slow.game.steps + 10);
});

test('a huge frame time does not fast-forward the game', () => {
  const c = make();
  c.press('start');
  c.update(100000);
  assert.ok(c.game.steps <= 6, `steps ${c.game.steps}`);
  assert.equal(c.mode, 'play');
  c.update(-5); c.update(NaN); c.update(0);
  assert.ok(c.game.steps <= 6);
});

test('arrow presses steer the snake; reversing is ignored', () => {
  const c = make();
  c.press('start');
  run(c, 300); // the unroll is over
  assert.equal(c.press('left'), false, 'a reversal is ignored');
  assert.equal(c.press('up'), true);
  run(c, config.STEP_MS[3]);
  assert.equal(c.game.head().d, U);
});

test('turns pressed during the unroll are kept', () => {
  const c = make();
  c.press('start');
  c.press('down');
  run(c, 400);
  assert.equal(c.game.head().d, D);
});

test('pause freezes the game, resume continues without a jump', () => {
  const c = make();
  c.press('start');
  run(c, 400);
  const steps = c.game.steps;
  c.drainSounds();
  c.press('pause');
  assert.equal(c.mode, 'paused');
  assert.deepEqual(c.drainSounds(), ['pause']);
  run(c, 5000);
  assert.equal(c.game.steps, steps);
  c.press('space');
  assert.equal(c.mode, 'play');
  c.update(100); // less than a step at level 4
  assert.equal(c.game.steps, steps, 'no catching up');
});

test('autopause only acts while playing, and is silent', () => {
  const c = make();
  c.press('autopause');
  assert.equal(c.mode, 'title');
  c.press('start');
  c.drainSounds();
  c.press('autopause');
  assert.equal(c.mode, 'paused');
  assert.deepEqual(c.drainSounds(), []);
  c.press('autopause');
  assert.equal(c.mode, 'paused');
});

test('paused: directions are ignored, quit goes to the title', () => {
  const c = make();
  c.press('start');
  c.press('pause');
  assert.equal(c.press('up'), false);
  assert.equal(c.mode, 'paused');
  c.press('quit');
  assert.equal(c.mode, 'title');
  assert.equal(c.game, null);
});

test('play ignores start, tap and quit (no accidental exits)', () => {
  const c = make();
  c.press('start');
  for (const a of ['start', 'tap', 'quit']) assert.equal(c.press(a), false, a);
  assert.equal(c.mode, 'play');
});

test('eating an apple makes a sound and scores by level', () => {
  const c = make();
  c.press('level', 5);
  c.press('start');
  run(c, 300);
  c.drainSounds();
  const h = c.game.head();
  const segs = [];
  for (let i = 8; i >= 0; i--) segs.push({ x: h.x - i, y: 4, d: R });
  c.game.load({ segs: segs.map((s) => ({ x: s.x, y: 4, d: R })), size: 9, apple: { x: h.x + 1, y: 4 }, score: 0 });
  run(c, config.STEP_MS[4]);
  assert.deepEqual(c.drainSounds().filter((s) => s === 'eat'), ['eat']);
  assert.equal(c.game.score, config.POINTS_PER_APPLE * 5);
});

test('a crash: flashing, then the game over screen; the best score is saved', () => {
  const store = Store.create(null);
  const c = make({ store });
  c.press('start');
  run(c, 300);
  c.drainSounds();
  crash(c, 36);
  assert.equal(c.mode, 'dying');
  assert.ok(c.drainSounds().includes('die'));
  assert.equal(c.newBest, true);
  assert.equal(store.getBest(4), 36, 'saved at the moment of the crash');
  assert.equal(c.press('start'), false, 'no input while dying');
  run(c, config.DYING_MS + 5);
  assert.equal(c.mode, 'over');
  assert.equal(c.view().best, 36);
});

test('a lower score is not a new best', () => {
  const store = Store.create(null);
  store.setBest(4, 100);
  const c = make({ store });
  c.press('start'); run(c, 300);
  crash(c, 12);
  assert.equal(c.newBest, false);
  assert.equal(store.getBest(4), 100);
  assert.equal(c.best, 100);
});

test('a score of zero is never a new best', () => {
  const c = make();
  c.press('start'); run(c, 300);
  crash(c, 0);
  assert.equal(c.newBest, false);
});

test('best scores are kept per level', () => {
  const store = Store.create(null);
  const c = make({ store });
  c.press('start'); run(c, 300);
  crash(c, 40);
  assert.equal(store.getBest(4), 40);
  assert.equal(store.getBest(5), 0);
});

test('the game over screen locks the start key for a moment', () => {
  const c = make();
  c.press('start'); run(c, 300);
  crash(c, 8);
  run(c, config.DYING_MS + 5);
  assert.equal(c.mode, 'over');
  assert.equal(c.press('start'), false);
  assert.equal(c.mode, 'over');
  run(c, config.OVER_LOCK_MS);
  assert.equal(c.press('start'), true);
  assert.equal(c.mode, 'play');
  assert.equal(c.game.score, 0, 'a fresh game');
  assert.equal(c.game.level, 4);
});

test('Esc / quit on the game over screen goes to the title right away', () => {
  for (const a of ['pause', 'quit']) {
    const c = make();
    c.press('start'); run(c, 300);
    crash(c, 8);
    run(c, config.DYING_MS + 5);
    c.press(a);
    assert.equal(c.mode, 'title', a);
  }
});

test('a cleared board is reported as such', () => {
  const c = make();
  c.press('start');
  c.game.phase = 'cleared';
  c._gameEnded();
  assert.equal(c.cleared, true);
  assert.equal(c.view().cleared, true);
  run(c, config.DYING_MS + config.OVER_LOCK_MS + 10);
  assert.equal(c.mode, 'over');
  c.press('start');
  assert.equal(c.mode, 'play');
  assert.equal(c.cleared, false);
});

test('the view carries what the scene needs', () => {
  const c = make({ corner: false });
  let v = c.view();
  assert.deepEqual(Object.keys(v).sort(), ['best', 'cleared', 'corner', 'game', 'level', 'mode', 'newBest', 'time']);
  assert.equal(v.corner, false);
  c.setCorner(true);
  c.press('start');
  c.update(40);
  v = c.view();
  assert.equal(v.mode, 'play');
  assert.equal(v.corner, true);
  assert.ok(v.game instanceof Game);
  assert.equal(v.time, 40);
});

test('hints follow the state', () => {
  const c = make();
  assert.equal(c.hintKey(), 'title');
  c.press('start');
  assert.equal(c.hintKey(), 'play');
  c.press('pause');
  assert.equal(c.hintKey(), 'paused');
  c.press('pause');
  crash(c, 4);
  assert.equal(c.hintKey(), 'play', 'while dying the play hint stays');
  run(c, config.DYING_MS + 5);
  assert.equal(c.hintKey(), 'over');
});

test('the same seed plays the same game', () => {
  const play = () => {
    const c = make({ rng: mulberry32(42) });
    c.press('start');
    run(c, 3000);
    return JSON.stringify([c.game.apple, c.game.segs.length, c.game.steps]);
  };
  assert.equal(play(), play());
});
