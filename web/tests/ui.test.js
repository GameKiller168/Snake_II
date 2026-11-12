'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../js/config.js');
const LCD = require('../js/lcd.js');
const I18n = require('../js/i18n.js');
const Input = require('../js/input.js');
const AudioOut = require('../js/audio.js');

// --- LCD layout --------------------------------------------------------------------------------

test('layout: whole device pixels, never bigger than the box, cells keep their shape', () => {
  for (const dpr of [1, 1.25, 1.5, 2, 3]) {
    for (const [w, h] of [[1000, 700], [390, 240], [844, 300], [320, 180], [1920, 900], [84, 48], [50, 30], [3000, 400]]) {
      const L = LCD.computeLayout(w, h, dpr);
      const tag = `${w}x${h}@${dpr}`;
      assert.ok(Number.isInteger(L.cw) && Number.isInteger(L.ch) && L.cw >= 1 && L.ch >= 1, tag);
      assert.equal(L.width, L.cw * config.LCD_W, tag);
      assert.equal(L.height, L.ch * config.LCD_H, tag);
      if (L.cw > 1) {
        assert.ok(L.width <= Math.floor(w * dpr), `${tag}: width ${L.width}`);
        assert.ok(L.height <= Math.floor(h * dpr), `${tag}: height ${L.height}`);
      }
      assert.ok(Math.abs(L.cssW * dpr - L.width) < 1e-9, tag);
      if (L.cw >= 6) assert.ok(Math.abs(L.ch / L.cw - 1.2) < 0.12, `${tag}: aspect ${L.ch / L.cw}`);
      assert.ok(L.gap >= 0 && L.gap < L.cw || L.cw === 1, tag);
    }
  }
});

test('layout: the biggest cell that fits is chosen', () => {
  const L = LCD.computeLayout(1000, 700, 1);
  assert.equal(L.cw, 11);
  assert.equal(L.ch, 13);
  const bigger = LCD.computeLayout(1000, 700 + 48, 1);
  assert.ok(bigger.cw >= L.cw);
  const hd = LCD.computeLayout(1000, 700, 2);
  assert.equal(hd.cw, 23, 'twice the device pixels, twice the cell size');
});

test('layout: the original 10 x 12 cell comes out at 840 x 576 css pixels', () => {
  const L = LCD.computeLayout(841, 576, 1);
  assert.equal(L.cw, 10);
  assert.equal(L.ch, 12);
  assert.equal(L.width, 840);
  assert.equal(L.height, 576);
  assert.equal(L.gap, 1);
});

test('layout: degenerate boxes do not blow up', () => {
  for (const [w, h] of [[0, 0], [-5, 10], [1, 1], [NaN, NaN]]) {
    const L = LCD.computeLayout(w, h, 1);
    assert.ok(L.cw >= 1 && L.ch >= 1);
  }
  assert.ok(LCD.computeLayout(500, 300, 0).cw >= 1);
});

test('skins: both have colours, neon is the 2021 pair', () => {
  assert.equal(LCD.SKINS.neon.bg, '#00ff00');
  assert.equal(LCD.SKINS.neon.ink, '#000000');
  assert.ok(LCD.SKINS.lcd.bg && LCD.SKINS.lcd.ink);
  assert.deepEqual(LCD.SKIN_ORDER.sort(), Object.keys(LCD.SKINS).sort());
});

// --- texts ---------------------------------------------------------------------------------------

test('i18n: both languages have the same keys and the same placeholders', () => {
  const hu = Object.keys(I18n.TEXTS.hu).sort();
  const en = Object.keys(I18n.TEXTS.en).sort();
  assert.deepEqual(hu, en);
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
  for (const k of hu) assert.equal(vars(I18n.TEXTS.hu[k]), vars(I18n.TEXTS.en[k]), k);
});

test('i18n: lookup, placeholders, fallback, detection', () => {
  assert.equal(I18n.t('en', 'live.over', { score: 40 }), 'Game over. Score: 40.');
  assert.ok(I18n.t('hu', 'live.over', { score: 40 }).includes('40'));
  assert.equal(I18n.t('xx', 'btn.menu'), 'Menu', 'unknown language falls back to English');
  assert.equal(I18n.t('en', 'no.such.key'), 'no.such.key');
  assert.equal(I18n.detect('hu-HU'), 'hu');
  assert.equal(I18n.detect('hu'), 'hu');
  assert.equal(I18n.detect('en-GB'), 'en');
  assert.equal(I18n.detect('hr'), 'en');
  assert.equal(I18n.detect(undefined), 'en');
});

test('i18n: every hint exists for keyboard and touch in every state', () => {
  for (const lang of I18n.LANGS) {
    for (const state of ['title', 'play', 'paused', 'over']) {
      for (const kind of ['kbd', 'touch']) {
        const key = `hint.${state}.${kind}`;
        assert.notEqual(I18n.t(lang, key), key, `${lang} ${key}`);
      }
      assert.notEqual(I18n.t(lang, `btn.${state}`), `btn.${state}`);
    }
  }
});

// --- keyboard --------------------------------------------------------------------------------------

const ev = (o) => Object.assign({ ctrlKey: false, metaKey: false, altKey: false, code: '', key: '' }, o);
const act = (o) => {
  const r = Input.actionOf(ev(o));
  return r ? (r.arg !== undefined ? `${r.action}:${r.arg}` : r.action) : null;
};

test('keys: movement by physical position, mnemonics by letter', () => {
  assert.equal(act({ code: 'ArrowUp', key: 'ArrowUp' }), 'up');
  assert.equal(act({ code: 'KeyW', key: 'w' }), 'up');
  assert.equal(act({ code: 'KeyW', key: 'z' }), 'up', 'AZERTY: the key in the WASD position still goes up');
  assert.equal(act({ code: 'KeyA', key: 'q' }), 'left');
  assert.equal(act({ code: 'Numpad8', key: '8' }), 'up');
  assert.equal(act({ code: 'Numpad2', key: '2' }), 'down');
  assert.equal(act({ code: 'Numpad4', key: '4' }), 'left');
  assert.equal(act({ code: 'Numpad6', key: '6' }), 'right');
  assert.equal(act({ code: 'Space', key: ' ' }), 'space');
  assert.equal(act({ code: 'Numpad5', key: '5' }), 'space');
  assert.equal(act({ code: 'Enter', key: 'Enter' }), 'start');
  assert.equal(act({ code: 'NumpadEnter', key: 'Enter' }), 'start');
  assert.equal(act({ code: 'Escape', key: 'Escape' }), 'pause');
  assert.equal(act({ code: 'KeyP', key: 'p' }), 'pause');
  assert.equal(act({ code: 'KeyP', key: 'P' }), 'pause');
  assert.equal(act({ code: 'KeyQ', key: 'q' }), 'quit');
  assert.equal(act({ code: 'Backspace', key: 'Backspace' }), 'quit');
  assert.equal(act({ code: 'KeyM', key: 'm' }), 'mute');
  assert.equal(act({ code: 'KeyC', key: 'c' }), 'skin');
  assert.equal(act({ code: 'KeyL', key: 'l' }), 'lang');
});

test('keys: top row digits pick the level, the numpad digits are directions', () => {
  for (let n = 1; n <= 9; n++) assert.equal(act({ code: 'Digit' + n, key: String(n) }), 'level:' + n);
  assert.equal(act({ code: 'Digit0', key: '0' }), null);
  assert.equal(act({ code: 'Numpad7', key: '7' }), null);
});

test('keys: shortcuts and unknown keys are left to the browser', () => {
  assert.equal(act({ code: 'ArrowUp', key: 'ArrowUp', ctrlKey: true }), null);
  assert.equal(act({ code: 'KeyR', key: 'r', metaKey: true }), null);
  assert.equal(act({ code: 'KeyP', key: 'p', altKey: true }), null);
  assert.equal(act({ code: 'F5', key: 'F5' }), null);
  assert.equal(act({ code: 'KeyX', key: 'x' }), null);
  assert.equal(act({ code: 'Tab', key: 'Tab' }), null);
});

test('keys: virtual keyboards without a code still work', () => {
  assert.equal(act({ code: '', key: 'ArrowLeft' }), 'left');
  assert.equal(act({ code: 'Unidentified', key: 'd' }), 'right');
  assert.equal(act({ code: '', key: '7' }), 'level:7');
  assert.equal(act({ code: '', key: ' ' }), 'space');
});

// --- audio -----------------------------------------------------------------------------------------

function fakeAudioContext(log) {
  return class {
    constructor() { this.state = 'suspended'; this.currentTime = 1; this.destination = {}; log.push('new'); }
    resume() { this.state = 'running'; log.push('resume'); return Promise.resolve(); }
    createOscillator() {
      const o = { type: '', frequency: { setValueAtTime(f) { o.f = f; } }, connect() {}, start(t) { o.t0 = t; }, stop(t) { o.t1 = t; log.push(o); } };
      return o;
    }
    createGain() {
      return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} };
    }
  };
}

test('audio: nothing happens before unlock, or when muted', async () => {
  const log = [];
  globalThis.AudioContext = fakeAudioContext(log);
  try {
    const a = new AudioOut();
    a.play('eat');
    assert.equal(log.length, 0, 'no context before the first gesture');
    a.unlock();
    await Promise.resolve();
    assert.deepEqual(log.slice(0, 2), ['new', 'resume']);
    a.setMuted(true);
    a.play('eat');
    assert.equal(log.filter((x) => typeof x === 'object').length, 0, 'muted');
    a.setMuted(false);
    a.play('eat');
    const osc = log.filter((x) => typeof x === 'object');
    assert.equal(osc.length, AudioOut.SOUNDS.eat.length);
    assert.equal(osc[0].type, 'square');
    assert.equal(osc[0].f, AudioOut.SOUNDS.eat[0][0]);
    assert.ok(osc[1].t0 > osc[0].t0, 'notes follow each other');
  } finally {
    delete globalThis.AudioContext;
  }
});

test('audio: no WebAudio, or a context that throws, never breaks anything', () => {
  const a = new AudioOut();
  a.unlock();
  a.play('die');
  assert.equal(a.failed, true);
  globalThis.AudioContext = class { constructor() { throw new Error('blocked'); } };
  try {
    const b = new AudioOut();
    b.unlock();
    b.play('die');
    assert.equal(b.failed, true);
  } finally {
    delete globalThis.AudioContext;
  }
  a.play('no-such-sound');
});

test('audio: every game sound exists', () => {
  for (const name of ['menu', 'start', 'pause', 'eat', 'bonusSpawn', 'bonus', 'die', 'win']) {
    assert.ok(AudioOut.SOUNDS[name] && AudioOut.SOUNDS[name].length, name);
  }
});
