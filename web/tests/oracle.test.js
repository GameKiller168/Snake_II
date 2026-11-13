'use strict';

/*
 * The engine against the real program.
 *
 * fixtures/traces.json holds conversations with the program of a Nokia 3310 (Snake II): the messages that were
 * sent to it and, after every one of them, the return code, the delays, the event code, the score and a CRC of
 * the complete 84 x 48 picture. They were recorded by running the real program in an emulator while a bot played
 * all nine levels and all six mazes, with deliberate crashes, turns during the grace time, bonus creatures that
 * were eaten or ran away, and snakes whose slot numbers wrapped around the end of the program's ring buffer.
 * The engine must reproduce every single number.
 *
 * fixtures/placement.json does the same for the two random placement routines (apple, bonus creature) on fields
 * from empty to full.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { replay } = require('./support/replay.js');
require('../js/config.js');
const Rng = require('../js/rng.js');
const Engine = require('../js/engine.js');

const traces = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'traces.json'), 'utf8')).traces;
const placement = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'placement.json'), 'utf8')).cases;

test('the fixtures are big enough to mean something', () => {
  assert.ok(traces.length >= 80);
  const steps = traces.reduce((n, t) => n + t.msgs.length, 0);
  assert.ok(steps >= 25000, `${steps} messages`);
  const levels = new Set(traces.map((t) => t.level));
  const mazes = new Set(traces.map((t) => t.maze));
  assert.equal(levels.size, 9);
  assert.equal(mazes.size, 6);
});

traces.forEach((t, i) => {
  test(`trace ${i}: level ${t.level}, maze ${t.maze}, seed ${t.seed}, ${t.msgs.length} messages`, () => {
    const d = replay(t);
    if (d) {
      assert.fail(`message ${d.step} (${d.msg}): ${d.field} should be ${d.want}, is ${d.got}\n${d.fb.toAscii()}`);
    }
  });
});

const W = 20, H = 9;

function fieldOf(c) {
  const g = new Engine.Game({ level: 1, maze: 1, rng: new Rng(1) });
  const n = BigInt('0x' + c.occ);
  for (let i = 0; i < W * H; i++) g.occ[i] = Number((n >> BigInt(i)) & 1n);
  g.rng.seed = c.seed;
  return g;
}

test('apple placement: 220 fields from empty to full', () => {
  let n = 0;
  for (const c of placement) {
    if (c.kind !== 'apple') continue;
    const g = fieldOf(c);
    for (let i = 0; i < 4; i++) g.cells[i] = { x: c.cells[2 * i], y: c.cells[2 * i + 1] };
    g.placeApple();
    assert.deepEqual([g.apple.x, g.apple.y], c.apple, `case ${n}`);
    assert.equal(g.rng.seed, c.seed2, `random numbers used, case ${n}`);
    n++;
  }
  assert.ok(n >= 200);
});

test('bonus creature placement: 220 fields from empty to full', () => {
  let n = 0;
  for (const c of placement) {
    if (c.kind !== 'spawn') continue;
    const g = fieldOf(c);
    g.apple = { x: c.apple[0], y: c.apple[1] };
    const ok = g.spawnCreature();
    const cells = [];
    for (let i = 0; i < 4; i++) cells.push(g.cells[i].x, g.cells[i].y);
    assert.equal(ok ? 1 : 0, c.ok, `case ${n}`);
    assert.deepEqual(cells, c.cells, `cells, case ${n}`);
    assert.equal(g.creature.type, c.type, `picture, case ${n}`);
    assert.equal(g.rng.seed, c.seed2, `random numbers used, case ${n}`);
    n++;
  }
  assert.ok(n >= 200);
});
