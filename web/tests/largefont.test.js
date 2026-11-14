'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const I18n = require('../js/i18n.js');
const Text = require('../js/text.js');
const Framebuffer = require('../js/framebuffer.js');

function drawn(lang, str) {
  Text.setFontPack(I18n.fontPack(lang));
  const fb = new Framebuffer(84, 48);
  Text.drawLarge(fb, str, 0, 0);
  const rows = [];
  for (let y = 0; y < 13; y++) {
    let row = '';
    for (let x = 0; x < Text.widthLarge(str); x++) row += fb.get(x, y) ? '#' : '.';
    rows.push(row);
  }
  return rows;
}

test('accented capitals of the split locale packs are drawn like their base letter plus the accent', () => {
  const lang = 'hu';
  const plain = drawn(lang, 'E');
  const accented = drawn(lang, 'É');
  assert.equal(accented.length, 13);
  assert.ok(accented.slice(0, 2).join('').includes('#'), 'accent');
  assert.equal(accented[2], plain[0], 'top bar of the E');
  assert.equal(accented[10], plain[10], 'bottom bar of the E');
  assert.equal(accented.slice(3, 10).filter((r) => r.startsWith('##')).length, 7, 'stem of the E');
});

test('no drawable large glyph of any language is a jumble of two halves', () => {
  for (const lang of Object.keys(I18n.PACKS)) {
    Text.setFontPack(I18n.fontPack(lang));
    for (const value of Object.values(I18n.PACKS[lang])) {
      for (const str of [].concat(value)) {
        if (typeof str !== 'string' || !Text.canDrawLarge(str)) continue;
        for (const ch of str) {
          if (ch.charCodeAt(0) < 0x7f) continue;
          const rows = drawn(lang, ch);
          const halves = rows.slice(0, 6).join('').includes('#') && rows.slice(8).join('').includes('#');
          const gap = !rows[6].includes('#') && !rows[7].includes('#');
          assert.equal(halves && gap, false, lang + ' ' + ch);
        }
      }
    }
  }
});
