'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Config = require('../js/config.js');
const Engine = require('../js/engine.js');
const Rng = require('../js/rng.js');
const Control = require('../js/control.js');
const Store = require('../js/store.js');
const Phone = require('../js/phone.js');
const Input = require('../js/input.js');

function lcg(seed) {
  let x = seed;
  return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x80000000; };
}

test('route search completes the supported layouts', () => {
  const count = { 1: 180, 2: 126, 3: 158, 4: 151, 6: 122 };
  assert.deepEqual(Control.MAZES, [1, 2, 3, 4, 6]);
  for (const maze of Control.MAZES) {
    for (let seed = 1; seed <= 2; seed++) {
      const game = new Engine.Game({ level: 9, maze, rng: new Rng(seed * 7189 + maze) });
      const control = Control.create(game, lcg(seed * 31 + maze));
      const placeApple = game.placeApple;
      let ret, moves = 0;
      while (moves++ < 20000) {
        assert.notEqual(control.step(), -1, `maze ${maze}, seed ${seed}`);
        ret = game.tick();
        assert.notEqual(ret, Engine.RET.RECOVER, `maze ${maze}, seed ${seed}`);
        assert.notEqual(ret, Engine.RET.CRASH, `maze ${maze}, seed ${seed}`);
        if (ret === Engine.RET.OVER) break;
      }
      assert.equal(ret, Engine.RET.OVER, `maze ${maze}, seed ${seed}`);
      assert.equal(game.code, 0x22);
      assert.equal(game.snake.length, count[maze]);
      assert.equal(game.placeApple, placeApple);
    }
  }
});

test('route search stays alive in the constrained layout', () => {
  for (let seed = 1; seed <= 3; seed++) {
    const game = new Engine.Game({ level: 9, maze: 5, rng: new Rng(seed * 7189) });
    const control = Control.create(game, lcg(seed));
    let max = 0;
    for (let i = 0; i < 6000; i++) {
      assert.notEqual(control.step(), -1, `seed ${seed}, step ${i}`);
      const ret = game.tick();
      assert.notEqual(ret, Engine.RET.RECOVER);
      assert.notEqual(ret, Engine.RET.CRASH);
      assert.notEqual(ret, Engine.RET.OVER);
      max = Math.max(max, game.snake.length);
    }
    assert.ok(max >= 30, `seed ${seed}: ${max}`);
  }
});

test('route search takes the straight way when it is free', () => {
  for (const [dx, dy] of [[3, 0], [0, 2], [0, -2], [4, 2], [-2, 3], [5, -3]]) {
    const game = new Engine.Game({ level: 9, maze: 1, rng: new Rng(11) });
    const head = game.snake[game.snake.length - 1];
    game.apple = { x: (head.x + dx + 20) % 20, y: (head.y + dy + 9) % 9 };
    const control = Control.create(game, lcg(5));
    let ticks = 0, ret;
    do { control.step(); ret = game.tick(); ticks++; } while (ret !== Engine.RET.ATE && ticks < 40);
    assert.equal(ret, Engine.RET.ATE, `${dx},${dy}`);
    assert.equal(ticks, Math.abs(dx) + Math.abs(dy), `${dx},${dy}`);
  }
});

test('route search prefers the bonus target', () => {
  const game = new Engine.Game({ level: 9, maze: 1, rng: new Rng(21) });
  const head = game.snake[game.snake.length - 1];
  const apple = { x: head.x + 1, y: head.y + 1 }, x = head.x + 2, y = head.y - 2;
  game.apple = { ...apple };
  game.cells = [{ x, y }, { x: x + 1, y }, { x, y }, { x: x + 1, y }];
  game.active = 1; game.progress = 20;
  game.creature = { shown: true, x, y, type: 0 };
  const control = Control.create(game, lcg(3));
  let ret, ticks = 0;
  do { control.step(); ret = game.tick(); ticks++; } while (ret !== Engine.RET.ATE && ticks < 40);
  assert.equal(ret, Engine.RET.ATE);
  assert.equal(game.creature.shown, false);
  assert.deepEqual(game.apple, apple);
  assert.ok(ticks <= 5);
});

test('a temporary screen leaves a paused game, settings and score untouched', () => {
  const writes = [];
  const backend = { getItem: () => null, setItem: (k, v) => writes.push([k, v]) };
  const store = Store.create(backend);
  store.level = 4; store.maze = 3; store.top = 542;
  const phone = new Phone({ store, rng: new Rng(103), skipSplash: true });
  phone.startGame(); phone.advance(800); phone.pause(); phone.showOptions(2);
  const before = phone.snapshot(), priorRng = phone.rng.getState();
  const options = { ...phone.optionsState }, writeCount = writes.length;
  phone.press('9');
  assert.ok(phone.runtime);
  assert.equal(phone.draw().px.reduce((sum, pixel) => sum + pixel, 0), 0);
  phone.advance(1200);
  assert.ok(phone.draw().px.some(Boolean));
  phone.advance(2600);
  assert.ok(phone.runtime.child.game);
  assert.equal(phone.runtime.child.game.level, 9);
  phone.advance(5000);
  assert.deepEqual(phone.snapshot(), before);
  assert.equal(phone.rng.getState(), priorRng);
  assert.equal(writes.length, writeCount);
  phone.press('select');
  assert.equal(phone.runtime, null);
  assert.equal(phone.menu.kind, 'options');
  assert.deepEqual(phone.optionsState, options);
  assert.deepEqual(phone.snapshot(), before);
  assert.equal(writes.length, writeCount);
});

test('timed screens proceed without changing the stored score', () => {
  const store = Store.create(null); store.top = 542;
  const phone = new Phone({ store, rng: new Rng(2), skipSplash: true });
  phone.showOptions(1); phone.press('9'); phone.advance(3800);
  const child = phone.runtime.child;
  child.game.score = 999; child.game.code = 0x22;
  child.gameOver();
  assert.equal(child.mode, 'fireworks');
  phone.advance(Phone.TIMING.FIREWORKS_MS);
  assert.equal(child.mode, 'note');
  phone.advance(Phone.TIMING.NOTE_MS);
  assert.equal(child.mode, 'note');
  phone.advance(Phone.TIMING.NOTE_MS);
  assert.equal(child.mode, 'game');
  assert.equal(child.game.level, 9);
  assert.ok(child.game.mazeIndex >= 1 && child.game.mazeIndex <= 6);
  assert.equal(store.top, 542);
  phone.press('x');
  assert.equal(phone.menu.kind, 'options');
  assert.equal(phone.optionsState.c, 1);
});

test('optional key capture swallows repeats and unknown keys', () => {
  const handlers = {}, oldDocument = globalThis.document;
  globalThis.document = { addEventListener(type, f) { (handlers[type] = handlers[type] || []).push(f); } };
  try {
    let active = false;
    const pressed = [], intercepted = [];
    Input.attach({
      inGame: () => false,
      captureAll: () => active,
      additionalKey: e => e.key === '9' ? '9' : null,
      onPress: key => { pressed.push(key); active = true; },
      onAnyKey: key => { intercepted.push(key); active = false; }
    });
    function fire(type, key, extra) {
      const e = Object.assign({ key, code: key, repeat: false, ctrlKey: false, altKey: false, metaKey: false,
        prevented: false, preventDefault() { this.prevented = true; } }, extra);
      for (const f of handlers[type] || []) f(e);
      return e;
    }
    assert.equal(fire('keydown', '9').prevented, true);
    assert.deepEqual(pressed, ['9']);
    assert.equal(fire('keydown', '9', { repeat: true }).prevented, true);
    assert.deepEqual(intercepted, []);
    fire('keyup', '9');
    assert.equal(fire('keydown', 'x').prevented, true);
    assert.deepEqual(intercepted, [null]);
  } finally { globalThis.document = oldDocument; }
});

test('the display moves complete bitmap rows by one pixel and holds them still', () => {
  const phone = new Phone({ rng: new Rng(7), skipSplash: true });
  phone.showOptions(0); phone.press('9');
  phone.advance(1164);
  const first = Uint8Array.from(phone.draw().px);
  phone.advance(36);
  const second = Uint8Array.from(phone.draw().px);
  assert.ok(first.some(Boolean));
  for (let y = 1; y < Config.LCD_H; y++) {
    for (let x = 0; x < Config.LCD_W; x++) {
      assert.equal(second[y * Config.LCD_W + x], first[(y - 1) * Config.LCD_W + x]);
    }
  }
  phone.advance(1000);
  assert.deepEqual(Uint8Array.from(phone.draw().px), second);
});

test('route search reaches a nearby bonus first', () => {
  for (const maze of [1, 5]) {
    const game = new Engine.Game({ level: 4, maze, rng: new Rng(1234) });
    const head = game.snake[game.snake.length - 1];
    const direction = maze === 1 ? Config.DOWN : Config.UP;
    const x = head.x, y = (head.y + Config.DY[direction] + Config.ROWS) % Config.ROWS;
    const bonus = { x, y };
    game.apple = { x: 1, y: 1 };
    game.cells = [bonus, { x: x + 1, y }, bonus, { x: x + 1, y }];
    game.active = 1; game.progress = 20;
    game.creature = { shown: true, x, y, type: 0 };
    const control = Control.create(game);
    assert.equal(control.step(), direction, `maze ${maze}`);
    assert.equal(game.tick(), Engine.RET.ATE);
    assert.ok(game.score > game.level);
    assert.equal(game.creature.shown, false);
    assert.deepEqual(game.apple, { x: 1, y: 1 });
  }
});

test('route search follows the position of the food', () => {
  const random = Math.random;
  Math.random = () => 0.25;
  try {
    function trace(x) {
      const game = new Engine.Game({ level: 9, maze: 1, rng: new Rng(1) });
      game.apple = { x, y: 0 };
      const control = Control.create(game), moves = [];
      for (let i = 0; i < 8; i++) {
        moves.push(control.step());
        assert.equal(game.tick(), Engine.RET.STEP);
      }
      return moves;
    }
    assert.notDeepEqual(trace(0), trace(2));
  } finally { Math.random = random; }
});

test('a timed screen sequence restarts after a long idle time', () => {
  const random = Math.random;
  Math.random = () => 0.7;
  try {
    const store = Store.create(null); store.top = 542;
    const phone = new Phone({ store, rng: new Rng(4), skipSplash: true });
    phone.showOptions(0); phone.press('9'); phone.advance(3800);
    const runtime = phone.runtime, child = runtime.child;
    assert.ok(Control.MAZES.includes(child.game.mazeIndex));
    child.game.score = 200; runtime.idle = 4095;
    phone.advance(child.game.delay);
    assert.equal(child.mode, 'note');
    assert.equal(child.lastGameOver.won, false);
    phone.advance(Phone.TIMING.NOTE_MS);
    assert.equal(child.mode, 'game');
    assert.equal(child.game.level, 9);
    assert.equal(store.top, 542);
  } finally { Math.random = random; }
});

test('the layouts used are the ones with a complete route', () => {
  const random = Math.random, seen = new Set();
  try {
    for (const r of [0, 0.19, 0.2, 0.39, 0.4, 0.59, 0.6, 0.79, 0.8, 0.999]) {
      Math.random = () => r;
      const phone = new Phone({ store: Store.create(null), rng: new Rng(4), skipSplash: true });
      phone.showOptions(0); phone.press('9'); phone.advance(3800);
      seen.add(phone.runtime.child.game.mazeIndex);
    }
  } finally { Math.random = random; }
  assert.deepEqual([...seen].sort(), [1, 2, 3, 4, 6]);
});
