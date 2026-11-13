'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
require('../js/tones.js');
var Audio = require('../js/audio.js');

function FakeAudioContext() {
  this.currentTime = 10;
  this.destination = {};
  this.state = 'suspended';
  this.oscillators = [];
  this.gains = [];
    this.gainNodes = [];
  this.resumeCount = 0;
}
FakeAudioContext.prototype.resume = function () {
  this.resumeCount += 1;
  this.state = 'running';
  return Promise.resolve();
};
FakeAudioContext.prototype.createOscillator = function () {
  var oscillator = {
    type: '', frequency: { events: [], setValueAtTime: function (value, time) { this.events.push([value, time]); } },
    starts: [], stops: [], connections: [], disconnectCount: 0, onended: null,
    connect: function (node) { this.connections.push(node); },
    start: function (time) { this.starts.push(time); },
    stop: function (time) { this.stops.push(time); },
    disconnect: function () { this.disconnectCount += 1; }
  };
  this.oscillators.push(oscillator);
  return oscillator;
};
FakeAudioContext.prototype.createGain = function () {
  var gain = {
    events: [], cancelEvents: [],
    setValueAtTime: function (value, time) { this.events.push(['set', value, time]); },
    linearRampToValueAtTime: function (value, time) { this.events.push(['ramp', value, time]); },
    cancelScheduledValues: function (time) { this.cancelEvents.push(time); }
  };
  this.gains.push(gain);
  var gainNode = { gain: gain, connections: [], disconnectCount: 0,
    connect: function (node) { this.connections.push(node); },
    disconnect: function () { this.disconnectCount += 1; }
  };
  this.gainNodes.push(gainNode);
  return gainNode;
};

function contextFactory() {
  function Context() {
    FakeAudioContext.call(this);
    Context.last = this;
  }
  Context.prototype = Object.create(FakeAudioContext.prototype);
  Context.prototype.constructor = Context;
  return Context;
}

test('game scripts schedule tones at exact tick lengths and gaps', function () {
  var Context = contextFactory();
  var audio = Audio.create({ AudioContext: Context, settings: { gameSounds: true, keyTones: true } });
  var ctx;
  audio.unlock();
  ctx = Context.last;
  audio.playGame('eat');
  assert.equal(ctx.oscillators.length, 1);
  assert.equal(ctx.oscillators[0].type, 'square');
  assert.equal(ctx.oscillators[0].frequency.events[0][0], 2637);
  assert.equal(ctx.oscillators[0].starts[0], 10.005);
  assert.ok(Math.abs(ctx.oscillators[0].stops[0] - 10.01296875) < 1e-9);

  audio.playGame('crash');
  assert.equal(ctx.oscillators.length, 4);
  assert.deepEqual(ctx.oscillators.slice(1).map(function (osc) { return osc.frequency.events[0][0]; }), [440, 440, 440]);
  assert.ok(Math.abs(ctx.oscillators[2].starts[0] - ctx.oscillators[1].starts[0] - 0.031875) < 1e-9);
  assert.ok(Math.abs(ctx.oscillators[3].starts[0] - ctx.oscillators[1].starts[0] - 0.06375) < 1e-9);
  assert.ok(Math.abs(ctx.oscillators[1].stops[0] - ctx.oscillators[1].starts[0] - 0.0159375) < 1e-9);
});

test('won script includes the silent gap in the second note start', function () {
  var Context = contextFactory();
  var audio = Audio.create({ AudioContext: Context, settings: { gameSounds: true } });
  audio.unlock();
  audio.playGame('won');
  assert.equal(Context.last.oscillators.length, 2);
  assert.deepEqual(Context.last.oscillators.map(function (osc) { return osc.frequency.events[0][0]; }), [523, 784]);
  assert.ok(Math.abs(Context.last.oscillators[0].stops[0] - Context.last.oscillators[0].starts[0] - 0.11953125) < 1e-9);
  assert.ok(Math.abs(Context.last.oscillators[1].starts[0] - Context.last.oscillators[0].starts[0] - 0.1434375) < 1e-9);
});

test('DTMF key holds both frequencies and enforces an audible minimum', function () {
  var Context = contextFactory();
  var audio = Audio.create({ AudioContext: Context, settings: { keyTones: true } });
  audio.unlock();
  audio.keyDown('5');
  audio.keyDown('5');
  assert.equal(Context.last.oscillators.length, 2);
  assert.deepEqual(Context.last.oscillators.map(function (osc) { return osc.frequency.events[0][0]; }), [770, 1336]);
  assert.deepEqual(Context.last.oscillators.map(function (osc) { return osc.type; }), ['sine', 'sine']);
  audio.keyUp('5');
  assert.ok(Math.abs(Context.last.oscillators[0].stops[0] - (Context.last.oscillators[0].starts[0] + 0.065)) < 1e-9);
  audio.keyUp('not-playing');
  assert.equal(Context.last.oscillators.length, 2);
});

test('settings are read at call time and disabled sounds allocate no nodes', function () {
  var Context = contextFactory();
  var settings = { gameSounds: false, keyTones: false };
  var audio = Audio.create({ AudioContext: Context, settings: settings });
  audio.unlock();
  audio.playGame('eat');
  audio.keyDown('1');
  assert.equal(Context.last.oscillators.length, 0);
  settings.gameSounds = true;
  settings.keyTones = true;
  audio.playGame('eat');
  audio.keyDown('1');
  assert.equal(Context.last.oscillators.length, 3);
});

test('unlock is idempotent and unsupported or throwing contexts stay silent', function () {
  var Context = contextFactory();
  var audio = Audio.create({ AudioContext: Context, settings: {} });
  audio.unlock();
  audio.unlock();
  assert.equal(Context.last.resumeCount, 1);
  assert.equal(audio.isSupported(), true);
  var unsupported = Audio.create({ AudioContext: null });
  assert.equal(unsupported.isSupported(), false);
  assert.doesNotThrow(function () { unsupported.unlock(); unsupported.playGame('eat'); unsupported.keyDown('1'); unsupported.keyUp('1'); unsupported.stopAll(); });
  var Broken = function () { throw new Error('unavailable'); };
  var broken = Audio.create({ AudioContext: Broken });
  assert.doesNotThrow(function () { broken.unlock(); broken.playGame('eat'); broken.keyDown('1'); broken.keyUp('1'); broken.stopAll(); });
});

test('a new game tone cancels the previous voice and stopAll releases held keys', function () {
  var Context = contextFactory();
  var audio = Audio.create({ AudioContext: Context, settings: { gameSounds: true, keyTones: true } });
  audio.unlock();
  audio.playGame('won');
  var first = Context.last.oscillators.slice(0);
  audio.playGame('eat');
  assert.deepEqual(first.map(function (osc) { return osc.stops[1]; }), [10.006, 10.006]);
  assert.ok(Context.last.gains[0].cancelEvents.length > 0);
  audio.keyDown('2');
  audio.stopAll();
  assert.ok(Context.last.oscillators[3].stops.length > 0);
});

test('finished game voices disconnect their nodes', function () {
  var Context = contextFactory();
  var audio = Audio.create({ AudioContext: Context, settings: { gameSounds: true } });
  audio.unlock();
  audio.playGame('eat');
  Context.last.oscillators[0].onended();
  assert.equal(Context.last.oscillators[0].disconnectCount, 1);
  assert.equal(Context.last.gainNodes[0].disconnectCount, 1);
});
