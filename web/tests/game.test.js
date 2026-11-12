'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../js/config.js');
const Game = require('../js/game.js');

const { RIGHT: R, LEFT: L, UP: U, DOWN: D } = config;

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newGame(seed = 1, level = 4) {
  return new Game({ rng: mulberry32(seed), level });
}

function playGame(seed = 1, level = 4) {
  const g = newGame(seed, level);
  while (g.phase === 'intro') g.step();
  return g;
}

/** A straight horizontal snake of `n` cells ending at (hx, y), heading right. */
function line(hx, y, n, d = R) {
  const segs = [];
  for (let i = 0; i < n; i++) segs.push({ x: hx - (n - 1 - i) * config.DX[d], y: y - (n - 1 - i) * config.DY[d], d });
  return segs;
}

/** Checks the invariants that must hold after every step. */
function checkInvariants(g, label = '') {
  const { FIELD_COLS: C, FIELD_ROWS: Rw } = config;
  const counts = new Uint8Array(C * Rw);
  for (const s of g.segs) {
    assert.ok(s.x >= 0 && s.x < C && s.y >= 0 && s.y < Rw, `${label} segment outside the field`);
    counts[s.y * C + s.x]++;
  }
  assert.deepEqual(Array.from(g.grid), Array.from(counts), `${label} occupancy grid out of sync`);
  if (g.phase !== 'dead') {
    for (const c of counts) assert.ok(c <= 1, `${label} two segments on one cell`);
  }
  assert.ok(g.segs.length <= g.size, `${label} snake longer than size`);
  if (g.apple) {
    assert.ok(g.apple.x >= 0 && g.apple.x < config.APPLE_COLS && g.apple.y >= 0 && g.apple.y < config.APPLE_ROWS);
    assert.equal(counts[g.apple.y * C + g.apple.x], 0, `${label} apple on the snake`);
  }
  if (g.bonus) {
    assert.ok(g.bonus.x >= 0 && g.bonus.x + 1 < config.APPLE_COLS && g.bonus.y >= 0 && g.bonus.y < config.APPLE_ROWS);
    assert.equal(counts[g.bonus.y * C + g.bonus.x], 0, `${label} bonus on the snake`);
    assert.equal(counts[g.bonus.y * C + g.bonus.x + 1], 0, `${label} bonus on the snake`);
    if (g.apple) {
      assert.ok(!(g.apple.y === g.bonus.y && (g.apple.x === g.bonus.x || g.apple.x === g.bonus.x + 1)), `${label} apple under the bonus`);
    }
  }
  assert.ok(g.score >= 0 && g.score <= config.MAX_SCORE);
}

// --- start ------------------------------------------------------------------------------------------

test('start: one cell at the original start position, apple on the lattice', () => {
  const g = newGame();
  assert.equal(g.phase, 'intro');
  assert.deepEqual(g.segs.map((s) => [s.x, s.y, s.d]), [[config.START_CX, config.START_CY, R]]);
  // the original start: xCoor = 7, yCoor = 31
  assert.equal(3 + 4 * config.START_CX, 7);
  assert.equal(11 + 4 * config.START_CY, 31);
  assert.ok(g.apple);
  assert.equal(g.score, 0);
});

test('start: the unroll takes nine steps to the right, then the game is on', () => {
  const g = newGame();
  for (let i = 1; i <= 8; i++) {
    assert.equal(g.step(), 'intro', `step ${i}`);
    assert.equal(g.segs.length, i + 1, 'the snake grows during the unroll');
  }
  assert.equal(g.step(), 'play');
  assert.equal(g.segs.length, config.START_SIZE);
  assert.deepEqual([g.head().x, g.head().y], [10, 5]); // original: head x = 7 + 9 * 4 = 43 -> cx 10
  assert.equal(3 + 4 * g.head().x, 43);
  assert.equal(g.stepMs(), config.STEP_MS[3]);
  checkInvariants(g);
});

test('start: the unroll is fast, the game speed depends on the level', () => {
  const g = newGame(1, 7);
  assert.equal(g.stepMs(), config.INTRO_STEP_MS);
  while (g.phase === 'intro') g.step();
  assert.equal(g.stepMs(), config.STEP_MS[6]);
});

test('the first apple never sits on the unroll path', () => {
  for (let seed = 1; seed <= 400; seed++) {
    const g = newGame(seed);
    const a = g.apple;
    assert.ok(!(a.y === config.START_CY && a.x >= config.START_CX && a.x <= config.START_CX + config.START_SIZE), `seed ${seed}`);
    while (g.phase === 'intro') g.step();
    checkInvariants(g, `seed ${seed}`);
    assert.equal(g.score, 0, 'the unroll can never eat the first apple');
  }
});

test('input during the unroll is queued and used afterwards, a reversal is refused', () => {
  const g = newGame();
  assert.equal(g.turn(L), false, 'left is the opposite of the forced right');
  assert.equal(g.turn(R), false);
  assert.equal(g.turn(U), true);
  while (g.phase === 'intro') g.step();
  assert.equal(g.dir, R, 'still heading right after the unroll');
  g.step();
  assert.equal(g.dir, U);
  assert.equal(g.head().d, U);
});

// --- movement ---------------------------------------------------------------------------------------

test('a step moves the head one cell and keeps the length', () => {
  const g = playGame();
  const before = g.head();
  const len = g.segs.length;
  g.step();
  assert.deepEqual([g.head().x, g.head().y], [before.x + 1, before.y]);
  assert.equal(g.segs.length, len);
  checkInvariants(g);
});

test('every cell remembers the direction it was entered with', () => {
  const g = playGame();
  g.turn(D); g.step();
  g.step();
  g.turn(R); g.step();
  const tail3 = g.segs.slice(-3).map((s) => s.d);
  assert.deepEqual(tail3, [D, D, R]);
});

test('the border wraps around on all four sides', () => {
  const cases = [
    { from: { x: 20, y: 4 }, d: R, to: { x: 0, y: 4 } },
    { from: { x: 0, y: 4 }, d: L, to: { x: 20, y: 4 } },
    { from: { x: 6, y: 0 }, d: U, to: { x: 6, y: 9 } },
    { from: { x: 6, y: 9 }, d: D, to: { x: 6, y: 0 } }
  ];
  for (const c of cases) {
    const g = playGame();
    g.load({ segs: line(c.from.x, c.from.y, 4, c.d), size: 4, apple: { x: 9, y: 4 } });
    g.step();
    assert.deepEqual([g.head().x, g.head().y], [c.to.x, c.to.y]);
    assert.notEqual(g.phase, 'dead', 'wrapping is not a crash');
    checkInvariants(g);
  }
});

test('the field is a torus: walking straight comes back to the start', () => {
  const g = playGame();
  g.load({ segs: line(5, 8, 4), size: 4, apple: null });
  const start = g.head();
  for (let i = 0; i < config.FIELD_COLS; i++) g.step();
  assert.deepEqual([g.head().x, g.head().y], [start.x, start.y]);
  g.load({ segs: line(5, 8, 4, D), size: 4, apple: null });
  for (let i = 0; i < config.FIELD_ROWS; i++) g.step();
  assert.deepEqual([g.head().x, g.head().y], [5, 8]);
});

// --- input queue ------------------------------------------------------------------------------------

test('turn: reversals and repeats are ignored', () => {
  const g = playGame();
  assert.equal(g.turn(R), false);
  assert.equal(g.turn(L), false);
  assert.equal(g.turn(U), true);
  assert.equal(g.turn(U), false, 'same as the last queued');
  assert.equal(g.turn(D), false, 'opposite of the last queued');
  assert.equal(g.turn(L), true, 'L is fine after U');
  assert.deepEqual(g.queue, [U, L]);
});

test('turn: up to three directions are queued and consumed one per step', () => {
  const g = playGame();
  g.load({ segs: line(10, 5, 5), size: 5, apple: null });
  assert.ok(g.turn(U));
  assert.ok(g.turn(R));
  assert.ok(g.turn(D));
  assert.equal(g.turn(L), false, 'the queue holds three');
  g.step(); assert.equal(g.head().d, U);
  g.step(); assert.equal(g.head().d, R);
  g.step(); assert.equal(g.head().d, D);
  assert.equal(g.queue.length, 0);
  assert.ok(g.turn(L), 'room again');
});

test('turn: a quick 180 degree flick (up, left) is two valid turns, not a reversal', () => {
  const g = playGame();
  g.load({ segs: line(10, 5, 5), size: 5, apple: null });
  g.turn(U); g.turn(L);
  g.step(); g.step();
  assert.deepEqual([g.head().x, g.head().y], [10, 4].map((v, i) => (i === 0 ? 9 : v)));
  assert.equal(g.phase, 'play');
});

// --- collisions -------------------------------------------------------------------------------------

test('running into the own body ends the game', () => {
  const g = playGame();
  // a long snake that curls: heading right, then down, left, up into itself
  g.load({ segs: line(10, 5, 9), size: 9, apple: null });
  g.turn(D); g.step();
  g.turn(L); g.step();
  assert.equal(g.phase, 'play');
  g.turn(U); // (9,6) -> (9,5): the snake's own body
  g.step();
  assert.equal(g.phase, 'dead');
  assert.deepEqual(g.drainEvents().filter((e) => e === 'die'), ['die']);
  const len = g.segs.length;
  g.step();
  assert.equal(g.segs.length, len, 'a dead snake does not move');
  assert.equal(g.turn(U), false);
});

test('the tail cell is free to enter when the tail moves on in the same step', () => {
  const g = playGame();
  // a snake of 4 curled into a square: the head is right next to the tail's cell
  g.load({
    segs: [
      { x: 5, y: 5, d: R },
      { x: 5, y: 4, d: U },
      { x: 4, y: 4, d: L },
      { x: 4, y: 5, d: D }
    ],
    size: 4,
    dir: D,
    apple: null
  });
  g.turn(R); // head (4,5) -> (5,5) = the tail cell
  g.step();
  assert.equal(g.phase, 'play');
  checkInvariants(g);
  assert.deepEqual([g.head().x, g.head().y], [5, 5]);
});

test('the tail cell is deadly while the snake is still growing', () => {
  const g = playGame();
  g.load({
    segs: [
      { x: 5, y: 5, d: R },
      { x: 5, y: 4, d: U },
      { x: 4, y: 4, d: L },
      { x: 4, y: 5, d: D }
    ],
    size: 5, // one cell of growth pending: the tail stays where it is
    dir: D,
    apple: null
  });
  g.turn(R);
  g.step();
  assert.equal(g.phase, 'dead');
});

// --- eating -----------------------------------------------------------------------------------------

test('eating an apple: score, growth on the next step, a new apple elsewhere', () => {
  const g = playGame(3, 4);
  g.load({ segs: line(10, 5, 9), size: 9, apple: { x: 11, y: 5 }, score: 0 });
  g.step();
  assert.equal(g.score, config.POINTS_PER_APPLE * 4);
  assert.equal(g.size, 10);
  assert.equal(g.segs.length, 9, 'the snake grows with the step after the apple');
  assert.deepEqual(g.drainEvents(), ['eat']);
  assert.ok(g.apple && !(g.apple.x === 11 && g.apple.y === 5), 'a new apple');
  g.step();
  assert.equal(g.segs.length, 10);
  checkInvariants(g);
});

test('the score per apple is 4 times the level (level 1 = the original 4 points)', () => {
  for (let level = 1; level <= 9; level++) {
    const g = playGame(2, level);
    g.load({ segs: line(10, 5, 9), size: 9, apple: { x: 11, y: 5 } });
    g.step();
    assert.equal(g.score, 4 * level, `level ${level}`);
  }
});

test('the score is capped at 9999 (four digits, like the display)', () => {
  const g = playGame(2, 9);
  g.load({ segs: line(10, 5, 9), size: 9, apple: { x: 11, y: 5 }, score: 9990 });
  g.step();
  assert.equal(g.score, 9999);
});

/** A bot that heads for the apple but never steps onto a cell that would kill it. */
function botTurn(g, rnd) {
  const h = g.head();
  const tail = g.segs[0];
  const growing = g.segs.length + 1 <= g.size;
  const safe = [R, L, U, D].filter((d) => {
    if (d === config.OPPOSITE[g.dir]) return false;
    const nx = (h.x + config.DX[d] + config.FIELD_COLS) % config.FIELD_COLS;
    const ny = (h.y + config.DY[d] + config.FIELD_ROWS) % config.FIELD_ROWS;
    const isTail = tail.x === nx && tail.y === ny && !growing;
    return g.grid[ny * config.FIELD_COLS + nx] === 0 || isTail;
  });
  if (!safe.length) return;
  const a = g.apple;
  let want = g.dir;
  if (a) want = a.x !== h.x ? (a.x > h.x ? R : L) : a.y > h.y ? D : U;
  const pick = safe.includes(want) && rnd() < 0.9 ? want : safe[Math.floor(rnd() * safe.length)];
  g.queue.length = 0;
  g.turn(pick);
}

test('apples always appear on the lattice and never on the snake', () => {
  let eaten = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const g = playGame(seed, 9);
    const rnd = mulberry32(seed + 500);
    for (let i = 0; i < 2500 && g.phase === 'play'; i++) {
      botTurn(g, rnd);
      const before = g.score;
      g.step();
      if (g.score > before) eaten++;
      checkInvariants(g, `seed ${seed} step ${i}`);
    }
  }
  assert.ok(eaten >= 100, `the steering bot ate plenty of apples (${eaten})`);
});

// --- the bonus bug ----------------------------------------------------------------------------------

function feedApples(g, n) {
  // eat n apples by teleporting the apple in front of the head
  for (let i = 0; i < n; i++) {
    const h = g.head();
    const d = h.d;
    const nx = (h.x + config.DX[d] + config.FIELD_COLS) % config.FIELD_COLS;
    const ny = (h.y + config.DY[d] + config.FIELD_ROWS) % config.FIELD_ROWS;
    if (nx >= config.APPLE_COLS || ny >= config.APPLE_ROWS) { g.step(); i--; continue; }
    g.apple = { x: nx, y: ny };
    g.step();
  }
}

test('a bonus bug appears after every fifth apple, two cells wide, with a full timer', () => {
  const g = playGame(11, 4);
  g.load({ segs: line(12, 2, 9), size: 9, apple: null });
  feedApples(g, 4);
  assert.equal(g.bonus, null);
  feedApples(g, 1);
  assert.ok(g.bonus, 'bonus after the fifth apple');
  assert.equal(g.bonus.ticks, config.BONUS_TICKS);
  assert.ok(g.drainEvents().includes('bonusSpawn'));
  checkInvariants(g);
});

test('the bonus times out after BONUS_TICKS steps', () => {
  const g = playGame(12, 4);
  g.load({ segs: line(12, 2, 9), size: 9, apple: null, bonus: { x: 14, y: 8, ticks: 3 } });
  g.step(); assert.equal(g.bonus.ticks, 2);
  g.step(); assert.equal(g.bonus.ticks, 1);
  g.step();
  assert.equal(g.bonus, null);
  assert.ok(g.drainEvents().includes('bonusExpire'));
});

test('eating the bonus: points by the time left, no growth, either of its two cells counts', () => {
  for (const headX of [10, 11]) {
    // the bug occupies x = 11 and 12 on the snake's row; entering from x = 10 hits the first cell,
    // entering from x = 11 (head already on the first cell column -> comes from the far side) the second
    const g = playGame(13, 4);
    const fromLeft = headX === 10;
    const segs = fromLeft ? line(10, 5, 9) : line(13, 5, 9, L);
    g.load({ segs, size: 9, apple: { x: 2, y: 2 }, bonus: { x: 11, y: 5, ticks: 40 }, score: 0 });
    const size = g.size;
    g.step();
    assert.equal(g.bonus, null, 'bonus eaten');
    assert.equal(g.size, size, 'the bonus does not make the snake longer');
    assert.equal(g.score, 4 * (config.BONUS_BASE + 10));
    assert.ok(g.drainEvents().includes('bonus'));
    checkInvariants(g);
  }
});

test('bonus value shrinks with the remaining time', () => {
  const g = playGame(14, 4);
  g.load({ segs: line(12, 2, 9), size: 9, apple: null, bonus: { x: 14, y: 8, ticks: 56 } });
  const full = g.bonusValue();
  g.bonus.ticks = 4;
  assert.ok(g.bonusValue() < full);
  assert.equal(full, 4 * (config.BONUS_BASE + 14));
});

test('only one bonus bug at a time', () => {
  const g = playGame(15, 4);
  g.load({ segs: line(12, 2, 9), size: 9, apple: null, bonus: { x: 14, y: 8, ticks: 50 }, sinceBonus: 4 });
  feedApples(g, 1);
  assert.equal(g.bonus.x, 14, 'the existing bug stays, no second one');
});

// --- the end of the board ------------------------------------------------------------------------------

test('a full board ends the game as cleared', () => {
  const g = playGame(16, 4);
  // The snake covers every cell of the apple lattice but one (the apple). Its tail sits in the extra
  // column outside the lattice, so after eating the last apple no free lattice cell is left.
  const cells = [{ x: config.APPLE_COLS, y: 0 }]; // (20, 0): outside the lattice
  for (let y = 0; y < config.APPLE_ROWS; y++) {
    for (let k = 0; k < config.APPLE_COLS; k++) {
      const x = y % 2 === 0 ? config.APPLE_COLS - 1 - k : k; // row 0 runs right to left, row 1 left to right, ...
      cells.push({ x, y });
    }
  }
  const apple = cells.pop(); // the last lattice cell stays free: it is the apple
  const segs = cells.map((c, i) => {
    if (i === 0) return { x: c.x, y: c.y, d: L };
    const p = cells[i - 1];
    const dx = c.x - p.x, dy = c.y - p.y;
    return { x: c.x, y: c.y, d: dx === 1 ? R : dx === -1 ? L : dy === 1 ? D : U };
  });
  const head = segs[segs.length - 1];
  const dir = head.d;
  assert.deepEqual([head.x + config.DX[dir], head.y + config.DY[dir]], [apple.x, apple.y], 'the path ends right before the apple');
  g.load({ segs, size: segs.length, dir, apple });
  checkInvariants(g, 'full board setup');
  g.step();
  assert.equal(g.phase, 'cleared');
  assert.ok(g.drainEvents().includes('cleared'));
});

// --- configuration -------------------------------------------------------------------------------------

test('nine levels, every level faster than the one before', () => {
  assert.equal(config.STEP_MS.length, 9);
  for (let i = 1; i < 9; i++) assert.ok(config.STEP_MS[i] < config.STEP_MS[i - 1]);
  assert.ok(config.DEFAULT_LEVEL >= 1 && config.DEFAULT_LEVEL <= 9);
});

test('the level is clamped to 1..9', () => {
  assert.equal(new Game({ level: 0 }).level, 1);
  assert.equal(new Game({ level: 12 }).level, 9);
});

test('same seed, same game', () => {
  const run = (seed) => {
    const g = playGame(seed, 5);
    const out = [];
    const rnd = mulberry32(seed + 100);
    for (let i = 0; i < 300 && g.phase === 'play'; i++) {
      g.turn([R, L, U, D][Math.floor(rnd() * 4)]);
      g.step();
      out.push([g.head().x, g.head().y, g.score]);
    }
    return JSON.stringify(out);
  };
  assert.equal(run(9), run(9));
  assert.notEqual(run(9), run(10));
});

// --- fuzz -----------------------------------------------------------------------------------------------

test('fuzz: invariants hold over many random games', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const g = newGame(seed, 1 + (seed % 9));
    const rnd = mulberry32(seed * 7);
    for (let i = 0; i < 1500 && !g.isOver(); i++) {
      if (rnd() < 0.3) g.turn([R, L, U, D][Math.floor(rnd() * 4)]);
      g.step();
      checkInvariants(g, `seed ${seed} step ${i}`);
    }
  }
});
