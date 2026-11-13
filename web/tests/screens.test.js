'use strict';

/*
 * The pictures of the phone: lists, notes, the large font, the start-up animation and the fireworks. What was
 * measured on real phones is tested as such; what is an estimate ([EST], see FIDELITY.md) is tested for what the code
 * promises about it, not as if it were a fact about the phone.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/config.js');
const Framebuffer = require('../js/framebuffer.js');
const Pictures = require('../js/pictures.js');
const Text = require('../js/text.js');
const Texts = require('../js/texts.js');
const Screens = require('../js/screens.js');

function blank() { return new Framebuffer(); }
function ink(fb) { let n = 0; for (let i = 0; i < fb.px.length; i++) n += fb.px[i]; return n; }
function rowInk(fb, y) { let n = 0; for (let x = 0; x < fb.w; x++) n += fb.get(x, y); return n; }
function colInk(fb, x) { let n = 0; for (let y = 0; y < fb.h; y++) n += fb.get(x, y); return n; }
/** A glyph of pictures.js: rows separated by "/". */
function glyph(table, ch) { const rows = table[ch].split('/'); return { w: rows[0].length, rows }; }

// ----- the large font -----------------------------------------------------------------------------------------------------

test('the large font has every glyph of the game over and top score notes', () => {
  ['0123456789', 'Game over!', 'Your score:', 'TOP SCORE:', 'Top score:'].forEach((s) => {
    assert.ok(Text.canDrawLarge(s), s);
  });
});

test('the full PPM large font draws the maze notes without a small-font fallback', () => {
  ['Maze 3', 'No maze', 'selected'].forEach((s) => assert.equal(Text.canDrawLarge(s), true, s));
  assert.equal(Text.drawNoteLine(blank(), 'Maze 3', 0, 3), 'large');
  assert.equal(Text.drawNoteLine(blank(), 'Game over!', 0, 3), 'large');
});

test('the complete English large font replaces the old hand-drawn estimates', () => {
  assert.deepEqual(Text.estimatedGlyphs('Your score:'), []);
  assert.deepEqual(Text.estimatedGlyphs('1247 89'), []);
  assert.deepEqual(Text.estimatedGlyphs('0356'), []);
});

test('every large glyph is a clean rectangle: 11 rows, only the p goes down to 13', () => {
  Object.keys(Pictures.LARGE).forEach((ch) => {
    const g = glyph(Pictures.LARGE, ch);
    assert.equal(g.rows.length, ch === 'p' ? 13 : 11, ch);
    g.rows.forEach((row) => {
      assert.equal(row.length, g.w, ch);
      assert.match(row, /^[#.]+$/, ch);
    });
    assert.ok(g.w >= 2 && g.w <= 8, ch);
    assert.ok(g.rows.some((r) => r.indexOf('#') >= 0), ch);
  });
});

test('widths of the large font: one empty column after a glyph, a space is 3, R is 8 wide [VIDEO]', () => {
  assert.equal(Pictures.LARGE_SPACE, 3);
  assert.deepEqual(Pictures.LARGE_ADV, { R: 8 });
  assert.equal(Text.widthLarge(' '), 3);
  assert.equal(Text.widthLarge('R'), 8);
  assert.equal(Text.widthLarge('1'), glyph(Pictures.LARGE, '1').w + 1);
  assert.equal(Text.widthLarge('1 1'), 2 * (glyph(Pictures.LARGE, '1').w + 1) + 3);
  // all notes fit the 84 columns
  ['Game over!', 'Your score:', 'TOP SCORE:', 'Top score:', '0123456789'].forEach((s) => {
    assert.ok(Text.widthLarge(s) <= 84, s);
  });
});

test('a glyph of the large font is drawn where it is told to, and nowhere else', () => {
  const fb = blank();
  const end = Text.drawLarge(fb, '1', 10, 5);
  assert.equal(end, 10 + Text.widthLarge('1'));
  const g = glyph(Pictures.LARGE, '1');
  let want = 0;
  g.rows.forEach((row, r) => {
    for (let c = 0; c < g.w; c++) {
      const on = row.charAt(c) === '#' ? 1 : 0;
      want += on;
      assert.equal(fb.get(10 + c, 5 + r), on, `(${c},${r})`);
    }
  });
  assert.equal(ink(fb), want);
});

test('a descender (p) hangs below the cell: Top score is 13 rows high', () => {
  const fb = blank();
  Text.drawLarge(fb, 'p', 0, 3);
  assert.ok(rowInk(fb, 15) > 0);
  assert.equal(rowInk(fb, 16), 0);
});

// ----- wrapping of the notes ----------------------------------------------------------------------------------------------

test('notes: "\\n" always breaks, the numbers are put in', () => {
  assert.deepEqual(Screens.noteLines(Texts.GAME_OVER_SCORE, { n: 0 }), ['Game over!', 'Your score:', '0']);
  assert.deepEqual(Screens.noteLines(Texts.GAME_OVER_TOP, { n: 1222 }), ['Game over!', 'TOP SCORE:', '1222']);
  assert.deepEqual(Screens.noteLines(Texts.TOP_SCORE_NOTE, { n: 7 }), ['Top score:', '7']);
});

test('notes with the icon wrap at 67 columns: "Maze 3" / "selected" [EST]', () => {
  assert.equal(Screens.ICON_TEXT_WIDTH, 67);
  Texts.MAZE_NAMES.forEach((name) => {
    const lines = Screens.noteLines(Texts.SELECTED, { u: name }, Screens.ICON_TEXT_WIDTH);
    assert.deepEqual(lines, [name, 'selected'], name);
  });
});

test('wrapLarge breaks at spaces, greedily, and never splits a word', () => {
  assert.deepEqual(Text.wrapLarge('1 1 1 1', 1000), ['1 1 1 1']);
  const w = Text.widthLargeEst('1 1') - 1;
  assert.deepEqual(Text.wrapLarge('1 1 1 1', w), ['1 1', '1 1']);
  assert.deepEqual(Text.wrapLarge('11111111111111111111', 5), ['11111111111111111111']);
  assert.deepEqual(Text.wrapLarge('a\n\nb', 100), ['a', '', 'b']);
});

test('large PPM glyph widths are used when wrapping notes', () => {
  assert.equal(Text.canDrawLarge('Mz'), true);
  assert.equal(Text.widthLargeEst('M'), Text.widthLarge('M'));
  assert.equal(Text.widthLargeEst('Mz'), Text.widthLarge('Mz'));
  assert.equal(Text.widthLargeEst('1'), Text.widthLarge('1'));
});

// ----- drawing a note --------------------------------------------------------------------------------------------------------

test('note lines stand 15 rows apart, the first cell starts on row 3', () => {
  const fb = blank();
  Screens.drawNote(fb, ['Game over!', 'Your score:', '0'], null);
  for (let y = 0; y < 3; y++) assert.equal(rowInk(fb, y), 0, 'row ' + y);
  [3, 18, 33].forEach((top) => {
    let any = 0;
    for (let y = top; y < top + 11; y++) any += rowInk(fb, y);
    assert.ok(any > 0, 'cell at ' + top);
  });
  // between the cells: nothing
  [14, 15, 16, 17, 29, 30, 31, 32].forEach((y) => assert.equal(rowInk(fb, y), 0, 'row ' + y));
  assert.equal(rowInk(fb, 44) + rowInk(fb, 45) + rowInk(fb, 46) + rowInk(fb, 47), 0);
});

test('drawNote clears the screen first', () => {
  const fb = blank();
  fb.fillRect(0, 0, 84, 48, 1);
  Screens.drawNote(fb, ['0'], null);
  assert.ok(ink(fb) < 100);
});

test('a note without an icon draws no icon', () => {
  const a = Screens.drawNote(blank(), ['Top score:', '1'], null);
  const b = Screens.drawNote(blank(), ['Top score:', '1'], { t: 5000 });
  assert.equal(a.equals(b), false);
  const box = Pictures.NOTE_ICON.box;
  assert.equal(a.get(box.x, box.y), 0);
  assert.equal(b.get(box.x, box.y), 1);
});

// ----- the icon of the maze note ---------------------------------------------------------------------------------------

function iconFrame(t) { const fb = blank(); Screens.drawNoteIcon(fb, t); return fb; }

test('the dotted box is there from the first moment, the tick comes after 700 ms', () => {
  const I = Pictures.NOTE_ICON;
  const box = I.box;
  const empty = iconFrame(0);
  assert.ok(ink(empty) > 0);
  assert.ok(empty.equals(iconFrame(699)));
  assert.equal(iconFrame(700).equals(empty), false);
  // dots on the outline at every second position, the corners included
  for (let dx = 0; dx < box.w; dx += 2) {
    assert.equal(empty.get(box.x + dx, box.y), 1);
    assert.equal(empty.get(box.x + dx, box.y + box.h - 1), 1);
  }
  for (let dy = 0; dy < box.h; dy += 2) {
    assert.equal(empty.get(box.x, box.y + dy), 1);
    assert.equal(empty.get(box.x + box.w - 1, box.y + dy), 1);
  }
  assert.equal(empty.get(box.x + 1, box.y), 0);
  assert.equal(empty.get(box.x + box.w - 2, box.y), 0);
  assert.equal(empty.get(box.x + box.w - 1, box.y + 1), 0);
});

test('the tick is drawn in 5 steps of 65 ms and then stays', () => {
  const I = Pictures.NOTE_ICON;
  assert.equal(I.emptyMs, 700);
  assert.equal(I.stepMs, 65);
  assert.equal(I.steps, 5);
  let last = -1;
  const counts = [];
  for (let t = 0; t <= 1600; t += 5) {
    const n = ink(iconFrame(t));
    assert.ok(n >= last, 't=' + t);
    last = n;
    counts.push(n);
  }
  const full = ink(iconFrame(1600));
  assert.equal(ink(iconFrame(700 + 4 * 65)), full);
  assert.ok(ink(iconFrame(700 + 4 * 65 - 1)) < full);
  assert.equal(ink(iconFrame(5000)), full);
  // every step adds something
  const stages = new Set();
  for (let k = 0; k < 5; k++) stages.add(ink(iconFrame(700 + k * 65)));
  assert.equal(stages.size, 5);
});

test('the tick starts inside the box and sticks out of its upper right corner, on the screen', () => {
  const box = Pictures.NOTE_ICON.box;
  const frame = iconFrame(5000), empty = iconFrame(0);
  let tick = 0, outside = 0;
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 84; x++) {
      if (frame.get(x, y) && !empty.get(x, y)) {
        tick++;
        assert.ok(x >= box.x && x <= box.x + box.w + 1, `x=${x}`);
        assert.ok(y >= box.y - 1 && y <= box.y + box.h - 1, `y=${y}`);
        if (x > box.x + box.w - 1 || y < box.y) outside++;
      }
    }
  }
  assert.ok(tick > 15);
  assert.ok(outside > 0 && outside < tick / 2);
  // nothing of the tick is cut off by the edge of the screen
  const full = Pictures.NOTE_ICON.tick.join('').replace(/\./g, '').length;
  assert.equal(tick + countOnOutline(frame, empty, box), full);
});

/** Tick pixels that fall on a dot of the box outline cannot be told apart from it; count them for the check above. */
function countOnOutline(frame, empty, box) {
  const I = Pictures.NOTE_ICON;
  let n = 0;
  for (let r = 0; r < I.tick.length; r++) {
    for (let c = 0; c < I.tick[r].length; c++) {
      if (I.tick[r].charAt(c) === '.') continue;
      const x = box.x + I.tickX + c, y = box.y + I.tickY + r;
      if (empty.get(x, y)) n++;
    }
  }
  return n;
}

// ----- menu lists -----------------------------------------------------------------------------------------------------------

const ITEMS = ['New game', 'Level', 'Mazes', 'Top score', 'Instructions'];

test('moving the cursor down the circle of five items: (top line, cursor) [VIDEO B]', () => {
  const st = { s: 0, c: 0 }, seen = [];
  for (let i = 0; i < 8; i++) { Screens.moveCursor(st, 5, 1); seen.push([st.s, st.c]); }
  assert.deepEqual(seen, [[0, 1], [0, 2], [1, 3], [2, 4], [3, 0], [4, 1], [0, 2], [1, 3]]);
});

test('moving the cursor up the circle of five items [VIDEO B]', () => {
  const st = { s: 0, c: 0 }, seen = [];
  for (let i = 0; i < 7; i++) { Screens.moveCursor(st, 5, -1); seen.push([st.s, st.c]); }
  assert.deepEqual(seen, [[4, 4], [3, 3], [2, 2], [1, 1], [0, 0], [4, 4], [3, 3]]);
});

test('short lists do not scroll: the top line is item 0 and the cursor walks around', () => {
  const st = { s: 2, c: 1 };
  Screens.moveCursor(st, 3, 1);
  assert.deepEqual(st, { s: 0, c: 2 });
  Screens.moveCursor(st, 3, 1);
  assert.deepEqual(st, { s: 0, c: 0 });
  Screens.moveCursor(st, 3, -1);
  assert.deepEqual(st, { s: 0, c: 2 });
});

test('the line of the cursor is counted from the top line, around the end', () => {
  assert.equal(Screens.cursorLine({ s: 3, c: 0 }, 5), 2);
  assert.equal(Screens.cursorLine({ s: 4, c: 1 }, 5), 2);
  assert.equal(Screens.cursorLine({ s: 0, c: 4 }, 5), 4);
  assert.equal(Screens.LINES, 3);
});

test('fit puts the numbers right again after the list changed [EST]', () => {
  assert.deepEqual(Screens.fit({ s: 3, c: 0 }, 5), { s: 3, c: 0 });          // cursor in the window: stays
  assert.deepEqual(Screens.fit({ s: 0, c: 4 }, 5), { s: 4, c: 4 });          // cursor outside: it becomes the top line
  assert.deepEqual(Screens.fit({ s: 5, c: 5 }, 5), { s: 0, c: 0 });          // a list that lost an item
  assert.deepEqual(Screens.fit({ s: 4, c: 1 }, 3), { s: 0, c: 1 });
  assert.deepEqual(Screens.fit({ s: -1, c: -1 }, 5), { s: 4, c: 4 });
});

function menuFrame(s, c, header, softKey) {
  const fb = blank();
  Screens.drawMenu(fb, { items: ITEMS, s, c, header: header || '8-1-1', softKey: softKey || Texts.SELECT });
  return fb;
}

test('the cursor line is a dark bar over 79 columns with light text, the others are plain', () => {
  const fb = menuFrame(0, 1);
  const y0 = 7 + 10 * 1;
  assert.equal(fb.get(0, y0), 1);
  assert.equal(fb.get(78, y0), 1);
  assert.equal(fb.get(0, y0 + 9), 1);
  assert.equal(fb.get(79, y0), 0);
  // plain lines have no bar
  assert.equal(fb.get(0, 7), 0);
  assert.equal(fb.get(78, 7), 0);
  assert.equal(fb.get(78, 27), 0);
  // the text of the bar is cut out of it
  let holes = 0;
  for (let x = 0; x < 79; x++) for (let y = y0; y < y0 + 10; y++) holes += fb.get(x, y) ? 0 : 1;
  assert.ok(holes > 20);
});

test('three lines show three items starting at the top line, around the end of the list', () => {
  const a = menuFrame(3, 4);
  const b = Screens.drawMenu(blank(), { items: ITEMS, s: 3, c: 4, header: '8-1-1', softKey: 'Select' });
  assert.ok(a.equals(b));
  // the same three words in another order are another picture
  assert.equal(a.equals(menuFrame(0, 1)), false);
  // window (3, 4, 0): the cursor line is the middle one
  const bar = 7 + 10;
  assert.equal(a.get(0, bar), 1);
  assert.equal(a.get(0, 7), 0);
  assert.equal(a.get(0, 27), 0);
});

test('the scroll bar scales to the visible window and follows its top line', () => {
  const thumbTop = [7, 10, 13, 16, 19];
  for (let s = 0; s < 5; s++) {
    const fb = menuFrame(s, 0);
    const t = thumbTop[s];
    for (let y = t; y < t + 18; y++) assert.equal(fb.get(83, y), 1, `s=${s} y=${y}`);
    assert.equal(fb.get(83, t - 1), 0, `s=${s} above`);
    assert.equal(fb.get(83, t + 18), 0, `s=${s} below`);
    // the track
    for (let y = 7; y <= 36; y++) assert.equal(fb.get(81, y), 1);
    assert.equal(fb.get(82, 7), 1);
    assert.equal(fb.get(82, 36), 1);
    assert.equal(fb.get(82, 20), 0);
  }
  // The cursor may move inside the same window without moving the scrollbar.
  const first = menuFrame(1, 0), second = menuFrame(1, 2);
  for (let y = 7; y <= 36; y++) assert.equal(first.get(83, y), second.get(83, y), `cursor row y=${y}`);
});

test('the numbers in the corner stay in rows 0..5 and columns 60..82', () => {
  const fb = blank();
  Text.drawHeader(fb, '8-1-3');
  for (let y = 6; y < 48; y++) assert.equal(rowInk(fb, y), 0, 'row ' + y);
  for (let x = 0; x < 60; x++) assert.equal(colInk(fb, x), 0, 'col ' + x);
  assert.equal(colInk(fb, 83), 0);
  assert.ok(ink(fb) > 20);
});

test('every header the phone can show can be drawn', () => {
  const headers = [];
  for (let i = 1; i <= 5; i++) headers.push('8-1-' + i);
  for (let n = 1; n <= 6; n++) { headers.push('8-1-3-' + n); headers.push('8-1-4-' + n); }
  headers.forEach((h) => {
    const fb = blank();
    Text.drawHeader(fb, h);
    assert.ok(ink(fb) > 0, h);
  });
  assert.equal(Pictures.HEADER && Object.keys(Pictures.HEADER).sort().join(''), '1234568');
});

test('the soft key sits in the middle of the bottom line', () => {
  const fb = menuFrame(0, 0, '8-1-1', 'Select');
  const w = Text.width('B', 'Select');
  let first = 84, last = -1;
  for (let y = 38; y < 48; y++) {
    for (let x = 0; x < 84; x++) if (fb.get(x, y)) { first = Math.min(first, x); last = Math.max(last, x); }
  }
  assert.ok(first >= Math.floor((84 - w) / 2) - 1);
  assert.ok(last <= Math.floor((84 - w) / 2) + w);
  assert.ok(Math.abs((first + last) / 2 - 41.5) < 3);
});

// ----- the other screens -----------------------------------------------------------------------------------------------

test('all texts of the phone can be drawn with the fonts that are used for them', () => {
  [Texts.NEW_GAME, Texts.CONTINUE, Texts.LEVEL, Texts.MAZES, Texts.TOP_SCORE, Texts.INSTRUCTIONS,
    Texts.SELECT, Texts.OK, Texts.NEXT, Texts.LEVEL_LABEL].concat(Texts.MAZE_NAMES).forEach((s) => {
    assert.ok(Text.canDraw('B', s), s);
    assert.ok(Text.width('B', s) + 2 <= 79, s);
  });
  assert.ok(Text.canDraw('A', Texts.INSTRUCTION_TEXT));
});

test('the level screen fills one block for each level up to the chosen one', () => {
  const fb3 = blank(); Screens.drawLevel(fb3, 3);
  const fb1 = blank(); Screens.drawLevel(fb1, 1);
  const fb9 = blank(); Screens.drawLevel(fb9, 9);
  // block k: x from 8(k-1)+6, top row 31-2k
  const probe = (k) => [8 * (k - 1) + 6, 31 - 2 * k];
  assert.equal(fb1.get(...probe(1)), 1);
  assert.equal(fb1.get(...probe(2)), 0);
  assert.equal(fb3.get(...probe(3)), 1);
  assert.equal(fb3.get(...probe(4)), 0);
  for (let k = 1; k <= 9; k++) assert.equal(fb9.get(...probe(k)), 1, 'level 9, block ' + k);
  // the steps are there at every level
  for (let k = 1; k <= 9; k++) assert.equal(fb1.get(8 * (k - 1) + 11, 35), 1);
  assert.ok(ink(fb9) > ink(fb3) && ink(fb3) > ink(fb1));
  assert.equal(fb1.equals(fb3), false);
});

test('the instruction text: pages of three lines, 82 columns', () => {
  const pages = Screens.instructionPages();
  assert.ok(pages.length >= 3);
  pages.forEach((p, i) => {
    assert.ok(p.length >= 1 && p.length <= 3, 'page ' + i);
    p.forEach((line) => assert.ok(Text.width('A', line) - 1 <= 82, line));
  });
  const flat = [].concat(...pages).join(' ');
  assert.equal(flat, Texts.INSTRUCTION_TEXT);
  const fb = blank();
  Screens.drawInstructions(fb, 0);
  assert.ok(ink(fb) > 100);
});

// ----- start-up animation and fireworks --------------------------------------------------------------------------------------

test('the start-up animation: base picture, then the overlays on the times of the table', () => {
  const S = Pictures.SPLASH;
  assert.equal(S.total, 2700);
  assert.equal(S.base.length, 48);
  S.base.forEach((row) => assert.equal(row.length, 84));
  const base = blank();
  Screens.drawSplash(base, 0);
  assert.equal(ink(base) > 0, true);
  let prev = -1;
  S.timeline.forEach(([t, idx]) => {
    assert.ok(t > prev);
    prev = t;
    const fb = blank();
    Screens.drawSplash(fb, t);
    assert.equal(fb.equals(base), idx < 0, `t=${t} idx=${idx}`);
  });
  assert.ok(prev < S.total);
  // between two entries the picture holds
  const a = blank(), b = blank();
  Screens.drawSplash(a, 500);
  Screens.drawSplash(b, 749);
  assert.ok(a.equals(b));
});

test('the fireworks: 6 pictures of 48 rows, 21 hex digits each, 230 ms a picture, 2 rounds', () => {
  const F = Pictures.FIREWORKS;
  assert.equal(F.stepMs, 230);
  assert.equal(F.rounds, 2);
  assert.equal(F.frames.length, 6);
  F.frames.forEach((fr, i) => {
    assert.equal(fr.length, 48, 'frame ' + i);
    fr.forEach((row) => assert.match(row, /^[0-9a-f]{21}$/));
  });
  assert.equal(Screens.fireworksSteps(), 12);
  for (let step = 0; step < 12; step++) {
    const fb = blank();
    Screens.drawFireworks(fb, step * 230);
    assert.deepEqual(fb.toHexRows(), F.frames[step % 6], 'step ' + step);
    const late = blank();
    Screens.drawFireworks(late, step * 230 + 229);
    assert.ok(late.equals(fb));
  }
  const end = blank();
  Screens.drawFireworks(end, 99999);
  assert.deepEqual(end.toHexRows(), F.frames[5]);
});

test('the six fireworks pictures are all different', () => {
  const seen = new Set(Pictures.FIREWORKS.frames.map((f) => f.join('')));
  assert.equal(seen.size, 6);
});
