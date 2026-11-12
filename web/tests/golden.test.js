'use strict';

/*
 * Golden-frame test: the sprite engine is compared, bit for bit, with frames rendered by the ORIGINAL 2021
 * Java code (fixtures/golden.json, produced by tests/java-reference/GoldenDump.java from the untouched
 * sources in "Snake II/src").
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

require('../js/config.js');
const Framebuffer = require('../js/framebuffer.js');
require('../js/font.js');
const Sprites = require('../js/sprites.js');

const golden = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'golden.json'), 'utf8'));

function render(sc, opts) {
  const fb = new Framebuffer(84, 48);
  Sprites.drawScore(fb, sc.score);
  if (sc.apple) Sprites.drawApple(fb, sc.apple[0], sc.apple[1]);
  const segs = sc.segments.map((s) => ({ x: s[0], y: s[1], d: s[2] }));
  Sprites.drawSnake(fb, segs, Object.assign({ wrap: false }, opts));
  Sprites.drawFrame(fb);
  return fb;
}

function diff(expected, actual) {
  const out = [];
  for (let y = 0; y < 48; y++) {
    let a = '', b = '';
    for (let x = 0; x < 84; x++) {
      a += expected.get(x, y) ? '#' : '.';
      b += actual.get(x, y) ? '#' : '.';
    }
    if (a !== b) out.push(`row ${String(y).padStart(2)} want ${a}\n       got  ${b}`);
  }
  return out.join('\n');
}

test('fixture sanity', () => {
  assert.ok(golden.scenarios.length >= 100, 'at least 100 golden scenarios');
  for (const sc of golden.scenarios) {
    assert.equal(sc.rows.length, 48, sc.name);
    for (const r of sc.rows) assert.match(r, /^[0-9a-f]{21}$/, sc.name);
  }
});

for (const sc of golden.scenarios) {
  test(`golden frame: ${sc.name}`, () => {
    const want = Framebuffer.fromHexRows(sc.rows, 84);
    const got = render(sc);
    assert.ok(want.equals(got), `${sc.name} differs from the Java original:\n${diff(want, got)}`);
  });
}

test('wrap mode draws the same pixels as clipping when nothing leaves the playfield', () => {
  for (const sc of golden.scenarios) {
    const clipped = render(sc, { wrap: false });
    const wrapped = render(sc, { wrap: true });
    assert.ok(clipped.equals(wrapped), `${sc.name}: wrap mode changed a frame that never leaves the field`);
  }
});
