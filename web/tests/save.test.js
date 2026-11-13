'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var Save = require('../js/save.js');
var Phone = require('../js/phone.js');
var Rng = require('../js/rng.js');
var Engine = require('../js/engine.js');
var Store = require('../js/store.js');

function memoryStorage() {
  var values = {};
  return {
    getItem: function (key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem: function (key, value) { values[key] = value; },
    removeItem: function (key) { delete values[key]; }
  };
}

test('save wraps snapshots, rejects bad versions and tolerates storage errors', function () {
  var storage = memoryStorage();
  var save = Save.create({ storage: storage, key: 'unit' });
  var snap = { hello: [1, 2] };
  save.write(snap);
  assert.deepEqual(save.load(), snap);
  storage.setItem('unit', '{');
  assert.equal(save.load(), null);
  storage.setItem('unit', JSON.stringify({ v: 9, phone: snap }));
  assert.equal(save.load(), null);
  var bad = { setItem: function () { throw new Error('quota'); }, getItem: function () { throw new Error('blocked'); }, removeItem: function () { throw new Error('blocked'); } };
  assert.doesNotThrow(function () { var x = Save.create({ storage: bad }); x.write(snap); x.load(); x.clear(); });
});

test('phone snapshots survive JSON and invalid restores leave state unchanged', function () {
  var phone = new Phone({ skipSplash: true, rng: new Rng(77) });
  phone.startGame();
  phone.advance(31);
  var snap = JSON.parse(JSON.stringify(phone.snapshot()));
  var restored = new Phone({ skipSplash: true, rng: new Rng(1) });
  assert.equal(restored.restore(snap), true);
  assert.equal(restored.mode, 'menu');
  assert.equal(restored.paused, true);
  assert.equal(restored.menu.items[0], restored.mainItems()[0]);
  restored.press('select');
  assert.equal(restored.dueTick, snap.remainingTick);
  var before = JSON.stringify(restored.snapshot());
  assert.equal(restored.restore({ version: 1 }), false);
  assert.equal(JSON.stringify(restored.snapshot()), before);
});

test('an autosaved running game resumes with the same tick and crash blink deadlines', function () {
  var source = new Phone({ skipSplash: true, rng: new Rng(31) });
  source.startGame();
  source.advance(123);
  var saved = JSON.parse(JSON.stringify(source.snapshot()));
  var restored = new Phone({ skipSplash: true, rng: new Rng(1) });
  assert.equal(restored.restore(saved), true);
  restored.press('select');
  assert.equal(restored.dueTick, saved.remainingTick);

  source.game.crash = 1;
  source.blinksLeft = 5;
  source.dueBlink = source.time + 80;
  source.dueTick = source.time + 2100;
  source.advance(25);
  saved = JSON.parse(JSON.stringify(source.snapshot()));
  restored = new Phone({ skipSplash: true, rng: new Rng(2) });
  assert.equal(restored.restore(saved), true);
  restored.press('select');
  assert.equal(restored.dueBlink, saved.remainingBlink);
  assert.equal(restored.dueTick, saved.remainingTick);
  assert.equal(restored.blinksLeft, 5);
});

test('engine restores deterministic state and rejects out of field coordinates', function () {
  var rng = new Rng(913), original = new Engine.Game({ level: 5, maze: 4, rng: rng });
  var inputs = [11, 15, 17, 13, 10, 18, 20, 22];
  for (var i = 0; i < 45; i++) { original.key(inputs[i % inputs.length]); original.tick(); }
  var snap = JSON.parse(JSON.stringify(original.snapshot()));
  var resumed = Engine.Game.restore(snap, new Rng(1));
  assert.ok(resumed);
  for (i = 0; i < 120; i++) {
    if (i % 3 === 0) { original.key(inputs[(i + 2) % inputs.length]); resumed.key(inputs[(i + 2) % inputs.length]); }
    assert.equal(resumed.tick(), original.tick());
    assert.deepEqual(resumed.snapshot(), original.snapshot());
  }
  snap.snake[0].x = 20;
  assert.equal(Engine.Game.restore(snap, new Rng(1)), null);
});

test('transient screens return to menu and the timed dying phase is resumable', function () {
  var phone = new Phone({ rng: new Rng(3) });
  var restore = new Phone({ rng: new Rng(4) });
  assert.equal(restore.restore(phone.snapshot()), true);
  assert.equal(restore.mode, 'menu');
  phone.startGame(); phone.game.crash = 2;
  assert.equal(restore.restore(phone.snapshot()), true);
  assert.ok(restore.game);
  assert.equal(restore.paused, true);
  restore.press('select');
  assert.equal(restore.mode, 'game');
  assert.equal(restore.game.crash, 2);
  phone.game = null;
  phone.mode = 'fireworks';
  assert.equal(restore.restore(phone.snapshot()), true);
  assert.equal(restore.mode, 'menu');
});

test('restored phones match continued frames across levels and mazes', function () {
  for (var level = 1; level <= 9; level++) {
    for (var mi = 0; mi < 3; mi++) {
      var maze = [1, 3, 6][mi], seed = level * 900 + maze;
      var store = Store.create(null); store.level = level; store.maze = maze;
      var a = new Phone({ store: store, rng: new Rng(seed), skipSplash: true });
      a.startGame(); a.advance(137); a.press('c');
      var saved = JSON.parse(JSON.stringify(a.snapshot()));
      var b = new Phone({ store: Store.create(null), rng: new Rng(1), skipSplash: true });
      assert.equal(b.restore(saved), true);
      a.press('select'); b.press('select');
      var script = seed;
      for (var step = 0; step < 45; step++) {
        script = (script * 1103515245 + 12345) >>> 0;
        var keys = ['2', '4', '6', '8', '1', '3', '7', '9', '5'];
        if (step % 4 === 0) { a.press(keys[script % keys.length]); b.press(keys[script % keys.length]); }
        var ms = 70 + (script % 370);
        a.advance(ms); b.advance(ms);
        assert.equal(a.game ? a.game.score : null, b.game ? b.game.score : null);
        assert.equal(a.mode, b.mode);
        assert.equal(a.draw().equals(b.draw()), true);
      }
    }
  }
});

test('autosave coalesces writes and flushes immediately', function () {
  var clock = 0, jobs = [], writes = [];
  function setTimeoutFake(fn, ms) { var job = { fn: fn, due: clock + ms, dead: false }; jobs.push(job); return job; }
  function clearTimeoutFake(job) { job.dead = true; }
  function advance(ms) {
    clock += ms;
    var run;
    do {
      run = null;
      for (var i = 0; i < jobs.length; i++) if (!jobs[i].dead && jobs[i].due <= clock) { run = jobs[i]; break; }
      if (run) { run.dead = true; run.fn(); }
    } while (run);
  }
  var phone = { mode: 'menu', inGame: function () { return this.mode === 'game'; }, snapshot: function () { return { t: clock }; } };
  var save = { write: function (s) { writes.push({ at: clock, snap: s }); } };
  var auto = Save.autosave({ phone: phone, save: save, now: function () { return clock; }, setTimeout: setTimeoutFake, clearTimeout: clearTimeoutFake });
  auto.touch(); auto.touch(); advance(0); assert.equal(writes.length, 1);
  auto.touch(); advance(499); assert.equal(writes.length, 1);
  advance(1); assert.equal(writes.length, 2);
  auto.touch(); advance(200); auto.flush(); assert.equal(writes.length, 3);
  auto.stop();
});
