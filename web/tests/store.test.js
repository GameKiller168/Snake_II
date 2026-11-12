'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../js/config.js');
const Store = require('../js/store.js');

/** A Storage-like object backed by a Map. */
function fakeStorage() {
  const m = new Map();
  return {
    m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); }
  };
}

test('defaults without anything stored', () => {
  const s = Store.create(fakeStorage());
  assert.equal(s.getLevel(), config.DEFAULT_LEVEL);
  assert.equal(s.getBest(1), 0);
  assert.equal(s.get('sound', 'on'), 'on');
});

test('values survive a new store on the same storage', () => {
  const backend = fakeStorage();
  const a = Store.create(backend);
  a.setLevel(7);
  a.setBest(7, 420);
  a.set('skin', 'lcd');
  const b = Store.create(backend);
  assert.equal(b.getLevel(), 7);
  assert.equal(b.getBest(7), 420);
  assert.equal(b.getBest(6), 0, 'best scores are per level');
  assert.equal(b.get('skin', 'neon'), 'lcd');
});

test('garbage in the storage is ignored or clamped', () => {
  const backend = fakeStorage();
  const s = Store.create(backend);
  for (const k of [...backend.m.keys()]) backend.m.delete(k);
  backend.setItem('snake2.v2.level', 'banana');
  assert.equal(s.getLevel(), config.DEFAULT_LEVEL);
  backend.setItem('snake2.v2.level', '99');
  assert.equal(s.getLevel(), 9);
  backend.setItem('snake2.v2.level', '-3');
  assert.equal(s.getLevel(), 1);
  backend.setItem('snake2.v2.best.4', '123456789');
  assert.equal(s.getBest(4), config.MAX_SCORE);
  backend.setItem('snake2.v2.best.4', '-5');
  assert.equal(s.getBest(4), 0);
});

test('a storage that throws never breaks the game: values live in memory', () => {
  const angry = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); }
  };
  const s = Store.create(angry);
  assert.equal(s.getLevel(), config.DEFAULT_LEVEL);
  s.setLevel(2);
  s.setBest(2, 88);
  s.set('lang', 'hu');
  assert.equal(s.getLevel(), 2);
  assert.equal(s.getBest(2), 88);
  assert.equal(s.get('lang', 'en'), 'hu');
});

test('no storage at all works too', () => {
  const s = Store.create(null);
  s.setBest(3, 12);
  assert.equal(s.getBest(3), 12);
});

test('best scores are capped at the display maximum', () => {
  const s = Store.create(null);
  s.setBest(1, 123456);
  assert.equal(s.getBest(1), config.MAX_SCORE);
});
