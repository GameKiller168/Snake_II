'use strict';

/*
 * Tile library vs. a real phone. fixtures/phone-states.json holds frames measured from footage of a Nokia 3310
 * playing Snake II (default level): the cells of the snake, the apple, the bonus creature and the LCD content
 * that was on screen. The field (rows 10..45, columns 2..81) drawn from the tiles must match it bit for bit.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

require('../js/config.js');
const Framebuffer = require('../js/framebuffer.js');
const Tiles = require('../js/tiles.js');

// the pictures of the bonus creatures are numbered like the program does; the footage tracker used letters
const CREATURE_TYPE = { A: 1, C: 2, B: 4, D: 5 };

const GEOM = { x0: 2, y0: 10, tile: 4 };
const COLS = 20, ROWS = 9;
const DX = [1, -1, 0, 0], DY = [0, 0, -1, 1];

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'phone-states.json'), 'utf8'));

function mod(a, n) {
  return ((a % n) + n) % n;
}

function foodAhead(st) {
  const segs = st.segs;
  const head = segs[segs.length - 1];
  const nx = mod(head.x + DX[head.d], COLS), ny = mod(head.y + DY[head.d], ROWS);
  if (st.apple && st.apple[0] === nx && st.apple[1] === ny) return true;
  const c = st.creature;
  return !!c && ny === c.y && (nx === c.x || nx === mod(c.x + 1, COLS));
}

function draw(st) {
  const fb = new Framebuffer(84, 48);
  const segs = st.segs.map((s) => ({ x: s[0], y: s[1], d: s[2], fed: !!s[3] }));
  const state = { segs, apple: st.apple, creature: st.creature };
  Tiles.drawSnake(fb, segs, GEOM, foodAhead(state));
  if (st.apple) Tiles.drawApple(fb, st.apple[0], st.apple[1], GEOM);
  if (st.creature) Tiles.drawCreature(fb, CREATURE_TYPE[st.creature.type], st.creature.x, st.creature.y, GEOM);
  return fb;
}

function fieldRows(fb) {
  const out = [];
  for (let y = 10; y < 46; y++) {
    let s = '';
    for (let x = 2; x < 82; x++) s += fb.get(x, y) ? '#' : '.';
    out.push(s);
  }
  return out;
}

test('fixture sanity', () => {
  assert.ok(fixture.states.length >= 150, 'at least 150 measured frames');
  const kinds = new Set();
  for (const st of fixture.states) {
    assert.equal(st.rows.length, 48);
    for (const r of st.rows) assert.match(r, /^[0-9a-f]{21}$/);
    for (const k of st.kind) kinds.add(k);
  }
  for (const k of ['open', 'creature', 'fed']) assert.ok(kinds.has(k), `fixture covers "${k}"`);
});

for (const st of fixture.states) {
  test(`phone frame ${st.frame}: snake, apple and bonus creature`, () => {
    const want = fieldRows(Framebuffer.fromHexRows(st.rows, 84));
    // the measured frame also holds the creature picture in the header: compare the field only
    const got = fieldRows(draw(st));
    assert.deepEqual(got, want, `frame ${st.frame} (${st.kind.join(',')}) differs from the phone`);
  });
}

test('every corner image exists once per pair of sides', () => {
  assert.equal(Object.keys(Tiles.CORNER).length, 4);
  // the corner entered moving down and left through the left side has the same picture as the one
  // entered moving right and left through the... top side: only the pair of open sides matters
  assert.deepEqual(Tiles.tileFor('body', 3, 1, false, false), Tiles.tileFor('body', 0, 2, false, false));
});

test('a straight cell that swallowed food gets exactly the four bulge pixels', () => {
  for (let d = 0; d < 4; d++) {
    const a = Tiles.tileFor('body', d, d, false, false).join('');
    const b = Tiles.tileFor('body', d, d, true, false).join('');
    let n = 0;
    for (let i = 0; i < 16; i++) if (a[i] !== b[i]) n++;
    assert.equal(n, 4, `direction ${d}`);
  }
});

test('open mouth only differs for the head', () => {
  for (let d = 0; d < 4; d++) {
    assert.notDeepEqual(Tiles.tileFor('head', d, null, false, true), Tiles.tileFor('head', d, null, false, false));
  }
});
