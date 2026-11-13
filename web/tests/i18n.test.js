'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const I18n = require('../js/i18n.js');
const Text = require('../js/text.js');
const Framebuffer = require('../js/framebuffer.js');
const Screens = require('../js/screens.js');

test('language matching accepts regional browser tags and falls back to English', () => {
  assert.equal(I18n.detect(['fr-CA', 'hu-HU']), 'fr');
  assert.equal(I18n.detect(['xx-YY', 'ro_RO']), 'ro');
  assert.equal(I18n.detect(['xx-YY']), 'en');
  assert.equal(I18n.resolve(null, ['hu-HU']), 'hu');
  assert.equal(I18n.resolve('unsupported'), 'en');
});

test('every supported language fits the Options rows and draws its instructions', () => {
  for (const language of I18n.LANGUAGES) {
    Text.setFontPack(I18n.fontPack(language.code));
    const labels = I18n.text('OPTIONS', language.code);
    const optionLabels = [
      I18n.text('GAME_SOUNDS', language.code), I18n.text('KEY_TONES', language.code),
      I18n.text('VIBRATION', language.code), I18n.text('LANGUAGE', language.code)
    ];
    const values = [I18n.text('ON', language.code), I18n.text('OFF', language.code), language.code.toUpperCase()];
    assert.equal(typeof labels, 'string');
    optionLabels.forEach((label) => {
      assert.ok(Text.width('B', label) + Text.width('B', values[0]) < 76, language.code + ': ' + label);
      assert.ok(Text.width('B', label) + Text.width('B', values[1]) < 76, language.code + ': ' + label);
    });
    const body = I18n.text('INSTRUCTION_TEXT', language.code);
    assert.ok(Screens.instructionPages(body).length > 0, language.code);
    const frame = new Framebuffer(84, 48);
    Screens.drawInstructions(frame, 0, body, I18n.text('NEXT', language.code), language.code !== 'en');
    assert.ok(frame.toAscii().includes('#'), language.code);
  }
});

test('all translated UI strings and language names have both Nokia small-font weights', () => {
  for (const language of I18n.LANGUAGES) {
    Text.setFontPack(I18n.fontPack(language.code));
    const strings = [language.name, ...I18n.LANGUAGES.map((item) => item.name)];
    const keys = new Set([...Object.keys(I18n.PACKS[language.code] || {}), ...Object.keys(require('../js/texts.js'))]);
    for (const key of keys) {
      const value = I18n.text(key, language.code, { u: 'Magyar', n: 123 });
      if (typeof value === 'string') strings.push(value);
      else if (Array.isArray(value)) strings.push(...value);
    }
    for (const value of strings) {
      for (const line of value.split('\n')) {
        assert.ok(Text.canDraw('A', line), `${language.code} thin: ${line}`);
        assert.ok(Text.canDraw('B', line), `${language.code} bold: ${line}`);
      }
    }
  }
  Text.setFontPack('B');
});
