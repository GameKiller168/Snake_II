'use strict';

/*
 * Keys: which computer key is which key of the phone. This mapping is a convenience of the web page, not something
 * of the original, but it must be stable and it must not swallow the browser's own shortcuts.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const Input = require('../js/input.js');

test('in the game the arrow keys and W A S D steer: 2 4 6 8', () => {
  const want = { ArrowUp: '2', ArrowLeft: '4', ArrowRight: '6', ArrowDown: '8', w: '2', a: '4', d: '6', s: '8' };
  Object.keys(want).forEach((k) => assert.equal(Input.keyFor(k, true), want[k], k));
});

test('capital letters work as small ones', () => {
  assert.equal(Input.keyFor('W', true), '2');
  assert.equal(Input.keyFor('A', true), '4');
  assert.equal(Input.keyFor('S', false), 'scrollDown');
  assert.equal(Input.keyFor('C', false), 'c');
});

test('in the game the digits 1..9 are the phone keys of the same name', () => {
  for (let d = 1; d <= 9; d++) assert.equal(Input.keyFor(String(d), true), String(d));
  assert.equal(Input.keyFor('0', true), null);
});

test('outside the game up and down (and W S) scroll, left and right do nothing', () => {
  assert.equal(Input.keyFor('ArrowUp', false), 'scrollUp');
  assert.equal(Input.keyFor('ArrowDown', false), 'scrollDown');
  assert.equal(Input.keyFor('w', false), 'scrollUp');
  assert.equal(Input.keyFor('s', false), 'scrollDown');
  assert.equal(Input.keyFor('ArrowLeft', false), null);
  assert.equal(Input.keyFor('ArrowRight', false), null);
  assert.equal(Input.keyFor('a', false), null);
  assert.equal(Input.keyFor('d', false), null);
  assert.equal(Input.keyFor('5', false), null);
});

test('Enter and Space select, Backspace, Escape and C are the C key - in the game as well', () => {
  [true, false].forEach((g) => {
    assert.equal(Input.keyFor('Enter', g), 'select');
    assert.equal(Input.keyFor(' ', g), 'select');
    assert.equal(Input.keyFor('Backspace', g), 'c');
    assert.equal(Input.keyFor('Escape', g), 'c');
    assert.equal(Input.keyFor('c', g), 'c');
  });
});

test('other keys are none of the phone\'s business', () => {
  ['x', 'F5', 'Tab', 'Shift', 'F1', 'Home', '+', ''].forEach((k) => {
    assert.equal(Input.keyFor(k, true), null, JSON.stringify(k));
    assert.equal(Input.keyFor(k, false), null, JSON.stringify(k));
  });
});

test('physical numpad positions map consistently in and out of the game', () => {
  const map = { Numpad8: ['2', 'scrollUp'], Numpad2: ['8', 'scrollDown'], Numpad4: ['4', null],
    Numpad6: ['6', null], Numpad5: ['select', 'select'], NumpadEnter: ['select', 'select'],
    Numpad7: ['1', null], Numpad9: ['3', null], Numpad1: ['7', null], Numpad3: ['9', null],
    NumpadDecimal: [null, null], NumpadAdd: [null, null] };
  Object.keys(map).forEach((code) => {
    assert.equal(Input.keyForEvent({ key: code, code }, true), map[code][0], code + ' in game');
    assert.equal(Input.keyForEvent({ key: code, code }, false), map[code][1], code + ' out of game');
  });
  assert.equal(Input.keyForEvent({ key: 'ArrowUp', code: 'Numpad8' }, true), '2');
  assert.equal(Input.keyForEvent({ key: 'ArrowUp', code: 'Numpad8' }, false), 'scrollUp');
});

test('physical WASD positions override keyboard layout and digit row stays unchanged', () => {
  const map = { KeyW: ['2', 'scrollUp'], KeyA: ['4', null], KeyS: ['8', 'scrollDown'], KeyD: ['6', null] };
  Object.keys(map).forEach((code) => {
    assert.equal(Input.keyForEvent({ key: 'z', code }, true), map[code][0]);
    assert.equal(Input.keyForEvent({ key: 'z', code }, false), map[code][1]);
  });
  for (let d = 1; d <= 9; d++) {
    assert.equal(Input.keyForEvent({ key: String(d), code: 'Digit' + d }, true), String(d));
    assert.equal(Input.keyForEvent({ key: String(d), code: 'Digit' + d }, false), null);
  }
});

// ----- the listeners, with a stand-in for the page -----------------------------------------------------------------------------

function withPage(fn) {
  const handlers = {};
  const doc = {
    addEventListener(type, f) { (handlers[type] = handlers[type] || []).push(f); },
    fire(type, ev) { (handlers[type] || []).forEach((f) => f(ev)); }
  };
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'document');
  const old = globalThis.document;
  globalThis.document = doc;
  try { return fn(doc); } finally { if (had) globalThis.document = old; else delete globalThis.document; }
}

function keyEvent(key, extra) {
  const ev = Object.assign({ key, ctrlKey: false, metaKey: false, altKey: false, repeat: false, prevented: false }, extra);
  ev.preventDefault = () => { ev.prevented = true; };
  return ev;
}

test('a key down is passed on once and the browser does not get it', () => {
  withPage((doc) => {
    const got = [];
    Input.attach({ inGame: () => false, onPress: (k) => got.push(k) });
    const e = keyEvent('Enter');
    doc.fire('keydown', e);
    assert.deepEqual(got, ['select']);
    assert.equal(e.prevented, true);
  });
});

test('a held key does not repeat, but the browser still does not get it', () => {
  withPage((doc) => {
    const got = [];
    Input.attach({ inGame: () => true, onPress: (k) => got.push(k) });
    const e = keyEvent('ArrowLeft', { repeat: true });
    doc.fire('keydown', e);
    assert.deepEqual(got, []);
    assert.equal(e.prevented, true);
  });
});

test('shortcuts with Ctrl, Cmd or Alt and keys the phone does not know are left to the browser', () => {
  withPage((doc) => {
    const got = [];
    Input.attach({ inGame: () => false, onPress: (k) => got.push(k) });
    [keyEvent('c', { ctrlKey: true }), keyEvent('c', { metaKey: true }), keyEvent('ArrowDown', { altKey: true }),
      keyEvent('F5'), keyEvent('x')].forEach((e) => {
      doc.fire('keydown', e);
      assert.equal(e.prevented, false, e.key);
    });
    assert.deepEqual(got, []);
  });
});

test('whether a key steers or scrolls is asked at the moment of the key', () => {
  withPage((doc) => {
    let inGame = false;
    const got = [];
    Input.attach({ inGame: () => inGame, onPress: (k) => got.push(k) });
    doc.fire('keydown', keyEvent('ArrowUp'));
    doc.fire('keyup', keyEvent('ArrowUp'));
    inGame = true;
    doc.fire('keydown', keyEvent('ArrowUp'));
    assert.deepEqual(got, ['scrollUp', '2']);
  });
});

test('the on-screen pad: pressing a button sends its key and lights it while it is down', () => {
  withPage(() => {
    const handlers = {};
    const classes = new Set();
    const button = {
      getAttribute: (n) => (n === 'data-key' ? 'scrollDown' : null),
      classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) }
    };
    const pad = {
      addEventListener(type, f) { handlers[type] = f; },
      contains: () => true
    };
    const got = [];
    Input.attach({ inGame: () => false, onPress: (k) => got.push(k), pad });
    const target = { closest: () => button };
    const down = { target, prevented: false, preventDefault() { this.prevented = true; } };
    handlers.pointerdown(down);
    assert.deepEqual(got, ['scrollDown']);
    assert.equal(down.prevented, true);
    assert.ok(classes.has('down'));
    handlers.pointerup({ target });
    assert.ok(!classes.has('down'));
    handlers.pointerdown(down);
    handlers.pointerout({ target });
    assert.ok(!classes.has('down'));
    assert.deepEqual(got, ['scrollDown', 'scrollDown']);
  });
});

test('the pad ignores presses that are not on a key', () => {
  withPage(() => {
    const handlers = {};
    const pad = { addEventListener(type, f) { handlers[type] = f; }, contains: () => true };
    const got = [];
    Input.attach({ inGame: () => false, onPress: (k) => got.push(k), pad });
    handlers.pointerdown({ target: { closest: () => null }, preventDefault() { throw new Error('must not be prevented'); } });
    assert.deepEqual(got, []);
  });
});

test('keyboard press and release pair, repeat and modifiers do not create extra presses', () => {
  withPage((doc) => {
    const got = [], released = [];
    Input.attach({ inGame: () => true, onPress: (k) => got.push(k), onRelease: (k) => released.push(k) });
    doc.fire('keydown', keyEvent('ArrowUp', { code: 'ArrowUp' }));
    doc.fire('keydown', keyEvent('ArrowUp', { code: 'ArrowUp', repeat: true }));
    doc.fire('keydown', keyEvent('ArrowUp', { code: 'ArrowUp', ctrlKey: true }));
    assert.deepEqual(got, ['2']);
    doc.fire('keyup', keyEvent('ArrowUp', { code: 'ArrowUp' }));
    assert.deepEqual(released, ['2']);
  });
});

test('keyboard down class and blur release held keys', () => {
  withPage((doc) => {
    const winHandlers = {}, classes = new Set(), released = [];
    const button = { getAttribute: () => '2', classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) } };
    const pad = { addEventListener() {}, querySelector: () => button };
    const had = Object.prototype.hasOwnProperty.call(globalThis, 'window'), old = globalThis.window;
    globalThis.window = { addEventListener(type, f) { winHandlers[type] = f; } };
    try {
      Input.attach({ inGame: () => true, onPress() {}, onRelease: (k) => released.push(k), pad });
      doc.fire('keydown', keyEvent('ArrowUp', { code: 'ArrowUp' }));
      assert.ok(classes.has('down'));
      winHandlers.blur();
      assert.ok(!classes.has('down'));
      assert.deepEqual(released, ['2']);
    } finally { if (had) globalThis.window = old; else delete globalThis.window; }
  });
});
