'use strict';

/*
 * What the phone keeps: level, maze and top score. The browser's storage may be missing, full, blocked or hold
 * rubbish; none of that may ever stop the game.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const Config = require('../js/config.js');
const Store = require('../js/store.js');

function memoryBackend(initial) {
  const m = new Map(initial ? Object.entries(initial) : []);
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
}

test('the phone starts on the default level, with "No maze" and no top score', () => {
  const s = Store.create(null);
  assert.equal(s.level, Config.DEFAULT_LEVEL);
  assert.equal(s.level, 1);
  assert.equal(s.maze, 1);
  assert.equal(s.top, 0);
});

test('values are kept in memory when there is no storage at all', () => {
  const s = Store.create(null);
  s.level = 7; s.maze = 4; s.top = 123;
  assert.deepEqual([s.level, s.maze, s.top], [7, 4, 123]);
});

test('out of range values are refused, the old value stays', () => {
  const s = Store.create(null);
  s.level = 4; s.maze = 3; s.top = 50;
  s.level = 0; s.maze = 0; s.top = -1;
  assert.deepEqual([s.level, s.maze, s.top], [4, 3, 50]);
  s.level = 10; s.maze = 7; s.top = NaN;
  assert.deepEqual([s.level, s.maze, s.top], [4, 3, 50]);
  s.level = 'x'; s.maze = undefined; s.top = null;
  assert.deepEqual([s.level, s.maze, s.top], [4, 3, 0]);   // Number(null) is 0, a legal top score
});

test('the limits themselves are fine: levels 1..9, mazes 1..6', () => {
  const s = Store.create(null);
  [1, 9].forEach((v) => { s.level = v; assert.equal(s.level, v); });
  [1, 6].forEach((v) => { s.maze = v; assert.equal(s.maze, v); });
  s.top = 0; assert.equal(s.top, 0);
});

test('fractions are cut off', () => {
  const s = Store.create(null);
  s.level = 5.9; s.top = 12.7;
  assert.equal(s.level, 5);
  assert.equal(s.top, 12);
});

test('values survive a restart through the storage', () => {
  const b = memoryBackend();
  const s = Store.create(b);
  s.level = 6; s.maze = 5; s.top = 2048;
  assert.ok(b.m.has(Store.KEY));
  const again = Store.create(b);
  assert.deepEqual([again.level, again.maze, again.top], [6, 5, 2048]);
});

test('rubbish in the storage means the defaults', () => {
  ['', '{', 'null', '[]', '"x"', '42'].forEach((raw) => {
    const s = Store.create(memoryBackend({ [Store.KEY]: raw }));
    assert.deepEqual([s.level, s.maze, s.top], [1, 1, 0], JSON.stringify(raw));
  });
});

test('single bad fields are replaced, the good ones are kept', () => {
  const s = Store.create(memoryBackend({ [Store.KEY]: JSON.stringify({ level: 99, maze: 3, top: -5 }) }));
  assert.deepEqual([s.level, s.maze, s.top], [1, 3, 0]);
  const t = Store.create(memoryBackend({ [Store.KEY]: JSON.stringify({ level: 3, maze: 'a', top: 10 }) }));
  assert.deepEqual([t.level, t.maze, t.top], [3, 1, 10]);
});

test('a storage that throws never gets in the way', () => {
  const boom = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
  const s = Store.create(boom);
  s.level = 8; s.top = 77;
  assert.equal(s.level, 8);
  assert.equal(s.top, 77);
});

test('without an argument the browser\'s localStorage is used, if there is one', () => {
  const b = memoryBackend();
  Object.defineProperty(globalThis, 'localStorage', { value: b, configurable: true, writable: true });
  try {
    const s = Store.create();
    s.top = 9;
    assert.equal(JSON.parse(b.m.get(Store.KEY)).top, 9);
  } finally {
    delete globalThis.localStorage;
  }
});

test('without an argument and without localStorage (or when looking at it throws) the values live in memory', () => {
  assert.equal(typeof globalThis.localStorage, 'undefined');
  const s = Store.create();
  s.level = 3;
  assert.equal(s.level, 3);
  Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('SecurityError'); }, configurable: true });
  try {
    const t = Store.create();
    t.level = 5;
    assert.equal(t.level, 5);
  } finally {
    delete globalThis.localStorage;
  }
});
